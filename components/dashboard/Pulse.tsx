"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Eye,
  MousePointer,
  ShoppingBag,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface PulseData {
  views: number;
  clicks: number;
  buys: number;
  shares: number;
  conversionRate: number;
  viewsLastHour: number;
  clicksLastHour: number;
  trend: "up" | "down" | "stable";
}

interface PulseProps {
  storeId?: string;
  pollInterval?: number;
  showRealtime?: boolean;
}

export function Pulse({ storeId, pollInterval = 5000, showRealtime = true }: PulseProps) {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch summary
      const summaryUrl = storeId
        ? `/api/analytics?storeId=${storeId}`
        : `/api/analytics?type=all`;

      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      // Fetch pulse data if we have a storeId
      let pulseData = { viewsLastHour: 0, clicksLastHour: 0, trend: "stable" as const };
      if (storeId) {
        const pulseRes = await fetch(`/api/analytics?storeId=${storeId}&type=pulse`);
        pulseData = await pulseRes.json();
      }

      // Aggregate if fetching all stores
      if (!storeId && summaryData.analytics) {
        const totals = summaryData.analytics.reduce(
          (acc: any, store: any) => ({
            views: acc.views + (store.views || 0),
            clicks: acc.clicks + (store.clicks || 0),
            buys: acc.buys + (store.buys || 0),
            shares: acc.shares + (store.shares || 0),
          }),
          { views: 0, clicks: 0, buys: 0, shares: 0 }
        );

        setData({
          ...totals,
          conversionRate: totals.views > 0 ? (totals.buys / totals.views) * 100 : 0,
          viewsLastHour: 0,
          clicksLastHour: 0,
          trend: "stable",
        });
      } else {
        setData({
          views: summaryData.views || 0,
          clicks: summaryData.clicks || 0,
          buys: summaryData.buys || 0,
          shares: summaryData.shares || 0,
          conversionRate: summaryData.conversionRate || 0,
          ...pulseData,
        });
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, pollInterval]);

  const TrendIcon = data?.trend === "up" ? TrendingUp : data?.trend === "down" ? TrendingDown : Minus;
  const trendColor = data?.trend === "up" ? "text-green-500" : data?.trend === "down" ? "text-red-500" : "text-industrial-dark";

  if (loading) {
    return (
      <div className="studio-card p-8">
        <div className="flex items-center justify-center gap-3 text-industrial-dark">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          <span className="font-mono text-sm">Loading pulse data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-industrial-grey flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-velolume-500" strokeWidth={1.5} />
          <h3 className="font-mono text-sm uppercase tracking-wider text-velolume-500">
            Analytics Pulse
          </h3>
          {showRealtime && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 font-mono text-[10px] uppercase tracking-wider rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2 hover:bg-industrial-grey/50 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-industrial-dark" strokeWidth={1.5} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-red-600 font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-industrial-grey">
        {/* Views */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-velolume-500" strokeWidth={1.5} />
            <span className="font-mono text-xs text-industrial-dark uppercase tracking-wider">
              Views
            </span>
          </div>
          <p className="font-mono text-3xl text-velolume-500 mb-1">
            {formatNumber(data?.views || 0)}
          </p>
          {showRealtime && (
            <p className="font-mono text-xs text-industrial-dark/50">
              +{data?.viewsLastHour || 0} last hour
            </p>
          )}
        </div>

        {/* Clicks */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <MousePointer className="w-4 h-4 text-mocha-400" strokeWidth={1.5} />
            <span className="font-mono text-xs text-industrial-dark uppercase tracking-wider">
              Clicks
            </span>
          </div>
          <p className="font-mono text-3xl text-velolume-500 mb-1">
            {formatNumber(data?.clicks || 0)}
          </p>
          {showRealtime && (
            <p className="font-mono text-xs text-industrial-dark/50">
              +{data?.clicksLastHour || 0} last hour
            </p>
          )}
        </div>

        {/* Purchases */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-green-600" strokeWidth={1.5} />
            <span className="font-mono text-xs text-industrial-dark uppercase tracking-wider">
              Purchases
            </span>
          </div>
          <p className="font-mono text-3xl text-velolume-500 mb-1">
            {formatNumber(data?.buys || 0)}
          </p>
          <p className="font-mono text-xs text-industrial-dark/50">
            {(data?.conversionRate || 0).toFixed(1)}% conversion
          </p>
        </div>

        {/* Shares */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
            <span className="font-mono text-xs text-industrial-dark uppercase tracking-wider">
              Shares
            </span>
          </div>
          <p className="font-mono text-3xl text-velolume-500 mb-1">
            {formatNumber(data?.shares || 0)}
          </p>
          {showRealtime && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-3 h-3" strokeWidth={1.5} />
              <span className="font-mono text-xs">
                {data?.trend === "up" ? "Trending" : data?.trend === "down" ? "Declining" : "Stable"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-industrial-grey bg-industrial-grey/20">
        <div className="flex items-center justify-between">
          <p className="text-industrial-dark/50 font-mono text-xs">
            {storeId ? `Store: ${storeId.substring(0, 12)}...` : "All Stores"} | Polling every {pollInterval / 1000}s
          </p>
          {lastUpdated && (
            <p className="text-industrial-dark/50 font-mono text-xs">
              Updated {formatTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString();
}
