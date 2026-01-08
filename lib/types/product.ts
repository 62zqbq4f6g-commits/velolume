/**
 * VELOLUME SHARED DATA ENGINE
 * Product Types - Canonical Product Catalog
 * 
 * The CanonicalProduct is our normalized representation of a product.
 * Multiple listings, mentions, and variations all resolve to one CanonicalProduct.
 */

import {
  CanonicalProductId,
  EntityId,
  ContentId,
  ProductMentionId,
  Claim,
  Evidence,
  ProductCategory,
  Sentiment,
  Price,
  PriceRange,
  Embedding,
} from './core';

// =============================================================================
// CANONICAL PRODUCT
// =============================================================================

/**
 * Product status
 */
export type ProductStatus = 
  | 'active'            // Currently available
  | 'discontinued'      // No longer made
  | 'out_of_stock'      // Temporarily unavailable
  | 'seasonal'          // Available seasonally
  | 'unknown';

/**
 * The canonical representation of a product
 * This is the "source of truth" that all mentions resolve to
 */
export interface CanonicalProduct {
  id: CanonicalProductId;
  
  // =========================================================================
  // IDENTITY
  // =========================================================================
  
  identity: {
    // Primary name
    name: string;
    
    // Brand
    brand: string;
    brandId?: EntityId;             // Link to brand entity if exists in our system
    
    // Full product title (as listed)
    fullTitle?: string;
    
    // Short description
    description?: string;
  };
  
  // =========================================================================
  // IDENTIFIERS
  // =========================================================================
  
  identifiers: {
    // Universal identifiers
    gtin?: string;                  // Global Trade Item Number (UPC/EAN)
    asin?: string;                  // Amazon Standard Identification Number
    mpn?: string;                   // Manufacturer Part Number
    isbn?: string;                  // For books
    
    // Retailer-specific SKUs
    skus: {
      merchant: string;
      sku: string;
      url?: string;
    }[];
    
    // Our internal identifiers
    slug: string;                   // URL-friendly identifier
  };
  
  // =========================================================================
  // CLASSIFICATION
  // =========================================================================
  
  classification: {
    // Category hierarchy
    category: ProductCategory;
    subcategory: string;
    subsubcategory?: string;
    
    // Category-specific attributes
    attributes: Record<string, string>;
    
    // Tags for search
    tags: string[];
    
    // Product type specifics
    productType?: string;           // "sweater", "moisturizer", "headphones"
  };
  
  // =========================================================================
  // VISUAL DATA
  // =========================================================================
  
  visual: {
    // Product images
    images: {
      url: string;
      type: 'primary' | 'alternate' | 'lifestyle' | 'detail';
      width?: number;
      height?: number;
    }[];
    
    // Visual embedding for similarity search
    embedding?: Embedding;
    
    // Visual attributes
    primaryColor?: string;
    colors?: string[];
  };
  
  // =========================================================================
  // LISTINGS (Where to Buy)
  // =========================================================================
  
  listings: ProductListing[];
  
  // Best listing (for default affiliate link)
  bestListing?: {
    listingId: string;
    reason: 'price' | 'availability' | 'commission' | 'trust';
  };
  
  // =========================================================================
  // PRICING
  // =========================================================================
  
  pricing: {
    // Current price range across listings
    currentRange: PriceRange;
    
    // MSRP/RRP if known
    msrp?: Price;
    
    // Price history
    priceHistory?: {
      date: Date;
      price: Price;
      merchant: string;
    }[];
    
    // Price positioning
    priceSegment: 'budget' | 'mid' | 'premium' | 'luxury';
  };
  
  // =========================================================================
  // ALIASES & MATCHING
  // =========================================================================
  
  aliases: {
    // Alternative names
    names: string[];
    
    // Common misspellings
    misspellings: string[];
    
    // Regional variations
    regionalNames?: {
      region: string;
      name: string;
    }[];
    
    // Search terms that should match
    searchTerms: string[];
  };
  
  // =========================================================================
  // MENTION STATISTICS (Aggregated)
  // =========================================================================
  
