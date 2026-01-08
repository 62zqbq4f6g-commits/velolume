/**
 * Cropped Google Lens Test Script
 *
 * Tests if Google Lens returns shopping results when given:
 * 1. A clean product crop (not full frame)
 * 2. A structured query from V2.0 detection data
 *
 * Usage: npx tsx scripts/test-cropped-lens.ts
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { Readable } from "stream";

// Configuration
const SERPAPI_KEY = "549a74d3c16ba5191520ca0606358cf17e0c9ccd843114dbd3037d303acb39cc";
const JOB_ID = "5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7";
const FRAME_KEY = `frames/${JOB_ID}/frame-7.jpg`;

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
const SPACES_URL = `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com`;

// Output directory
const OUTPUT_DIR = join(process.cwd(), "test-output");

// V2.0 Product Data
const PRODUCT_DATA = {
  name: "Olive Green Knit Crop Sweater",
  category: "Clothing",
  subcategory: "Crop Sweater",
  colors: ["olive green"],
  material: "knit",
  style: "casual",
  searchTerms: ["olive green", "knit crop sweater", "casual sweater", "long sleeve", "women's fashion"],
};

// Build structured query
const STRUCTURED_QUERY = "olive green knit crop sweater women buy";

interface LensResult {
  title: string;
  source: string;
  link: string;
  price?: string;
  thumbnail?: string;
}

interface TestResults {
  testType: "cropped_product";
  productData: typeof PRODUCT_DATA;
  cropImageUrl: string;
  querySent: string;
  testedAt: string;
  visualMatches: LensResult[];
  shoppingResults: LensResult[];
  summary: {
    totalVisualMatches: number;
    totalShoppingResults: number;
    hasRelevantResults: boolean;
  };
  rawResponse: any;
  assessment: string;
}

/**
 * Download frame from S3
 */
async function downloadFrame(): Promise<Buffer> {
  console.log(`\n📥 Downloading frame from S3: ${FRAME_KEY}`);

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: FRAME_KEY,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  console.log(`   ✅ Downloaded frame (${(Buffer.concat(chunks).length / 1024).toFixed(1)} KB)`);
  return Buffer.concat(chunks);
}

/**
 * Crop the sweater region from the frame
 * - Top 40% of frame, with some margin from top (to remove head)
 * - Centered on torso
 */
async function cropSweater(frameBuffer: Buffer): Promise<Buffer> {
  console.log(`\n✂️  Cropping sweater region`);

  // Get image metadata
  const metadata = await sharp(frameBuffer).metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  console.log(`   Original size: ${width}x${height}`);

  // Calculate crop region:
  // - Start at 15% from top (skip head)
  // - End at 50% from top (upper body only)
  // - Full width with 10% margin on sides
  const cropTop = Math.floor(height * 0.15);
  const cropHeight = Math.floor(height * 0.35);
  const cropLeft = Math.floor(width * 0.1);
  const cropWidth = Math.floor(width * 0.8);

  console.log(`   Crop region: x=${cropLeft}, y=${cropTop}, w=${cropWidth}, h=${cropHeight}`);

  const croppedBuffer = await sharp(frameBuffer)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log(`   ✅ Cropped to ${cropWidth}x${cropHeight} (${(croppedBuffer.length / 1024).toFixed(1)} KB)`);
  return croppedBuffer;
}

/**
 * Upload cropped image to S3
 */
async function uploadCropToS3(cropBuffer: Buffer): Promise<string> {
  console.log(`\n☁️  Uploading crop to S3`);

  const key = `test-crops/${JOB_ID}/sweater-crop.jpg`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: cropBuffer,
      ContentType: "image/jpeg",
      ACL: "public-read",
    })
  );

  const url = `${SPACES_URL}/${key}`;
  console.log(`   ✅ Uploaded: ${url}`);
  return url;
}

/**
 * Call Google Lens API with cropped image and structured query
 */
