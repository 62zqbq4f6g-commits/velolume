/**
 * Skimlinks Integration
 *
 * Auto-converts any merchant URL to affiliate link via Skimlinks.
 * Covers 48,500+ merchants globally with 25% revenue share.
 *
 * Two methods:
 * 1. URL redirect (no API key needed) - generates redirect URL
 * 2. API conversion (requires API key) - returns final affiliate URL
 */

import { SKIMLINKS_CONFIG, AFFILIATE_CONFIG } from "./config";
import {
  AffiliateResult,
  AffiliateMetadata,
  ConversionResult,
  SKIMLINKS_COMMISSION_RATES,
} from "./types";

// ============================================================================
// URL Generation (No API Key Required)
// ============================================================================

/**
 * Generate Skimlinks redirect URL
 * This works without an API key - the redirect URL handles affiliate conversion
 *
 * Format: https://go.skimresources.com?id={publisherId}&xs={trackingId}&url={encodedUrl}
 */
export function generateSkimlinksRedirect(
  url: string,
  metadata?: AffiliateMetadata
): ConversionResult {
  try {
    // Validate URL
    new URL(url);

    const publisherId = SKIMLINKS_CONFIG.publisherId;

    // Build tracking ID
    const trackingId = metadata?.videoId
      ? metadata.productIndex !== undefined
        ? `${AFFILIATE_CONFIG.trackingPrefix}-${metadata.videoId}-${metadata.productIndex}`
        : `${AFFILIATE_CONFIG.trackingPrefix}-${metadata.videoId}`
      : AFFILIATE_CONFIG.trackingPrefix;

    // Encode the destination URL
    const encodedUrl = encodeURIComponent(url);

    // Build Skimlinks redirect URL
    const affiliateUrl = `https://${SKIMLINKS_CONFIG.redirectFormat}?id=${publisherId}&xs=${trackingId}&url=${encodedUrl}`;

    if (AFFILIATE_CONFIG.debug) {
      console.log(`[Skimlinks] Generated redirect: ${url} -> ${affiliateUrl}`);
    }

    return {
      success: true,
      affiliateUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate Skimlinks redirect: ${error}`,
    };
  }
}

// ============================================================================
// API Conversion (Requires API Key)
// ============================================================================

/**
 * Convert URL via Skimlinks API
 * Returns the actual affiliate URL (not a redirect)
 *
 * Note: Requires SKIMLINKS_API_KEY to be set
 */
export async function convertViaSkimlinksAPI(
  url: string,
  metadata?: AffiliateMetadata
): Promise<ConversionResult> {
  // If no API key, fall back to redirect method
  if (!SKIMLINKS_CONFIG.apiKey) {
    if (AFFILIATE_CONFIG.debug) {
      console.log("[Skimlinks] No API key, using redirect method");
    }
    return generateSkimlinksRedirect(url, metadata);
  }

  try {
    // Build tracking ID
    const trackingId = metadata?.videoId
      ? `${metadata.videoId}${metadata.productIndex !== undefined ? `-${metadata.productIndex}` : ""}`
      : undefined;

    // Call Skimlinks Link API
    const response = await fetch(`${SKIMLINKS_CONFIG.linkApiUrl}/link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SKIMLINKS_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        publisher_id: SKIMLINKS_CONFIG.publisherId,
        xs: trackingId, // Custom tracking parameter
      }),
      signal: AbortSignal.timeout(AFFILIATE_CONFIG.apiTimeout),
    });

    if (!response.ok) {
      throw new Error(`Skimlinks API returned ${response.status}`);
    }

    const data = await response.json();

    if (AFFILIATE_CONFIG.debug) {
      console.log(`[Skimlinks] API response:`, data);
    }

    return {
      success: true,
      affiliateUrl: data.url || data.affiliate_url,
    };
  } catch (error) {
    // Fall back to redirect method on API failure
    if (AFFILIATE_CONFIG.debug) {
      console.log(`[Skimlinks] API failed, falling back to redirect: ${error}`);
    }
    return generateSkimlinksRedirect(url, metadata);
  }
}

// ============================================================================
// Retailer Detection
// ============================================================================

