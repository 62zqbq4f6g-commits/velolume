/**
 * Category Benchmark Scraper
 *
 * Scrapes top videos for a category, runs full extraction, captures engagement.
 *
 * Usage:
 *   npx tsx scripts/scrape-category-benchmark.ts fashion 100
 *   npx tsx scripts/scrape-category-benchmark.ts beauty 50
 *
 * Outputs to: /data/benchmarks/{category}/
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { execSync } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";
import { toFile } from "openai";

// Set paths
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
const YTDLP_PATH = "/opt/homebrew/bin/yt-dlp";
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import {
  searchByHashtags,
  scrapeWithEngagement,
  VideoInfo,
  EngagementMetrics,
  isEngagementScraperReady,
} from "../lib/scraper/engagement-scraper";

import {
  extractHook,
  HookExtractionInput,
  HookAnalysis,
  HookType,
} from "../lib/extraction/hook-extractor";

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

interface CategoryConfig {
  name: string;
  hashtags: string[];
  description: string;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  fashion: {
    name: "Fashion",
    hashtags: ["fashion", "ootd", "outfit", "style", "fashiontiktok", "outfitinspo", "streetstyle"],
    description: "Fashion, outfits, and style content",
  },
  beauty: {
    name: "Beauty",
    hashtags: ["beauty", "skincare", "makeup", "grwm", "beautytiktok", "makeuptutorial", "skincareroutine"],
    description: "Beauty, skincare, and makeup content",
  },
  tech: {
    name: "Tech",
    hashtags: ["tech", "gadgets", "unboxing", "techreview", "techtok", "gadgetreview", "techgadgets"],
    description: "Technology, gadgets, and reviews",
  },
  business: {
    name: "Business",
    hashtags: ["business", "entrepreneur", "startup", "marketing", "sidehustle", "smallbusiness", "moneytok"],
    description: "Business, entrepreneurship, and marketing",
  },
  fitness: {
    name: "Fitness",
    hashtags: ["fitness", "workout", "gym", "fitnessmotivation", "gymtok", "workoutroutine"],
    description: "Fitness and workout content",
  },
  food: {
    name: "Food",
    hashtags: ["food", "recipe", "cooking", "foodtiktok", "easyrecipe", "foodie"],
    description: "Food, cooking, and recipes",
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface BenchmarkVideo {
  // Video info
  videoId: string;
  url: string;
  platform: string;
  category: string;

  // Content metadata
  title: string;
  description: string;
  author: string;
  authorFollowers?: number;
  duration: number;
  hashtags: string[];

  // Engagement metrics
  engagement: EngagementMetrics;

  // Hook analysis
  hookType: HookType;
  hookConfidence: number;
  hookEffectiveness: number;
  hookBreakdown: {
    clarity: number;
    patternInterrupt: number;
    speedToValue: number;
    alignment: number;
  };

  // Product detection
  productCount: number;
  products: {
    name: string;
    category: string;
    confidence: number;
  }[];

  // Transcript
  transcript?: string;
  transcriptLanguage?: string;

  // Processing metadata
  processedAt: Date;
  processingTimeMs: number;
}

interface BenchmarkSummary {
  category: string;
  totalVideos: number;
  successfulVideos: number;
  scrapedAt: Date;

  // Engagement stats
  engagement: {
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    avgEngagementRate: number;
    totalViews: number;
  };

  // Hook distribution
  hookTypes: Record<HookType, number>;
  avgHookEffectiveness: number;
  hookEffectivenessRange: { min: number; max: number };

  // Top performing hooks
  topHooks: {
    hookType: HookType;
    avgEngagementRate: number;
    count: number;
  }[];

  // Products
  avgProductsPerVideo: number;
  topProductCategories: { category: string; count: number }[];
}

// =============================================================================
// EXTRACTION HELPERS
// =============================================================================

const TMP_DIR = join(process.cwd(), "tmp", "benchmark");

function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR, { recursive: true });
  }
}

function cleanup(dir: string) {
  if (existsSync(dir)) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        unlinkSync(join(dir, file));
      }
    } catch {}
  }
}

function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
}

async function extractFramesLocal(
  videoPath: string,
  outputDir: string,
  maxFrames = 20
): Promise<{ frames: Buffer[]; timestamps: number[]; duration: number }> {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const duration = await getVideoDuration(videoPath);
  const fps = Math.min(2, maxFrames / duration);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-vf fps=${fps}`, "-q:v 2", `-frames:v ${maxFrames}`])
      .output(join(outputDir, "frame-%03d.jpg"))
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  const files = readdirSync(outputDir)
    .filter((f) => f.endsWith(".jpg"))
    .sort();
  const frames: Buffer[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < files.length; i++) {
    frames.push(readFileSync(join(outputDir, files[i])));
    timestamps.push((i / (files.length - 1 || 1)) * duration);
  }

  return { frames, timestamps, duration };
}

async function extractAudioLocal(
  videoPath: string,
  outputPath: string
): Promise<Buffer> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(["-vn", "-acodec libmp3lame", "-ab 128k", "-ar 16000"])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  return readFileSync(outputPath);
}

async function transcribeAudio(
  audioBuffer: Buffer
): Promise<{ text: string; language: string; segments: any[] }> {
  const audioFile = await toFile(audioBuffer, "audio.mp3", {
    type: "audio/mpeg",
  });

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  return {
    text: response.text,
    language: response.language || "unknown",
    segments: (response.segments || []).map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    })),
  };
}

async function detectProducts(
  frames: Buffer[],
  transcript: string
): Promise<any[]> {
  const frameCount = Math.min(frames.length, 6);
  const selectedFrames = frames
    .filter((_, i) => i % Math.ceil(frames.length / frameCount) === 0)
    .slice(0, frameCount);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Identify ALL visible products. Respond with JSON only:
{"products": [{"name": "Product name", "category": "Category", "confidence": 0.95}]}`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Identify products in these frames. Transcript: "${transcript.substring(0, 300)}"`,
          },
          ...selectedFrames.map((frame) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString("base64")}`,
              detail: "low" as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return parsed.products || [];
  } catch {
    return [];
  }
}

// =============================================================================
// MAIN PROCESSING
// =============================================================================

async function processVideo(
  videoInfo: VideoInfo,
  category: string
): Promise<BenchmarkVideo | null> {
  const startTime = Date.now();
  const videoDir = join(TMP_DIR, videoInfo.videoId);
  const videoPath = join(videoDir, "video.mp4");
  const framesDir = join(videoDir, "frames");
  const audioPath = join(videoDir, "audio.mp3");

  try {
    if (!existsSync(videoDir)) {
      mkdirSync(videoDir, { recursive: true });
    }

    // Download video
    await new Promise<void>((resolve, reject) => {
      const proc = require("child_process").spawn(YTDLP_PATH, [
        "-f",
        "best[ext=mp4]/best",
        "--no-playlist",
        "-o",
        videoPath,
        "--no-warnings",
        videoInfo.url,
      ]);

      proc.on("close", (code: number) => {
        if (code === 0 && existsSync(videoPath)) resolve();
        else reject(new Error("Download failed"));
      });
      proc.on("error", reject);
    });

    // Extract frames
    const { frames, timestamps, duration } = await extractFramesLocal(
      videoPath,
      framesDir
    );

    // Extract and transcribe audio
    let transcript = "";
    let transcriptLanguage = "unknown";
    let transcriptSegments: any[] = [];

    try {
      const audioBuffer = await extractAudioLocal(videoPath, audioPath);
      const transcription = await transcribeAudio(audioBuffer);
      transcript = transcription.text;
      transcriptLanguage = transcription.language;
      transcriptSegments = transcription.segments;
    } catch {}

    // Detect products
    const products = await detectProducts(frames, transcript);

    // Extract hook
    const hookInput: HookExtractionInput = {
      videoDuration: duration,
      frames,
      frameTimestamps: timestamps,
      transcript,
      transcriptSegments,
      contentId: videoInfo.videoId,
    };

    const hookAnalysis = await extractHook(hookInput);

    return {
      videoId: videoInfo.videoId,
      url: videoInfo.url,
      platform: videoInfo.platform,
      category,

      title: videoInfo.title,
      description: videoInfo.description,
      author: videoInfo.author.username,
      authorFollowers: videoInfo.author.followers,
      duration,
      hashtags: videoInfo.hashtags,

      engagement: videoInfo.engagement,

      hookType: hookAnalysis.hookType.value,
      hookConfidence: hookAnalysis.hookType.confidence,
      hookEffectiveness: hookAnalysis.effectivenessScore.value,
      hookBreakdown: {
        clarity: hookAnalysis.effectivenessBreakdown.clarityOfPromise,
        patternInterrupt: hookAnalysis.effectivenessBreakdown.patternInterrupt,
        speedToValue: hookAnalysis.effectivenessBreakdown.speedToValue,
        alignment: hookAnalysis.effectivenessBreakdown.contentAlignment,
      },

      productCount: products.length,
      products: products.map((p: any) => ({
        name: p.name,
        category: p.category,
        confidence: p.confidence,
      })),

      transcript,
      transcriptLanguage,

      processedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`   Error processing ${videoInfo.videoId}:`, error);
    return null;
  } finally {
    cleanup(framesDir);
    if (existsSync(videoPath)) unlinkSync(videoPath);
    if (existsSync(audioPath)) unlinkSync(audioPath);
  }
}

function generateSummary(
  videos: BenchmarkVideo[],
  category: string
): BenchmarkSummary {
  // Engagement stats
  const totalViews = videos.reduce((s, v) => s + v.engagement.views, 0);
  const avgViews = totalViews / videos.length;
  const avgLikes =
    videos.reduce((s, v) => s + v.engagement.likes, 0) / videos.length;
  const avgComments =
    videos.reduce((s, v) => s + v.engagement.comments, 0) / videos.length;
  const avgShares =
    videos.reduce((s, v) => s + v.engagement.shares, 0) / videos.length;
  const avgEngagementRate =
    videos.reduce((s, v) => s + v.engagement.engagementRate, 0) / videos.length;

  // Hook distribution
  const hookTypes: Record<HookType, number> = {
    question: 0,
    statement: 0,
    pov: 0,
    controversy: 0,
    teaser: 0,
    listicle: 0,
    problem: 0,
    visual_hook: 0,
    trend_sound: 0,
    story: 0,
    result_first: 0,
    direct_value: 0,
    unknown: 0,
  };

  for (const v of videos) {
    hookTypes[v.hookType]++;
  }

  const effScores = videos.map((v) => v.hookEffectiveness);
  const avgHookEffectiveness =
    effScores.reduce((a, b) => a + b, 0) / effScores.length;

  // Top performing hooks by engagement
  const hookEngagement: Record<
    HookType,
    { totalEngagement: number; count: number }
  > = {} as any;

  for (const v of videos) {
    if (!hookEngagement[v.hookType]) {
      hookEngagement[v.hookType] = { totalEngagement: 0, count: 0 };
    }
    hookEngagement[v.hookType].totalEngagement += v.engagement.engagementRate;
    hookEngagement[v.hookType].count++;
  }

  const topHooks = Object.entries(hookEngagement)
    .filter(([_, data]) => data.count > 0)
    .map(([hookType, data]) => ({
      hookType: hookType as HookType,
      avgEngagementRate: data.totalEngagement / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

  // Products
  const avgProductsPerVideo =
    videos.reduce((s, v) => s + v.productCount, 0) / videos.length;

  const productCategories: Record<string, number> = {};
  for (const v of videos) {
    for (const p of v.products) {
      productCategories[p.category] = (productCategories[p.category] || 0) + 1;
    }
  }

  const topProductCategories = Object.entries(productCategories)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    category,
    totalVideos: videos.length,
    successfulVideos: videos.length,
    scrapedAt: new Date(),

    engagement: {
      avgViews,
      avgLikes,
      avgComments,
      avgShares,
      avgEngagementRate,
      totalViews,
    },

    hookTypes,
    avgHookEffectiveness,
    hookEffectivenessRange: {
      min: Math.min(...effScores),
      max: Math.max(...effScores),
    },

    topHooks,

    avgProductsPerVideo,
    topProductCategories,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: npx tsx scripts/scrape-category-benchmark.ts <category> [count]");
    console.log("\nAvailable categories:");
    for (const [key, config] of Object.entries(CATEGORIES)) {
      console.log(`  ${key.padEnd(12)} - ${config.description}`);
    }
    process.exit(1);
  }

  const categoryKey = args[0].toLowerCase();
  const count = parseInt(args[1]) || 100;

  if (!CATEGORIES[categoryKey]) {
    console.error(`Unknown category: ${categoryKey}`);
    console.log("Available:", Object.keys(CATEGORIES).join(", "));
    process.exit(1);
  }

  const category = CATEGORIES[categoryKey];

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║   CATEGORY BENCHMARK: ${category.name.toUpperCase().padEnd(36)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nHashtags: ${category.hashtags.join(", ")}`);
  console.log(`Target: ${count} videos\n`);

  // Check prerequisites
  if (!isEngagementScraperReady()) {
    console.error("❌ yt-dlp not available");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    process.exit(1);
  }

  ensureTmpDir();

  // Create output directory
  const outputDir = join(process.cwd(), "data", "benchmarks", categoryKey);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Step 1: Search for videos
  console.log("📥 Step 1: Searching for videos...\n");

  const videosPerHashtag = Math.ceil(count / category.hashtags.length);
  const searchResults = await searchByHashtags(
    category.hashtags,
    "tiktok",
    videosPerHashtag
  );

  console.log(`   Found ${searchResults.length} unique videos\n`);

  // Limit to requested count
  const videosToProcess = searchResults.slice(0, count);

  // Step 2: Process each video
  console.log(`📦 Step 2: Processing ${videosToProcess.length} videos...\n`);

  const results: BenchmarkVideo[] = [];
  let processed = 0;
  let failed = 0;

  for (const videoInfo of videosToProcess) {
    processed++;
    console.log(`[${processed}/${videosToProcess.length}] ${videoInfo.videoId}`);
    console.log(`   Views: ${videoInfo.engagement.views.toLocaleString()}`);

    const result = await processVideo(videoInfo, categoryKey);

    if (result) {
      results.push(result);
      console.log(`   ✅ Hook: ${result.hookType} (${result.hookEffectiveness}/100)`);
      console.log(`   ✅ Products: ${result.productCount}`);
    } else {
      failed++;
      console.log(`   ❌ Failed`);
    }

    // Save intermediate results
    if (processed % 10 === 0) {
      writeFileSync(
        join(outputDir, "videos.json"),
        JSON.stringify(results, null, 2)
      );
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Step 3: Generate summary
  console.log("\n📊 Step 3: Generating summary...\n");

  const summary = generateSummary(results, categoryKey);

  // Save results
  writeFileSync(join(outputDir, "videos.json"), JSON.stringify(results, null, 2));
  writeFileSync(join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));

  // Print summary
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    BENCHMARK SUMMARY                         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  console.log(`\n📊 VIDEOS`);
  console.log(`   Processed: ${results.length}/${videosToProcess.length}`);
  console.log(`   Failed: ${failed}`);

  console.log(`\n📈 ENGAGEMENT`);
  console.log(`   Avg Views: ${Math.round(summary.engagement.avgViews).toLocaleString()}`);
  console.log(`   Avg Likes: ${Math.round(summary.engagement.avgLikes).toLocaleString()}`);
  console.log(`   Avg Comments: ${Math.round(summary.engagement.avgComments).toLocaleString()}`);
  console.log(`   Avg Engagement Rate: ${summary.engagement.avgEngagementRate.toFixed(2)}%`);

  console.log(`\n🪝 HOOK TYPES`);
  const sortedHooks = Object.entries(summary.hookTypes)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [hookType, count] of sortedHooks) {
    const pct = ((count / results.length) * 100).toFixed(0);
    console.log(`   ${hookType.padEnd(15)} ${count} (${pct}%)`);
  }

  console.log(`\n   Avg Effectiveness: ${summary.avgHookEffectiveness.toFixed(0)}/100`);

  console.log(`\n🏆 TOP HOOKS BY ENGAGEMENT`);
  for (const hook of summary.topHooks.slice(0, 5)) {
    console.log(`   ${hook.hookType.padEnd(15)} ${hook.avgEngagementRate.toFixed(2)}% (n=${hook.count})`);
  }

  console.log(`\n📦 PRODUCTS`);
  console.log(`   Avg per video: ${summary.avgProductsPerVideo.toFixed(1)}`);
  console.log(`   Top categories:`);
  for (const cat of summary.topProductCategories.slice(0, 5)) {
    console.log(`      ${cat.category}: ${cat.count}`);
  }

  console.log(`\n📁 Results saved to: ${outputDir}`);
}

main().catch(console.error);
