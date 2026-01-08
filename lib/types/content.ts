/**
 * VELOLUME SHARED DATA ENGINE
 * Content Types - Individual Content Pieces
 * 
 * A Content represents a single piece of media (video, image, carousel)
 * with all extracted data, claims, and evidence.
 */

import {
  ContentId,
  EntityId,
  ProductMentionId,
  Claim,
  Evidence,
  Platform,
  SubmissionType,
  ExtractionDepth,
  ProcessingMetadata,
  TemporalData,
  ContentFormat,
  HookType,
  Sentiment,
  Embedding,
} from './core';

// =============================================================================
// CONTENT TYPE
// =============================================================================

/**
 * Content media type
 */
export type ContentMediaType = 
  | 'video'
  | 'image'
  | 'carousel'
  | 'story'
  | 'live'
  | 'audio';

/**
 * Main Content interface
 * Represents a single piece of content with all extracted data
 */
export interface Content {
  id: ContentId;
  entityId: EntityId;
  
  // =========================================================================
  // SOURCE & SUBMISSION
  // =========================================================================
  
  source: {
    platform: Platform;
    mediaType: ContentMediaType;
    submissionType: SubmissionType;
    
    // Source URLs
    sourceUrl?: string;           // Original platform URL
    uploadUrl?: string;           // Our stored copy
    
    // Platform-specific ID
    platformId?: string;
    
    // Platform metadata (if available)
    platformMetadata?: {
      title?: string;
      description?: string;
      hashtags?: string[];
      mentions?: string[];
      soundId?: string;
      soundName?: string;
      isAd?: boolean;
      isPinned?: boolean;
    };
  };
  
  // =========================================================================
  // RAW ASSETS
  // =========================================================================
  
  raw: {
    // Video/image dimensions
    width?: number;
    height?: number;
    aspectRatio?: string;
    
    // Duration (for video/audio)
    duration?: number;            // Seconds
    
    // Extracted frames
    frames: {
      index: number;
      timestamp: number;          // Seconds into video
      url: string;                // Stored frame URL
      isKeyFrame: boolean;        // Scene change detection
    }[];
    
    // Audio
    audioUrl?: string;            // Extracted audio
    
    // Transcript (from speech-to-text)
    transcript?: {
      fullText: string;
      segments: {
        start: number;            // Seconds
        end: number;
        text: string;
        confidence: number;
        speaker?: string;         // If speaker diarization
      }[];
      language: string;
      modelUsed: string;
    };
    
    // On-screen text (OCR)
    textOverlays?: {
      timestamp: number;
      text: string;
      position: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      confidence: number;
    }[];
    
    // Captions (if provided by platform)
    captions?: string;
  };
  
  // =========================================================================
  // TEMPORAL DATA
  // =========================================================================
  
  temporal: TemporalData;
  
  // =========================================================================
  // THE HOOK (First 3 seconds - Critical)
  // =========================================================================
  
  hook: {
    // Hook type classification
    type: Claim<HookType>;
    
    // What they say
    transcript: Claim<string>;
    
    // What's shown visually
    visualDescription: Claim<string>;
    
    // On-screen text in hook
    textOverlay?: Claim<string>;
    
    // Hook effectiveness prediction
    effectiveness: Claim<number>;   // 0-100
    
    // Why we scored it this way
    effectivenessReasoning?: string;
    
    // Attention metrics (if available)
    attentionMetrics?: {
      retentionAtHook?: number;     // % still watching after hook
      avgWatchTime?: number;
    };
  };
  
  // =========================================================================
  // FORMAT & CLASSIFICATION
  // =========================================================================
  
  classification: {
    // Primary format
    format: Claim<ContentFormat>;
    
    // Secondary formats (content can be multiple)
    secondaryFormats?: Claim<ContentFormat[]>;
    
    // Content category (what it's about)
    category: Claim<string[]>;      // ["fashion", "workwear"]
    
    // Is this sponsored/ad content?
    isSponsored: Claim<boolean>;
    sponsorInfo?: {
      brandName?: string;
      disclosureType?: string;      // "#ad", "paid partnership", etc.
      disclosureTimestamp?: number;
    };
    
    // Content tags (for search/filtering)
    tags: Claim<string[]>;
  };
  
