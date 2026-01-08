/**
 * Google Lens Product Matching Test Script
 *
 * Tests SerpAPI's Google Lens to find shoppable product matches
 * from extracted video frames.
 *
 * Usage: npx ts-node scripts/test-google-lens.ts
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from "fs";
import { Readable } from "stream";
import { writeFile, unlink, mkdir } from "fs/promises";
import fetch from "node-fetch";

// Configuration
const SERPAPI_KEY = "549a74d3c16ba5191520ca0606358cf17e0c9ccd843114dbd3037d303acb39cc";
const VIDEO_KEY = "raw/5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7.mp4";
const JOB_ID = "5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7";

// S3 Configuration
const s3Client = new S3Client({
  endpoint: "https://sgp1.digitaloceanspaces.com",
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_ID || "DO00B32Q4NVBTZQRBKTK",
    secretAccessKey: process.env.SPACES_SECRET_KEY || "I0S4qh5ypzT2FlHVRBHaNuqzgPqi2Me62CHsPefA8y8",
  },
  forcePathStyle: false,
});
const BUCKET_NAME = "auto-storefront-media";
const SPACES_CDN = `https://${BUCKET_NAME}.sgp1.cdn.digitaloceanspaces.com`;

// ffmpeg paths
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

// Directories
const OUTPUT_DIR = join(process.cwd(), "test-output");
const FRAMES_DIR = join(OUTPUT_DIR, "frames-" + JOB_ID);

interface GoogleLensResult {
  frameIndex: number;
  framePath: string;
  searchUrl: string;
  visualMatches: Array<{
    title: string;
    link: string;
    source: string;
    price?: string;
    thumbnail?: string;
  }>;
  shoppingResults: Array<{
    title: string;
    link: string;
    source: string;
    price: string;
    thumbnail?: string;
    rating?: number;
  }>;
  rawResponse: any;
}

interface TestResults {
  jobId: string;
  videoKey: string;
  testedAt: string;
  framesExtracted: number;
  framesTested: number;
  results: GoogleLensResult[];
  summary: {
    totalVisualMatches: number;
    totalShoppingResults: number;
    framesWithMatches: number;
  };
}

/**
 * Download video from S3
 */
async function downloadVideo(): Promise<string> {
  console.log(`\n📥 Downloading video from S3: ${VIDEO_KEY}`);

  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: VIDEO_KEY,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;

  const videoPath = join(OUTPUT_DIR, `video-${JOB_ID}.mp4`);

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  await writeFile(videoPath, Buffer.concat(chunks));

  console.log(`   ✅ Downloaded to: ${videoPath}`);
  return videoPath;
}

/**
 * Extract frames from video (distributed sampling across entire video)
 */
