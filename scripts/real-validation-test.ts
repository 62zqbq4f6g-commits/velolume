/**
 * REAL VALIDATION TEST
 *
 * Tests full extraction pipeline on 11 real videos from:
 * - Instagram (4 videos)
 * - TikTok (4 videos)
 * - YouTube (3 videos)
 *
 * For each video:
 * 1. Download/scrape the video
 * 2. Extract frames (especially first 3-5 seconds for hook)
 * 3. Extract audio → transcript
 * 4. Run product extraction
 * 5. Run hook extraction
 *
 * Usage: npx tsx scripts/real-validation-test.ts
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';

// Set ffmpeg paths
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

import { scrapeAndUpload, ScraperResult } from '../lib/scraper/video-scraper';
import { extractFrames, extractAudio, ExtractedFrames } from '../lib/video/frame-extractor';
import { transcribeAudio, TranscriptionResult } from '../lib/ai/transcription';
import { processVideo, ProcessedVideoData, isProcessorReady } from '../lib/ai/processor';
import {
  extractHook,
  HookAnalysis,
  HookExtractionInput,
  isHookExtractorReady,
  getHookWindow,
} from '../lib/extraction/hook-extractor';

// =============================================================================
// TEST VIDEOS
// =============================================================================

interface TestVideo {
  id: string;
  url: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  description: string;
}

const TEST_VIDEOS: TestVideo[] = [
  // Instagram Reels (4)
  {
    id: "ig-1",
    url: "https://www.instagram.com/reel/DTLPmlajSQ5/",
    platform: "instagram",
    description: "Instagram Reel 1",
  },
  {
    id: "ig-2",
    url: "https://www.instagram.com/reel/DSH_WXWEcu7/",
    platform: "instagram",
    description: "Instagram Reel 2",
  },
  {
    id: "ig-3",
    url: "https://www.instagram.com/reel/DTGGtYhCCD1/",
    platform: "instagram",
    description: "Instagram Reel 3",
  },
  {
    id: "ig-4",
    url: "https://www.instagram.com/reel/DRTUc6akezF/",
    platform: "instagram",
    description: "Instagram Reel 4",
  },
  // TikTok (4)
  {
    id: "tt-1",
    url: "https://vt.tiktok.com/ZS5HWJKMq/",
    platform: "tiktok",
    description: "TikTok Video 1",
  },
  {
    id: "tt-2",
    url: "https://vt.tiktok.com/ZS5HnvAsf/",
    platform: "tiktok",
    description: "TikTok Video 2",
  },
  {
    id: "tt-3",
    url: "https://vt.tiktok.com/ZS5HWd8fa/",
    platform: "tiktok",
    description: "TikTok Video 3",
  },
  {
    id: "tt-4",
    url: "https://vt.tiktok.com/ZS5HW2Lyv/",
    platform: "tiktok",
    description: "TikTok Video 4",
  },
  // YouTube (3)
  {
    id: "yt-1",
    url: "https://youtu.be/mzR4804FxFU",
    platform: "youtube",
    description: "YouTube Video 1",
  },
  {
    id: "yt-2",
    url: "https://youtu.be/ThchMj9hMvE",
    platform: "youtube",
    description: "YouTube Video 2",
  },
  {
    id: "yt-3",
    url: "https://youtu.be/PC3tUZ1qGws",
    platform: "youtube",
    description: "YouTube Video 3",
  },
];

// =============================================================================
// RESULT TYPES
// =============================================================================

interface VideoValidationResult {
  id: string;
  url: string;
  platform: string;

  // Scraping
  scrapeSuccess: boolean;
  scrapeError?: string;
  s3Key?: string;
  videoSize?: number;

  // Frame Extraction
  frameSuccess: boolean;
  frameError?: string;
  frameCount?: number;
  videoDuration?: number;

  // Transcription
  transcriptSuccess: boolean;
  transcriptError?: string;
  transcriptText?: string;
  transcriptLanguage?: string;

  // Product Extraction
  productSuccess: boolean;
  productError?: string;
  products?: {
    name: string;
    category: string;
    confidence: number;
    identifiability: string;
  }[];
  productCount?: number;

  // Hook Extraction
  hookSuccess: boolean;
  hookError?: string;
  hookType?: string;
  hookConfidence?: number;
  hookEffectiveness?: number;
  hookBreakdown?: {
    clarity: number;
    patternInterrupt: number;
    speedToValue: number;
    alignment: number;
  };

  // Timing
  totalTimeMs?: number;
  scrapeTimeMs?: number;
  extractTimeMs?: number;
  productTimeMs?: number;
  hookTimeMs?: number;
}

// =============================================================================
// VALIDATION PIPELINE
// =============================================================================

async function validateVideo(video: TestVideo): Promise<VideoValidationResult> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Processing: ${video.id} (${video.platform})`);
  console.log(`URL: ${video.url}`);
  console.log(`${"=".repeat(60)}`);

  const result: VideoValidationResult = {
    id: video.id,
    url: video.url,
    platform: video.platform,
    scrapeSuccess: false,
    frameSuccess: false,
    transcriptSuccess: false,
    productSuccess: false,
    hookSuccess: false,
  };

  const totalStart = Date.now();

  // Step 1: Scrape and upload to S3
  console.log("\n📥 Step 1: Scraping video...");
  const scrapeStart = Date.now();

  try {
    const scrapeResult = await scrapeAndUpload(video.url);
    result.scrapeTimeMs = Date.now() - scrapeStart;

    if (scrapeResult.success) {
      result.scrapeSuccess = true;
      result.s3Key = scrapeResult.key;
      result.videoSize = scrapeResult.size;
      console.log(`   ✅ Scraped: ${scrapeResult.key} (${(scrapeResult.size! / 1024 / 1024).toFixed(2)}MB)`);
    } else {
      result.scrapeError = scrapeResult.error;
      console.log(`   ❌ Scrape failed: ${scrapeResult.error}`);
      result.totalTimeMs = Date.now() - totalStart;
      return result;
    }
  } catch (error) {
    result.scrapeTimeMs = Date.now() - scrapeStart;
    result.scrapeError = String(error);
    console.log(`   ❌ Scrape error: ${error}`);
    result.totalTimeMs = Date.now() - totalStart;
    return result;
  }

  // Step 2: Extract frames and audio
  console.log("\n🎬 Step 2: Extracting frames and audio...");
  const extractStart = Date.now();

  let frames: Buffer[] = [];
  let frameTimestamps: number[] = [];
  let audioBuffer: Buffer | null = null;
  let transcription: TranscriptionResult | null = null;
  let videoDuration = 0;

  try {
    // Extract frames with more frequent sampling for hook analysis
    const frameResult = await extractFrames(result.s3Key!, {
      interval: 0.5, // Every 0.5 seconds
      maxFrames: 30, // More frames for hook analysis
    });

    result.frameSuccess = true;
    result.frameCount = frameResult.frameCount;
    result.videoDuration = frameResult.duration;
    videoDuration = frameResult.duration;
    frames = frameResult.frames;

    // Calculate timestamps
    if (frames.length > 0) {
      const interval = videoDuration / (frames.length - 1 || 1);
      frameTimestamps = frames.map((_, i) => Math.round(i * interval * 100) / 100);
    }

    console.log(`   ✅ Extracted ${frames.length} frames (duration: ${videoDuration.toFixed(1)}s)`);
  } catch (error) {
    result.frameError = String(error);
    console.log(`   ❌ Frame extraction error: ${error}`);
  }

  // Extract audio for transcription
  try {
    audioBuffer = await extractAudio(result.s3Key!);
    console.log(`   ✅ Extracted audio (${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
  } catch (error) {
    console.log(`   ⚠️ Audio extraction error: ${error}`);
  }

  result.extractTimeMs = Date.now() - extractStart;

  // Step 3: Transcribe audio
  if (audioBuffer) {
    console.log("\n🎤 Step 3: Transcribing audio...");
    try {
      transcription = await transcribeAudio(audioBuffer);
      result.transcriptSuccess = true;
      result.transcriptText = transcription.text;
      result.transcriptLanguage = transcription.language;
      console.log(`   ✅ Transcribed: "${transcription.text.substring(0, 100)}..."`);
      console.log(`   Language: ${transcription.language}`);
    } catch (error) {
      result.transcriptError = String(error);
      console.log(`   ❌ Transcription error: ${error}`);
    }
  } else {
    result.transcriptError = "No audio extracted";
    console.log("\n🎤 Step 3: Skipping transcription (no audio)");
  }

  // Step 4: Product extraction
  console.log("\n📦 Step 4: Running product extraction...");
  const productStart = Date.now();

  try {
    const processed = await processVideo(result.s3Key!, { maxFrames: 12 });
    result.productTimeMs = Date.now() - productStart;

    result.productSuccess = true;
    result.productCount = processed.products.length;
    result.products = processed.products.map(p => ({
      name: p.name,
      category: p.category,
      confidence: p.confidence,
      identifiability: p.identifiability,
    }));

    console.log(`   ✅ Detected ${processed.products.length} products:`);
    for (const product of processed.products.slice(0, 5)) {
      console.log(`      - ${product.name} (${product.category}, ${Math.round(product.confidence * 100)}%)`);
    }
    if (processed.products.length > 5) {
      console.log(`      ... and ${processed.products.length - 5} more`);
    }
  } catch (error) {
    result.productTimeMs = Date.now() - productStart;
    result.productError = String(error);
    console.log(`   ❌ Product extraction error: ${error}`);
  }

  // Step 5: Hook extraction
  if (frames.length > 0) {
    console.log("\n🪝 Step 5: Running hook extraction...");
    const hookStart = Date.now();

    try {
      const hookInput: HookExtractionInput = {
        videoDuration,
        frames,
        frameTimestamps,
        transcript: transcription?.text,
        transcriptSegments: transcription?.segments,
        contentId: video.id,
      };

      const hookAnalysis = await extractHook(hookInput);
      result.hookTimeMs = Date.now() - hookStart;

      result.hookSuccess = true;
      result.hookType = hookAnalysis.hookType.value;
      result.hookConfidence = hookAnalysis.hookType.confidence;
      result.hookEffectiveness = hookAnalysis.effectivenessScore.value;
      result.hookBreakdown = {
        clarity: hookAnalysis.effectivenessBreakdown.clarityOfPromise,
        patternInterrupt: hookAnalysis.effectivenessBreakdown.patternInterrupt,
        speedToValue: hookAnalysis.effectivenessBreakdown.speedToValue,
        alignment: hookAnalysis.effectivenessBreakdown.contentAlignment,
      };

      console.log(`   ✅ Hook type: ${hookAnalysis.hookType.value} (${hookAnalysis.hookType.confidence}%)`);
      console.log(`   ✅ Effectiveness: ${hookAnalysis.effectivenessScore.value}/100`);
      console.log(`      Clarity: ${hookAnalysis.effectivenessBreakdown.clarityOfPromise}/25`);
      console.log(`      Pattern Interrupt: ${hookAnalysis.effectivenessBreakdown.patternInterrupt}/25`);
      console.log(`      Speed to Value: ${hookAnalysis.effectivenessBreakdown.speedToValue}/25`);
      console.log(`      Content Alignment: ${hookAnalysis.effectivenessBreakdown.contentAlignment}/25`);
    } catch (error) {
      result.hookTimeMs = Date.now() - hookStart;
      result.hookError = String(error);
      console.log(`   ❌ Hook extraction error: ${error}`);
    }
  } else {
    result.hookError = "No frames available";
    console.log("\n🪝 Step 5: Skipping hook extraction (no frames)");
  }

  result.totalTimeMs = Date.now() - totalStart;

  return result;
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateReport(results: VideoValidationResult[]): void {
  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║              REAL VALIDATION TEST REPORT                           ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  // Summary
  const total = results.length;
  const scrapeSuccess = results.filter(r => r.scrapeSuccess).length;
  const frameSuccess = results.filter(r => r.frameSuccess).length;
  const transcriptSuccess = results.filter(r => r.transcriptSuccess).length;
  const productSuccess = results.filter(r => r.productSuccess).length;
  const hookSuccess = results.filter(r => r.hookSuccess).length;

  console.log("\n📊 OVERALL SUCCESS RATES\n");
  console.log(`  Scraping:      ${scrapeSuccess}/${total} (${((scrapeSuccess/total)*100).toFixed(0)}%)`);
  console.log(`  Frames:        ${frameSuccess}/${total} (${((frameSuccess/total)*100).toFixed(0)}%)`);
  console.log(`  Transcription: ${transcriptSuccess}/${total} (${((transcriptSuccess/total)*100).toFixed(0)}%)`);
  console.log(`  Products:      ${productSuccess}/${total} (${((productSuccess/total)*100).toFixed(0)}%)`);
  console.log(`  Hooks:         ${hookSuccess}/${total} (${((hookSuccess/total)*100).toFixed(0)}%)`);

  // By Platform
  console.log("\n📱 BY PLATFORM\n");
  const platforms = ['instagram', 'tiktok', 'youtube'];
  for (const platform of platforms) {
    const platformResults = results.filter(r => r.platform === platform);
    const platformSuccess = platformResults.filter(r => r.productSuccess && r.hookSuccess).length;
    console.log(`  ${platform.padEnd(12)} ${platformSuccess}/${platformResults.length} fully successful`);
  }

  // Product Detection Summary
  console.log("\n📦 PRODUCT DETECTION\n");
  const productsResults = results.filter(r => r.productSuccess);
  if (productsResults.length > 0) {
    const totalProducts = productsResults.reduce((sum, r) => sum + (r.productCount || 0), 0);
    const avgProducts = totalProducts / productsResults.length;
    console.log(`  Total products detected: ${totalProducts}`);
    console.log(`  Average per video: ${avgProducts.toFixed(1)}`);

    // Products by video
    console.log("\n  By video:");
    for (const r of productsResults) {
      console.log(`    ${r.id}: ${r.productCount} products`);
      if (r.products && r.products.length > 0) {
        for (const p of r.products.slice(0, 3)) {
          console.log(`      - ${p.name} (${Math.round(p.confidence * 100)}%)`);
        }
        if (r.products.length > 3) {
          console.log(`      ... +${r.products.length - 3} more`);
        }
      }
    }
  }

  // Hook Analysis Summary
  console.log("\n🪝 HOOK ANALYSIS\n");
  const hookResults = results.filter(r => r.hookSuccess);
  if (hookResults.length > 0) {
    // Hook type distribution
    const hookTypes: Record<string, number> = {};
    for (const r of hookResults) {
      const type = r.hookType || "unknown";
      hookTypes[type] = (hookTypes[type] || 0) + 1;
    }

    console.log("  Hook type distribution:");
    for (const [type, count] of Object.entries(hookTypes).sort((a, b) => b[1] - a[1])) {
      const bar = "█".repeat(count * 3);
      console.log(`    ${type.padEnd(15)} ${bar} ${count}`);
    }

    // Effectiveness scores
    const effScores = hookResults.map(r => r.hookEffectiveness || 0);
    const avgEff = effScores.reduce((a, b) => a + b, 0) / effScores.length;
    const minEff = Math.min(...effScores);
    const maxEff = Math.max(...effScores);

    console.log("\n  Effectiveness scores:");
    console.log(`    Average: ${avgEff.toFixed(0)}/100`);
    console.log(`    Range: ${minEff} - ${maxEff}`);

    // Per video hook details
    console.log("\n  By video:");
    for (const r of hookResults) {
      console.log(`    ${r.id}: ${r.hookType} (${r.hookEffectiveness}/100)`);
    }
  }

  // Errors
  const errors = results.filter(r =>
    r.scrapeError || r.frameError || r.transcriptError || r.productError || r.hookError
  );

  if (errors.length > 0) {
    console.log("\n❌ ERRORS\n");
    for (const r of errors) {
      console.log(`  ${r.id} (${r.platform}):`);
      if (r.scrapeError) console.log(`    Scrape: ${r.scrapeError}`);
      if (r.frameError) console.log(`    Frames: ${r.frameError}`);
      if (r.transcriptError) console.log(`    Transcript: ${r.transcriptError}`);
      if (r.productError) console.log(`    Products: ${r.productError}`);
      if (r.hookError) console.log(`    Hook: ${r.hookError}`);
    }
  }

  // Timing
  console.log("\n⏱️ TIMING\n");
  const successfulResults = results.filter(r => r.totalTimeMs);
  if (successfulResults.length > 0) {
    const avgTime = successfulResults.reduce((sum, r) => sum + (r.totalTimeMs || 0), 0) / successfulResults.length;
    console.log(`  Average total time: ${(avgTime / 1000).toFixed(1)}s`);

    const avgScrape = successfulResults.filter(r => r.scrapeTimeMs).reduce((sum, r) => sum + (r.scrapeTimeMs || 0), 0) / successfulResults.length;
    const avgExtract = successfulResults.filter(r => r.extractTimeMs).reduce((sum, r) => sum + (r.extractTimeMs || 0), 0) / successfulResults.length;
    const avgProduct = successfulResults.filter(r => r.productTimeMs).reduce((sum, r) => sum + (r.productTimeMs || 0), 0) / successfulResults.length;
    const avgHook = successfulResults.filter(r => r.hookTimeMs).reduce((sum, r) => sum + (r.hookTimeMs || 0), 0) / successfulResults.length;

    console.log(`  Average scraping: ${(avgScrape / 1000).toFixed(1)}s`);
    console.log(`  Average extraction: ${(avgExtract / 1000).toFixed(1)}s`);
    console.log(`  Average product analysis: ${(avgProduct / 1000).toFixed(1)}s`);
    console.log(`  Average hook analysis: ${(avgHook / 1000).toFixed(1)}s`);
  }

  console.log("\n" + "═".repeat(70) + "\n");
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║         REAL VALIDATION TEST - 11 VIDEOS                           ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");
  console.log(`\nStarted: ${new Date().toISOString()}`);

  // Check prerequisites
  console.log("\n🔧 Checking prerequisites...\n");

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    process.exit(1);
  }
  console.log("  ✅ OpenAI API key configured");

  if (!process.env.SPACES_ACCESS_ID || !process.env.SPACES_SECRET_KEY) {
    console.error("❌ DigitalOcean Spaces credentials not set");
    process.exit(1);
  }
  console.log("  ✅ DigitalOcean Spaces configured");

  if (!isProcessorReady()) {
    console.error("❌ Processor not ready");
    process.exit(1);
  }
  console.log("  ✅ Product processor ready");

  if (!isHookExtractorReady()) {
    console.error("❌ Hook extractor not ready");
    process.exit(1);
  }
  console.log("  ✅ Hook extractor ready");

  // Check FFmpeg
  try {
    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) reject(err);
        else resolve(formats);
      });
    });
    console.log("  ✅ FFmpeg available");
  } catch {
    console.error("❌ FFmpeg not available");
    process.exit(1);
  }

  console.log(`\n📹 Processing ${TEST_VIDEOS.length} videos...\n`);

  // Process all videos
  const results: VideoValidationResult[] = [];

  for (let i = 0; i < TEST_VIDEOS.length; i++) {
    const video = TEST_VIDEOS[i];
    console.log(`\n[${i + 1}/${TEST_VIDEOS.length}] Processing ${video.id}...`);

    try {
      const result = await validateVideo(video);
      results.push(result);

      // Save intermediate results
      const outputPath = join(process.cwd(), "real-validation-results.json");
      writeFileSync(outputPath, JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(`Fatal error processing ${video.id}:`, error);
      results.push({
        id: video.id,
        url: video.url,
        platform: video.platform,
        scrapeSuccess: false,
        frameSuccess: false,
        transcriptSuccess: false,
        productSuccess: false,
        hookSuccess: false,
        scrapeError: String(error),
      });
    }

    // Rate limiting between videos
    if (i < TEST_VIDEOS.length - 1) {
      console.log("\n⏳ Waiting 2s before next video...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Generate report
  generateReport(results);

  // Save final results
  const outputPath = join(process.cwd(), "real-validation-results.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Full results saved to: ${outputPath}`);

  console.log(`\nCompleted: ${new Date().toISOString()}`);
}

main().catch(console.error);
