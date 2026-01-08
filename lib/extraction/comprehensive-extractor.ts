/**
 * Comprehensive Video Extractor
 *
 * Single entry point for extracting complete "Digital DNA" from videos.
 * Orchestrates multi-model extraction for ~75 data points:
 *
 * - Products (clothing, accessories, etc.)
 * - Hooks (type, duration, transcript, visual)
 * - Angles (unique claim, perspective)
 * - Themes (narrative, format, pacing)
 * - Visual analysis
 * - Audio analysis
 * - Engagement signals
 * - SEO data
 *
 * Model Strategy:
 * - GPT-4o: Product detection, reference extraction, visual tiebreaker
 * - Gemini Flash: Candidate extraction, hook/content analysis
 * - GPT-4o-mini: Text-only SEO generation
 */

import { getModelRouter, type CostBreakdown } from "@/lib/ai/model-router";
import { extractAudio, extractFrames } from "@/lib/video/frame-extractor";
import OpenAI from "openai";
import { toFile } from "openai";

import type {
  ComprehensiveExtraction,
  ExtractedProduct,
  ExtractedHook,
  ExtractedAngle,
  ExtractedTheme,
  VisualAnalysis,
  AudioAnalysis,
  EngagementSignals,
  SEOData,
  ExtractionMeta,
  ExtractionCosts,
  ProductCategory,
} from "./types";

// ============================================================================
// Configuration
// ============================================================================

const EXTRACTOR_VERSION = "1.0.0";
const DEFAULT_MAX_FRAMES = 12;

// ============================================================================
// Prompts
// ============================================================================

const PRODUCT_DETECTION_SYSTEM = `You are an expert visual product detector for social commerce. Your job is to identify EVERY monetizable product visible in video frames.

CRITICAL INSTRUCTIONS:
1. SCAN THE ENTIRE FRAME - not just the focal point
2. IDENTIFY ALL PRODUCTS the creator is: WEARING, HOLDING, USING, NEAR
3. For EACH product, provide specific searchable attributes
4. Err on the side of OVER-DETECTION - include items even if 50-60% confident
5. DO NOT merge items - earrings AND necklace are TWO separate products

You MUST respond with valid JSON only.`;

const PRODUCT_DETECTION_USER = `Analyze these {frameCount} video frames from a creator's content.

CONTEXT FROM AUDIO: "{transcription}"

Find EVERY visible product including:
- Full outfit breakdown (top, bottom, shoes - SEPARATE items)
- All jewelry pieces (earrings, necklace, rings, bracelet - SEPARATE)
- Accessories (bag, belt, sunglasses, hair accessories)
- Beauty/skincare products visible or being used
- Tech items (phone, earbuds)
- Background items (furniture, decor) if clearly visible

Respond with JSON:
{
  "products": [
    {
      "name": "Specific descriptive product name",
      "category": "Clothing|Footwear|Accessories|Jewelry|Beauty|Tech|Home|Bags|Other",
      "subcategory": "e.g., Midi Dress, Hoop Earrings, Crossbody Bag",
      "primaryColor": "main color",
      "colorFamily": "neutral|warm|cool|earth|pastel|bright|dark",
      "secondaryColors": ["if applicable"],
      "pattern": "solid|striped|floral|plaid|etc",
      "material": "cotton|silk|leather|metal|etc",
      "style": "casual|formal|streetwear|minimalist|etc",
      "location": "face|upper_body|lower_body|feet|hands|wrist|background|held",
      "brand": "brand if visible, null otherwise",
      "searchTerms": ["array", "of", "search", "terms"],
      "estimatedPriceRange": "$XX-$XX or null",
      "confidence": 0.0-1.0,
      "identifiability": "high|medium|low",
      "frameIndices": [0, 2, 5]
    }
  ]
}`;

const HOOK_ANALYSIS_SYSTEM = `You are an expert content strategist analyzing video hooks for social media.

A "hook" is the opening 1-5 seconds that captures attention. Analyze:
1. What type of hook is used
2. What attention devices are employed
3. What emotional triggers are activated
4. How effective is the hook

You MUST respond with valid JSON only.`;

const HOOK_ANALYSIS_USER = `Analyze the OPENING of this video (first 3-5 seconds).

TRANSCRIPTION: "{transcription}"

Identify the hook strategy:

{
  "hook": {
    "type": "question|statement|demonstration|problem|promise|social_proof|curiosity_gap|controversy|transformation|relatable|trend_reference|direct_address",
    "startSeconds": 0,
    "endSeconds": 3,
    "duration": 3,
    "transcript": "exact words spoken in first 3-5 seconds",
    "visualDescription": "what's shown visually in opening",
    "attentionDevices": ["text_overlay", "face_close_up", "product_reveal", "sound_effect", "quick_cuts", "zoom", "movement", "bright_colors"],
    "emotionalTrigger": "curiosity|fomo|aspiration|relatability|humor|surprise|urgency|exclusivity|validation|null",
    "hookStrength": 0-100,
    "clarity": 0-100
  }
}`;

