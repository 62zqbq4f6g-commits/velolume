/**
 * Visual Verification Prompt Comparison Test
 *
 * Tests 3 different prompts to find which gives the most
 * consistent and discriminating results for product matching.
 *
 * Prompts:
 * - V1: Current simple "rank by similarity"
 * - V2: Attribute-focused with weighted scoring
 * - V3: Stricter verification criteria
 *
 * Usage: npx tsx scripts/test-prompt-comparison.ts
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: join(process.cwd(), ".env.local") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File paths
const ROUGH_CROP_PATH = join(process.cwd(), "test-output/test-crop-sweater.jpg");
const SHOPPING_RESULTS_PATH = join(process.cwd(), "shopping-api-test-results.json");
const OUTPUT_PATH = join(process.cwd(), "prompt-comparison-results.json");

interface ShoppingResult {
  title: string;
  source: string;
  price?: string;
  thumbnail?: string;
}

interface RankingResult {
  title: string;
  source: string;
  price: string;
  rank: number;
  score: number;
  reasoning: string;
}

interface PromptResult {
  promptVersion: string;
  rankings: RankingResult[];
  rawResponse: string;
  scoreRange: { min: number; max: number; spread: number };
  avgScore: number;
}

// ============================================================================
// PROMPT DEFINITIONS
// ============================================================================

const PROMPTS = {
  V1_CURRENT: (candidateCount: number) => `Image 1 is a product from a creator's video (an olive green knit crop sweater). Images 2-${candidateCount + 1} are shopping results.

Rank images 2-${candidateCount + 1} by how closely they visually match the product in Image 1.

For each shopping result, provide:
- Rank (1-${candidateCount}, where 1 is best match)
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

  V2_ATTRIBUTE_FOCUSED: (candidateCount: number) => `Image 1 shows an olive green knit crop sweater from a creator's video. Images 2-${candidateCount + 1} are shopping results.

For each shopping result (Images 2-${candidateCount + 1}), score 0-100 based on these weighted criteria:

**Color Match (40 points max):**
- 40: Exact same shade of olive green
- 30: Very close shade (slightly lighter/darker)
- 20: Similar green family but noticeably different
- 10: Different color family
- 0: Completely different color

**Style Match (30 points max):**
- 30: Same neckline, sleeve length, and crop length
- 20: 2 of 3 match
- 10: 1 of 3 match
- 0: None match

**Material/Texture Match (20 points max):**
- 20: Same knit pattern and texture
- 15: Similar knit style
- 10: Different knit but same category (sweater)
- 0: Different material entirely

**Overall Vibe (10 points max):**
- 10: A fan would definitely think this is the same item
- 5: A fan might think it's similar
- 0: A fan would not confuse these items

Provide the total score (sum of all categories) and a brief breakdown.

Respond in JSON format:
{
  "rankings": [
    {
      "imageNumber": 2,
      "totalScore": 75,
      "breakdown": {
        "color": 35,
        "style": 20,
        "material": 15,
        "vibe": 5
      },
      "reasoning": "Close color match but different neckline style"
    }
  ]
}`,

  V3_STRICT_VERIFICATION: (candidateCount: number) => `You are a strict product verification system. Your job is to determine if shopping results match a product shown in a creator's video.

**Reference Product (Image 1):** Olive green knit crop sweater

**Shopping Results:** Images 2-${candidateCount + 1}

**Scoring Guidelines (BE STRICT):**
- 90-100: NEARLY IDENTICAL - A fan would be 95%+ confident this is the exact same item
- 70-89: VERY SIMILAR - Same style, very close color, minor differences only
- 50-69: SOMEWHAT SIMILAR - Same category, some shared features, but noticeable differences
- 30-49: LOOSELY RELATED - Same general type but clearly different item
- 0-29: NOT A MATCH - Different product entirely

**Penalty Triggers (deduct points heavily):**
- Wrong color shade (not olive green): -30 points
- Wrong neckline (crew vs mock vs v-neck): -20 points
- Wrong sleeve style (long vs short vs 3/4): -15 points
- Wrong length (crop vs regular vs long): -20 points
- Wrong material look (cable knit vs ribbed vs waffle): -15 points

Start at 100 and deduct for each difference you observe.

Respond in JSON format:
{
  "rankings": [
    {
      "imageNumber": 2,
      "score": 65,
      "penalties": [
        { "issue": "neckline is mock neck instead of crew", "deduction": -20 },
        { "issue": "slightly different shade of green", "deduction": -15 }
      ],
      "reasoning": "Good color and crop length but wrong neckline style"
    }
  ]
}`
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function imageToBase64(imagePath: string): string {
  const buffer = readFileSync(imagePath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

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

async function runPrompt(
  promptVersion: string,
  promptText: string,
  cropBase64: string,
  candidates: Array<{ base64: string; title: string; source: string; price: string }>
): Promise<PromptResult> {
  console.log(`\n🤖 Running ${promptVersion}...`);

  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: promptText },
    { type: "image_url", image_url: { url: cropBase64, detail: "high" } },
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
    max_tokens: 1500,
    temperature: 0.1, // Low temperature for consistency
  });

  const rawResponse = response.choices[0].message.content || "";

  // Parse response
  let rankings: RankingResult[] = [];
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

    rankings = parsed.rankings.map((r: any, idx: number) => {
      const candidateIndex = (r.imageNumber || idx + 2) - 2;
      const candidate = candidates[candidateIndex] || candidates[idx];
      const score = r.similarityScore || r.totalScore || r.score || 0;

      return {
        title: candidate?.title || "Unknown",
        source: candidate?.source || "Unknown",
        price: candidate?.price || "N/A",
        rank: r.rank || idx + 1,
        score: score,
        reasoning: r.reasoning || JSON.stringify(r.breakdown || r.penalties || ""),
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);
    // Assign ranks based on sorted order
    rankings.forEach((r, i) => r.rank = i + 1);

  } catch (error) {
    console.error(`   ❌ Parse error:`, error);
  }

  const scores = rankings.map(r => r.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  console.log(`   ✅ Complete - Scores: ${scores.join(", ")}`);

  return {
    promptVersion,
    rankings,
    rawResponse,
    scoreRange: { min, max, spread: max - min },
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
  };
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║      VISUAL VERIFICATION PROMPT COMPARISON TEST            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "prompt_comparison",
    testedAt: new Date().toISOString(),
    prompts: {},
    comparison: null,
    recommendation: null,
  };

  try {
    // Load images
    console.log(`\n📷 Loading images...`);
    const cropBase64 = imageToBase64(ROUGH_CROP_PATH);

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
    console.log(`   ✅ Loaded crop + ${candidates.length} candidates`);

    // Run all 3 prompts
    const v1Result = await runPrompt(
      "V1_CURRENT",
      PROMPTS.V1_CURRENT(candidates.length),
      cropBase64,
      candidates
    );
    results.prompts.V1 = v1Result;

    const v2Result = await runPrompt(
      "V2_ATTRIBUTE_FOCUSED",
      PROMPTS.V2_ATTRIBUTE_FOCUSED(candidates.length),
      cropBase64,
      candidates
    );
    results.prompts.V2 = v2Result;

    const v3Result = await runPrompt(
      "V3_STRICT_VERIFICATION",
      PROMPTS.V3_STRICT_VERIFICATION(candidates.length),
      cropBase64,
      candidates
    );
    results.prompts.V3 = v3Result;

    // Display comparison
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    COMPARISON RESULTS                       ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    // Score distribution table
    console.log(`\n📊 Score Distribution by Prompt:\n`);
    console.log(`${"Product".padEnd(35)} |  V1  |  V2  |  V3  | StdDev`);
    console.log(`${"─".repeat(35)}-|------|------|------|-------`);

    const allProducts = v1Result.rankings.map(r => r.title);
    const productStdDevs: number[] = [];

    for (const title of allProducts) {
      const v1Score = v1Result.rankings.find(r => r.title === title)?.score || 0;
      const v2Score = v2Result.rankings.find(r => r.title === title)?.score || 0;
      const v3Score = v3Result.rankings.find(r => r.title === title)?.score || 0;

      const scores = [v1Score, v2Score, v3Score];
      const mean = scores.reduce((a, b) => a + b, 0) / 3;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / 3;
      const stdDev = Math.sqrt(variance);
      productStdDevs.push(stdDev);

      console.log(
        `${title.substring(0, 34).padEnd(35)} | ${String(v1Score).padStart(4)} | ${String(v2Score).padStart(4)} | ${String(v3Score).padStart(4)} | ${stdDev.toFixed(1).padStart(5)}`
      );
    }

    console.log(`${"─".repeat(35)}-|------|------|------|-------`);

    // Summary stats
    console.log(`\n📈 Prompt Statistics:\n`);
    console.log(`Metric                    |   V1   |   V2   |   V3  `);
    console.log(`--------------------------|--------|--------|-------`);
    console.log(`Average Score             | ${v1Result.avgScore.toFixed(1).padStart(6)} | ${v2Result.avgScore.toFixed(1).padStart(6)} | ${v3Result.avgScore.toFixed(1).padStart(5)}`);
    console.log(`Score Spread (max-min)    | ${String(v1Result.scoreRange.spread).padStart(6)} | ${String(v2Result.scoreRange.spread).padStart(6)} | ${String(v3Result.scoreRange.spread).padStart(5)}`);
    console.log(`Min Score                 | ${String(v1Result.scoreRange.min).padStart(6)} | ${String(v2Result.scoreRange.min).padStart(6)} | ${String(v3Result.scoreRange.min).padStart(5)}`);
    console.log(`Max Score                 | ${String(v1Result.scoreRange.max).padStart(6)} | ${String(v2Result.scoreRange.max).padStart(6)} | ${String(v3Result.scoreRange.max).padStart(5)}`);

    // Top match consistency
    console.log(`\n🏆 Top Match by Prompt:`);
    console.log(`   V1: ${v1Result.rankings[0]?.title} (${v1Result.rankings[0]?.score})`);
    console.log(`   V2: ${v2Result.rankings[0]?.title} (${v2Result.rankings[0]?.score})`);
    console.log(`   V3: ${v3Result.rankings[0]?.title} (${v3Result.rankings[0]?.score})`);

    const topMatches = [
      v1Result.rankings[0]?.title,
      v2Result.rankings[0]?.title,
      v3Result.rankings[0]?.title,
    ];
    const topMatchConsistent = topMatches.every(t => t === topMatches[0]);

    // Average cross-prompt stddev
    const avgStdDev = productStdDevs.reduce((a, b) => a + b, 0) / productStdDevs.length;

    // Determine best prompt
    console.log(`\n📋 Analysis:`);
    console.log(`   Cross-prompt consistency (avg StdDev): ${avgStdDev.toFixed(1)}`);
    console.log(`   Top match agreement: ${topMatchConsistent ? "✅ All agree" : "⚠️ Disagree"}`);

    // Score best prompt based on criteria
    const promptScores = {
      V1: 0,
      V2: 0,
      V3: 0,
    };

    // Criterion 1: Higher spread = better discrimination
    const spreads = [v1Result.scoreRange.spread, v2Result.scoreRange.spread, v3Result.scoreRange.spread];
    const maxSpread = Math.max(...spreads);
    if (v1Result.scoreRange.spread === maxSpread) promptScores.V1 += 2;
    if (v2Result.scoreRange.spread === maxSpread) promptScores.V2 += 2;
    if (v3Result.scoreRange.spread === maxSpread) promptScores.V3 += 2;

    // Criterion 2: Reasonable average (not too high, not too low)
    // Best if average is 50-70 range (discriminating)
    const avgDist = (avg: number) => Math.abs(avg - 60);
    const avgDists = [avgDist(v1Result.avgScore), avgDist(v2Result.avgScore), avgDist(v3Result.avgScore)];
    const minAvgDist = Math.min(...avgDists);
    if (avgDist(v1Result.avgScore) === minAvgDist) promptScores.V1 += 1;
    if (avgDist(v2Result.avgScore) === minAvgDist) promptScores.V2 += 1;
    if (avgDist(v3Result.avgScore) === minAvgDist) promptScores.V3 += 1;

    // Criterion 3: Clear separation between best and rest
    const separation = (rankings: RankingResult[]) => {
      if (rankings.length < 2) return 0;
      return rankings[0].score - rankings[1].score;
    };
    const seps = [separation(v1Result.rankings), separation(v2Result.rankings), separation(v3Result.rankings)];
    const maxSep = Math.max(...seps);
    if (separation(v1Result.rankings) === maxSep) promptScores.V1 += 2;
    if (separation(v2Result.rankings) === maxSep) promptScores.V2 += 2;
    if (separation(v3Result.rankings) === maxSep) promptScores.V3 += 2;

    const bestPrompt = Object.entries(promptScores).sort((a, b) => b[1] - a[1])[0][0];

    results.comparison = {
      avgStdDev,
      topMatchConsistent,
      topMatches,
      promptScores,
      bestPrompt,
      spreads: { V1: v1Result.scoreRange.spread, V2: v2Result.scoreRange.spread, V3: v3Result.scoreRange.spread },
      separations: { V1: separation(v1Result.rankings), V2: separation(v2Result.rankings), V3: separation(v3Result.rankings) },
    };

    // Recommendation
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                     RECOMMENDATION                          ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n🎯 Best Prompt: ${bestPrompt}`);
    console.log(`\n   Scoring breakdown:`);
    console.log(`   - V1 (Current):          ${promptScores.V1} points`);
    console.log(`   - V2 (Attribute-focused): ${promptScores.V2} points`);
    console.log(`   - V3 (Strict):           ${promptScores.V3} points`);

    console.log(`\n   Why ${bestPrompt}?`);
    if (bestPrompt === "V1") {
      console.log(`   - Simple and effective`);
      console.log(`   - Good score spread for discrimination`);
    } else if (bestPrompt === "V2") {
      console.log(`   - Structured attribute scoring provides explainability`);
      console.log(`   - Weighted criteria align with what matters for matching`);
    } else {
      console.log(`   - Strict penalties create clearer separation`);
      console.log(`   - "Start at 100, deduct" approach is more consistent`);
    }

    results.recommendation = {
      bestPrompt,
      reasoning: `${bestPrompt} scored highest on discrimination (spread), separation, and reasonable averages.`,
    };

    // Save results
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n📁 Full results saved to: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    results.error = String(error);
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    process.exit(1);
  }
}

// Run the test
runTest();
