"use client";

import { useCallback, useEffect, useRef } from "react";

type EventType = "view" | "click" | "buy" | "share" | "scroll";

interface TrackEventOptions {
  productId?: string;
  source?: string;
  metadata?: Record<string, string>;
}

/**
 * Analytics hook for tracking store events
 *
 * Usage:
 * const { trackView, trackClick, trackBuy, trackShare } = useAnalytics(storeId);
 *
 * // Track page view on mount
 * useEffect(() => { trackView(); }, [trackView]);
 *
 * // Track buy click
 * <button onClick={() => trackBuy(productId)}>Buy Now</button>
 */
export function useAnalytics(storeId: string) {
  const sessionId = useRef<string | null>(null);
  const hasTrackedView = useRef(false);

  // Generate or retrieve session ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedSessionId = sessionStorage.getItem("velolume_session");
      if (!storedSessionId) {
        storedSessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem("velolume_session", storedSessionId);
      }
      sessionId.current = storedSessionId;
    }
  }, []);

  const track = useCallback(
    async (eventType: EventType, options: TrackEventOptions = {}) => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId,
            eventType,
            productId: options.productId,
            metadata: {
              ...options.metadata,
              source: options.source,
              sessionId: sessionId.current,
              referrer: typeof document !== "undefined" ? document.referrer : undefined,
            },
          }),
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug("[Analytics] Failed to track event:", error);
      }
    },
    [storeId]
  );

  const trackView = useCallback(
    (options?: TrackEventOptions) => {
      // Only track view once per page load
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;
      track("view", options);
    },
    [track]
  );

  const trackClick = useCallback(
    (productId?: string, options?: TrackEventOptions) => {
      track("click", { ...options, productId });
    },
    [track]
  );

  const trackBuy = useCallback(
    (productId?: string, options?: TrackEventOptions) => {
      track("buy", { ...options, productId });
    },
    [track]
  );

  const trackShare = useCallback(
    (options?: TrackEventOptions) => {
      track("share", options);
    },
    [track]
  );

  const trackScroll = useCallback(
    (depth: number, options?: TrackEventOptions) => {
      track("scroll", { ...options, metadata: { ...options?.metadata, depth: depth.toString() } });
    },
    [track]
  );

  return {
    track,
    trackView,
    trackClick,
    trackBuy,
    trackShare,
    trackScroll,
  };
}

/**
 * Auto-track page view on component mount
 */
export function usePageView(storeId: string) {
  const { trackView } = useAnalytics(storeId);

  useEffect(() => {
    trackView();
  }, [trackView]);
}
