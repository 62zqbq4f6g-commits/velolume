/**
 * Test Affiliate Link Conversion
 *
 * Tests the affiliate link conversion module on OOTD matched product URLs.
 * Demonstrates routing logic:
 * - Amazon URLs → Amazon Associates
 * - Shopee/Lazada URLs → Involve Asia
 * - Everything else → Skimlinks
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  getAffiliateLink,
  getAffiliateLinks,
  getAffiliateStatus,
  detectAffiliateNetwork,
  estimateEarnings,
  AffiliateResult,
} from "../lib/affiliate";

// ============================================================================
// OOTD Product URLs (Based on matched products from pipeline)
// ============================================================================

/**
 * Sample product URLs from OOTD video matching results.
 * These represent typical URLs we'd get from Google Shopping API.
 */
const OOTD_MATCHED_PRODUCTS = [
  {
    name: "Cream Knit Sweater (Reference Product)",
    searchTerm: "cream cable knit sweater mock neck",
    url: "https://www.amazon.com/dp/B0CJXYZ123/ref=sr_1_1?keywords=cream+cable+knit+sweater",
    source: "Amazon",
    price: "$34.99",
    category: "Clothing",
  },
  {
    name: "Brown Linen Shorts",
    searchTerm: "brown linen shorts high waist",
    url: "https://www.nordstrom.com/s/linen-blend-shorts/7234567",
    source: "Nordstrom",
    price: "$59.00",
    category: "Clothing",
  },
  {
    name: "Black Patent Loafers",
    searchTerm: "black patent leather loafers tassel",
    url: "https://www.amazon.com/dp/B0ABC123XYZ?tag=old-tag-20",
    source: "Amazon",
    price: "$89.99",
    category: "Footwear",
  },
  {
    name: "Gold Hoop Earrings",
    searchTerm: "gold hoop earrings medium thick",
    url: "https://www.target.com/p/gold-hoop-earrings/-/A-87654321",
    source: "Target",
    price: "$18.99",
    category: "Jewelry",
  },
  {
    name: "Tortoise Shell Sunglasses",
    searchTerm: "tortoise shell cat eye sunglasses",
    url: "https://www.macys.com/shop/product/ray-ban-tortoise-sunglasses?ID=12345678",
    source: "Macy's",
    price: "$159.00",
    category: "Accessories",
  },
  {
    name: "Canvas Tote Bag",
    searchTerm: "canvas tote bag beige large",
    url: "https://www.etsy.com/listing/123456789/large-canvas-shopping-bag",
    source: "Etsy",
    price: "$29.99",
    category: "Bags",
  },
  {
    name: "Apple Watch SE",
    searchTerm: "apple watch SE black sport band",
    url: "https://www.apple.com/shop/buy-watch/apple-watch-se",
    source: "Apple",
    price: "$249.00",
    category: "Electronics",
  },
  {
    name: "Classic Dot Print Neck Scarf",
    searchTerm: "polka dot silk scarf black white",
    url: "https://www.amazon.com/gp/product/B0DEF456GHI",
    source: "Amazon",
    price: "$18.99",
    category: "Accessories",
  },
  {
    name: "Satin Scrunchie Olive Green",
    searchTerm: "olive green satin scrunchie",
    url: "https://www.sephora.com/product/slip-silk-scrunchie-P456789",
    source: "Sephora",
    price: "$8.99",
    category: "Beauty",
  },
  {
    name: "White Cotton Crew Socks",
    searchTerm: "white cotton crew socks 6 pack",
    url: "https://www.amazon.com/dp/B0GHI789JKL",
    source: "Amazon",
    price: "$14.99",
    category: "Clothing",
  },
];

// Additional test URLs for Southeast Asia coverage
const SEA_PRODUCTS = [
  {
    name: "Korean Style Dress",
    url: "https://shopee.sg/Korean-Style-Floral-Dress-i.123456.789012",
    source: "Shopee SG",
    price: "S$29.90",
    category: "Clothing",
  },
  {
    name: "Casual Canvas Sneakers",
    url: "https://www.lazada.com.my/products/canvas-sneakers-i987654321.html",
    source: "Lazada MY",
    price: "RM 89.00",
    category: "Footwear",
  },
  {
    name: "Minimalist Crossbody Bag",
    url: "https://shopee.com.my/Mini-Crossbody-Bag-i.111222.333444",
    source: "Shopee MY",
    price: "RM 45.00",
    category: "Bags",
  },
];

