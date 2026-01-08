/**
 * Involve Asia Integration
 *
 * Converts Shopee and Lazada URLs to affiliate links.
 * Involve Asia is the primary affiliate network for SEA e-commerce.
 *
 * Supports:
 * - Shopee (SG, MY, ID, PH, VN, TH)
 * - Lazada (SG, MY, ID, PH, VN, TH)
 */

import { INVOLVE_ASIA_CONFIG, AFFILIATE_CONFIG } from "./config";
import {
  AffiliateResult,
  AffiliateMetadata,
  ConversionResult,
  RETAILER_MAP,
  SHOPEE_COMMISSION_RATES,
  LAZADA_COMMISSION_RATES,
} from "./types";

// ============================================================================
// URL Detection
// ============================================================================

/**
 * Check if URL is a Shopee URL
 */
export function isShopeeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.includes("shopee.");
  } catch {
    return false;
  }
}

/**
 * Check if URL is a Lazada URL
 */
export function isLazadaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.includes("lazada.");
  } catch {
    return false;
  }
}

/**
 * Check if URL is supported by Involve Asia
 */
export function isInvolveAsiaUrl(url: string): boolean {
  return isShopeeUrl(url) || isLazadaUrl(url);
}

/**
 * Get platform name from URL
 */
export function getPlatformFromUrl(url: string): "shopee" | "lazada" | null {
  if (isShopeeUrl(url)) return "shopee";
  if (isLazadaUrl(url)) return "lazada";
  return null;
}

/**
 * Get country code from URL
 */
export function getCountryFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Extract country TLD
    const match = hostname.match(
      /shopee\.(sg|com\.my|co\.id|ph|vn|co\.th)|lazada\.(sg|com\.my|co\.id|com\.ph|vn|co\.th)/
    );

    if (match) {
      const tld = match[1] || match[2];
      // Normalize to 2-letter country codes
      const countryMap: Record<string, string> = {
        sg: "SG",
        "com.my": "MY",
        "co.id": "ID",
        ph: "PH",
        "com.ph": "PH",
        vn: "VN",
        "co.th": "TH",
      };
      return countryMap[tld] || "SG";
    }

    return "SG"; // Default to Singapore
  } catch {
    return "SG";
  }
}

// ============================================================================
// Link Conversion
// ============================================================================

/**
 * Generate Involve Asia deep link (no API required)
 *
 * Format: https://invol.co/{publisherId}?u={encodedUrl}
 * or: https://{publisherId}.involve.asia/redirect?u={encodedUrl}
 */
export function generateInvolveAsiaDeepLink(
  url: string,
  metadata?: AffiliateMetadata
): ConversionResult {
  try {
    // Validate URL
    new URL(url);

    const publisherId = INVOLVE_ASIA_CONFIG.publisherId || "velolume";

    // Build tracking parameters
    const trackingParams: Record<string, string> = {};

    if (metadata?.videoId) {
      trackingParams.subid = metadata.productIndex !== undefined
        ? `${metadata.videoId}-${metadata.productIndex}`
        : metadata.videoId;
    }

    // Build query string
    const queryParts = [
      `u=${encodeURIComponent(url)}`,
      ...Object.entries(trackingParams).map(
        ([key, value]) => `${key}=${encodeURIComponent(value)}`
      ),
    ];

    // Build affiliate URL
    const affiliateUrl = `${INVOLVE_ASIA_CONFIG.deepLinkBase}/${publisherId}?${queryParts.join("&")}`;

    if (AFFILIATE_CONFIG.debug) {
      console.log(
        `[InvolveAsia] Generated deep link: ${url} -> ${affiliateUrl}`
      );
    }

    return {
      success: true,
      affiliateUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate Involve Asia deep link: ${error}`,
    };
  }
}

/**
 * Convert URL via Involve Asia API
 * Falls back to deep link if API unavailable
 */
export async function convertViaInvolveAsiaAPI(
  url: string,
  metadata?: AffiliateMetadata
): Promise<ConversionResult> {
  // If no API key, use deep link method
  if (
    !INVOLVE_ASIA_CONFIG.apiKey ||
    INVOLVE_ASIA_CONFIG.apiKey === "placeholder"
  ) {
    if (AFFILIATE_CONFIG.debug) {
      console.log("[InvolveAsia] No API key, using deep link method");
    }
    return generateInvolveAsiaDeepLink(url, metadata);
  }

  try {
    // Call Involve Asia API
    const response = await fetch(`${INVOLVE_ASIA_CONFIG.apiUrl}/links/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${INVOLVE_ASIA_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        subid: metadata?.videoId
          ? `${metadata.videoId}${metadata.productIndex !== undefined ? `-${metadata.productIndex}` : ""}`
          : undefined,
      }),
      signal: AbortSignal.timeout(AFFILIATE_CONFIG.apiTimeout),
    });

    if (!response.ok) {
      throw new Error(`Involve Asia API returned ${response.status}`);
    }

    const data = await response.json();

    if (AFFILIATE_CONFIG.debug) {
      console.log(`[InvolveAsia] API response:`, data);
    }

    return {
      success: true,
      affiliateUrl: data.affiliate_url || data.url,
    };
  } catch (error) {
    // Fall back to deep link on API failure
    if (AFFILIATE_CONFIG.debug) {
      console.log(
        `[InvolveAsia] API failed, falling back to deep link: ${error}`
      );
    }
    return generateInvolveAsiaDeepLink(url, metadata);
  }
}

