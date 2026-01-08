/**
 * Bounding Box Crop Test Script
 *
 * Tests if tighter product cropping with bounding boxes improves
 * visual matching accuracy.
 *
 * Steps:
 * 1. Send frames to GPT-4o with bounding box prompt
 * 2. Get pixel coordinates for olive green sweater
 * 3. Crop using tight bounding box
 * 4. Run visual verification comparison
 *
 * Usage: npx tsx scripts/test-bounding-box-crop.ts
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import sharp from "sharp";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// File paths
const FRAMES_DIR = join(process.cwd(), "test-output/frames-5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7");
const ROUGH_CROP_PATH = join(process.cwd(), "test-output/test-crop-sweater.jpg");
const TIGHT_CROP_PATH = join(process.cwd(), "test-output/tight-crop-sweater.jpg");
const SHOPPING_RESULTS_PATH = join(process.cwd(), "shopping-api-test-results.json");
const OUTPUT_PATH = join(process.cwd(), "bounding-box-test-results.json");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductWithBBox {
  name: string;
  category: string;
  boundingBox: BoundingBox;
  frameIndex: number;
  confidence: number;
}

interface ShoppingResult {
  title: string;
  source: string;
  link: string;
  price?: string;
  thumbnail?: string;
}

interface VerificationResult {
  rank: number;
  title: string;
  source: string;
  price: string;
  similarityScore: number;
  reasoning: string;
}

/**
 * Convert local image to base64 data URL
 */
function imageToBase64(imagePath: string): string {
  const buffer = readFileSync(imagePath);
  const base64 = buffer.toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Fetch image from URL and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Get bounding boxes for products in frames using GPT-4o
 */
async function detectProductBoundingBoxes(
  frameBuffers: Buffer[],
  targetProduct: string
): Promise<ProductWithBBox[]> {
  console.log(`\n🔍 Detecting bounding boxes for: "${targetProduct}"`);

  const BBOX_PROMPT = `You are a product detection system that returns precise bounding box coordinates.

TASK: Analyze these video frames and find the "${targetProduct}" product.

For EACH frame where the product is visible, return the bounding box coordinates that TIGHTLY contain just the product.

IMPORTANT INSTRUCTIONS:
1. The bounding box should be as TIGHT as possible - crop closely around the product edges
2. Do NOT include background, do NOT include other body parts unless part of the product
3. Coordinates are in PIXELS relative to image dimensions (assume 720x1280 for vertical video frames)
4. x,y is the TOP-LEFT corner of the bounding box
5. width,height define the box size

For a sweater/top:
- Include the full garment from neckline to hem
- Include sleeves if visible
- Do NOT include the person's face, hands (unless wearing the item), or other clothing items

Return JSON only:
{
  "detections": [
    {
      "frameIndex": 1,
      "name": "Olive Green Knit Crop Sweater",
      "category": "Clothing",
      "boundingBox": {
        "x": 150,
        "y": 300,
        "width": 400,
        "height": 350
      },
      "confidence": 0.95,
      "notes": "Clear view of sweater, good for cropping"
    }
  ],
  "bestFrameIndex": 3,
  "bestFrameReason": "Most clear, unobstructed view of the product"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: BBOX_PROMPT },
          ...frameBuffers.map((frame, i) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString("base64")}`,
              detail: "high" as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log(`   ✅ Received bounding box response from GPT-4o`);

  try {
    const parsed = JSON.parse(content);
    console.log(`   📦 Found ${parsed.detections?.length || 0} detections`);
    console.log(`   🎯 Best frame: ${parsed.bestFrameIndex} - ${parsed.bestFrameReason}`);

    return parsed.detections?.map((d: any) => ({
      name: d.name,
      category: d.category,
      boundingBox: d.boundingBox,
      frameIndex: d.frameIndex,
      confidence: d.confidence,
    })) || [];
  } catch (error) {
    console.error(`   ❌ Failed to parse response:`, error);
    return [];
  }
}

/**
 * Crop image using bounding box with sharp
 */
async function cropWithBoundingBox(
  imagePath: string,
  bbox: BoundingBox,
  outputPath: string
): Promise<void> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Get actual image dimensions
  const imgWidth = metadata.width || 720;
  const imgHeight = metadata.height || 1280;

  console.log(`   📐 Image dimensions: ${imgWidth}x${imgHeight}`);
  console.log(`   📦 Bounding box: x=${bbox.x}, y=${bbox.y}, w=${bbox.width}, h=${bbox.height}`);

  // Clamp bounding box to image bounds
  const x = Math.max(0, Math.min(bbox.x, imgWidth - 1));
  const y = Math.max(0, Math.min(bbox.y, imgHeight - 1));
  const width = Math.min(bbox.width, imgWidth - x);
  const height = Math.min(bbox.height, imgHeight - y);

  console.log(`   ✂️ Cropping: x=${x}, y=${y}, w=${width}, h=${height}`);

  await image
    .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  console.log(`   ✅ Saved tight crop to: ${outputPath}`);
}

