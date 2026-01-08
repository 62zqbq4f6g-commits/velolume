/**
 * Comprehensive Video Extraction Types
 * "Digital DNA" - Complete structured representation of video content
 *
 * ~75 data points covering:
 * - Products (clothing, accessories, etc.)
 * - Content structure (hooks, angles, themes)
 * - Visual characteristics
 * - Audio/transcription
 * - Engagement signals
 */

// ============================================================================
// PRODUCT EXTRACTION (Per Product)
// ============================================================================

export interface ExtractedProduct {
  // Core identification
  name: string;
  category: ProductCategory;
  subcategory: string;

  // Visual attributes (category-specific)
  attributes: ProductAttributes;

  // Location & visibility
  location: ProductLocation;
  visibility: ProductVisibility;
  frameIndices: number[];

  // Search & matching
  searchTerms: string[];
  estimatedPriceRange: string | null;
  brand: string | null;

  // Confidence
  confidence: number;
  identifiability: "high" | "medium" | "low";
}

export type ProductCategory =
  | "Clothing"
  | "Footwear"
  | "Accessories"
  | "Jewelry"
  | "Beauty"
  | "Skincare"
  | "Haircare"
  | "Tech"
  | "Home"
  | "Bags"
  | "Other";

export type ProductLocation =
  | "face"
  | "head"
  | "ears"
  | "neck"
  | "upper_body"
  | "lower_body"
  | "full_body"
  | "hands"
  | "wrist"
  | "waist"
  | "feet"
  | "background"
  | "table"
  | "held"
  | "being_applied";

export interface ProductVisibility {
  framesVisible: number;
  totalFrames: number;
  averageVisibility: "full" | "partial" | "obscured";
  bestFrameIndex: number;
}

export interface ProductAttributes {
  // Universal
  primaryColor: string;
  colorFamily: string;
  secondaryColors?: string[];
  pattern: string;
  material: string;

  // Category-specific (varies by product type)
  [key: string]: string | string[] | number | boolean | undefined;
}

// ============================================================================
// HOOK EXTRACTION
// ============================================================================

export interface ExtractedHook {
  // Hook identification
  type: HookType;
  timestamp: HookTimestamp;

  // Content
  transcript: string;
  visualDescription: string;

  // Effectiveness signals
  attentionDevice: AttentionDevice[];
  emotionalTrigger: EmotionalTrigger | null;

  // Quality metrics
  hookStrength: number; // 0-100
  clarity: number; // 0-100
}

export type HookType =
  | "question"           // "Do you ever wonder...?"
  | "statement"          // "This changed everything"
  | "demonstration"      // Shows result immediately
  | "problem"            // "I used to struggle with..."
  | "promise"            // "I'm going to show you..."
  | "social_proof"       // "Everyone's been asking..."
  | "curiosity_gap"      // "The secret nobody tells you..."
  | "controversy"        // "Unpopular opinion..."
  | "transformation"     // Before/after reveal
  | "relatable"          // "POV: You just..."
  | "trend_reference"    // References trending sound/format
  | "direct_address";    // "You NEED to try this"

export interface HookTimestamp {
  startSeconds: number;
  endSeconds: number;
  duration: number;
}

export type AttentionDevice =
  | "text_overlay"
  | "face_close_up"
  | "product_reveal"
  | "sound_effect"
  | "music_drop"
  | "quick_cuts"
  | "zoom"
  | "movement"
  | "bright_colors"
  | "contrast"
  | "pattern_interrupt";

export type EmotionalTrigger =
  | "curiosity"
  | "fomo"
  | "aspiration"
  | "relatability"
  | "humor"
  | "surprise"
  | "urgency"
  | "exclusivity"
  | "validation";

// ============================================================================
// ANGLE EXTRACTION
// ============================================================================

export interface ExtractedAngle {
  // Core angle
  type: AngleType;
  uniqueClaim: string;

  // Supporting elements
  perspective: string;
  differentiation: string;

  // Target audience signals
  targetAudience: string;
  painPoint: string | null;
  desiredOutcome: string | null;

  // Effectiveness
  clarityScore: number; // 0-100
  believabilityScore: number; // 0-100
}

