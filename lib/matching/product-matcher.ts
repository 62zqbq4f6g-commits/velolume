/**
 * Product Matcher v2.0
 *
 * Production pipeline for matching detected products to shopping results.
 * NOW WITH CATEGORY-SPECIFIC SCHEMAS for improved accuracy across product types.
 *
 * Supported Categories:
 * - Clothing (sweaters, tops, shorts, pants, dresses)
 * - Footwear (loafers, sneakers, boots, heels, sandals)
 * - Accessories (sunglasses, bags, scarves)
 * - Jewelry (earrings, necklaces, rings, bracelets)
 *
 * Pipeline:
 * 1. Multi-frame attribute extraction → Complete reference profile
 * 2. Google Shopping search → Candidate products
 * 3. Candidate attribute extraction → Structured comparison
 * 4. Fuzzy matching + deal-breaker logic → Scored rankings
 * 5. Visual tiebreaker (if top 2 within 5 pts) → Final ranking
 *
 * @module lib/matching/product-matcher
 */

import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ============================================================================
// TYPES
// ============================================================================

// Product category types for schema routing
export type ProductCategory = "Clothing" | "Footwear" | "Accessories" | "Jewelry" | "Tech" | "Beauty";

// Base interface for all product attributes
export interface BaseAttributes {
  primaryColor: string;
  colorFamily: string;
  material: string;
  confidence: number;
}

// Clothing attributes (original schema)
export interface ClothingAttributes extends BaseAttributes {
  colorTone: string;
  neckline: string;
  sleeveLength: string;
  bodyLength: string;
  fit: string;
  knitType: string;
  texture: string;
  hasButtons: boolean;
  hasZipper: boolean;
  hasPattern: boolean;
  patternType: string | null;
}

// Footwear attributes
export interface FootwearAttributes extends BaseAttributes {
  finish: string;           // matte, glossy/patent, suede, textured
  toeShape: string;         // round, pointed, square, almond
  heelHeight: string;       // flat, low, mid, high
  heelType: string;         // none, block, stiletto, wedge, platform
  closure: string;          // slip-on, lace-up, buckle, zipper, velcro
  upperMaterial: string;    // leather, suede, canvas, synthetic
  soleMaterial: string;     // rubber, leather, synthetic
  hasAccents: boolean;      // buckles, bows, studs
  accentType: string | null; // buckle, bow, tassel, chain, none
}

// Sunglasses attributes
export interface SunglassesAttributes extends BaseAttributes {
  frameColor: string;
  frameMaterial: string;    // plastic, metal, acetate, mixed
  framePattern: string;     // solid, tortoiseshell, gradient
  frameShape: string;       // oversized, round, square, cat-eye, aviator
  lensColor: string;        // black, brown, gray, blue, gradient, mirrored
  lensTint: string;         // dark, medium, light
  style: string;            // classic, trendy, sporty, vintage
}

// Earrings attributes
export interface EarringsAttributes extends BaseAttributes {
  metalColor: string;       // gold, silver, rose gold, bronze
  metalFinish: string;      // polished, matte, brushed, hammered
  earringType: string;      // hoop, stud, drop, dangle, huggie
  size: string;             // small, medium, large, oversized
  shape: string;            // round, oval, geometric, irregular
  hasGemstones: boolean;
  gemstoneType: string | null;
  style: string;            // minimalist, statement, classic, bohemian
}

// Union type for all attribute types
export type ProductAttributes = ClothingAttributes | FootwearAttributes | SunglassesAttributes | EarringsAttributes;

// Legacy alias for backwards compatibility
export interface LegacyProductAttributes {
  primaryColor: string;
  colorFamily: string;
  colorTone: string;
  neckline: string;
  sleeveLength: string;
  bodyLength: string;
  fit: string;
  knitType: string;
  material: string;
  texture: string;
  hasButtons: boolean;
  hasZipper: boolean;
  hasPattern: boolean;
  patternType: string | null;
  confidence: number;
}

export interface FusedAttribute {
  value: string | boolean;
  sourceFrame: number;
  confidence: number;
}

export interface FusedProfile {
  primaryColor: FusedAttribute;
  colorFamily: FusedAttribute;
  colorTone: FusedAttribute;
  neckline: FusedAttribute;
  sleeveLength: FusedAttribute;
  bodyLength: FusedAttribute;
  fit: FusedAttribute;
  knitType: FusedAttribute;
  material: FusedAttribute;
  texture: FusedAttribute;
  hasButtons: FusedAttribute;
  hasZipper: FusedAttribute;
  patternType: FusedAttribute;
  overallConfidence: number;
  completeness: number;
}

export interface ShoppingCandidate {
  title: string;
  source: string;
  link: string;
  price: string;
  thumbnail: string;
  attributes?: ProductAttributes;
}

export interface AttributeComparison {
  attribute: string;
  refValue: string;
  candValue: string;
  points: number;
  maxPoints: number;
  reasoning: string;
  isCritical: boolean;
}

// NEW v2.1: Verification tier for trust pyramid
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

export interface MatchResult {
  rank: number;
  title: string;
  source: string;
  link: string;
  price: string;
  thumbnail: string;
  score: number;
  rawScore: number;
  wasCapped: boolean;
  cappedReason: string | null;
  attributeBreakdown: AttributeComparison[];
  flags: string[];
  tiebreakerUsed: boolean;
  visualScore?: number;
  // NEW v2.1: Verification tier
  verification: VerificationState;
}