// ============================================================================
// Test Functions
// ============================================================================

async function testAffiliateStatus() {
  console.log("═".repeat(80));
  console.log("AFFILIATE CONFIGURATION STATUS");
  console.log("═".repeat(80));
  console.log();

  const status = getAffiliateStatus();

  console.log("Network Configuration:");
  console.log(
    `  Amazon Associates:  ${status.amazon.configured ? "✅ Configured" : "⚠️ Using placeholder"} (tag: ${status.amazon.tag})`
  );
  console.log(
    `  Skimlinks:          ${status.skimlinks.configured ? "✅ Configured" : "⚠️ Using placeholder"} (id: ${status.skimlinks.publisherId})`
  );
  console.log(
    `  Involve Asia:       ${status.involveAsia.configured ? "✅ Configured" : "⚠️ Using placeholder"}`
  );
  console.log(`  Enabled:            ${status.enabled ? "✅ Yes" : "❌ No"}`);
  console.log();
}

async function testNetworkDetection() {
  console.log("═".repeat(80));
  console.log("NETWORK DETECTION TEST");
  console.log("═".repeat(80));
  console.log();

  const testUrls = [
    { url: "https://www.amazon.com/dp/B08N5WRWNW", expected: "amazon" },
    { url: "https://www.amazon.co.uk/gp/product/B08N5WRWNW", expected: "amazon" },
    { url: "https://shopee.sg/product/123456", expected: "involve_asia" },
    { url: "https://www.lazada.com.my/products/abc", expected: "involve_asia" },
    { url: "https://www.walmart.com/ip/12345", expected: "skimlinks" },
    { url: "https://www.target.com/p/product/-/A-123", expected: "skimlinks" },
    { url: "https://www.nordstrom.com/s/product/123", expected: "skimlinks" },
  ];

  console.log("URL → Network Detection:");
  console.log("-".repeat(80));

  for (const test of testUrls) {
    const detected = detectAffiliateNetwork(test.url);
    const match = detected === test.expected ? "✅" : "❌";
    const domain = new URL(test.url).hostname.replace("www.", "");
    console.log(
      `  ${match} ${domain.padEnd(25)} → ${detected.padEnd(15)} (expected: ${test.expected})`
    );
  }
  console.log();
}

async function testOOTDConversion() {
  console.log("═".repeat(80));
  console.log("OOTD PRODUCT AFFILIATE CONVERSION");
  console.log("═".repeat(80));
  console.log();

  const videoId = "VjZ7YNdVpN"; // OOTD video ID
  const results: AffiliateResult[] = [];

  console.log(`Video ID: ${videoId}`);
  console.log(`Products: ${OOTD_MATCHED_PRODUCTS.length}`);
  console.log();
  console.log("-".repeat(80));

  for (let i = 0; i < OOTD_MATCHED_PRODUCTS.length; i++) {
    const product = OOTD_MATCHED_PRODUCTS[i];

    console.log(`\n${i + 1}. ${product.name}`);
    console.log(`   Source: ${product.source} | Price: ${product.price}`);
    console.log(`   Original URL: ${product.url}`);

    const result = await getAffiliateLink(product.url, {
      videoId,
      productIndex: i,
      category: product.category,
    });

    results.push(result);

    console.log(`   Network: ${result.network}`);
    console.log(`   Retailer: ${result.retailer}`);
    console.log(`   Commission: ~${result.estimatedCommission}%`);
    console.log(`   Affiliate URL: ${result.affiliateUrl}`);
  }

  console.log();
  return results;
}

async function testSEAConversion() {
  console.log("═".repeat(80));
  console.log("SOUTHEAST ASIA PRODUCT CONVERSION");
  console.log("═".repeat(80));
  console.log();

  const videoId = "SEA_TEST_123";
  const results: AffiliateResult[] = [];

  for (let i = 0; i < SEA_PRODUCTS.length; i++) {
    const product = SEA_PRODUCTS[i];

    console.log(`${i + 1}. ${product.name}`);
    console.log(`   Source: ${product.source} | Price: ${product.price}`);
    console.log(`   Original URL: ${product.url}`);

    const result = await getAffiliateLink(product.url, {
      videoId,
      productIndex: i,
      category: product.category,
    });

    results.push(result);

    console.log(`   Network: ${result.network}`);
    console.log(`   Retailer: ${result.retailer}`);
    console.log(`   Commission: ~${result.estimatedCommission}%`);
    console.log(`   Affiliate URL: ${result.affiliateUrl}`);
    console.log();
  }

  return results;
}

