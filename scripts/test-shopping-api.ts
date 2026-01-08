/**
 * Google Shopping API Test Script
 *
 * Tests if text-based Google Shopping search returns relevant products
 * using our V2.0 detection data (searchTerms).
 *
 * This is an alternative approach to Google Lens visual search.
 *
 * Usage: npx tsx scripts/test-shopping-api.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// IMPORTANT: Set SERP_API_KEY in .env.local
const SERPAPI_KEY = process.env.SERP_API_KEY || "";

if (!SERPAPI_KEY) {
  console.error("❌ SERP_API_KEY not set in .env.local");
  console.log("\nAdd to .env.local:");
  console.log("SERP_API_KEY=your_api_key_here");
  process.exit(1);
}

// Products from V2.0 detection
const PRODUCTS_TO_TEST = [
  {
    name: "Olive Green Knit Crop Sweater",
    query: "olive green knit crop sweater women",
    searchTerms: ["olive green", "knit crop sweater", "casual sweater"],
  },
  {
    name: "Light Blue Denim Shorts",
    query: "light blue denim shorts women",
    searchTerms: ["light blue", "denim shorts", "casual shorts"],
  },
  {
    name: "Black Patent Leather Loafers",
    query: "black patent leather loafers women",
    searchTerms: ["black loafers", "patent leather shoes", "glossy loafers"],
  },
];

interface ShoppingResult {
  title: string;
  source: string;
  link: string;
  price?: string;
  thumbnail?: string;
  rating?: number;
}

interface ProductTestResult {
  productName: string;
  query: string;
  results: ShoppingResult[];
  resultCount: number;
}

interface TestResults {
  testType: "google_shopping_text";
  testedAt: string;
  productsCount: number;
  results: ProductTestResult[];
  summary: {
    totalResults: number;
    productsWithResults: number;
    avgResultsPerProduct: number;
  };
}

async function searchGoogleShopping(query: string): Promise<ShoppingResult[]> {
  console.log(`\n🛒 Searching Google Shopping: "${query}"`);

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: SERPAPI_KEY,
    gl: "us",  // Country
    hl: "en",  // Language
  });

  try {
    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json() as any;

    if (data.error) {
      console.log(`   ❌ Error: ${data.error}`);
      return [];
    }

    const results: ShoppingResult[] = (data.shopping_results || []).slice(0, 10).map((r: any) => ({
      title: r.title || "Unknown",
      source: r.source || "",
      link: r.link || "",
      price: r.price || undefined,
      thumbnail: r.thumbnail || undefined,
      rating: r.rating || undefined,
    }));

    console.log(`   ✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return [];
  }
}

async function runTest() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         GOOGLE SHOPPING API TEST - Text Search            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nTesting ${PRODUCTS_TO_TEST.length} products from V2.0 detection`);

  const results: ProductTestResult[] = [];
  let totalResults = 0;

  for (const product of PRODUCTS_TO_TEST) {
    const shoppingResults = await searchGoogleShopping(product.query);

    results.push({
      productName: product.name,
      query: product.query,
      results: shoppingResults,
      resultCount: shoppingResults.length,
    });

    totalResults += shoppingResults.length;

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  const productsWithResults = results.filter(r => r.resultCount > 0).length;

  const testResults: TestResults = {
    testType: "google_shopping_text",
    testedAt: new Date().toISOString(),
    productsCount: PRODUCTS_TO_TEST.length,
    results,
    summary: {
      totalResults,
      productsWithResults,
      avgResultsPerProduct: totalResults / PRODUCTS_TO_TEST.length,
    },
  };

  // Save results
  const outputPath = join(process.cwd(), "shopping-api-test-results.json");
  writeFileSync(outputPath, JSON.stringify(testResults, null, 2));

  // Print summary
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                      TEST RESULTS                          ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`\n📊 Summary:`);
  console.log(`   Products tested: ${PRODUCTS_TO_TEST.length}`);
  console.log(`   Products with results: ${productsWithResults}`);
  console.log(`   Total shopping results: ${totalResults}`);
  console.log(`   Average results per product: ${(totalResults / PRODUCTS_TO_TEST.length).toFixed(1)}`);

  for (const result of results) {
    console.log(`\n━━━ ${result.productName} ━━━`);
    console.log(`   Query: "${result.query}"`);
    console.log(`   Results: ${result.resultCount}`);

    if (result.results.length > 0) {
      console.log(`   Top 3 matches:`);
      for (const r of result.results.slice(0, 3)) {
        console.log(`   • ${r.title}`);
        console.log(`     ${r.price || "No price"} from ${r.source}`);
      }
    }
  }

  console.log(`\n📁 Results saved to: ${outputPath}`);
  console.log(`\n✅ Test completed!`);
}

runTest();
