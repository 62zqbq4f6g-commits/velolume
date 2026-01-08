/**
 * VELOLUME SHARED DATA ENGINE
 * Entity Types - Creators & Brands
 * 
 * An Entity is either a Creator, a Brand, or a Creator-Brand (someone who is both).
 * This is the core profile that everything else hangs off of.
 */

import {
  EntityId,
  ContentId,
  Claim,
  Evidence,
  StyleFingerprint,
  VoiceFingerprint,
  TrustSignals,
  VerificationLevel,
  Platform,
  ProductCategory,
  PriceRange,
  Timestamp,
  Embedding,
} from './core';

// =============================================================================
// ENTITY TYPES
// =============================================================================

/**
 * Entity type classification
 */
export type EntityType = 
  | 'creator'           // Individual content creator
  | 'brand'             // Company/brand
  | 'creator_brand';    // Creator who is also a brand (e.g., has own product line)

/**
 * The main Entity interface
 * This is the central profile for creators and brands
 */
export interface Entity {
  id: EntityId;
  type: EntityType;
  
  // =========================================================================
  // IDENTITY
  // =========================================================================
  
  identity: {
    name: string;
    displayName?: string;
    bio?: string;
    
    // Handles across platforms
    handles: {
      platform: Platform;
      handle: string;
      url: string;
      verified: boolean;
      followerCount?: number;
      lastSynced?: Date;
    }[];
    
    // Primary platform
    primaryPlatform?: Platform;
    
    // Contact (optional, for brand deals)
    email?: string;
    website?: string;
    
    // Location
    location?: {
      country: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    
    // Profile image
    avatarUrl?: string;
  };
  
  // =========================================================================
  // CLASSIFICATION
  // =========================================================================
  
  classification: {
    // Niche (e.g., "fashion", "beauty", "tech")
    niche: Claim<string[]>;
    
    // Sub-niche (e.g., "minimalist fashion", "affordable luxury")
    subNiche: Claim<string[]>;
    
    // Content verticals (what they create content about)
    verticals: Claim<string[]>;
    
    // Audience (who they create for)
    targetAudience?: Claim<string[]>;  // ["women 25-40", "professionals"]
  };
  
  // =========================================================================
  // STYLE & VOICE DNA
  // =========================================================================
  
  // Visual style fingerprint
  style: StyleFingerprint;
  
  // Voice/communication fingerprint
  voice: VoiceFingerprint;
  
  // =========================================================================
  // PRODUCT AFFINITY
  // =========================================================================
  
  productAffinity: {
    // Categories they feature/sell
    categories: Claim<Record<ProductCategory, number>>;  // Category -> frequency %
    
    // Brands they feature (for creators) or compete with (for brands)
    brands: Claim<Record<string, number>>;  // Brand name -> frequency %
    
    // Price range
    priceRange: Claim<PriceRange>;
    
    // Price positioning
    pricePositioning: Claim<'budget' | 'mid' | 'premium' | 'luxury' | 'mixed'>;
  };
  
  // =========================================================================
  // RELATIONSHIPS (THE GRAPH)
  // =========================================================================
  
  relationships: {
    // Similar entities (aesthetic proximity)
    similarTo: {
      entityId: EntityId;
      similarityScore: number;      // 0-100
      similarityType: 'aesthetic' | 'niche' | 'audience' | 'overall';
      calculatedAt: Date;
    }[];
    
    // Collaboration history
    collaboratedWith: {
      entityId: EntityId;
      contentIds: ContentId[];
      firstCollab: Date;
      lastCollab: Date;
    }[];
    
    // For brands: competitors
    competitorOf?: {
      entityId: EntityId;
      overlapScore: number;         // 0-100, how much they compete
      calculatedAt: Date;
    }[];
    
    // For creators: brands they have official partnerships with
    officialPartner?: {
      brandId: EntityId;
      partnershipType: 'ambassador' | 'affiliate' | 'sponsored' | 'other';
      since?: Date;
    }[];
  };
  
  // =========================================================================
  // CONTENT PATTERNS (AGGREGATED)
  // =========================================================================
  
  contentPatterns: ContentPatterns;
  
  // =========================================================================
  // BRAND-SPECIFIC FIELDS
  // =========================================================================
  
  // Only populated for type === 'brand' or 'creator_brand'
  brandData?: {
    // Company info
    companyName?: string;
    founded?: number;
    headquarters?: string;
    
    // Brand positioning
    positioning: {
      tagline?: string;
      valueProposition?: string;
      targetMarket?: string[];
    };
    
    // Product catalog reference
    catalogId?: string;
    productCount?: number;
    
    // Brand safety
    brandSafety: {
      guidelines?: string;
      restrictedTopics?: string[];
      requiredDisclosures?: string[];
    };
  };
  
  // =========================================================================
  // CREATOR-SPECIFIC FIELDS
  // =========================================================================
  
  // Only populated for type === 'creator' or 'creator_brand'
  creatorData?: {
    // Creator tier (based on follower count or other metrics)
    tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
    
    // Availability for brand deals
    availability: {
      openToBrandDeals: boolean;
      preferredDealTypes?: ('gifted' | 'paid' | 'affiliate' | 'ambassador')[];
      rateCard?: {
        type: string;
        minRate?: number;
        maxRate?: number;
        currency: string;
      }[];
    };
    
    // Content preferences
    contentPreferences?: {
      preferredFormats?: string[];
      avoidTopics?: string[];
      preferredBrands?: string[];
    };
  };
  
  // =========================================================================
  // TRUST & VERIFICATION
  // =========================================================================
  
  trust: TrustSignals;
  
  // =========================================================================
  // MACHINE-READABLE OUTPUT
  // =========================================================================
  
  machineReadable: {
    // URLs for AI agents
    llmsTxtUrl?: string;
    discoveryJsonUrl?: string;
    schemaOrgUrl?: string;
    storefrontUrl?: string;
    
    // Last generation timestamps
    llmsTxtGeneratedAt?: Date;
    discoveryJsonGeneratedAt?: Date;
    
    // AI Discovery Score
    aiDiscoveryScore: Claim<number>;  // 0-100
    
    // Profile completeness
    profileCompleteness: number;      // 0-100
    profileCompletenessBreakdown: {
      field: string;
      complete: boolean;
      weight: number;
    }[];
  };
  
  // =========================================================================
  // ACTION LAYER (System of Action)
  // =========================================================================
  
  actionState: {
    // Dashboard state
    dashboard: {
      lastViewed?: Date;
      pinnedMetrics: string[];
    };
    
    // Recommendations queue
    recommendations: Recommendation[];
    
    // Inbox (brand opportunities for creators, creator applications for brands)
    inbox: {
      unreadCount: number;
      lastChecked?: Date;
    };
    
    // Goals
    goals?: Goal[];
    
    // Notification preferences
    notifications: {
      email: boolean;
      push: boolean;
      frequency: 'realtime' | 'daily' | 'weekly';
      enabledTriggers: string[];
    };
  };
  
  // =========================================================================
  // METADATA
  // =========================================================================
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastContentAt?: Date;           // Last content processed
    lastActiveAt?: Date;            // Last user activity
    
    // Processing
    totalContentProcessed: number;
    lastProcessedAt?: Date;
    
    // Flags
    isActive: boolean;
    isSuspended: boolean;
    suspendedReason?: string;
  };
}

