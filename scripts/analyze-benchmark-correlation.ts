/**
 * Benchmark Correlation Analysis
 *
 * Analyzes benchmark data to find correlations between hook types and engagement.
 * Answers: "Do controversy hooks actually outperform?"
 *
 * Usage:
 *   npx tsx scripts/analyze-benchmark-correlation.ts [category]
 *   npx tsx scripts/analyze-benchmark-correlation.ts           # All categories
 *   npx tsx scripts/analyze-benchmark-correlation.ts fashion   # Single category
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

// =============================================================================
// TYPES
// =============================================================================

interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  likeToViewRatio: number;
  commentToViewRatio: number;
  scrapedAt: string;
}

interface BenchmarkVideo {
  videoId: string;
  url: string;
  platform: string;
  category: string;
  title: string;
  description: string;
  author: string;
  authorFollowers?: number;
  duration: number;
  hashtags: string[];
  engagement: EngagementMetrics;
  hookType: string;
  hookConfidence: number;
  hookEffectiveness: number;
  hookBreakdown: {
    clarity: number;
    patternInterrupt: number;
    speedToValue: number;
    alignment: number;
  };
  productCount: number;
  products: { name: string; category: string; confidence: number }[];
  transcript?: string;
  transcriptLanguage?: string;
  processedAt: string;
  processingTimeMs: number;
}

interface HookStats {
  hookType: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementRate: number;
  avgEffectiveness: number;
  totalViews: number;
  medianViews: number;
  percentile90Views: number;
}

interface CorrelationResult {
  category: string;
  totalVideos: number;
  hookStats: HookStats[];
  topPerformingHook: string;
  bottomPerformingHook: string;
  controversyVsAverage: {
    exists: boolean;
    engagementMultiplier?: number;
    viewsMultiplier?: number;
  };
  keyInsights: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return Math.round(n).toString();
}

// =============================================================================
// ANALYSIS
// =============================================================================

function analyzeCategory(videos: BenchmarkVideo[]): CorrelationResult {
  const category = videos[0]?.category || "unknown";

  // Group by hook type
  const byHookType: Record<string, BenchmarkVideo[]> = {};
  for (const v of videos) {
    if (!byHookType[v.hookType]) {
      byHookType[v.hookType] = [];
    }
    byHookType[v.hookType].push(v);
  }

  // Calculate stats per hook type
  const hookStats: HookStats[] = Object.entries(byHookType)
    .map(([hookType, vids]) => {
      const views = vids.map((v) => v.engagement.views);
      return {
        hookType,
        count: vids.length,
        avgViews: views.reduce((a, b) => a + b, 0) / vids.length,
        avgLikes:
          vids.reduce((a, b) => a + b.engagement.likes, 0) / vids.length,
        avgComments:
          vids.reduce((a, b) => a + b.engagement.comments, 0) / vids.length,
        avgShares:
          vids.reduce((a, b) => a + b.engagement.shares, 0) / vids.length,
        avgEngagementRate:
          vids.reduce((a, b) => a + b.engagement.engagementRate, 0) /
          vids.length,
        avgEffectiveness:
          vids.reduce((a, b) => a + b.hookEffectiveness, 0) / vids.length,
        totalViews: views.reduce((a, b) => a + b, 0),
        medianViews: median(views),
        percentile90Views: percentile(views, 90),
      };
    })
    .filter((s) => s.count >= 2) // Need at least 2 samples
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

  // Overall average
  const overallAvgEngagement =
    videos.reduce((a, b) => a + b.engagement.engagementRate, 0) / videos.length;
  const overallAvgViews =
    videos.reduce((a, b) => a + b.engagement.views, 0) / videos.length;

  // Top and bottom performing hooks
  const topPerformingHook = hookStats[0]?.hookType || "unknown";
  const bottomPerformingHook =
    hookStats[hookStats.length - 1]?.hookType || "unknown";

  // Controversy analysis
  const controversyStats = hookStats.find((s) => s.hookType === "controversy");
  const controversyVsAverage = {
    exists: !!controversyStats,
    engagementMultiplier: controversyStats
      ? controversyStats.avgEngagementRate / overallAvgEngagement
      : undefined,
    viewsMultiplier: controversyStats
      ? controversyStats.avgViews / overallAvgViews
      : undefined,
  };

  // Generate insights
  const keyInsights: string[] = [];

  if (hookStats.length > 0) {
    keyInsights.push(
      `${topPerformingHook} hooks have the highest engagement rate (${hookStats[0].avgEngagementRate.toFixed(2)}%)`
    );
  }

  if (hookStats.length > 1) {
    const top = hookStats[0];
    const bottom = hookStats[hookStats.length - 1];
    const multiplier = (top.avgEngagementRate / bottom.avgEngagementRate).toFixed(1);
    keyInsights.push(
      `${top.hookType} hooks outperform ${bottom.hookType} by ${multiplier}x in engagement rate`
    );
  }

  if (controversyVsAverage.exists && controversyVsAverage.engagementMultiplier) {
    const mult = controversyVsAverage.engagementMultiplier;
    if (mult > 1.2) {
      keyInsights.push(
        `Controversy hooks outperform average by ${((mult - 1) * 100).toFixed(0)}%`
      );
    } else if (mult < 0.8) {
      keyInsights.push(
        `Controversy hooks underperform average by ${((1 - mult) * 100).toFixed(0)}%`
      );
    } else {
      keyInsights.push(`Controversy hooks perform similar to average`);
    }
  }

  // Views vs engagement correlation
  const highViewsVideos = videos.filter(
    (v) => v.engagement.views > overallAvgViews * 2
  );
  if (highViewsVideos.length > 0) {
    const hookTypesInHighViews: Record<string, number> = {};
    for (const v of highViewsVideos) {
      hookTypesInHighViews[v.hookType] =
        (hookTypesInHighViews[v.hookType] || 0) + 1;
    }
    const dominantHook = Object.entries(hookTypesInHighViews).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (dominantHook) {
      keyInsights.push(
        `${dominantHook[0]} is most common in viral videos (2x+ avg views)`
      );
    }
  }

  return {
    category,
    totalVideos: videos.length,
    hookStats,
    topPerformingHook,
    bottomPerformingHook,
    controversyVsAverage,
    keyInsights,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const specificCategory = args[0]?.toLowerCase();

  const benchmarkDir = join(process.cwd(), "data", "benchmarks");

  if (!existsSync(benchmarkDir)) {
    console.error("❌ No benchmarks found. Run scrape-category-benchmark.ts first.");
    process.exit(1);
  }

  // Find all categories
  const categories = readdirSync(benchmarkDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      if (specificCategory) return name === specificCategory;
      return true;
    });

  if (categories.length === 0) {
    console.error("❌ No benchmark data found for specified category");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          BENCHMARK CORRELATION ANALYSIS                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const allResults: CorrelationResult[] = [];
  let allVideos: BenchmarkVideo[] = [];

  for (const category of categories) {
    const videosPath = join(benchmarkDir, category, "videos.json");

    if (!existsSync(videosPath)) {
      console.log(`⚠️  Skipping ${category}: no videos.json found\n`);
      continue;
    }

    const videos: BenchmarkVideo[] = JSON.parse(
      readFileSync(videosPath, "utf-8")
    );

    if (videos.length < 5) {
      console.log(`⚠️  Skipping ${category}: only ${videos.length} videos (need 5+)\n`);
      continue;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  📊 ${category.toUpperCase()} (${videos.length} videos)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const result = analyzeCategory(videos);
    allResults.push(result);
    allVideos = allVideos.concat(videos);

    // Print hook performance table
    console.log("  HOOK TYPE PERFORMANCE (sorted by engagement rate):");
    console.log(
      "  ┌─────────────────┬───────┬──────────────┬──────────────┬─────────────┐"
    );
    console.log(
      "  │ Hook Type       │ Count │ Avg Views    │ Avg Eng Rate │ Eff Score   │"
    );
    console.log(
      "  ├─────────────────┼───────┼──────────────┼──────────────┼─────────────┤"
    );

    for (const stat of result.hookStats) {
      const hookType = stat.hookType.padEnd(15);
      const count = stat.count.toString().padStart(5);
      const views = formatNumber(stat.avgViews).padStart(12);
      const engagement = (stat.avgEngagementRate.toFixed(2) + "%").padStart(12);
      const effectiveness = (stat.avgEffectiveness.toFixed(0) + "/100").padStart(11);
      console.log(
        `  │ ${hookType} │ ${count} │ ${views} │ ${engagement} │ ${effectiveness} │`
      );
    }

    console.log(
      "  └─────────────────┴───────┴──────────────┴──────────────┴─────────────┘"
    );

    // Print insights
    console.log("\n  💡 KEY INSIGHTS:");
    for (const insight of result.keyInsights) {
      console.log(`     • ${insight}`);
    }

    // Controversy specific analysis
    if (result.controversyVsAverage.exists) {
      const mult = result.controversyVsAverage.engagementMultiplier!;
      const emoji = mult > 1 ? "✅" : mult < 1 ? "❌" : "➖";
      console.log(
        `\n  🔥 CONTROVERSY HOOKS: ${emoji} ${mult.toFixed(2)}x average engagement`
      );
    }
  }

  // Cross-category analysis
  if (allResults.length > 1) {
    console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║              CROSS-CATEGORY ANALYSIS                         ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    // Best hook type per category
    console.log("  BEST PERFORMING HOOK BY CATEGORY:");
    for (const result of allResults) {
      const top = result.hookStats[0];
      if (top) {
        console.log(
          `     ${result.category.padEnd(15)} → ${top.hookType} (${top.avgEngagementRate.toFixed(2)}%)`
        );
      }
    }

    // Aggregate hook performance across all categories
    console.log("\n  AGGREGATE HOOK PERFORMANCE (all categories):");
    const aggregateResult = analyzeCategory(allVideos);

    console.log(
      "  ┌─────────────────┬───────┬──────────────┬──────────────┐"
    );
    console.log(
      "  │ Hook Type       │ Count │ Avg Views    │ Avg Eng Rate │"
    );
    console.log(
      "  ├─────────────────┼───────┼──────────────┼──────────────┤"
    );

    for (const stat of aggregateResult.hookStats.slice(0, 10)) {
      const hookType = stat.hookType.padEnd(15);
      const count = stat.count.toString().padStart(5);
      const views = formatNumber(stat.avgViews).padStart(12);
      const engagement = (stat.avgEngagementRate.toFixed(2) + "%").padStart(12);
      console.log(
        `  │ ${hookType} │ ${count} │ ${views} │ ${engagement} │`
      );
    }

    console.log(
      "  └─────────────────┴───────┴──────────────┴─────────────┘"
    );
  }

  // Answer the key question
  console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║    ❓ DO CONTROVERSY HOOKS ACTUALLY OUTPERFORM?              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const controversyVideos = allVideos.filter((v) => v.hookType === "controversy");
  const nonControversyVideos = allVideos.filter((v) => v.hookType !== "controversy");

  if (controversyVideos.length >= 2) {
    const contAvgEng =
      controversyVideos.reduce((a, b) => a + b.engagement.engagementRate, 0) /
      controversyVideos.length;
    const nonContAvgEng =
      nonControversyVideos.reduce((a, b) => a + b.engagement.engagementRate, 0) /
      nonControversyVideos.length;

    const contAvgViews =
      controversyVideos.reduce((a, b) => a + b.engagement.views, 0) /
      controversyVideos.length;
    const nonContAvgViews =
      nonControversyVideos.reduce((a, b) => a + b.engagement.views, 0) /
      nonControversyVideos.length;

    console.log(`  Sample size: ${controversyVideos.length} controversy vs ${nonControversyVideos.length} other\n`);

    console.log("  ENGAGEMENT RATE:");
    console.log(`     Controversy:     ${contAvgEng.toFixed(2)}%`);
    console.log(`     Non-controversy: ${nonContAvgEng.toFixed(2)}%`);
    console.log(`     Multiplier:      ${(contAvgEng / nonContAvgEng).toFixed(2)}x\n`);

    console.log("  VIEWS:");
    console.log(`     Controversy:     ${formatNumber(contAvgViews)}`);
    console.log(`     Non-controversy: ${formatNumber(nonContAvgViews)}`);
    console.log(`     Multiplier:      ${(contAvgViews / nonContAvgViews).toFixed(2)}x\n`);

    if (contAvgEng > nonContAvgEng * 1.2) {
      console.log("  📈 VERDICT: YES - Controversy hooks outperform by " +
        `${((contAvgEng / nonContAvgEng - 1) * 100).toFixed(0)}%`);
    } else if (contAvgEng < nonContAvgEng * 0.8) {
      console.log("  📉 VERDICT: NO - Controversy hooks underperform by " +
        `${((1 - contAvgEng / nonContAvgEng) * 100).toFixed(0)}%`);
    } else {
      console.log("  ➖ VERDICT: NO SIGNIFICANT DIFFERENCE");
    }
  } else {
    console.log("  ⚠️  Insufficient controversy hook data for analysis");
    console.log(`     (Found ${controversyVideos.length} controversy videos, need 2+)`);
  }

  // Save results
  const outputPath = join(benchmarkDir, "correlation-analysis.json");
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        analyzedAt: new Date().toISOString(),
        totalVideos: allVideos.length,
        categories: allResults,
        controversyAnalysis: {
          count: controversyVideos.length,
          avgEngagementRate:
            controversyVideos.length > 0
              ? controversyVideos.reduce((a, b) => a + b.engagement.engagementRate, 0) / controversyVideos.length
              : 0,
          avgViews:
            controversyVideos.length > 0
              ? controversyVideos.reduce((a, b) => a + b.engagement.views, 0) / controversyVideos.length
              : 0,
        },
      },
      null,
      2
    )
  );

  console.log(`\n📁 Full analysis saved to: ${outputPath}`);
}

main().catch(console.error);
