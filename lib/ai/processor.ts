/**
 * Unified AI Processor v2.1
 *
 * UPGRADED: Comprehensive multi-product detection with Evidence capture
 * - Detects ALL visible products (clothing, accessories, beauty, home, tech)
 * - Extracts 12 frames distributed across entire video
 * - Includes product location for future cropping/visual search
 * - Targets 5-15 products per video (vs 1 in v1)
 * - NEW: Captures evidence (frame indices, timestamps, transcript spans)
 * - NEW: Supports Claim<T> wrapper for verified data
 *
 * Output is database-ready with consistent schema.
 */

import OpenAI from "openai";
import { toFile } from "openai";
import { extractAudio, extractFrames } from "@/lib/video/frame-extractor";
import {
  ProductDetectionClaim,
  ProductEvidence,
  convertToProductClaim,
  createTranscriptEvidence,
  Evidence,
} from "@/lib/types/product-claims";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Types - Database-Ready JSON Schema (EXPANDED)
// ============================================================================

export interface ProductData {
  name: string;
  category: string;
  subcategory: string;
  colors: string[];
  material: string | null;
  style: string | null;
  pattern: string | null;
  brand: string | null;
  location: string;
  description: string;
  searchTerms: string[];
  estimatedPriceUSD: string | null;
  confidence: number;
  identifiability: "high" | "medium" | "low";
  frameIndices: number[];
  // NEW v2.1: Evidence fields
  timestamps?: number[];           // Timestamps in seconds for each frame
  transcriptMentions?: string[];   // Relevant transcript excerpts
  boundingBoxes?: {               // Location in frame (normalized 0-1)
    frameIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export interface SceneData {
  timestamp: string;
  description: string;
  setting: string;
  mood: string;
}

export interface ProcessedVideoData {
  // Transcription
  transcription: {
    text: string;
    language: string;
    duration: number;
    // NEW v2.1: Segments for evidence linking
    segments?: {
      start: number;
      end: number;
      text: string;
    }[];
  };

  // Products (database-ready) - NOW COMPREHENSIVE
  products: ProductData[];

  // NEW v2.1: Products with Claims and Evidence (for new features)
  productClaims?: ProductDetectionClaim[];

  // Product counts by category
  productCounts: {
    clothing: number;
    footwear: number;
    accessories: number;
    jewelry: number;
    beauty: number;
    tech: number;
    home: number;
    other: number;
    total: number;
  };

  // Visual Analysis
  visual: {
    dominantColors: string[];
    aestheticStyle: string;
    contentType: string;
    targetAudience: string;
    setting: string;
    lighting: string;
    scenes: SceneData[];
  };

  // SEO & Search
  seo: {
    keywords: string[];
    tags: string[];
    title: string;
    description: string;
  };

  // Sentiment
  sentiment: {
    overall: "positive" | "negative" | "neutral";
    score: number;
    highlights: string[];
  };

  // Processing metadata
  meta: {
    processedAt: string;
    framesAnalyzed: number;
    audioDuration: number;
    model: string;
    processorVersion: string;
  };
}

// ============================================================================
// Main Processor
// ============================================================================

export interface ProcessorOptions {
  maxFrames?: number; // Max frames to analyze (default: 12)
  detailed?: boolean; // Detailed analysis (default: true)
}

/**
 * Process video with full AI pipeline
 * Returns structured JSON ready for database storage
 */
export async function processVideo(
  videoKey: string,
  options: ProcessorOptions = {}
): Promise<ProcessedVideoData> {
  const { maxFrames = 12, detailed = true } = options;

  console.log(`[Processor v2.1] Starting comprehensive AI processing for: ${videoKey}`);
  const startTime = Date.now();

  // Step 1: Extract audio and frames in parallel
  // CHANGED: Request more frames, distributed across entire video
  console.log(`[Processor v2.1] Extracting audio and frames (distributed across full video)...`);
  const [audioBuffer, frameData] = await Promise.all([
    extractAudio(videoKey),
    extractFrames(videoKey, {
      interval: 1, // Extract more frequently
      maxFrames: maxFrames * 2 // Extract extra, then select best distribution
    }),
  ]);

  // Step 2: Select frames distributed across entire video
  const distributedFrames = selectDistributedFrames(frameData.frames, maxFrames);
  console.log(`[Processor v2.1] Selected ${distributedFrames.length} frames from ${frameData.frames.length} extracted`);

  // NEW v2.1: Calculate frame timestamps based on video duration
  const frameTimestamps = calculateFrameTimestamps(distributedFrames.length, frameData.duration);

  // Step 3: Transcribe audio
  console.log(`[Processor v2.1] Transcribing audio...`);
  const transcription = await transcribeWithWhisper(audioBuffer);

  // Step 4: Analyze frames with GPT-4o Vision (NEW COMPREHENSIVE PROMPT)
  console.log(`[Processor v2.1] Analyzing ${distributedFrames.length} frames for ALL visible products...`);
  const visionAnalysis = await analyzeWithGPT4Vision(
    distributedFrames,
    transcription.text,
    detailed,
    frameTimestamps
  );

  // NEW v2.1: Find transcript mentions for products
  const productsWithMentions = findTranscriptMentions(
    visionAnalysis.products,
    transcription.text
  );

  // NEW v2.1: Generate product claims with evidence
  const productClaims = productsWithMentions.map(product =>
    convertToProductClaim(
      product,
      product.frameIndices,
      product.timestamps || [],
      "gpt-4o-2024-01-25",
      videoKey
    )
  );

  // Step 5: Generate SEO data
  console.log(`[Processor v2.1] Generating SEO metadata...`);
  const seoData = await generateSEOData(
    transcription.text,
    productsWithMentions,
    visionAnalysis.visual
  );

  // Step 6: Analyze sentiment
  const sentiment = analyzeSentiment(transcription.text);

  // Step 7: Calculate product counts
  const productCounts = calculateProductCounts(productsWithMentions);

  const processingTime = Date.now() - startTime;
  console.log(`[Processor v2.1] Complete in ${processingTime}ms - Found ${productsWithMentions.length} products with evidence`);

  return {
    transcription: {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    },
    products: productsWithMentions,
    productClaims,
    productCounts,
    visual: visionAnalysis.visual,
    seo: seoData,
    sentiment,
    meta: {
      processedAt: new Date().toISOString(),
      framesAnalyzed: distributedFrames.length,
      audioDuration: frameData.duration,
      model: "gpt-4o + whisper-1",
      processorVersion: "2.1.0",
    },
  };
}

// ============================================================================
// Frame Timestamps Calculation (NEW v2.1)
// ============================================================================

/**
 * Calculate timestamps for distributed frames based on video duration
 */
function calculateFrameTimestamps(frameCount: number, videoDuration: number): number[] {
  if (frameCount <= 1) return [0];

  const timestamps: number[] = [];
  const interval = videoDuration / (frameCount - 1);

  for (let i = 0; i < frameCount; i++) {
    timestamps.push(Math.round(i * interval * 100) / 100); // Round to 2 decimal places
  }

  return timestamps;
}

// ============================================================================
// Transcript Mention Finding (NEW v2.1)
// ============================================================================

/**
 * Find mentions of products in the transcript
 */
function findTranscriptMentions(
  products: ProductData[],
  transcript: string
): ProductData[] {
  const transcriptLower = transcript.toLowerCase();

  return products.map(product => {
    const mentions: string[] = [];

    // Search for product name mentions
    const nameParts = product.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 3 && transcriptLower.includes(part)) {
        // Extract surrounding context (up to 50 chars each side)
        const idx = transcriptLower.indexOf(part);
        const start = Math.max(0, idx - 50);
        const end = Math.min(transcript.length, idx + part.length + 50);
        const context = transcript.substring(start, end).trim();
        if (context && !mentions.includes(context)) {
          mentions.push(context);
        }
      }
    }

    // Search for category mentions
    const categoryLower = product.category.toLowerCase();
    if (transcriptLower.includes(categoryLower)) {
      const idx = transcriptLower.indexOf(categoryLower);
      const start = Math.max(0, idx - 30);
      const end = Math.min(transcript.length, idx + categoryLower.length + 30);
      const context = transcript.substring(start, end).trim();
      if (context && !mentions.includes(context)) {
        mentions.push(context);
      }
    }

    // Search for brand mentions
    if (product.brand) {
      const brandLower = product.brand.toLowerCase();
      if (transcriptLower.includes(brandLower)) {
        const idx = transcriptLower.indexOf(brandLower);
        const start = Math.max(0, idx - 30);
        const end = Math.min(transcript.length, idx + brandLower.length + 30);
        const context = transcript.substring(start, end).trim();
        if (context && !mentions.includes(context)) {
          mentions.push(context);
        }
      }
    }

    return {
      ...product,
      transcriptMentions: mentions.length > 0 ? mentions : undefined,
    };
  });
}