async function extractFrames(videoPath: string, numFrames: number = 12): Promise<string[]> {
  console.log(`\n🎬 Extracting ${numFrames} frames from video`);

  if (!existsSync(FRAMES_DIR)) {
    await mkdir(FRAMES_DIR, { recursive: true });
  }

  // Get video duration first
  const duration = await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });

  console.log(`   Video duration: ${duration.toFixed(2)}s`);

  // Extract frames at distributed intervals
  await new Promise<void>((resolve, reject) => {
    const interval = duration / (numFrames + 1);

    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=1/${interval}`,
        `-q:v 2`,
        `-frames:v ${numFrames}`,
      ])
      .output(join(FRAMES_DIR, "frame-%03d.jpg"))
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });

  // Get list of extracted frames
  const files = readdirSync(FRAMES_DIR)
    .filter(f => f.endsWith(".jpg"))
    .sort()
    .map(f => join(FRAMES_DIR, f));

  console.log(`   ✅ Extracted ${files.length} frames to: ${FRAMES_DIR}`);
  return files;
}

/**
 * Upload frame to S3 and return public URL
 */
async function uploadFrameToS3(imagePath: string, frameIndex: number): Promise<string> {
  const imageBuffer = readFileSync(imagePath);
  const key = `frames/${JOB_ID}/frame-${frameIndex + 1}.jpg`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/jpeg",
      ACL: "public-read",
    })
  );

  return `${SPACES_CDN}/${key}`;
}

/**
 * Query Google Lens via SerpAPI with an image file
 */
async function queryGoogleLens(imagePath: string, frameIndex: number): Promise<GoogleLensResult> {
  console.log(`\n🔍 Querying Google Lens for frame ${frameIndex + 1}`);

  // Upload frame to S3 to get public URL
  console.log(`   Uploading frame to S3...`);
  const imageUrl = await uploadFrameToS3(imagePath, frameIndex);
  console.log(`   Image URL: ${imageUrl}`);

  // SerpAPI Google Lens endpoint with image URL
  const params = new URLSearchParams({
    api_key: SERPAPI_KEY,
    engine: "google_lens",
    url: imageUrl,
  });

  const searchUrl = `https://serpapi.com/search?engine=google_lens&url=${encodeURIComponent(imageUrl)}`;
  console.log(`   API endpoint: serpapi.com/search (google_lens engine)`);

  try {
    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json() as any;

    // Extract visual matches
    const visualMatches = (data.visual_matches || []).slice(0, 10).map((match: any) => ({
      title: match.title || "Unknown",
      link: match.link || "",
      source: match.source || "",
      price: match.price?.value || match.price,
      thumbnail: match.thumbnail,
    }));

    // Extract shopping results
    const shoppingResults = (data.shopping_results || []).slice(0, 10).map((item: any) => ({
      title: item.title || "Unknown",
      link: item.link || "",
      source: item.source || "",
      price: item.price || "",
      thumbnail: item.thumbnail,
      rating: item.rating,
    }));

    console.log(`   ✅ Found ${visualMatches.length} visual matches, ${shoppingResults.length} shopping results`);

    return {
      frameIndex,
      framePath: imagePath,
      searchUrl,
      visualMatches,
      shoppingResults,
      rawResponse: data,
    };
  } catch (error) {
    console.error(`   ❌ Error querying Google Lens:`, error);
    return {
      frameIndex,
      framePath: imagePath,
      searchUrl,
      visualMatches: [],
      shoppingResults: [],
      rawResponse: { error: String(error) },
    };
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          GOOGLE LENS PRODUCT MATCHING TEST                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nJob ID: ${JOB_ID}`);
  console.log(`Video Key: ${VIDEO_KEY}`);
  console.log(`SerpAPI Key: ${SERPAPI_KEY.substring(0, 10)}...`);

  const results: TestResults = {
    jobId: JOB_ID,
    videoKey: VIDEO_KEY,
    testedAt: new Date().toISOString(),
    framesExtracted: 0,
    framesTested: 0,
    results: [],
    summary: {
      totalVisualMatches: 0,
      totalShoppingResults: 0,
      framesWithMatches: 0,
    },
  };

  try {
    // Step 1: Download video
    const videoPath = await downloadVideo();

    // Step 2: Extract frames
    const framePaths = await extractFrames(videoPath, 12);
    results.framesExtracted = framePaths.length;

    // Step 3: Test 5 frames (0, 2, 4, 6, 8 for diverse coverage)
    const testIndices = [0, 2, 4, 6, 8];
    const framesToTest = testIndices.filter(i => i < framePaths.length);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testing ${framesToTest.length} frames: indices ${framesToTest.join(", ")}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const idx of framesToTest) {
      const result = await queryGoogleLens(framePaths[idx], idx);
      results.results.push(result);
      results.framesTested++;

      // Update summary
      results.summary.totalVisualMatches += result.visualMatches.length;
      results.summary.totalShoppingResults += result.shoppingResults.length;
      if (result.visualMatches.length > 0 || result.shoppingResults.length > 0) {
        results.summary.framesWithMatches++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    // Step 4: Clean up video file (keep frames for inspection)
    await unlink(videoPath);

    // Step 5: Save results
    const outputPath = join(process.cwd(), "matching-test-results.json");
    writeFileSync(outputPath, JSON.stringify(results, null, 2));

    // Print summary
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      TEST SUMMARY                          ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 Results:`);
    console.log(`   Frames extracted: ${results.framesExtracted}`);
    console.log(`   Frames tested: ${results.framesTested}`);
    console.log(`   Frames with matches: ${results.summary.framesWithMatches}`);
    console.log(`   Total visual matches: ${results.summary.totalVisualMatches}`);
    console.log(`   Total shopping results: ${results.summary.totalShoppingResults}`);
    console.log(`\n📁 Output:`);
    console.log(`   Results saved to: ${outputPath}`);
    console.log(`   Frames saved to: ${FRAMES_DIR}`);

    // Print sample matches
    if (results.results.some(r => r.shoppingResults.length > 0)) {
      console.log(`\n🛒 Sample Shopping Results:`);
      for (const result of results.results) {
        if (result.shoppingResults.length > 0) {
          console.log(`\n   Frame ${result.frameIndex + 1}:`);
          for (const item of result.shoppingResults.slice(0, 3)) {
            console.log(`   - ${item.title}`);
            console.log(`     Price: ${item.price} | Source: ${item.source}`);
          }
        }
      }
    }

    console.log(`\n✅ Test completed successfully!`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);

    // Save partial results
    const outputPath = join(process.cwd(), "matching-test-results.json");
    writeFileSync(outputPath, JSON.stringify({ ...results, error: String(error) }, null, 2));

    process.exit(1);
  }
}

// Run the test
runTest();
