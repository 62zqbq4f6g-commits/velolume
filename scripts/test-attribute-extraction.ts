/**
 * Attribute Extraction Matching Test
 *
 * Tests a two-stage approach for visual product matching:
 * 1. Extract structured attributes from reference image
 * 2. Extract same attributes from each candidate
 * 3. Compare attributes programmatically
 * 4. Compare results to holistic V3 prompt
 *
 * Hypothesis: Breaking down into attribute comparison should be
 * more consistent and accurate than holistic similarity judgment.
 *
 * Usage: npx tsx scripts/test-attribute-extraction.ts
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: join(process.cwd(), ".env.local") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File paths
const ROUGH_CROP_PATH = join(process.cwd(), "test-output/test-crop-sweater.jpg");
const SHOPPING_RESULTS_PATH = join(process.cwd(), "shopping-api-test-results.json");
const OUTPUT_PATH = join(process.cwd(), "attribute-extraction-test-results.json");

// ============================================================================
// ATTRIBUTE SCHEMA
// ============================================================================

interface SweaterAttributes {
  // Color attributes (40 points total)
  primaryColor: string;           // e.g., "olive green", "navy blue"
  colorFamily: string;            // e.g., "green", "blue", "neutral"
  colorTone: string;              // e.g., "muted", "bright", "pastel", "dark"

  // Style attributes (30 points total)
  neckline: string;               // e.g., "crew", "mock", "v-neck", "turtleneck"
  sleeveLength: string;           // e.g., "long", "short", "3/4", "sleeveless"
  bodyLength: string;             // e.g., "crop", "regular", "long", "oversized"
  fit: string;                    // e.g., "fitted", "relaxed", "oversized"

  // Material/Texture attributes (20 points total)
  knitType: string;               // e.g., "cable", "ribbed", "waffle", "smooth"
  material: string;               // e.g., "cotton", "wool", "acrylic", "blend"
  texture: string;                // e.g., "chunky", "fine", "medium"

  // Additional details (10 points total)
  hasButtons: boolean;
  hasZipper: boolean;
  hasPattern: boolean;
  patternType: string | null;     // e.g., "solid", "striped", "argyle"

  // Confidence
  confidence: number;             // 0-1, how clearly visible the item is
}

// ============================================================================
// ATTRIBUTE EXTRACTION PROMPT
// ============================================================================

const ATTRIBUTE_EXTRACTION_PROMPT = `You are a precise product attribute extractor. Analyze this sweater/top image and extract EXACT attributes.

Extract these attributes for the sweater/knit top visible in the image:

**COLOR (be specific):**
- primaryColor: The exact color name (e.g., "olive green", "sage green", "forest green", "khaki")
- colorFamily: The broad color family (green, blue, red, neutral, etc.)
- colorTone: Is it muted/earthy, bright/vivid, pastel/light, or dark?

**STYLE:**
- neckline: crew, mock/funnel, v-neck, turtleneck, scoop, boat, collared
- sleeveLength: long, short, 3/4, cap, sleeveless
- bodyLength: crop (above waist), regular (at waist), long (below waist), tunic
- fit: fitted/slim, relaxed/regular, oversized/loose

**MATERIAL/TEXTURE:**
- knitType: cable, ribbed, waffle, pointelle, smooth/jersey, chunky, basketweave
- material: cotton, wool, acrylic, cashmere, blend, unknown
- texture: chunky/thick, medium, fine/thin

**DETAILS:**
- hasButtons: true/false
- hasZipper: true/false
- hasPattern: true/false (other than the knit pattern itself)
- patternType: solid, striped, colorblock, argyle, fair isle, or null

**CONFIDENCE:** How clearly can you see the item? (0.0-1.0)

Respond with JSON only:
{
  "primaryColor": "olive green",
  "colorFamily": "green",
  "colorTone": "muted",
  "neckline": "crew",
  "sleeveLength": "long",
  "bodyLength": "crop",
  "fit": "relaxed",
  "knitType": "cable",
  "material": "cotton blend",
  "texture": "medium",
  "hasButtons": false,
  "hasZipper": false,
  "hasPattern": false,
  "patternType": "solid",
  "confidence": 0.9
}`;

// ============================================================================
// V3 HOLISTIC PROMPT (for comparison)
// ============================================================================

const V3_HOLISTIC_PROMPT = (candidateCount: number) => `You are a strict product verification system. Your job is to determine if shopping results match a product shown in a creator's video.

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
      "reasoning": "Good color and crop length but wrong neckline style"
    }
  ]
}`;

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

// ============================================================================
// ATTRIBUTE EXTRACTION
// ============================================================================

async function extractAttributes(
  imageBase64: string,
  imageName: string
): Promise<SweaterAttributes | null> {
  console.log(`   Extracting attributes from: ${imageName}`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ATTRIBUTE_EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return {
      primaryColor: parsed.primaryColor || "unknown",
      colorFamily: parsed.colorFamily || "unknown",
      colorTone: parsed.colorTone || "unknown",
      neckline: parsed.neckline || "unknown",
      sleeveLength: parsed.sleeveLength || "unknown",
      bodyLength: parsed.bodyLength || "unknown",
      fit: parsed.fit || "unknown",
      knitType: parsed.knitType || "unknown",
      material: parsed.material || "unknown",
      texture: parsed.texture || "unknown",
      hasButtons: parsed.hasButtons || false,
      hasZipper: parsed.hasZipper || false,
      hasPattern: parsed.hasPattern || false,
      patternType: parsed.patternType || null,
      confidence: parsed.confidence || 0.5,
    };
  } catch (error) {
    console.error(`   ❌ Error extracting attributes:`, error);
    return null;
  }
}

// ============================================================================
// PROGRAMMATIC SIMILARITY SCORING
// ============================================================================

interface AttributeComparison {
  attribute: string;
  reference: string;
  candidate: string;
  match: boolean;
  partialMatch: boolean;
  points: number;
  maxPoints: number;
  reasoning: string;
}

interface SimilarityResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  comparisons: AttributeComparison[];
  summary: string;
}

function computeAttributeSimilarity(
  reference: SweaterAttributes,
  candidate: SweaterAttributes
): SimilarityResult {
  const comparisons: AttributeComparison[] = [];
  let totalPoints = 0;
  const maxPoints = 100;

  // ---- COLOR MATCHING (40 points) ----

  // Primary color (25 points)
  const colorMatch = reference.primaryColor.toLowerCase() === candidate.primaryColor.toLowerCase();
  const colorFamilyMatch = reference.colorFamily.toLowerCase() === candidate.colorFamily.toLowerCase();
  const colorToneMatch = reference.colorTone.toLowerCase() === candidate.colorTone.toLowerCase();

  let colorPoints = 0;
  let colorReasoning = "";
  if (colorMatch) {
    colorPoints = 25;
    colorReasoning = "Exact color match";
  } else if (colorFamilyMatch && colorToneMatch) {
    colorPoints = 20;
    colorReasoning = "Same color family and tone";
  } else if (colorFamilyMatch) {
    colorPoints = 12;
    colorReasoning = "Same color family, different tone";
  } else {
    colorPoints = 0;
    colorReasoning = "Different color family";
  }
  totalPoints += colorPoints;

  comparisons.push({
    attribute: "Primary Color",
    reference: reference.primaryColor,
    candidate: candidate.primaryColor,
    match: colorMatch,
    partialMatch: colorFamilyMatch,
    points: colorPoints,
    maxPoints: 25,
    reasoning: colorReasoning,
  });

  // Color tone (15 points)
  const tonePoints = colorToneMatch ? 15 : (colorFamilyMatch ? 8 : 0);
  totalPoints += tonePoints;

  comparisons.push({
    attribute: "Color Tone",
    reference: reference.colorTone,
    candidate: candidate.colorTone,
    match: colorToneMatch,
    partialMatch: false,
    points: tonePoints,
    maxPoints: 15,
    reasoning: colorToneMatch ? "Same tone" : "Different tone",
  });

  // ---- STYLE MATCHING (30 points) ----

  // Neckline (10 points)
  const necklineMatch = reference.neckline.toLowerCase() === candidate.neckline.toLowerCase();
  const necklinePoints = necklineMatch ? 10 : 0;
  totalPoints += necklinePoints;

  comparisons.push({
    attribute: "Neckline",
    reference: reference.neckline,
    candidate: candidate.neckline,
    match: necklineMatch,
    partialMatch: false,
    points: necklinePoints,
    maxPoints: 10,
    reasoning: necklineMatch ? "Same neckline" : `Different neckline (${reference.neckline} vs ${candidate.neckline})`,
  });

  // Sleeve length (8 points)
  const sleeveMatch = reference.sleeveLength.toLowerCase() === candidate.sleeveLength.toLowerCase();
  const sleevePoints = sleeveMatch ? 8 : 0;
  totalPoints += sleevePoints;

  comparisons.push({
    attribute: "Sleeve Length",
    reference: reference.sleeveLength,
    candidate: candidate.sleeveLength,
    match: sleeveMatch,
    partialMatch: false,
    points: sleevePoints,
    maxPoints: 8,
    reasoning: sleeveMatch ? "Same sleeve length" : `Different sleeve (${reference.sleeveLength} vs ${candidate.sleeveLength})`,
  });

  // Body length (8 points)
  const lengthMatch = reference.bodyLength.toLowerCase() === candidate.bodyLength.toLowerCase();
  const lengthPoints = lengthMatch ? 8 : 0;
  totalPoints += lengthPoints;

  comparisons.push({
    attribute: "Body Length",
    reference: reference.bodyLength,
    candidate: candidate.bodyLength,
    match: lengthMatch,
    partialMatch: false,
    points: lengthPoints,
    maxPoints: 8,
    reasoning: lengthMatch ? "Same body length" : `Different length (${reference.bodyLength} vs ${candidate.bodyLength})`,
  });

  // Fit (4 points)
  const fitMatch = reference.fit.toLowerCase() === candidate.fit.toLowerCase();
  const fitPoints = fitMatch ? 4 : 0;
  totalPoints += fitPoints;

  comparisons.push({
    attribute: "Fit",
    reference: reference.fit,
    candidate: candidate.fit,
    match: fitMatch,
    partialMatch: false,
    points: fitPoints,
    maxPoints: 4,
    reasoning: fitMatch ? "Same fit" : `Different fit`,
  });

  // ---- MATERIAL/TEXTURE MATCHING (20 points) ----

  // Knit type (12 points)
  const knitMatch = reference.knitType.toLowerCase() === candidate.knitType.toLowerCase();
  const knitPoints = knitMatch ? 12 : 0;
  totalPoints += knitPoints;

  comparisons.push({
    attribute: "Knit Type",
    reference: reference.knitType,
    candidate: candidate.knitType,
    match: knitMatch,
    partialMatch: false,
    points: knitPoints,
    maxPoints: 12,
    reasoning: knitMatch ? "Same knit pattern" : `Different knit (${reference.knitType} vs ${candidate.knitType})`,
  });

  // Texture (8 points)
  const textureMatch = reference.texture.toLowerCase() === candidate.texture.toLowerCase();
  const texturePoints = textureMatch ? 8 : 4; // Partial credit
  totalPoints += texturePoints;

  comparisons.push({
    attribute: "Texture",
    reference: reference.texture,
    candidate: candidate.texture,
    match: textureMatch,
    partialMatch: true,
    points: texturePoints,
    maxPoints: 8,
    reasoning: textureMatch ? "Same texture" : "Different texture (partial credit)",
  });

  // ---- DETAILS MATCHING (10 points) ----

  // Buttons/Zipper (5 points)
  const detailsMatch = (reference.hasButtons === candidate.hasButtons) &&
                       (reference.hasZipper === candidate.hasZipper);
  const detailPoints = detailsMatch ? 5 : 0;
  totalPoints += detailPoints;

  comparisons.push({
    attribute: "Closures (buttons/zipper)",
    reference: `buttons:${reference.hasButtons}, zipper:${reference.hasZipper}`,
    candidate: `buttons:${candidate.hasButtons}, zipper:${candidate.hasZipper}`,
    match: detailsMatch,
    partialMatch: false,
    points: detailPoints,
    maxPoints: 5,
    reasoning: detailsMatch ? "Same closure details" : "Different closures",
  });

  // Pattern (5 points)
  const patternMatch = reference.patternType === candidate.patternType ||
                       (reference.patternType === "solid" && candidate.patternType === "solid");
  const patternPoints = patternMatch ? 5 : 0;
  totalPoints += patternPoints;

  comparisons.push({
    attribute: "Pattern",
    reference: reference.patternType || "solid",
    candidate: candidate.patternType || "solid",
    match: patternMatch,
    partialMatch: false,
    points: patternPoints,
    maxPoints: 5,
    reasoning: patternMatch ? "Same pattern" : "Different pattern",
  });

  // Generate summary
  const matchedAttrs = comparisons.filter(c => c.match).map(c => c.attribute);
  const missedAttrs = comparisons.filter(c => !c.match && c.points === 0).map(c => c.attribute);

  let summary = "";
  if (totalPoints >= 85) {
    summary = `Excellent match (${totalPoints}/100). Matched: ${matchedAttrs.join(", ")}`;
  } else if (totalPoints >= 70) {
    summary = `Good match (${totalPoints}/100). Missed: ${missedAttrs.join(", ")}`;
  } else if (totalPoints >= 50) {
    summary = `Partial match (${totalPoints}/100). Key differences: ${missedAttrs.slice(0, 3).join(", ")}`;
  } else {
    summary = `Poor match (${totalPoints}/100). Too many differences: ${missedAttrs.join(", ")}`;
  }

  return {
    totalScore: totalPoints,
    maxScore: maxPoints,
    percentage: Math.round((totalPoints / maxPoints) * 100),
    comparisons,
    summary,
  };
}

// ============================================================================
// V3 HOLISTIC COMPARISON
// ============================================================================

async function runV3Holistic(
  cropBase64: string,
  candidates: Array<{ base64: string; title: string }>
): Promise<Array<{ title: string; score: number; reasoning: string }>> {
  console.log(`\n🤖 Running V3 holistic comparison...`);

  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: V3_HOLISTIC_PROMPT(candidates.length) },
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
    max_tokens: 1000,
    temperature: 0.1,
  });

  const rawResponse = response.choices[0].message.content || "";

  try {
    let jsonStr = rawResponse;
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    else {
      const start = rawResponse.indexOf("{");
      const end = rawResponse.lastIndexOf("}");
      if (start !== -1 && end !== -1) jsonStr = rawResponse.substring(start, end + 1);
    }

    const parsed = JSON.parse(jsonStr);
    return parsed.rankings.map((r: any, idx: number) => ({
      title: candidates[(r.imageNumber || idx + 2) - 2]?.title || `Candidate ${idx + 1}`,
      score: r.score,
      reasoning: r.reasoning,
    }));
  } catch {
    return [];
  }
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       ATTRIBUTE EXTRACTION MATCHING TEST                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "attribute_extraction",
    testedAt: new Date().toISOString(),
    referenceAttributes: null,
    candidateResults: [],
    v3HolisticResults: [],
    comparison: null,
    assessment: null,
  };

  try {
    // Step 1: Load images
    console.log(`\n📷 Loading images...`);
    const cropBase64 = imageToBase64(ROUGH_CROP_PATH);

    const shoppingData = JSON.parse(readFileSync(SHOPPING_RESULTS_PATH, "utf-8"));
    const sweaterResults = shoppingData.results.find(
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
    console.log(`   ✅ Loaded reference + ${candidates.length} candidates`);

    // Step 2: Extract attributes from reference
    console.log(`\n📋 STEP 1: Extract Reference Attributes`);
    const referenceAttrs = await extractAttributes(cropBase64, "Reference (rough crop)");
    results.referenceAttributes = referenceAttrs;

    if (!referenceAttrs) {
      throw new Error("Failed to extract reference attributes");
    }

    console.log(`\n   Reference Attributes:`);
    console.log(`   ├─ Color: ${referenceAttrs.primaryColor} (${referenceAttrs.colorFamily}, ${referenceAttrs.colorTone})`);
    console.log(`   ├─ Neckline: ${referenceAttrs.neckline}`);
    console.log(`   ├─ Sleeves: ${referenceAttrs.sleeveLength}`);
    console.log(`   ├─ Length: ${referenceAttrs.bodyLength}`);
    console.log(`   ├─ Fit: ${referenceAttrs.fit}`);
    console.log(`   ├─ Knit: ${referenceAttrs.knitType}`);
    console.log(`   └─ Confidence: ${(referenceAttrs.confidence * 100).toFixed(0)}%`);

    // Step 3: Extract attributes from each candidate
    console.log(`\n📋 STEP 2: Extract Candidate Attributes`);
    const candidateAttrs: Array<{ title: string; attributes: SweaterAttributes | null }> = [];

    for (const candidate of candidates) {
      const attrs = await extractAttributes(candidate.base64, candidate.title.substring(0, 40));
      candidateAttrs.push({ title: candidate.title, attributes: attrs });

      if (attrs) {
        console.log(`   ✅ ${candidate.title.substring(0, 35)}...`);
        console.log(`      Color: ${attrs.primaryColor}, Neckline: ${attrs.neckline}, Length: ${attrs.bodyLength}`);
      }
    }

    // Step 4: Compute programmatic similarity
    console.log(`\n📊 STEP 3: Compute Attribute-Based Similarity`);
    const attrResults: Array<{
      title: string;
      source: string;
      price: string;
      attrScore: number;
      similarity: SimilarityResult;
    }> = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const attrs = candidateAttrs[i].attributes;

      if (attrs && referenceAttrs) {
        const similarity = computeAttributeSimilarity(referenceAttrs, attrs);
        attrResults.push({
          title: candidate.title,
          source: candidate.source,
          price: candidate.price,
          attrScore: similarity.totalScore,
          similarity,
        });
        console.log(`   ${candidate.title.substring(0, 40)}... → ${similarity.totalScore}/100`);
      }
    }

    results.candidateResults = attrResults;

    // Step 5: Run V3 holistic for comparison
    console.log(`\n📊 STEP 4: Run V3 Holistic (for comparison)`);
    const v3Results = await runV3Holistic(cropBase64, candidates);
    results.v3HolisticResults = v3Results;

    // Step 6: Compare results
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    COMPARISON RESULTS                       ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n📊 Score Comparison: Attribute vs V3 Holistic\n`);
    console.log(`${"Product".padEnd(40)} | Attr | V3  | Diff | Agreement`);
    console.log(`${"─".repeat(40)}-|------|-----|------|----------`);

    let totalDiff = 0;
    let agreements = 0;
    const scoreComparisons: any[] = [];

    for (const attrResult of attrResults) {
      const v3Match = v3Results.find(v => v.title === attrResult.title);
      const v3Score = v3Match?.score || 0;
      const diff = attrResult.attrScore - v3Score;
      const agreementLevel = Math.abs(diff) <= 15 ? "✅ Close" : (Math.abs(diff) <= 30 ? "⚠️ Moderate" : "❌ Far");

      totalDiff += Math.abs(diff);
      if (Math.abs(diff) <= 15) agreements++;

      scoreComparisons.push({
        title: attrResult.title,
        attrScore: attrResult.attrScore,
        v3Score,
        diff,
        agreement: agreementLevel,
      });

      console.log(
        `${attrResult.title.substring(0, 39).padEnd(40)} | ${String(attrResult.attrScore).padStart(4)} | ${String(v3Score).padStart(3)} | ${(diff >= 0 ? "+" : "") + diff.toString().padStart(4)} | ${agreementLevel}`
      );
    }

    const avgDiff = totalDiff / attrResults.length;

    console.log(`${"─".repeat(40)}-|------|-----|------|----------`);
    console.log(`Average absolute difference: ${avgDiff.toFixed(1)} points`);
    console.log(`Agreement rate (within 15 pts): ${agreements}/${attrResults.length}`);

    // Ranking comparison
    const attrRanking = [...attrResults].sort((a, b) => b.attrScore - a.attrScore);
    const v3Ranking = [...v3Results].sort((a, b) => b.score - a.score);

    console.log(`\n🏆 Top Match Comparison:`);
    console.log(`   Attribute approach: ${attrRanking[0]?.title.substring(0, 40)} (${attrRanking[0]?.attrScore})`);
    console.log(`   V3 Holistic:        ${v3Ranking[0]?.title.substring(0, 40)} (${v3Ranking[0]?.score})`);

    const topMatchAgrees = attrRanking[0]?.title === v3Ranking[0]?.title;

    // Detailed breakdown for top attribute match
    console.log(`\n📋 Detailed Breakdown (Top Attribute Match):`);
    const topMatch = attrRanking[0];
    if (topMatch) {
      for (const comp of topMatch.similarity.comparisons) {
        const status = comp.match ? "✅" : (comp.partialMatch ? "⚠️" : "❌");
        console.log(`   ${status} ${comp.attribute.padEnd(25)} ${comp.points}/${comp.maxPoints} pts | ${comp.reference} vs ${comp.candidate}`);
      }
    }

    // Assessment
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      ASSESSMENT                            ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    const assessment = {
      avgDifference: avgDiff,
      agreementRate: `${agreements}/${attrResults.length}`,
      topMatchAgrees,
      attrSpread: Math.max(...attrResults.map(r => r.attrScore)) - Math.min(...attrResults.map(r => r.attrScore)),
      v3Spread: Math.max(...v3Results.map(r => r.score)) - Math.min(...v3Results.map(r => r.score)),
      recommendation: "",
      pros: [] as string[],
      cons: [] as string[],
    };

    // Pros
    assessment.pros.push("Explainable: Each score has clear attribute breakdown");
    assessment.pros.push("Consistent: Same attributes always score the same way");
    assessment.pros.push("Debuggable: Can see exactly which attributes matched/missed");
    if (assessment.attrSpread >= assessment.v3Spread) {
      assessment.pros.push(`Good discrimination: ${assessment.attrSpread} point spread`);
    }

    // Cons
    if (!topMatchAgrees) {
      assessment.cons.push("Top match differs from V3 holistic");
    }
    if (avgDiff > 20) {
      assessment.cons.push(`High variance from holistic: ${avgDiff.toFixed(1)} avg difference`);
    }
    assessment.cons.push("Requires category-specific attribute schemas");
    assessment.cons.push("2x API calls (extract reference + candidates separately)");

    // Recommendation
    if (topMatchAgrees && avgDiff <= 20) {
      assessment.recommendation = "✅ RECOMMENDED: Attribute extraction provides similar accuracy with better explainability";
    } else if (topMatchAgrees) {
      assessment.recommendation = "⚠️ CONDITIONALLY RECOMMENDED: Top match agrees but scores vary. Consider hybrid approach.";
    } else {
      assessment.recommendation = "🔄 NEEDS REFINEMENT: Top match differs. Consider adjusting attribute weights or using ensemble.";
    }

    results.comparison = scoreComparisons;
    results.assessment = assessment;

    console.log(`\n   Pros:`);
    for (const pro of assessment.pros) {
      console.log(`   ✅ ${pro}`);
    }

    console.log(`\n   Cons:`);
    for (const con of assessment.cons) {
      console.log(`   ⚠️ ${con}`);
    }

    console.log(`\n   ${assessment.recommendation}`);

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