  mentionStats: {
    // Total mentions across all content
    totalMentions: number;
    
    // Unique creators who mentioned
    uniqueCreators: number;
    
    // Sentiment analysis
    avgSentiment: number;           // -1 to 1
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    
    // Common contexts
    topContexts: {
      context: string;              // "work", "casual", "date night"
      count: number;
    }[];
    
    // Top recommenders
    topCreators?: {
      entityId: EntityId;
      mentionCount: number;
      avgSentiment: number;
    }[];
    
    // Trending
    trending: {
      isTrending: boolean;
      trendScore?: number;
      mentionVelocity?: number;     // Mentions per day
    };
    
    // Last updated
    lastUpdated: Date;
  };
  
  // =========================================================================
  // COMMERCE DATA
  // =========================================================================
  
  commerce: {
    // Affiliate networks this product is available on
    affiliateNetworks: string[];
    
    // Best commission rate available
    bestCommission?: {
      network: string;
      rate: number;
      type: 'percentage' | 'fixed';
    };
    
    // Conversion data (if we have it)
    conversionData?: {
      avgConversionRate: number;
      totalClicks: number;
      totalPurchases: number;
      totalRevenue: number;
    };
  };
  
  // =========================================================================
  // STATUS & METADATA
  // =========================================================================
  
  status: ProductStatus;
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    
    // Data source
    source: 'manual' | 'api' | 'scraped' | 'user_submitted';
    sourceUrl?: string;
    
    // Verification
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    
    // Flags
    isActive: boolean;
    needsReview: boolean;
    reviewReason?: string;
  };
}

// =============================================================================
// PRODUCT LISTING
// =============================================================================

/**
 * A specific listing of a product at a merchant
 */
export interface ProductListing {
  id: string;
  canonicalProductId: CanonicalProductId;
  
  // Merchant info
  merchant: {
    name: string;
    domain: string;
    trusted: boolean;               // On our whitelist
    trustScore?: number;            // 0-100
  };
  
  // The listing
  url: string;
  title: string;
  
  // Pricing
  price: Price;
  originalPrice?: Price;            // If on sale
  isOnSale: boolean;
  
  // Availability
  inStock: boolean;
  stockLevel?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  
  // Affiliate
  affiliate: {
    network: string;
    affiliateUrl: string;
    commissionRate?: number;
    commissionType?: 'percentage' | 'fixed';
    cookieDuration?: number;        // Days
  };
  
  // Freshness
  lastChecked: Date;
  lastPriceChange?: Date;
  
  // Quality signals
  rating?: number;                  // 0-5
  reviewCount?: number;
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
}

// =============================================================================
// PRODUCT CATALOG (Brand's Products)
// =============================================================================

/**
 * A brand's product catalog
 * For brands that upload their product data
 */
export interface ProductCatalog {
  id: string;
  brandId: EntityId;
  
  // Catalog info
  name: string;
  description?: string;
  
  // Products
  productIds: CanonicalProductId[];
  productCount: number;
  
  // Categories in catalog
  categories: {
    category: string;
    count: number;
  }[];
  
  // Import info
  importSource?: 'manual' | 'shopify' | 'csv' | 'api';
  lastImport?: Date;
  
  // Sync status
  syncStatus: 'synced' | 'syncing' | 'error' | 'never';
  lastSync?: Date;
  syncError?: string;
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
}

// =============================================================================
// PRODUCT MATCH REQUEST
// =============================================================================

/**
 * Request to match a detected product to canonical products
 */
export interface ProductMatchRequest {
  // What we detected
  description: string;
  brand?: string;
  category: string;
  subcategory?: string;
  attributes: Record<string, string>;
  
  // Visual data
  imageUrl?: string;
  imageEmbedding?: number[];
  
  // Context
  context?: {
    creatorId?: EntityId;
    contentId?: ContentId;
    sentiment?: Sentiment;
    priceComment?: string;
  };
  
  // Match preferences
  preferences?: {
    maxCandidates?: number;
    minConfidence?: number;
    preferredMerchants?: string[];
    excludeMerchants?: string[];
  };
}