// ============================================================================
// Frame Selection (NEW: Distributed across entire video)
// ============================================================================

/**
 * Select frames evenly distributed across the entire video
 * Instead of first N seconds, we sample from start to end
 */
function selectDistributedFrames(frames: Buffer[], targetCount: number): Buffer[] {
  if (frames.length <= targetCount) return frames;

  // Calculate step to get even distribution
  const step = (frames.length - 1) / (targetCount - 1);

  const selected: Buffer[] = [];
  for (let i = 0; i < targetCount; i++) {
    const index = Math.round(i * step);
    selected.push(frames[index]);
  }

  return selected;
}

// ============================================================================
// Transcription (Whisper)
// ============================================================================

async function transcribeWithWhisper(audioBuffer: Buffer): Promise<{
  text: string;
  language: string;
  duration: number;
}> {
  const audioFile = await toFile(audioBuffer, "audio.mp3", {
    type: "audio/mpeg",
  });

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    prompt: "E-commerce product video. May include: Thai, Vietnamese, Indonesian, Malay, English, Chinese, Filipino, Tagalog, Japanese, Korean.",
  });

  return {
    text: response.text,
    language: response.language || "unknown",
    duration: response.duration || 0,
  };
}

// ============================================================================
// Vision Analysis (GPT-4o) - COMPLETELY REWRITTEN
// ============================================================================

