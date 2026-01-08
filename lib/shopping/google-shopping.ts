/**
 * Google Shopping API Integration
 *
 * Production-ready module for searching Google Shopping via SERP API.
 * Features:
 * - Text-based product search
 * - Pagination support
 * - Rate limiting
 * - Retry logic
 * - Price extraction
 */

import { SHOPPING_CONFIG, isShoppingConfigured } from "./config";
import {
  ShoppingSearchParams,
  ShoppingResult,
  ShoppingSearchResponse,
  BatchSearchRequest,
  BatchSearchResponse,
} from "./types";

// ============================================================================
// Rate Limiting
// ============================================================================

let lastRequestTime = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const waitTime = SHOPPING_CONFIG.requestDelayMs - timeSinceLastRequest;

  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

// ============================================================================
// Price Extraction
// ============================================================================

/**
 * Extract numeric price from price string
 */
function extractPriceValue(priceString?: string): number | undefined {
  if (!priceString) return undefined;

  // Remove currency symbols and extract number
  const match = priceString.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(",", ""));
  }

  return undefined;
}

/**
 * Extract currency from price string
 */
function extractCurrency(priceString?: string): string {
  if (!priceString) return "USD";

  if (priceString.includes("$")) return "USD";
  if (priceString.includes("£")) return "GBP";
  if (priceString.includes("€")) return "EUR";
  if (priceString.includes("¥")) return "JPY";
  if (priceString.includes("RM")) return "MYR";
  if (priceString.includes("S$")) return "SGD";

  return "USD";
}

// ============================================================================
// Main Search Function
// ============================================================================

/**
 * Search Google Shopping for products
 */