export interface MatchingOutput {
  productName: string;
  searchQuery: string;
  referenceProfile: FusedProfile;
  candidates: MatchResult[];
  topMatch: MatchResult | null;
  tiebreakerUsed: boolean;
  processingTime: number;
  framesAnalyzed: number;
  // NEW v2.1: Overall verification state
  verification?: VerificationState;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CRITICAL_ATTRIBUTES = ["neckline", "bodyLength", "sleeveLength"];
const SCORE_CAP_ON_CRITICAL_MISMATCH = 65;
const TIEBREAKER_THRESHOLD = 5; // Points difference to trigger visual tiebreaker
const TIEBREAKER_MIN_SCORE = 75; // Only run tiebreaker if top score is above this threshold

// NEW v2.1: Verification tier thresholds
const AUTO_HIGH_CONFIDENCE_THRESHOLD = 85;

// ============================================================================
// VERIFICATION HELPERS (NEW v2.1)
// ============================================================================

/**
 * Compute verification tier based on match score
 */
function computeVerificationTier(score: number): VerificationTier {
  if (score >= AUTO_HIGH_CONFIDENCE_THRESHOLD) return 'auto_high';
  return 'auto';
}

/**
 * Create a verification state from a match score
 */
function createVerificationState(score: number): VerificationState {
  return {
    tier: computeVerificationTier(score),
    confidence: score,
  };
}

/**
 * Confirm a match (creator or brand verification)
 */
export function confirmMatch(
  match: MatchResult,
  source: 'creator_confirmed' | 'brand_verified',
  verifiedBy: string
): MatchResult {
  return {
    ...match,
    verification: {
      tier: source,
      confidence: Math.min(match.score + 10, 100),
      verifiedAt: new Date(),
      verifiedBy,
    },
  };
}

/**
 * Dispute a match
 */
export function disputeMatch(
  match: MatchResult,
  reason: string,
  disputedBy: string
): MatchResult {
  return {
    ...match,
    verification: {
      tier: 'disputed',
      confidence: match.verification.confidence,
      verifiedAt: new Date(),
      verifiedBy: disputedBy,
      disputeReason: reason,
    },
  };
}

// Frame selection for different video lengths
const FRAME_SELECTION_STRATEGY = {
  short: [1, 3, 5, 7],      // < 10 seconds
  medium: [1, 4, 7, 10],    // 10-30 seconds
  long: [1, 5, 9, 12],      // > 30 seconds
};

// ============================================================================
// FUZZY MATCHING DEFINITIONS
// ============================================================================

const COLOR_FAMILIES: Record<string, string[]> = {
  green: ["olive", "olive green", "sage", "forest green", "army green", "khaki", "moss", "dark green", "hunter green"],
  blue: ["navy", "navy blue", "royal blue", "sky blue", "teal", "cobalt", "denim blue"],
  neutral: ["beige", "cream", "ivory", "tan", "taupe", "camel", "oatmeal", "sand"],
  brown: ["chocolate", "espresso", "chestnut", "cognac", "rust", "terracotta"],
  pink: ["blush", "rose", "coral", "salmon", "dusty pink", "hot pink"],
  red: ["burgundy", "wine", "maroon", "crimson", "scarlet"],
  purple: ["lavender", "lilac", "plum", "violet", "mauve"],
  black: ["charcoal", "jet black", "onyx"],
  white: ["off-white", "ivory", "snow", "cream white"],
  gray: ["grey", "silver", "slate", "charcoal gray", "heather"],
};

const KNIT_FAMILIES: Record<string, string[]> = {
  textured_chunky: ["chunky", "cable", "cable knit", "basketweave", "popcorn"],
  textured_fine: ["ribbed", "rib knit", "waffle", "pointelle", "thermal"],
  smooth: ["jersey", "smooth", "fine knit", "stockinette", "flat knit"],
};

const NECKLINE_GROUPS: Record<string, string[]> = {
  crew: ["crew", "crewneck", "crew neck", "round", "round neck"],
  vneck: ["v-neck", "v neck", "vneck"],
  mock: ["mock", "mock neck", "mockneck", "funnel", "funnel neck"],
  turtleneck: ["turtleneck", "turtle neck", "turtle", "rollneck"],
  offShoulder: ["off-shoulder", "off shoulder", "bardot"],
  scoop: ["scoop", "scoop neck"],
  boat: ["boat", "boat neck", "boatneck", "bateau"],
  collared: ["collared", "collar", "polo"],
};

const LENGTH_GROUPS: Record<string, string[]> = {
  crop: ["crop", "cropped", "short", "above waist"],
  regular: ["regular", "normal", "standard", "at waist", "hip length"],
  longline: ["long", "longline", "tunic", "below hip"],
};

const SLEEVE_GROUPS: Record<string, string[]> = {
  long: ["long", "full length", "full"],
  short: ["short", "cap", "cap sleeve"],
  threequarter: ["3/4", "three quarter", "3-quarter", "elbow"],
  sleeveless: ["sleeveless", "tank", "no sleeve"],
};

// ============================================================================
// OPENAI CLIENT
// ============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================================================
// ATTRIBUTE EXTRACTION - CATEGORY-SPECIFIC PROMPTS
// ============================================================================

// Clothing prompt (sweaters, tops, shorts, pants, dresses)
const CLOTHING_EXTRACTION_PROMPT = (purpose: string) => `You are a precise clothing attribute extractor.

CONTEXT: ${purpose}

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name (e.g., "olive green", "navy blue")
- colorFamily: Broad family (green, blue, red, neutral, etc.)
- colorTone: muted/earthy, bright/vivid, pastel, dark

**STYLE:**
- neckline: crew, mock, v-neck, turtleneck, scoop, boat, collared, off-shoulder, or "not_applicable"
- sleeveLength: long, short, 3/4, sleeveless, or "not_applicable"
- bodyLength: crop, regular, long, or "not_applicable"
- fit: fitted, relaxed, oversized, or "not_visible"

**MATERIAL/TEXTURE:**
- knitType: cable, ribbed, waffle, chunky, smooth, or "not_applicable"
- material: cotton, wool, denim, acrylic, cashmere, blend, or "unknown"
- texture: chunky/thick, medium, fine/thin

**DETAILS:**
- hasButtons: true/false
- hasZipper: true/false
- hasPattern: true/false
- patternType: solid, striped, colorblock, etc.

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON (no nested objects).`;

// Footwear prompt (loafers, sneakers, boots, heels, sandals)
const FOOTWEAR_EXTRACTION_PROMPT = (purpose: string) => `You are a precise footwear attribute extractor.

CONTEXT: ${purpose}

Extract these attributes. Use "not_visible" if cannot be determined.

**COLOR:**
- primaryColor: Exact color name
- colorFamily: Broad family
- finish: matte, glossy/patent, suede, textured

**STYLE:**
- toeShape: round, pointed, square, almond, or "not_visible"
- heelHeight: flat, low, mid, high
- heelType: none, block, stiletto, wedge, platform
- closure: slip-on, lace-up, buckle, zipper, velcro

**MATERIAL:**
- material: leather, suede, canvas, synthetic, fabric
- upperMaterial: same as material
- soleMaterial: rubber, leather, synthetic

**DETAILS:**
- hasAccents: true/false (buckles, bows, studs, tassels)
- accentType: buckle, bow, tassel, chain, or "none"

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON (no nested objects).`;

// Sunglasses prompt
const SUNGLASSES_EXTRACTION_PROMPT = (purpose: string) => `You are a precise eyewear attribute extractor.

CONTEXT: ${purpose}

Extract these attributes. Use "not_visible" if cannot be determined.

**FRAME:**
- primaryColor: Frame color (exact)
- colorFamily: Broad family
- frameColor: Same as primaryColor
- frameMaterial: plastic, metal, acetate, mixed
- framePattern: solid, tortoiseshell, gradient, patterned
- frameShape: oversized, round, square, cat-eye, aviator, rectangular, oval

**LENSES:**
- lensColor: black, brown, gray, blue, gradient, mirrored
- lensTint: dark, medium, light

**STYLE:**
- style: classic, trendy, sporty, vintage, luxury
- material: Same as frameMaterial

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON (no nested objects).`;

// Earrings prompt
const EARRINGS_EXTRACTION_PROMPT = (purpose: string) => `You are a precise jewelry attribute extractor.

CONTEXT: ${purpose}

Extract these attributes. Use "not_visible" if cannot be determined.

**MATERIAL:**
- primaryColor: Metal color (gold, silver, rose gold, bronze, copper)
- colorFamily: yellow/gold, silver/white, rose, bronze
- material: Same as metalColor description
- metalColor: gold, silver, rose gold, bronze
- metalFinish: polished, matte, brushed, hammered

**STYLE:**
- earringType: hoop, stud, drop, dangle, huggie, chandelier, threader
- size: small, medium, large, oversized
- shape: round, oval, geometric, irregular

**DETAILS:**
- hasGemstones: true/false
- gemstoneType: diamond, pearl, crystal, or "none"
- style: minimalist, statement, classic, bohemian, trendy

**CONFIDENCE:** (0.0-1.0)

Respond with flat JSON (no nested objects).`;

// Get the appropriate extraction prompt based on category
function getExtractionPrompt(category: ProductCategory, subcategory: string, purpose: string): string {
  switch (category) {
    case "Footwear":
      return FOOTWEAR_EXTRACTION_PROMPT(purpose);
    case "Accessories":
      if (subcategory.toLowerCase().includes("sunglass") || subcategory.toLowerCase().includes("eyewear")) {
        return SUNGLASSES_EXTRACTION_PROMPT(purpose);
      }
      // Default to clothing-like for bags, scarves
      return CLOTHING_EXTRACTION_PROMPT(purpose);
    case "Jewelry":
      if (subcategory.toLowerCase().includes("earring")) {
        return EARRINGS_EXTRACTION_PROMPT(purpose);
      }
      // Default to earrings schema for other jewelry
      return EARRINGS_EXTRACTION_PROMPT(purpose);
    case "Clothing":
    default:
      return CLOTHING_EXTRACTION_PROMPT(purpose);
  }
}

// Parse extraction response based on category
function parseExtractionResponse(parsed: any, category: ProductCategory, subcategory: string): ProductAttributes {
  switch (category) {
    case "Footwear":
      return {
        primaryColor: parsed.primaryColor || "unknown",
        colorFamily: parsed.colorFamily || "unknown",
        material: parsed.material || parsed.upperMaterial || "unknown",
        finish: parsed.finish || "unknown",
        toeShape: parsed.toeShape || "not_visible",
        heelHeight: parsed.heelHeight || "flat",
        heelType: parsed.heelType || "none",
        closure: parsed.closure || "slip-on",
        upperMaterial: parsed.upperMaterial || parsed.material || "unknown",
        soleMaterial: parsed.soleMaterial || "rubber",
        hasAccents: parsed.hasAccents || false,
        accentType: parsed.accentType || null,
        confidence: parsed.confidence || parsed.CONFIDENCE || 0.5,
      } as FootwearAttributes;

    case "Accessories":
      if (subcategory.toLowerCase().includes("sunglass") || subcategory.toLowerCase().includes("eyewear")) {
        return {
          primaryColor: parsed.primaryColor || parsed.frameColor || "unknown",
          colorFamily: parsed.colorFamily || "unknown",
          material: parsed.material || parsed.frameMaterial || "unknown",
          frameColor: parsed.frameColor || parsed.primaryColor || "unknown",
          frameMaterial: parsed.frameMaterial || parsed.material || "unknown",
          framePattern: parsed.framePattern || "solid",
          frameShape: parsed.frameShape || "not_visible",
          lensColor: parsed.lensColor || "not_visible",
          lensTint: parsed.lensTint || "medium",
          style: parsed.style || "trendy",
          confidence: parsed.confidence || parsed.CONFIDENCE || 0.5,
        } as SunglassesAttributes;
      }
      // Fall through to clothing for bags, scarves
      break;

    case "Jewelry":
      return {
        primaryColor: parsed.primaryColor || parsed.metalColor || "unknown",
        colorFamily: parsed.colorFamily || "unknown",
        material: parsed.material || parsed.metalColor || "unknown",
        metalColor: parsed.metalColor || parsed.primaryColor || "unknown",
        metalFinish: parsed.metalFinish || "polished",
        earringType: parsed.earringType || "not_visible",
        size: parsed.size || "medium",
        shape: parsed.shape || "not_visible",
        hasGemstones: parsed.hasGemstones || false,
        gemstoneType: parsed.gemstoneType || null,
        style: parsed.style || "minimalist",
        confidence: parsed.confidence || parsed.CONFIDENCE || 0.5,
      } as EarringsAttributes;
  }

  // Default: Clothing
  return {
    primaryColor: parsed.primaryColor || "unknown",
    colorFamily: parsed.colorFamily || "unknown",
    colorTone: parsed.colorTone || "unknown",
    neckline: parsed.neckline || "not_visible",
    sleeveLength: parsed.sleeveLength || "not_visible",
    bodyLength: parsed.bodyLength || "not_visible",
    fit: parsed.fit || "not_visible",
    knitType: parsed.knitType || "not_visible",
    material: parsed.material || "unknown",
    texture: parsed.texture || "not_visible",
    hasButtons: parsed.hasButtons || false,
    hasZipper: parsed.hasZipper || false,
    hasPattern: parsed.hasPattern || false,
    patternType: parsed.patternType || "solid",
    confidence: parsed.confidence || parsed.CONFIDENCE || 0.5,
  } as ClothingAttributes;
}

async function extractAttributesFromImage(
  imageBase64: string,
  category: string,
  purpose: string,
  subcategory: string = ""
): Promise<ProductAttributes | null> {
  const openai = getOpenAI();
  const productCategory = category as ProductCategory;
  const prompt = getExtractionPrompt(productCategory, subcategory, purpose);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
      max_tokens: 600,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return parseExtractionResponse(parsed, productCategory, subcategory);
  } catch (error) {
    console.error("[ProductMatcher] Attribute extraction error:", error);
    return null;
  }
}

