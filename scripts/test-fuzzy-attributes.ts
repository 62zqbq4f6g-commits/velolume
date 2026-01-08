/**
 * Fuzzy Attribute Matching Test
 *
 * Refines attribute matching with:
 * 1. Fuzzy Color Matching - partial credit for similar colors
 * 2. Attribute Grouping - knit types grouped into families
 * 3. Confidence-Weighted Scoring - low confidence = reduced weight
 *
 * Usage: npx tsx scripts/test-fuzzy-attributes.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Load previous test results
const FUSION_RESULTS_PATH = join(process.cwd(), "multiframe-fusion-results.json");
const OUTPUT_PATH = join(process.cwd(), "fuzzy-attribute-test-results.json");

// ============================================================================
// FUZZY MATCHING DEFINITIONS
// ============================================================================

// Color similarity map - colors that are similar get partial credit
const COLOR_FAMILIES: Record<string, string[]> = {
  green: ["olive", "olive green", "sage", "sage green", "forest green", "army green", "khaki", "moss", "hunter green", "dark green", "light green"],
  blue: ["navy", "navy blue", "royal blue", "sky blue", "baby blue", "teal", "cobalt", "denim blue"],
  neutral: ["beige", "cream", "ivory", "tan", "taupe", "camel", "oatmeal", "sand"],
  brown: ["chocolate", "espresso", "chestnut", "cognac", "rust", "terracotta", "burnt orange"],
  pink: ["blush", "rose", "coral", "salmon", "dusty pink", "hot pink", "fuchsia"],
  red: ["burgundy", "wine", "maroon", "crimson", "scarlet", "cherry"],
  purple: ["lavender", "lilac", "plum", "violet", "mauve", "eggplant"],
  black: ["charcoal", "jet black", "onyx"],
  white: ["off-white", "ivory", "snow", "cream white"],
  gray: ["grey", "silver", "slate", "charcoal gray", "heather gray"],
};

// Knit type families - similar textures grouped together
const KNIT_FAMILIES: Record<string, string[]> = {
  textured_chunky: ["chunky", "cable", "cable knit", "basketweave", "popcorn"],
  textured_fine: ["ribbed", "rib knit", "waffle", "pointelle", "thermal"],
  smooth: ["jersey", "smooth", "fine knit", "stockinette", "flat knit"],
};

// Color tone similarity
const TONE_SIMILARITY: Record<string, string[]> = {
  muted: ["muted", "earthy", "dusty", "muted/earthy"],
  bright: ["bright", "vivid", "saturated", "bold"],
  pastel: ["pastel", "light", "soft", "pale"],
  dark: ["dark", "deep", "rich"],
};

// ============================================================================
// FUZZY MATCHING FUNCTIONS
// ============================================================================

interface FuzzyMatchResult {
  exactMatch: boolean;
  familyMatch: boolean;
  similarity: number; // 0-1
  reasoning: string;
}

/**
 * Fuzzy color matching
 * - Exact match: 100%
 * - Same shade variations: 90%
 * - Same color family: 70%
 * - Different family: 0%
 */
function fuzzyColorMatch(ref: string, cand: string): FuzzyMatchResult {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  // Exact match
  if (refLower === candLower) {
    return { exactMatch: true, familyMatch: true, similarity: 1.0, reasoning: "Exact color match" };
  }

  // Check if one contains the other (e.g., "olive" in "olive green")
  if (refLower.includes(candLower) || candLower.includes(refLower)) {
    return { exactMatch: false, familyMatch: true, similarity: 0.9, reasoning: "Color shade variation (90%)" };
  }

  // Find color families
  let refFamily: string | null = null;
  let candFamily: string | null = null;

  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    if (colors.some(c => refLower.includes(c) || c.includes(refLower))) {
      refFamily = family;
    }
    if (colors.some(c => candLower.includes(c) || c.includes(candLower))) {
      candFamily = family;
    }
  }

  // Same family
  if (refFamily && candFamily && refFamily === candFamily) {
    return { exactMatch: false, familyMatch: true, similarity: 0.7, reasoning: `Same color family: ${refFamily} (70%)` };
  }

  // Different family
  return { exactMatch: false, familyMatch: false, similarity: 0, reasoning: `Different color families: ${refFamily || 'unknown'} vs ${candFamily || 'unknown'}` };
}

