/**
 * Test Script: Hook Extractor v1.0
 *
 * Tests hook extraction across:
 * - 5 short-form videos (<60s) - TikTok/Reels style
 * - 5 long-form videos (>60s) - YouTube style
 *
 * Reports:
 * - Hook type distribution
 * - Effectiveness scores
 * - Window accuracy
 *
 * Usage: npx tsx scripts/test-hook-extractor.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  extractHook,
  extractHooksBatch,
  getHookWindow,
  getHookExtractorStatus,
  HookExtractionInput,
  HookType,
  ContentType,
} from '../lib/extraction/hook-extractor';

// =============================================================================
// TEST DATA - 10 VIDEOS ACROSS DIFFERENT NICHES AND FORMATS
// =============================================================================

interface TestVideo {
  id: string;
  niche: string;
  duration: number;
  contentType: ContentType;
  expectedHookType: HookType;
  transcript: string;
  transcriptSegments: { start: number; end: number; text: string }[];
  description: string;
}

// 5 SHORT-FORM VIDEOS (<60s)
const SHORT_FORM_VIDEOS: TestVideo[] = [
  {
    id: "sf-001-fashion-pov",
    niche: "Fashion/OOTD",
    duration: 15,
    contentType: "short_form",
    expectedHookType: "pov",
    transcript: "POV: you finally found the perfect fall outfit that's both cozy and cute. This olive green sweater is everything.",
    transcriptSegments: [
      { start: 0, end: 2.5, text: "POV: you finally found the perfect fall outfit" },
      { start: 2.5, end: 4, text: "that's both cozy and cute." },
      { start: 4, end: 6, text: "This olive green sweater is everything." },
    ],
    description: "Fashion influencer doing OOTD with POV hook style",
  },
  {
    id: "sf-002-beauty-question",
    niche: "Beauty/Skincare",
    duration: 30,
    contentType: "short_form",
    expectedHookType: "question",
    transcript: "Have you ever wondered why your foundation looks cakey by noon? I finally cracked the code. It's all about your primer technique.",
    transcriptSegments: [
      { start: 0, end: 3, text: "Have you ever wondered why your foundation looks cakey by noon?" },
      { start: 3, end: 4.5, text: "I finally cracked the code." },
      { start: 4.5, end: 7, text: "It's all about your primer technique." },
    ],
    description: "Beauty creator addressing common makeup frustration",
  },
  {
    id: "sf-003-tech-result-first",
    niche: "Tech/Gadgets",
    duration: 45,
    contentType: "short_form",
    expectedHookType: "result_first",
    transcript: "Here's the before and after of my desk setup transformation. From cluttered chaos to minimalist workspace. Let me show you how I did it.",
    transcriptSegments: [
      { start: 0, end: 2.5, text: "Here's the before and after of my desk setup transformation." },
      { start: 2.5, end: 4, text: "From cluttered chaos to minimalist workspace." },
      { start: 4, end: 6, text: "Let me show you how I did it." },
    ],
    description: "Tech reviewer showing transformation result first",
  },
  {
    id: "sf-004-fitness-listicle",
    niche: "Fitness",
    duration: 55,
    contentType: "short_form",
    expectedHookType: "listicle",
    transcript: "5 exercises you're doing wrong at the gym. Number one is actually making your back worse. Save this so you don't hurt yourself.",
    transcriptSegments: [
      { start: 0, end: 2, text: "5 exercises you're doing wrong at the gym." },
      { start: 2, end: 4, text: "Number one is actually making your back worse." },
      { start: 4, end: 6, text: "Save this so you don't hurt yourself." },
    ],
    description: "Fitness coach with numbered list hook",
  },
  {
    id: "sf-005-home-controversy",
    niche: "Home/Lifestyle",
    duration: 25,
    contentType: "short_form",
    expectedHookType: "controversy",
    transcript: "Unpopular opinion: you don't need expensive furniture to have a stylish home. I furnished my entire apartment for under 500 dollars.",
    transcriptSegments: [
      { start: 0, end: 2, text: "Unpopular opinion: you don't need expensive furniture" },
      { start: 2, end: 3.5, text: "to have a stylish home." },
      { start: 3.5, end: 6, text: "I furnished my entire apartment for under 500 dollars." },
    ],
    description: "Home decor creator with controversial take",
  },
];

// 5 LONG-FORM VIDEOS (>60s)
const LONG_FORM_VIDEOS: TestVideo[] = [
  {
    id: "lf-001-fashion-story",
    niche: "Fashion/OOTD",
    duration: 480, // 8 minutes
    contentType: "long_form",
    expectedHookType: "story",
    transcript: "Story time: I spent 3 months trying to build the perfect capsule wardrobe. Let me tell you about everything that went wrong first. So it all started when I decided to donate all my clothes...",
    transcriptSegments: [
      { start: 0, end: 3, text: "Story time: I spent 3 months trying to build the perfect capsule wardrobe." },
      { start: 3, end: 6, text: "Let me tell you about everything that went wrong first." },
      { start: 6, end: 10, text: "So it all started when I decided to donate all my clothes..." },
      { start: 10, end: 15, text: "And then I realized I had nothing to wear to work." },
    ],
    description: "Fashion vlogger with story-based hook",
  },
  {
    id: "lf-002-beauty-direct",
    niche: "Beauty/Skincare",
    duration: 720, // 12 minutes
    contentType: "long_form",
    expectedHookType: "direct_value",
    transcript: "In this video I'm going to teach you exactly how to do the Korean glass skin routine that went viral. By the end you'll know the 7 steps, the exact products, and the order to apply them.",
    transcriptSegments: [
      { start: 0, end: 4, text: "In this video I'm going to teach you exactly how to do the Korean glass skin routine that went viral." },
      { start: 4, end: 8, text: "By the end you'll know the 7 steps, the exact products," },
      { start: 8, end: 12, text: "and the order to apply them." },
      { start: 12, end: 16, text: "Plus I'll share my personal modifications for oily skin." },
    ],
    description: "Beauty tutorial with clear value proposition",
  },
  {
    id: "lf-003-tech-teaser",
    niche: "Tech/Gadgets",
    duration: 900, // 15 minutes
    contentType: "long_form",
    expectedHookType: "teaser",
    transcript: "I tested the most expensive laptop against the cheapest one I could find. Wait for it because the results are going to blow your mind. You won't believe which one actually won.",
    transcriptSegments: [
      { start: 0, end: 3, text: "I tested the most expensive laptop against the cheapest one I could find." },
      { start: 3, end: 6, text: "Wait for it because the results are going to blow your mind." },
      { start: 6, end: 10, text: "You won't believe which one actually won." },
      { start: 10, end: 15, text: "Before we get to the results, let me explain the testing methodology." },
    ],
    description: "Tech reviewer with teaser hook for engagement",
  },
  {
    id: "lf-004-fitness-problem",
    niche: "Fitness",
    duration: 600, // 10 minutes
    contentType: "long_form",
    expectedHookType: "problem",
    transcript: "Struggling with your squat depth? Can't figure out why your knees hurt? The problem might not be your form at all. It's actually about something most trainers never talk about.",
    transcriptSegments: [
      { start: 0, end: 2.5, text: "Struggling with your squat depth?" },
      { start: 2.5, end: 5, text: "Can't figure out why your knees hurt?" },
      { start: 5, end: 8, text: "The problem might not be your form at all." },
      { start: 8, end: 12, text: "It's actually about something most trainers never talk about." },
      { start: 12, end: 16, text: "Today I'm going to break down the real cause and the fix." },
    ],
    description: "Fitness instructor addressing pain point",
  },
  {
    id: "lf-005-home-statement",
    niche: "Home/Lifestyle",
    duration: 540, // 9 minutes
    contentType: "long_form",
    expectedHookType: "statement",
    transcript: "I found the best way to organize a small kitchen. This method saved me 20 minutes every morning and I'm going to show you exactly how to do it step by step.",
    transcriptSegments: [
      { start: 0, end: 3, text: "I found the best way to organize a small kitchen." },
      { start: 3, end: 6, text: "This method saved me 20 minutes every morning" },
      { start: 6, end: 9, text: "and I'm going to show you exactly how to do it step by step." },
      { start: 9, end: 14, text: "Let's start with the most important area: under the sink." },
    ],
    description: "Lifestyle vlogger with bold statement hook",
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create simulated frames (1x1 pixel placeholder images)
 * In production these would be actual extracted frames
 */