// ============================================================================
// MULTI-FRAME FUSION
// ============================================================================

interface FrameExtraction {
  frameIndex: number;
  attributes: ProductAttributes;
}

async function extractFromMultipleFrames(
  framesDir: string,
  frameIndices: number[],
  category: string,
  subcategory: string = ""
): Promise<FrameExtraction[]> {
  const extractions: FrameExtraction[] = [];

  for (const index of frameIndices) {
    const framePath = join(framesDir, `frame-${String(index).padStart(3, "0")}.jpg`);

    if (!existsSync(framePath)) {
      continue;
    }

    const buffer = readFileSync(framePath);
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    const purpose = `Frame ${index} of video - extracting ${category}/${subcategory || "generic"} attributes`;
    const attributes = await extractAttributesFromImage(base64, category, purpose, subcategory);

    if (attributes) {
      extractions.push({ frameIndex: index, attributes });
    }
  }

  return extractions;
}

function fuseFrameExtractions(extractions: FrameExtraction[]): FusedProfile {
  // Use string to allow any attribute key since ProductAttributes is a union
  const fuse = (attrName: string): FusedAttribute => {
    const values: Array<{ value: any; frame: number; confidence: number }> = [];

    for (const ext of extractions) {
      const val = (ext.attributes as Record<string, any>)[attrName];
      if (val !== "not_visible" && val !== "unknown" && val !== undefined && val !== null) {
        values.push({
          value: val,
          frame: ext.frameIndex,
          confidence: ext.attributes.confidence,
        });
      }
    }

    if (values.length === 0) {
      return { value: "unknown", sourceFrame: -1, confidence: 0 };
    }

    values.sort((a, b) => b.confidence - a.confidence);
    return {
      value: values[0].value,
      sourceFrame: values[0].frame,
      confidence: values[0].confidence,
    };
  };

  const profile: FusedProfile = {
    primaryColor: fuse("primaryColor"),
    colorFamily: fuse("colorFamily"),
    colorTone: fuse("colorTone"),
    neckline: fuse("neckline"),
    sleeveLength: fuse("sleeveLength"),
    bodyLength: fuse("bodyLength"),
    fit: fuse("fit"),
    knitType: fuse("knitType"),
    material: fuse("material"),
    texture: fuse("texture"),
    hasButtons: fuse("hasButtons"),
    hasZipper: fuse("hasZipper"),
    patternType: fuse("patternType"),
    overallConfidence: 0,
    completeness: 0,
  };

  // Calculate metrics
  const criticalAttrs = [
    profile.primaryColor, profile.neckline, profile.sleeveLength,
    profile.bodyLength, profile.knitType,
  ];
  const known = criticalAttrs.filter(a => a.value !== "unknown" && a.sourceFrame !== -1);
  profile.completeness = (known.length / criticalAttrs.length) * 100;
  profile.overallConfidence = known.length > 0
    ? known.reduce((sum, a) => sum + a.confidence, 0) / known.length
    : 0;

  return profile;
}

// ============================================================================
// FUZZY MATCHING FUNCTIONS
// ============================================================================

function fuzzyColorMatch(ref: string, cand: string): { similarity: number; reasoning: string } {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  if (refLower === candLower) {
    return { similarity: 1.0, reasoning: "Exact color match" };
  }
  if (refLower.includes(candLower) || candLower.includes(refLower)) {
    return { similarity: 0.9, reasoning: "Color shade variation (90%)" };
  }

  let refFamily: string | null = null;
  let candFamily: string | null = null;
  for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
    if (colors.some(c => refLower.includes(c) || c.includes(refLower))) refFamily = family;
    if (colors.some(c => candLower.includes(c) || c.includes(candLower))) candFamily = family;
  }

  if (refFamily && candFamily && refFamily === candFamily) {
    return { similarity: 0.7, reasoning: `Same color family: ${refFamily} (70%)` };
  }
  return { similarity: 0, reasoning: "Different color families" };
}

