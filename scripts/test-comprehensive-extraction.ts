/**
 * Test Comprehensive Video Extraction
 *
 * Tests the multi-model extraction pipeline on OOTD video:
 * - GPT-4o: Product detection, reference extraction
 * - Gemini Flash: Hook/content analysis
 * - GPT-4o-mini: SEO generation
 *
 * Reports:
 * - All 75+ data points
 * - Cost breakdown by model
 * - Latency stats
 */

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractVideoDigitalDNA } from "../lib/extraction/comprehensive-extractor";
import { isModelRouterReady } from "../lib/ai/model-router";
import type { ComprehensiveExtraction } from "../lib/extraction/types";

// ============================================================================
// Configuration
// ============================================================================

// OOTD video key (from previous testing)
const TEST_VIDEO_KEY = "videos/VjZ7YNdVpN/video.mp4";

// ============================================================================
// Main Test
// ============================================================================

async function runTest() {
  console.log("=".repeat(80));
  console.log("COMPREHENSIVE VIDEO EXTRACTION TEST");
  console.log("=".repeat(80));
  console.log();

  // Check API keys
  const status = isModelRouterReady();
  if (!status.ready) {
    console.error("❌ Missing API keys:", status.missing.join(", "));
    console.log("\nSet these environment variables:");
    status.missing.forEach(key => console.log(`  export ${key}=your_key`));
    process.exit(1);
  }
  console.log("✅ All API keys configured");
  console.log();

  // Run extraction
  console.log(`📹 Extracting from: ${TEST_VIDEO_KEY}`);
  console.log();

  const startTime = Date.now();
  let result: ComprehensiveExtraction;

  try {
    result = await extractVideoDigitalDNA(TEST_VIDEO_KEY, {
      maxFrames: 12,
    });
  } catch (error) {
    console.error("❌ Extraction failed:", error);
    process.exit(1);
  }

  const elapsed = Date.now() - startTime;

  // ============================================================================
  // Report Results
  // ============================================================================

  console.log();
  console.log("=".repeat(80));
  console.log("EXTRACTION RESULTS");
  console.log("=".repeat(80));
  console.log();

  // Meta
  console.log("📊 METADATA");
  console.log("-".repeat(40));
  console.log(`  Video: ${result.meta.videoKey}`);
  console.log(`  Duration: ${result.meta.videoDuration}s`);
  console.log(`  Frames analyzed: ${result.meta.framesAnalyzed}`);
  console.log(`  Products detected: ${result.meta.productsDetected}`);
  console.log(`  Total data points: ${result.meta.totalDataPoints}`);
  console.log(`  Extraction time: ${elapsed}ms`);
  console.log();

  // Products
  console.log("🛍️ PRODUCTS");
  console.log("-".repeat(40));
  result.products.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     Category: ${p.category} > ${p.subcategory}`);
    console.log(`     Color: ${p.attributes.primaryColor} (${p.attributes.colorFamily})`);
    console.log(`     Material: ${p.attributes.material}`);
    console.log(`     Location: ${p.location}`);
    console.log(`     Confidence: ${(p.confidence * 100).toFixed(0)}%`);
    console.log(`     Identifiability: ${p.identifiability}`);
    console.log();
  });

  // Hook
  console.log("🎣 HOOK ANALYSIS");
  console.log("-".repeat(40));
  console.log(`  Type: ${result.hook.type}`);
  console.log(`  Duration: ${result.hook.timestamp.duration}s`);
  console.log(`  Transcript: "${result.hook.transcript.slice(0, 100)}..."`);
  console.log(`  Visual: ${result.hook.visualDescription.slice(0, 100)}...`);
  console.log(`  Attention devices: ${result.hook.attentionDevice.join(", ") || "none"}`);
  console.log(`  Emotional trigger: ${result.hook.emotionalTrigger || "none"}`);
  console.log(`  Hook strength: ${result.hook.hookStrength}/100`);
  console.log(`  Clarity: ${result.hook.clarity}/100`);
  console.log();

  // Angle
  console.log("🎯 ANGLE");
  console.log("-".repeat(40));
  console.log(`  Type: ${result.angle.type}`);
  console.log(`  Unique claim: ${result.angle.uniqueClaim}`);
  console.log(`  Target audience: ${result.angle.targetAudience}`);
  console.log(`  Pain point: ${result.angle.painPoint || "none"}`);
  console.log(`  Desired outcome: ${result.angle.desiredOutcome || "none"}`);
  console.log(`  Clarity: ${result.angle.clarityScore}/100`);
  console.log(`  Believability: ${result.angle.believabilityScore}/100`);
  console.log();

  // Theme
  console.log("🎨 THEME");
  console.log("-".repeat(40));
  console.log(`  Narrative: ${result.theme.narrativeArc}`);
  console.log(`  Format: ${result.theme.format}`);
  console.log(`  Pacing: ${result.theme.pacing.overall} (${result.theme.pacing.cutsPerMinute} cuts/min)`);
  console.log(`  Tone: ${result.theme.tone.join(", ")}`);
  console.log(`  Aesthetic: ${result.theme.aesthetic}`);
  console.log(`  Energy: ${result.theme.energy}`);
  console.log(`  Editing: ${result.theme.editingStyle.complexity}`);
  console.log(`  Music: ${result.theme.musicStyle}`);
  console.log(`  Voiceover: ${result.theme.voiceoverStyle}`);
  console.log();

  // Visual
  console.log("👁️ VISUAL ANALYSIS");
  console.log("-".repeat(40));
  console.log(`  Dominant colors: ${result.visual.dominantColors.join(", ")}`);
  console.log(`  Color harmony: ${result.visual.colorHarmony}`);
  console.log(`  Lighting: ${result.visual.lighting.type} (${result.visual.lighting.quality})`);
  console.log(`  Framing: ${result.visual.composition.framing}`);
  console.log(`  Setting: ${result.visual.setting.location} (${result.visual.setting.environment})`);
  console.log(`  Quality: ${result.visual.quality.resolution}, ${result.visual.quality.stability}`);
  console.log();

  // Audio
  console.log("🔊 AUDIO ANALYSIS");
  console.log("-".repeat(40));
  console.log(`  Language: ${result.audio.transcription.language}`);
  console.log(`  Duration: ${result.audio.transcription.duration}s`);
  console.log(`  Speaking pace: ${result.audio.speech?.speakingPace || "unknown"}`);
  console.log(`  WPM: ${result.audio.speech?.wordsPerMinute || 0}`);
  console.log(`  Has music: ${result.audio.audio.hasMusic}`);
  console.log(`  Has voiceover: ${result.audio.audio.hasVoiceover}`);
  console.log(`  Transcript preview: "${result.audio.transcription.fullText.slice(0, 200)}..."`);
  console.log();

  // Engagement
  console.log("📈 ENGAGEMENT SIGNALS");
  console.log("-".repeat(40));
  console.log(`  CTA: ${result.engagement.callToAction?.type || "none"} - "${result.engagement.callToAction?.text || ""}"`);
  console.log(`  Social proof: ${result.engagement.socialProof.length} signals`);
  console.log(`  Engagement drivers: ${result.engagement.engagementDrivers.join(", ") || "none"}`);
  console.log(`  Shareability: ${result.engagement.shareabilityScore}/100`);
  console.log(`  Factors: ${result.engagement.shareabilityFactors.join(", ") || "none"}`);
  console.log();

  // SEO
  console.log("🔍 SEO DATA");
  console.log("-".repeat(40));
  console.log(`  Title: ${result.seo.suggestedTitle}`);
  console.log(`  Description: ${result.seo.suggestedDescription}`);
  console.log(`  Niche: ${result.seo.niche} > ${result.seo.subNiche}`);
  console.log(`  Keywords: ${result.seo.keywords.slice(0, 10).join(", ")}...`);
  console.log(`  Hashtags: ${result.seo.hashtags.slice(0, 5).join(" ")}`);
  console.log();

  // ============================================================================
  // Cost Breakdown
  // ============================================================================

  console.log("=".repeat(80));
  console.log("COST BREAKDOWN");
  console.log("=".repeat(80));
  console.log();

  // Group by model
  const costByModel: Record<string, { calls: number; cost: number; tokens: number }> = {};

  result.costs.breakdown.forEach(c => {
    if (!costByModel[c.model]) {
      costByModel[c.model] = { calls: 0, cost: 0, tokens: 0 };
    }
    costByModel[c.model].calls++;
    costByModel[c.model].cost += c.cost;
    costByModel[c.model].tokens += c.inputTokens + c.outputTokens;
  });

  console.log("BY MODEL:");
  console.log("-".repeat(60));
  Object.entries(costByModel).forEach(([model, data]) => {
    console.log(`  ${model.padEnd(20)} | ${data.calls} calls | ${data.tokens.toLocaleString()} tokens | $${data.cost.toFixed(4)}`);
  });
  console.log("-".repeat(60));
  console.log(`  ${"TOTAL".padEnd(20)} | ${result.costs.breakdown.length} calls | - | $${result.costs.totalCost.toFixed(4)}`);
  console.log();

  console.log("BY TASK:");
  console.log("-".repeat(60));
  result.costs.breakdown.forEach(c => {
    console.log(`  ${c.task.padEnd(25)} | ${c.model.padEnd(18)} | ${(c.inputTokens + c.outputTokens).toLocaleString().padStart(8)} tokens | $${c.cost.toFixed(4)}`);
  });
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================

  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log();
  console.log(`  ✅ ${result.meta.totalDataPoints} data points extracted`);
  console.log(`  ✅ ${result.meta.productsDetected} products detected`);
  console.log(`  ✅ Hook, angle, theme analyzed`);
  console.log(`  ✅ Visual and audio analyzed`);
  console.log(`  ✅ SEO metadata generated`);
  console.log();
  console.log(`  💰 Total cost: $${result.costs.totalCost.toFixed(4)}`);
  console.log(`  ⏱️ Total time: ${elapsed}ms`);
  console.log();

  // Save full result to file
  const fs = await import("fs");
  const outputPath = "comprehensive-extraction-results.json";
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`  📄 Full results saved to: ${outputPath}`);
  console.log();
}

// ============================================================================
// Run
// ============================================================================

runTest().catch(console.error);
