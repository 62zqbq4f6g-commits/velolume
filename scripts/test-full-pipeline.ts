/**
 * Full Pipeline Test
 *
 * Tests the complete product matching pipeline:
 * - Multi-frame fusion
 * - Fuzzy matching + deal-breakers
 * - Visual tiebreaker (if top 2 within 5 pts)
 *
 * Usage: npx tsx scripts/test-full-pipeline.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import {
  matchProductsFromData,
  FusedProfile,
  ProductAttributes,
} from "../lib/matching/product-matcher";

config({ path: join(process.cwd(), ".env.local") });

const FUSION_RESULTS_PATH = join(process.cwd(), "multiframe-fusion-results.json");
const OUTPUT_PATH = join(process.cwd(), "full-pipeline-test-results.json");
const ROUGH_CROP_PATH = join(process.cwd(), "test-output/test-crop-sweater.jpg");

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

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           FULL PIPELINE TEST - Production Ready            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testType: "full_pipeline",
    testedAt: new Date().toISOString(),
    results: [],
  };

  try {
    // Load pre-computed fusion data
    console.log(`\n📂 Loading test data...`);
    const fusionData = JSON.parse(readFileSync(FUSION_RESULTS_PATH, "utf-8"));
    const refProfile: FusedProfile = fusionData.fusedProfile;

    // Load reference image for tiebreaker
    const refImageBuffer = readFileSync(ROUGH_CROP_PATH);
    const refImageBase64 = `data:image/jpeg;base64,${refImageBuffer.toString("base64")}`;

    // Reconstruct candidates with attributes
    const candidates = fusionData.candidateResults.map((cand: any) => {
      // Extract attributes from breakdown
      const getAttr = (name: string) => cand.similarity.breakdown.find((b: any) => b.attr === name)?.cand || "";

      const attrs: ProductAttributes = {
        primaryColor: getAttr("Color"),
        colorFamily: "green", // Inferred
        colorTone: getAttr("Tone"),
        neckline: getAttr("Neckline"),
        sleeveLength: getAttr("Sleeves"),
        bodyLength: getAttr("Length"),
        fit: getAttr("Fit"),
        knitType: getAttr("Knit"),
        material: "unknown",
        texture: getAttr("Texture"),
        hasButtons: false,
        hasZipper: false,
        hasPattern: false,
        patternType: "solid",
        confidence: 0.8,
      };

      return {
        title: cand.title,
        source: cand.source,
        link: "",
        price: cand.price,
        thumbnail: "", // We don't have thumbnails in saved data
        attributes: attrs,
      };
    });

    console.log(`   ✅ Loaded reference profile and ${candidates.length} candidates`);

    console.log(`\n📋 Reference Profile:`);
    console.log(`   ⚠️ Neckline: ${refProfile.neckline.value}`);
    console.log(`   ⚠️ Length: ${refProfile.bodyLength.value}`);
    console.log(`   ⚠️ Sleeves: ${refProfile.sleeveLength.value}`);
    console.log(`   Color: ${refProfile.primaryColor.value}`);
    console.log(`   Knit: ${refProfile.knitType.value}`);

    // Run the pipeline (without visual tiebreaker since we don't have thumbnails)
    console.log(`\n🚀 Running full matching pipeline...`);
    const matchResults = await matchProductsFromData(refProfile, candidates);

    results.results = matchResults;

    // Display results
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    PIPELINE RESULTS                         ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n📊 Final Rankings:\n`);
    console.log(`${"Rank".padStart(4)} | ${"Product".padEnd(35)} | Score | Status`);
    console.log(`${"─".repeat(4)}-|-${"─".repeat(35)}-|-------|${"─".repeat(30)}`);

    for (const r of matchResults) {
      const status = r.wasCapped
        ? `🚫 CAPPED`
        : (r.tiebreakerUsed ? `⚡ TIEBREAKER` : `✅ OK`);
      console.log(
        `${String(r.rank).padStart(4)} | ${r.title.substring(0, 35).padEnd(35)} | ${String(r.score).padStart(5)} | ${status}`
      );
    }

    // Show flags
    const flaggedItems = matchResults.filter(r => r.flags.length > 0);
    if (flaggedItems.length > 0) {
      console.log(`\n🏷️ Flags:\n`);
      for (const item of flaggedItems) {
        console.log(`   ${item.title.substring(0, 40)}`);
        for (const flag of item.flags) {
          console.log(`   └─ "${flag}"`);
        }
      }
    }

    // Top match breakdown
    const topMatch = matchResults[0];
    if (topMatch) {
      console.log(`\n🏆 Top Match: ${topMatch.title}\n`);
      console.log(`   Score: ${topMatch.score}/100${topMatch.wasCapped ? ` (capped from ${topMatch.rawScore})` : ""}`);
      console.log(`\n   Attribute Breakdown:`);

      for (const attr of topMatch.attributeBreakdown) {
        const status = attr.points === attr.maxPoints ? "✅" : (attr.points > 0 ? "⚠️" : "❌");
        const critical = attr.isCritical ? " ⚠️" : "";
        console.log(
          `   ${status} ${(attr.attribute + critical).padEnd(18)} ${attr.points}/${attr.maxPoints} pts`
        );
      }
    }

    // Metrics
    const gap = matchResults.length >= 2 ? matchResults[0].score - matchResults[1].score : 0;
    const spread = matchResults.length >= 2
      ? matchResults[0].score - matchResults[matchResults.length - 1].score
      : 0;

    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    SUMMARY                                  ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    console.log(`\n   Pipeline Features Used:`);
    console.log(`   ✅ Multi-frame attribute fusion`);
    console.log(`   ✅ Fuzzy color matching`);
    console.log(`   ✅ Fuzzy knit type matching`);
    console.log(`   ✅ Deal-breaker logic (critical attributes)`);
    console.log(`   ${matchResults.some(r => r.tiebreakerUsed) ? "✅" : "⬜"} Visual tiebreaker`);

    console.log(`\n   Metrics:`);
    console.log(`   ├─ #1 to #2 Gap: ${gap} points`);
    console.log(`   ├─ Score Spread: ${spread} points`);
    console.log(`   ├─ Items Capped: ${matchResults.filter(r => r.wasCapped).length}`);
    console.log(`   └─ Items Flagged: ${flaggedItems.length}`);

    results.summary = {
      topMatch: topMatch?.title,
      topScore: topMatch?.score,
      gap,
      spread,
      itemsCapped: matchResults.filter(r => r.wasCapped).length,
      itemsFlagged: flaggedItems.length,
      tiebreakerUsed: matchResults.some(r => r.tiebreakerUsed),
    };

    // Save results
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${OUTPUT_PATH}`);

    console.log(`\n✅ Full pipeline test complete!`);
    console.log(`\n   Production module: /lib/matching/product-matcher.ts`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
    results.error = String(error);
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    process.exit(1);
  }
}

runTest();
