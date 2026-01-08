/**
 * Multi-Product Category Test
 *
 * Tests the product matching pipeline across different product categories
 * to identify where the current sweater-focused schema fails.
 *
 * Products tested from OOTD video (5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7):
 * - Olive Green Knit Crop Sweater (Clothing - sweater)
 * - Light Blue Denim Shorts (Clothing - shorts)
 * - Black Patent Leather Loafers (Footwear)
 * - Oversized Tortoiseshell Sunglasses (Accessories)
 * - Silver Hoop Earrings (Jewelry)
 *
 * Usage: npx tsx scripts/test-multi-product-categories.ts
 */

import { config } from "dotenv";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import OpenAI from "openai";

config({ path: join(process.cwd(), ".env.local") });

const FRAMES_DIR = join(process.cwd(), "test-output/frames-5bc6491c-3ac5-4945-a11c-07b9d7d3ccf7");
const OUTPUT_PATH = join(process.cwd(), "multi-product-category-test-results.json");

// Products to test with their categories and relevant frames
const TEST_PRODUCTS = [
  {
    name: "Olive Green Knit Crop Sweater",
    category: "Clothing",
    subcategory: "Sweater",
    frameIndices: [0, 1, 3, 6],
    searchTerms: ["olive green", "knit crop sweater", "casual sweater"],
    currentSchemaRelevance: "high", // Current schema was designed for this
  },
  {
    name: "Light Blue Denim Shorts",
    category: "Clothing",
    subcategory: "Shorts",
    frameIndices: [1, 2, 3, 9],
    searchTerms: ["light blue", "denim shorts", "casual shorts"],
    currentSchemaRelevance: "medium", // Some attributes apply
  },
  {
    name: "Black Patent Leather Loafers",
    category: "Footwear",
    subcategory: "Loafers",
    frameIndices: [2, 3, 9, 10],
    searchTerms: ["black loafers", "patent leather", "women's shoes"],
    currentSchemaRelevance: "low", // Most attributes don't apply
  },
  {
    name: "Oversized Tortoiseshell Sunglasses",
    category: "Accessories",
    subcategory: "Sunglasses",
    frameIndices: [4, 5, 6, 7],
    searchTerms: ["oversized sunglasses", "tortoiseshell", "trendy eyewear"],
    currentSchemaRelevance: "low", // Most attributes don't apply
  },
  {
    name: "Silver Hoop Earrings",
    category: "Jewelry",
    subcategory: "Earrings",
    frameIndices: [8, 9, 10, 11],
    searchTerms: ["silver hoop earrings", "minimalist jewelry", "metal hoops"],
    currentSchemaRelevance: "low", // Most attributes don't apply
  },
];

// Current sweater-focused schema
const CURRENT_EXTRACTION_PROMPT = (category: string, subcategory: string) => `You are a precise product attribute extractor. Analyze this ${category} (${subcategory}) image.

Extract these attributes. Use "not_visible" if an attribute cannot be determined from this image.

**COLOR:**
- primaryColor: Exact color name (e.g., "olive green", "navy blue")
- colorFamily: Broad family (green, blue, red, neutral, etc.)
- colorTone: muted/earthy, bright/vivid, pastel, dark

**STYLE (for clothing):**
- neckline: crew, mock, v-neck, turtleneck, scoop, boat, collared, off-shoulder, or "not_applicable"
- sleeveLength: long, short, 3/4, sleeveless, or "not_applicable"
- bodyLength: crop, regular, long, or "not_applicable"
- fit: fitted, relaxed, oversized, or "not_applicable"

**MATERIAL/TEXTURE:**
- knitType: cable, ribbed, waffle, chunky, smooth, or "not_applicable"
- material: cotton, wool, acrylic, cashmere, blend, leather, metal, plastic, or "unknown"
- texture: chunky/thick, medium, fine/thin, smooth, glossy

**DETAILS:**
- hasButtons: true/false
- hasZipper: true/false
- hasPattern: true/false
- patternType: solid, striped, colorblock, tortoiseshell, etc.

**CONFIDENCE:** How clearly can you see the item? (0.0-1.0)

Respond with JSON only.`;

