/**
 * Test Remaining OOTD Product Schemas
 *
 * Tests the category-schemas.ts on products not yet tested:
 * - Canvas Tote Bag (Bags:Totes)
 * - Smartwatch (Jewelry:Watches)
 * - Polka Dot Scarf (Accessories:Scarves)
 * - Olive Green Scrunchie (Accessories:Hair Accessories)
 * - White Crew Socks (Accessories:Socks)
 *
 * Usage: npx tsx scripts/test-remaining-ootd-schemas.ts
 */

import { config } from "dotenv";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import OpenAI from "openai";
import {
  CATEGORY_SCHEMAS,
  getSchema,
  inferSubcategory,
  ProductCategory,
  Subcategory,
  CategorySchema,
} from "../lib/matching/category-schemas";

config({ path: join(process.cwd(), ".env.local") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FRAMES_DIR = join(process.cwd(), "test-output/frames-5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7");
const OUTPUT_PATH = join(process.cwd(), "remaining-ootd-schema-test-results.json");

// Test cases for the remaining OOTD products
const TEST_CASES = [
  {
    name: "Canvas Tote Bag",
    category: "Bags" as ProductCategory,
    subcategory: "Totes" as Subcategory,
    frameIndex: 8, // frame-008.jpg (0-indexed: 7 in data, but files are 1-indexed)
    description: "White/beige canvas tote bag with black straps",
  },
  {
    name: "Smartwatch with Black Band",
    category: "Jewelry" as ProductCategory,
    subcategory: "Watches" as Subcategory,
    frameIndex: 10, // frame-010.jpg
    description: "Black smartwatch on wrist",
  },
  {
    name: "Black and White Polka Dot Scarf",
    category: "Accessories" as ProductCategory,
    subcategory: "Scarves" as Subcategory,
    frameIndex: 5, // frame-005.jpg
    description: "Polka dot neck scarf in black and white",
  },
  {
    name: "Olive Green Hair Scrunchie",
    category: "Accessories" as ProductCategory,
    subcategory: "Hair Accessories" as Subcategory,
    frameIndex: 7, // frame-007.jpg
    description: "Olive green fabric scrunchie on head",
  },
  {
    name: "White Crew Socks",
    category: "Accessories" as ProductCategory,
    subcategory: "Socks" as Subcategory,
    frameIndex: 4, // frame-004.jpg
    description: "White cotton crew socks visible with loafers",
  },
];

interface ExtractionResult {
  productName: string;
  category: ProductCategory;
  subcategory: Subcategory;
  schemaKey: string;
  frameIndex: number;
  extractedAttributes: Record<string, any>;
  expectedAttributesCoverage: {
    attribute: string;
    extracted: boolean;
    value: any;
  }[];
  coveragePercent: number;
  confidence: number;
  rawResponse: string;
}

async function extractAttributesWithSchema(
  imageBase64: string,
  schema: CategorySchema,
  productDescription: string
): Promise<{ attributes: Record<string, any>; rawResponse: string } | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${schema.extractionPrompt}\n\nProduct context: ${productDescription}`,
            },
            {
              type: "image_url",
              image_url: { url: imageBase64, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`   ⚠️ No JSON found in response`);
      return { attributes: {}, rawResponse: content };
    }

    const attributes = JSON.parse(jsonMatch[0]);
    return { attributes, rawResponse: content };
  } catch (error) {
    console.error(`   ❌ Error extracting attributes:`, error);
    return null;
  }
}

function flattenAttributes(obj: Record<string, any>, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenAttributes(value, newKey));
    } else {
      result[key] = value; // Use just the key without prefix for matching
    }
  }

  return result;
}

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║    REMAINING OOTD PRODUCTS - SCHEMA TEST                   ║");
  console.log("║    Testing: Tote Bag, Smartwatch, Scarf, Scrunchie, Socks  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: ExtractionResult[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`Testing: ${testCase.name}`);
    console.log(`Schema: ${testCase.category}:${testCase.subcategory}`);
    console.log(`Frame: ${testCase.frameIndex}`);
    console.log(`${"═".repeat(60)}`);

    // Get schema
    const schema = getSchema(testCase.category, testCase.subcategory);
    if (!schema) {
      console.log(`   ❌ Schema not found: ${testCase.category}:${testCase.subcategory}`);
      continue;
    }

    // Load frame
    const framePath = join(FRAMES_DIR, `frame-${String(testCase.frameIndex).padStart(3, "0")}.jpg`);
    if (!existsSync(framePath)) {
      console.log(`   ⚠️ Frame not found: ${framePath}`);
      continue;
    }

    const buffer = readFileSync(framePath);
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    console.log(`\n📋 Extracting with ${testCase.category}:${testCase.subcategory} schema...`);
    console.log(`   Schema attributes: ${schema.attributes.join(", ")}`);
    console.log(`   Deal-breakers: ${schema.dealBreakers.join(", ")}`);

    const result = await extractAttributesWithSchema(base64, schema, testCase.description);

    if (!result) {
      console.log(`   ❌ Extraction failed`);
      continue;
    }

    // Flatten nested attributes for easier checking
    const flatAttrs = flattenAttributes(result.attributes);

    console.log(`\n   Extracted attributes:`);
    for (const [key, value] of Object.entries(flatAttrs)) {
      if (key === "CONFIDENCE" || key === "confidence") continue;
      const isDealBreaker = schema.dealBreakers.includes(key);
      const icon = isDealBreaker ? "🔴" : "  ";
      const valueStr = typeof value === "boolean" ? String(value) : (value || "not_visible");
      console.log(`   ${icon} ${key.padEnd(20)}: ${valueStr}`);
    }

    // Check expected attributes coverage
    const coverage = schema.attributes.map(attr => ({
      attribute: attr,
      extracted: flatAttrs[attr] !== undefined &&
                 flatAttrs[attr] !== "not_visible" &&
                 flatAttrs[attr] !== "unknown" &&
                 flatAttrs[attr] !== null,
      value: flatAttrs[attr],
    }));

    const extractedCount = coverage.filter(c => c.extracted).length;
    const coveragePercent = (extractedCount / schema.attributes.length) * 100;
    const confidence = flatAttrs.confidence || flatAttrs.CONFIDENCE || 0;

    console.log(`\n   Coverage: ${extractedCount}/${schema.attributes.length} (${coveragePercent.toFixed(0)}%)`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(0)}%`);

    // Show missing attributes
    const missing = coverage.filter(c => !c.extracted);
    if (missing.length > 0) {
      console.log(`   Missing: ${missing.map(m => m.attribute).join(", ")}`);
    }

    results.push({
      productName: testCase.name,
      category: testCase.category,
      subcategory: testCase.subcategory,
      schemaKey: `${testCase.category}:${testCase.subcategory}`,
      frameIndex: testCase.frameIndex,
      extractedAttributes: result.attributes,
      expectedAttributesCoverage: coverage,
      coveragePercent,
      confidence,
      rawResponse: result.rawResponse,
    });
  }

  // Summary
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(60)}`);

  console.log(`\n${"Product".padEnd(35)} | Schema Key              | Coverage | Conf`);
  console.log(`${"-".repeat(35)}-|-------------------------|----------|------`);

  for (const result of results) {
    console.log(
      `${result.productName.substring(0, 35).padEnd(35)} | ${result.schemaKey.padEnd(23)} | ${(result.coveragePercent.toFixed(0) + "%").padStart(7)} | ${(result.confidence * 100).toFixed(0)}%`
    );
  }

  // Calculate averages
  const avgCoverage = results.reduce((sum, r) => sum + r.coveragePercent, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  console.log(`\n📊 Overall Results:`);
  console.log(`   Average Coverage: ${avgCoverage.toFixed(0)}%`);
  console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  console.log(`   Products Tested: ${results.length}/${TEST_CASES.length}`);

  // Save results
  const output = {
    testType: "remaining_ootd_schema_validation",
    testedAt: new Date().toISOString(),
    version: "3.0",
    results,
    summary: {
      totalTests: results.length,
      avgCoverage,
      avgConfidence,
      bySchema: Object.fromEntries(
        results.map(r => [
          r.schemaKey,
          {
            coverage: r.coveragePercent,
            confidence: r.confidence,
            missing: r.expectedAttributesCoverage.filter(c => !c.extracted).map(c => c.attribute),
          },
        ])
      ),
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n\n📁 Results saved to: ${OUTPUT_PATH}`);

  console.log(`\n✅ Remaining OOTD schema test complete!`);
}

runTest().catch(console.error);