const CONTENT_ANALYSIS_SYSTEM = `You are an expert content analyst identifying the strategic elements of creator videos.

Analyze:
1. ANGLE: The unique claim or perspective
2. THEME: Narrative structure, format, pacing
3. ENGAGEMENT: Calls to action, social proof, shareability

You MUST respond with valid JSON only.`;

const CONTENT_ANALYSIS_USER = `Analyze this video's content strategy.

TRANSCRIPTION: "{transcription}"

Identify:

{
  "angle": {
    "type": "problem_solution|discovery|comparison|routine|review|tutorial|haul|favorites|lifestyle|transformation|recommendation|unboxing|first_impression|dupes|trend_test",
    "uniqueClaim": "The main value proposition or claim",
    "perspective": "Creator's point of view",
    "differentiation": "What makes this different from similar content",
    "targetAudience": "Who this is for",
    "painPoint": "Problem addressed, if any",
    "desiredOutcome": "What viewer should feel/do after",
    "clarityScore": 0-100,
    "believabilityScore": 0-100
  },
  "theme": {
    "narrativeArc": "linear|hook_reveal|problem_solution|tutorial_steps|comparison|listicle|story|montage|reaction|day_in_life",
    "format": "talking_head|voiceover_broll|text_only|grwm|ootd|haul|tutorial|vlog|transition|slideshow|duet_stitch",
    "pacing": {
      "overall": "fast|medium|slow",
      "cutsPerMinute": 0,
      "averageClipLength": 0,
      "hasQuickCuts": true/false,
      "hasPauses": true/false
    },
    "tone": ["casual", "energetic", "relatable"],
    "aesthetic": "minimalist|maximalist|clean_girl|y2k|luxury|casual|bohemian|preppy|edgy|natural|glam",
    "energy": "high|medium|low",
    "editingStyle": {
      "complexity": "simple|moderate|complex",
      "transitions": ["cut", "zoom"],
      "effects": ["filter", "text"],
      "textOverlays": true/false,
      "captionsPresent": true/false
    },
    "musicStyle": "trending_sound|original_audio|background_music|no_music|voiceover_only",
    "voiceoverStyle": "direct_speaking|narration|text_to_speech|no_voice|asmr"
  },
  "engagement": {
    "callToAction": {
      "type": "follow|like|comment|share|link|buy|subscribe|save|null",
      "text": "exact CTA text",
      "timestamp": null,
      "strength": "strong|moderate|soft"
    },
    "socialProof": [
      {"type": "testimonial|statistics|celebrity|trend|reviews|before_after", "description": "..."}
    ],
    "engagementDrivers": ["question_asked", "relatable_content", "practical_tips"],
    "shareabilityScore": 0-100,
    "shareabilityFactors": ["reasons it would be shared"]
  }
}`;

const VISUAL_ANALYSIS_SYSTEM = `You are an expert visual analyst for social media content.

Analyze the visual characteristics including:
- Color palette and harmony
- Lighting quality and type
- Composition and framing
- Setting and environment
- Production quality

You MUST respond with valid JSON only.`;

const VISUAL_ANALYSIS_USER = `Analyze the visual characteristics of these video frames.

{
  "visual": {
    "dominantColors": ["color1", "color2", "color3"],
    "colorPalette": ["full palette"],
    "colorHarmony": "monochromatic|complementary|analogous|triadic|neutral",
    "lighting": {
      "type": "natural|studio|ring_light|mixed|low_light|golden_hour",
      "quality": "professional|good|average|poor",
      "consistency": true/false
    },
    "composition": {
      "framing": "centered|rule_of_thirds|asymmetric|varied",
      "cameraAngles": ["straight on", "slightly above"],
      "cameraMovement": true/false,
      "subjectPlacement": "center|left|right|varied"
    },
    "setting": {
      "location": "bedroom|bathroom|living room|kitchen|etc",
      "environment": "indoor|outdoor|mixed",
      "background": "description of background",
      "props": ["visible props"]
    },
    "quality": {
      "resolution": "4k|1080p|720p|lower",
      "stability": "stable|minor_shake|handheld",
      "focus": "sharp|soft|varied"
    }
  }
}`;