  // =========================================================================
  // NARRATIVE STRUCTURE
  // =========================================================================
  
  narrative: {
    // Overall structure
    structure: Claim<'problem_solution' | 'listicle' | 'story' | 'showcase' | 'comparison' | 'tutorial' | 'review' | 'other'>;
    
    // Pacing
    pacing: Claim<'fast' | 'medium' | 'slow'>;
    
    // Segments (breakdown of content)
    segments?: {
      startTime: number;
      endTime: number;
      type: 'hook' | 'intro' | 'product_showcase' | 'demonstration' | 'review' | 'comparison' | 'story' | 'cta' | 'outro' | 'other';
      description?: string;
      productsShown?: ProductMentionId[];
    }[];
    
    // Call to action
    cta?: {
      present: boolean;
      type?: 'follow' | 'like' | 'comment' | 'share' | 'link' | 'shop' | 'subscribe' | 'other';
      transcript?: string;
      timestamp?: number;
    };
    
    // Key moments
    keyMoments?: {
      timestamp: number;
      type: 'highlight' | 'reveal' | 'transformation' | 'recommendation' | 'warning';
      description: string;
    }[];
  };
  
  // =========================================================================
  // PRODUCTS FEATURED
  // =========================================================================
  
  products: ProductMention[];
  
  // Product summary (aggregated)
  productSummary: {
    totalProducts: number;
    categories: string[];
    brands: string[];
    avgSentiment: Sentiment;
    primaryProduct?: ProductMentionId;  // The "hero" product
  };
  
  // =========================================================================
  // VISUAL ANALYSIS
  // =========================================================================
  
  visual: {
    // Overall aesthetic
    aesthetic: Claim<string[]>;     // ["minimal", "cozy", "luxe"]
    
    // Dominant colors
    dominantColors: Claim<string[]>;
    
    // Color mood
    colorMood: Claim<'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted'>;
    
    // Setting/location
    setting: Claim<string>;         // "bedroom", "studio", "outdoor", "store"
    settingDetails?: Claim<string>; // More specific: "modern apartment bedroom"
    
    // Lighting
    lighting: Claim<'natural' | 'studio' | 'ring_light' | 'low_light' | 'mixed'>;
    
    // Composition types present
    composition: Claim<string[]>;   // ["talking_head", "full_body", "product_focus", "flat_lay"]
    
    // Faces
    facesDetected?: {
      count: number;
      primaryFaceScreenTime?: number;  // % of video with face
    };
    
    // Visual quality
    qualityScore?: Claim<number>;   // 0-100
    
    // Thumbnail analysis (for videos)
    thumbnail?: {
      url: string;
      hasFace: boolean;
      hasText: boolean;
      hasProduct: boolean;
      dominantColors: string[];
      attentionScore?: number;
    };
  };
  
  // =========================================================================
  // AUDIO ANALYSIS
  // =========================================================================
  
  audio: {
    // Audio type
    type: Claim<'voiceover' | 'talking_head' | 'trending_sound' | 'original_music' | 'no_audio' | 'mixed'>;
    
    // If using trending sound
    trendingSound?: {
      id: string;
      name: string;
      artist?: string;
      isViral: boolean;
    };
    
    // Voice analysis (if speaking)
    voice?: {
      energy: Claim<'high' | 'medium' | 'calm'>;
      pace: Claim<'fast' | 'medium' | 'slow'>;
      tone: Claim<string[]>;        // ["enthusiastic", "conversational"]
      clarity: Claim<number>;       // 0-100
    };
    
    // Music analysis
    music?: {
      present: boolean;
      mood?: string;
      genre?: string;
      energy?: 'high' | 'medium' | 'low';
    };
    
    // Overall audio quality
    qualityScore?: Claim<number>;   // 0-100
  };
  
  // =========================================================================
  // INTENT SIGNALS
  // =========================================================================
  