function createSimulatedFrames(count: number): Buffer[] {
  // Create a simple 1x1 red JPEG for testing
  // This is the smallest valid JPEG
  const minimalJpeg = Buffer.from([
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
    0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x7e, 0xa4,
    0xff, 0xd9,
  ]);

  return Array(count).fill(minimalJpeg);
}

/**
 * Calculate frame timestamps evenly distributed across duration
 */
function calculateFrameTimestamps(duration: number, frameCount: number): number[] {
  if (frameCount === 1) return [0];
  return Array.from(
    { length: frameCount },
    (_, i) => Math.round((i * duration / (frameCount - 1)) * 100) / 100
  );
}

/**
 * Convert test video to extraction input
 */
function toExtractionInput(video: TestVideo, frameCount: number): HookExtractionInput & { contentId: string } {
  return {
    contentId: video.id,
    videoDuration: video.duration,
    contentType: video.contentType,
    frames: createSimulatedFrames(frameCount),
    frameTimestamps: calculateFrameTimestamps(video.duration, frameCount),
    transcript: video.transcript,
    transcriptSegments: video.transcriptSegments,
  };
}

// =============================================================================
// TESTS
// =============================================================================

async function testHookWindowDetection() {
  console.log("\n━━━ Testing Hook Window Detection ━━━\n");

  const testCases = [
    { duration: 15, expected: { start: 0, end: 3, type: "short_form" } },
    { duration: 30, expected: { start: 0, end: 3, type: "short_form" } },
    { duration: 60, expected: { start: 0, end: 3, type: "short_form" } },
    { duration: 61, expected: { start: 0, end: 15, type: "long_form" } },
    { duration: 300, expected: { start: 0, end: 15, type: "long_form" } },
    { duration: 900, expected: { start: 0, end: 15, type: "long_form" } },
  ];

  let passed = 0;

  for (const tc of testCases) {
    const window = getHookWindow(tc.duration);
    const isCorrect =
      window.startSeconds === tc.expected.start &&
      window.endSeconds === tc.expected.end &&
      window.contentType === tc.expected.type;

    if (isCorrect) {
      console.log(`  ✅ ${tc.duration}s video → ${window.contentType} (${window.startSeconds}-${window.endSeconds}s)`);
      passed++;
    } else {
      console.log(`  ❌ ${tc.duration}s video → Expected ${tc.expected.type} but got ${window.contentType}`);
    }
  }

  console.log(`\n  Window detection: ${passed}/${testCases.length} passed`);
  return passed === testCases.length;
}