const SEO_SYSTEM = `You are an SEO expert for social commerce content.

Generate optimized metadata including:
- Search keywords
- Hashtags
- Title and description
- Niche categorization

You MUST respond with valid JSON only.`;

const SEO_USER = `Generate SEO metadata for this video.

PRODUCTS: {products}
TRANSCRIPTION: {transcription}
CONTENT TYPE: {contentType}
TARGET AUDIENCE: {targetAudience}

{
  "seo": {
    "keywords": ["keyword1", "keyword2", ...15-20 keywords],
    "hashtags": ["#hashtag1", "#hashtag2", ...8-12 hashtags],
    "suggestedTitle": "SEO-optimized title (60 chars max)",
    "suggestedDescription": "SEO description (160 chars max)",
    "niche": "main niche category",
    "subNiche": "specific sub-niche",
    "trendAlignment": ["trends this aligns with"],
    "searchTerms": ["long-tail search terms"]
  }
}`;

// ============================================================================
// Main Extractor Class
// ============================================================================

export interface ExtractorOptions {
  maxFrames?: number;
  skipProducts?: boolean;
  skipHook?: boolean;
  skipContent?: boolean;
  skipVisual?: boolean;
  skipSEO?: boolean;
}

export class ComprehensiveExtractor {
  private router = getModelRouter();
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  /**
   * Extract complete "Digital DNA" from a video
   */
  async extract(
    videoKey: string,
    options: ExtractorOptions = {}
  ): Promise<ComprehensiveExtraction> {
    const startTime = Date.now();
    const maxFrames = options.maxFrames || DEFAULT_MAX_FRAMES;

    console.log(`[Extractor] Starting comprehensive extraction for: ${videoKey}`);
    this.router.resetCosts();

    // Step 1: Extract audio and frames in parallel
    console.log(`[Extractor] Extracting audio and frames...`);
    const [audioBuffer, frameData] = await Promise.all([
      extractAudio(videoKey),
      extractFrames(videoKey, { interval: 1, maxFrames: maxFrames * 2 }),
    ]);

    // Select distributed frames
    const frames = this.selectDistributedFrames(frameData.frames, maxFrames);
    console.log(`[Extractor] Selected ${frames.length} frames from ${frameData.frames.length}`);

    // Step 2: Transcribe audio
    console.log(`[Extractor] Transcribing audio...`);
    const transcription = await this.transcribeAudio(audioBuffer);

    // Step 3: Run extractions in parallel where possible
    console.log(`[Extractor] Running parallel extractions...`);

    const [products, hookResult, contentResult, visualResult] = await Promise.all([
      options.skipProducts ? [] : this.extractProducts(frames, transcription.text),
      options.skipHook ? null : this.extractHook(frames.slice(0, 3), transcription.text),
      options.skipContent ? null : this.extractContent(frames, transcription.text),
      options.skipVisual ? null : this.extractVisual(frames),
    ]);

    // Step 4: Generate SEO (depends on products and content)
    console.log(`[Extractor] Generating SEO data...`);
    const seoResult = options.skipSEO ? null : await this.generateSEO(
      products,
      transcription.text,
      contentResult?.theme.format || "unknown",
      contentResult?.angle.targetAudience || "general"
    );

    // Build result
    const costs = this.router.getCosts();
    const totalCost = this.router.getTotalCost();

    const result: ComprehensiveExtraction = {
      meta: {
        extractedAt: new Date().toISOString(),
        extractorVersion: EXTRACTOR_VERSION,
        videoKey,
        videoDuration: frameData.duration,
        framesAnalyzed: frames.length,
        productsDetected: products.length,
        totalDataPoints: this.countDataPoints(products, hookResult, contentResult, visualResult, seoResult),
      },
      products: products.map(p => this.normalizeProduct(p)),
      hook: hookResult || this.getDefaultHook(),
      angle: contentResult?.angle || this.getDefaultAngle(),
      theme: contentResult?.theme || this.getDefaultTheme(),
      visual: visualResult || this.getDefaultVisual(),
      audio: {
        transcription: {
          fullText: transcription.text,
          language: transcription.language,
          duration: transcription.duration,
          segments: [],
        },
        speech: {
          speakingPace: "medium",
          wordsPerMinute: Math.round(transcription.text.split(/\s+/).length / (transcription.duration / 60)),
          clarity: "clear",
          accent: null,
          enthusiasm: "medium",
        },
        audio: {
          hasMusic: false,
          hasSoundEffects: false,
          hasVoiceover: transcription.text.length > 0,
          audioQuality: "good",
          backgroundNoise: "minimal",
        },
      },
      engagement: contentResult?.engagement || this.getDefaultEngagement(),
      seo: seoResult || this.getDefaultSEO(),
      costs: {
        totalCost,
        breakdown: costs,
      },
    };

    const elapsed = Date.now() - startTime;
    console.log(`[Extractor] Complete in ${elapsed}ms. Total cost: $${totalCost.toFixed(4)}`);

    return result;
  }