// =============================================================================
// CONTENT PATTERNS (AGGREGATED FROM CONTENT)
// =============================================================================

/**
 * Aggregated patterns computed from entity's content
 * This powers intelligence and recommendations
 */
export interface ContentPatterns {
  entityId: EntityId;
  analyzedContentCount: number;
  lastUpdated: Date;
  
  // =========================================================================
  // FORMAT PATTERNS
  // =========================================================================
  
  formats: {
    // Distribution of content formats
    distribution: Record<string, {
      count: number;
      percentage: number;
      avgPerformance?: number;      // If engagement data available
    }>;
    
    // Best performing formats
    topPerforming: string[];
    
    // Formats they don't use much (opportunities)
    underIndexed: string[];
    
    // Recommended formats
    recommended?: string[];
  };
  
  // =========================================================================
  // HOOK PATTERNS
  // =========================================================================
  
  hooks: {
    // Distribution of hook types
    typeDistribution: Record<string, number>;
    
    // Average hook effectiveness
    avgEffectiveness: number;       // 0-100
    
    // Top performing hooks
    topPerforming: {
      type: string;
      avgScore: number;
      exampleText: string;
      contentId: ContentId;
    }[];
    
    // Hook recommendations
    recommendations?: {
      tryMore: string[];            // Hook types to try more of
      tryLess: string[];            // Hook types that underperform
      suggestion?: string;          // Specific suggestion
    };
  };
  
  // =========================================================================
  // PRODUCT PATTERNS
  // =========================================================================
  