async function testShortFormVideos() {
  console.log("\n━━━ Testing Short-Form Videos (<60s) ━━━\n");

  const results = [];

  for (const video of SHORT_FORM_VIDEOS) {
    console.log(`  📹 ${video.id}`);
    console.log(`     Niche: ${video.niche}`);
    console.log(`     Duration: ${video.duration}s`);
    console.log(`     Expected hook: ${video.expectedHookType}`);

    try {
      const input = toExtractionInput(video, 12);
      const analysis = await extractHook(input);

      const hookMatch = analysis.hookType.value === video.expectedHookType;
      const windowCorrect = analysis.hookWindow.contentType === "short_form" &&
                           analysis.hookWindow.endSeconds <= 3;

      console.log(`     Detected hook: ${analysis.hookType.value} (${analysis.hookType.confidence}%)`);
      console.log(`     Effectiveness: ${analysis.effectivenessScore.value}/100`);
      console.log(`     Window: ${analysis.hookWindow.startSeconds}-${analysis.hookWindow.endSeconds}s`);
      console.log(`     Hook match: ${hookMatch ? '✅' : '⚪'} | Window: ${windowCorrect ? '✅' : '❌'}`);

      results.push({
        id: video.id,
        niche: video.niche,
        duration: video.duration,
        expectedHook: video.expectedHookType,
        detectedHook: analysis.hookType.value,
        confidence: analysis.hookType.confidence,
        effectivenessScore: analysis.effectivenessScore.value,
        breakdown: analysis.effectivenessBreakdown,
        hookMatch,
        windowCorrect,
        success: true,
      });
    } catch (error) {
      console.log(`     ❌ Error: ${error}`);
      results.push({
        id: video.id,
        niche: video.niche,
        duration: video.duration,
        expectedHook: video.expectedHookType,
        detectedHook: null,
        error: String(error),
        success: false,
      });
    }

    console.log("");
  }

  return results;
}

