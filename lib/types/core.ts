/**
 * VELOLUME SHARED DATA ENGINE
 * Core Type Definitions
 * 
 * Design Principles:
 * 1. Every extracted value is a Claim with evidence
 * 2. Everything is traceable to source
 * 3. Verification states are first-class
 * 4. Time and dynamics are built-in
 * 5. Relationships are explicit
 */

// =============================================================================
// FOUNDATIONAL TYPES
// =============================================================================

/**
 * Unique identifier type for type safety
 */
export type EntityId = string & { readonly brand: unique symbol };
export type ContentId = string & { readonly brand: unique symbol };
export type ProductId = string & { readonly brand: unique symbol };
export type ProductMentionId = string & { readonly brand: unique symbol };
export type CanonicalProductId = string & { readonly brand: unique symbol };

/**
 * Helper to create branded IDs
 */
export const createEntityId = (id: string): EntityId => id as EntityId;
export const createContentId = (id: string): ContentId => id as ContentId;
export const createProductId = (id: string): ProductId => id as ProductId;
export const createProductMentionId = (id: string): ProductMentionId => id as ProductMentionId;
export const createCanonicalProductId = (id: string): CanonicalProductId => id as CanonicalProductId;

/**
 * Timestamp with timezone awareness
 */
export interface Timestamp {
  utc: Date;
  timezone?: string;
}

/**
 * Price with currency
 */
export interface Price {
  amount: number;
  currency: string; // ISO 4217
}

/**
 * Price range
 */
export interface PriceRange {
  min: Price;
  max: Price;
  median?: Price;
}

// =============================================================================
// EVIDENCE SYSTEM
// =============================================================================

/**
 * Types of evidence that can support a claim
 */
export type EvidenceType = 
  | 'frame'           // Visual evidence from a video frame
  | 'transcript'      // Spoken words
  | 'text_overlay'    // On-screen text/captions
  | 'audio'           // Audio analysis
  | 'metadata'        // Platform metadata
  | 'user_input'      // Creator/brand provided
  | 'external_api'    // From external source (Google Shopping, etc.)
  | 'derived';        // Computed from other claims

/**
 * Evidence that supports a claim
 * Every claim must be traceable to its source
 */
export interface Evidence {
  type: EvidenceType;
  
  // Location in source content
  contentId?: ContentId;
  timestamp?: number;           // Seconds into video
  timestampEnd?: number;        // For spans
  frameIndex?: number;
  
  // The actual evidence
  transcriptSpan?: string;      // Exact text
  boundingBox?: BoundingBox;    // Location in frame
  frameUrl?: string;            // Reference to frame image
  
  // For external sources
  sourceUrl?: string;
  sourceType?: string;
  
  // Metadata
  capturedAt: Date;
}

/**
 * Bounding box for visual evidence
 */
export interface BoundingBox {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

// =============================================================================
// CLAIM SYSTEM
// =============================================================================

/**
 * Source of a claim - who/what made this assertion
 */
export type ClaimSource = 
  | 'auto'                // Automated extraction
  | 'creator_confirmed'   // Creator verified
  | 'brand_verified'      // Brand verified
  | 'user_corrected'      // User made a correction
  | 'disputed'            // Under dispute
  | 'human_reviewed';     // Manually reviewed by team

/**
 * A Claim wraps any extracted value with:
 * - Confidence score
 * - Evidence trail
 * - Verification state
 * - Provenance tracking
 * 
 * This is the core primitive of our data model.
 * Everything extracted is a Claim, not a fact.
 */
export interface Claim<T> {
  value: T;
  confidence: number;           // 0-100
  
  // Evidence trail
  evidence: Evidence[];
  
  // Verification state
  source: ClaimSource;
  verifiedAt?: Date;
  verifiedBy?: string;          // User ID or system
  
  // Provenance
  modelVersion: string;         // Which model extracted this
  extractedAt: Date;
  updatedAt?: Date;
  
