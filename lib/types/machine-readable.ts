/**
 * VELOLUME SHARED DATA ENGINE
 * Machine-Readable Output Types
 * 
 * These types define the outputs that make creators and products
 * discoverable by AI agents (ChatGPT, Perplexity, AI shopping assistants).
 */

import {
  EntityId,
  ContentId,
  CanonicalProductId,
  ProductCategory,
} from './core';

// =============================================================================
// LLMS.TXT FORMAT
// =============================================================================

/**
 * Structure for llms.txt file
 * Markdown-formatted, optimized for AI agent consumption
 */
export interface LlmsTxtData {
  entityType: 'creator' | 'brand';
  name: string;
  handle: string;
  tagline: string;
  bestFor: string[];
  aestheticTags: string[];
  contentSpecialties: string[];
  categories: { name: string; percentage: number }[];
  frequentlyRecommendedBrands?: string[];
  contentStyle: {
    primaryFormats: string[];
    tone: string[];
    pacing: string;
    productionQuality: string;
  };
  trustSignals: {
    verifiedProductCount: number;
    profileCompleteness: number;
    isActive: boolean;
    lastActive: string;
  };
  endpoints: {
    storefrontUrl: string;
    discoveryJsonUrl: string;
    productsJsonUrl: string;
    schemaOrgUrl: string;
  };
  queryExamples: string[];
  updatedAt: string;
  version: string;
}

/**
 * Generate llms.txt content from data
 */
export function generateLlmsTxt(data: LlmsTxtData): string {
  const lines: string[] = [];
  
  lines.push(`# ${data.handle}`);
  lines.push('');
  lines.push(`> ${data.tagline}`);
  lines.push('');
  
  lines.push('## Best For');
  data.bestFor.forEach(item => lines.push(`- ${item}`));
  lines.push('');
  
  lines.push('## Aesthetic');
  lines.push(data.aestheticTags.join(', '));
  lines.push('');
  
  lines.push('## Top Categories');
  data.categories.forEach((cat, i) => {
    lines.push(`${i + 1}. ${cat.name} (${cat.percentage}%)`);
  });
  lines.push('');
  
  if (data.frequentlyRecommendedBrands?.length) {
    lines.push('## Frequently Recommended Brands');
    lines.push(data.frequentlyRecommendedBrands.join(', '));
    lines.push('');
  }
  
  lines.push('## Content Style');
  lines.push(`- Primary formats: ${data.contentStyle.primaryFormats.join(', ')}`);
  lines.push(`- Tone: ${data.contentStyle.tone.join(', ')}`);
  lines.push(`- Pacing: ${data.contentStyle.pacing}`);
  lines.push(`- Production: ${data.contentStyle.productionQuality}`);
  lines.push('');
  
  lines.push('## Trust Signals');
  lines.push(`- ${data.trustSignals.verifiedProductCount} products verified`);
  lines.push(`- Profile completeness: ${data.trustSignals.profileCompleteness}%`);
  lines.push(`- Active: ${data.trustSignals.isActive ? 'Yes' : 'No'}`);
  lines.push('');
  
  lines.push('## Machine-Readable Endpoints');
  lines.push(`- Full profile: ${data.endpoints.discoveryJsonUrl}`);
  lines.push(`- Products: ${data.endpoints.productsJsonUrl}`);
  lines.push(`- Schema.org: ${data.endpoints.schemaOrgUrl}`);
  lines.push('');
  
  lines.push('## Storefront');
  lines.push(data.endpoints.storefrontUrl);
  lines.push('');
  
  lines.push('---');
  lines.push(`Last updated: ${data.updatedAt}`);
  lines.push(`Velolume AI Discovery Profile ${data.version}`);
  
  return lines.join('\n');
}

// =============================================================================
// DISCOVERY.JSON FORMAT
// =============================================================================

/**
 * Full machine-readable profile in JSON format
 */
export interface DiscoveryJson {
  version: string;
  
  entity: {
    id: string;
    type: 'creator' | 'brand';
    name: string;
    handle: string;
    platforms: string[];
    niche: string[];
    subNiche: string[];
  };
  
  style: {
    tags: string[];
    colors: string[];
    mood: string[];
    aesthetic: string;
  };
  
  voice: {
    tone: string[];
    energy: string;
    pace: string;
  };
  
  productAffinity: {
    categories: Record<string, number>;
    brands: Record<string, number>;
    priceRange: {
      min: number;
      max: number;
      median: number;
      currency: string;
    };
    priceSegment: string;
  };
  
  contentPatterns: {
    formats: Record<string, number>;
    hookTypes: Record<string, number>;
    avgHookEffectiveness: number;
    postFrequency: number;
    avgProductsPerContent: number;
  };
  
