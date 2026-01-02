/**
 * API Route: /api/analytics
 *
 * Track and retrieve store analytics.
 * Supports view tracking, click events, and conversion metrics.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  trackEvent,
  getStoreAnalytics,
  getRecentEvents,
  getAllStoreAnalytics,
  getPulseData,
  EventType,
} from "@/lib/store/analytics-store";

// GET: Retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const type = searchParams.get("type") || "summary"; // summary, events, pulse, all

    if (type === "all") {
      const analytics = getAllStoreAnalytics();
      return NextResponse.json({ analytics, total: analytics.length });
    }

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    if (type === "pulse") {
      const pulse = getPulseData(storeId);
      return NextResponse.json(pulse);
    }

    if (type === "events") {
      const limit = parseInt(searchParams.get("limit") || "50");
      const events = getRecentEvents(storeId, limit);
      return NextResponse.json({ events, total: events.length });
    }

    // Default: summary
    const analytics = getStoreAnalytics(storeId);
    if (!analytics) {
      return NextResponse.json({
        storeId,
        views: 0,
        clicks: 0,
        buys: 0,
        shares: 0,
        conversionRate: 0,
      });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// POST: Track an analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, eventType, productId, metadata } = body;

    if (!storeId || !eventType) {
      return NextResponse.json(
        { error: "storeId and eventType are required" },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes: EventType[] = ["view", "click", "buy", "share", "scroll"];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Extract metadata from request headers if not provided
    const enrichedMetadata = {
      ...metadata,
      referrer: metadata?.referrer || request.headers.get("referer") || undefined,
      device: metadata?.device || parseUserAgent(request.headers.get("user-agent")),
    };

    const event = trackEvent(storeId, eventType, productId, enrichedMetadata);

    return NextResponse.json({
      success: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}

// Helper to parse user agent for device type
function parseUserAgent(ua: string | null): string {
  if (!ua) return "unknown";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}