  intentSignals: {
    // Shopping intent indicators
    shoppingIntent: {
      score: number;                // 0-100
      signals: string[];            // What signals we detected
    };
    
    // Educational intent
    educationalIntent: {
      score: number;
      signals: string[];
    };
    
    // Entertainment intent
    entertainmentIntent: {
      score: number;
      signals: string[];
    };
    
    // Aspirational intent
    aspirationalIntent: {
      score: number;
      signals: string[];
    };
    
    // Comment intent indicators (if comments available)
    commentIntentSignals?: {
      buyingQuestions: number;      // "where to buy?", "link?"
      priceQuestions: number;       // "how much?"
      productQuestions: number;     // "what brand?", "is this good?"
      totalComments?: number;
    };
  };
  
  // =========================================================================
  // PERFORMANCE DATA (if available)
  // =========================================================================
  
  performance?: {
    // Basic metrics
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    
    // Engagement rate
    engagementRate?: number;
    
    // Watch metrics (for video)
    avgWatchTime?: number;
    completionRate?: number;
    
    // When captured
    capturedAt: Date;
    
    // Our storefront metrics
    storefrontClicks?: number;
    storefrontConversions?: number;
    storefrontRevenue?: number;
  };
  
  // =========================================================================
  // DERIVED SCORES
  // =========================================================================
  
  scores: {
    // Overall content quality
    qualityScore: Claim<number>;    // 0-100
    
    // Hook strength
    hookStrength: Claim<number>;    // 0-100
    
    // Product integration quality (how naturally products are featured)
    productIntegration: Claim<number>;  // 0-100
    
    // Commercial potential (likelihood to drive sales)
    commercialPotential: Claim<number>; // 0-100
    
    // Virality potential
    viralityPotential?: Claim<number>;  // 0-100
  };
  
  // =========================================================================
  // PROCESSING METADATA
  // =========================================================================
  
  processing: ProcessingMetadata;
  
  // =========================================================================
  // METADATA
  // =========================================================================
  
  metadata: {
    createdAt: Date;                // When we created this record
    updatedAt: Date;
    
    // Versioning
    version: number;
    lastMajorUpdate?: Date;
    
    // Flags
    isPublic: boolean;
    isArchived: boolean;
    needsReview: boolean;
    reviewReason?: string;
  };
}

// =============================================================================
// PRODUCT MENTION
// =============================================================================

/**
 * A product mentioned/featured in content
 * This is THE critical data structure for monetization
 */
export interface ProductMention {
  id: ProductMentionId;
  contentId: ContentId;
  entityId: EntityId;
  
  // =========================================================================
  // DETECTION
  // =========================================================================
  
  detected: {
    // What we think this product is
    description: Claim<string>;     // "olive green cropped sweater"
    
    // Brand detection
    brand: Claim<string | null>;    // "Zara" or null if unknown
    brandConfidence: number;
    
    // Category classification
    category: Claim<string>;        // "clothing"
    subcategory: Claim<string>;     // "sweaters"
    
    // Category-specific attributes
    attributes: Claim<Record<string, string>>;
    
    // Raw detection data
    detectionMethod: 'visual' | 'transcript' | 'text_overlay' | 'combined';
  };
  
  // =========================================================================
  // APPEARANCE (Where/When in Content)
  // =========================================================================
  
  appearance: {
    // When it appears
    firstAppearance: number;        // Seconds
    lastAppearance: number;
    totalScreenTime: number;        // Seconds visible
    
    // Frame references
    frameIndices: number[];
    timestamps: number[];
    
    // Bounding boxes (for visual products)
    boundingBoxes?: {
      frameIndex: number;
      box: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }[];
    
    // Screen prominence
    avgScreenCoverage?: number;     // 0-1, how much of screen it takes
  };
  
  // =========================================================================
  // CONTEXT (THE DIFFERENTIATOR)
  // =========================================================================
  
  context: {
    // Sentiment toward product
    sentiment: Claim<Sentiment>;
    sentimentQuote?: string;        // The actual words that indicate sentiment
    
    // How it's positioned in the content
    positioning: Claim<'hero' | 'featured' | 'styled_with' | 'mentioned' | 'background' | 'compared'>;
    
    // What they said about it
    quote?: Claim<string>;          // "This is my favorite sweater for work"
    
    // Use case mentioned
    useCase?: Claim<string>;        // "great for work", "date night", "everyday"
    
    // Comparison context
    comparison?: {
      comparedTo?: string;          // Another product
      verdict?: 'better' | 'worse' | 'similar' | 'different';
      reason?: string;
    };
    
    // Price commentary
    priceComment?: Claim<'affordable' | 'expensive' | 'worth_it' | 'splurge' | 'dupe' | 'budget' | 'sale' | null>;
    
    // Recommendation strength
    recommendationStrength: Claim<'strong_recommend' | 'recommend' | 'neutral' | 'warn' | 'negative'>;
    
    // Is this a repurchase/repeat mention?
    isRepurchase?: boolean;
    mentionCount?: number;          // How many times this creator has mentioned it
  };
  