  products: {
    // Category distribution
    categoryDistribution: Record<string, number>;
    
    // Brand distribution
    brandDistribution: Record<string, number>;
    
    // Average products per content
    avgPerContent: number;
    
    // Top converting products (if conversion data available)
    topConverting?: {
      productId: string;
      productName: string;
      conversionRate: number;
      mentions: number;
    }[];
    
    // Price range patterns
    pricePatterns: {
      avgPrice: number;
      medianPrice: number;
      priceDistribution: {
        range: string;              // "$0-50", "$50-100", etc.
        percentage: number;
      }[];
    };
  };
  
  // =========================================================================
  // VISUAL PATTERNS
  // =========================================================================
  
  visual: {
    // Dominant aesthetic
    dominantAesthetic: string[];
    
    // Color palette (most used colors)
    colorPalette: string[];
    
    // Common settings
    commonSettings: string[];       // "bedroom", "studio", "outdoor"
    
    // Production style
    productionStyle: 'raw' | 'polished' | 'mixed';
    
    // Thumbnail patterns
    thumbnailPatterns?: {
      facesPresent: number;         // % of thumbnails with faces
      textOverlay: number;          // % with text overlay
      productFocus: number;         // % focused on product
    };
  };
  
  // =========================================================================
  // AUDIO/VOICE PATTERNS
  // =========================================================================
  
  audio: {
    // Dominant tone
    dominantTone: string[];
    
    // Average pace
    avgPace: 'fast' | 'medium' | 'slow';
    
    // Audio type distribution
    audioTypeDistribution: Record<string, number>;  // "voiceover", "trending_sound", etc.
    
    // Signature phrases (if detected)
    signaturePhrases?: string[];
  };
  
  // =========================================================================
  // TEMPORAL PATTERNS
  // =========================================================================
  
  temporal: {
    // Posting frequency
    avgPostsPerWeek: number;
    postingConsistency: number;     // 0-100
    
    // Best performing times (if data available)
    bestPerformingDays?: string[];  // "Monday", "Tuesday", etc.
    bestPerformingTimes?: string[]; // "9am", "7pm", etc.
    
    // Content lifespan
    avgContentLifespan: 'evergreen' | 'trend_driven' | 'mixed';
  };
  
  // =========================================================================
  // BENCHMARK COMPARISONS
  // =========================================================================
  
  benchmarks?: {
    // Niche being compared against
    niche: string;
    nicheCreatorCount: number;
    
    // Hook performance vs niche
    hookScoreVsNiche: {
      entity: number;
      niche: number;
      percentile: number;
    };
    
    // Format distribution vs niche
    formatGaps: {
      format: string;
      entityPercentage: number;
      nichePercentage: number;
      gap: number;                  // Positive = underindexed, negative = overindexed
    }[];
    
    // Posting frequency vs niche
    frequencyVsNiche: {
      entity: number;
      niche: number;
      percentile: number;
    };
    
    // Strengths and areas for improvement
    strengths: string[];
    improvementAreas: string[];
    
    // Last calculated
    calculatedAt: Date;
  };
}

// =============================================================================
// ACTION TYPES (System of Action)
// =============================================================================

/**
 * Recommendation for entity
 */
export interface Recommendation {
  id: string;
  entityId: EntityId;
  
  // Type of recommendation
  type: 
    | 'content_idea'          // Create this content
    | 'hook_suggestion'       // Try this hook style
    | 'product_opportunity'   // Feature this product
    | 'format_suggestion'     // Try this format
    | 'improvement'           // General improvement
    | 'brand_match'           // Brand partnership opportunity
    | 'trending_topic';       // Trending topic to cover
  
  // The recommendation
  title: string;
  description: string;
  
  // Evidence for this recommendation
  evidence: {
    dataPoints: string[];
    benchmarks?: string[];
    examples?: {
      contentId?: ContentId;
      url?: string;
      description: string;
    }[];
  };
  
  // Action
  action: {
    type: string;
    cta: string;                    // "Start Creating", "Try This Hook", etc.
    payload?: Record<string, any>;  // Pre-filled data for the action
  };
  
  // Priority and status
  priority: 'high' | 'medium' | 'low';
  dismissed: boolean;
  actedOn: boolean;
  
  // Timing
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Goal tracking
 */
export interface Goal {
  id: string;
  entityId: EntityId;
  
  // Goal definition
  type: 'followers' | 'revenue' | 'engagement' | 'posts' | 'products' | 'custom';
  title: string;
  target: number;
  current: number;
  