  trustSignals: {
    verifiedProducts: number;
    profileCompleteness: number;
    verificationLevel: string;
    lastActive: string;
    contentCount: number;
  };
  
  endpoints: {
    storefront: string;
    products: string;
    content: string;
    similar: string;
  };
  
  queryExamples: string[];
  
  relatedEntities?: {
    id: string;
    name: string;
    handle: string;
    relationshipType: 'similar' | 'collaborator' | 'competitor';
    score: number;
  }[];
  
  updatedAt: string;
  generatedAt: string;
}

// =============================================================================
// PRODUCTS.JSON FORMAT
// =============================================================================

export interface ProductsJson {
  version: string;
  entityId: string;
  entityType: 'creator' | 'brand';
  
  summary: {
    totalProducts: number;
    categories: string[];
    brands: string[];
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
  };
  
  products: ProductJsonEntry[];
  
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  
  updatedAt: string;
}

export interface ProductJsonEntry {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  
  context?: {
    sentiment: string;
    useCase?: string;
    quote?: string;
    recommendationStrength: string;
    mentionCount: number;
    firstMentioned: string;
    lastMentioned: string;
  };
  
  price?: {
    amount: number;
    currency: string;
    isOnSale: boolean;
  };
  
  links: {
    product: string;
    affiliate?: string;
    storefront?: string;
  };
  
  image?: string;
  verified: boolean;
  verificationLevel: 'auto' | 'creator_confirmed' | 'brand_verified';
}

// =============================================================================
// SCHEMA.ORG FORMATS
// =============================================================================

export interface SchemaOrgPerson {
  '@context': 'https://schema.org';
  '@type': 'Person';
  '@id': string;
  name: string;
  alternateName?: string;
  description?: string;
  image?: string;
  url: string;
  sameAs?: string[];
  jobTitle?: string;
  knowsAbout?: string[];
}

export interface SchemaOrgOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  '@id': string;
  name: string;
  alternateName?: string;
  description?: string;
  logo?: string;
  url: string;
  sameAs?: string[];
  brand?: { '@type': 'Brand'; name: string };
}

export interface SchemaOrgProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  '@id': string;
  name: string;
  description?: string;
  image?: string | string[];
  url: string;
  brand?: { '@type': 'Brand'; name: string };
  sku?: string;
  gtin?: string;
  category?: string;
  offers?: {
    '@type': 'Offer';
    url: string;
    price: number;
    priceCurrency: string;
    availability: string;
  }[];
}

export interface SchemaOrgItemList {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  name: string;
  description?: string;
  numberOfItems: number;
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    item: SchemaOrgProduct;
  }[];
}

// =============================================================================
// AI AGENT API TYPES
// =============================================================================

export type AgentQueryType = 
  | 'find_creator'
  | 'find_product'
  | 'find_similar'
  | 'get_recommendations'
  | 'verify_product'
  | 'get_evidence';

export interface AgentQueryRequest {
  type: AgentQueryType;
  query?: string;
  entityId?: string;
  productId?: string;
  filters?: {
    niche?: string[];
    priceRange?: { min: number; max: number };
    categories?: string[];
    aesthetic?: string[];
    verifiedOnly?: boolean;
  };
  limit?: number;
  offset?: number;
  includeEvidence?: boolean;
}

export interface AgentQueryResponse {
  type: AgentQueryType;
  
  results: {
    entities?: {
      id: string;
      name: string;
      handle: string;
      type: 'creator' | 'brand';
      relevanceScore: number;
      summary: string;
      profileUrl: string;
    }[];
    
    products?: {
      id: string;
      name: string;
      brand: string;
      relevanceScore: number;
      recommendedBy?: string[];
      affiliateUrl?: string;
    }[];
    
    evidence?: {
      contentId: string;
      contentUrl?: string;
      timestamp?: number;
      quote?: string;
      sentiment: string;
      confidence: number;
    }[];
  };
  
  queryTime: number;
  resultCount: number;
  hasMore: boolean;
}

// =============================================================================
// GENERATION HELPERS
// =============================================================================

/**
 * Generate query examples for an entity
 */
export function generateQueryExamples(
  entityType: 'creator' | 'brand',
  name: string,
  niche: string[],
  subNiche: string[],
  aesthetic: string
): string[] {
  const examples: string[] = [];
  
  if (entityType === 'creator') {
    if (niche[0]) examples.push(`${niche[0]} creator`);
    if (subNiche[0] && niche[0]) examples.push(`${subNiche[0]} ${niche[0]} content`);
    if (aesthetic) examples.push(`${aesthetic} style`);
    examples.push(`${name} recommendations`);
  } else {
    if (niche[0]) examples.push(`${niche[0]} brand`);
    examples.push(`${name} products`);
  }
  
  return examples;
}
