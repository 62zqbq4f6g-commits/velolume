/**
 * Google Shopping Types
 *
 * TypeScript interfaces for Google Shopping API integration.
 */

// ============================================================================
// Search Parameters
// ============================================================================

export interface ShoppingSearchParams {
  /** Search query (e.g., "olive green knit sweater women") */
  query: string;

  /** Country code (default: "us") */
  country?: string;

  /** Language code (default: "en") */
  language?: string;

  /** Number of results to return (default: 10, max: 100) */
  limit?: number;

  /** Page number for pagination (default: 1) */
  page?: number;

  /** Minimum price filter */
  minPrice?: number;

  /** Maximum price filter */
  maxPrice?: number;

  /** Sort order */
  sortBy?: "relevance" | "price_low" | "price_high" | "review_score";
}

// ============================================================================
// Shopping Results
// ============================================================================

export interface ShoppingResult {
  /** Product title */
  title: string;

  /** Retailer/source name */
  source: string;

  /** Product URL */
  link: string;

  /** Product ID (extracted from URL if available) */
  productId?: string;

  /** Price string (e.g., "$34.99") */
  price?: string;

  /** Extracted price number for comparison */
  priceValue?: number;

  /** Currency code */
  currency?: string;

  /** Product thumbnail URL */
  thumbnail?: string;

  /** Product rating (1-5) */
  rating?: number;

  /** Number of reviews */
  reviewCount?: number;

  /** Whether product is in stock */
  inStock?: boolean;

  /** Delivery information */
  delivery?: string;

  /** Product condition (new, used, refurbished) */
  condition?: string;

  /** Position in search results */
  position: number;
}

// ============================================================================
// Search Response
// ============================================================================

export interface ShoppingSearchResponse {
  /** Whether the search was successful */
  success: boolean;

  /** Search query used */
  query: string;

  /** Total results found (may be estimated) */
  totalResults?: number;

  /** Current page */
  page: number;

  /** Results per page */
  resultsPerPage: number;

  /** Whether more pages are available */
  hasMorePages: boolean;

  /** Shopping results */
  results: ShoppingResult[];

  /** Search metadata */
  metadata?: {
    searchTime?: number;
    searchId?: string;
    country?: string;
    language?: string;
  };

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Product Match (with affiliate link)
// ============================================================================

export interface ProductMatch extends ShoppingResult {
  /** Match confidence score (0-100) */
  matchScore?: number;

  /** Match breakdown by attribute */
  matchBreakdown?: Array<{
    attribute: string;
    points: number;
    maxPoints: number;
  }>;

  /** Match flags/warnings */
  flags?: string[];

  /** Affiliate link (if converted) */
  affiliateUrl?: string;

  /** Affiliate network used */
  affiliateNetwork?: string;

  /** Estimated commission percentage */
  estimatedCommission?: number;
}

// ============================================================================
// Batch Search
// ============================================================================

export interface BatchSearchRequest {
  /** Products to search for */
  products: Array<{
    /** Product name (for reference) */
    name: string;

    /** Search query */
    query: string;

    /** Optional category for better matching */
    category?: string;

    /** Optional metadata to pass through */
    metadata?: Record<string, unknown>;
  }>;

  /** Shared search options */
  options?: Omit<ShoppingSearchParams, "query">;
}

export interface BatchSearchResponse {
  /** Whether all searches completed */
  success: boolean;

  /** Number of products searched */
  productsSearched: number;

  /** Number of products with results */
  productsWithResults: number;

  /** Results by product */
  results: Array<{
    name: string;
    query: string;
    category?: string;
    results: ShoppingResult[];
    metadata?: Record<string, unknown>;
  }>;

  /** Total API calls made */
  apiCalls: number;

  /** Total time in milliseconds */
  totalTimeMs: number;
}