const VISION_SYSTEM_PROMPT = `You are an expert visual product detector for social commerce. Your job is to identify EVERY monetizable product visible in video frames.

CRITICAL INSTRUCTIONS:

1. SCAN THE ENTIRE FRAME - not just the focal point or the product being promoted

2. IDENTIFY ALL PRODUCTS the creator is:
   - WEARING: clothing (top, bottom, dress, outerwear), shoes, accessories (bag, belt, hat, scarf), jewelry (earrings, necklace, bracelet, rings, watch), glasses/sunglasses
   - HOLDING: phone, bag, drink, makeup products, skincare, tools, books
   - USING: makeup being applied, skincare products, tech devices, furniture they're sitting on
   - NEAR: home decor, furniture, plants, lamps, art, rugs visible in background

3. For EACH product, provide:
   - A SPECIFIC name (not "dress" but "midi wrap dress with floral print" or "black ribbed tank top")
   - Visual attributes that would help someone SEARCH for this item
   - Location in frame where the product appears
   - Whether brand is visible (and what it is if you can read it)
   - Your confidence that this specific item could be found for purchase online

4. DO NOT SKIP items because they seem incidental. A phone case, water bottle, hair clip, or lamp can all be monetized.

5. DO NOT merge multiple items. Earrings AND a necklace are TWO separate products. A top AND pants are TWO separate products.

6. PRIORITIZE items by identifiability:
   - HIGH: Clear view, good lighting, distinctive features, brand visible
   - MEDIUM: Visible but partially obscured, angled, or generic style
   - LOW: Edge of frame, blurry, very small, or extremely common item

7. For CLOTHING specifically, always try to identify:
   - Type (blouse, t-shirt, tank top, sweater, jacket, jeans, skirt, dress, etc.)
   - Style (casual, formal, athletic, bohemian, minimalist, streetwear)
   - Notable features (pattern, neckline, sleeve length, fit)

You MUST respond with valid JSON only. No markdown, no explanation, just JSON.

Required JSON schema:
{
  "products": [
    {
      "name": "Specific descriptive product name",
      "category": "Clothing|Footwear|Accessories|Jewelry|Beauty|Skincare|Haircare|Tech|Home Decor|Furniture|Food & Beverage|Other",
      "subcategory": "e.g., Midi Dress, Moisturizer, Wireless Earbuds, Table Lamp, Hoop Earrings",
      "colors": ["primary color", "secondary color if applicable"],
      "material": "silk|cotton|leather|denim|knit|metal|plastic|ceramic|glass|unknown",
      "style": "casual|formal|streetwear|minimalist|bohemian|athletic|luxury|vintage|trendy",
      "pattern": "solid|striped|floral|geometric|animal print|plaid|polka dot|abstract|none visible",
      "brand": "Brand name if visible/readable, null if not",
      "location": "face|head|ears|neck|upper_body|lower_body|full_body|hands|wrist|waist|feet|background|table|held|being_applied",
      "description": "2-3 sentences describing the item as you would for a product listing. Include fit, style, and distinguishing features that make it searchable.",
      "searchTerms": ["array", "of", "5-8", "terms", "someone", "would", "search", "on", "google", "or", "amazon"],
      "estimatedPriceUSD": "$XX-$XX range or null if unknown",
      "confidence": 0.0-1.0,
      "identifiability": "high|medium|low",
      "frameIndices": [0, 3, 5],
      "boundingBox": {"x": 0.2, "y": 0.3, "width": 0.4, "height": 0.5}
    }
  ],
  "visual": {
    "dominantColors": ["color1", "color2", "color3"],
    "aestheticStyle": "Minimalist|Luxury|Casual|Professional|Playful|Vintage|Bohemian|Streetwear|Glam|Natural",
    "contentType": "Product Review|GRWM|OOTD|Tutorial|Haul|Unboxing|Lifestyle|Advertisement|Vlog|Talking Head",
    "targetAudience": "e.g., Young Women 18-25, Beauty Enthusiasts, Fashion-forward Millennials",
    "setting": "Bedroom|Bathroom|Living Room|Kitchen|Office|Studio|Outdoor|Store|Gym|Car|Restaurant|Unknown",
    "lighting": "Natural|Studio|Ring Light|Low Light|Mixed|Golden Hour",
    "scenes": [
      {
        "timestamp": "Frame X",
        "description": "What's happening in this frame",
        "setting": "Location/environment",
        "mood": "Energetic|Calm|Professional|Fun|Intimate|Luxurious"
      }
    ]
  }
}`;