async function testLongFormVideos() {
  console.log("\n━━━ Testing Long-Form Videos (>60s) ━━━\n");

  const results = [];

  for (const video of LONG_FORM_VIDEOS) {
    console.log(`  📹 ${video.id}`);
    console.log(`     Niche: ${video.niche}`);
    console.log(`     Duration: ${video.duration}s (${Math.round(video.duration / 60)} min)`);
    console.log(`     Expected hook: ${video.expectedHookType}`);

    try {
      const input = toExtractionInput(video, 12);
      const analysis = await extractHook(input);

      const hookMatch = analysis.hookType.value === video.expectedHookType;
      const windowCorrect = analysis.hookWindow.contentType === "long_form" &&
                           analysis.hookWindow.endSeconds <= 15;

      console.log(`     Detected hook: ${analysis.hookType.value} (${analysis.hookType.confidence}%)`);
      console.log(`     Effectiveness: ${analysis.effectivenessScore.value}/100`);
      console.log(`     Window: ${analysis.hookWindow.startSeconds}-${analysis.hookWindow.endSeconds}s`);
      console.log(`     Primary hook: 0-${analysis.hookWindow.primaryEndSeconds}s`);
      console.log(`     Hook match: ${hookMatch ? '✅' : '⚪'} | Window: ${windowCorrect ? '✅' : '❌'}`);

      results.push({
        id: video.id,
        niche: video.niche,
        duration: video.duration,
        expectedHook: video.expectedHookType,
        detectedHook: analysis.hookType.value,
        confidence: analysis.hookType.confidence,
        effectivenessScore: analysis.effectivenessScore.value,
        breakdown: analysis.effectivenessBreakdown,
        hookMatch,
        windowCorrect,
        success: true,
      });
    } catch (error) {
      console.log(`     ❌ Error: ${error}`);
      results.push({
        id: video.id,
        niche: video.niche,
        duration: video.duration,
        expectedHook: video.expectedHookType,
        detectedHook: null,
        error: String(error),
        success: false,
      });
    }

    console.log("");
  }

  return results;
}