/**
 * Fuzzy knit type matching
 * - Exact match: 100%
 * - Same family: 70%
 * - Different family: 0%
 */
function fuzzyKnitMatch(ref: string, cand: string): FuzzyMatchResult {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  // Exact match
  if (refLower === candLower) {
    return { exactMatch: true, familyMatch: true, similarity: 1.0, reasoning: "Exact knit type match" };
  }

  // Find knit families
  let refFamily: string | null = null;
  let candFamily: string | null = null;

  for (const [family, types] of Object.entries(KNIT_FAMILIES)) {
    if (types.some(t => refLower.includes(t) || t.includes(refLower))) {
      refFamily = family;
    }
    if (types.some(t => candLower.includes(t) || t.includes(candLower))) {
      candFamily = family;
    }
  }

  // Same family
  if (refFamily && candFamily && refFamily === candFamily) {
    return { exactMatch: false, familyMatch: true, similarity: 0.7, reasoning: `Same knit family: ${refFamily} (70%)` };
  }

  // Different family
  return { exactMatch: false, familyMatch: false, similarity: 0, reasoning: `Different knit families: ${refFamily || 'unknown'} vs ${candFamily || 'unknown'}` };
}

/**
 * Fuzzy tone matching
 */
function fuzzyToneMatch(ref: string, cand: string): FuzzyMatchResult {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  if (refLower === candLower) {
    return { exactMatch: true, familyMatch: true, similarity: 1.0, reasoning: "Exact tone match" };
  }

  // Check tone similarity
  for (const [tone, variants] of Object.entries(TONE_SIMILARITY)) {
    const refInTone = variants.some(v => refLower.includes(v) || v.includes(refLower));
    const candInTone = variants.some(v => candLower.includes(v) || v.includes(candLower));

    if (refInTone && candInTone) {
      return { exactMatch: false, familyMatch: true, similarity: 0.8, reasoning: `Same tone family: ${tone} (80%)` };
    }
  }

  return { exactMatch: false, familyMatch: false, similarity: 0, reasoning: "Different tones" };
}

/**
 * Generic exact match (for attributes without fuzzy logic)
 */