const USER_PROMPT_TEMPLATE = `Analyze these {frameCount} video frames from a creator's social media content.

CONTEXT FROM AUDIO TRANSCRIPTION:
"{transcription}"

YOUR TASK:
1. Identify EVERY visible product across all frames
2. For a typical lifestyle/fashion video, you should find 5-15+ products including:
   - Full outfit breakdown (top, bottom, shoes - each as SEPARATE items)
   - All jewelry pieces (earrings, necklace, rings, bracelet - each SEPARATE)
   - Accessories (bag, belt, sunglasses, hair accessories)
   - Any beauty/skincare products visible or being used
   - Tech items (phone, earbuds, laptop)
   - Background items (furniture, decor) if clearly visible

3. For EACH product, provide enough detail that someone could SEARCH and FIND a similar item online

4. Use the audio transcription to help identify products being discussed

IMPORTANT:
- Err on the side of OVER-DETECTION. Include items even if you're only 50-60% confident.
- Low-confidence items can be filtered later, but MISSED items are lost revenue.
- If the creator is wearing an outfit, that's minimum 2-5 products right there.

Respond with JSON only.`;

async function analyzeWithGPT4Vision(
  frames: Buffer[],
  transcription: string,
  detailed: boolean,
  frameTimestamps: number[] = []
): Promise<{
  products: ProductData[];
  visual: ProcessedVideoData["visual"];
}> {
  // Truncate transcription for context but keep more than before
  const truncatedTranscription = transcription.length > 1000
    ? transcription.substring(0, 1000) + "..."
    : transcription;

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{frameCount}", frames.length.toString())
    .replace("{transcription}", truncatedTranscription);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          ...frames.map((frame, i) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString("base64")}`,
              detail: detailed ? "high" : ("low" as "high" | "low"),
            },
          })),
        ],
      },
    ],
    max_tokens: 4000, // Increased for more products
    temperature: 0.3, // Slightly higher for more creative detection
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("[Processor v2.1] Failed to parse GPT-4o response:", content);
    parsed = { products: [], visual: {} };
  }

  return {
    products: normalizeProducts(parsed.products || [], frameTimestamps),
    visual: normalizeVisual(parsed.visual || {}),
  };
}

function normalizeProducts(products: any[], frameTimestamps: number[] = []): ProductData[] {
  return products.map((p, index) => {
    const frameIndices = Array.isArray(p.frameIndices) ? p.frameIndices : [index];

    // Calculate timestamps from frame indices
    const timestamps = frameIndices.map((fi: number) =>
      frameTimestamps[fi] !== undefined ? frameTimestamps[fi] : fi * 1.0
    );

    // Parse bounding box if provided
    const boundingBoxes = p.boundingBox ? [{
      frameIndex: frameIndices[0] || 0,
      x: p.boundingBox.x || 0,
      y: p.boundingBox.y || 0,
      width: p.boundingBox.width || 0,
      height: p.boundingBox.height || 0,
    }] : undefined;

    return {
      name: p.name || "Unknown Product",
      category: p.category || "Other",
      subcategory: p.subcategory || p.category || "General",
      colors: Array.isArray(p.colors) ? p.colors : [],
      material: p.material || null,
      style: p.style || null,
      pattern: p.pattern || null,
      brand: p.brand || null,
      location: p.location || "unknown",
      description: p.description || "",
      searchTerms: Array.isArray(p.searchTerms) ? p.searchTerms : [],
      estimatedPriceUSD: p.estimatedPriceUSD || p.estimatedPrice || null,
      confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
      identifiability: p.identifiability || "medium",
      frameIndices,
      // NEW v2.1: Evidence fields
      timestamps,
      boundingBoxes,
      transcriptMentions: p.transcriptMentions || undefined,
    };
  });
}

function normalizeVisual(visual: any): ProcessedVideoData["visual"] {
  return {
    dominantColors: visual.dominantColors || [],
    aestheticStyle: visual.aestheticStyle || "Modern",
    contentType: visual.contentType || "Product Video",
    targetAudience: visual.targetAudience || "General",
    setting: visual.setting || "Unknown",
    lighting: visual.lighting || "Unknown",
    scenes: (visual.scenes || []).map((s: any) => ({
      timestamp: s.timestamp || "Unknown",
      description: s.description || "",
      setting: s.setting || "Unknown",
      mood: s.mood || "Neutral",
    })),
  };
}

// ============================================================================
// Product Count Calculator (NEW)
// ============================================================================

function calculateProductCounts(products: ProductData[]): ProcessedVideoData["productCounts"] {
  const counts = {
    clothing: 0,
    footwear: 0,
    accessories: 0,
    jewelry: 0,
    beauty: 0,
    tech: 0,
    home: 0,
    other: 0,
    total: products.length,
  };

  for (const product of products) {
    const category = product.category.toLowerCase();

    if (category === "clothing") counts.clothing++;
    else if (category === "footwear") counts.footwear++;
    else if (category === "accessories") counts.accessories++;
    else if (category === "jewelry") counts.jewelry++;
    else if (["beauty", "skincare", "haircare"].includes(category)) counts.beauty++;
    else if (category === "tech") counts.tech++;
    else if (["home decor", "furniture"].includes(category)) counts.home++;
    else counts.other++;
  }

  return counts;
}

// ============================================================================
// SEO Generation (UPDATED for more products)
// ============================================================================

async function generateSEOData(
  transcription: string,
  products: ProductData[],
  visual: ProcessedVideoData["visual"]
): Promise<ProcessedVideoData["seo"]> {
  // Get top products by confidence for SEO focus
  const topProducts = products
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  const productNames = topProducts.map((p) => p.name).join(", ");
  const categories = [...new Set(products.map((p) => p.category))].join(", ");
  const allSearchTerms = [...new Set(products.flatMap((p) => p.searchTerms))].slice(0, 20);

  const prompt = `Generate SEO metadata for an e-commerce product video.

Top Products Featured: ${productNames || "Various products"}
All Categories: ${categories || "General"}
Product Search Terms: ${allSearchTerms.join(", ")}
Visual Style: ${visual.aestheticStyle}
Content Type: ${visual.contentType}
Target Audience: ${visual.targetAudience}
Transcription excerpt: "${transcription.substring(0, 400)}"

Total products detected: ${products.length}

Respond with JSON:
{
  "keywords": ["keyword1", "keyword2", ...] (15-20 search keywords covering all products),
  "tags": ["tag1", "tag2", ...] (8-12 hashtag-style tags),
  "title": "SEO-optimized title (60 chars max)",
  "description": "SEO-optimized description mentioning key products (160 chars max)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    keywords: parsed.keywords || [],
    tags: parsed.tags || [],
    title: parsed.title || "Product Video",
    description: parsed.description || "",
  };
}

