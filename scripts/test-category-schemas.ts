/**
 * Test Category-Specific Schemas
 *
 * Tests the updated product-matcher v2.0 with category-specific schemas.
 * Validates extraction and scoring across:
 * - Clothing (sweater, shorts)
 * - Footwear (loafers)
 * - Accessories (sunglasses)
 * - Jewelry (earrings)
 *
 * Usage: npx tsx scripts/test-category-schemas.ts
 */

import { config } from "dotenv";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  extractAttributesFromImage,
  ProductCategory,
  ClothingAttributes,
  FootwearAttributes,
  SunglassesAttributes,
  EarringsAttributes,
} from "../lib/matching/product-matcher";

config({ path: join(process.cwd(), ".env.local") });

const FRAMES_DIR = join(process.cwd(), "test-output/frames-5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7");
const OUTPUT_PATH = join(process.cwd(), "category-schema-test-results.json");

// Test cases for different product categories
const TEST_CASES = [
  {
    name: "Olive Green Sweater",
    category: "Clothing" as ProductCategory,
    subcategory: "Sweater",
    frameIndex: 3, // Good view of sweater
    expectedAttributes: ["primaryColor", "neckline", "sleeveLength", "bodyLength", "fit", "knitType"],
  },
  {
    name: "Light Blue Denim Shorts",
    category: "Clothing" as ProductCategory,
    subcategory: "Shorts",
    frameIndex: 2, // Good view of shorts
    expectedAttributes: ["primaryColor", "material", "fit"],
  },
  {
    name: "Black Patent Leather Loafers",
    category: "Footwear" as ProductCategory,
    subcategory: "Loafers",
    frameIndex: 3, // Best view of shoes
    expectedAttributes: ["primaryColor", "finish", "toeShape", "heelHeight", "closure", "upperMaterial"],
  },
  {
    name: "Tortoiseshell Sunglasses",
    category: "Accessories" as ProductCategory,
    subcategory: "Sunglasses",
    frameIndex: 6, // Good view of face/sunglasses
    expectedAttributes: ["frameColor", "frameShape", "framePattern", "lensColor", "style"],
  },
  {
    name: "Silver Hoop Earrings",
    category: "Jewelry" as ProductCategory,
    subcategory: "Earrings",
    frameIndex: 9, // Good view of earrings
    expectedAttributes: ["metalColor", "earringType", "size", "shape", "metalFinish"],
  },
];

interface TestResult {
  name: string;
  category: ProductCategory;
  subcategory: string;
  frameIndex: number;
  extractedAttributes: Record<string, any>;
  expectedAttributesCoverage: {
    attribute: string;
    extracted: boolean;
    value: any;
  }[];
  coveragePercent: number;
  confidence: number;
}

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       CATEGORY-SPECIFIC SCHEMA TEST - v2.0                 ║");
  console.log("║   Testing extraction across Clothing, Footwear,            ║");
  console.log("║   Accessories (Sunglasses), and Jewelry (Earrings)         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: TestResult[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`Testing: ${testCase.name}`);
    console.log(`Category: ${testCase.category} / ${testCase.subcategory}`);
    console.log(`Frame: ${testCase.frameIndex}`);
    console.log(`${"═".repeat(60)}`);

    const framePath = join(FRAMES_DIR, `frame-${String(testCase.frameIndex).padStart(3, "0")}.jpg`);

    if (!existsSync(framePath)) {
      console.log(`   ⚠️ Frame not found: ${framePath}`);
      continue;
    }

    const buffer = readFileSync(framePath);
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    console.log(`\n📋 Extracting attributes with ${testCase.category} schema...`);

    const attributes = await extractAttributesFromImage(
      base64,
      testCase.category,
      `Testing ${testCase.name}`,
      testCase.subcategory
    );

    if (!attributes) {
      console.log(`   ❌ Extraction failed`);
      continue;
    }

    console.log(`\n   Extracted attributes:`);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "confidence") continue;
      const valueStr = typeof value === "boolean" ? String(value) : (value || "not_visible");
      const isExpected = testCase.expectedAttributes.includes(key);
      const icon = isExpected ? "⚠️" : "  ";
      console.log(`   ${icon} ${key.padEnd(20)}: ${valueStr}`);
    }

    // Check expected attributes coverage
    const coverage = testCase.expectedAttributes.map(attr => ({
      attribute: attr,
      extracted: (attributes as any)[attr] !== undefined && (attributes as any)[attr] !== "not_visible" && (attributes as any)[attr] !== "unknown",
      value: (attributes as any)[attr],
    }));

    const extractedCount = coverage.filter(c => c.extracted).length;
    const coveragePercent = (extractedCount / testCase.expectedAttributes.length) * 100;

    console.log(`\n   Coverage: ${extractedCount}/${testCase.expectedAttributes.length} (${coveragePercent.toFixed(0)}%)`);
    console.log(`   Confidence: ${((attributes as any).confidence * 100).toFixed(0)}%`);

    results.push({
      name: testCase.name,
      category: testCase.category,
      subcategory: testCase.subcategory,
      frameIndex: testCase.frameIndex,
      extractedAttributes: attributes as any,
      expectedAttributesCoverage: coverage,
      coveragePercent,
      confidence: (attributes as any).confidence || 0,
    });
  }

  // Summary
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(60)}`);

  console.log(`\n${"Product".padEnd(30)} | Category     | Coverage | Confidence`);
  console.log(`${"-".repeat(30)}-|--------------|----------|------------`);

  for (const result of results) {
    console.log(
      `${result.name.substring(0, 30).padEnd(30)} | ${result.category.padEnd(12)} | ${(result.coveragePercent.toFixed(0) + "%").padStart(7)} | ${(result.confidence * 100).toFixed(0)}%`
    );
  }

  // Category-specific analysis
  const byCategory: Record<string, TestResult[]> = {};
  for (const result of results) {
    if (!byCategory[result.category]) byCategory[result.category] = [];
    byCategory[result.category].push(result);
  }

  console.log(`\n\n📊 Category Analysis:`);
  for (const [category, categoryResults] of Object.entries(byCategory)) {
    const avgCoverage = categoryResults.reduce((sum, r) => sum + r.coveragePercent, 0) / categoryResults.length;
    const avgConfidence = categoryResults.reduce((sum, r) => sum + r.confidence, 0) / categoryResults.length;
    console.log(`\n   ${category}:`);
    console.log(`   └─ Avg Coverage: ${avgCoverage.toFixed(0)}%`);
    console.log(`   └─ Avg Confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  }

  // Save results
  const output = {
    testType: "category_schema_validation",
    testedAt: new Date().toISOString(),
    version: "2.0",
    results,
    summary: {
      totalTests: results.length,
      avgCoverage: results.reduce((sum, r) => sum + r.coveragePercent, 0) / results.length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).map(([cat, res]) => [
          cat,
          {
            avgCoverage: res.reduce((sum, r) => sum + r.coveragePercent, 0) / res.length,
            avgConfidence: res.reduce((sum, r) => sum + r.confidence, 0) / res.length,
          },
        ])
      ),
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n\n📁 Results saved to: ${OUTPUT_PATH}`);

  console.log(`\n✅ Category schema test complete!`);
}

runTest().catch(console.error);