/**
 * Run visual verification with GPT-4o
 */
async function runVisualVerification(
  cropBase64: string,
  candidates: Array<{ base64: string; title: string; source: string; price: string }>,
  cropType: string
): Promise<{ rankings: VerificationResult[]; rawResponse: string }> {
  console.log(`\n🤖 Running visual verification with ${cropType} crop`);

  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Image 1 is a cropped product from a creator's video (an olive green knit crop sweater). Images 2-${candidates.length + 1} are shopping results.

Rank images 2-${candidates.length + 1} by how closely they visually match the product in Image 1.

For each shopping result, provide:
- Rank (1-${candidates.length}, where 1 is best match)
- Similarity score (0-100, where 100 is identical)
- Reasoning (1 sentence explaining why)

Consider: color match, knit texture/pattern, crop length, sleeve style, neckline, overall silhouette.

Respond in this exact JSON format:
{
  "rankings": [
    {
      "imageNumber": 2,
      "rank": 1,
      "similarityScore": 85,
      "reasoning": "Very close color match and similar cable knit texture"
    }
  ]
}`,
    },
    {
      type: "image_url",
      image_url: { url: cropBase64, detail: "high" },
    },
  ];

  for (const candidate of candidates) {
    imageContent.push({
      type: "image_url",
      image_url: { url: candidate.base64, detail: "low" },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: imageContent }],
    max_tokens: 1000,
  });

  const rawResponse = response.choices[0].message.content || "";

  try {
    let jsonStr = rawResponse;
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const jsonStart = rawResponse.indexOf("{");
      const jsonEnd = rawResponse.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = rawResponse.substring(jsonStart, jsonEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);
    const rankings: VerificationResult[] = parsed.rankings.map((r: any) => {
      const candidateIndex = r.imageNumber - 2;
      const candidate = candidates[candidateIndex];
      return {
        rank: r.rank,
        title: candidate?.title || "Unknown",
        source: candidate?.source || "Unknown",
        price: candidate?.price || "N/A",
        similarityScore: r.similarityScore,
        reasoning: r.reasoning,
      };
    });

    rankings.sort((a, b) => a.rank - b.rank);
    return { rankings, rawResponse };
  } catch (error) {
    console.error(`   ❌ Failed to parse response:`, error);
    return { rankings: [], rawResponse };
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║     BOUNDING BOX CROP TEST - Tight vs Rough Cropping      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "bounding_box_comparison",
    targetProduct: "Olive Green Knit Crop Sweater",
    testedAt: new Date().toISOString(),
    boundingBoxDetection: null,
    roughCropVerification: null,
    tightCropVerification: null,
    comparison: null,
    success: false,
  };

  try {
    // Step 1: Load video frames
    console.log(`\n📷 Loading video frames`);
    const frameFiles = Array.from({ length: 12 }, (_, i) =>
      join(FRAMES_DIR, `frame-${String(i + 1).padStart(3, "0")}.jpg`)
    );

    const frameBuffers: Buffer[] = [];
    for (const file of frameFiles) {
      if (existsSync(file)) {
        frameBuffers.push(readFileSync(file));
      }
    }
    console.log(`   ✅ Loaded ${frameBuffers.length} frames`);

    // Step 2: Detect bounding boxes
    const detections = await detectProductBoundingBoxes(
      frameBuffers,
      "Olive Green Knit Crop Sweater"
    );
    results.boundingBoxDetection = detections;

    if (detections.length === 0) {
      throw new Error("No bounding boxes detected");
    }

    // Step 3: Select best detection and crop
    console.log(`\n✂️ Creating tight crop from best detection`);
    const bestDetection = detections.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    console.log(`   Best detection: Frame ${bestDetection.frameIndex} (${(bestDetection.confidence * 100).toFixed(0)}% confidence)`);

    const bestFramePath = join(FRAMES_DIR, `frame-${String(bestDetection.frameIndex).padStart(3, "0")}.jpg`);

    if (!existsSync(bestFramePath)) {
      throw new Error(`Frame file not found: ${bestFramePath}`);
    }

    await cropWithBoundingBox(bestFramePath, bestDetection.boundingBox, TIGHT_CROP_PATH);

    // Step 4: Load shopping candidates
    console.log(`\n🛒 Loading shopping candidates`);
    const shoppingData = JSON.parse(readFileSync(SHOPPING_RESULTS_PATH, "utf-8"));
    const sweaterResults: ShoppingResult[] = shoppingData.results.find(
      (r: any) => r.productName === "Olive Green Knit Crop Sweater"
    )?.results || [];

    const candidates: Array<{ base64: string; title: string; source: string; price: string }> = [];
    for (let i = 0; i < Math.min(5, sweaterResults.length); i++) {
      const result = sweaterResults[i];
      if (result.thumbnail) {
        const base64 = await fetchImageAsBase64(result.thumbnail);
        if (base64) {
          candidates.push({
            base64,
            title: result.title,
            source: result.source,
            price: result.price || "N/A",
          });
        }
      }
    }
    console.log(`   ✅ Loaded ${candidates.length} shopping candidates`);

    // Step 5: Run visual verification with ROUGH crop
    const roughCropBase64 = imageToBase64(ROUGH_CROP_PATH);
    const roughResults = await runVisualVerification(roughCropBase64, candidates, "ROUGH");
    results.roughCropVerification = roughResults.rankings;
    console.log(`   ✅ Rough crop verification complete`);

    // Step 6: Run visual verification with TIGHT crop
    const tightCropBase64 = imageToBase64(TIGHT_CROP_PATH);
    const tightResults = await runVisualVerification(tightCropBase64, candidates, "TIGHT");
    results.tightCropVerification = tightResults.rankings;
    console.log(`   ✅ Tight crop verification complete`);

    // Step 7: Compare results
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    COMPARISON RESULTS                       ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n📊 Side-by-Side Score Comparison:\n`);
    console.log(`${"Product".padEnd(45)} | Rough | Tight | Δ`);
    console.log(`${"─".repeat(45)}-|-------|-------|----`);

    let totalRoughScore = 0;
    let totalTightScore = 0;

    for (const roughItem of roughResults.rankings) {
      const tightItem = tightResults.rankings.find(t => t.title === roughItem.title);
      const roughScore = roughItem.similarityScore;
      const tightScore = tightItem?.similarityScore || 0;
      const delta = tightScore - roughScore;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

      totalRoughScore += roughScore;
      totalTightScore += tightScore;

      console.log(
        `${roughItem.title.substring(0, 44).padEnd(45)} | ${String(roughScore).padStart(5)} | ${String(tightScore).padStart(5)} | ${deltaStr.padStart(3)}`
      );
    }

    const avgRough = (totalRoughScore / roughResults.rankings.length).toFixed(1);
    const avgTight = (totalTightScore / tightResults.rankings.length).toFixed(1);
    const avgDelta = (totalTightScore - totalRoughScore) / roughResults.rankings.length;

    console.log(`${"─".repeat(45)}-|-------|-------|----`);
    console.log(`${"AVERAGE".padEnd(45)} | ${String(avgRough).padStart(5)} | ${String(avgTight).padStart(5)} | ${(avgDelta > 0 ? "+" : "") + avgDelta.toFixed(1)}`);

    results.comparison = {
      averageRoughScore: parseFloat(avgRough),
      averageTightScore: parseFloat(avgTight),
      averageImprovement: avgDelta,
      topMatchChanged: roughResults.rankings[0]?.title !== tightResults.rankings[0]?.title,
      roughTopMatch: roughResults.rankings[0]?.title,
      tightTopMatch: tightResults.rankings[0]?.title,
    };

    console.log(`\n🏆 Top Match Comparison:`);
    console.log(`   Rough crop → ${roughResults.rankings[0]?.title} (Score: ${roughResults.rankings[0]?.similarityScore})`);
    console.log(`   Tight crop → ${tightResults.rankings[0]?.title} (Score: ${tightResults.rankings[0]?.similarityScore})`);

    if (avgDelta > 0) {
      console.log(`\n✅ RESULT: Tight cropping IMPROVED scores by average of ${avgDelta.toFixed(1)} points`);
    } else if (avgDelta < 0) {
      console.log(`\n⚠️ RESULT: Tight cropping DECREASED scores by average of ${Math.abs(avgDelta).toFixed(1)} points`);
    } else {
      console.log(`\n➡️ RESULT: No significant difference between crop types`);
    }

    results.success = true;

    // Save results
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    results.error = String(error);
    results.success = false;
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    process.exit(1);
  }
}

// Run the test
runTest();
