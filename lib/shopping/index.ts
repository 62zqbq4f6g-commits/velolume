/**
 * Google Shopping Module
 *
 * Production-ready Google Shopping integration with affiliate link support.
 *
 * Usage:
 *   import { searchProducts, searchAndConvert } from "@/lib/shopping";
 *
 *   // Basic search
 *   const results = await searchProducts("olive green knit sweater");
 *
 *   // Search with affiliate conversion
 *   const matches = await searchAndConvert("olive green knit sweater", {
 *     videoId: "abc123",
 *     productIndex: 0,
 *   });
 */

// Re-export all types
export * from "./types";
export * from "./config";

// Re-export core functions
export {
  searchGoogleShopping,
  batchSearchGoogleShopping,
  searchGoogleShoppingAllPages,
  quickSearch,
  getTopResult,
} from "./google-shopping";

import {
  searchGoogleShopping,
  batchSearchGoogleShopping,
} from "./google-shopping";
import { getAffiliateLink } from "../affiliate";
import { ShoppingResult, ProductMatch, BatchSearchResponse } from "./types";

// ============================================================================
// High-Level Search Functions
// ============================================================================

/**
 * Search for products (alias for searchGoogleShopping)
 */
export async function searchProducts(
  query: string,
  options?: {
    limit?: number;
    page?: number;
    country?: string;
  }
): Promise<ShoppingResult[]> {
  const response = await searchGoogleShopping({
    query,
    limit: options?.limit,
    page: options?.page,
    country: options?.country,
  });
  return response.results;
}

/**
 * Search and convert results to affiliate links
 */
export async function searchAndConvert(
  query: string,
  metadata?: {
    videoId?: string;
    productIndex?: number;
    category?: string;
  },
  options?: {
    limit?: number;
    page?: number;
  }
): Promise<ProductMatch[]> {
  // Search for products
  const response = await searchGoogleShopping({
    query,
    limit: options?.limit || 10,
    page: options?.page,
  });

  if (!response.success || response.results.length === 0) {
    return [];
  }

  // Convert each result to affiliate link
  const matches: ProductMatch[] = await Promise.all(
    response.results.map(async (result, index) => {
      try {
        const affiliateResult = await getAffiliateLink(result.link, {
          videoId: metadata?.videoId,
          productIndex: metadata?.productIndex !== undefined
            ? metadata.productIndex * 100 + index // Unique index per product-candidate
            : index,
          category: metadata?.category,
        });

        return {
          ...result,
          affiliateUrl: affiliateResult.affiliateUrl,
          affiliateNetwork: affiliateResult.network,
          estimatedCommission: affiliateResult.estimatedCommission,
        };
      } catch {
        // Return without affiliate on error
        return result;
      }
    })
  );

  return matches;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Search for multiple products and convert all to affiliate links
 */
export async function batchSearchAndConvert(
  products: Array<{
    name: string;
    query: string;
    category?: string;
  }>,
  metadata?: {
    videoId?: string;
  },
  options?: {
    limit?: number;
  }
): Promise<{
  success: boolean;
  results: Array<{
    name: string;
    query: string;
    category?: string;
    matches: ProductMatch[];
  }>;
  stats: {
    productsSearched: number;
    productsWithResults: number;
    totalMatches: number;
    apiCalls: number;
    timeMs: number;
  };
}> {
  const startTime = Date.now();

  // Batch search
  const batchResponse = await batchSearchGoogleShopping({
    products: products.map((p) => ({
      name: p.name,
      query: p.query,
      category: p.category,
    })),
    options: {
      limit: options?.limit || 10,
    },
  });

  // Convert all results to affiliate links
  const resultsWithAffiliates = await Promise.all(
    batchResponse.results.map(async (productResult, productIndex) => {
      const matches = await Promise.all(
        productResult.results.map(async (result, resultIndex) => {
          try {
            const affiliateResult = await getAffiliateLink(result.link, {
              videoId: metadata?.videoId,
              productIndex: productIndex * 100 + resultIndex,
              category: productResult.category,
            });

            return {
              ...result,
              affiliateUrl: affiliateResult.affiliateUrl,
              affiliateNetwork: affiliateResult.network,
              estimatedCommission: affiliateResult.estimatedCommission,
            } as ProductMatch;
          } catch {
            return result as ProductMatch;
          }
        })
      );

      return {
        name: productResult.name,
        query: productResult.query,
        category: productResult.category,
        matches,
      };
    })
  );

  const totalMatches = resultsWithAffiliates.reduce(
    (sum, r) => sum + r.matches.length,
    0
  );

  return {
    success: true,
    results: resultsWithAffiliates,
    stats: {
      productsSearched: products.length,
      productsWithResults: batchResponse.productsWithResults,
      totalMatches,
      apiCalls: batchResponse.apiCalls,
      timeMs: Date.now() - startTime,
    },
  };
}

// ============================================================================
// Product Match Pipeline Integration
// ============================================================================

/**
 * Search shopping for a detected product and return top matches with scores
 *
 * This is the main integration point for the product matching pipeline.
 */
export async function findShoppingMatches(
  product: {
    name: string;
    searchTerms: string[];
    category?: string;
    subcategory?: string;
  },
  metadata?: {
    videoId?: string;
    productIndex?: number;
  },
  options?: {
    maxResults?: number;
  }
): Promise<ProductMatch[]> {
  // Build search query from search terms
  const query = product.searchTerms.slice(0, 3).join(" ");

  // Search and convert
  const matches = await searchAndConvert(
    query,
    {
      videoId: metadata?.videoId,
      productIndex: metadata?.productIndex,
      category: product.category,
    },
    {
      limit: options?.maxResults || 10,
    }
  );

  return matches;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Analyze search results for pricing insights
 */
export function analyzeSearchResults(results: ShoppingResult[]): {
  count: number;
  priceRange: { min: number; max: number; avg: number } | null;
  topSources: Array<{ source: string; count: number }>;
  avgRating: number | null;
} {
  const prices = results
    .map((r) => r.priceValue)
    .filter((p): p is number => p !== undefined);

  const sourceCounts: Record<string, number> = {};
  results.forEach((r) => {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  });

  const ratings = results
    .map((r) => r.rating)
    .filter((r): r is number => r !== undefined);

  return {
    count: results.length,
    priceRange:
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
          }
        : null,
    topSources: Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count })),
    avgRating:
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null,
  };
}