// Category-specific extraction prompts
const CATEGORY_PROMPTS: Record<string, (subcategory: string) => string> = {
  Footwear: (subcategory: string) => `You are a precise footwear attribute extractor. Analyze this ${subcategory} image.

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy/patent, suede, textured

**STYLE:**
- toeShape: round, pointed, square, almond
- heelHeight: flat, low, mid, high
- heelType: none, block, stiletto, wedge, platform
- closure: slip-on, lace-up, buckle, zipper, velcro

**MATERIAL:**
- upperMaterial: leather, suede, canvas, synthetic, fabric
- soleMaterial: rubber, leather, synthetic
- texture: smooth, textured, woven

**DETAILS:**
- hasBranding: true/false
- hasAccents: true/false (buckles, bows, studs)
- accentType: buckle, bow, tassel, chain, none

**CONFIDENCE:** How clearly can you see the item? (0.0-1.0)

Respond with JSON only.`,

  Accessories: (subcategory: string) => {
    if (subcategory === "Sunglasses") {
      return `You are a precise eyewear attribute extractor. Analyze these sunglasses.

Extract these attributes. Use "not_visible" if cannot be determined.

**FRAME:**
- frameColor: Exact color name
- frameMaterial: plastic, metal, acetate, mixed
- framePattern: solid, tortoiseshell, gradient, patterned
- frameShape: oversized, round, square, cat-eye, aviator, rectangular, oval

**LENSES:**
- lensColor: black, brown, gray, blue, gradient, mirrored
- lensTint: dark, medium, light

**STYLE:**
- style: classic, trendy, sporty, vintage, luxury
- bridgeType: standard, keyhole, double

**DETAILS:**
- hasBranding: true/false
- hasAccents: true/false

**CONFIDENCE:** (0.0-1.0)

Respond with JSON only.`;
    }
    return CURRENT_EXTRACTION_PROMPT("Accessories", subcategory);
  },

  Jewelry: (subcategory: string) => {
    if (subcategory === "Earrings") {
      return `You are a precise jewelry attribute extractor. Analyze these earrings.

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- metalColor: gold, silver, rose gold, bronze, copper, mixed
- metalFinish: polished, matte, brushed, hammered
- metalType: solid, plated, filled

**STYLE:**
- earringType: hoop, stud, drop, dangle, huggie, chandelier, threader
- size: small, medium, large, oversized
- shape: round, oval, geometric, irregular

**DETAILS:**
- hasGemstones: true/false
- gemstoneType: diamond, pearl, crystal, none
- hasDangles: true/false
- closureType: post, leverback, hook, clip-on

**AESTHETIC:**
- style: minimalist, statement, classic, bohemian, trendy

**CONFIDENCE:** (0.0-1.0)

Respond with JSON only.`;
    }
    return CURRENT_EXTRACTION_PROMPT("Jewelry", subcategory);
  },
};

interface ExtractionResult {
  productName: string;
  category: string;
  subcategory: string;
  frameIndex: number;
  promptType: "current_schema" | "category_specific";
  attributes: Record<string, any>;
  applicableAttributeCount: number;
  notApplicableCount: number;
  notVisibleCount: number;
  completeness: number;
}

interface ProductTestResult {
  productName: string;
  category: string;
  subcategory: string;
  currentSchemaRelevance: string;
  currentSchemaResults: {
    extractions: ExtractionResult[];
    averageCompleteness: number;
    notApplicableRate: number;
    issues: string[];
  };
  categorySpecificResults?: {
    extractions: ExtractionResult[];
    averageCompleteness: number;
    improvement: number;
  };
}

async function extractWithPrompt(
  imageBase64: string,
  prompt: string,
  promptType: "current_schema" | "category_specific"
): Promise<Record<string, any>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error(`[Test] Extraction error:`, error);
    return {};
  }
}