function fuzzyKnitMatch(ref: string, cand: string): { similarity: number; reasoning: string } {
  const refLower = ref.toLowerCase().trim();
  const candLower = cand.toLowerCase().trim();

  if (refLower === candLower) {
    return { similarity: 1.0, reasoning: "Exact knit match" };
  }

  let refFamily: string | null = null;
  let candFamily: string | null = null;
  for (const [family, types] of Object.entries(KNIT_FAMILIES)) {
    if (types.some(t => refLower.includes(t) || t.includes(refLower))) refFamily = family;
    if (types.some(t => candLower.includes(t) || t.includes(candLower))) candFamily = family;
  }

  if (refFamily && candFamily && refFamily === candFamily) {
    return { similarity: 0.7, reasoning: `Same knit family: ${refFamily} (70%)` };
  }
  return { similarity: 0, reasoning: "Different knit families" };
}

function normalizeAttribute(value: string, groups: Record<string, string[]>): string | null {
  const valueLower = value.toLowerCase().trim();
  for (const [normalized, variants] of Object.entries(groups)) {
    if (variants.some(v => valueLower.includes(v) || v.includes(valueLower))) {
      return normalized;
    }
  }
  return null;
}

function checkCriticalMatch(
  attrName: string,
  refValue: string,
  candValue: string,
  groups: Record<string, string[]>
): { matches: boolean; mismatchReason: string | null } {
  const refNorm = normalizeAttribute(refValue, groups);
  const candNorm = normalizeAttribute(candValue, groups);

  const matches = refNorm !== null && candNorm !== null && refNorm === candNorm;
  const mismatchReason = matches ? null : `${attrName}: ${refNorm || refValue} ≠ ${candNorm || candValue}`;

  return { matches, mismatchReason };
}

// ============================================================================
// SCORING WITH DEAL-BREAKERS - CATEGORY-SPECIFIC
// ============================================================================

// Generic attributes that exist across all fused profiles
interface GenericFusedProfile {
  primaryColor: FusedAttribute;
  colorFamily: FusedAttribute;
  [key: string]: FusedAttribute;
}

// Footwear-specific scoring
function computeFootwearMatchScore(
  refProfile: GenericFusedProfile,
  candAttrs: FootwearAttributes,
  candidate: ShoppingCandidate
): MatchResult {
  const breakdown: AttributeComparison[] = [];
  const flags: string[] = [];
  let rawScore = 0;
  const criticalMismatches: string[] = [];

  // Color (30 points) - FUZZY
  const colorMatch = fuzzyColorMatch(String(refProfile.primaryColor.value), candAttrs.primaryColor);
  const colorPoints = Math.round(30 * colorMatch.similarity);
  rawScore += colorPoints;
  breakdown.push({
    attribute: "Primary Color",
    refValue: String(refProfile.primaryColor.value),
    candValue: candAttrs.primaryColor,
    points: colorPoints,
    maxPoints: 30,
    reasoning: colorMatch.reasoning,
    isCritical: false,
  });

  // Finish (15 points) - glossy vs matte is important
  const refFinish = refProfile.finish?.value || "unknown";
  const finishMatch = String(refFinish).toLowerCase() === candAttrs.finish?.toLowerCase();
  const finishPoints = finishMatch ? 15 : (String(refFinish).toLowerCase().includes("gloss") && candAttrs.finish?.toLowerCase().includes("gloss") ? 10 : 0);
  rawScore += finishPoints;
  breakdown.push({
    attribute: "Finish",
    refValue: String(refFinish),
    candValue: candAttrs.finish || "unknown",
    points: finishPoints,
    maxPoints: 15,
    reasoning: finishMatch ? "Match" : "Different finish",
    isCritical: false,
  });

  // Toe Shape (15 points) - CRITICAL
  const refToeShape = refProfile.toeShape?.value || "unknown";
  const toeMatch = String(refToeShape).toLowerCase() === candAttrs.toeShape?.toLowerCase();
  const toePoints = toeMatch ? 15 : 0;
  rawScore += toePoints;
  if (!toeMatch && String(refToeShape) !== "unknown" && candAttrs.toeShape !== "not_visible") {
    criticalMismatches.push(`Toe shape: ${refToeShape} ≠ ${candAttrs.toeShape}`);
    flags.push("Different toe shape");
  }
  breakdown.push({
    attribute: "Toe Shape",
    refValue: String(refToeShape),
    candValue: candAttrs.toeShape || "unknown",
    points: toePoints,
    maxPoints: 15,
    reasoning: toeMatch ? "Match" : "Different toe shape",
    isCritical: true,
  });

  // Heel Height (10 points) - CRITICAL
  const refHeelHeight = refProfile.heelHeight?.value || "flat";
  const heelHeightMatch = String(refHeelHeight).toLowerCase() === candAttrs.heelHeight?.toLowerCase();
  const heelHeightPoints = heelHeightMatch ? 10 : 0;
  rawScore += heelHeightPoints;
  if (!heelHeightMatch && String(refHeelHeight) !== "unknown") {
    criticalMismatches.push(`Heel height: ${refHeelHeight} ≠ ${candAttrs.heelHeight}`);
    flags.push("Different heel height");
  }
  breakdown.push({
    attribute: "Heel Height",
    refValue: String(refHeelHeight),
    candValue: candAttrs.heelHeight || "flat",
    points: heelHeightPoints,
    maxPoints: 10,
    reasoning: heelHeightMatch ? "Match" : "Different heel height",
    isCritical: true,
  });

  // Closure (10 points) - CRITICAL
  const refClosure = refProfile.closure?.value || "slip-on";
  const closureMatch = String(refClosure).toLowerCase() === candAttrs.closure?.toLowerCase();
  const closurePoints = closureMatch ? 10 : 0;
  rawScore += closurePoints;
  if (!closureMatch && String(refClosure) !== "unknown") {
    criticalMismatches.push(`Closure: ${refClosure} ≠ ${candAttrs.closure}`);
    flags.push("Different closure type");
  }
  breakdown.push({
    attribute: "Closure",
    refValue: String(refClosure),
    candValue: candAttrs.closure || "slip-on",
    points: closurePoints,
    maxPoints: 10,
    reasoning: closureMatch ? "Match" : "Different closure",
    isCritical: true,
  });

  // Material (10 points)
  const refMaterial = refProfile.material?.value || refProfile.upperMaterial?.value || "unknown";
  const materialMatch = String(refMaterial).toLowerCase() === candAttrs.upperMaterial?.toLowerCase();
  const materialPoints = materialMatch ? 10 : (String(refMaterial).toLowerCase().includes("leather") && candAttrs.upperMaterial?.toLowerCase().includes("leather") ? 7 : 0);
  rawScore += materialPoints;
  breakdown.push({
    attribute: "Material",
    refValue: String(refMaterial),
    candValue: candAttrs.upperMaterial || "unknown",
    points: materialPoints,
    maxPoints: 10,
    reasoning: materialMatch ? "Match" : "Different material",
    isCritical: false,
  });

  // Accents (10 points)
  const refHasAccents = refProfile.hasAccents?.value || false;
  const accentsMatch = refHasAccents === candAttrs.hasAccents;
  const accentPoints = accentsMatch ? 10 : 0;
  rawScore += accentPoints;
  breakdown.push({
    attribute: "Accents",
    refValue: String(refHasAccents),
    candValue: String(candAttrs.hasAccents || false),
    points: accentPoints,
    maxPoints: 10,
    reasoning: accentsMatch ? "Match" : "Different accents",
    isCritical: false,
  });

  // Apply deal-breaker cap
  let finalScore = rawScore;
  let wasCapped = false;
  let cappedReason: string | null = null;

  if (criticalMismatches.length > 0 && rawScore > SCORE_CAP_ON_CRITICAL_MISMATCH) {
    finalScore = SCORE_CAP_ON_CRITICAL_MISMATCH;
    wasCapped = true;
    cappedReason = `Capped at ${SCORE_CAP_ON_CRITICAL_MISMATCH}: ${criticalMismatches.join(", ")}`;
  }

  return {
    rank: 0,
    title: candidate.title,
    source: candidate.source,
    link: candidate.link,
    price: candidate.price,
    thumbnail: candidate.thumbnail,
    score: finalScore,
    rawScore,
    wasCapped,
    cappedReason,
    attributeBreakdown: breakdown,
    flags,
    tiebreakerUsed: false,
    verification: createVerificationState(finalScore),
  };
}