export type AngleType =
  | "problem_solution"    // "I had X problem, this solved it"
  | "discovery"           // "I found this hidden gem"
  | "comparison"          // "This vs that"
  | "routine"             // "My daily/weekly routine"
  | "review"              // "Honest review of..."
  | "tutorial"            // "How to achieve X"
  | "haul"                // "Everything I bought"
  | "favorites"           // "My holy grails"
  | "lifestyle"           // "A day in my life"
  | "transformation"      // "Before and after"
  | "recommendation"      // "You need this"
  | "unboxing"            // "Let's open this"
  | "first_impression"    // "Trying for the first time"
  | "dupes"               // "Affordable alternatives"
  | "trend_test";         // "Testing viral product"

// ============================================================================
// THEME EXTRACTION
// ============================================================================

export interface ExtractedTheme {
  // Narrative structure
  narrativeArc: NarrativeArc;
  format: ContentFormat;
  pacing: Pacing;

  // Tone & style
  tone: Tone[];
  aesthetic: Aesthetic;
  energy: EnergyLevel;

  // Content characteristics
  editingStyle: EditingStyle;
  musicStyle: MusicStyle | null;
  voiceoverStyle: VoiceoverStyle | null;
}

export type NarrativeArc =
  | "linear"              // Start to finish, chronological
  | "hook_reveal"         // Hook → buildup → reveal
  | "problem_solution"    // Problem → struggle → solution
  | "tutorial_steps"      // Step 1 → Step 2 → Result
  | "comparison"          // A vs B
  | "listicle"            // "3 things..." format
  | "story"               // Personal narrative
  | "montage"             // Collection of clips
  | "reaction"            // Responding to something
  | "day_in_life";        // Time-based sequence

export type ContentFormat =
  | "talking_head"        // Direct to camera
  | "voiceover_broll"     // Narration over footage
  | "text_only"           // Text overlays, no speaking
  | "grwm"                // Get ready with me
  | "ootd"                // Outfit of the day
  | "haul"                // Shopping haul
  | "tutorial"            // Step-by-step
  | "vlog"                // Documentary style
  | "transition"          // Outfit/look transitions
  | "slideshow"           // Photo/clip compilation
  | "duet_stitch";        // Response to another video

export interface Pacing {
  overall: "fast" | "medium" | "slow";
  cutsPerMinute: number;
  averageClipLength: number; // seconds
  hasQuickCuts: boolean;
  hasPauses: boolean;
}

export type Tone =
  | "casual"
  | "professional"
  | "energetic"
  | "calm"
  | "humorous"
  | "serious"
  | "aspirational"
  | "relatable"
  | "educational"
  | "entertaining"
  | "intimate"
  | "enthusiastic";

export type Aesthetic =
  | "minimalist"
  | "maximalist"
  | "clean_girl"
  | "y2k"
  | "cottagecore"
  | "streetwear"
  | "luxury"
  | "casual"
  | "bohemian"
  | "preppy"
  | "edgy"
  | "natural"
  | "glam";

export type EnergyLevel = "high" | "medium" | "low";

export interface EditingStyle {
  complexity: "simple" | "moderate" | "complex";
  transitions: string[];
  effects: string[];
  textOverlays: boolean;
  captionsPresent: boolean;
}

export type MusicStyle =
  | "trending_sound"
  | "original_audio"
  | "background_music"
  | "no_music"
  | "voiceover_only";

export type VoiceoverStyle =
  | "direct_speaking"
  | "narration"
  | "text_to_speech"
  | "no_voice"
  | "asmr";

// ============================================================================
// VISUAL ANALYSIS
// ============================================================================

export interface VisualAnalysis {
  // Colors
  dominantColors: string[];
  colorPalette: string[];
  colorHarmony: "monochromatic" | "complementary" | "analogous" | "triadic" | "neutral";

  // Lighting
  lighting: LightingAnalysis;

  // Composition
  composition: CompositionAnalysis;

  // Setting
  setting: SettingAnalysis;

  // Quality
  quality: QualityAnalysis;
}

export interface LightingAnalysis {
  type: "natural" | "studio" | "ring_light" | "mixed" | "low_light" | "golden_hour";
  quality: "professional" | "good" | "average" | "poor";
  consistency: boolean;
}