function analyzeExtraction(attrs: Record<string, any>): {
  applicable: number;
  notApplicable: number;
  notVisible: number;
  completeness: number;
} {
  let applicable = 0;
  let notApplicable = 0;
  let notVisible = 0;
  let total = 0;

  for (const [key, value] of Object.entries(attrs)) {
    if (key === "confidence") continue;
    total++;

    if (value === "not_applicable" || value === "N/A") {
      notApplicable++;
    } else if (value === "not_visible" || value === "unknown") {
      notVisible++;
    } else if (value !== null && value !== undefined && value !== "") {
      applicable++;
    }
  }

  const completeness = total > 0 ? (applicable / total) * 100 : 0;

  return { applicable, notApplicable, notVisible, completeness };
}

async function testProduct(product: typeof TEST_PRODUCTS[0]): Promise<ProductTestResult> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Testing: ${product.name}`);
  console.log(`Category: ${product.category} / ${product.subcategory}`);
  console.log(`Current schema relevance: ${product.currentSchemaRelevance}`);
  console.log(`${"═".repeat(60)}`);

  const currentSchemaExtractions: ExtractionResult[] = [];
  const categorySpecificExtractions: ExtractionResult[] = [];
  const issues: string[] = [];

  // Test current schema on each frame
  console.log(`\n📋 Testing CURRENT schema (sweater-focused)...`);

  for (const frameIndex of product.frameIndices) {
    const framePath = join(FRAMES_DIR, `frame-${String(frameIndex + 1).padStart(3, "0")}.jpg`);

    if (!existsSync(framePath)) {
      console.log(`   ⚠️ Frame ${frameIndex + 1} not found`);
      continue;
    }

    const buffer = readFileSync(framePath);
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    const prompt = CURRENT_EXTRACTION_PROMPT(product.category, product.subcategory);
    const attrs = await extractWithPrompt(base64, prompt, "current_schema");
    const analysis = analyzeExtraction(attrs);

    console.log(`   Frame ${frameIndex + 1}: ${analysis.applicable} applicable, ${analysis.notApplicable} N/A, ${analysis.notVisible} not visible (${analysis.completeness.toFixed(0)}% complete)`);

    currentSchemaExtractions.push({
      productName: product.name,
      category: product.category,
      subcategory: product.subcategory,
      frameIndex: frameIndex + 1,
      promptType: "current_schema",
      attributes: attrs,
      applicableAttributeCount: analysis.applicable,
      notApplicableCount: analysis.notApplicable,
      notVisibleCount: analysis.notVisible,
      completeness: analysis.completeness,
    });
  }

  // Calculate current schema metrics
  const avgCurrentCompleteness = currentSchemaExtractions.reduce((sum, e) => sum + e.completeness, 0) / currentSchemaExtractions.length;
  const avgNotApplicable = currentSchemaExtractions.reduce((sum, e) => sum + e.notApplicableCount, 0) / currentSchemaExtractions.length;

  if (avgNotApplicable > 3) {
    issues.push(`High N/A rate: ${avgNotApplicable.toFixed(1)} attributes don't apply to ${product.subcategory}`);
  }

  // Test category-specific schema if available
  const categoryPromptFn = CATEGORY_PROMPTS[product.category];

  if (categoryPromptFn && product.currentSchemaRelevance === "low") {
    console.log(`\n📋 Testing CATEGORY-SPECIFIC schema...`);

    for (const frameIndex of product.frameIndices) {
      const framePath = join(FRAMES_DIR, `frame-${String(frameIndex + 1).padStart(3, "0")}.jpg`);

      if (!existsSync(framePath)) continue;

      const buffer = readFileSync(framePath);
      const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

      const prompt = categoryPromptFn(product.subcategory);
      const attrs = await extractWithPrompt(base64, prompt, "category_specific");
      const analysis = analyzeExtraction(attrs);

      console.log(`   Frame ${frameIndex + 1}: ${analysis.applicable} applicable, ${analysis.notApplicable} N/A (${analysis.completeness.toFixed(0)}% complete)`);

      categorySpecificExtractions.push({
        productName: product.name,
        category: product.category,
        subcategory: product.subcategory,
        frameIndex: frameIndex + 1,
        promptType: "category_specific",
        attributes: attrs,
        applicableAttributeCount: analysis.applicable,
        notApplicableCount: analysis.notApplicable,
        notVisibleCount: analysis.notVisible,
        completeness: analysis.completeness,
      });
    }
  }

  const avgCategoryCompleteness = categorySpecificExtractions.length > 0
    ? categorySpecificExtractions.reduce((sum, e) => sum + e.completeness, 0) / categorySpecificExtractions.length
    : 0;

  return {
    productName: product.name,
    category: product.category,
    subcategory: product.subcategory,
    currentSchemaRelevance: product.currentSchemaRelevance,
    currentSchemaResults: {
      extractions: currentSchemaExtractions,
      averageCompleteness: avgCurrentCompleteness,
      notApplicableRate: avgNotApplicable,
      issues,
    },
    categorySpecificResults: categorySpecificExtractions.length > 0 ? {
      extractions: categorySpecificExtractions,
      averageCompleteness: avgCategoryCompleteness,
      improvement: avgCategoryCompleteness - avgCurrentCompleteness,
    } : undefined,
  };
}

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║        MULTI-PRODUCT CATEGORY TEST                         ║");
  console.log("║   Testing pipeline across different product categories     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: ProductTestResult[] = [];

  for (const product of TEST_PRODUCTS) {
    const result = await testProduct(product);
    results.push(result);
  }

  // Summary
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(60)}`);

  console.log(`\n${"Product".padEnd(35)} | Relevance | Current | Category`);
  console.log(`${"-".repeat(35)}-|-----------|---------|----------`);

  for (const result of results) {
    const current = `${result.currentSchemaResults.averageCompleteness.toFixed(0)}%`;
    const category = result.categorySpecificResults
      ? `${result.categorySpecificResults.averageCompleteness.toFixed(0)}% (+${result.categorySpecificResults.improvement.toFixed(0)})`
      : "N/A";

    console.log(`${result.productName.substring(0, 35).padEnd(35)} | ${result.currentSchemaRelevance.padEnd(9)} | ${current.padStart(7)} | ${category}`);
  }

  // Identify issues
  console.log(`\n\n📋 ISSUES IDENTIFIED:`);

  for (const result of results) {
    if (result.currentSchemaResults.issues.length > 0) {
      console.log(`\n   ${result.productName}:`);
      for (const issue of result.currentSchemaResults.issues) {
        console.log(`   └─ ${issue}`);
      }
    }
  }

  // Recommendations
  console.log(`\n\n💡 RECOMMENDATIONS:`);

  const lowRelevanceProducts = results.filter(r => r.currentSchemaRelevance === "low");
  if (lowRelevanceProducts.length > 0) {
    console.log(`\n   1. Add category-specific schemas for:`);
    for (const product of lowRelevanceProducts) {
      const improvement = product.categorySpecificResults?.improvement;
      console.log(`      - ${product.category}/${product.subcategory}${improvement ? ` (potential +${improvement.toFixed(0)}% completeness)` : ""}`);
    }
  }

  // Save results
  const output = {
    testType: "multi_product_category",
    testedAt: new Date().toISOString(),
    productsTest: TEST_PRODUCTS.length,
    results,
    summary: {
      highRelevance: results.filter(r => r.currentSchemaRelevance === "high").length,
      mediumRelevance: results.filter(r => r.currentSchemaRelevance === "medium").length,
      lowRelevance: results.filter(r => r.currentSchemaRelevance === "low").length,
      avgCurrentCompleteness: results.reduce((sum, r) => sum + r.currentSchemaResults.averageCompleteness, 0) / results.length,
      categoriesNeedingSpecificSchema: lowRelevanceProducts.map(p => `${p.category}/${p.subcategory}`),
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n\n📁 Results saved to: ${OUTPUT_PATH}`);
}

runTest().catch(console.error);
