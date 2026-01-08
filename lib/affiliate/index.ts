/**
 * Affiliate Link Router
 *
 * Main entry point for converting product URLs to affiliate links.
 *
 * Routing Logic:
 * 1. Amazon URLs → Amazon Associates (direct tag append)
 * 2. Shopee/Lazada URLs → Involve Asia (SEA network)
 * 3. Everything else → Skimlinks (48,500+ merchants)
 *
 * Usage:
 *   const result = await getAffiliateLink(productUrl, { videoId: 'abc123', productIndex: 0 });
 *   console.log(result.affiliateUrl);
 */

import { AFFILIATE_CONFIG, getAffiliateStatus } from "./config";
import { AffiliateResult, AffiliateMetadata, AffiliateNetwork } from "./types";
import { isAmazonUrl, convertAmazon } from "./amazon";
import { isInvolveAsiaUrl, convertInvolveAsia } from "./involve-asia";
import { convertSkimlinks, getRetailerDisplayName } from "./skimlinks";

// Re-export types and utilities
export * from "./types";
export * from "./config";
export { isAmazonUrl, extractASIN, getAmazonDomain } from "./amazon";
export { isShopeeUrl, isLazadaUrl, isInvolveAsiaUrl } from "./involve-asia";
export { getRetailerDisplayName } from "./skimlinks";

// ============================================================================
// Main Router Function
// ============================================================================

/**
 * Convert a product URL to an affiliate link
 *
 * @param productUrl - The original product URL to convert
 * @param metadata - Optional tracking metadata (videoId, productIndex)
 * @returns AffiliateResult with original URL, affiliate URL, network, retailer, and commission
 *
 * @example
 * // Amazon URL
 * const result = await getAffiliateLink('https://www.amazon.com/dp/B08N5WRWNW');
 * // result.affiliateUrl = 'https://www.amazon.com/dp/B08N5WRWNW?tag=velolume-20'
 * // result.network = 'amazon'
 *
 * @example
 * // Shopee URL
 * const result = await getAffiliateLink('https://shopee.sg/product/123456');
 * // result.network = 'involve_asia'
 *
 * @example
 * // Other retailer (Walmart, Target, etc.)
 * const result = await getAffiliateLink('https://www.walmart.com/ip/12345');
 * // result.network = 'skimlinks'
 */
export async function getAffiliateLink(
  productUrl: string,
  metadata?: AffiliateMetadata
): Promise<AffiliateResult> {
  // Check if affiliate conversion is enabled
  if (!AFFILIATE_CONFIG.enabled) {
    return createPassthroughResult(productUrl, metadata);
  }

  try {
    // Route 1: Amazon URLs → Amazon Associates
    if (isAmazonUrl(productUrl)) {
      if (AFFILIATE_CONFIG.debug) {
        console.log(`[Affiliate] Routing to Amazon: ${productUrl}`);
      }
      return await convertAmazon(productUrl, metadata);
    }

    // Route 2: Shopee/Lazada URLs → Involve Asia
    if (isInvolveAsiaUrl(productUrl)) {
      if (AFFILIATE_CONFIG.debug) {
        console.log(`[Affiliate] Routing to Involve Asia: ${productUrl}`);
      }
      return await convertInvolveAsia(productUrl, metadata);
    }

    // Route 3: Everything else → Skimlinks
    if (AFFILIATE_CONFIG.debug) {
      console.log(`[Affiliate] Routing to Skimlinks: ${productUrl}`);
    }
    return await convertSkimlinks(productUrl, metadata);
  } catch (error) {
    console.error(`[Affiliate] Conversion failed for ${productUrl}:`, error);

    // Return passthrough on failure (don't break the flow)
    return createPassthroughResult(productUrl, metadata);
  }
}

/**
 * Create a passthrough result (no affiliate conversion)
 */
function createPassthroughResult(
  url: string,
  metadata?: AffiliateMetadata
): AffiliateResult {
  return {
    originalUrl: url,
    affiliateUrl: url, // No conversion
    network: "direct",
    retailer: getRetailerDisplayName(url),
    estimatedCommission: 0,
    metadata: {
      videoId: metadata?.videoId,
      productIndex: metadata?.productIndex,
    },
  };
}

// ============================================================================
// Batch Conversion
// ============================================================================

/**
 * Convert multiple URLs to affiliate links
 *
 * @param urls - Array of product URLs
 * @param baseMetadata - Shared metadata (videoId)
 * @returns Array of AffiliateResults
 */
export async function getAffiliateLinks(
  urls: string[],
  baseMetadata?: { videoId?: string; category?: string }
): Promise<AffiliateResult[]> {
  const results = await Promise.all(
    urls.map((url, index) =>
      getAffiliateLink(url, {
        ...baseMetadata,
        productIndex: index,
      })
    )
  );

  return results;
}

// ============================================================================
// Network Detection
// ============================================================================

/**
 * Determine which affiliate network a URL will use
 */
export function detectAffiliateNetwork(url: string): AffiliateNetwork {
  if (isAmazonUrl(url)) return "amazon";
  if (isInvolveAsiaUrl(url)) return "involve_asia";
  return "skimlinks";
}

/**
 * Get affiliate network info for a URL
 */
export function getNetworkInfo(url: string): {
  network: AffiliateNetwork;
  name: string;
  revenueShare: number;
} {
  const network = detectAffiliateNetwork(url);

  const networkInfo: Record<
    AffiliateNetwork,
    { name: string; revenueShare: number }
  > = {
    amazon: { name: "Amazon Associates", revenueShare: 0 },
    involve_asia: { name: "Involve Asia", revenueShare: 0 },
    skimlinks: { name: "Skimlinks", revenueShare: 0.25 },
    direct: { name: "Direct (no affiliate)", revenueShare: 0 },
  };

  return {
    network,
    ...networkInfo[network],
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Validate a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get affiliate status (which networks are configured)
 */
export { getAffiliateStatus };

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculate estimated earnings from conversions
 */
export function estimateEarnings(
  results: AffiliateResult[],
  averageOrderValue: number = 50,
  conversionRate: number = 0.03
): {
  totalProducts: number;
  byNetwork: Record<AffiliateNetwork, number>;
  estimatedConversions: number;
  estimatedGMV: number;
  estimatedCommission: number;
} {
  const byNetwork: Record<AffiliateNetwork, number> = {
    amazon: 0,
    skimlinks: 0,
    involve_asia: 0,
    direct: 0,
  };

  let totalCommissionRate = 0;

  results.forEach((r) => {
    byNetwork[r.network]++;
    totalCommissionRate += r.estimatedCommission;
  });

  const avgCommissionRate = totalCommissionRate / results.length / 100;
  const estimatedConversions = results.length * conversionRate;
  const estimatedGMV = estimatedConversions * averageOrderValue;
  const estimatedCommission = estimatedGMV * avgCommissionRate;

  return {
    totalProducts: results.length,
    byNetwork,
    estimatedConversions,
    estimatedGMV,
    estimatedCommission,
  };
}