  // ============================================================================
  // Extraction Methods
  // ============================================================================

  private async extractProducts(
    frames: Buffer[],
    transcription: string
  ): Promise<any[]> {
    console.log(`[Extractor] Detecting products across ${frames.length} frames...`);

    const userPrompt = PRODUCT_DETECTION_USER
      .replace("{frameCount}", frames.length.toString())
      .replace("{transcription}", transcription.slice(0, 500));

    const result = await this.router.executeVisionTask<{ products: any[] }>(
      "product_detection",
      frames,
      PRODUCT_DETECTION_SYSTEM,
      userPrompt
    );

    console.log(`[Extractor] Detected ${result.data.products?.length || 0} products`);
    return result.data.products || [];
  }

  private async extractHook(
    openingFrames: Buffer[],
    transcription: string
  ): Promise<ExtractedHook | null> {
    console.log(`[Extractor] Analyzing hook...`);

    const userPrompt = HOOK_ANALYSIS_USER
      .replace("{transcription}", transcription.slice(0, 200));

    const result = await this.router.executeVisionTask<{ hook: ExtractedHook }>(
      "hook_extraction",
      openingFrames,
      HOOK_ANALYSIS_SYSTEM,
      userPrompt
    );

    return result.data.hook || null;
  }

  private async extractContent(
    frames: Buffer[],
    transcription: string
  ): Promise<{ angle: ExtractedAngle; theme: ExtractedTheme; engagement: EngagementSignals } | null> {
    console.log(`[Extractor] Analyzing content (angle, theme, engagement)...`);

    const userPrompt = CONTENT_ANALYSIS_USER
      .replace("{transcription}", transcription);

    const result = await this.router.executeVisionTask<{
      angle: ExtractedAngle;
      theme: ExtractedTheme;
      engagement: EngagementSignals;
    }>(
      "content_analysis",
      frames,
      CONTENT_ANALYSIS_SYSTEM,
      userPrompt
    );

    return result.data;
  }

  private async extractVisual(
    frames: Buffer[]
  ): Promise<VisualAnalysis | null> {
    console.log(`[Extractor] Analyzing visual characteristics...`);

    const result = await this.router.executeVisionTask<{ visual: VisualAnalysis }>(
      "content_analysis", // Use same task type for consistent model
      frames,
      VISUAL_ANALYSIS_SYSTEM,
      VISUAL_ANALYSIS_USER
    );

    return result.data.visual || null;
  }

  private async generateSEO(
    products: any[],
    transcription: string,
    contentType: string,
    targetAudience: string
  ): Promise<SEOData | null> {
    console.log(`[Extractor] Generating SEO metadata...`);

    const productSummary = products
      .slice(0, 5)
      .map(p => p.name)
      .join(", ");

    const userPrompt = SEO_USER
      .replace("{products}", productSummary || "Various products")
      .replace("{transcription}", transcription.slice(0, 300))
      .replace("{contentType}", contentType)
      .replace("{targetAudience}", targetAudience);

    const result = await this.router.executeTextTask<{ seo: SEOData }>(
      "seo_generation",
      SEO_SYSTEM,
      userPrompt
    );

    return result.data.seo || null;
  }

  // ============================================================================
  // Audio Transcription
  // ============================================================================