// Sunglasses-specific scoring
function computeSunglassesMatchScore(
  refProfile: GenericFusedProfile,
  candAttrs: SunglassesAttributes,
  candidate: ShoppingCandidate
): MatchResult {
  const breakdown: AttributeComparison[] = [];
  const flags: string[] = [];
  let rawScore = 0;
  const criticalMismatches: string[] = [];

  // Frame Color (25 points)
  const refColor = refProfile.primaryColor?.value || refProfile.frameColor?.value || "unknown";
  const colorMatch = fuzzyColorMatch(String(refColor), candAttrs.frameColor || candAttrs.primaryColor);
  const colorPoints = Math.round(25 * colorMatch.similarity);
  rawScore += colorPoints;
  breakdown.push({
    attribute: "Frame Color",
    refValue: String(refColor),
    candValue: candAttrs.frameColor || candAttrs.primaryColor,
    points: colorPoints,
    maxPoints: 25,
    reasoning: colorMatch.reasoning,
    isCritical: false,
  });

  // Frame Shape (25 points) - CRITICAL
  const refShape = refProfile.frameShape?.value || "unknown";
  const shapeMatch = String(refShape).toLowerCase() === candAttrs.frameShape?.toLowerCase();
  const shapePoints = shapeMatch ? 25 : 0;
  rawScore += shapePoints;
  if (!shapeMatch && String(refShape) !== "unknown" && candAttrs.frameShape !== "not_visible") {
    criticalMismatches.push(`Frame shape: ${refShape} ≠ ${candAttrs.frameShape}`);
    flags.push("Different frame shape");
  }
  breakdown.push({
    attribute: "Frame Shape",
    refValue: String(refShape),
    candValue: candAttrs.frameShape || "unknown",
    points: shapePoints,
    maxPoints: 25,
    reasoning: shapeMatch ? "Match" : "CRITICAL: Different shape",
    isCritical: true,
  });

  // Frame Pattern (15 points) - tortoiseshell is distinct
  const refPattern = refProfile.framePattern?.value || "solid";
  const patternMatch = String(refPattern).toLowerCase() === candAttrs.framePattern?.toLowerCase();
  const patternPoints = patternMatch ? 15 : 0;
  rawScore += patternPoints;
  if (!patternMatch && String(refPattern).toLowerCase().includes("tortoise") !== candAttrs.framePattern?.toLowerCase().includes("tortoise")) {
    criticalMismatches.push(`Frame pattern: ${refPattern} ≠ ${candAttrs.framePattern}`);
    flags.push("Different frame pattern");
  }
  breakdown.push({
    attribute: "Frame Pattern",
    refValue: String(refPattern),
    candValue: candAttrs.framePattern || "solid",
    points: patternPoints,
    maxPoints: 15,
    reasoning: patternMatch ? "Match" : "Different pattern",
    isCritical: true,
  });

  // Frame Material (10 points)
  const refMaterial = refProfile.frameMaterial?.value || refProfile.material?.value || "unknown";
  const materialMatch = String(refMaterial).toLowerCase() === candAttrs.frameMaterial?.toLowerCase();
  const materialPoints = materialMatch ? 10 : 0;
  rawScore += materialPoints;
  breakdown.push({
    attribute: "Frame Material",
    refValue: String(refMaterial),
    candValue: candAttrs.frameMaterial || "unknown",
    points: materialPoints,
    maxPoints: 10,
    reasoning: materialMatch ? "Match" : "Different material",
    isCritical: false,
  });

  // Lens Color (15 points)
  const refLensColor = refProfile.lensColor?.value || "unknown";
  const lensColorMatch = String(refLensColor).toLowerCase() === candAttrs.lensColor?.toLowerCase();
  const lensColorPoints = lensColorMatch ? 15 : 0;
  rawScore += lensColorPoints;
  breakdown.push({
    attribute: "Lens Color",
    refValue: String(refLensColor),
    candValue: candAttrs.lensColor || "unknown",
    points: lensColorPoints,
    maxPoints: 15,
    reasoning: lensColorMatch ? "Match" : "Different lens color",
    isCritical: false,
  });

  // Style (10 points)
  const refStyle = refProfile.style?.value || "trendy";
  const styleMatch = String(refStyle).toLowerCase() === candAttrs.style?.toLowerCase();
  const stylePoints = styleMatch ? 10 : 0;
  rawScore += stylePoints;
  breakdown.push({
    attribute: "Style",
    refValue: String(refStyle),
    candValue: candAttrs.style || "unknown",
    points: stylePoints,
    maxPoints: 10,
    reasoning: styleMatch ? "Match" : "Different style",
    isCritical: false,
  });

  // Apply deal-breaker cap
  let finalScore = rawScore;
  let wasCapped = false;
  let cappedReason: string | null = null;

  if (criticalMismatches.length > 0 && rawScore > SCORE_CAP_ON_CRITICAL_MISMATCH) {
    finalScore = SCORE_CAP_ON_CRITICAL_MISMATCH;
    wasCapped = true;
    cappedReason = `Capped at ${SCORE_CAP_ON_CRITICAL_MISMATCH}: ${criticalMismatches.join(", ")}`;
  }

  return {
    rank: 0,
    title: candidate.title,
    source: candidate.source,
    link: candidate.link,
    price: candidate.price,
    thumbnail: candidate.thumbnail,
    score: finalScore,
    rawScore,
    wasCapped,
    cappedReason,
    attributeBreakdown: breakdown,
    flags,
    tiebreakerUsed: false,
    verification: createVerificationState(finalScore),
  };
}

