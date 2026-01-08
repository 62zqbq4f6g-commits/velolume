/**
 * Test Model Router
 *
 * Tests the multi-model routing system without requiring video/S3:
 * - GPT-4o: Product detection (mock image)
 * - Gemini Flash: Content analysis (text only)
 * - GPT-4o-mini: SEO generation (text only)
 *
 * Reports:
 * - Model routing per task
 * - Cost breakdown
 * - API connectivity
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  ModelRouter,
  getModelRouter,
  isModelRouterReady,
  TASK_MODEL_MAP,
  MODELS,
} from "../lib/ai/model-router";

// ============================================================================
// Test Data
// ============================================================================

// Create a tiny 1x1 red pixel JPEG for testing vision endpoints
const TINY_RED_PIXEL = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
  0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
  0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
  0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
  0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
  0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
  0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
  0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
  0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x5e, 0xff,
  0xd9,
]);

// ============================================================================
// Main Test
// ============================================================================

async function runTest() {
  console.log("=".repeat(80));
  console.log("MODEL ROUTER TEST");
  console.log("=".repeat(80));
  console.log();

  // Check API keys
  const status = isModelRouterReady();
  console.log("API Key Status:");
  console.log(`  OpenAI: ${!status.missing.includes("OPENAI_API_KEY") ? "✅ Set" : "❌ Missing"}`);
  console.log(`  Google AI: ${!status.missing.includes("GOOGLE_AI_API_KEY") ? "✅ Set" : "❌ Missing"}`);
  console.log();

  if (!status.ready) {
    console.error("Missing keys:", status.missing.join(", "));
    process.exit(1);
  }

  // Show task → model mapping
  console.log("TASK → MODEL MAPPING:");
  console.log("-".repeat(60));
  for (const [task, model] of Object.entries(TASK_MODEL_MAP)) {
    const config = MODELS[model];
    console.log(`  ${task.padEnd(25)} → ${model.padEnd(20)} ($${config.inputCostPer1M}/$${config.outputCostPer1M})`);
  }
  console.log();

  const router = getModelRouter();

  // ============================================================================
  // Test 1: GPT-4o Vision (Product Detection)
  // ============================================================================
  console.log("=".repeat(80));
  console.log("TEST 1: GPT-4o Vision (Product Detection)");
  console.log("=".repeat(80));
  console.log();

  try {
    const result1 = await router.executeVisionTask<{ products: any[] }>(
      "product_detection",
      [TINY_RED_PIXEL],
      "You are a product detector. Respond with JSON.",
      'This is a test image (1x1 red pixel). Respond with: {"products": [{"name": "Red Test Pixel", "category": "Test", "confidence": 1.0}]}'
    );

    console.log("✅ GPT-4o Vision works!");
    console.log(`   Model: ${result1.cost.model}`);
    console.log(`   Input tokens: ${result1.cost.inputTokens}`);
    console.log(`   Output tokens: ${result1.cost.outputTokens}`);
    console.log(`   Cost: $${result1.cost.cost.toFixed(6)}`);
    console.log(`   Latency: ${result1.latencyMs}ms`);
    console.log(`   Response: ${JSON.stringify(result1.data)}`);
    console.log();
  } catch (error: any) {
    console.log("❌ GPT-4o Vision failed:", error.message);
    console.log();
  }

  // ============================================================================
  // Test 2: Gemini Flash Vision (Content Analysis)
  // ============================================================================
  console.log("=".repeat(80));
  console.log("TEST 2: Gemini Flash Vision (Content Analysis)");
  console.log("=".repeat(80));
  console.log();

  try {
    const result2 = await router.executeVisionTask<{ analysis: any }>(
      "content_analysis",
      [TINY_RED_PIXEL],
      "You are a content analyzer. Respond with JSON only.",
      'This is a test image. Respond with: {"analysis": {"type": "test", "color": "red", "confidence": 1.0}}'
    );

    console.log("✅ Gemini Flash Vision works!");
    console.log(`   Model: ${result2.cost.model}`);
    console.log(`   Input tokens: ${result2.cost.inputTokens}`);
    console.log(`   Output tokens: ${result2.cost.outputTokens}`);
    console.log(`   Cost: $${result2.cost.cost.toFixed(6)}`);
    console.log(`   Latency: ${result2.latencyMs}ms`);
    console.log(`   Response: ${JSON.stringify(result2.data)}`);
    console.log();
  } catch (error: any) {
    console.log("❌ Gemini Flash Vision failed:", error.message);
    console.log();
  }

  // ============================================================================
  // Test 3: GPT-4o-mini Text (SEO Generation)
  // ============================================================================
  console.log("=".repeat(80));
  console.log("TEST 3: GPT-4o-mini Text (SEO Generation)");
  console.log("=".repeat(80));
  console.log();

  try {
    const result3 = await router.executeTextTask<{ seo: any }>(
      "seo_generation",
      "You are an SEO expert. Respond with JSON only.",
      'Generate SEO for a product video about fashion. Respond with: {"seo": {"keywords": ["fashion", "style", "outfit"], "title": "Fashion Video"}}'
    );

    console.log("✅ GPT-4o-mini Text works!");
    console.log(`   Model: ${result3.cost.model}`);
    console.log(`   Input tokens: ${result3.cost.inputTokens}`);
    console.log(`   Output tokens: ${result3.cost.outputTokens}`);
    console.log(`   Cost: $${result3.cost.cost.toFixed(6)}`);
    console.log(`   Latency: ${result3.latencyMs}ms`);
    console.log(`   Response: ${JSON.stringify(result3.data)}`);
    console.log();
  } catch (error: any) {
    console.log("❌ GPT-4o-mini Text failed:", error.message);
    console.log();
  }

  // ============================================================================
  // Cost Summary
  // ============================================================================
  console.log("=".repeat(80));
  console.log("COST SUMMARY");
  console.log("=".repeat(80));
  console.log();

  const costs = router.getCosts();
  const totalCost = router.getTotalCost();

  // Group by model
  const byModel: Record<string, { calls: number; cost: number; tokens: number }> = {};
  costs.forEach(c => {
    if (!byModel[c.model]) {
      byModel[c.model] = { calls: 0, cost: 0, tokens: 0 };
    }
    byModel[c.model].calls++;
    byModel[c.model].cost += c.cost;
    byModel[c.model].tokens += c.inputTokens + c.outputTokens;
  });

  console.log("BY MODEL:");
  Object.entries(byModel).forEach(([model, data]) => {
    console.log(`  ${model.padEnd(20)} | ${data.calls} calls | ${data.tokens} tokens | $${data.cost.toFixed(6)}`);
  });
  console.log("-".repeat(60));
  console.log(`  ${"TOTAL".padEnd(20)} | ${costs.length} calls | - | $${totalCost.toFixed(6)}`);
  console.log();

  console.log("BY TASK:");
  costs.forEach(c => {
    console.log(`  ${c.task.padEnd(25)} | ${c.model.padEnd(18)} | ${(c.inputTokens + c.outputTokens).toString().padStart(6)} tokens | $${c.cost.toFixed(6)}`);
  });
  console.log();

  // ============================================================================
  // Cost Projection
  // ============================================================================
  console.log("=".repeat(80));
  console.log("COST PROJECTION (Per Video with 10 products, 100 candidates)");
  console.log("=".repeat(80));
  console.log();

  // Estimate based on actual token usage
  const gpt4oCostPer100Images = 100 * 765 * (5 / 1_000_000); // 765 tokens per image
  const geminiFlashCostPer100Images = 100 * 500 * (0.075 / 1_000_000); // ~500 tokens per image

  console.log("Candidate Extraction (100 images):");
  console.log(`  GPT-4o:         $${gpt4oCostPer100Images.toFixed(4)} (765 tokens/image × $5/1M)`);
  console.log(`  Gemini Flash:   $${geminiFlashCostPer100Images.toFixed(4)} (500 tokens/image × $0.075/1M)`);
  console.log(`  Savings:        ${((1 - geminiFlashCostPer100Images / gpt4oCostPer100Images) * 100).toFixed(0)}%`);
  console.log();

  const estimatedVideoCost =
    2.00 +  // Product detection (GPT-4o, 12 frames)
    3.00 +  // Reference extraction (GPT-4o, 40 frames for 10 products)
    geminiFlashCostPer100Images + // Candidate extraction (Gemini Flash)
    0.05;   // SEO + text tasks (GPT-4o-mini)

  console.log(`Estimated cost per video: $${estimatedVideoCost.toFixed(2)}`);
  console.log(`Monthly cost (1000 videos): $${(estimatedVideoCost * 1000).toFixed(0)}`);
  console.log(`Annual cost: $${(estimatedVideoCost * 1000 * 12).toFixed(0)}`);
  console.log();

  console.log("✅ Model router test complete!");
}

// ============================================================================
// Run
// ============================================================================

runTest().catch(console.error);