/**
 * Result of a product match request
 */
export interface ProductMatchResult {
  // Status
  status: 'matched' | 'candidates' | 'no_match';
  
  // Candidates
  candidates: {
    product: CanonicalProduct;
    confidence: number;
    matchReasons: string[];
    matchMethod: 'visual' | 'text' | 'brand_category' | 'combined';
    affiliateUrl?: string;
  }[];
  
  // Best match (if confidence > threshold)
  bestMatch?: {
    product: CanonicalProduct;
    confidence: number;
    affiliateUrl: string;
  };
  
  // If no match
  noMatchReason?: string;
  
  // Processing info
  processingTime: number;
  modelsUsed: string[];
}

// =============================================================================
// CATEGORY SCHEMA
// =============================================================================

/**
 * Category-specific attribute schema
 * Defines what attributes to extract for each category
 */
export interface CategorySchema {
  category: ProductCategory;
  subcategory?: string;
  
  // Attributes to extract
  attributes: {
    name: string;
    type: 'string' | 'enum' | 'number' | 'boolean';
    required: boolean;
    
    // For enum type
    enumValues?: string[];
    
    // For matching
    isDealBreaker: boolean;         // Must match exactly for high confidence
    weight: number;                 // Weight in scoring (0-100)
    
    // Fuzzy matching config
    fuzzyMatch?: {
      enabled: boolean;
      threshold: number;            // 0-1
      synonymGroups?: string[][];   // Groups of equivalent values
    };
  }[];
  
  // Category-specific matching rules
  matchingRules?: {
    minConfidenceForMatch: number;
    dealBreakerCap: number;         // Max score if deal-breaker mismatches
  };
}

// =============================================================================
// PRODUCT HELPERS
// =============================================================================

/**
 * Create a minimal canonical product
 */
export function createCanonicalProduct(
  id: CanonicalProductId,
  name: string,
  brand: string,
  category: ProductCategory,
  subcategory: string
): CanonicalProduct {
  const now = new Date();
  
  return {
    id,
    identity: {
      name,
      brand,
    },
    identifiers: {
      skus: [],
      slug: generateSlug(brand, name),
    },
    classification: {
      category,
      subcategory,
      attributes: {},
      tags: [],
    },
    visual: {
      images: [],
    },
    listings: [],
    pricing: {
      currentRange: {
        min: { amount: 0, currency: 'USD' },
        max: { amount: 0, currency: 'USD' },
      },
      priceSegment: 'mid',
    },
    aliases: {
      names: [],
      misspellings: [],
      searchTerms: [name.toLowerCase(), brand.toLowerCase()],
    },
    mentionStats: {
      totalMentions: 0,
      uniqueCreators: 0,
      avgSentiment: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      topContexts: [],
      trending: { isTrending: false },
      lastUpdated: now,
    },
    commerce: {
      affiliateNetworks: [],
    },
    status: 'active',
    metadata: {
      createdAt: now,
      updatedAt: now,
      source: 'manual',
      verified: false,
      isActive: true,
      needsReview: true,
      reviewReason: 'new_product',
    },
  };
}

/**
 * Generate URL-friendly slug
 */
function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// =============================================================================
// CATEGORY SCHEMAS (Examples)
// =============================================================================

