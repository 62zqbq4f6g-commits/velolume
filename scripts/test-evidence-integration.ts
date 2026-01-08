/**
 * Test Script: Evidence Integration v2.1
 *
 * Tests the new Claim<T> and Evidence integration:
 * - Frame timestamps
 * - Transcript mentions
 * - Bounding boxes
 * - Verification tiers
 *
 * Usage: npx tsx scripts/test-evidence-integration.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Test data representing different niches
const TEST_PRODUCTS = {
  fashion: {
    name: "Olive Green Cable Knit Sweater",
    category: "Clothing",
    subcategory: "Sweater",
    colors: ["olive green"],
    material: "wool",
    style: "casual",
    pattern: "solid",
    brand: null,
    location: "upper_body",
    description: "A cozy cable knit sweater in olive green",
    searchTerms: ["olive green sweater", "cable knit sweater", "women sweater"],
    estimatedPriceUSD: "$40-$80",
    confidence: 0.92,
    identifiability: "high" as const,
    frameIndices: [0, 3, 5, 8],
  },
  beauty: {
    name: "Charlotte Tilbury Pillow Talk Lipstick",
    category: "Beauty",
    subcategory: "Lipstick",
    colors: ["dusty pink"],
    material: null,
    style: "luxury",
    pattern: null,
    brand: "Charlotte Tilbury",
    location: "held",
    description: "A nude pink lipstick with matte finish",
    searchTerms: ["Charlotte Tilbury Pillow Talk", "nude pink lipstick", "matte lipstick"],
    estimatedPriceUSD: "$34",
    confidence: 0.88,
    identifiability: "high" as const,
    frameIndices: [2, 4, 6],
  },
  tech: {
    name: "Apple AirPods Pro",
    category: "Tech",
    subcategory: "Wireless Earbuds",
    colors: ["white"],
    material: "plastic",
    style: "minimalist",
    pattern: null,
    brand: "Apple",
    location: "ears",
    description: "White wireless earbuds with noise cancellation",
    searchTerms: ["AirPods Pro", "Apple earbuds", "wireless earbuds"],
    estimatedPriceUSD: "$249",
    confidence: 0.95,
    identifiability: "high" as const,
    frameIndices: [1, 5, 9],
  },
  home: {
    name: "West Elm Mid-Century Table Lamp",
    category: "Home Decor",
    subcategory: "Table Lamp",
    colors: ["brass", "white"],
    material: "metal",
    style: "mid-century modern",
    pattern: null,
    brand: "West Elm",
    location: "background",
    description: "A brass table lamp with white shade",
    searchTerms: ["brass table lamp", "mid-century lamp", "West Elm lamp"],
    estimatedPriceUSD: "$100-$200",
    confidence: 0.72,
    identifiability: "medium" as const,
    frameIndices: [0, 2],
  },
  fitness: {
    name: "Lululemon Align Leggings",
    category: "Clothing",
    subcategory: "Leggings",
    colors: ["black"],
    material: "nylon",
    style: "athletic",
    pattern: "solid",
    brand: "Lululemon",
    location: "lower_body",
    description: "High-waisted black yoga leggings",
    searchTerms: ["Lululemon Align", "black yoga leggings", "high waist leggings"],
    estimatedPriceUSD: "$98",
    confidence: 0.85,
    identifiability: "high" as const,
    frameIndices: [1, 4, 7, 10],
  },
};

// Simulated video metadata
const VIDEO_METADATA = {
  duration: 15, // seconds
  frameCount: 12,
  transcript: "Hey everyone! Today I'm sharing my favorite everyday essentials. This olive green sweater is so cozy, and I'm obsessed with this Charlotte Tilbury lipstick - it's the perfect nude pink. Also wearing my AirPods Pro because I can't live without them. Love this lamp in the background too!",
};

// Import types
import {
  ProductDetectionClaim,
  convertToProductClaim,
  createClaim,
  createFrameEvidence,
  getVerificationTier,
  Evidence,
} from '../lib/types/product-claims';

async function runTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║      EVIDENCE INTEGRATION TEST - v2.1 Type System          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: any = {
    testDate: new Date().toISOString(),
    videoDuration: VIDEO_METADATA.duration,
    frameCount: VIDEO_METADATA.frameCount,
    products: [],
    summary: {
      total: 0,
      withEvidence: 0,
      withTranscriptMentions: 0,
      verificationTiers: {
        auto: 0,
        auto_high: 0,
      },
    },
  };

  // Calculate frame timestamps
  const frameTimestamps = Array.from(
    { length: VIDEO_METADATA.frameCount },
    (_, i) => Math.round((i * VIDEO_METADATA.duration / (VIDEO_METADATA.frameCount - 1)) * 100) / 100
  );
  console.log(`\n📊 Frame Timestamps: ${frameTimestamps.join(', ')}`);

  // Test each product
  for (const [niche, product] of Object.entries(TEST_PRODUCTS)) {
    console.log(`\n━━━ Testing ${niche.toUpperCase()} niche ━━━`);
    console.log(`   Product: ${product.name}`);

    // Add timestamps based on frameIndices
    const timestamps = product.frameIndices.map(fi => frameTimestamps[fi] || fi);
    const productWithTimestamps = {
      ...product,
      timestamps,
      transcriptMentions: findMentions(product, VIDEO_METADATA.transcript),
    };

    // Convert to ProductDetectionClaim
    const claim = convertToProductClaim(
      productWithTimestamps,
      product.frameIndices,
      timestamps,
      "gpt-4o-2024-01-25",
      "test-video-001"
    );

    // Validate the claim
    const validationResults = validateClaim(claim);
    console.log(`   ✅ Evidence frames: ${claim.evidence.frameIndices.join(', ')}`);
    console.log(`   ✅ Timestamps: ${claim.evidence.timestamps.join('s, ')}s`);
    console.log(`   ✅ Verification tier: ${claim.verification.tier} (${claim.verification.confidence}%)`);

    if (productWithTimestamps.transcriptMentions && productWithTimestamps.transcriptMentions.length > 0) {
      console.log(`   ✅ Transcript mentions: ${productWithTimestamps.transcriptMentions.length}`);
      results.summary.withTranscriptMentions++;
    } else {
      console.log(`   ⚪ No transcript mentions found`);
    }

    results.products.push({
      niche,
      name: product.name,
      category: product.category,
      confidence: product.confidence,
      frameIndices: product.frameIndices,
      timestamps,
      transcriptMentions: productWithTimestamps.transcriptMentions,
      verificationTier: claim.verification.tier,
      validationResults,
    });

    results.summary.total++;
    results.summary.withEvidence++;
    if (claim.verification.tier === 'auto_high') {
      results.summary.verificationTiers.auto_high++;
    } else {
      results.summary.verificationTiers.auto++;
    }
  }

  // Print summary
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                      TEST SUMMARY                          ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`\n📊 Results:`);
  console.log(`   Products tested: ${results.summary.total}`);
  console.log(`   With evidence: ${results.summary.withEvidence}`);
  console.log(`   With transcript mentions: ${results.summary.withTranscriptMentions}`);
  console.log(`   Auto tier: ${results.summary.verificationTiers.auto}`);
  console.log(`   Auto-high tier: ${results.summary.verificationTiers.auto_high}`);

  // Save results
  const outputPath = join(process.cwd(), 'evidence-integration-test-results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${outputPath}`);

  // Test verification tier functions
  console.log(`\n━━━ Testing Verification Tier Functions ━━━`);
  testVerificationTiers();

  console.log(`\n✅ All tests completed!`);
}

function findMentions(product: any, transcript: string): string[] {
  const mentions: string[] = [];
  const transcriptLower = transcript.toLowerCase();

  // Check for name parts
  const nameParts = product.name.toLowerCase().split(/\s+/);
  for (const part of nameParts) {
    if (part.length > 3 && transcriptLower.includes(part)) {
      const idx = transcriptLower.indexOf(part);
      const start = Math.max(0, idx - 30);
      const end = Math.min(transcript.length, idx + part.length + 30);
      const context = transcript.substring(start, end).trim();
      if (!mentions.includes(context)) {
        mentions.push(context);
      }
    }
  }

  // Check for brand
  if (product.brand) {
    const brandLower = product.brand.toLowerCase();
    if (transcriptLower.includes(brandLower)) {
      const idx = transcriptLower.indexOf(brandLower);
      const start = Math.max(0, idx - 20);
      const end = Math.min(transcript.length, idx + brandLower.length + 20);
      const context = transcript.substring(start, end).trim();
      if (!mentions.includes(context)) {
        mentions.push(context);
      }
    }
  }

  return mentions;
}

function validateClaim(claim: ProductDetectionClaim): any {
  return {
    hasEvidence: claim.evidence.frameIndices.length > 0,
    hasTimestamps: claim.evidence.timestamps.length > 0,
    hasVerification: claim.verification !== undefined,
    claimCount: Object.keys(claim.claims).length,
    allClaimsHaveEvidence: Object.values(claim.claims).every((c: any) => c.evidence.length > 0),
  };
}

function testVerificationTiers() {
  const testScores = [50, 70, 84, 85, 90, 100];

  for (const score of testScores) {
    const tier = getVerificationTier(score);
    console.log(`   Score ${score}: ${tier}`);
  }
}

// Run tests
runTests().catch(console.error);
