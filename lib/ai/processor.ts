/**
 * Unified AI Processor
 *
 * Combines transcription (Whisper) and vision analysis (GPT-4o)
 * into a single processing pipeline with structured JSON output.
 *
 * Output is database-ready with consistent schema.
 */

import OpenAI from "openai";
import { toFile } from "openai";
import { extractAudio, extractFrames } from "@/lib/video/frame-extractor";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Types - Database-Ready JSON Schema
// ============================================================================

export interface ProductData {
  name: string;
  category: string;
  colors: string[];
  description: string;
  estimatedPriceUSD: string | null;
  confidence: number;
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
  };

  // Products (database-ready)
  products: ProductData[];

  // Visual Analysis
  visual: {
    dominantColors: string[];
    aestheticStyle: string;
    contentType: string;
    targetAudience: string;
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
  };
}

// ============================================================================
// Main Processor
// ============================================================================

export interface ProcessorOptions {
  frameInterval?: number; // Seconds between frames (default: 2)
  maxFrames?: number; // Max frames to analyze (default: 8)
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
  const { frameInterval = 2, maxFrames = 8, detailed = true } = options;

  console.log(`[Processor] Starting AI processing for: ${videoKey}`);
  const startTime = Date.now();

  // Step 1: Extract audio and frames in parallel
  console.log(`[Processor] Extracting audio and frames...`);
  const [audioBuffer, frameData] = await Promise.all([
    extractAudio(videoKey),
    extractFrames(videoKey, { interval: frameInterval, maxFrames }),
  ]);

  // Step 2: Transcribe audio
  console.log(`[Processor] Transcribing audio...`);
  const transcription = await transcribeWithWhisper(audioBuffer);

  // Step 3: Analyze frames with GPT-4o Vision
  console.log(`[Processor] Analyzing ${frameData.frames.length} frames...`);
  const visionAnalysis = await analyzeWithGPT4Vision(
    frameData.frames,
    transcription.text,
    detailed
  );

  // Step 4: Generate SEO data
  console.log(`[Processor] Generating SEO metadata...`);
  const seoData = await generateSEOData(
    transcription.text,
    visionAnalysis.products,
    visionAnalysis.visual
  );

  // Step 5: Analyze sentiment
  const sentiment = analyzeSentiment(transcription.text);

  const processingTime = Date.now() - startTime;
  console.log(`[Processor] Complete in ${processingTime}ms`);

  return {
    transcription: {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    },
    products: visionAnalysis.products,
    visual: visionAnalysis.visual,
    seo: seoData,
    sentiment,
    meta: {
      processedAt: new Date().toISOString(),
      framesAnalyzed: frameData.frames.length,
      audioDuration: frameData.duration,
      model: "gpt-4o + whisper-1",
    },
  };
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
    prompt: "E-commerce product video. May include: Thai, Vietnamese, Indonesian, Malay, English, Chinese.",
  });

  return {
    text: response.text,
    language: response.language || "unknown",
    duration: response.duration || 0,
  };
}

// ============================================================================
// Vision Analysis (GPT-4o)
// ============================================================================

const VISION_SYSTEM_PROMPT = `You are an expert e-commerce product analyst. Analyze video frames and extract structured product data.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, just JSON.

Required JSON schema:
{
  "products": [
    {
      "name": "Product name",
      "category": "Category (e.g., Skincare, Fashion, Electronics)",
      "colors": ["color1", "color2"],
      "description": "2-3 sentence product description",
      "estimatedPriceUSD": "$XX-$XX or null if unknown",
      "confidence": 0.0-1.0
    }
  ],
  "visual": {
    "dominantColors": ["color1", "color2", "color3"],
    "aestheticStyle": "Minimalist|Luxury|Casual|Professional|Playful|Vintage",
    "contentType": "Product Review|Unboxing|Tutorial|Lifestyle|Advertisement",
    "targetAudience": "e.g., Young Women 18-35, Tech Enthusiasts",
    "scenes": [
      {
        "timestamp": "Frame X",
        "description": "Scene description",
        "setting": "Indoor Studio|Outdoor|Home|Store",
        "mood": "Energetic|Calm|Professional|Fun"
      }
    ]
  }
}`;