async function testBatchConversion() {
  console.log("═".repeat(80));
  console.log("BATCH CONVERSION TEST");
  console.log("═".repeat(80));
  console.log();

  const urls = OOTD_MATCHED_PRODUCTS.slice(0, 5).map((p) => p.url);
  const results = await getAffiliateLinks(urls, { videoId: "BATCH_TEST" });

  console.log(`Converted ${results.length} URLs in batch:`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.network} → ${r.retailer}`);
  });
  console.log();

  return results;
}

async function showSummary(allResults: AffiliateResult[]) {
  console.log("═".repeat(80));
  console.log("CONVERSION SUMMARY");
  console.log("═".repeat(80));
  console.log();

  // Group by network
  const byNetwork: Record<string, number> = {};
  allResults.forEach((r) => {
    byNetwork[r.network] = (byNetwork[r.network] || 0) + 1;
  });

  console.log("By Network:");
  Object.entries(byNetwork).forEach(([network, count]) => {
    const pct = ((count / allResults.length) * 100).toFixed(0);
    console.log(`  ${network.padEnd(15)} ${count} (${pct}%)`);
  });
  console.log();

  // Estimate earnings
  const earnings = estimateEarnings(allResults, 50, 0.03);

  console.log("Revenue Projection (3% conversion rate, $50 AOV):");
  console.log(`  Total Products:        ${earnings.totalProducts}`);
  console.log(`  Estimated Conversions: ${earnings.estimatedConversions.toFixed(1)}`);
  console.log(`  Estimated GMV:         $${earnings.estimatedGMV.toFixed(2)}`);
  console.log(`  Estimated Commission:  $${earnings.estimatedCommission.toFixed(2)}`);
  console.log();

  // Show sample affiliate URLs
  console.log("Sample Affiliate URLs:");
  console.log("-".repeat(80));

  const amazonResult = allResults.find((r) => r.network === "amazon");
  if (amazonResult) {
    console.log(`\n  Amazon (Direct Tag):`);
    console.log(`    Before: ${amazonResult.originalUrl.slice(0, 60)}...`);
    console.log(`    After:  ${amazonResult.affiliateUrl.slice(0, 60)}...`);
  }

  const skimlinksResult = allResults.find((r) => r.network === "skimlinks");
  if (skimlinksResult) {
    console.log(`\n  Skimlinks (Redirect):`);
    console.log(`    Before: ${skimlinksResult.originalUrl.slice(0, 60)}...`);
    console.log(`    After:  ${skimlinksResult.affiliateUrl.slice(0, 60)}...`);
  }

  const involveResult = allResults.find((r) => r.network === "involve_asia");
  if (involveResult) {
    console.log(`\n  Involve Asia (Deep Link):`);
    console.log(`    Before: ${involveResult.originalUrl.slice(0, 60)}...`);
    console.log(`    After:  ${involveResult.affiliateUrl.slice(0, 60)}...`);
  }

  console.log();
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log();
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║              VELOLUME AFFILIATE LINK CONVERSION TEST                       ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝");
  console.log();

  // Check configuration
  await testAffiliateStatus();

  // Test network detection
  await testNetworkDetection();

  // Test OOTD conversion
  const ootdResults = await testOOTDConversion();

  // Test SEA conversion
  const seaResults = await testSEAConversion();

  // Test batch conversion
  await testBatchConversion();

  // Show summary
  await showSummary([...ootdResults, ...seaResults]);

  console.log("═".repeat(80));
  console.log("✅ Affiliate link conversion test complete!");
  console.log("═".repeat(80));
  console.log();
  console.log("Next steps:");
  console.log("  1. Apply for Skimlinks account (skimlinks.com)");
  console.log("  2. Apply for Amazon Associates (affiliate-program.amazon.com)");
  console.log("  3. Apply for Involve Asia (involve.asia)");
  console.log("  4. Set environment variables in .env.local");
  console.log();
}

main().catch(console.error);