  // =========================================================================
  // RESOLUTION (Matching to Real Product)
  // =========================================================================
  
  resolution: {
    // Current status
    status: 'unresolved' | 'candidates' | 'matched' | 'verified' | 'no_match';
    
    // Candidate matches
    candidates?: {
      canonicalProductId: string;
      productName: string;
      productUrl: string;
      confidence: number;           // 0-100
      matchMethod: 'visual' | 'text' | 'brand_category' | 'combined';
      matchReasons: string[];
    }[];
    
    // Final match
    match?: {
      canonicalProductId: string;
      productName: string;
      productUrl: string;
      confidence: number;
      
      // Verification
      verificationState: 'auto' | 'creator_confirmed' | 'brand_verified' | 'disputed';
      verifiedAt?: Date;
      verifiedBy?: string;
      
      // If disputed
      disputeReason?: string;
      disputedBy?: string;
    };
    
    // If no match possible
    noMatchReason?: 'not_for_sale' | 'discontinued' | 'private_label' | 'handmade' | 'unknown' | 'not_searched';
  };
  
  // =========================================================================
  // COMMERCE
  // =========================================================================
  
  commerce?: {
    // Affiliate link data
    affiliateNetwork: string;       // "amazon", "skimlinks", "involve_asia"
    affiliateUrl: string;
    originalUrl: string;
    
    // Price (at time of extraction)
    price?: {
      amount: number;
      currency: string;
      capturedAt: Date;
    };
    
    // Commission estimate
    estimatedCommission?: {
      rate: number;                 // Percentage
      amount: number;               // Estimated per sale
    };
    
    // Availability
    inStock?: boolean;
    availableAt?: string[];         // Merchant names
  };
  
  // =========================================================================
  // CONVERSION TRACKING
  // =========================================================================
  
  conversions?: {
    // Click tracking
    clicks: number;
    clicksFromStorefront: number;
    clicksFromContent: number;
    
    // Conversion tracking
    purchases: number;
    revenue: number;
    
    // Behavior analysis
    clickedExactMatch: number;      // Clicked the matched product
    clickedSimilar: number;         // Clicked a lookalike
    
    // Time tracking
    firstClick?: Date;
    lastClick?: Date;
    
    // Conversion rate
    conversionRate?: number;
  };
  
  // =========================================================================
  // METADATA
  // =========================================================================
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    
    // Processing
    extractionDepth: ExtractionDepth;
    modelVersions: Record<string, string>;
    
    // Flags
    needsReview: boolean;
    reviewReason?: string;
    isHidden: boolean;              // Creator chose to hide
  };
}

// =============================================================================
// CONTENT CREATION HELPERS
// =============================================================================

/**
 * Create a content record for initial processing
 */
export function createContentForProcessing(
  id: ContentId,
  entityId: EntityId,
  source: Content['source'],
  raw: Partial<Content['raw']>
): Partial<Content> {
  const now = new Date();
  
  return {
    id,
    entityId,
    source,
    raw: {
      frames: [],
      ...raw,
    },
    temporal: {
      publishedAt: now,
      processedAt: now,
      lifespanType: {
        value: 'unknown',
        confidence: 0,
        evidence: [],
        source: 'auto',
        modelVersion: 'pending',
        extractedAt: now,
      },
    },
    products: [],
    productSummary: {
      totalProducts: 0,
      categories: [],
      brands: [],
      avgSentiment: 'neutral',
    },
    processing: {
      extractionDepth: 'standard',
      totalCost: 0,
      costBreakdown: [],
      modelVersions: {},
      startedAt: now,
      status: 'pending',
      retryCount: 0,
      needsReprocessing: false,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      isPublic: true,
      isArchived: false,
      needsReview: false,
    },
  };
}