// Earrings-specific scoring
function computeEarringsMatchScore(
  refProfile: GenericFusedProfile,
  candAttrs: EarringsAttributes,
  candidate: ShoppingCandidate
): MatchResult {
  const breakdown: AttributeComparison[] = [];
  const flags: string[] = [];
  let rawScore = 0;
  const criticalMismatches: string[] = [];

  // Metal Color (30 points) - CRITICAL for jewelry
  const refColor = refProfile.primaryColor?.value || refProfile.metalColor?.value || "unknown";
  const colorMatch = String(refColor).toLowerCase() === candAttrs.metalColor?.toLowerCase();
  const colorPoints = colorMatch ? 30 : 0;
  rawScore += colorPoints;
  if (!colorMatch && String(refColor) !== "unknown") {
    criticalMismatches.push(`Metal color: ${refColor} ≠ ${candAttrs.metalColor}`);
    flags.push("Different metal color");
  }
  breakdown.push({
    attribute: "Metal Color",
    refValue: String(refColor),
    candValue: candAttrs.metalColor || "unknown",
    points: colorPoints,
    maxPoints: 30,
    reasoning: colorMatch ? "Match" : "CRITICAL: Different metal color",
    isCritical: true,
  });

  // Earring Type (30 points) - CRITICAL
  const refType = refProfile.earringType?.value || "unknown";
  const typeMatch = String(refType).toLowerCase() === candAttrs.earringType?.toLowerCase();
  const typePoints = typeMatch ? 30 : 0;
  rawScore += typePoints;
  if (!typeMatch && String(refType) !== "unknown") {
    criticalMismatches.push(`Earring type: ${refType} ≠ ${candAttrs.earringType}`);
    flags.push("Different earring type");
  }
  breakdown.push({
    attribute: "Earring Type",
    refValue: String(refType),
    candValue: candAttrs.earringType || "unknown",
    points: typePoints,
    maxPoints: 30,
    reasoning: typeMatch ? "Match" : "CRITICAL: Different earring type",
    isCritical: true,
  });

  // Size (15 points)
  const refSize = refProfile.size?.value || "medium";
  const sizeMatch = String(refSize).toLowerCase() === candAttrs.size?.toLowerCase();
  const sizePoints = sizeMatch ? 15 : 0;
  rawScore += sizePoints;
  breakdown.push({
    attribute: "Size",
    refValue: String(refSize),
    candValue: candAttrs.size || "medium",
    points: sizePoints,
    maxPoints: 15,
    reasoning: sizeMatch ? "Match" : "Different size",
    isCritical: false,
  });

  // Shape (10 points)
  const refShape = refProfile.shape?.value || "round";
  const shapeMatch = String(refShape).toLowerCase() === candAttrs.shape?.toLowerCase();
  const shapePoints = shapeMatch ? 10 : 0;
  rawScore += shapePoints;
  breakdown.push({
    attribute: "Shape",
    refValue: String(refShape),
    candValue: candAttrs.shape || "unknown",
    points: shapePoints,
    maxPoints: 10,
    reasoning: shapeMatch ? "Match" : "Different shape",
    isCritical: false,
  });

  // Metal Finish (10 points)
  const refFinish = refProfile.metalFinish?.value || "polished";
  const finishMatch = String(refFinish).toLowerCase() === candAttrs.metalFinish?.toLowerCase();
  const finishPoints = finishMatch ? 10 : 0;
  rawScore += finishPoints;
  breakdown.push({
    attribute: "Metal Finish",
    refValue: String(refFinish),
    candValue: candAttrs.metalFinish || "polished",
    points: finishPoints,
    maxPoints: 10,
    reasoning: finishMatch ? "Match" : "Different finish",
    isCritical: false,
  });

  // Style (5 points)
  const refStyle = refProfile.style?.value || "minimalist";
  const styleMatch = String(refStyle).toLowerCase() === candAttrs.style?.toLowerCase();
  const stylePoints = styleMatch ? 5 : 0;
  rawScore += stylePoints;
  breakdown.push({
    attribute: "Style",
    refValue: String(refStyle),
    candValue: candAttrs.style || "unknown",
    points: stylePoints,
    maxPoints: 5,
    reasoning: styleMatch ? "Match" : "Different style",
    isCritical: false,
  });

  // Apply deal-breaker cap
  let finalScore = rawScore;
  let wasCapped = false;
  let cappedReason: string | null = null;

  if (criticalMismatches.length > 0 && rawScore > SCORE_CAP_ON_CRITICAL_MISMATCH) {
    finalScore = SCORE_CAP_ON_CRITICAL_MISMATCH;
    wasCapped = true;
    cappedReason = `Capped at ${SCORE_CAP_ON_CRITICAL_MISMATCH}: ${criticalMismatches.join(", ")}`;
  }

  return {
    rank: 0,
    title: candidate.title,
    source: candidate.source,
    link: candidate.link,
    price: candidate.price,
    thumbnail: candidate.thumbnail,
    score: finalScore,
    rawScore,
    wasCapped,
    cappedReason,
    attributeBreakdown: breakdown,
    flags,
    tiebreakerUsed: false,
    verification: createVerificationState(finalScore),
  };
}

// Clothing scoring (original function, renamed for clarity)
function computeClothingMatchScore(
  refProfile: FusedProfile,
  candAttrs: ClothingAttributes,
  candidate: ShoppingCandidate
): MatchResult {
  const breakdown: AttributeComparison[] = [];
  const flags: string[] = [];
  let rawScore = 0;

  // Check critical attributes
  const criticalMismatches: string[] = [];

  const necklineCheck = checkCriticalMatch(
    "Neckline",
    String(refProfile.neckline.value),
    candAttrs.neckline,
    NECKLINE_GROUPS
  );
  if (!necklineCheck.matches && necklineCheck.mismatchReason) {
    criticalMismatches.push(necklineCheck.mismatchReason);
    flags.push("Similar style but different neckline");
  }

  const lengthCheck = checkCriticalMatch(
    "Length",
    String(refProfile.bodyLength.value),
    candAttrs.bodyLength,
    LENGTH_GROUPS
  );
  if (!lengthCheck.matches && lengthCheck.mismatchReason) {
    criticalMismatches.push(lengthCheck.mismatchReason);
    flags.push("Similar style but different length");
  }

  const sleeveCheck = checkCriticalMatch(
    "Sleeves",
    String(refProfile.sleeveLength.value),
    candAttrs.sleeveLength,
    SLEEVE_GROUPS
  );
  if (!sleeveCheck.matches && sleeveCheck.mismatchReason) {
    criticalMismatches.push(sleeveCheck.mismatchReason);
    flags.push("Similar style but different sleeves");
  }

  // Color (40 points) - FUZZY
  const colorMatch = fuzzyColorMatch(String(refProfile.primaryColor.value), candAttrs.primaryColor);
  const colorPoints = Math.round(25 * colorMatch.similarity);
  rawScore += colorPoints;
  breakdown.push({
    attribute: "Primary Color",
    refValue: String(refProfile.primaryColor.value),
    candValue: candAttrs.primaryColor,
    points: colorPoints,
    maxPoints: 25,
    reasoning: colorMatch.reasoning,
    isCritical: false,
  });

  // Tone (15 points)
  const toneMatch = String(refProfile.colorTone.value).toLowerCase() === candAttrs.colorTone.toLowerCase();
  const tonePoints = toneMatch ? 15 : 0;
  rawScore += tonePoints;
  breakdown.push({
    attribute: "Color Tone",
    refValue: String(refProfile.colorTone.value),
    candValue: candAttrs.colorTone,
    points: tonePoints,
    maxPoints: 15,
    reasoning: toneMatch ? "Exact match" : "Different tone",
    isCritical: false,
  });

  // Neckline (10 points) - CRITICAL
  const neckPoints = necklineCheck.matches ? 10 : 0;
  rawScore += neckPoints;
  breakdown.push({
    attribute: "Neckline",
    refValue: String(refProfile.neckline.value),
    candValue: candAttrs.neckline,
    points: neckPoints,
    maxPoints: 10,
    reasoning: necklineCheck.matches ? "Match" : `CRITICAL: ${necklineCheck.mismatchReason}`,
    isCritical: true,
  });

  // Sleeves (8 points) - CRITICAL
  const sleevePoints = sleeveCheck.matches ? 8 : 0;
  rawScore += sleevePoints;
  breakdown.push({
    attribute: "Sleeves",
    refValue: String(refProfile.sleeveLength.value),
    candValue: candAttrs.sleeveLength,
    points: sleevePoints,
    maxPoints: 8,
    reasoning: sleeveCheck.matches ? "Match" : `CRITICAL: ${sleeveCheck.mismatchReason}`,
    isCritical: true,
  });

  // Length (8 points) - CRITICAL
  const lengthPoints = lengthCheck.matches ? 8 : 0;
  rawScore += lengthPoints;
  breakdown.push({
    attribute: "Length",
    refValue: String(refProfile.bodyLength.value),
    candValue: candAttrs.bodyLength,
    points: lengthPoints,
    maxPoints: 8,
    reasoning: lengthCheck.matches ? "Match" : `CRITICAL: ${lengthCheck.mismatchReason}`,
    isCritical: true,
  });

  // Fit (4 points)
  const fitMatch = String(refProfile.fit.value).toLowerCase() === candAttrs.fit.toLowerCase();
  const fitPoints = fitMatch ? 4 : 0;
  rawScore += fitPoints;
  breakdown.push({
    attribute: "Fit",
    refValue: String(refProfile.fit.value),
    candValue: candAttrs.fit,
    points: fitPoints,
    maxPoints: 4,
    reasoning: fitMatch ? "Match" : "Different fit",
    isCritical: false,
  });

  // Knit type (12 points) - FUZZY
  const knitMatch = fuzzyKnitMatch(String(refProfile.knitType.value), candAttrs.knitType);
  const knitPoints = Math.round(12 * knitMatch.similarity);
  rawScore += knitPoints;
  breakdown.push({
    attribute: "Knit Type",
    refValue: String(refProfile.knitType.value),
    candValue: candAttrs.knitType,
    points: knitPoints,
    maxPoints: 12,
    reasoning: knitMatch.reasoning,
    isCritical: false,
  });

  // Texture (8 points)
  const textureMatch = String(refProfile.texture.value).toLowerCase() === candAttrs.texture.toLowerCase();
  const texturePoints = textureMatch ? 8 : 4;
  rawScore += texturePoints;
  breakdown.push({
    attribute: "Texture",
    refValue: String(refProfile.texture.value),
    candValue: candAttrs.texture,
    points: texturePoints,
    maxPoints: 8,
    reasoning: textureMatch ? "Exact match" : "Partial credit",
    isCritical: false,
  });

  // Closures (5 points)
  const closuresMatch = refProfile.hasButtons.value === candAttrs.hasButtons &&
                        refProfile.hasZipper.value === candAttrs.hasZipper;
  const closurePoints = closuresMatch ? 5 : 0;
  rawScore += closurePoints;
  breakdown.push({
    attribute: "Closures",
    refValue: `btn:${refProfile.hasButtons.value}`,
    candValue: `btn:${candAttrs.hasButtons}`,
    points: closurePoints,
    maxPoints: 5,
    reasoning: closuresMatch ? "Match" : "Different closures",
    isCritical: false,
  });

  // Pattern (5 points)
  const patternMatch = String(refProfile.patternType.value || "solid") === (candAttrs.patternType || "solid");
  const patternPoints = patternMatch ? 5 : 0;
  rawScore += patternPoints;
  breakdown.push({
    attribute: "Pattern",
    refValue: String(refProfile.patternType.value || "solid"),
    candValue: candAttrs.patternType || "solid",
    points: patternPoints,
    maxPoints: 5,
    reasoning: patternMatch ? "Match" : "Different pattern",
    isCritical: false,
  });

  // Apply deal-breaker cap
  let finalScore = rawScore;
  let wasCapped = false;
  let cappedReason: string | null = null;

  if (criticalMismatches.length > 0 && rawScore > SCORE_CAP_ON_CRITICAL_MISMATCH) {
    finalScore = SCORE_CAP_ON_CRITICAL_MISMATCH;
    wasCapped = true;
    cappedReason = `Capped at ${SCORE_CAP_ON_CRITICAL_MISMATCH}: ${criticalMismatches.join(", ")}`;
  }

  return {
    rank: 0, // Set later
    title: candidate.title,
    source: candidate.source,
    link: candidate.link,
    price: candidate.price,
    thumbnail: candidate.thumbnail,
    score: finalScore,
    rawScore,
    wasCapped,
    cappedReason,
    attributeBreakdown: breakdown,
    flags,
    tiebreakerUsed: false,
    verification: createVerificationState(finalScore),
  };
}