async function analyzeWithGPT4Vision(
  frames: Buffer[],
  transcription: string,
  detailed: boolean
): Promise<{
  products: ProductData[];
  visual: ProcessedVideoData["visual"];
}> {
  // Select frames evenly
  const selectedFrames = selectEvenFrames(frames, detailed ? 8 : 4);

  const userPrompt = `Analyze these ${selectedFrames.length} video frames.

Transcription context: "${transcription.substring(0, 500)}${transcription.length > 500 ? "..." : ""}"

Extract all visible products with: name, category, colors, description, estimated price.
Describe the visual style, dominant colors, and scene settings.

Respond with JSON only.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          ...selectedFrames.map((frame, i) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString("base64")}`,
              detail: detailed ? "high" : ("low" as "high" | "low"),
            },
          })),
        ],
      },
    ],
    max_tokens: 2500,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    products: normalizeProducts(parsed.products || []),
    visual: normalizeVisual(parsed.visual || {}),
  };
}

function selectEvenFrames(frames: Buffer[], count: number): Buffer[] {
  if (frames.length <= count) return frames;
  const step = frames.length / count;
  return Array.from({ length: count }, (_, i) => frames[Math.floor(i * step)]);
}

function normalizeProducts(products: any[]): ProductData[] {
  return products.map((p) => ({
    name: p.name || "Unknown Product",
    category: p.category || "General",
    colors: Array.isArray(p.colors) ? p.colors : [],
    description: p.description || "",
    estimatedPriceUSD: p.estimatedPriceUSD || p.estimatedPrice || null,
    confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
  }));
}

function normalizeVisual(visual: any): ProcessedVideoData["visual"] {
  return {
    dominantColors: visual.dominantColors || [],
    aestheticStyle: visual.aestheticStyle || "Modern",
    contentType: visual.contentType || "Product Video",
    targetAudience: visual.targetAudience || "General",
    scenes: (visual.scenes || []).map((s: any) => ({
      timestamp: s.timestamp || "Unknown",
      description: s.description || "",
      setting: s.setting || "Unknown",
      mood: s.mood || "Neutral",
    })),
  };
}

// ============================================================================
// SEO Generation
// ============================================================================

async function generateSEOData(
  transcription: string,
  products: ProductData[],
  visual: ProcessedVideoData["visual"]
): Promise<ProcessedVideoData["seo"]> {
  const productNames = products.map((p) => p.name).join(", ");
  const categories = [...new Set(products.map((p) => p.category))].join(", ");
  const colors = [...new Set(products.flatMap((p) => p.colors))].join(", ");

  const prompt = `Generate SEO metadata for an e-commerce product video.

Products: ${productNames || "Various products"}
Categories: ${categories || "General"}
Colors: ${colors || "Various"}
Style: ${visual.aestheticStyle}
Content Type: ${visual.contentType}
Transcription excerpt: "${transcription.substring(0, 300)}"

Respond with JSON:
{
  "keywords": ["keyword1", "keyword2", ...] (10-15 search keywords),
  "tags": ["tag1", "tag2", ...] (5-8 hashtag-style tags),
  "title": "SEO-optimized title (60 chars max)",
  "description": "SEO-optimized description (160 chars max)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
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
// Sentiment Analysis
// ============================================================================

function analyzeSentiment(text: string): ProcessedVideoData["sentiment"] {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "love", "amazing", "great", "excellent", "perfect", "best", "recommend",
    "favorite", "beautiful", "awesome", "wonderful", "fantastic", "incredible",
    "must-have", "worth it", "impressed", "quality", "smooth", "soft", "effective"
  ];

  const negativeWords = [
    "bad", "terrible", "worst", "hate", "disappointed", "poor", "awful",
    "horrible", "waste", "don't buy", "not recommend", "cheap", "broke",
    "failed", "useless", "overpriced", "scam", "fake"
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
    score: Math.round((score + 1) * 50), // Normalize to 0-100
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
    models: {
      transcription: "whisper-1",
      vision: "gpt-4o",
      seo: "gpt-4o-mini",
    },
  };
}