  private async transcribeAudio(audioBuffer: Buffer): Promise<{
    text: string;
    language: string;
    duration: number;
  }> {
    const audioFile = await toFile(audioBuffer, "audio.mp3", {
      type: "audio/mpeg",
    });

    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      prompt: "E-commerce product video. May include: English, Thai, Vietnamese, Indonesian, Malay, Chinese, Filipino, Japanese, Korean.",
    });

    return {
      text: response.text,
      language: response.language || "unknown",
      duration: response.duration || 0,
    };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private selectDistributedFrames(frames: Buffer[], targetCount: number): Buffer[] {
    if (frames.length <= targetCount) return frames;

    const step = (frames.length - 1) / (targetCount - 1);
    const selected: Buffer[] = [];

    for (let i = 0; i < targetCount; i++) {
      const index = Math.round(i * step);
      selected.push(frames[index]);
    }

    return selected;
  }

  private normalizeProduct(p: any): ExtractedProduct {
    return {
      name: p.name || "Unknown Product",
      category: (p.category || "Other") as ProductCategory,
      subcategory: p.subcategory || p.category || "General",
      attributes: {
        primaryColor: p.primaryColor || "unknown",
        colorFamily: p.colorFamily || "unknown",
        secondaryColors: p.secondaryColors || [],
        pattern: p.pattern || "solid",
        material: p.material || "unknown",
        style: p.style || "casual",
        ...p, // Include any additional attributes
      },
      location: p.location || "unknown",
      visibility: {
        framesVisible: p.frameIndices?.length || 1,
        totalFrames: 12,
        averageVisibility: "partial",
        bestFrameIndex: p.frameIndices?.[0] || 0,
      },
      frameIndices: p.frameIndices || [0],
      searchTerms: p.searchTerms || [],
      estimatedPriceRange: p.estimatedPriceRange || null,
      brand: p.brand || null,
      confidence: p.confidence || 0.7,
      identifiability: p.identifiability || "medium",
    };
  }

  private countDataPoints(
    products: any[],
    hook: ExtractedHook | null,
    content: any | null,
    visual: VisualAnalysis | null,
    seo: SEOData | null
  ): number {
    let count = 0;

    // Products: ~15 data points each
    count += products.length * 15;

    // Hook: ~10 data points
    if (hook) count += 10;

    // Content (angle + theme + engagement): ~25 data points
    if (content) count += 25;

    // Visual: ~15 data points
    if (visual) count += 15;

    // SEO: ~10 data points
    if (seo) count += 10;

    return count;
  }

  // ============================================================================
  // Default Values
  // ============================================================================

  private getDefaultHook(): ExtractedHook {
    return {
      type: "statement",
      timestamp: { startSeconds: 0, endSeconds: 3, duration: 3 },
      transcript: "",
      visualDescription: "",
      attentionDevice: [],
      emotionalTrigger: null,
      hookStrength: 50,
      clarity: 50,
    };
  }

  private getDefaultAngle(): ExtractedAngle {
    return {
      type: "lifestyle",
      uniqueClaim: "",
      perspective: "",
      differentiation: "",
      targetAudience: "general",
      painPoint: null,
      desiredOutcome: null,
      clarityScore: 50,
      believabilityScore: 50,
    };
  }

  private getDefaultTheme(): ExtractedTheme {
    return {
      narrativeArc: "linear",
      format: "talking_head",
      pacing: {
        overall: "medium",
        cutsPerMinute: 0,
        averageClipLength: 0,
        hasQuickCuts: false,
        hasPauses: false,
      },
      tone: ["casual"],
      aesthetic: "casual",
      energy: "medium",
      editingStyle: {
        complexity: "simple",
        transitions: [],
        effects: [],
        textOverlays: false,
        captionsPresent: false,
      },
      musicStyle: "no_music",
      voiceoverStyle: "direct_speaking",
    };
  }

  private getDefaultVisual(): VisualAnalysis {
    return {
      dominantColors: [],
      colorPalette: [],
      colorHarmony: "neutral",
      lighting: {
        type: "natural",
        quality: "good",
        consistency: true,
      },
      composition: {
        framing: "centered",
        cameraAngles: [],
        cameraMovement: false,
        subjectPlacement: "center",
      },
      setting: {
        location: "unknown",
        environment: "indoor",
        background: "",
        props: [],
      },
      quality: {
        resolution: "1080p",
        stability: "stable",
        focus: "sharp",
      },
    };
  }

  private getDefaultEngagement(): EngagementSignals {
    return {
      callToAction: null,
      socialProof: [],
      engagementDrivers: [],
      shareabilityScore: 50,
      shareabilityFactors: [],
    };
  }

  private getDefaultSEO(): SEOData {
    return {
      keywords: [],
      hashtags: [],
      suggestedTitle: "",
      suggestedDescription: "",
      niche: "lifestyle",
      subNiche: "general",
      trendAlignment: [],
      searchTerms: [],
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let extractorInstance: ComprehensiveExtractor | null = null;

export function getExtractor(): ComprehensiveExtractor {
  if (!extractorInstance) {
    extractorInstance = new ComprehensiveExtractor();
  }
  return extractorInstance;
}

// ============================================================================
// Convenience Export
// ============================================================================

export async function extractVideoDigitalDNA(
  videoKey: string,
  options?: ExtractorOptions
): Promise<ComprehensiveExtraction> {
  const extractor = getExtractor();
  return extractor.extract(videoKey, options);
}