// Scoring router - selects the right scoring function based on category
function computeMatchScore(
  refProfile: FusedProfile | GenericFusedProfile,
  candAttrs: ProductAttributes,
  candidate: ShoppingCandidate,
  category: ProductCategory = "Clothing",
  subcategory: string = ""
): MatchResult {
  switch (category) {
    case "Footwear":
      return computeFootwearMatchScore(refProfile as GenericFusedProfile, candAttrs as FootwearAttributes, candidate);
    case "Accessories":
      if (subcategory.toLowerCase().includes("sunglass") || subcategory.toLowerCase().includes("eyewear")) {
        return computeSunglassesMatchScore(refProfile as GenericFusedProfile, candAttrs as SunglassesAttributes, candidate);
      }
      // Fall through to clothing for bags, scarves
      return computeClothingMatchScore(refProfile as FusedProfile, candAttrs as ClothingAttributes, candidate);
    case "Jewelry":
      return computeEarringsMatchScore(refProfile as GenericFusedProfile, candAttrs as EarringsAttributes, candidate);
    case "Clothing":
    default:
      return computeClothingMatchScore(refProfile as FusedProfile, candAttrs as ClothingAttributes, candidate);
  }
}

// ============================================================================
// VISUAL TIEBREAKER
// ============================================================================