function generateReport(shortFormResults: any[], longFormResults: any[]) {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              HOOK EXTRACTOR TEST REPORT                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const allResults = [...shortFormResults, ...longFormResults];
  const successful = allResults.filter(r => r.success);

  // 1. Hook Type Distribution
  console.log("\n📊 HOOK TYPE DISTRIBUTION\n");
  const hookTypeCounts: Record<string, number> = {};
  for (const r of successful) {
    const hookType = r.detectedHook || "unknown";
    hookTypeCounts[hookType] = (hookTypeCounts[hookType] || 0) + 1;
  }

  const sortedHookTypes = Object.entries(hookTypeCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [hookType, count] of sortedHookTypes) {
    const bar = "█".repeat(count * 3);
    console.log(`  ${hookType.padEnd(15)} ${bar} ${count}`);
  }

  // 2. Hook Match Accuracy
  console.log("\n🎯 HOOK TYPE MATCH ACCURACY\n");
  const matches = successful.filter(r => r.hookMatch).length;
  const matchRate = ((matches / successful.length) * 100).toFixed(1);
  console.log(`  Exact match: ${matches}/${successful.length} (${matchRate}%)`);

  // 3. Effectiveness Scores
  console.log("\n📈 EFFECTIVENESS SCORES\n");
  const scores = successful.map(r => r.effectivenessScore);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  console.log(`  Average: ${avgScore}/100`);
  console.log(`  Range: ${minScore} - ${maxScore}`);

  // By content type
  const shortScores = shortFormResults.filter(r => r.success).map(r => r.effectivenessScore);
  const longScores = longFormResults.filter(r => r.success).map(r => r.effectivenessScore);

  if (shortScores.length > 0) {
    const avgShort = Math.round(shortScores.reduce((a, b) => a + b, 0) / shortScores.length);
    console.log(`  Short-form avg: ${avgShort}/100`);
  }

  if (longScores.length > 0) {
    const avgLong = Math.round(longScores.reduce((a, b) => a + b, 0) / longScores.length);
    console.log(`  Long-form avg: ${avgLong}/100`);
  }

  // 4. Window Accuracy
  console.log("\n🕐 WINDOW ACCURACY\n");
  const windowCorrect = successful.filter(r => r.windowCorrect).length;
  const windowRate = ((windowCorrect / successful.length) * 100).toFixed(1);
  console.log(`  Correct window applied: ${windowCorrect}/${successful.length} (${windowRate}%)`);

  // 5. By Niche Breakdown
  console.log("\n📂 BY NICHE\n");
  const byNiche: Record<string, any[]> = {};
  for (const r of successful) {
    const niche = r.niche.split("/")[0];
    if (!byNiche[niche]) byNiche[niche] = [];
    byNiche[niche].push(r);
  }

  for (const [niche, results] of Object.entries(byNiche)) {
    const nicheScores = results.map((r: any) => r.effectivenessScore);
    const nicheAvg = Math.round(nicheScores.reduce((a, b) => a + b, 0) / nicheScores.length);
    const nicheMatch = results.filter((r: any) => r.hookMatch).length;
    console.log(`  ${niche.padEnd(12)} Avg: ${nicheAvg}/100 | Match: ${nicheMatch}/${results.length}`);
  }

  // 6. Errors
  const errors = allResults.filter(r => !r.success);
  if (errors.length > 0) {
    console.log("\n❌ ERRORS\n");
    for (const e of errors) {
      console.log(`  ${e.id}: ${e.error}`);
    }
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  Total videos tested: ${allResults.length}`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Short-form: ${shortFormResults.filter(r => r.success).length}/5`);
  console.log(`  Long-form: ${longFormResults.filter(r => r.success).length}/5`);
  console.log(`  Hook types detected: ${Object.keys(hookTypeCounts).length}`);
  console.log(`  Avg effectiveness: ${avgScore}/100`);
  console.log(`  Window accuracy: ${windowRate}%`);
  console.log("");

  return {
    testDate: new Date().toISOString(),
    totalVideos: allResults.length,
    successful: successful.length,
    shortFormResults,
    longFormResults,
    hookTypeDistribution: hookTypeCounts,
    hookMatchRate: parseFloat(matchRate),
    avgEffectiveness: avgScore,
    effectivenessRange: { min: minScore, max: maxScore },
    windowAccuracy: parseFloat(windowRate),
    errors: errors.map(e => ({ id: e.id, error: e.error })),
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║           HOOK EXTRACTOR TEST SUITE v1.0                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  // Check status
  const status = getHookExtractorStatus();
  console.log(`\n📋 Hook Extractor Status:`);
  console.log(`   Ready: ${status.ready ? '✅' : '❌'}`);
  console.log(`   Model: ${status.model}`);
  console.log(`   Hook Types: ${status.hookTypes.length}`);

  if (!status.ready) {
    console.error("\n❌ OPENAI_API_KEY not set. Cannot run tests.");
    process.exit(1);
  }

  // Run tests
  const windowTestPassed = await testHookWindowDetection();

  if (!windowTestPassed) {
    console.error("\n❌ Window detection tests failed. Stopping.");
    process.exit(1);
  }

  console.log("\n⏳ Running hook extraction tests (this may take a few minutes)...\n");

  const shortFormResults = await testShortFormVideos();
  const longFormResults = await testLongFormVideos();

  // Generate report
  const report = generateReport(shortFormResults, longFormResults);

  // Save results
  const outputPath = join(process.cwd(), "hook-extractor-test-results.json");
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📁 Results saved to: ${outputPath}`);

  console.log("\n✅ Hook extractor test complete!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