export async function searchGoogleShopping(
  params: ShoppingSearchParams
): Promise<ShoppingSearchResponse> {
  // Check configuration
  if (!isShoppingConfigured()) {
    return {
      success: false,
      query: params.query,
      page: params.page || 1,
      resultsPerPage: params.limit || SHOPPING_CONFIG.defaultResultsPerPage,
      hasMorePages: false,
      results: [],
      error: "SERP API key not configured. Set SERP_API_KEY in environment.",
    };
  }

  // Apply rate limiting
  await waitForRateLimit();

  // Build search parameters
  const searchParams = new URLSearchParams({
    engine: "google_shopping",
    q: params.query,
    api_key: SHOPPING_CONFIG.serpApiKey,
    gl: params.country || SHOPPING_CONFIG.defaultCountry,
    hl: params.language || SHOPPING_CONFIG.defaultLanguage,
    num: String(params.limit || SHOPPING_CONFIG.defaultResultsPerPage),
  });

  // Add pagination
  if (params.page && params.page > 1) {
    const start = (params.page - 1) * (params.limit || SHOPPING_CONFIG.defaultResultsPerPage);
    searchParams.set("start", String(start));
  }

  // Add price filters
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    let priceFilter = "";
    if (params.minPrice !== undefined) {
      priceFilter += `price:${params.minPrice},`;
    }
    if (params.maxPrice !== undefined) {
      priceFilter += `priceto:${params.maxPrice}`;
    }
    searchParams.set("tbs", priceFilter);
  }

  // Add sorting
  if (params.sortBy) {
    const sortMap: Record<string, string> = {
      relevance: "",
      price_low: "p_ord:p",
      price_high: "p_ord:pd",
      review_score: "p_ord:rv",
    };
    if (sortMap[params.sortBy]) {
      searchParams.set("tbs", sortMap[params.sortBy]);
    }
  }

  // Make request with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= SHOPPING_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        SHOPPING_CONFIG.requestTimeoutMs
      );

      const response = await fetch(
        `${SHOPPING_CONFIG.serpApiUrl}?${searchParams}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;

      // Check for API errors
      if (data.error) {
        throw new Error(String(data.error));
      }

      // Parse results
      const shoppingResults = (data.shopping_results || []) as Array<Record<string, unknown>>;
      const results: ShoppingResult[] = shoppingResults.map((item, index) => ({
        title: String(item.title || "Unknown"),
        source: String(item.source || ""),
        link: String(item.link || ""),
        productId: extractProductId(String(item.link || "")),
        price: item.price ? String(item.price) : undefined,
        priceValue: extractPriceValue(item.price ? String(item.price) : undefined),
        currency: extractCurrency(item.price ? String(item.price) : undefined),
        thumbnail: item.thumbnail ? String(item.thumbnail) : undefined,
        rating: typeof item.rating === "number" ? item.rating : undefined,
        reviewCount: typeof item.reviews === "number" ? item.reviews : undefined,
        delivery: item.delivery ? String(item.delivery) : undefined,
        position: index + 1 + ((params.page || 1) - 1) * (params.limit || 10),
      }));

      // Determine if more pages available
      const totalResults = typeof data.search_information === "object" && data.search_information
        ? (data.search_information as Record<string, unknown>).total_results
        : undefined;
      const hasMorePages = results.length === (params.limit || SHOPPING_CONFIG.defaultResultsPerPage);

      return {
        success: true,
        query: params.query,
        totalResults: typeof totalResults === "number" ? totalResults : undefined,
        page: params.page || 1,
        resultsPerPage: params.limit || SHOPPING_CONFIG.defaultResultsPerPage,
        hasMorePages,
        results,
        metadata: {
          searchId: typeof data.search_metadata === "object" && data.search_metadata
            ? String((data.search_metadata as Record<string, unknown>).id || "")
            : undefined,
          country: params.country || SHOPPING_CONFIG.defaultCountry,
          language: params.language || SHOPPING_CONFIG.defaultLanguage,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (lastError.message.includes("Invalid API key")) {
        break;
      }

      // Wait before retry
      if (attempt < SHOPPING_CONFIG.maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, SHOPPING_CONFIG.retryDelayMs * attempt)
        );
      }
    }
  }

  return {
    success: false,
    query: params.query,
    page: params.page || 1,
    resultsPerPage: params.limit || SHOPPING_CONFIG.defaultResultsPerPage,
    hasMorePages: false,
    results: [],
    error: lastError?.message || "Unknown error",
  };
}

// ============================================================================
// Product ID Extraction
// ============================================================================

/**
 * Extract product ID from various retailer URLs
 */
function extractProductId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Amazon: /dp/ASIN or /gp/product/ASIN
    if (hostname.includes("amazon")) {
      const dpMatch = parsed.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
      if (dpMatch) return dpMatch[1];
      const gpMatch = parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (gpMatch) return gpMatch[1];
    }

    // Walmart: /ip/product-name/ID
    if (hostname.includes("walmart")) {
      const match = parsed.pathname.match(/\/ip\/[^/]+\/(\d+)/);
      if (match) return match[1];
    }

    // Target: /p/product-name/-/A-ID
    if (hostname.includes("target")) {
      const match = parsed.pathname.match(/\/-\/A-(\d+)/);
      if (match) return match[1];
    }

    // Generic: try to extract from URL path
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /^[\w-]+$/.test(lastPart)) {
      return lastPart;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

// ============================================================================
// Batch Search
// ============================================================================

/**
 * Search for multiple products with rate limiting
 */
export async function batchSearchGoogleShopping(
  request: BatchSearchRequest
): Promise<BatchSearchResponse> {
  const startTime = Date.now();
  const results: BatchSearchResponse["results"] = [];
  let apiCalls = 0;

  for (const product of request.products) {
    const searchResponse = await searchGoogleShopping({
      query: product.query,
      ...request.options,
    });

    apiCalls++;

    results.push({
      name: product.name,
      query: product.query,
      category: product.category,
      results: searchResponse.results,
      metadata: product.metadata,
    });
  }

  const productsWithResults = results.filter((r) => r.results.length > 0).length;

  return {
    success: true,
    productsSearched: request.products.length,
    productsWithResults,
    results,
    apiCalls,
    totalTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// Paginated Search
// ============================================================================

/**
 * Get all results across multiple pages
 */
export async function searchGoogleShoppingAllPages(
  params: ShoppingSearchParams,
  maxPages: number = SHOPPING_CONFIG.maxPages
): Promise<ShoppingSearchResponse> {
  const allResults: ShoppingResult[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const response = await searchGoogleShopping({
      ...params,
      page: currentPage,
    });

    if (!response.success) {
      if (allResults.length > 0) {
        // Return what we have so far
        break;
      }
      return response;
    }

    allResults.push(...response.results);
    hasMore = response.hasMorePages;
    currentPage++;
  }

  return {
    success: true,
    query: params.query,
    totalResults: allResults.length,
    page: 1,
    resultsPerPage: allResults.length,
    hasMorePages: hasMore,
    results: allResults,
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick search with default options
 */
export async function quickSearch(query: string): Promise<ShoppingResult[]> {
  const response = await searchGoogleShopping({ query });
  return response.results;
}

/**
 * Search and get top result only
 */
export async function getTopResult(query: string): Promise<ShoppingResult | null> {
  const response = await searchGoogleShopping({ query, limit: 1 });
  return response.results[0] || null;
}