async function runVisualTiebreaker(
  referenceImageBase64: string,
  candidate1: MatchResult,
  candidate1ImageBase64: string,
  candidate2: MatchResult,
  candidate2ImageBase64: string
): Promise<{ winner: MatchResult; loser: MatchResult; visualScores: [number, number] }> {
  const openai = getOpenAI();

  const prompt = `You are comparing shopping results to a product from a creator's video.

Image 1: Reference product from video
Image 2: Shopping candidate A - "${candidate1.title}"
Image 3: Shopping candidate B - "${candidate2.title}"

Both candidates have similar attribute scores. Your job is to break the tie using visual similarity.

For EACH candidate, score 0-100 based on:
- Does it LOOK like the same item?
- Color accuracy
- Style accuracy
- Overall visual match

Be strict. A fan should believe this is the same or nearly identical item.

Respond with JSON:
{
  "candidateA": {
    "visualScore": 75,
    "reasoning": "Color matches but neckline looks different"
  },
  "candidateB": {
    "visualScore": 82,
    "reasoning": "Very close visual match, similar texture"
  },
  "winner": "A" or "B"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: referenceImageBase64, detail: "high" } },
            { type: "image_url", image_url: { url: candidate1ImageBase64, detail: "low" } },
            { type: "image_url", image_url: { url: candidate2ImageBase64, detail: "low" } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    const scoreA = parsed.candidateA?.visualScore || 50;
    const scoreB = parsed.candidateB?.visualScore || 50;

    candidate1.visualScore = scoreA;
    candidate2.visualScore = scoreB;
    candidate1.tiebreakerUsed = true;
    candidate2.tiebreakerUsed = true;

    if (parsed.winner === "A" || scoreA > scoreB) {
      return { winner: candidate1, loser: candidate2, visualScores: [scoreA, scoreB] };
    } else {
      return { winner: candidate2, loser: candidate1, visualScores: [scoreA, scoreB] };
    }
  } catch (error) {
    console.error("[ProductMatcher] Visual tiebreaker error:", error);
    // Fall back to original order
    return { winner: candidate1, loser: candidate2, visualScores: [50, 50] };
  }
}

// ============================================================================
// GOOGLE SHOPPING SEARCH
// ============================================================================

async function searchGoogleShopping(
  query: string,
  apiKey: string,
  limit: number = 10
): Promise<ShoppingCandidate[]> {
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${limit}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.shopping_results) {
      return [];
    }

    return data.shopping_results.map((item: any) => ({
      title: item.title || "Unknown",
      source: item.source || "Unknown",
      link: item.link || "",
      price: item.extracted_price ? `$${item.extracted_price}` : (item.price || "N/A"),
      thumbnail: item.thumbnail || "",
    }));
  } catch (error) {
    console.error("[ProductMatcher] Google Shopping search error:", error);
    return [];
  }
}

// ============================================================================
// BUILD SEARCH QUERY FROM ATTRIBUTES
// ============================================================================

function buildSearchQuery(profile: FusedProfile, productName: string): string {
  const parts: string[] = [];

  // Color
  if (profile.primaryColor.value !== "unknown") {
    parts.push(String(profile.primaryColor.value));
  }

  // Material/knit
  if (profile.knitType.value !== "unknown") {
    parts.push(String(profile.knitType.value));
  }

  // Length
  if (profile.bodyLength.value !== "unknown" && profile.bodyLength.value !== "regular") {
    parts.push(String(profile.bodyLength.value));
  }

  // Base product name (extract key terms)
  const nameTerms = productName.toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(" ")
    .filter(t => t.length > 2 && !["the", "and", "for"].includes(t));

  parts.push(...nameTerms.slice(0, 3));

  return parts.join(" ");
}

// ============================================================================
// HELPER: Fetch image as base64
// ============================================================================

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN PIPELINE FUNCTION
// ============================================================================

export interface MatchProductsOptions {
  framesDir: string;
  productName: string;
  category: ProductCategory;
  subcategory?: string;       // e.g., "Sweater", "Loafers", "Sunglasses", "Earrings"
  searchTerms?: string[];
  maxCandidates?: number;
  serpApiKey?: string;
  referenceImageBase64?: string; // For tiebreaker
}

/**
 * Main product matching pipeline
 *
 * @param options - Matching options
 * @returns Matching output with ranked candidates
 */
export async function matchProducts(options: MatchProductsOptions): Promise<MatchingOutput> {
  const startTime = Date.now();
  const {
    framesDir,
    productName,
    category,
    subcategory = "",
    searchTerms = [],
    maxCandidates = 10,
    serpApiKey = process.env.SERP_API_KEY || "",
    referenceImageBase64,
  } = options;

  console.log(`[ProductMatcher] Starting match for: ${productName} (${category}/${subcategory || "generic"})`);

  // Step 1: Multi-frame attribute extraction
  console.log(`[ProductMatcher] Step 1: Extracting attributes from multiple frames...`);
  const frameIndices = FRAME_SELECTION_STRATEGY.medium; // Default to medium
  const extractions = await extractFromMultipleFrames(framesDir, frameIndices, category, subcategory);

  if (extractions.length === 0) {
    throw new Error("No attributes extracted from frames");
  }

  // Step 2: Fuse attributes into reference profile
  console.log(`[ProductMatcher] Step 2: Fusing ${extractions.length} frame extractions...`);
  const referenceProfile = fuseFrameExtractions(extractions);

  // Step 3: Build search query
  const searchQuery = searchTerms.length > 0
    ? searchTerms.join(" ")
    : buildSearchQuery(referenceProfile, productName);
  console.log(`[ProductMatcher] Step 3: Search query: "${searchQuery}"`);

  // Step 4: Search Google Shopping
  console.log(`[ProductMatcher] Step 4: Searching Google Shopping...`);
  let shoppingCandidates: ShoppingCandidate[] = [];

  if (serpApiKey) {
    shoppingCandidates = await searchGoogleShopping(searchQuery, serpApiKey, maxCandidates);
  } else {
    console.warn("[ProductMatcher] No SERP_API_KEY - skipping shopping search");
  }

  console.log(`[ProductMatcher] Found ${shoppingCandidates.length} shopping candidates`);

  // Step 5: Extract attributes from each candidate
  console.log(`[ProductMatcher] Step 5: Extracting candidate attributes...`);
  for (const candidate of shoppingCandidates) {
    if (candidate.thumbnail) {
      const imageBase64 = await fetchImageAsBase64(candidate.thumbnail);
      if (imageBase64) {
        candidate.attributes = await extractAttributesFromImage(
          imageBase64,
          category,
          `Shopping candidate: ${candidate.title}`,
          subcategory
        ) || undefined;
      }
    }
  }

  // Step 6: Score candidates (using category-specific scoring)
  console.log(`[ProductMatcher] Step 6: Scoring candidates with ${category} schema...`);
  const scoredCandidates: MatchResult[] = [];

  for (const candidate of shoppingCandidates) {
    if (candidate.attributes) {
      const result = computeMatchScore(referenceProfile, candidate.attributes, candidate, category, subcategory);
      scoredCandidates.push(result);
    }
  }

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Step 7: Visual tiebreaker if needed
  let tiebreakerUsed = false;

  if (scoredCandidates.length >= 2 && referenceImageBase64) {
    const top1 = scoredCandidates[0];
    const top2 = scoredCandidates[1];
    const scoreDiff = top1.score - top2.score;

    // Only run tiebreaker if: gap <= 5 AND top score >= 75
    // Reasoning: Visual comparison helps choose between GOOD matches, not bad ones
    if (scoreDiff <= TIEBREAKER_THRESHOLD && top1.score >= TIEBREAKER_MIN_SCORE) {
      console.log(`[ProductMatcher] Step 7: Running visual tiebreaker (diff: ${scoreDiff} pts, score: ${top1.score})...`);

      const img1 = await fetchImageAsBase64(top1.thumbnail);
      const img2 = await fetchImageAsBase64(top2.thumbnail);

      if (img1 && img2) {
        const { winner, loser, visualScores } = await runVisualTiebreaker(
          referenceImageBase64,
          top1,
          img1,
          top2,
          img2
        );

        // Reorder if needed
        if (winner.title !== top1.title) {
          scoredCandidates[0] = winner;
          scoredCandidates[1] = loser;
        }

        winner.flags.push("Tiebreaker used: visual verification");
        tiebreakerUsed = true;

        console.log(`[ProductMatcher] Tiebreaker result: ${winner.title} (visual: ${visualScores[0]}) > ${loser.title} (visual: ${visualScores[1]})`);
      }
    }
  }

  // Assign final ranks
  scoredCandidates.forEach((c, i) => {
    c.rank = i + 1;
  });

  const processingTime = Date.now() - startTime;
  console.log(`[ProductMatcher] Complete in ${processingTime}ms - ${scoredCandidates.length} candidates ranked`);

  const topMatch = scoredCandidates[0] || null;

  return {
    productName,
    searchQuery,
    referenceProfile,
    candidates: scoredCandidates,
    topMatch,
    tiebreakerUsed,
    processingTime,
    framesAnalyzed: extractions.length,
    // NEW v2.1: Overall verification state from top match
    verification: topMatch ? topMatch.verification : undefined,
  };
}

// ============================================================================
// SIMPLIFIED MATCH FUNCTION (for testing with pre-loaded data)
// ============================================================================

export async function matchProductsFromData(
  referenceProfile: FusedProfile,
  candidates: Array<{ title: string; source: string; link: string; price: string; thumbnail: string; attributes: ProductAttributes }>,
  referenceImageBase64?: string
): Promise<MatchResult[]> {
  // Score all candidates
  const scoredCandidates: MatchResult[] = [];

  for (const candidate of candidates) {
    const result = computeMatchScore(referenceProfile, candidate.attributes, {
      title: candidate.title,
      source: candidate.source,
      link: candidate.link,
      price: candidate.price,
      thumbnail: candidate.thumbnail,
    });
    scoredCandidates.push(result);
  }

  // Sort by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Visual tiebreaker if needed (only when gap <= 5 AND score >= 75)
  if (scoredCandidates.length >= 2 && referenceImageBase64) {
    const top1 = scoredCandidates[0];
    const top2 = scoredCandidates[1];
    const scoreDiff = top1.score - top2.score;

    if (scoreDiff <= TIEBREAKER_THRESHOLD && top1.score >= TIEBREAKER_MIN_SCORE) {
      const img1 = await fetchImageAsBase64(top1.thumbnail);
      const img2 = await fetchImageAsBase64(top2.thumbnail);

      if (img1 && img2) {
        const { winner, loser } = await runVisualTiebreaker(
          referenceImageBase64,
          top1, img1,
          top2, img2
        );

        if (winner.title !== top1.title) {
          scoredCandidates[0] = winner;
          scoredCandidates[1] = loser;
        }

        winner.flags.push("Tiebreaker used: visual verification");
      }
    }
  }

  // Assign ranks
  scoredCandidates.forEach((c, i) => {
    c.rank = i + 1;
  });

  return scoredCandidates;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  extractAttributesFromImage,
  extractFromMultipleFrames,
  fuseFrameExtractions,
  computeMatchScore,
  runVisualTiebreaker,
  searchGoogleShopping,
  buildSearchQuery,
  fetchImageAsBase64,
};
