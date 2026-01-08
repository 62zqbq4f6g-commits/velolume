/**
 * REAL VALIDATION TEST v2 - Using yt-dlp
 *
 * Uses yt-dlp for reliable video download from all platforms.
 *
 * For each video:
 * 1. Download video using yt-dlp (local file)
 * 2. Extract frames with FFmpeg
 * 3. Extract audio → transcript
 * 4. Run product extraction (with local frames)
 * 5. Run hook extraction
 *
 * Usage: npx tsx scripts/real-validation-ytdlp.ts
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync, spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from 'openai';
import { toFile } from 'openai';

// Set paths
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
const YTDLP_PATH = "/opt/homebrew/bin/yt-dlp";
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import {
  extractHook,
  HookExtractionInput,
  isHookExtractorReady,
} from '../lib/extraction/hook-extractor';

// =============================================================================
// TEST VIDEOS
// =============================================================================

interface TestVideo {
  id: string;
  url: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
}

const TEST_VIDEOS: TestVideo[] = [
  { id: "ig-1", url: "https://www.instagram.com/reel/DTLPmlajSQ5/", platform: "instagram" },
  { id: "ig-2", url: "https://www.instagram.com/reel/DSH_WXWEcu7/", platform: "instagram" },
  { id: "ig-3", url: "https://www.instagram.com/reel/DTGGtYhCCD1/", platform: "instagram" },
  { id: "ig-4", url: "https://www.instagram.com/reel/DRTUc6akezF/", platform: "instagram" },
  { id: "tt-1", url: "https://vt.tiktok.com/ZS5HWJKMq/", platform: "tiktok" },
  { id: "tt-2", url: "https://vt.tiktok.com/ZS5HnvAsf/", platform: "tiktok" },
  { id: "tt-3", url: "https://vt.tiktok.com/ZS5HWd8fa/", platform: "tiktok" },
  { id: "tt-4", url: "https://vt.tiktok.com/ZS5HW2Lyv/", platform: "tiktok" },
  { id: "yt-1", url: "https://youtu.be/mzR4804FxFU", platform: "youtube" },
  { id: "yt-2", url: "https://youtu.be/ThchMj9hMvE", platform: "youtube" },
  { id: "yt-3", url: "https://youtu.be/PC3tUZ1qGws", platform: "youtube" },
];

const TMP_DIR = join(process.cwd(), 'tmp', 'validation');

// =============================================================================
// HELPERS
// =============================================================================

function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR, { recursive: true });
  }
}

async function downloadWithYtDlp(url: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const args = [
      '-f', 'best[ext=mp4]/best',
      '--no-playlist',
      '-o', outputPath,
      '--no-warnings',
      url
    ];

    const proc = spawn(YTDLP_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && existsSync(outputPath)) {
        resolve(true);
      } else {
        console.log(`   yt-dlp stderr: ${stderr}`);
        resolve(false);
      }
    });

    proc.on('error', () => resolve(false));
  });
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
  maxFrames = 30
): Promise<{ frames: Buffer[]; timestamps: number[]; duration: number }> {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const duration = await getVideoDuration(videoPath);
  const fps = Math.min(2, maxFrames / duration); // At most 2 fps

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${fps}`,
        '-q:v 2',
        `-frames:v ${maxFrames}`,
      ])
      .output(join(outputDir, 'frame-%03d.jpg'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  const files = readdirSync(outputDir).filter(f => f.endsWith('.jpg')).sort();
  const frames: Buffer[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < files.length; i++) {
    frames.push(readFileSync(join(outputDir, files[i])));
    timestamps.push((i / (files.length - 1 || 1)) * duration);
  }

  return { frames, timestamps, duration };
}

async function extractAudioLocal(videoPath: string, outputPath: string): Promise<Buffer> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(['-vn', '-acodec libmp3lame', '-ab 128k', '-ar 16000'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  return readFileSync(outputPath);
}

async function transcribeAudio(audioBuffer: Buffer): Promise<{
  text: string;
  language: string;
  segments: { start: number; end: number; text: string }[];
}> {
  const audioFile = await toFile(audioBuffer, 'audio.mp3', { type: 'audio/mpeg' });

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    prompt: 'E-commerce product video. May include various languages.',
  });

  return {
    text: response.text,
    language: response.language || 'unknown',
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
  const frameCount = Math.min(frames.length, 8);
  const selectedFrames = frames.filter((_, i) =>
    i % Math.ceil(frames.length / frameCount) === 0
  ).slice(0, frameCount);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert product detector for e-commerce. Identify ALL visible products in the video frames.

For EACH product, provide:
- name: Specific descriptive name (not generic)
- category: Clothing|Footwear|Accessories|Jewelry|Beauty|Tech|Home Decor|Other
- confidence: 0.0-1.0
- identifiability: high|medium|low

Respond with JSON only:
{
  "products": [
    {"name": "Product name", "category": "Category", "confidence": 0.95, "identifiability": "high"}
  ]
}`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analyze these ${selectedFrames.length} frames. Transcript: "${transcript.substring(0, 500)}"` },
          ...selectedFrames.map(frame => ({
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString('base64')}`,
              detail: 'high' as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.products || [];
  } catch {
    return [];
  }
}

function cleanup(dir: string) {
  if (existsSync(dir)) {
    const files = readdirSync(dir);
    for (const file of files) {
      try { unlinkSync(join(dir, file)); } catch {}
    }
    try { rmSync(dir, { recursive: true }); } catch {}
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

interface Result {
  id: string;
  platform: string;
  success: boolean;
  downloadSuccess: boolean;
  downloadError?: string;
  duration?: number;
  frameCount?: number;
  transcript?: string;
  products?: any[];
  productCount?: number;
  hookType?: string;
  hookEffectiveness?: number;
  hookBreakdown?: any;
  totalTimeMs?: number;
}

async function validateVideo(video: TestVideo): Promise<Result> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${video.id}] ${video.platform.toUpperCase()}: ${video.url}`);
  console.log("=".repeat(60));

  const result: Result = {
    id: video.id,
    platform: video.platform,
    success: false,
    downloadSuccess: false,
  };

  const startTime = Date.now();
  const videoDir = join(TMP_DIR, video.id);
  const videoPath = join(videoDir, 'video.mp4');
  const framesDir = join(videoDir, 'frames');
  const audioPath = join(videoDir, 'audio.mp3');

  try {
    // Create temp directory
    if (!existsSync(videoDir)) {
      mkdirSync(videoDir, { recursive: true });
    }

    // Step 1: Download
    console.log('\n📥 Downloading with yt-dlp...');
    const downloaded = await downloadWithYtDlp(video.url, videoPath);

    if (!downloaded || !existsSync(videoPath)) {
      result.downloadError = 'yt-dlp download failed';
      console.log('   ❌ Download failed');
      return result;
    }

    result.downloadSuccess = true;
    const fileSize = readFileSync(videoPath).length;
    console.log(`   ✅ Downloaded (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);

    // Step 2: Extract frames
    console.log('\n🎬 Extracting frames...');
    const { frames, timestamps, duration } = await extractFramesLocal(videoPath, framesDir);
    result.duration = duration;
    result.frameCount = frames.length;
    console.log(`   ✅ Extracted ${frames.length} frames (${duration.toFixed(1)}s)`);

    // Step 3: Extract audio and transcribe
    console.log('\n🎤 Transcribing...');
    let transcript = '';
    let transcriptSegments: any[] = [];

    try {
      const audioBuffer = await extractAudioLocal(videoPath, audioPath);
      const transcription = await transcribeAudio(audioBuffer);
      transcript = transcription.text;
      transcriptSegments = transcription.segments;
      result.transcript = transcript;
      console.log(`   ✅ "${transcript.substring(0, 80)}..."`);
    } catch (e) {
      console.log(`   ⚠️ Transcription failed: ${e}`);
    }

    // Step 4: Product detection
    console.log('\n📦 Detecting products...');
    const products = await detectProducts(frames, transcript);
    result.products = products;
    result.productCount = products.length;

    console.log(`   ✅ Found ${products.length} products:`);
    for (const p of products.slice(0, 5)) {
      console.log(`      - ${p.name} (${Math.round(p.confidence * 100)}%)`);
    }
    if (products.length > 5) {
      console.log(`      ... +${products.length - 5} more`);
    }

    // Step 5: Hook extraction
    console.log('\n🪝 Analyzing hook...');
    const hookInput: HookExtractionInput = {
      videoDuration: duration,
      frames,
      frameTimestamps: timestamps,
      transcript,
      transcriptSegments,
      contentId: video.id,
    };

    const hookAnalysis = await extractHook(hookInput);
    result.hookType = hookAnalysis.hookType.value;
    result.hookEffectiveness = hookAnalysis.effectivenessScore.value;
    result.hookBreakdown = hookAnalysis.effectivenessBreakdown;

    console.log(`   ✅ Hook: ${hookAnalysis.hookType.value} (${hookAnalysis.effectivenessScore.value}/100)`);
    console.log(`      Clarity: ${hookAnalysis.effectivenessBreakdown.clarityOfPromise}/25`);
    console.log(`      Pattern Interrupt: ${hookAnalysis.effectivenessBreakdown.patternInterrupt}/25`);
    console.log(`      Speed to Value: ${hookAnalysis.effectivenessBreakdown.speedToValue}/25`);
    console.log(`      Alignment: ${hookAnalysis.effectivenessBreakdown.contentAlignment}/25`);

    result.success = true;

  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
    result.downloadError = String(error);
  } finally {
    // Cleanup
    cleanup(videoDir);
  }

  result.totalTimeMs = Date.now() - startTime;
  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     REAL VALIDATION TEST v2 (yt-dlp) - 11 VIDEOS             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  ensureTmpDir();

  // Check yt-dlp
  try {
    execSync(`${YTDLP_PATH} --version`, { stdio: 'pipe' });
    console.log('✅ yt-dlp available');
  } catch {
    console.error('❌ yt-dlp not available');
    process.exit(1);
  }

  if (!isHookExtractorReady()) {
    console.error('❌ Hook extractor not ready');
    process.exit(1);
  }
  console.log('✅ Hook extractor ready');

  const results: Result[] = [];

  for (let i = 0; i < TEST_VIDEOS.length; i++) {
    const video = TEST_VIDEOS[i];
    console.log(`\n[${i + 1}/${TEST_VIDEOS.length}]`);

    const result = await validateVideo(video);
    results.push(result);

    // Save intermediate
    writeFileSync(
      join(process.cwd(), 'real-validation-results-v2.json'),
      JSON.stringify(results, null, 2)
    );

    if (i < TEST_VIDEOS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Report
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    VALIDATION REPORT                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const successful = results.filter(r => r.success);
  const downloaded = results.filter(r => r.downloadSuccess);

  console.log(`\n📊 SUCCESS RATES`);
  console.log(`   Download: ${downloaded.length}/${results.length} (${Math.round(downloaded.length/results.length*100)}%)`);
  console.log(`   Full Pipeline: ${successful.length}/${results.length} (${Math.round(successful.length/results.length*100)}%)`);

  // By platform
  console.log('\n📱 BY PLATFORM');
  for (const platform of ['instagram', 'tiktok', 'youtube']) {
    const platformResults = results.filter(r => r.platform === platform);
    const platformSuccess = platformResults.filter(r => r.success).length;
    console.log(`   ${platform.padEnd(12)} ${platformSuccess}/${platformResults.length}`);
  }

  // Products
  if (successful.length > 0) {
    const totalProducts = successful.reduce((s, r) => s + (r.productCount || 0), 0);
    console.log(`\n📦 PRODUCTS`);
    console.log(`   Total detected: ${totalProducts}`);
    console.log(`   Average per video: ${(totalProducts / successful.length).toFixed(1)}`);

    for (const r of successful) {
      console.log(`   ${r.id}: ${r.productCount} products`);
      if (r.products) {
        for (const p of r.products.slice(0, 3)) {
          console.log(`      - ${p.name} (${Math.round(p.confidence * 100)}%)`);
        }
      }
    }
  }

  // Hooks
  if (successful.length > 0) {
    const hookTypes: Record<string, number> = {};
    for (const r of successful) {
      if (r.hookType) {
        hookTypes[r.hookType] = (hookTypes[r.hookType] || 0) + 1;
      }
    }

    console.log('\n🪝 HOOK TYPES');
    for (const [type, count] of Object.entries(hookTypes).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${type.padEnd(15)} ${'█'.repeat(count * 3)} ${count}`);
    }

    const scores = successful.map(r => r.hookEffectiveness || 0);
    console.log(`\n   Effectiveness: avg ${Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)}/100`);
    console.log(`   Range: ${Math.min(...scores)} - ${Math.max(...scores)}`);
  }

  // Errors
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ FAILURES');
    for (const r of failed) {
      console.log(`   ${r.id}: ${r.downloadError || 'Unknown error'}`);
    }
  }

  console.log('\n📁 Results saved to: real-validation-results-v2.json');
}

main().catch(console.error);
