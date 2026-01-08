/**
 * Product Claims Integration
 *
 * Bridges the new Claim<T>/Evidence system with existing ProductData.
 * This allows gradual migration while maintaining backwards compatibility.
 */

import type { ProductData } from '../ai/processor';

// =============================================================================
// EVIDENCE TYPES (from core.ts, simplified for integration)
// =============================================================================

export type EvidenceType =
  | 'frame'           // Visual evidence from a video frame
  | 'transcript'      // Spoken words
  | 'text_overlay'    // On-screen text/captions
  | 'audio'           // Audio analysis
  | 'metadata'        // Platform metadata
  | 'user_input'      // Creator/brand provided
  | 'external_api'    // From external source (Google Shopping, etc.)
  | 'derived';        // Computed from other claims

export interface BoundingBox {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

export interface Evidence {
  type: EvidenceType;

  // Location in source content
  contentId?: string;
  timestamp?: number;           // Seconds into video
  timestampEnd?: number;        // For spans
  frameIndex?: number;

  // The actual evidence
  transcriptSpan?: string;      // Exact text from transcript
  boundingBox?: BoundingBox;    // Location in frame
  frameUrl?: string;            // Reference to frame image

  // For external sources
  sourceUrl?: string;
  sourceType?: string;

  // Metadata
  capturedAt: Date;
}

// =============================================================================
// CLAIM TYPES (from core.ts, simplified for integration)
// =============================================================================

export type ClaimSource =
  | 'auto'                // Automated extraction
  | 'creator_confirmed'   // Creator verified
  | 'brand_verified'      // Brand verified
  | 'user_corrected'      // User made a correction
  | 'disputed';           // Under dispute

export interface Claim<T> {
  value: T;
  confidence: number;           // 0-100

  // Evidence trail
  evidence: Evidence[];

  // Verification state
  source: ClaimSource;
  verifiedAt?: Date;
  verifiedBy?: string;

  // Provenance
  modelVersion: string;
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

// =============================================================================
// VERIFICATION TIERS
// =============================================================================

export type VerificationTier =
  | 'auto'                // AI detected, confidence < 85
  | 'auto_high'           // AI detected, confidence >= 85
  | 'creator_confirmed'   // Creator approved the match
  | 'brand_verified'      // Brand confirmed the product
  | 'disputed';           // Under review

export interface VerificationState {
  tier: VerificationTier;
  confidence: number;
  verifiedAt?: Date;
  verifiedBy?: string;
  disputeReason?: string;
}

// =============================================================================
// PRODUCT DETECTION WITH EVIDENCE
// =============================================================================

export interface ProductEvidence {
  // Frame evidence
  frameIndices: number[];
  timestamps: number[];
  boundingBoxes?: {
    frameIndex: number;
    box: BoundingBox;
  }[];

  // Transcript evidence (if mentioned)
  transcriptMentions?: {
    text: string;
    startTime: number;
    endTime: number;
  }[];

  // Text overlay evidence (if product name/brand visible)
  textOverlayMentions?: {
    text: string;
    frameIndex: number;
    position?: BoundingBox;
  }[];
}

/**
 * ProductDetection with Claims and Evidence
 * Wraps the existing ProductData with evidence trail
 */
export interface ProductDetectionClaim {
  // Original product data (backwards compatible)
  product: ProductData;

  // Evidence trail
  evidence: ProductEvidence;

  // Claims for specific attributes
  claims: {
    name: Claim<string>;
    category: Claim<string>;
    subcategory: Claim<string>;
    colors: Claim<string[]>;
    brand: Claim<string | null>;
    material: Claim<string | null>;
    style: Claim<string | null>;
    pattern: Claim<string | null>;
    estimatedPrice: Claim<string | null>;
  };

  // Verification state
  verification: VerificationState;