// ============================================================================
// Retailer Info
// ============================================================================

/**
 * Get retailer display name
 */
export function getRetailerDisplayName(url: string): string {
  const platform = getPlatformFromUrl(url);
  const country = getCountryFromUrl(url);

  const countryNames: Record<string, string> = {
    SG: "Singapore",
    MY: "Malaysia",
    ID: "Indonesia",
    PH: "Philippines",
    VN: "Vietnam",
    TH: "Thailand",
  };

  const platformNames: Record<string, string> = {
    shopee: "Shopee",
    lazada: "Lazada",
  };

  if (platform) {
    return `${platformNames[platform]} ${countryNames[country] || country}`;
  }

  return "Unknown Retailer";
}

// ============================================================================
// Commission Estimation
// ============================================================================

/**
 * Estimate commission rate for Shopee/Lazada
 */
export function estimateInvolveAsiaCommission(
  url: string,
  category?: string
): number {
  const platform = getPlatformFromUrl(url);
  const rates = platform === "shopee" ? SHOPEE_COMMISSION_RATES : LAZADA_COMMISSION_RATES;

  if (!category) {
    return rates.default.average;
  }

  const categoryLower = category.toLowerCase();

  if (
    categoryLower.includes("fashion") ||
    categoryLower.includes("clothing") ||
    categoryLower.includes("apparel")
  ) {
    return rates.fashion.average;
  }

  if (
    categoryLower.includes("beauty") ||
    categoryLower.includes("cosmetic") ||
    categoryLower.includes("skincare")
  ) {
    return rates.beauty.average;
  }

  if (
    categoryLower.includes("electronic") ||
    categoryLower.includes("phone") ||
    categoryLower.includes("gadget")
  ) {
    return rates.electronics.average;
  }

  return rates.default.average;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Convert Shopee/Lazada URL to affiliate link
 */
export async function convertInvolveAsia(
  url: string,
  metadata?: AffiliateMetadata
): Promise<AffiliateResult> {
  if (!isInvolveAsiaUrl(url)) {
    throw new Error("URL is not a Shopee or Lazada URL");
  }

  // Try API first, falls back to deep link
  const result = await convertViaInvolveAsiaAPI(url, metadata);

  if (!result.success || !result.affiliateUrl) {
    throw new Error(result.error || "Failed to convert via Involve Asia");
  }

  const retailer = getRetailerDisplayName(url);
  const trackingId = metadata?.videoId
    ? `${metadata.videoId}${metadata.productIndex !== undefined ? `-${metadata.productIndex}` : ""}`
    : undefined;

  return {
    originalUrl: url,
    affiliateUrl: result.affiliateUrl,
    network: "involve_asia",
    retailer,
    estimatedCommission: estimateInvolveAsiaCommission(url, metadata?.category),
    metadata: {
      videoId: metadata?.videoId,
      productIndex: metadata?.productIndex,
      trackingId,
    },
  };
}