  // For corrections
  previousValues?: {
    value: T;
    confidence: number;
    source: ClaimSource;
    changedAt: Date;
    reason?: string;
  }[];
}

/**
 * Helper to create a new claim
 */
export function createClaim<T>(
  value: T,
  confidence: number,
  evidence: Evidence[],
  modelVersion: string
): Claim<T> {
  return {
    value,
    confidence,
    evidence,
    source: 'auto',
    modelVersion,
    extractedAt: new Date(),
  };
}

/**
 * Helper to confirm a claim
 */
export function confirmClaim<T>(
  claim: Claim<T>,
  source: ClaimSource,
  verifiedBy: string
): Claim<T> {
  return {
    ...claim,
    source,
    verifiedAt: new Date(),
    verifiedBy,
    confidence: Math.min(claim.confidence + 10, 100), // Boost confidence on verification
    updatedAt: new Date(),
  };
}

/**
 * Helper to correct a claim
 */
export function correctClaim<T>(
  claim: Claim<T>,
  newValue: T,
  correctedBy: string,
  reason?: string
): Claim<T> {
  return {
    ...claim,
    value: newValue,
    source: 'user_corrected',
    confidence: 95, // High confidence for user corrections
    verifiedAt: new Date(),
    verifiedBy: correctedBy,
    updatedAt: new Date(),
    previousValues: [
      ...(claim.previousValues || []),
      {
        value: claim.value,
        confidence: claim.confidence,
        source: claim.source,
        changedAt: new Date(),
        reason,
      },
    ],
  };
}

// =============================================================================
// TEMPORAL TYPES
// =============================================================================

/**
 * Content lifespan classification
 */
export type LifespanType = 
  | 'evergreen'       // Always relevant
  | 'seasonal'        // Relevant at certain times of year
  | 'trend_driven'    // Tied to a specific trend
  | 'news'            // Time-sensitive
  | 'unknown';

/**
 * Temporal metadata for content
 */
export interface TemporalData {
  publishedAt: Date;
  processedAt: Date;
  lastUpdatedAt?: Date;
  
  // Content lifespan
  lifespanType: Claim<LifespanType>;
  expiresAt?: Date;             // For time-sensitive content
  
  // Momentum (if engagement data available)
  momentum?: {
    score: number;              // 0-100, velocity of engagement
    trend: 'rising' | 'stable' | 'declining';
    calculatedAt: Date;
  };
  
  // Trend alignment
  trendAlignment?: {
    trendId: string;
    trendName: string;
    alignmentScore: number;     // 0-100
  }[];
  
  // Seasonality
  seasonality?: {
    peakMonths: number[];       // 1-12
    isCurrentlySeasonal: boolean;
  };
}

// =============================================================================
// EMBEDDING TYPES
// =============================================================================

/**
 * Vector embedding with metadata
 */
export interface Embedding {
  vector: number[];
  model: string;                // Which embedding model
  dimensions: number;
  createdAt: Date;
}

/**
 * Style fingerprint combining embeddings with interpretable tags
 */
export interface StyleFingerprint {
  // For similarity search
  embedding: Embedding;
  
  // Interpretable tags (for UX and filtering)
  tags: Claim<string[]>;
  
  // Specific style attributes
  visualStyle: Claim<string[]>;       // ["minimal", "maximalist", "cozy"]
  colorPalette: Claim<string[]>;      // Top colors
  mood: Claim<string[]>;              // ["aspirational", "relatable", "luxe"]
  productionQuality: Claim<'raw' | 'polished' | 'mixed' | 'professional'>;
  aesthetic: Claim<string>;           // Primary aesthetic label
}

/**
 * Voice fingerprint combining embeddings with interpretable tags
 */
export interface VoiceFingerprint {
  // For similarity search
  embedding: Embedding;
  
  // Interpretable tags
  tone: Claim<string[]>;              // ["conversational", "professional", "enthusiastic"]
  energy: Claim<'high' | 'medium' | 'calm'>;
  pace: Claim<'fast' | 'medium' | 'slow'>;
  
  // Speech patterns (if transcript available)
  avgSentenceLength?: number;
  vocabularyLevel?: Claim<'casual' | 'professional' | 'technical'>;
  signaturePhrases?: Claim<string[]>; // Recurring phrases
}

// =============================================================================
// VERIFICATION & TRUST
// =============================================================================

/**
 * Verification levels for entities
 */
export type VerificationLevel = 
  | 'unverified'          // Just signed up
  | 'email_verified'      // Email confirmed
  | 'platform_linked'     // Connected social accounts
  | 'identity_verified'   // ID verification
  | 'brand_partner';      // Official brand partnership

/**
 * Trust signals for an entity
 */
export interface TrustSignals {
  verificationLevel: VerificationLevel;
  