/**
 * Extract retailer name from URL
 */
export function extractRetailerFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.toLowerCase().replace("www.", "");

    // Remove common subdomains
    hostname = hostname.replace(/^(shop|store|buy|m)\./i, "");

    // Extract main domain name
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      // Handle .co.uk, .com.au etc
      if (
        parts.length > 2 &&
        ["co", "com", "net", "org"].includes(parts[parts.length - 2])
      ) {
        return parts[parts.length - 3];
      }
      return parts[parts.length - 2];
    }

    return hostname;
  } catch {
    return "unknown";
  }
}

/**
 * Get display-friendly retailer name
 */
export function getRetailerDisplayName(url: string): string {
  const retailer = extractRetailerFromUrl(url);

  // Common retailer name mappings
  const displayNames: Record<string, string> = {
    walmart: "Walmart",
    target: "Target",
    nordstrom: "Nordstrom",
    macys: "Macy's",
    bloomingdales: "Bloomingdale's",
    sephora: "Sephora",
    ulta: "Ulta Beauty",
    nike: "Nike",
    adidas: "Adidas",
    zara: "Zara",
    hm: "H&M",
    asos: "ASOS",
    gap: "Gap",
    oldnavy: "Old Navy",
    bananarepublic: "Banana Republic",
    anthropologie: "Anthropologie",
    freepeople: "Free People",
    urbanoutfitters: "Urban Outfitters",
    revolve: "Revolve",
    lulus: "Lulus",
    zappos: "Zappos",
    dsw: "DSW",
    footlocker: "Foot Locker",
    finishline: "Finish Line",
    kohls: "Kohl's",
    jcpenney: "JCPenney",
    belk: "Belk",
    dillards: "Dillard's",
    saksfifthavenue: "Saks Fifth Avenue",
    neimanmarcus: "Neiman Marcus",
    bergdorfgoodman: "Bergdorf Goodman",
    farfetch: "Farfetch",
    ssense: "SSENSE",
    matchesfashion: "MATCHESFASHION",
    mytheresa: "Mytheresa",
    net: "Net-A-Porter",
    mrporter: "Mr Porter",
    google: "Google Shopping",
  };

  return displayNames[retailer] || capitalizeFirst(retailer);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// Commission Estimation
// ============================================================================

/**
 * Estimate commission rate (after Skimlinks 25% cut)
 */
export function estimateSkimlinksCommission(category?: string): number {
  // Base commission varies by merchant/category
  // Skimlinks takes 25%, so we estimate the net rate
  const baseRate = SKIMLINKS_COMMISSION_RATES.default.average;

  // Most fashion/beauty merchants offer 3-8%, after 25% cut = ~2.25-6%
  // We use a conservative estimate
  return baseRate;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Convert any URL to affiliate link via Skimlinks
 */
export async function convertSkimlinks(
  url: string,
  metadata?: AffiliateMetadata
): Promise<AffiliateResult> {
  // Try API first, falls back to redirect
  const result = await convertViaSkimlinksAPI(url, metadata);

  if (!result.success || !result.affiliateUrl) {
    throw new Error(result.error || "Failed to convert via Skimlinks");
  }

  const retailer = getRetailerDisplayName(url);
  const trackingId = metadata?.videoId
    ? `${metadata.videoId}${metadata.productIndex !== undefined ? `-${metadata.productIndex}` : ""}`
    : undefined;

  return {
    originalUrl: url,
    affiliateUrl: result.affiliateUrl,
    network: "skimlinks",
    retailer,
    estimatedCommission: estimateSkimlinksCommission(metadata?.category),
    metadata: {
      videoId: metadata?.videoId,
      productIndex: metadata?.productIndex,
      trackingId,
    },
  };
}

// ============================================================================
// Batch Conversion
// ============================================================================

/**
 * Convert multiple URLs in batch
 */
export async function convertSkimlinksBatch(
  urls: string[],
  baseMetadata?: { videoId?: string }
): Promise<AffiliateResult[]> {
  const results = await Promise.all(
    urls.map((url, index) =>
      convertSkimlinks(url, {
        ...baseMetadata,
        productIndex: index,
      })
    )
  );

  return results;
}
