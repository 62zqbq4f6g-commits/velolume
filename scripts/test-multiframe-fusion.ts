/**
 * Multi-Frame Attribute Fusion Test
 *
 * Tests if extracting attributes from multiple frames and merging them
 * creates a more complete reference profile than single-frame extraction.
 *
 * Approach:
 * 1. Select frames showing different aspects of the sweater
 * 2. Extract attributes from each frame
 * 3. Merge into single profile (best/most confident for each attribute)
 * 4. Run attribute matching against candidates
 * 5. Compare to single-frame approach
 *
 * Usage: npx tsx scripts/test-multiframe-fusion.ts
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: join(process.cwd(), ".env.local") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File paths
const FRAMES_DIR = join(process.cwd(), "test-output/frames-5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7");
const SHOPPING_RESULTS_PATH = join(process.cwd(), "shopping-api-test-results.json");
const OUTPUT_PATH = join(process.cwd(), "multiframe-fusion-results.json");

// Selected frames based on visual inspection:
// Frame 1: Side/back view - sleeve detail, overall silhouette
// Frame 3: Front view - neckline, crop length, front texture
// Frame 6: Front view - knit texture detail, fit
// Frame 9: Full body - full sleeve length, complete silhouette
const SELECTED_FRAMES = [
  { index: 1, purpose: "Side/back view - sleeve detail, silhouette" },
  { index: 3, purpose: "Front view - neckline, crop length, texture" },
  { index: 6, purpose: "Front view - knit texture, fit detail" },
  { index: 9, purpose: "Full body - complete sleeve, full silhouette" },
];

// ============================================================================
// ATTRIBUTE SCHEMA
// ============================================================================

interface SweaterAttributes {
  primaryColor: string;
  colorFamily: string;
  colorTone: string;
  neckline: string;
  sleeveLength: string;
  bodyLength: string;
  fit: string;
  knitType: string;
  material: string;
  texture: string;
  hasButtons: boolean;
  hasZipper: boolean;
  hasPattern: boolean;
  patternType: string | null;
  confidence: number;
}

interface FrameExtraction {
  frameIndex: number;
  purpose: string;
  attributes: SweaterAttributes;
  visibilityNotes: string;
}

// ============================================================================
// EXTRACTION PROMPT - Enhanced for specific frame context
// ============================================================================

const getExtractionPrompt = (purpose: string) => `You are a precise product attribute extractor. Analyze this video frame showing a sweater/knit top.

CONTEXT: This frame was selected because it shows: ${purpose}

Extract these attributes for the sweater. If an attribute is NOT clearly visible in THIS frame, mark it as "not_visible" (we'll get it from another frame).

**COLOR:**
- primaryColor: Exact color (e.g., "olive green", "sage", "khaki"). Use "not_visible" if unsure.
- colorFamily: Broad family (green, blue, neutral, etc.)
- colorTone: muted/earthy, bright/vivid, pastel, dark

**STYLE:**
- neckline: crew, mock/funnel, v-neck, turtleneck, scoop, boat, collared, or "not_visible"
- sleeveLength: long, short, 3/4, cap, sleeveless, or "not_visible"
- bodyLength: crop (above waist), regular, long, tunic, or "not_visible"
- fit: fitted, relaxed, oversized, or "not_visible"

**MATERIAL/TEXTURE:**
- knitType: cable, ribbed, waffle, stockinette, chunky, basketweave, or "not_visible"
- material: cotton, wool, acrylic, cashmere, blend, or "unknown"
- texture: chunky/thick, medium, fine/thin

**DETAILS:**
- hasButtons: true/false/not_visible
- hasZipper: true/false/not_visible
- hasPattern: true/false (other than knit pattern)
- patternType: solid, striped, colorblock, etc.

**VISIBILITY:**
- confidence: How clearly can you see the SWEATER in this frame? (0.0-1.0)
- visibilityNotes: What aspects of the sweater are clearly visible vs obscured?

Respond with JSON only:
{
  "primaryColor": "olive green",
  "colorFamily": "green",
  "colorTone": "muted",
  "neckline": "crew",
  "sleeveLength": "long",
  "bodyLength": "crop",
  "fit": "oversized",
  "knitType": "chunky",
  "material": "wool blend",
  "texture": "chunky/thick",
  "hasButtons": false,
  "hasZipper": false,
  "hasPattern": false,
  "patternType": "solid",
  "confidence": 0.9,
  "visibilityNotes": "Front view clearly shows neckline and crop length. Sleeves partially visible."
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
// MULTI-FRAME EXTRACTION
// ============================================================================

async function extractFromFrame(
  frameIndex: number,
  purpose: string
): Promise<FrameExtraction | null> {
  const framePath = join(FRAMES_DIR, `frame-${String(frameIndex).padStart(3, "0")}.jpg`);

  if (!existsSync(framePath)) {
    console.log(`   ❌ Frame ${frameIndex} not found`);
    return null;
  }

  const imageBase64 = imageToBase64(framePath);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: getExtractionPrompt(purpose) },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return {
      frameIndex,
      purpose,
      attributes: {
        primaryColor: parsed.primaryColor || "not_visible",
        colorFamily: parsed.colorFamily || "not_visible",
        colorTone: parsed.colorTone || "not_visible",
        neckline: parsed.neckline || "not_visible",
        sleeveLength: parsed.sleeveLength || "not_visible",
        bodyLength: parsed.bodyLength || "not_visible",
        fit: parsed.fit || "not_visible",
        knitType: parsed.knitType || "not_visible",
        material: parsed.material || "unknown",
        texture: parsed.texture || "not_visible",
        hasButtons: parsed.hasButtons ?? false,
        hasZipper: parsed.hasZipper ?? false,
        hasPattern: parsed.hasPattern ?? false,
        patternType: parsed.patternType || "solid",
        confidence: parsed.confidence || 0.5,
      },
      visibilityNotes: parsed.visibilityNotes || "",
    };
  } catch (error) {
    console.error(`   ❌ Error extracting from frame ${frameIndex}:`, error);
    return null;
  }
}

// ============================================================================
// ATTRIBUTE FUSION
// ============================================================================

interface FusedAttribute {
  value: string | boolean;
  sourceFrame: number;
  confidence: number;
  alternatives: Array<{ value: string | boolean; frame: number; confidence: number }>;
}

interface FusedProfile {
  primaryColor: FusedAttribute;
  colorFamily: FusedAttribute;
  colorTone: FusedAttribute;
  neckline: FusedAttribute;
  sleeveLength: FusedAttribute;
  bodyLength: FusedAttribute;
  fit: FusedAttribute;
  knitType: FusedAttribute;
  material: FusedAttribute;
  texture: FusedAttribute;
  hasButtons: FusedAttribute;
  hasZipper: FusedAttribute;
  patternType: FusedAttribute;
  overallConfidence: number;
  completeness: number;
  attributeSources: Record<string, number>;
}

function fuseAttributes(extractions: FrameExtraction[]): FusedProfile {
  const fuse = (attrName: keyof SweaterAttributes): FusedAttribute => {
    const values: Array<{ value: any; frame: number; confidence: number }> = [];

    for (const ext of extractions) {
      const val = ext.attributes[attrName];
      // Skip "not_visible", "unknown", and undefined
      if (val !== "not_visible" && val !== "unknown" && val !== undefined && val !== null) {
        values.push({
          value: val,
          frame: ext.frameIndex,
          confidence: ext.attributes.confidence,
        });
      }
    }

    if (values.length === 0) {
      return {
        value: "unknown",
        sourceFrame: -1,
        confidence: 0,
        alternatives: [],
      };
    }

    // Sort by confidence, take highest
    values.sort((a, b) => b.confidence - a.confidence);
    const best = values[0];

    return {
      value: best.value,
      sourceFrame: best.frame,
      confidence: best.confidence,
      alternatives: values.slice(1),
    };
  };

  const profile: FusedProfile = {
    primaryColor: fuse("primaryColor"),
    colorFamily: fuse("colorFamily"),
    colorTone: fuse("colorTone"),
    neckline: fuse("neckline"),
    sleeveLength: fuse("sleeveLength"),
    bodyLength: fuse("bodyLength"),
    fit: fuse("fit"),
    knitType: fuse("knitType"),
    material: fuse("material"),
    texture: fuse("texture"),
    hasButtons: fuse("hasButtons"),
    hasZipper: fuse("hasZipper"),
    patternType: fuse("patternType"),
    overallConfidence: 0,
    completeness: 0,
    attributeSources: {},
  };

  // Calculate completeness and overall confidence
  const attrs = [
    profile.primaryColor, profile.colorTone, profile.neckline,
    profile.sleeveLength, profile.bodyLength, profile.fit,
    profile.knitType, profile.texture,
  ];

  const known = attrs.filter(a => a.value !== "unknown" && a.sourceFrame !== -1);
  profile.completeness = (known.length / attrs.length) * 100;
  profile.overallConfidence = known.length > 0
    ? known.reduce((sum, a) => sum + a.confidence, 0) / known.length
    : 0;

  // Track which frame contributed which attribute
  for (const [key, attr] of Object.entries(profile)) {
    if (typeof attr === "object" && "sourceFrame" in attr && attr.sourceFrame !== -1) {
      profile.attributeSources[key] = attr.sourceFrame;
    }
  }

  return profile;
}

// ============================================================================
// PROGRAMMATIC SIMILARITY (same as before)
// ============================================================================

interface SimilarityResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: Array<{ attr: string; ref: string; cand: string; points: number; max: number }>;
}

function computeSimilarity(
  fused: FusedProfile,
  candidate: SweaterAttributes
): SimilarityResult {
  const breakdown: SimilarityResult["breakdown"] = [];
  let total = 0;
  const max = 100;

  // Color (40 points)
  const refColor = String(fused.primaryColor.value).toLowerCase();
  const candColor = candidate.primaryColor.toLowerCase();
  const refFamily = String(fused.colorFamily.value).toLowerCase();
  const candFamily = candidate.colorFamily.toLowerCase();

  let colorPoints = 0;
  if (refColor === candColor) colorPoints = 25;
  else if (refFamily === candFamily && String(fused.colorTone.value).toLowerCase() === candidate.colorTone.toLowerCase()) colorPoints = 20;
  else if (refFamily === candFamily) colorPoints = 12;
  total += colorPoints;
  breakdown.push({ attr: "Color", ref: refColor, cand: candColor, points: colorPoints, max: 25 });

  const tonePoints = String(fused.colorTone.value).toLowerCase() === candidate.colorTone.toLowerCase() ? 15 : 0;
  total += tonePoints;
  breakdown.push({ attr: "Tone", ref: String(fused.colorTone.value), cand: candidate.colorTone, points: tonePoints, max: 15 });

  // Neckline (10 points)
  const neckPoints = String(fused.neckline.value).toLowerCase() === candidate.neckline.toLowerCase() ? 10 : 0;
  total += neckPoints;
  breakdown.push({ attr: "Neckline", ref: String(fused.neckline.value), cand: candidate.neckline, points: neckPoints, max: 10 });

  // Sleeves (8 points)
  const sleevePoints = String(fused.sleeveLength.value).toLowerCase() === candidate.sleeveLength.toLowerCase() ? 8 : 0;
  total += sleevePoints;
  breakdown.push({ attr: "Sleeves", ref: String(fused.sleeveLength.value), cand: candidate.sleeveLength, points: sleevePoints, max: 8 });

  // Body length (8 points)
  const lengthPoints = String(fused.bodyLength.value).toLowerCase() === candidate.bodyLength.toLowerCase() ? 8 : 0;
  total += lengthPoints;
  breakdown.push({ attr: "Length", ref: String(fused.bodyLength.value), cand: candidate.bodyLength, points: lengthPoints, max: 8 });

  // Fit (4 points)
  const fitPoints = String(fused.fit.value).toLowerCase() === candidate.fit.toLowerCase() ? 4 : 0;
  total += fitPoints;
  breakdown.push({ attr: "Fit", ref: String(fused.fit.value), cand: candidate.fit, points: fitPoints, max: 4 });

  // Knit type (12 points)
  const knitPoints = String(fused.knitType.value).toLowerCase() === candidate.knitType.toLowerCase() ? 12 : 0;
  total += knitPoints;
  breakdown.push({ attr: "Knit", ref: String(fused.knitType.value), cand: candidate.knitType, points: knitPoints, max: 12 });

  // Texture (8 points)
  const texturePoints = String(fused.texture.value).toLowerCase() === candidate.texture.toLowerCase() ? 8 : 4;
  total += texturePoints;
  breakdown.push({ attr: "Texture", ref: String(fused.texture.value), cand: candidate.texture, points: texturePoints, max: 8 });

  // Details (10 points)
  const detailsMatch = fused.hasButtons.value === candidate.hasButtons && fused.hasZipper.value === candidate.hasZipper;
  const detailPoints = detailsMatch ? 5 : 0;
  total += detailPoints;
  breakdown.push({ attr: "Closures", ref: `btn:${fused.hasButtons.value}`, cand: `btn:${candidate.hasButtons}`, points: detailPoints, max: 5 });

  const patternPoints = String(fused.patternType.value) === candidate.patternType ? 5 : 0;
  total += patternPoints;
  breakdown.push({ attr: "Pattern", ref: String(fused.patternType.value), cand: candidate.patternType || "solid", points: patternPoints, max: 5 });

  return { totalScore: total, maxScore: max, percentage: Math.round((total / max) * 100), breakdown };
}

// ============================================================================
// CANDIDATE EXTRACTION
// ============================================================================

async function extractCandidateAttributes(
  imageBase64: string,
  title: string
): Promise<SweaterAttributes | null> {
  const prompt = `Extract sweater attributes from this product image.

Return JSON:
{
  "primaryColor": "color name",
  "colorFamily": "green/blue/red/neutral/etc",
  "colorTone": "muted/bright/pastel/dark",
  "neckline": "crew/mock/v-neck/turtleneck/etc",
  "sleeveLength": "long/short/3-4/sleeveless",
  "bodyLength": "crop/regular/long",
  "fit": "fitted/relaxed/oversized",
  "knitType": "cable/ribbed/waffle/chunky/smooth",
  "material": "cotton/wool/acrylic/blend",
  "texture": "chunky/medium/fine",
  "hasButtons": false,
  "hasZipper": false,
  "hasPattern": false,
  "patternType": "solid/striped/etc",
  "confidence": 0.9
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
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
      patternType: parsed.patternType || "solid",
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         MULTI-FRAME ATTRIBUTE FUSION TEST                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "multiframe_fusion",
    testedAt: new Date().toISOString(),
    frameExtractions: [],
    fusedProfile: null,
    candidateResults: [],
    comparison: null,
  };

  try {
    // Step 1: Extract from each selected frame
    console.log(`\n📋 STEP 1: Extract Attributes from ${SELECTED_FRAMES.length} Frames\n`);

    const extractions: FrameExtraction[] = [];

    for (const frame of SELECTED_FRAMES) {
      console.log(`   Frame ${frame.index}: ${frame.purpose}`);
      const extraction = await extractFromFrame(frame.index, frame.purpose);
      if (extraction) {
        extractions.push(extraction);
        console.log(`   ├─ Color: ${extraction.attributes.primaryColor}`);
        console.log(`   ├─ Neckline: ${extraction.attributes.neckline}`);
        console.log(`   ├─ Sleeves: ${extraction.attributes.sleeveLength}`);
        console.log(`   ├─ Length: ${extraction.attributes.bodyLength}`);
        console.log(`   ├─ Knit: ${extraction.attributes.knitType}`);
        console.log(`   └─ Confidence: ${(extraction.attributes.confidence * 100).toFixed(0)}%`);
        console.log();
      }
    }

    results.frameExtractions = extractions;

    // Step 2: Fuse attributes
    console.log(`\n📋 STEP 2: Fuse Attributes into Single Profile\n`);
    const fusedProfile = fuseAttributes(extractions);
    results.fusedProfile = fusedProfile;

    console.log(`   FUSED REFERENCE PROFILE:`);
    console.log(`   ┌────────────────────────────────────────────────────┐`);
    console.log(`   │ Attribute      │ Value              │ From Frame  │`);
    console.log(`   ├────────────────┼────────────────────┼─────────────┤`);
    console.log(`   │ Primary Color  │ ${String(fusedProfile.primaryColor.value).padEnd(18)} │ Frame ${String(fusedProfile.primaryColor.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Color Tone     │ ${String(fusedProfile.colorTone.value).padEnd(18)} │ Frame ${String(fusedProfile.colorTone.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Neckline       │ ${String(fusedProfile.neckline.value).padEnd(18)} │ Frame ${String(fusedProfile.neckline.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Sleeve Length  │ ${String(fusedProfile.sleeveLength.value).padEnd(18)} │ Frame ${String(fusedProfile.sleeveLength.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Body Length    │ ${String(fusedProfile.bodyLength.value).padEnd(18)} │ Frame ${String(fusedProfile.bodyLength.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Fit            │ ${String(fusedProfile.fit.value).padEnd(18)} │ Frame ${String(fusedProfile.fit.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Knit Type      │ ${String(fusedProfile.knitType.value).padEnd(18)} │ Frame ${String(fusedProfile.knitType.sourceFrame).padEnd(5)} │`);
    console.log(`   │ Texture        │ ${String(fusedProfile.texture.value).padEnd(18)} │ Frame ${String(fusedProfile.texture.sourceFrame).padEnd(5)} │`);
    console.log(`   └────────────────┴────────────────────┴─────────────┘`);
    console.log(`   Completeness: ${fusedProfile.completeness.toFixed(0)}% | Overall Confidence: ${(fusedProfile.overallConfidence * 100).toFixed(0)}%`);

    // Step 3: Load and extract candidate attributes
    console.log(`\n📋 STEP 3: Extract Candidate Attributes\n`);

    const shoppingData = JSON.parse(readFileSync(SHOPPING_RESULTS_PATH, "utf-8"));
    const sweaterResults = shoppingData.results.find(
      (r: any) => r.productName === "Olive Green Knit Crop Sweater"
    )?.results || [];

    const candidates: Array<{ title: string; source: string; price: string; attrs: SweaterAttributes | null }> = [];

    for (let i = 0; i < Math.min(5, sweaterResults.length); i++) {
      const result = sweaterResults[i];
      if (result.thumbnail) {
        const base64 = await fetchImageAsBase64(result.thumbnail);
        if (base64) {
          console.log(`   Extracting: ${result.title.substring(0, 40)}...`);
          const attrs = await extractCandidateAttributes(base64, result.title);
          candidates.push({
            title: result.title,
            source: result.source,
            price: result.price || "N/A",
            attrs,
          });
          if (attrs) {
            console.log(`   └─ ${attrs.primaryColor}, ${attrs.neckline}, ${attrs.bodyLength}, ${attrs.knitType}`);
          }
        }
      }
    }

    // Step 4: Compute similarity scores
    console.log(`\n📋 STEP 4: Compute Attribute-Based Similarity Scores\n`);

    const candidateResults: Array<{
      title: string;
      source: string;
      price: string;
      score: number;
      similarity: SimilarityResult;
    }> = [];

    for (const cand of candidates) {
      if (cand.attrs) {
        const similarity = computeSimilarity(fusedProfile, cand.attrs);
        candidateResults.push({
          title: cand.title,
          source: cand.source,
          price: cand.price,
          score: similarity.totalScore,
          similarity,
        });
      }
    }

    // Sort by score
    candidateResults.sort((a, b) => b.score - a.score);
    results.candidateResults = candidateResults;

    // Step 5: Display results
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                 MULTI-FRAME FUSION RESULTS                 ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n📊 Similarity Scores (Multi-Frame Fused Reference):\n`);
    console.log(`${"Rank".padStart(4)} | ${"Product".padEnd(40)} | Score | Key Matches`);
    console.log(`${"─".repeat(4)}-|-${"─".repeat(40)}-|-------|${"─".repeat(30)}`);

    for (let i = 0; i < candidateResults.length; i++) {
      const r = candidateResults[i];
      const matches = r.similarity.breakdown
        .filter(b => b.points === b.max)
        .map(b => b.attr)
        .slice(0, 3)
        .join(", ");
      console.log(`${String(i + 1).padStart(4)} | ${r.title.substring(0, 40).padEnd(40)} | ${String(r.score).padStart(5)} | ${matches}`);
    }

    // Comparison with single-frame approach
    console.log(`\n📊 Comparison: Multi-Frame vs Single-Frame\n`);
    console.log(`   Single-Frame (rough crop):  60% completeness, many "unknown" attributes`);
    console.log(`   Multi-Frame Fusion:         ${fusedProfile.completeness.toFixed(0)}% completeness`);
    console.log(`\n   Key Improvements:`);

    const singleFrameUnknowns = ["neckline", "sleeveLength", "bodyLength", "fit"];
    const nowKnown = singleFrameUnknowns.filter(attr => {
      const val = fusedProfile[attr as keyof FusedProfile];
      return typeof val === "object" && "value" in val && val.value !== "unknown";
    });

    for (const attr of nowKnown) {
      const fusedAttr = fusedProfile[attr as keyof FusedProfile] as FusedAttribute;
      console.log(`   ✅ ${attr}: "${fusedAttr.value}" (from Frame ${fusedAttr.sourceFrame})`);
    }

    const stillUnknown = singleFrameUnknowns.filter(attr => !nowKnown.includes(attr));
    for (const attr of stillUnknown) {
      console.log(`   ❌ ${attr}: still unknown`);
    }

    // Top match
    console.log(`\n🏆 Top Match:`);
    if (candidateResults.length > 0) {
      const top = candidateResults[0];
      console.log(`   ${top.title}`);
      console.log(`   Score: ${top.score}/100`);
      console.log(`\n   Attribute Breakdown:`);
      for (const b of top.similarity.breakdown) {
        const status = b.points === b.max ? "✅" : (b.points > 0 ? "⚠️" : "❌");
        console.log(`   ${status} ${b.attr.padEnd(12)} ${b.points}/${b.max} pts | Ref: ${b.ref} vs Cand: ${b.cand}`);
      }
    }

    // Assessment
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      ASSESSMENT                            ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    const improvement = fusedProfile.completeness - 60; // vs single frame
    if (improvement > 20) {
      console.log(`\n   ✅ SIGNIFICANT IMPROVEMENT`);
      console.log(`   Multi-frame fusion increased profile completeness by ${improvement.toFixed(0)}%`);
      console.log(`   Previously unknown attributes now have values from different frames.`);
    } else if (improvement > 0) {
      console.log(`\n   ⚠️ MODERATE IMPROVEMENT`);
      console.log(`   Some improvement in completeness (+${improvement.toFixed(0)}%)`);
    } else {
      console.log(`\n   ❌ NO IMPROVEMENT`);
      console.log(`   Multi-frame fusion did not significantly improve completeness.`);
    }

    results.comparison = {
      singleFrameCompleteness: 60,
      multiFrameCompleteness: fusedProfile.completeness,
      improvement,
      previouslyUnknown: singleFrameUnknowns,
      nowKnown,
      topMatch: candidateResults[0]?.title,
      topScore: candidateResults[0]?.score,
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