  // Processing metadata
  detectionMethod: 'visual' | 'transcript' | 'text_overlay' | 'combined';
  modelVersion: string;
  extractedAt: Date;
}

// =============================================================================
// PRODUCT MATCH WITH VERIFICATION
// =============================================================================

export interface ProductMatchClaim {
  // Match details
  matchedProduct: {
    title: string;
    source: string;
    link: string;
    price: string;
    thumbnail: string;
  };

  // Match quality
  matchScore: number;
  matchMethod: 'visual' | 'text' | 'brand_category' | 'combined';
  matchReasons: string[];

  // Verification
  verification: VerificationState;

  // Affiliate
  affiliateUrl?: string;
  affiliateNetwork?: string;

  // Processing
  modelVersion: string;
  matchedAt: Date;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a new claim with auto source
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
 * Create evidence from a video frame
 */
export function createFrameEvidence(
  frameIndex: number,
  timestamp: number,
  contentId?: string,
  boundingBox?: BoundingBox
): Evidence {
  return {
    type: 'frame',
    contentId,
    frameIndex,
    timestamp,
    boundingBox,
    capturedAt: new Date(),
  };
}

/**
 * Create evidence from transcript
 */
export function createTranscriptEvidence(
  text: string,
  startTime: number,
  endTime: number,
  contentId?: string
): Evidence {
  return {
    type: 'transcript',
    contentId,
    timestamp: startTime,
    timestampEnd: endTime,
    transcriptSpan: text,
    capturedAt: new Date(),
  };
}

/**
 * Determine verification tier from confidence
 */
export function getVerificationTier(
  confidence: number,
  source: ClaimSource = 'auto'
): VerificationTier {
  if (source === 'brand_verified') return 'brand_verified';
  if (source === 'creator_confirmed') return 'creator_confirmed';
  if (source === 'disputed') return 'disputed';
  return confidence >= 85 ? 'auto_high' : 'auto';
}

/**
 * Confirm a claim (creator or brand verification)
 */
export function confirmClaim<T>(
  claim: Claim<T>,
  source: 'creator_confirmed' | 'brand_verified',
  verifiedBy: string
): Claim<T> {
  return {
    ...claim,
    source,
    verifiedAt: new Date(),
    verifiedBy,
    confidence: Math.min(claim.confidence + 10, 100),
    updatedAt: new Date(),
  };
}

/**
 * Correct a claim value
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
    confidence: 95,
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

/**
 * Convert legacy ProductData to ProductDetectionClaim
 */
export function convertToProductClaim(
  product: ProductData,
  frameIndices: number[],
  timestamps: number[],
  modelVersion: string,
  contentId?: string
): ProductDetectionClaim {
  const now = new Date();
  const confidence = Math.round(product.confidence * 100);

  // Create frame evidence for each frame the product appears in
  const frameEvidence: Evidence[] = frameIndices.map((frameIndex, i) =>
    createFrameEvidence(frameIndex, timestamps[i] || 0, contentId)
  );

  return {
    product,
    evidence: {
      frameIndices,
      timestamps,
    },
    claims: {
      name: createClaim(product.name, confidence, frameEvidence, modelVersion),
      category: createClaim(product.category, confidence, frameEvidence, modelVersion),
      subcategory: createClaim(product.subcategory, confidence, frameEvidence, modelVersion),
      colors: createClaim(product.colors, confidence, frameEvidence, modelVersion),
      brand: createClaim(product.brand, product.brand ? confidence : 30, frameEvidence, modelVersion),
      material: createClaim(product.material, product.material ? confidence - 10 : 30, frameEvidence, modelVersion),
      style: createClaim(product.style, product.style ? confidence - 10 : 30, frameEvidence, modelVersion),
      pattern: createClaim(product.pattern, product.pattern ? confidence - 10 : 30, frameEvidence, modelVersion),
      estimatedPrice: createClaim(product.estimatedPriceUSD, product.estimatedPriceUSD ? 50 : 20, frameEvidence, modelVersion),
    },
    verification: {
      tier: getVerificationTier(confidence),
      confidence,
    },
    detectionMethod: 'visual',
    modelVersion,
    extractedAt: now,
  };
}
