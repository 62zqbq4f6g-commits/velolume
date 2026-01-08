/**
 * Visual Verification Test Script
 *
 * Tests if GPT-4o can rank shopping results by visual similarity
 * to the original product from a creator's video.
 *
 * This is Step 2 of the matching pipeline:
 * 1. Text Search (Candidate Generation) ✅
 * 2. Visual Verification ← THIS TEST
 * 3. Creator Review UI
 *
 * Usage: npx tsx scripts/test-visual-verification.ts
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// File paths
const FRAME_CROP_PATH = join(process.cwd(), "test-output/test-crop-sweater.jpg");
const SHOPPING_RESULTS_PATH = join(process.cwd(), "shopping-api-test-results.json");
const OUTPUT_PATH = join(process.cwd(), "visual-verification-test-results.json");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface ShoppingResult {
  title: string;
  source: string;
  link: string;
  price?: string;
  thumbnail?: string;
  rating?: number;
}

interface VerificationResult {
  rank: number;
  productIndex: number;
  title: string;
  source: string;
  price: string;
  similarityScore: number;
  reasoning: string;
  thumbnailUrl: string;
}

interface TestResults {
  testType: "visual_verification";
  productName: string;
  frameCropPath: string;
  testedAt: string;
  candidatesCount: number;
  rankings: VerificationResult[];
  rawLLMResponse: string;
  success: boolean;
  error?: string;
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
    if (!response.ok) {
      console.log(`   ⚠️ Failed to fetch: ${url.substring(0, 50)}...`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.log(`   ⚠️ Error fetching image: ${error}`);
    return null;
  }
}

/**
 * Call GPT-4o with images for visual comparison
 */
async function rankByVisualSimilarity(
  frameCropBase64: string,
  candidates: Array<{ base64: string; index: number; title: string; source: string; price: string }>
): Promise<{ rankings: VerificationResult[]; rawResponse: string }> {
  console.log(`\n🤖 Sending ${candidates.length + 1} images to GPT-4o for visual comparison`);

  // Build image content array
  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Image 1 is a product from a creator's video (an olive green knit crop sweater). Images 2-${candidates.length + 1} are shopping results.

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
    },
    ...
  ]
}`,
    },
    {
      type: "image_url",
      image_url: {
        url: frameCropBase64,
        detail: "high",
      },
    },
  ];

  // Add candidate images
  for (const candidate of candidates) {
    imageContent.push({
      type: "image_url",
      image_url: {
        url: candidate.base64,
        detail: "low",
      },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: imageContent,
      },
    ],
    max_tokens: 1000,
  });

  const rawResponse = response.choices[0].message.content || "";
  console.log(`   ✅ Received response from GPT-4o`);

  // Parse the JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawResponse;
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // Try to find raw JSON
      const jsonStart = rawResponse.indexOf("{");
      const jsonEnd = rawResponse.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = rawResponse.substring(jsonStart, jsonEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);
    const rankings: VerificationResult[] = parsed.rankings.map((r: any) => {
      const candidateIndex = r.imageNumber - 2; // Image 2 = candidate index 0
      const candidate = candidates[candidateIndex];
      return {
        rank: r.rank,
        productIndex: candidateIndex,
        title: candidate?.title || "Unknown",
        source: candidate?.source || "Unknown",
        price: candidate?.price || "N/A",
        similarityScore: r.similarityScore,
        reasoning: r.reasoning,
        thumbnailUrl: candidate?.base64?.substring(0, 50) + "..." || "N/A",
      };
    });

    // Sort by rank
    rankings.sort((a, b) => a.rank - b.rank);

    return { rankings, rawResponse };
  } catch (error) {
    console.error(`   ❌ Failed to parse LLM response:`, error);
    return { rankings: [], rawResponse };
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║        VISUAL VERIFICATION TEST - GPT-4o Ranking          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: TestResults = {
    testType: "visual_verification",
    productName: "Olive Green Knit Crop Sweater",
    frameCropPath: FRAME_CROP_PATH,
    testedAt: new Date().toISOString(),
    candidatesCount: 0,
    rankings: [],
    rawLLMResponse: "",
    success: false,
  };

  try {
    // Step 1: Load frame crop
    console.log(`\n📷 Loading frame crop`);
    if (!existsSync(FRAME_CROP_PATH)) {
      throw new Error(`Frame crop not found: ${FRAME_CROP_PATH}`);
    }
    const frameCropBase64 = imageToBase64(FRAME_CROP_PATH);
    console.log(`   ✅ Loaded: ${FRAME_CROP_PATH}`);

    // Step 2: Load shopping results
    console.log(`\n🛒 Loading shopping results`);
    const shoppingData = JSON.parse(readFileSync(SHOPPING_RESULTS_PATH, "utf-8"));
    const sweaterResults: ShoppingResult[] = shoppingData.results.find(
      (r: any) => r.productName === "Olive Green Knit Crop Sweater"
    )?.results || [];

    if (sweaterResults.length === 0) {
      throw new Error("No shopping results found for sweater");
    }
    console.log(`   ✅ Found ${sweaterResults.length} shopping results`);

    // Step 3: Fetch top 5 candidate images
    console.log(`\n🖼️  Fetching top 5 candidate images`);
    const candidates: Array<{ base64: string; index: number; title: string; source: string; price: string }> = [];

    for (let i = 0; i < Math.min(5, sweaterResults.length); i++) {
      const result = sweaterResults[i];
      if (result.thumbnail) {
        console.log(`   Fetching image ${i + 1}: ${result.title.substring(0, 40)}...`);
        const base64 = await fetchImageAsBase64(result.thumbnail);
        if (base64) {
          candidates.push({
            base64,
            index: i,
            title: result.title,
            source: result.source,
            price: result.price || "N/A",
          });
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error("Failed to fetch any candidate images");
    }
    console.log(`   ✅ Successfully fetched ${candidates.length} images`);
    results.candidatesCount = candidates.length;

    // Step 4: Call GPT-4o for visual comparison
    const { rankings, rawResponse } = await rankByVisualSimilarity(frameCropBase64, candidates);
    results.rankings = rankings;
    results.rawLLMResponse = rawResponse;
    results.success = rankings.length > 0;

    // Step 5: Save results
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

    // Print summary
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      TEST RESULTS                          ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 Visual Similarity Rankings:`);

    for (const r of rankings) {
      const scoreBar = "█".repeat(Math.floor(r.similarityScore / 10)) + "░".repeat(10 - Math.floor(r.similarityScore / 10));
      console.log(`\n   #${r.rank} | Score: ${r.similarityScore}/100 [${scoreBar}]`);
      console.log(`      ${r.title}`);
      console.log(`      ${r.price} from ${r.source}`);
      console.log(`      → ${r.reasoning}`);
    }

    console.log(`\n📁 Results saved to: ${OUTPUT_PATH}`);
    console.log(`\n✅ Visual verification test completed!`);

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
