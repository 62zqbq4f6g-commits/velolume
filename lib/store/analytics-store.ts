/**
 * Analytics Store
 *
 * Tracks views, clicks, and conversions for Velolume stores.
 * Simple file-based storage, upgradeable to Supabase/ClickHouse.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const ANALYTICS_FILE = join(DATA_DIR, "analytics.json");

export type EventType = "view" | "click" | "buy" | "share" | "scroll";

export interface AnalyticsEvent {
  id: string;
  storeId: string;
  productId?: string;
  eventType: EventType;
  timestamp: string;
  metadata?: {
    source?: string;
    referrer?: string;
    device?: string;
    country?: string;
    sessionId?: string;
  };
}

export interface StoreAnalytics {
  storeId: string;
  views: number;
  uniqueViews: number;
  clicks: number;
  buys: number;
  shares: number;
  conversionRate: number;
  lastUpdated: string;
  hourlyViews: Record<string, number>;
  dailyViews: Record<string, number>;
  topProducts: Array<{ productId: string; clicks: number; buys: number }>;
}

interface AnalyticsDatabase {
  events: AnalyticsEvent[];
  aggregates: Record<string, StoreAnalytics>;
  lastUpdated: string;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAnalytics(): AnalyticsDatabase {
  ensureDataDir();

  if (!existsSync(ANALYTICS_FILE)) {
    return { events: [], aggregates: {}, lastUpdated: new Date().toISOString() };
  }

  try {
    const data = readFileSync(ANALYTICS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { events: [], aggregates: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveAnalytics(db: AnalyticsDatabase): void {
  ensureDataDir();
  db.lastUpdated = new Date().toISOString();

  // Keep only last 10,000 events to prevent file bloat
  if (db.events.length > 10000) {
    db.events = db.events.slice(-10000);
  }

  writeFileSync(ANALYTICS_FILE, JSON.stringify(db, null, 2));
}

/**
 * Generate event ID
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get hour key for bucketing
 */
function getHourKey(date: Date): string {
  return date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
}

/**
 * Get day key for bucketing
 */
function getDayKey(date: Date): string {
  return date.toISOString().substring(0, 10); // YYYY-MM-DD
}

/**
 * Track an analytics event
 */
export function trackEvent(
  storeId: string,
  eventType: EventType,
  productId?: string,
  metadata?: AnalyticsEvent["metadata"]
): AnalyticsEvent {
  const db = loadAnalytics();
  const now = new Date();

  const event: AnalyticsEvent = {
    id: generateEventId(),
    storeId,
    productId,
    eventType,
    timestamp: now.toISOString(),
    metadata,
  };

  db.events.push(event);

  // Update aggregates
  if (!db.aggregates[storeId]) {
    db.aggregates[storeId] = {
      storeId,
      views: 0,
      uniqueViews: 0,
      clicks: 0,
      buys: 0,
      shares: 0,
      conversionRate: 0,
      lastUpdated: now.toISOString(),
      hourlyViews: {},
      dailyViews: {},
      topProducts: [],
    };
  }

  const agg = db.aggregates[storeId];
  const hourKey = getHourKey(now);
  const dayKey = getDayKey(now);

  switch (eventType) {
    case "view":
      agg.views++;
      agg.hourlyViews[hourKey] = (agg.hourlyViews[hourKey] || 0) + 1;
      agg.dailyViews[dayKey] = (agg.dailyViews[dayKey] || 0) + 1;
      break;
    case "click":
      agg.clicks++;
      if (productId) {
        const productStat = agg.topProducts.find((p) => p.productId === productId);
        if (productStat) {
          productStat.clicks++;
        } else {
          agg.topProducts.push({ productId, clicks: 1, buys: 0 });
        }
      }
      break;
    case "buy":
      agg.buys++;
      if (productId) {
        const productStat = agg.topProducts.find((p) => p.productId === productId);
        if (productStat) {
          productStat.buys++;
        } else {
          agg.topProducts.push({ productId, clicks: 0, buys: 1 });
        }
      }
      break;
    case "share":
      agg.shares++;
      break;
  }

  // Recalculate conversion rate
  agg.conversionRate = agg.views > 0 ? (agg.buys / agg.views) * 100 : 0;
  agg.lastUpdated = now.toISOString();

  // Sort top products by clicks
  agg.topProducts.sort((a, b) => b.clicks - a.clicks);
  agg.topProducts = agg.topProducts.slice(0, 10);

  // Keep only last 7 days of hourly data
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoffHour = getHourKey(sevenDaysAgo);
  Object.keys(agg.hourlyViews).forEach((key) => {
    if (key < cutoffHour) {
      delete agg.hourlyViews[key];
    }
  });

  // Keep only last 30 days of daily data
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoffDay = getDayKey(thirtyDaysAgo);
  Object.keys(agg.dailyViews).forEach((key) => {
    if (key < cutoffDay) {
      delete agg.dailyViews[key];
    }
  });

  saveAnalytics(db);
  return event;
}

/**
 * Get analytics for a store
 */
export function getStoreAnalytics(storeId: string): StoreAnalytics | null {
  const db = loadAnalytics();
  return db.aggregates[storeId] || null;
}

/**
 * Get recent events for a store
 */
export function getRecentEvents(storeId: string, limit = 50): AnalyticsEvent[] {
  const db = loadAnalytics();
  return db.events
    .filter((e) => e.storeId === storeId)
    .slice(-limit)
    .reverse();
}

/**
 * Get all store analytics (for dashboard)
 */
export function getAllStoreAnalytics(): StoreAnalytics[] {
  const db = loadAnalytics();
  return Object.values(db.aggregates).sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

/**
 * Get real-time pulse data (last hour stats)
 */
export function getPulseData(storeId: string): {
  viewsLastHour: number;
  clicksLastHour: number;
  trend: "up" | "down" | "stable";
} {
  const db = loadAnalytics();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const recentEvents = db.events.filter(
    (e) => e.storeId === storeId && new Date(e.timestamp) >= oneHourAgo
  );

  const previousEvents = db.events.filter(
    (e) =>
      e.storeId === storeId &&
      new Date(e.timestamp) >= twoHoursAgo &&
      new Date(e.timestamp) < oneHourAgo
  );

  const viewsLastHour = recentEvents.filter((e) => e.eventType === "view").length;
  const clicksLastHour = recentEvents.filter((e) => e.eventType === "click").length;
  const viewsPreviousHour = previousEvents.filter((e) => e.eventType === "view").length;

  let trend: "up" | "down" | "stable" = "stable";
  if (viewsLastHour > viewsPreviousHour * 1.1) {
    trend = "up";
  } else if (viewsLastHour < viewsPreviousHour * 0.9) {
    trend = "down";
  }

  return { viewsLastHour, clicksLastHour, trend };
}