function exactMatch(ref: string, cand: string): FuzzyMatchResult {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  if (refLower === candLower) {
    return { exactMatch: true, familyMatch: true, similarity: 1.0, reasoning: "Exact match" };
  }
  return { exactMatch: false, familyMatch: false, similarity: 0, reasoning: `Mismatch: ${ref} vs ${cand}` };
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

interface AttributeScore {
  attribute: string;
  refValue: string;
  candValue: string;
  maxPoints: number;
  oldScore: number;      // Without fuzzy matching
  newScore: number;      // With fuzzy matching
  confidenceWeight: number;
  finalScore: number;    // newScore * confidenceWeight
  fuzzyMatch: FuzzyMatchResult;
}

interface ScoringResult {
  candidateTitle: string;
  oldTotalScore: number;
  newTotalScore: number;
  finalScore: number;    // With confidence weighting
  improvement: number;
  attributeScores: AttributeScore[];
}

function computeScores(
  refProfile: any,
  candAttrs: any,
  candTitle: string
): ScoringResult {
  const attributeScores: AttributeScore[] = [];

  // Helper to get confidence weight
  const getConfidenceWeight = (refConf: number, candConf: number): number => {
    const avgConf = (refConf + candConf) / 2;
    // Scale: 0.5 conf = 0.7 weight, 0.9 conf = 1.0 weight
    return Math.max(0.5, Math.min(1.0, 0.5 + avgConf * 0.5));
  };

  // Extract confidence values
  const refConfidence = refProfile.overallConfidence || 0.9;
  const candConfidence = candAttrs.confidence || 0.7;

  // ===== COLOR (40 points max) =====
  // Primary color: 25 points
  const colorMatch = fuzzyColorMatch(
    String(refProfile.primaryColor?.value || ""),
    candAttrs.primaryColor || ""
  );
  const oldColorScore = colorMatch.exactMatch ? 25 : 0;
  const newColorScore = Math.round(25 * colorMatch.similarity);
  const colorWeight = getConfidenceWeight(refConfidence, candConfidence);

  attributeScores.push({
    attribute: "Primary Color",
    refValue: String(refProfile.primaryColor?.value || ""),
    candValue: candAttrs.primaryColor || "",
    maxPoints: 25,
    oldScore: oldColorScore,
    newScore: newColorScore,
    confidenceWeight: colorWeight,
    finalScore: Math.round(newColorScore * colorWeight),
    fuzzyMatch: colorMatch,
  });

  // Color tone: 15 points
  const toneMatch = fuzzyToneMatch(
    String(refProfile.colorTone?.value || ""),
    candAttrs.colorTone || ""
  );
  const oldToneScore = toneMatch.exactMatch ? 15 : 0;
  const newToneScore = Math.round(15 * toneMatch.similarity);

  attributeScores.push({
    attribute: "Color Tone",
    refValue: String(refProfile.colorTone?.value || ""),
    candValue: candAttrs.colorTone || "",
    maxPoints: 15,
    oldScore: oldToneScore,
    newScore: newToneScore,
    confidenceWeight: colorWeight,
    finalScore: Math.round(newToneScore * colorWeight),
    fuzzyMatch: toneMatch,
  });

  // ===== STYLE (30 points max) =====
  // Neckline: 10 points
  const neckMatch = exactMatch(
    String(refProfile.neckline?.value || ""),
    candAttrs.neckline || ""
  );
  attributeScores.push({
    attribute: "Neckline",
    refValue: String(refProfile.neckline?.value || ""),
    candValue: candAttrs.neckline || "",
    maxPoints: 10,
    oldScore: neckMatch.exactMatch ? 10 : 0,
    newScore: neckMatch.exactMatch ? 10 : 0,
    confidenceWeight: colorWeight,
    finalScore: Math.round((neckMatch.exactMatch ? 10 : 0) * colorWeight),
    fuzzyMatch: neckMatch,
  });

  // Sleeves: 8 points
  const sleeveMatch = exactMatch(
    String(refProfile.sleeveLength?.value || ""),
    candAttrs.sleeveLength || ""
  );
  attributeScores.push({
    attribute: "Sleeve Length",
    refValue: String(refProfile.sleeveLength?.value || ""),
    candValue: candAttrs.sleeveLength || "",
    maxPoints: 8,
    oldScore: sleeveMatch.exactMatch ? 8 : 0,
    newScore: sleeveMatch.exactMatch ? 8 : 0,
    confidenceWeight: colorWeight,
    finalScore: Math.round((sleeveMatch.exactMatch ? 8 : 0) * colorWeight),
    fuzzyMatch: sleeveMatch,
  });

  // Body length: 8 points
  const lengthMatch = exactMatch(
    String(refProfile.bodyLength?.value || ""),
    candAttrs.bodyLength || ""
  );
  attributeScores.push({
    attribute: "Body Length",
    refValue: String(refProfile.bodyLength?.value || ""),
    candValue: candAttrs.bodyLength || "",
    maxPoints: 8,
    oldScore: lengthMatch.exactMatch ? 8 : 0,
    newScore: lengthMatch.exactMatch ? 8 : 0,
    confidenceWeight: colorWeight,
    finalScore: Math.round((lengthMatch.exactMatch ? 8 : 0) * colorWeight),
    fuzzyMatch: lengthMatch,
  });

  // Fit: 4 points
  const fitMatch = exactMatch(
    String(refProfile.fit?.value || ""),
    candAttrs.fit || ""
  );
  attributeScores.push({
    attribute: "Fit",
    refValue: String(refProfile.fit?.value || ""),
    candValue: candAttrs.fit || "",
    maxPoints: 4,
    oldScore: fitMatch.exactMatch ? 4 : 0,
    newScore: fitMatch.exactMatch ? 4 : 0,
    confidenceWeight: colorWeight,
    finalScore: Math.round((fitMatch.exactMatch ? 4 : 0) * colorWeight),
    fuzzyMatch: fitMatch,
  });

  // ===== MATERIAL (20 points max) =====
  // Knit type: 12 points - NOW WITH FUZZY MATCHING
  const knitMatch = fuzzyKnitMatch(
    String(refProfile.knitType?.value || ""),
    candAttrs.knitType || ""
  );
  const oldKnitScore = knitMatch.exactMatch ? 12 : 0;
  const newKnitScore = Math.round(12 * knitMatch.similarity);

  attributeScores.push({
    attribute: "Knit Type",
    refValue: String(refProfile.knitType?.value || ""),
    candValue: candAttrs.knitType || "",
    maxPoints: 12,
    oldScore: oldKnitScore,
    newScore: newKnitScore,
    confidenceWeight: colorWeight,
    finalScore: Math.round(newKnitScore * colorWeight),
    fuzzyMatch: knitMatch,
  });

  // Texture: 8 points
  const textureMatch = exactMatch(
    String(refProfile.texture?.value || ""),
    candAttrs.texture || ""
  );
  // Partial credit for texture even without exact match
  const oldTextureScore = textureMatch.exactMatch ? 8 : 4;
  const newTextureScore = textureMatch.exactMatch ? 8 : 4;

  attributeScores.push({
    attribute: "Texture",
    refValue: String(refProfile.texture?.value || ""),
    candValue: candAttrs.texture || "",
    maxPoints: 8,
    oldScore: oldTextureScore,
    newScore: newTextureScore,
    confidenceWeight: colorWeight,
    finalScore: Math.round(newTextureScore * colorWeight),
    fuzzyMatch: { ...textureMatch, similarity: textureMatch.exactMatch ? 1 : 0.5, reasoning: textureMatch.exactMatch ? "Exact match" : "Partial credit" },
  });

  // ===== DETAILS (10 points max) =====
  // Closures: 5 points
  const closuresMatch = refProfile.hasButtons?.value === candAttrs.hasButtons &&
                        refProfile.hasZipper?.value === candAttrs.hasZipper;
  attributeScores.push({
    attribute: "Closures",
    refValue: `btn:${refProfile.hasButtons?.value}, zip:${refProfile.hasZipper?.value}`,
    candValue: `btn:${candAttrs.hasButtons}, zip:${candAttrs.hasZipper}`,
    maxPoints: 5,
    oldScore: closuresMatch ? 5 : 0,
    newScore: closuresMatch ? 5 : 0,
    confidenceWeight: 1.0,
    finalScore: closuresMatch ? 5 : 0,
    fuzzyMatch: { exactMatch: closuresMatch, familyMatch: closuresMatch, similarity: closuresMatch ? 1 : 0, reasoning: closuresMatch ? "Match" : "Mismatch" },
  });

  // Pattern: 5 points
  const patternMatch = String(refProfile.patternType?.value || "solid") === (candAttrs.patternType || "solid");
  attributeScores.push({
    attribute: "Pattern",
    refValue: String(refProfile.patternType?.value || "solid"),
    candValue: candAttrs.patternType || "solid",
    maxPoints: 5,
    oldScore: patternMatch ? 5 : 0,
    newScore: patternMatch ? 5 : 0,
    confidenceWeight: 1.0,
    finalScore: patternMatch ? 5 : 0,
    fuzzyMatch: { exactMatch: patternMatch, familyMatch: patternMatch, similarity: patternMatch ? 1 : 0, reasoning: patternMatch ? "Match" : "Mismatch" },
  });

  // Calculate totals
  const oldTotalScore = attributeScores.reduce((sum, a) => sum + a.oldScore, 0);
  const newTotalScore = attributeScores.reduce((sum, a) => sum + a.newScore, 0);
  const finalScore = attributeScores.reduce((sum, a) => sum + a.finalScore, 0);

  return {
    candidateTitle: candTitle,
    oldTotalScore,
    newTotalScore,
    finalScore,
    improvement: newTotalScore - oldTotalScore,
    attributeScores,
  };
}

// ============================================================================
// MAIN TEST
// ============================================================================

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          FUZZY ATTRIBUTE MATCHING TEST                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "fuzzy_attribute_matching",
    testedAt: new Date().toISOString(),
    refinements: [
      "Fuzzy color matching (shade variations = 90%, same family = 70%)",
      "Knit type grouping (same family = 70%)",
      "Confidence-weighted scoring",
    ],
    results: [],
    comparison: null,
  };

  try {
    // Load previous fusion results
    console.log(`\n📂 Loading multi-frame fusion results...`);
    const fusionData = JSON.parse(readFileSync(FUSION_RESULTS_PATH, "utf-8"));
    const refProfile = fusionData.fusedProfile;
    const candidates = fusionData.candidateResults;

    console.log(`   ✅ Loaded reference profile and ${candidates.length} candidates`);

    console.log(`\n📋 Reference Profile:`);
    console.log(`   Color: ${refProfile.primaryColor?.value} (${refProfile.colorTone?.value})`);
    console.log(`   Neckline: ${refProfile.neckline?.value}`);
    console.log(`   Sleeves: ${refProfile.sleeveLength?.value}`);
    console.log(`   Length: ${refProfile.bodyLength?.value}`);
    console.log(`   Knit: ${refProfile.knitType?.value}`);

    // Score each candidate with old and new methods
    console.log(`\n📊 Computing Scores with Fuzzy Matching...\n`);

    const scoringResults: ScoringResult[] = [];

    for (const cand of candidates) {
      // Reconstruct candidate attributes from similarity breakdown
      const candAttrs = {
        primaryColor: cand.similarity.breakdown.find((b: any) => b.attr === "Color")?.cand || "",
        colorTone: cand.similarity.breakdown.find((b: any) => b.attr === "Tone")?.cand || "",
        neckline: cand.similarity.breakdown.find((b: any) => b.attr === "Neckline")?.cand || "",
        sleeveLength: cand.similarity.breakdown.find((b: any) => b.attr === "Sleeves")?.cand || "",
        bodyLength: cand.similarity.breakdown.find((b: any) => b.attr === "Length")?.cand || "",
        fit: cand.similarity.breakdown.find((b: any) => b.attr === "Fit")?.cand || "",
        knitType: cand.similarity.breakdown.find((b: any) => b.attr === "Knit")?.cand || "",
        texture: cand.similarity.breakdown.find((b: any) => b.attr === "Texture")?.cand || "",
        hasButtons: cand.similarity.breakdown.find((b: any) => b.attr === "Closures")?.cand?.includes("btn:true") || false,
        hasZipper: cand.similarity.breakdown.find((b: any) => b.attr === "Closures")?.cand?.includes("zip:true") || false,
        patternType: cand.similarity.breakdown.find((b: any) => b.attr === "Pattern")?.cand || "solid",
        confidence: 0.8,
      };

      const result = computeScores(refProfile, candAttrs, cand.title);
      scoringResults.push(result);
    }

    results.results = scoringResults;

    // Sort by final score
    scoringResults.sort((a, b) => b.finalScore - a.finalScore);

    // Display comparison
    console.log(`╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                  SCORE COMPARISON                          ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n📊 Old vs New Scores:\n`);
    console.log(`${"Product".padEnd(40)} | Old  | New  | Final | Δ`);
    console.log(`${"─".repeat(40)}-|------|------|-------|----`);

    for (const r of scoringResults) {
      const delta = r.improvement;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
      console.log(
        `${r.candidateTitle.substring(0, 39).padEnd(40)} | ${String(r.oldTotalScore).padStart(4)} | ${String(r.newTotalScore).padStart(4)} | ${String(r.finalScore).padStart(5)} | ${deltaStr.padStart(3)}`
      );
    }

    // Ranking comparison
    const oldRanking = [...scoringResults].sort((a, b) => b.oldTotalScore - a.oldTotalScore);
    const newRanking = [...scoringResults].sort((a, b) => b.finalScore - a.finalScore);

    console.log(`\n🏆 Ranking Comparison:\n`);
    console.log(`${"Rank".padStart(4)} | ${"Old Ranking".padEnd(35)} | ${"New Ranking".padEnd(35)}`);
    console.log(`${"─".repeat(4)}-|-${"─".repeat(35)}-|-${"─".repeat(35)}`);

    for (let i = 0; i < scoringResults.length; i++) {
      const oldItem = oldRanking[i];
      const newItem = newRanking[i];
      const changed = oldItem.candidateTitle !== newItem.candidateTitle ? "⚡" : "  ";
      console.log(
        `${String(i + 1).padStart(4)} | ${oldItem.candidateTitle.substring(0, 34).padEnd(35)} | ${newItem.candidateTitle.substring(0, 34).padEnd(35)} ${changed}`
      );
    }

    // Top match detailed breakdown
    const topMatch = newRanking[0];
    console.log(`\n📋 Top Match Detailed Breakdown: ${topMatch.candidateTitle}\n`);
    console.log(`${"Attribute".padEnd(15)} | Ref vs Cand                    | Old | New | Fuzzy Reasoning`);
    console.log(`${"─".repeat(15)}-|-${"─".repeat(30)}-|-----|-----|${"─".repeat(30)}`);

    for (const attr of topMatch.attributeScores) {
      const comparison = `${attr.refValue.substring(0, 12)} vs ${attr.candValue.substring(0, 12)}`;
      const status = attr.newScore === attr.maxPoints ? "✅" : (attr.newScore > 0 ? "⚠️" : "❌");
      console.log(
        `${status} ${attr.attribute.padEnd(13)} | ${comparison.padEnd(30)} | ${String(attr.oldScore).padStart(3)} | ${String(attr.newScore).padStart(3)} | ${attr.fuzzyMatch.reasoning.substring(0, 28)}`
      );
    }

    // Assessment
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                      ASSESSMENT                            ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    const topMatchChanged = oldRanking[0].candidateTitle !== newRanking[0].candidateTitle;
    const avgImprovement = scoringResults.reduce((sum, r) => sum + r.improvement, 0) / scoringResults.length;
    const topScoreImprovement = newRanking[0].finalScore - newRanking[0].oldTotalScore;

    // Score spread comparison
    const oldSpread = oldRanking[0].oldTotalScore - oldRanking[oldRanking.length - 1].oldTotalScore;
    const newSpread = newRanking[0].finalScore - newRanking[newRanking.length - 1].finalScore;

    // Gap between #1 and #2
    const oldGap = oldRanking[0].oldTotalScore - oldRanking[1].oldTotalScore;
    const newGap = newRanking[0].finalScore - newRanking[1].finalScore;

    console.log(`\n   Metrics:`);
    console.log(`   ├─ Top match changed: ${topMatchChanged ? "⚠️ Yes" : "✅ No (consistent)"}`);
    console.log(`   ├─ Average score improvement: ${avgImprovement > 0 ? "+" : ""}${avgImprovement.toFixed(1)} pts`);
    console.log(`   ├─ Top match improvement: ${topScoreImprovement > 0 ? "+" : ""}${topScoreImprovement} pts`);
    console.log(`   ├─ Score spread (old → new): ${oldSpread} → ${newSpread} pts`);
    console.log(`   └─ #1 to #2 gap (old → new): ${oldGap} → ${newGap} pts`);

    results.comparison = {
      topMatchChanged,
      oldTopMatch: oldRanking[0].candidateTitle,
      newTopMatch: newRanking[0].candidateTitle,
      avgImprovement,
      topScoreImprovement,
      oldSpread,
      newSpread,
      oldGap,
      newGap,
    };

    // Verdict
    console.log(`\n   Verdict:`);
    if (!topMatchChanged && newGap >= oldGap) {
      console.log(`   ✅ IMPROVEMENT: Same top match with better/equal separation`);
      console.log(`   Fuzzy matching added nuance without changing the winner.`);
    } else if (!topMatchChanged) {
      console.log(`   ⚠️ MARGINAL: Same top match but reduced separation`);
      console.log(`   Consider tuning fuzzy weights.`);
    } else {
      console.log(`   ⚠️ TOP MATCH CHANGED: Review if new ranking is more accurate`);
      console.log(`   Old #1: ${oldRanking[0].candidateTitle} (${oldRanking[0].oldTotalScore})`);
      console.log(`   New #1: ${newRanking[0].candidateTitle} (${newRanking[0].finalScore})`);
    }

    // Impact analysis
    console.log(`\n   Fuzzy Matching Impact:`);
    const colorImpacts = scoringResults.map(r =>
      r.attributeScores.find(a => a.attribute === "Primary Color")
    ).filter(Boolean);
    const knitImpacts = scoringResults.map(r =>
      r.attributeScores.find(a => a.attribute === "Knit Type")
    ).filter(Boolean);

    const colorBenefited = colorImpacts.filter(a => a!.newScore > a!.oldScore).length;
    const knitBenefited = knitImpacts.filter(a => a!.newScore > a!.oldScore).length;

    console.log(`   ├─ Fuzzy color helped ${colorBenefited}/${colorImpacts.length} candidates`);
    console.log(`   └─ Fuzzy knit helped ${knitBenefited}/${knitImpacts.length} candidates`);

    // Save results
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    results.error = String(error);
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    process.exit(1);
  }
}

// Run the test
runTest();
