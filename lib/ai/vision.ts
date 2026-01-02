/**
 * Vision Analysis Service
 *
 * Uses GPT-4o Vision to analyze video frames and extract:
 * - Products shown
 * - Colors and aesthetics
 * - Scene descriptions
 * - E-commerce relevant details
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProductInfo {
  name: string;
  category: string;
  colors: string[];
  estimatedPrice?: string;
  confidence: number;
}

export interface SceneInfo {
  description: string;
  setting: string;
  mood: string;
  lighting: string;
}

export interface VisionAnalysisResult {
  products: ProductInfo[];
  scenes: SceneInfo[];
  dominantColors: string[];
  aestheticStyle: string;
  contentType: string;
  targetAudience: string;
  keywords: string[];
  summary: string;
}

export interface VisionAnalysisOptions {
  maxFrames?: number; // Maximum frames to analyze (default: 5)
  detailed?: boolean; // More detailed analysis (default: false)
}

/**
 * Convert frame buffer to base64 data URL
 */
function frameToBase64(frame: Buffer): string {
  return `data:image/jpeg;base64,${frame.toString("base64")}`;
}

/**
 * Analyze video frames using GPT-4o Vision
 */
export async function analyzeFrames(
  frames: Buffer[],
  options: VisionAnalysisOptions = {}
): Promise<VisionAnalysisResult> {
  const { maxFrames = 5, detailed = false } = options;

  // Select frames evenly distributed across the video
  const selectedFrames = selectFrames(frames, maxFrames);

  console.log(`[Vision] Analyzing ${selectedFrames.length} frames with GPT-4o`);

  const systemPrompt = `You are an expert e-commerce product analyst specializing in social media video content from Southeast Asia (TikTok, Instagram Reels, Xiaohongshu).

Analyze the provided video frames and extract detailed information about:
1. Products shown (name, category, colors, estimated price range)
2. Scene descriptions (setting, mood, lighting)
3. Visual aesthetics and style
4. Target audience
5. Relevant keywords for e-commerce search

Focus on actionable insights for product catalog creation and SEO optimization.`;

  const userPrompt = detailed
    ? `Analyze these ${selectedFrames.length} frames from a product video in detail.

For each visible product, provide:
- Product name and category
- Colors and materials
- Estimated price range (in USD)
- Confidence score (0-1)

Also describe:
- Scene settings and mood
- Dominant colors throughout
- Overall aesthetic style
- Content type (review, unboxing, tutorial, lifestyle)
- Target audience demographics
- SEO keywords (minimum 10)

Respond in JSON format.`
    : `Analyze these ${selectedFrames.length} frames from a product video.

Extract:
- Products (name, category, colors)
- Dominant colors
- Aesthetic style
- Content type
- 5-10 keywords

Respond in JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...selectedFrames.map((frame) => ({
              type: "image_url" as const,
              image_url: {
                url: frameToBase64(frame),
                detail: detailed ? "high" : ("low" as "high" | "low"),
              },
            })),
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    console.log(`[Vision] Analysis complete`);

    // Normalize the response
    return normalizeVisionResult(parsed);
  } catch (error) {
    console.error("[Vision] Error:", error);
    throw error;
  }
}

/**
 * Select frames evenly distributed across the video
 */
function selectFrames(frames: Buffer[], maxFrames: number): Buffer[] {
  if (frames.length <= maxFrames) {
    return frames;
  }

  const step = frames.length / maxFrames;
  const selected: Buffer[] = [];

  for (let i = 0; i < maxFrames; i++) {
    const index = Math.floor(i * step);
    selected.push(frames[index]);
  }

  return selected;
}

/**
 * Normalize GPT response to consistent format
 */
function normalizeVisionResult(parsed: any): VisionAnalysisResult {
  return {
    products: (parsed.products || []).map((p: any) => ({
      name: p.name || "Unknown Product",
      category: p.category || "General",
      colors: Array.isArray(p.colors) ? p.colors : [p.color || "Unknown"],
      estimatedPrice: p.estimatedPrice || p.price || p.priceRange,
      confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
    })),
    scenes: (parsed.scenes || []).map((s: any) => ({
      description: s.description || "",
      setting: s.setting || "Unknown",
      mood: s.mood || "Neutral",
      lighting: s.lighting || "Natural",
    })),
    dominantColors: parsed.dominantColors || parsed.colors || [],
    aestheticStyle: parsed.aestheticStyle || parsed.style || "Modern",
    contentType: parsed.contentType || parsed.type || "Product Video",
    targetAudience: parsed.targetAudience || parsed.audience || "General",
    keywords: parsed.keywords || parsed.tags || [],
    summary:
      parsed.summary ||
      `Product video featuring ${(parsed.products || []).length} item(s)`,
  };
}

/**
 * Quick analysis for thumbnail/preview generation
 */
export async function quickAnalyze(frame: Buffer): Promise<{
  description: string;
  mainProduct: string;
  mood: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Briefly describe this product image in one sentence. What's the main product? What's the mood?",
          },
          {
            type: "image_url",
            image_url: {
              url: frameToBase64(frame),
              detail: "low",
            },
          },
        ],
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || "";

  return {
    description: content,
    mainProduct: extractMainProduct(content),
    mood: extractMood(content),
  };
}

/**
 * Extract main product from description
 */
function extractMainProduct(description: string): string {
  // Simple extraction - could be improved with NLP
  const productPatterns = [
    /(?:shows?|features?|displays?|presents?)\s+(?:a|an|the)?\s*([^,.]+)/i,
    /(?:product|item|goods?):\s*([^,.]+)/i,
    /^([^,.]+?)(?:\s+is|\s+are|\s+with)/i,
  ];

  for (const pattern of productPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "Product";
}

/**
 * Extract mood from description
 */
function extractMood(description: string): string {
  const moodKeywords: Record<string, string[]> = {
    Professional: ["professional", "corporate", "formal", "business"],
    Casual: ["casual", "relaxed", "everyday", "simple"],
    Luxurious: ["luxury", "premium", "elegant", "sophisticated"],
    Playful: ["fun", "playful", "colorful", "vibrant"],
    Minimalist: ["minimal", "clean", "simple", "modern"],
    Warm: ["warm", "cozy", "inviting", "comfortable"],
  };

  const lowerDesc = description.toLowerCase();

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      return mood;
    }
  }

  return "Neutral";
}

/**
 * Check if Vision API is configured
 */
export function isVisionConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get vision service status
 */
export function getVisionStatus(): {
  configured: boolean;
  model: string;
  provider: string;
} {
  return {
    configured: isVisionConfigured(),
    model: "gpt-4o",
    provider: "OpenAI",
  };
}