export interface CompositionAnalysis {
  framing: "centered" | "rule_of_thirds" | "asymmetric" | "varied";
  cameraAngles: string[];
  cameraMovement: boolean;
  subjectPlacement: "center" | "left" | "right" | "varied";
}

export interface SettingAnalysis {
  location: string;
  environment: "indoor" | "outdoor" | "mixed";
  background: string;
  props: string[];
}

export interface QualityAnalysis {
  resolution: "4k" | "1080p" | "720p" | "lower";
  stability: "stable" | "minor_shake" | "handheld";
  focus: "sharp" | "soft" | "varied";
}

// ============================================================================
// AUDIO/TRANSCRIPTION ANALYSIS
// ============================================================================

export interface AudioAnalysis {
  // Transcription
  transcription: TranscriptionData;

  // Speech analysis
  speech: SpeechAnalysis | null;

  // Music/sound
  audio: AudioCharacteristics;
}

export interface TranscriptionData {
  fullText: string;
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface SpeechAnalysis {
  speakingPace: "fast" | "medium" | "slow";
  wordsPerMinute: number;
  clarity: "clear" | "moderate" | "unclear";
  accent: string | null;
  enthusiasm: "high" | "medium" | "low";
}

export interface AudioCharacteristics {
  hasMusic: boolean;
  hasSoundEffects: boolean;
  hasVoiceover: boolean;
  audioQuality: "professional" | "good" | "average" | "poor";
  backgroundNoise: "none" | "minimal" | "noticeable";
}

// ============================================================================
// ENGAGEMENT SIGNALS
// ============================================================================

export interface EngagementSignals {
  // CTA detection
  callToAction: CallToAction | null;

  // Social proof
  socialProof: SocialProofSignal[];

  // Engagement drivers
  engagementDrivers: EngagementDriver[];

  // Shareability factors
  shareabilityScore: number; // 0-100
  shareabilityFactors: string[];
}

export interface CallToAction {
  type: "follow" | "like" | "comment" | "share" | "link" | "buy" | "subscribe" | "save";
  text: string;
  timestamp: number | null;
  strength: "strong" | "moderate" | "soft";
}

export interface SocialProofSignal {
  type: "testimonial" | "statistics" | "celebrity" | "trend" | "reviews" | "before_after";
  description: string;
}

export type EngagementDriver =
  | "question_asked"
  | "opinion_requested"
  | "controversial_take"
  | "relatable_content"
  | "educational_value"
  | "entertainment_value"
  | "emotional_connection"
  | "practical_tips"
  | "exclusive_info"
  | "trend_participation";

// ============================================================================
// SEO & DISCOVERY
// ============================================================================

export interface SEOData {
  // Keywords
  keywords: string[];
  hashtags: string[];

  // Titles
  suggestedTitle: string;
  suggestedDescription: string;

  // Categories
  niche: string;
  subNiche: string;

  // Discoverability
  trendAlignment: string[];
  searchTerms: string[];
}

// ============================================================================
// COMPLETE EXTRACTION OUTPUT
// ============================================================================

export interface ComprehensiveExtraction {
  // Metadata
  meta: ExtractionMeta;

  // Products (~15-20 data points per product)
  products: ExtractedProduct[];

  // Content structure (~15 data points)
  hook: ExtractedHook;
  angle: ExtractedAngle;
  theme: ExtractedTheme;

  // Visual analysis (~15 data points)
  visual: VisualAnalysis;

  // Audio analysis (~10 data points)
  audio: AudioAnalysis;

  // Engagement signals (~10 data points)
  engagement: EngagementSignals;

  // SEO & discovery (~10 data points)
  seo: SEOData;

  // Cost tracking
  costs: ExtractionCosts;
}

export interface ExtractionMeta {
  extractedAt: string;
  extractorVersion: string;
  videoKey: string;
  videoDuration: number;
  framesAnalyzed: number;
  productsDetected: number;
  totalDataPoints: number;
}

export interface ExtractionCosts {
  totalCost: number;
  breakdown: {
    model: string;
    task: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
}