async function callGoogleLens(cropImageUrl: string, query: string): Promise<any> {
  console.log(`\n🔍 Calling Google Lens API`);
  console.log(`   Image URL: ${cropImageUrl}`);
  console.log(`   Query: "${query}"`);

  const params = new URLSearchParams({
    engine: "google_lens",
    url: cropImageUrl,
    q: query,
    api_key: SERPAPI_KEY,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const data = await response.json();

  return data;
}

/**
 * Assess if results are relevant
 */
function assessResults(visualMatches: LensResult[], shoppingResults: LensResult[]): string {
  const allResults = [...visualMatches, ...shoppingResults];

  if (allResults.length === 0) {
    return "❌ NO RESULTS: Google Lens returned no matches even with cropped image and query.";
  }

  // Check for relevance keywords
  const relevanceKeywords = ["sweater", "knit", "green", "olive", "crop", "top", "pullover"];
  let relevantCount = 0;

  for (const result of allResults.slice(0, 10)) {
    const title = result.title.toLowerCase();
    const hasRelevantKeyword = relevanceKeywords.some(kw => title.includes(kw));
    if (hasRelevantKeyword) {
      relevantCount++;
    }
  }

  const relevanceRate = (relevantCount / Math.min(allResults.length, 10)) * 100;

  if (relevanceRate >= 70) {
    return `✅ HIGHLY RELEVANT: ${relevanceRate.toFixed(0)}% of top results match sweater/knit/green keywords. Google Lens + crop + query works!`;
  } else if (relevanceRate >= 40) {
    return `⚠️ PARTIALLY RELEVANT: ${relevanceRate.toFixed(0)}% of results are relevant. Could improve with better cropping or query.`;
  } else {
    return `❌ LOW RELEVANCE: Only ${relevanceRate.toFixed(0)}% of results are relevant. Results may be off-topic.`;
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       CROPPED GOOGLE LENS TEST - Sweater Detection        ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nJob ID: ${JOB_ID}`);
  console.log(`Product: ${PRODUCT_DATA.name}`);
  console.log(`Query: "${STRUCTURED_QUERY}"`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Step 1: Download frame
    const frameBuffer = await downloadFrame();

    // Step 2: Crop sweater region
    const cropBuffer = await cropSweater(frameBuffer);

    // Save crop locally for inspection
    const localCropPath = join(OUTPUT_DIR, "test-crop-sweater.jpg");
    writeFileSync(localCropPath, cropBuffer);
    console.log(`   Saved local copy: ${localCropPath}`);

    // Step 3: Upload to S3
    const cropImageUrl = await uploadCropToS3(cropBuffer);

    // Step 4: Call Google Lens
    const lensResponse = await callGoogleLens(cropImageUrl, STRUCTURED_QUERY);

    // Extract results
    const visualMatches: LensResult[] = (lensResponse.visual_matches || []).slice(0, 10).map((m: any) => ({
      title: m.title || "Unknown",
      source: m.source || "",
      link: m.link || "",
      price: m.price?.value || m.price || undefined,
      thumbnail: m.thumbnail,
    }));

    const shoppingResults: LensResult[] = (lensResponse.shopping_results || []).slice(0, 10).map((s: any) => ({
      title: s.title || "Unknown",
      source: s.source || "",
      link: s.link || "",
      price: s.price || undefined,
      thumbnail: s.thumbnail,
    }));

    // Step 5: Assess results
    const assessment = assessResults(visualMatches, shoppingResults);

    // Build results object
    const results: TestResults = {
      testType: "cropped_product",
      productData: PRODUCT_DATA,
      cropImageUrl,
      querySent: STRUCTURED_QUERY,
      testedAt: new Date().toISOString(),
      visualMatches,
      shoppingResults,
      summary: {
        totalVisualMatches: visualMatches.length,
        totalShoppingResults: shoppingResults.length,
        hasRelevantResults: visualMatches.length > 0 || shoppingResults.length > 0,
      },
      rawResponse: lensResponse,
      assessment,
    };

    // Save results
    const outputPath = join(process.cwd(), "cropped-lens-test-results.json");
    writeFileSync(outputPath, JSON.stringify(results, null, 2));

    // Print summary
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      TEST RESULTS                          ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 Summary:`);
    console.log(`   Crop Image URL: ${cropImageUrl}`);
    console.log(`   Query: "${STRUCTURED_QUERY}"`);
    console.log(`   Visual Matches: ${visualMatches.length}`);
    console.log(`   Shopping Results: ${shoppingResults.length}`);
    console.log(`\n📋 Assessment:`);
    console.log(`   ${assessment}`);

    if (visualMatches.length > 0) {
      console.log(`\n🖼️  Top 5 Visual Matches:`);
      for (const match of visualMatches.slice(0, 5)) {
        console.log(`   • ${match.title}`);
        console.log(`     Source: ${match.source}`);
        if (match.price) console.log(`     Price: ${match.price}`);
        console.log(`     Link: ${match.link.substring(0, 60)}...`);
      }
    }

    if (shoppingResults.length > 0) {
      console.log(`\n🛒 Top 5 Shopping Results:`);
      for (const result of shoppingResults.slice(0, 5)) {
        console.log(`   • ${result.title}`);
        console.log(`     Source: ${result.source}`);
        if (result.price) console.log(`     Price: ${result.price}`);
        console.log(`     Link: ${result.link.substring(0, 60)}...`);
      }
    }

    console.log(`\n📁 Results saved to: ${outputPath}`);
    console.log(`\n✅ Test completed!`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    process.exit(1);
  }
}

// Run the test
runTest();