  // Activity
  lastActive: Date;
  contentCount: number;
  verifiedProductCount: number;
  
  // Quality metrics
  correctionRate?: number;      // How often their content needs correction
  disputeRate?: number;         // How often their claims are disputed
  
  // Platform connections
  connectedPlatforms: {
    platform: string;
    handle: string;
    verified: boolean;
    followerCount?: number;
    connectedAt: Date;
  }[];
}

// =============================================================================
// PLATFORM & SOURCE
// =============================================================================

/**
 * Supported platforms
 */
export type Platform = 
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'youtube_shorts'
  | 'pinterest'
  | 'twitter'
  | 'facebook'
  | 'snapchat'
  | 'upload'            // Direct upload
  | 'other';

/**
 * How content was submitted
 */
export type SubmissionType = 
  | 'creator_upload'    // Direct file upload
  | 'link_submitted'    // URL provided
  | 'api_import'        // Via API
  | 'scraped';          // We found it (with permission)

// =============================================================================
// EXTRACTION METADATA
// =============================================================================

/**
 * Extraction depth levels
 */
export type ExtractionDepth = 
  | 'quick_scan'        // Fast, cheap, basic
  | 'standard'          // Normal processing
  | 'deep'              // Full analysis
  | 'reprocess';        // Re-running extraction

/**
 * Processing metadata for content
 */
export interface ProcessingMetadata {
  extractionDepth: ExtractionDepth;
  
  // Cost tracking
  totalCost: number;            // In cents
  costBreakdown: {
    stage: string;
    model: string;
    tokens: number;
    cost: number;
  }[];
  
  // Model versions used
  modelVersions: Record<string, string>;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  failureReason?: string;
  retryCount: number;
  
  // Flags for reprocessing
  needsReprocessing: boolean;
  reprocessingReason?: string;
}

// =============================================================================
// COMMON ENUMS & CONSTANTS
// =============================================================================

/**
 * Product categories (top-level)
 */
export type ProductCategory = 
  | 'clothing'
  | 'footwear'
  | 'accessories'
  | 'jewelry'
  | 'beauty'
  | 'skincare'
  | 'haircare'
  | 'fragrance'
  | 'tech'
  | 'home'
  | 'fitness'
  | 'food'
  | 'other';

/**
 * Content format types
 */
export type ContentFormat = 
  | 'ootd'              // Outfit of the day
  | 'haul'              // Shopping haul
  | 'tutorial'          // How-to
  | 'review'            // Product review
  | 'grwm'              // Get ready with me
  | 'unboxing'          // Unboxing
  | 'routine'           // Morning/night routine
  | 'comparison'        // A vs B
  | 'favorites'         // Monthly favorites, etc.
  | 'vlog'              // Day in life
  | 'transformation'    // Before/after
  | 'story_time'        // Narrative content
  | 'trend'             // Trend participation
  | 'ad'                // Sponsored content
  | 'other';

/**
 * Hook types for content
 */
export type HookType = 
  | 'pov'               // POV: you just...
  | 'question'          // Have you ever...?
  | 'statement'         // I found the best...
  | 'controversy'       // Unpopular opinion...
  | 'teaser'            // Wait for it...
  | 'trend_sound'       // Using trending audio
  | 'visual_hook'       // Striking visual opening
  | 'problem'           // Struggling with...?
  | 'story'             // Story time...
  | 'listicle'          // 5 things you need...
  | 'reaction'          // Reacting to...
  | 'other';

/**
 * Sentiment values
 */
export type Sentiment = 
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'mixed';

/**
 * Product positioning in content
 */
export type ProductPositioning = 
  | 'hero'              // Main focus of content
  | 'featured'          // Prominently featured
  | 'styled_with'       // Part of an outfit/look
  | 'mentioned'         // Verbally mentioned
  | 'background'        // Visible but not focus
  | 'compared';         // Part of comparison

// =============================================================================
// EXPORT ALL
// =============================================================================

export type {
  EntityId,
  ContentId,
  ProductId,
  ProductMentionId,
  CanonicalProductId,
};