// ============================================================================
// Sentiment Analysis (unchanged)
// ============================================================================

function analyzeSentiment(text: string): ProcessedVideoData["sentiment"] {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "love", "amazing", "great", "excellent", "perfect", "best", "recommend",
    "favorite", "beautiful", "awesome", "wonderful", "fantastic", "incredible",
    "must-have", "worth it", "impressed", "quality", "smooth", "soft", "effective",
    "obsessed", "gorgeous", "stunning", "holy grail", "game changer", "life changing"
  ];

  const negativeWords = [
    "bad", "terrible", "worst", "hate", "disappointed", "poor", "awful",
    "horrible", "waste", "don't buy", "not recommend", "cheap", "broke",
    "failed", "useless", "overpriced", "scam", "fake", "skip", "pass"
  ];

  let positiveScore = 0;
  let negativeScore = 0;
  const highlights: string[] = [];

  for (const word of positiveWords) {
    if (lowerText.includes(word)) {
      positiveScore++;
      if (highlights.length < 5) highlights.push(`+${word}`);
    }
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) {
      negativeScore++;
      if (highlights.length < 5) highlights.push(`-${word}`);
    }
  }

  const total = positiveScore + negativeScore || 1;
  const score = (positiveScore - negativeScore) / total;

  let overall: "positive" | "negative" | "neutral" = "neutral";
  if (score > 0.2) overall = "positive";
  else if (score < -0.2) overall = "negative";

  return {
    overall,
    score: Math.round((score + 1) * 50),
    highlights,
  };
}

// ============================================================================
// Status Check
// ============================================================================

export function isProcessorReady(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getProcessorStatus() {
  return {
    ready: isProcessorReady(),
    version: "2.1.0",
    models: {
      transcription: "whisper-1",
      vision: "gpt-4o",
      seo: "gpt-4o-mini",
    },
    capabilities: [
      "Multi-product detection (5-15+ per video)",
      "Full outfit breakdown",
      "Jewelry itemization",
      "Background product detection",
      "Product location tracking",
      "Search term generation",
      "Identifiability scoring",
      // NEW v2.1
      "Evidence capture (frame indices, timestamps)",
      "Transcript mention linking",
      "Bounding box detection",
      "Claim<T> wrapper support",
      "Verification tier tracking"
    ]
  };
}