  // Progress
  progress: number;                 // 0-100
  onTrack: boolean;
  
  // Timing
  deadline?: Date;
  createdAt: Date;
  completedAt?: Date;
}

// =============================================================================
// ENTITY CREATION HELPERS
// =============================================================================

/**
 * Create a minimal entity (for initial signup)
 */
export function createMinimalEntity(
  id: EntityId,
  type: EntityType,
  name: string,
  primaryHandle: { platform: Platform; handle: string; url: string }
): Entity {
  const now = new Date();
  
  return {
    id,
    type,
    
    identity: {
      name,
      handles: [{
        ...primaryHandle,
        verified: false,
      }],
      primaryPlatform: primaryHandle.platform,
    },
    
    classification: {
      niche: createEmptyClaim([]),
      subNiche: createEmptyClaim([]),
      verticals: createEmptyClaim([]),
    },
    
    style: createEmptyStyleFingerprint(),
    voice: createEmptyVoiceFingerprint(),
    
    productAffinity: {
      categories: createEmptyClaim({}),
      brands: createEmptyClaim({}),
      priceRange: createEmptyClaim({ 
        min: { amount: 0, currency: 'USD' }, 
        max: { amount: 0, currency: 'USD' } 
      }),
      pricePositioning: createEmptyClaim('mixed'),
    },
    
    relationships: {
      similarTo: [],
      collaboratedWith: [],
    },
    
    contentPatterns: createEmptyContentPatterns(id),
    
    trust: {
      verificationLevel: 'unverified',
      lastActive: now,
      contentCount: 0,
      verifiedProductCount: 0,
      connectedPlatforms: [{
        platform: primaryHandle.platform,
        handle: primaryHandle.handle,
        verified: false,
        connectedAt: now,
      }],
    },
    
    machineReadable: {
      aiDiscoveryScore: createEmptyClaim(0),
      profileCompleteness: 0,
      profileCompletenessBreakdown: [],
    },
    
    actionState: {
      dashboard: {
        pinnedMetrics: [],
      },
      recommendations: [],
      inbox: {
        unreadCount: 0,
      },
      notifications: {
        email: true,
        push: false,
        frequency: 'daily',
        enabledTriggers: ['brand_match', 'earnings_milestone'],
      },
    },
    
    metadata: {
      createdAt: now,
      updatedAt: now,
      totalContentProcessed: 0,
      isActive: true,
      isSuspended: false,
    },
  };
}

// Helper functions for empty claims
function createEmptyClaim<T>(value: T): Claim<T> {
  return {
    value,
    confidence: 0,
    evidence: [],
    source: 'auto',
    modelVersion: 'none',
    extractedAt: new Date(),
  };
}

function createEmptyStyleFingerprint(): StyleFingerprint {
  return {
    embedding: { vector: [], model: 'none', dimensions: 0, createdAt: new Date() },
    tags: createEmptyClaim([]),
    visualStyle: createEmptyClaim([]),
    colorPalette: createEmptyClaim([]),
    mood: createEmptyClaim([]),
    productionQuality: createEmptyClaim('mixed'),
    aesthetic: createEmptyClaim(''),
  };
}

function createEmptyVoiceFingerprint(): VoiceFingerprint {
  return {
    embedding: { vector: [], model: 'none', dimensions: 0, createdAt: new Date() },
    tone: createEmptyClaim([]),
    energy: createEmptyClaim('medium'),
    pace: createEmptyClaim('medium'),
  };
}

function createEmptyContentPatterns(entityId: EntityId): ContentPatterns {
  return {
    entityId,
    analyzedContentCount: 0,
    lastUpdated: new Date(),
    formats: {
      distribution: {},
      topPerforming: [],
      underIndexed: [],
    },
    hooks: {
      typeDistribution: {},
      avgEffectiveness: 0,
      topPerforming: [],
    },
    products: {
      categoryDistribution: {},
      brandDistribution: {},
      avgPerContent: 0,
      pricePatterns: {
        avgPrice: 0,
        medianPrice: 0,
        priceDistribution: [],
      },
    },
    visual: {
      dominantAesthetic: [],
      colorPalette: [],
      commonSettings: [],
      productionStyle: 'mixed',
    },
    audio: {
      dominantTone: [],
      avgPace: 'medium',
      audioTypeDistribution: {},
    },
    temporal: {
      avgPostsPerWeek: 0,
      postingConsistency: 0,
      avgContentLifespan: 'mixed',
    },
  };
}
