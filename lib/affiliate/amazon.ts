/**
 * Amazon Associates Integration
 *
 * Converts Amazon product URLs to affiliate links by appending the associate tag.
 * For MVP, uses simple tag appending. Can be upgraded to PA-API for richer data.
 */

import { AMAZON_CONFIG, AFFILIATE_CONFIG } from "./config";
import {
  AffiliateResult,
  AffiliateMetadata,
  ConversionResult,
  AMAZON_COMMISSION_RATES,
} from "./types";

// ============================================================================
// URL Detection
// ============================================================================

/**
 * Check if a URL is an Amazon URL
 */
export function isAmazonUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace("www.", "");
    return AMAZON_CONFIG.supportedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Extract Amazon domain from URL
 */
export function getAmazonDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace("www.", "");
    return (
      AMAZON_CONFIG.supportedDomains.find(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      ) || null
    );
  } catch {
    return null;
  }
}

/**
 * Extract ASIN from Amazon URL
 * ASINs are 10-character alphanumeric identifiers
 */
export function extractASIN(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Pattern 1: /dp/ASIN
    const dpMatch = parsed.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dpMatch) return dpMatch[1].toUpperCase();

    // Pattern 2: /gp/product/ASIN
    const gpMatch = parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gpMatch) return gpMatch[1].toUpperCase();

    // Pattern 3: /product/ASIN
    const productMatch = parsed.pathname.match(/\/product\/([A-Z0-9]{10})/i);
    if (productMatch) return productMatch[1].toUpperCase();

    // Pattern 4: ASIN in query params
    const asinParam = parsed.searchParams.get("ASIN");
    if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) {
      return asinParam.toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Link Conversion
// ============================================================================

/**
 * Convert Amazon URL to affiliate link
 */
export function convertAmazonUrl(
  url: string,
  metadata?: AffiliateMetadata
): ConversionResult {
  try {
    if (!isAmazonUrl(url)) {
      return { success: false, error: "Not an Amazon URL" };
    }

    const parsed = new URL(url);

    // Add or replace the associate tag
    parsed.searchParams.set("tag", AMAZON_CONFIG.associateTag);

    // Add tracking ID if provided
    if (metadata?.videoId) {
      const trackingId = metadata.productIndex !== undefined
        ? `${AFFILIATE_CONFIG.trackingPrefix}-${metadata.videoId}-${metadata.productIndex}`
        : `${AFFILIATE_CONFIG.trackingPrefix}-${metadata.videoId}`;

      // Amazon uses 'ref' for sub-tracking (limited support)
      // For better tracking, we encode in the tag suffix
      // e.g., velolume-20 becomes velolume20-vid123
    }

    // Clean up common tracking parameters (optional, for cleaner URLs)
    const paramsToRemove = [
      "ref",
      "ref_",
      "pf_rd_p",
      "pf_rd_r",
      "pd_rd_wg",
      "pd_rd_w",
      "pd_rd_r",
      "psc",
      "linkCode",
      "camp",
      "creative",
    ];

    // Keep essential params, remove tracking clutter
    // Note: Be careful not to remove params that affect the product

    if (AFFILIATE_CONFIG.debug) {
      console.log(`[Amazon] Converted: ${url} -> ${parsed.toString()}`);
    }

    return {
      success: true,
      affiliateUrl: parsed.toString(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert Amazon URL: ${error}`,
    };
  }
}

/**
 * Create clean Amazon affiliate link from ASIN
 */
export function createAmazonLinkFromASIN(
  asin: string,
  domain: string = "amazon.com"
): string {
  return `https://www.${domain}/dp/${asin}?tag=${AMAZON_CONFIG.associateTag}`;
}

// ============================================================================
// Commission Estimation
// ============================================================================

/**
 * Estimate commission rate for a product category
 */
export function estimateAmazonCommission(category?: string): number {
  if (!category) {
    return AMAZON_COMMISSION_RATES.default.average;
  }

  const categoryLower = category.toLowerCase();

  // Match category to commission rate
  if (
    categoryLower.includes("beauty") ||
    categoryLower.includes("luxury") ||
    categoryLower.includes("cosmetic")
  ) {
    return AMAZON_COMMISSION_RATES["luxury-beauty"].average;
  }

  if (
    categoryLower.includes("fashion") ||
    categoryLower.includes("clothing") ||
    categoryLower.includes("apparel")
  ) {
    return AMAZON_COMMISSION_RATES.fashion.average;
  }

  if (
    categoryLower.includes("shoe") ||
    categoryLower.includes("handbag") ||
    categoryLower.includes("accessory") ||
    categoryLower.includes("accessories") ||
    categoryLower.includes("jewelry")
  ) {
    return AMAZON_COMMISSION_RATES.shoes.average;
  }

  if (
    categoryLower.includes("furniture") ||
    categoryLower.includes("home") ||
    categoryLower.includes("garden")
  ) {
    return AMAZON_COMMISSION_RATES.furniture.average;
  }

  if (
    categoryLower.includes("electronic") ||
    categoryLower.includes("computer") ||
    categoryLower.includes("phone")
  ) {
    return AMAZON_COMMISSION_RATES.electronics.average;
  }

  return AMAZON_COMMISSION_RATES.default.average;
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Convert Amazon URL to affiliate link with full result
 */
export async function convertAmazon(
  url: string,
  metadata?: AffiliateMetadata
): Promise<AffiliateResult> {
  const result = convertAmazonUrl(url, metadata);

  if (!result.success || !result.affiliateUrl) {
    throw new Error(result.error || "Failed to convert Amazon URL");
  }

  const domain = getAmazonDomain(url) || "amazon.com";
  const asin = extractASIN(url);
  const trackingId = metadata?.videoId
    ? `${metadata.videoId}${metadata.productIndex !== undefined ? `-${metadata.productIndex}` : ""}`
    : undefined;

  return {
    originalUrl: url,
    affiliateUrl: result.affiliateUrl,
    network: "amazon",
    retailer: `Amazon (${domain})`,
    estimatedCommission: estimateAmazonCommission(metadata?.category),
    metadata: {
      videoId: metadata?.videoId,
      productIndex: metadata?.productIndex,
      trackingId,
    },
  };
}