export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
  'clothing_tops': {
    category: 'clothing',
    subcategory: 'tops',
    attributes: [
      {
        name: 'neckline',
        type: 'enum',
        required: true,
        enumValues: ['crew', 'v-neck', 'scoop', 'mock', 'turtleneck', 'off-shoulder', 'halter', 'square', 'boat', 'cowl'],
        isDealBreaker: true,
        weight: 15,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'sleeveLength',
        type: 'enum',
        required: true,
        enumValues: ['sleeveless', 'cap', 'short', 'elbow', 'three-quarter', 'long'],
        isDealBreaker: true,
        weight: 12,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'bodyLength',
        type: 'enum',
        required: true,
        enumValues: ['crop', 'regular', 'longline', 'tunic'],
        isDealBreaker: true,
        weight: 12,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'fit',
        type: 'enum',
        required: true,
        enumValues: ['fitted', 'regular', 'relaxed', 'oversized', 'boxy'],
        isDealBreaker: false,
        weight: 10,
        fuzzyMatch: {
          enabled: true,
          threshold: 0.7,
          synonymGroups: [['fitted', 'slim'], ['relaxed', 'loose'], ['oversized', 'boxy']],
        },
      },
      {
        name: 'color',
        type: 'string',
        required: true,
        isDealBreaker: false,
        weight: 20,
        fuzzyMatch: {
          enabled: true,
          threshold: 0.6,
          synonymGroups: [
            ['olive', 'olive green', 'army green', 'khaki green'],
            ['navy', 'navy blue', 'dark blue'],
            ['cream', 'ivory', 'off-white', 'ecru'],
            ['black', 'jet black'],
            ['white', 'pure white', 'bright white'],
            ['gray', 'grey', 'charcoal'],
            ['beige', 'tan', 'camel', 'sand'],
          ],
        },
      },
      {
        name: 'material',
        type: 'string',
        required: false,
        isDealBreaker: false,
        weight: 10,
        fuzzyMatch: {
          enabled: true,
          threshold: 0.7,
          synonymGroups: [
            ['cotton', '100% cotton', 'organic cotton'],
            ['wool', 'merino wool', 'cashmere'],
            ['polyester', 'poly'],
            ['linen', 'flax'],
          ],
        },
      },
      {
        name: 'pattern',
        type: 'enum',
        required: false,
        enumValues: ['solid', 'striped', 'plaid', 'floral', 'graphic', 'abstract', 'animal', 'geometric'],
        isDealBreaker: false,
        weight: 8,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'texture',
        type: 'enum',
        required: false,
        enumValues: ['smooth', 'ribbed', 'cable-knit', 'waffle', 'chunky', 'fine-knit', 'fleece'],
        isDealBreaker: false,
        weight: 8,
        fuzzyMatch: {
          enabled: true,
          threshold: 0.7,
          synonymGroups: [
            ['ribbed', 'rib-knit'],
            ['chunky', 'thick-knit', 'heavy-knit'],
            ['fine-knit', 'lightweight', 'thin-knit'],
          ],
        },
      },
    ],
    matchingRules: {
      minConfidenceForMatch: 75,
      dealBreakerCap: 65,
    },
  },
  
  'footwear_shoes': {
    category: 'footwear',
    subcategory: 'shoes',
    attributes: [
      {
        name: 'style',
        type: 'enum',
        required: true,
        enumValues: ['loafer', 'oxford', 'derby', 'monk-strap', 'brogue', 'mule', 'flat', 'pump', 'sandal', 'sneaker', 'boot', 'espadrille'],
        isDealBreaker: true,
        weight: 25,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'toeShape',
        type: 'enum',
        required: true,
        enumValues: ['pointed', 'almond', 'round', 'square', 'open'],
        isDealBreaker: true,
        weight: 15,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'heelHeight',
        type: 'enum',
        required: true,
        enumValues: ['flat', 'low', 'mid', 'high', 'platform'],
        isDealBreaker: true,
        weight: 15,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'material',
        type: 'enum',
        required: true,
        enumValues: ['leather', 'patent-leather', 'suede', 'canvas', 'fabric', 'synthetic', 'mesh'],
        isDealBreaker: false,
        weight: 12,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
      {
        name: 'color',
        type: 'string',
        required: true,
        isDealBreaker: false,
        weight: 18,
        fuzzyMatch: { enabled: true, threshold: 0.6 },
      },
      {
        name: 'closure',
        type: 'enum',
        required: false,
        enumValues: ['slip-on', 'lace-up', 'buckle', 'velcro', 'zipper', 'elastic'],
        isDealBreaker: false,
        weight: 8,
        fuzzyMatch: { enabled: false, threshold: 1 },
      },
    ],
    matchingRules: {
      minConfidenceForMatch: 75,
      dealBreakerCap: 65,
    },
  },
  
  // Add more category schemas as needed...
};
