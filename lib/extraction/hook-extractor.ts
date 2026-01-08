/**
 * Hook Extractor v1.0
 *
 * Analyzes the opening seconds of video content to extract and classify hooks.
 * Adapts hook window based on content type:
 * - Short-form (<60s): 0-3 seconds
 * - Long-form (>60s): 0-15 seconds (primary hook 0-5s)
 * - Image/Carousel: First frame
 *
 * Uses Claim<T> wrapper with evidence for all extracted data.
 */

import OpenAI from "openai";
import {
  Claim,
  Evidence,
  ClaimSource,
  createClaim,
  createFrameEvidence,
  createTranscriptEvidence,
} from "@/lib/types/product-claims";

// =============================================================================
// TYPES
// =============================================================================

export type HookType =
  | "question"        // "Have you ever...?"
  | "statement"       // "I found the best..."
  | "pov"             // "POV: you just..."
  | "controversy"     // "Unpopular opinion..."
  | "teaser"          // "Wait for it..."
  | "listicle"        // "5 things you need..."
  | "problem"         // "Struggling with...?"
  | "visual_hook"     // Striking visual, pattern interrupt
  | "trend_sound"     // Using trending audio as hook
  | "story"           // "Story time..."
  | "result_first"    // Showing outcome/transformation upfront
  | "direct_value"    // "In this video you'll learn..."
  | "unknown";

export type AudioType =
  | "trending_sound"  // Popular/viral audio
  | "original_audio"  // Creator's own audio
  | "voiceover"       // Narration over visuals
  | "music_only"      // Background music, no speech
  | "silent"          // No audio
  | "mixed";          // Combination

export type ContentType =
  | "short_form"      // TikTok, Reels, Shorts (<60s)
  | "long_form"       // YouTube, Vimeo (>60s)
  | "image"           // Single image
  | "carousel";       // Multiple images

export interface HookWindow {
  startSeconds: number;
  endSeconds: number;
  primaryEndSeconds: number;  // For long-form, the critical first 5s
  contentType: ContentType;
}

export interface HookElements {
  transcript: Claim<string | null>;
  textOverlay: Claim<string | null>;
  visualDescription: Claim<string>;
  audioType: Claim<AudioType>;
}

export interface EffectivenessBreakdown {
  clarityOfPromise: number;      // 0-25: Does viewer know what they'll get?
  patternInterrupt: number;      // 0-25: Does it stop the scroll?
  speedToValue: number;          // 0-25: How fast does payoff come?
  contentAlignment: number;      // 0-25: Does hook match content type?
  reasoning: string;
}

export interface HookAnalysis {
  // Classification
  hookType: Claim<HookType>;
  secondaryHookType: Claim<HookType | null>;  // Some hooks combine types

  // Content
  elements: HookElements;

  // Effectiveness
  effectivenessScore: Claim<number>;
  effectivenessBreakdown: EffectivenessBreakdown;

  // Metadata
  hookWindow: HookWindow;
  framesAnalyzed: number;
  modelVersion: string;
  extractedAt: Date;
  processingTimeMs: number;
}

export interface HookExtractionInput {
  // Video metadata
  videoDuration: number;         // In seconds
  contentType?: ContentType;     // Optional, will be inferred from duration

  // Frames from hook window
  frames: Buffer[];
  frameTimestamps: number[];     // Timestamp for each frame

  // Transcript (if available)
  transcript?: string;
  transcriptSegments?: {
    start: number;
    end: number;
    text: string;
  }[];

  // Content ID for evidence linking
  contentId?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const HOOK_WINDOWS = {
  short_form: { start: 0, end: 3, primaryEnd: 3 },
  long_form: { start: 0, end: 15, primaryEnd: 5 },
  image: { start: 0, end: 0, primaryEnd: 0 },
  carousel: { start: 0, end: 0, primaryEnd: 0 },
};

const HOOK_TYPE_PATTERNS: Record<HookType, string[]> = {
  question: ["have you", "did you know", "what if", "why do", "how do", "ever wonder", "?"],
  statement: ["i found", "this is the", "here's", "let me show", "i discovered", "best way to"],
  pov: ["pov:", "pov", "point of view"],
  controversy: ["unpopular opinion", "hot take", "controversial", "no one talks about", "the truth about"],
  teaser: ["wait for it", "watch till the end", "you won't believe", "stay tuned", "keep watching"],
  listicle: ["things you", "ways to", "tips for", "reasons why", "steps to", "5 ", "3 ", "10 ", "7 "],
  problem: ["struggling with", "tired of", "can't figure out", "frustrated", "problem with"],
  visual_hook: [],  // Detected visually
  trend_sound: [],  // Detected via audio analysis
  story: ["story time", "storytime", "let me tell you", "so this happened", "you won't believe what"],
  result_first: ["the result", "before and after", "transformation", "final look", "end result"],
  direct_value: ["in this video", "today i'll show", "by the end", "you'll learn", "i'll teach you"],
  unknown: [],
};

const MODEL_VERSION = "gpt-4o-2024-01-25";

// =============================================================================
// OPENAI CLIENT
// =============================================================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// =============================================================================
// HOOK WINDOW DETECTION
// =============================================================================

/**
 * Determine the appropriate hook window based on content type and duration
 */
export function getHookWindow(
  videoDuration: number,
  contentType?: ContentType
): HookWindow {
  // Infer content type from duration if not provided
  const inferredType = contentType || (videoDuration <= 60 ? "short_form" : "long_form");

  const config = HOOK_WINDOWS[inferredType];

  return {
    startSeconds: config.start,
    endSeconds: Math.min(config.end, videoDuration),
    primaryEndSeconds: Math.min(config.primaryEnd, videoDuration),
    contentType: inferredType,
  };
}

/**
 * Filter frames to only those within the hook window
 */
export function filterFramesToHookWindow(
  frames: Buffer[],
  frameTimestamps: number[],
  hookWindow: HookWindow
): { frames: Buffer[]; timestamps: number[]; indices: number[] } {
  const filtered: { frames: Buffer[]; timestamps: number[]; indices: number[] } = {
    frames: [],
    timestamps: [],
    indices: [],
  };

  for (let i = 0; i < frames.length; i++) {
    const timestamp = frameTimestamps[i];
    if (timestamp >= hookWindow.startSeconds && timestamp <= hookWindow.endSeconds) {
      filtered.frames.push(frames[i]);
      filtered.timestamps.push(timestamp);
      filtered.indices.push(i);
    }
  }

  // Ensure we have at least 1 frame (the first one)
  if (filtered.frames.length === 0 && frames.length > 0) {
    filtered.frames.push(frames[0]);
    filtered.timestamps.push(frameTimestamps[0] || 0);
    filtered.indices.push(0);
  }

  return filtered;
}

/**
 * Extract transcript within hook window
 */
export function getTranscriptInWindow(
  segments: { start: number; end: number; text: string }[] | undefined,
  hookWindow: HookWindow
): string | null {
  if (!segments || segments.length === 0) return null;

  const relevantSegments = segments.filter(
    (seg) => seg.start <= hookWindow.endSeconds && seg.end >= hookWindow.startSeconds
  );

  if (relevantSegments.length === 0) return null;

  return relevantSegments.map((seg) => seg.text).join(" ").trim();
}

// =============================================================================
// HOOK TYPE DETECTION (Pattern-based pre-classification)
// =============================================================================

/**
 * Pre-classify hook type based on transcript patterns
 * This runs before GPT-4o to provide hints
 */
function preClassifyHookType(transcript: string | null): HookType[] {
  if (!transcript) return [];

  const lowerTranscript = transcript.toLowerCase();
  const matches: HookType[] = [];

  for (const [hookType, patterns] of Object.entries(HOOK_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerTranscript.includes(pattern.toLowerCase())) {
        matches.push(hookType as HookType);
        break;
      }
    }
  }

  return matches;
}

// =============================================================================
// GPT-4o HOOK ANALYSIS
// =============================================================================

const HOOK_ANALYSIS_PROMPT = `You are an expert content strategist analyzing video hooks. A "hook" is the opening of a video designed to capture attention and stop viewers from scrolling.

HOOK WINDOW CONTEXT:
- Content Type: {contentType}
- Hook Window: {startSeconds}s - {endSeconds}s
- Primary Hook: 0 - {primaryEndSeconds}s (most critical)

TRANSCRIPT IN HOOK WINDOW:
{transcript}

PATTERN HINTS (from text analysis):
{patternHints}

Analyze the opening frames and classify the hook.

HOOK TYPES (choose primary + optional secondary):
- question: Opens with a question ("Have you ever...?")
- statement: Bold claim or discovery ("I found the best...")
- pov: Point of view scenario ("POV: you just...")
- controversy: Provocative/contrarian take ("Unpopular opinion...")
- teaser: Promise of payoff later ("Wait for it...")
- listicle: Numbered list format ("5 things you need...")
- problem: Addresses pain point ("Struggling with...?")
- visual_hook: Striking visual that creates curiosity (no text needed)
- trend_sound: Uses recognizable trending audio as the hook
- story: Narrative opening ("Story time...")
- result_first: Shows outcome/transformation immediately
- direct_value: Explicitly states what viewer will learn

EFFECTIVENESS SCORING (0-100 total):
1. Clarity of Promise (0-25): Does viewer immediately know what they'll get?
2. Pattern Interrupt (0-25): How well does it stop the scroll? (unusual, surprising, striking)
3. Speed to Value (0-25): How fast does the promise/payoff arrive?
4. Content Alignment (0-25): Does hook style match content type? (short-form = punchy, long-form = can build)

Respond with JSON only:
{
  "hookType": "primary hook type",
  "secondaryHookType": "secondary type or null",
  "hookTypeConfidence": 0.0-1.0,
  "textOverlay": "exact on-screen text if visible, or null",
  "visualDescription": "1-2 sentence description of visual hook elements",
  "audioType": "trending_sound|original_audio|voiceover|music_only|silent|mixed",
  "effectiveness": {
    "clarityOfPromise": 0-25,
    "patternInterrupt": 0-25,
    "speedToValue": 0-25,
    "contentAlignment": 0-25,
    "reasoning": "2-3 sentences explaining the scores"
  }
}`;

async function analyzeHookWithGPT4o(
  frames: Buffer[],
  hookWindow: HookWindow,
  transcript: string | null,
  patternHints: HookType[]
): Promise<{
  hookType: HookType;
  secondaryHookType: HookType | null;
  confidence: number;
  textOverlay: string | null;
  visualDescription: string;
  audioType: AudioType;
  effectiveness: EffectivenessBreakdown;
}> {
  const openai = getOpenAI();

  const prompt = HOOK_ANALYSIS_PROMPT
    .replace("{contentType}", hookWindow.contentType)
    .replace("{startSeconds}", hookWindow.startSeconds.toString())
    .replace("{endSeconds}", hookWindow.endSeconds.toString())
    .replace("{primaryEndSeconds}", hookWindow.primaryEndSeconds.toString())
    .replace("{transcript}", transcript || "(No transcript in hook window)")
    .replace("{patternHints}", patternHints.length > 0 ? patternHints.join(", ") : "None detected");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...frames.slice(0, 4).map((frame) => ({  // Limit to 4 frames for cost
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.toString("base64")}`,
              detail: "high" as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 800,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[HookExtractor] Failed to parse GPT-4o response:", content);
    parsed = {};
  }

  // Validate and normalize response
  const validHookTypes = new Set([
    "question", "statement", "pov", "controversy", "teaser", "listicle",
    "problem", "visual_hook", "trend_sound", "story", "result_first", "direct_value", "unknown"
  ]);

  const validAudioTypes = new Set([
    "trending_sound", "original_audio", "voiceover", "music_only", "silent", "mixed"
  ]);

  return {
    hookType: validHookTypes.has(parsed.hookType) ? parsed.hookType : "unknown",
    secondaryHookType: parsed.secondaryHookType && validHookTypes.has(parsed.secondaryHookType)
      ? parsed.secondaryHookType
      : null,
    confidence: typeof parsed.hookTypeConfidence === "number"
      ? Math.min(Math.max(parsed.hookTypeConfidence, 0), 1)
      : 0.7,
    textOverlay: parsed.textOverlay || null,
    visualDescription: parsed.visualDescription || "Visual content analyzed",
    audioType: validAudioTypes.has(parsed.audioType) ? parsed.audioType : "mixed",
    effectiveness: {
      clarityOfPromise: Math.min(Math.max(parsed.effectiveness?.clarityOfPromise || 15, 0), 25),
      patternInterrupt: Math.min(Math.max(parsed.effectiveness?.patternInterrupt || 15, 0), 25),
      speedToValue: Math.min(Math.max(parsed.effectiveness?.speedToValue || 15, 0), 25),
      contentAlignment: Math.min(Math.max(parsed.effectiveness?.contentAlignment || 15, 0), 25),
      reasoning: parsed.effectiveness?.reasoning || "Analysis complete",
    },
  };
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract and analyze the hook from video content
 */
export async function extractHook(input: HookExtractionInput): Promise<HookAnalysis> {
  const startTime = Date.now();

  console.log(`[HookExtractor] Starting analysis for ${input.videoDuration}s video`);

  // Step 1: Determine hook window
  const hookWindow = getHookWindow(input.videoDuration, input.contentType);
  console.log(`[HookExtractor] Hook window: ${hookWindow.startSeconds}-${hookWindow.endSeconds}s (${hookWindow.contentType})`);

  // Step 2: Filter frames to hook window
  const filteredFrames = filterFramesToHookWindow(
    input.frames,
    input.frameTimestamps,
    hookWindow
  );
  console.log(`[HookExtractor] Using ${filteredFrames.frames.length} frames in hook window`);

  // Step 3: Get transcript in hook window
  const hookTranscript = getTranscriptInWindow(input.transcriptSegments, hookWindow);

  // Step 4: Pre-classify based on patterns
  const patternHints = preClassifyHookType(hookTranscript || input.transcript || null);

  // Step 5: Analyze with GPT-4o
  const analysis = await analyzeHookWithGPT4o(
    filteredFrames.frames,
    hookWindow,
    hookTranscript || input.transcript || null,
    patternHints
  );

  const processingTime = Date.now() - startTime;
  const now = new Date();

  // Step 6: Build evidence
  const frameEvidence: Evidence[] = filteredFrames.indices.map((idx, i) =>
    createFrameEvidence(idx, filteredFrames.timestamps[i], input.contentId)
  );

  const transcriptEvidence: Evidence[] = hookTranscript
    ? [createTranscriptEvidence(hookTranscript, hookWindow.startSeconds, hookWindow.endSeconds, input.contentId)]
    : [];

  const allEvidence = [...frameEvidence, ...transcriptEvidence];

  // Step 7: Calculate overall effectiveness score
  const effectivenessTotal =
    analysis.effectiveness.clarityOfPromise +
    analysis.effectiveness.patternInterrupt +
    analysis.effectiveness.speedToValue +
    analysis.effectiveness.contentAlignment;

  // Step 8: Build output with Claim<T> wrappers
  const result: HookAnalysis = {
    hookType: {
      value: analysis.hookType,
      confidence: Math.round(analysis.confidence * 100),
      evidence: allEvidence,
      source: "auto" as ClaimSource,
      modelVersion: MODEL_VERSION,
      extractedAt: now,
    },
    secondaryHookType: {
      value: analysis.secondaryHookType,
      confidence: analysis.secondaryHookType ? Math.round(analysis.confidence * 80) : 0,
      evidence: allEvidence,
      source: "auto" as ClaimSource,
      modelVersion: MODEL_VERSION,
      extractedAt: now,
    },
    elements: {
      transcript: {
        value: hookTranscript,
        confidence: hookTranscript ? 95 : 0,
        evidence: transcriptEvidence,
        source: "auto" as ClaimSource,
        modelVersion: "whisper-1",
        extractedAt: now,
      },
      textOverlay: {
        value: analysis.textOverlay,
        confidence: analysis.textOverlay ? Math.round(analysis.confidence * 100) : 0,
        evidence: frameEvidence,
        source: "auto" as ClaimSource,
        modelVersion: MODEL_VERSION,
        extractedAt: now,
      },
      visualDescription: {
        value: analysis.visualDescription,
        confidence: Math.round(analysis.confidence * 100),
        evidence: frameEvidence,
        source: "auto" as ClaimSource,
        modelVersion: MODEL_VERSION,
        extractedAt: now,
      },
      audioType: {
        value: analysis.audioType,
        confidence: Math.round(analysis.confidence * 90),
        evidence: allEvidence,
        source: "auto" as ClaimSource,
        modelVersion: MODEL_VERSION,
        extractedAt: now,
      },
    },
    effectivenessScore: {
      value: effectivenessTotal,
      confidence: Math.round(analysis.confidence * 100),
      evidence: allEvidence,
      source: "auto" as ClaimSource,
      modelVersion: MODEL_VERSION,
      extractedAt: now,
    },
    effectivenessBreakdown: analysis.effectiveness,
    hookWindow,
    framesAnalyzed: filteredFrames.frames.length,
    modelVersion: MODEL_VERSION,
    extractedAt: now,
    processingTimeMs: processingTime,
  };

  console.log(`[HookExtractor] Complete in ${processingTime}ms - Type: ${analysis.hookType}, Score: ${effectivenessTotal}/100`);

  return result;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

export interface BatchHookResult {
  contentId: string;
  duration: number;
  contentType: ContentType;
  hookType: HookType;
  secondaryHookType: HookType | null;
  effectivenessScore: number;
  breakdown: EffectivenessBreakdown;
  success: boolean;
  error?: string;
}

/**
 * Extract hooks from multiple videos
 */
export async function extractHooksBatch(
  inputs: (HookExtractionInput & { contentId: string })[]
): Promise<{
  results: BatchHookResult[];
  summary: {
    total: number;
    successful: number;
    hookTypeDistribution: Record<HookType, number>;
    avgEffectiveness: number;
    effectivenessRange: { min: number; max: number };
    shortFormCount: number;
    longFormCount: number;
  };
}> {
  const results: BatchHookResult[] = [];
  const hookTypeCounts: Record<HookType, number> = {
    question: 0, statement: 0, pov: 0, controversy: 0, teaser: 0,
    listicle: 0, problem: 0, visual_hook: 0, trend_sound: 0,
    story: 0, result_first: 0, direct_value: 0, unknown: 0,
  };

  let totalEffectiveness = 0;
  let minEffectiveness = 100;
  let maxEffectiveness = 0;
  let successCount = 0;
  let shortFormCount = 0;
  let longFormCount = 0;

  for (const input of inputs) {
    try {
      const analysis = await extractHook(input);

      const effectivenessScore = analysis.effectivenessScore.value;
      hookTypeCounts[analysis.hookType.value]++;
      totalEffectiveness += effectivenessScore;
      minEffectiveness = Math.min(minEffectiveness, effectivenessScore);
      maxEffectiveness = Math.max(maxEffectiveness, effectivenessScore);
      successCount++;

      if (analysis.hookWindow.contentType === "short_form") {
        shortFormCount++;
      } else if (analysis.hookWindow.contentType === "long_form") {
        longFormCount++;
      }

      results.push({
        contentId: input.contentId,
        duration: input.videoDuration,
        contentType: analysis.hookWindow.contentType,
        hookType: analysis.hookType.value,
        secondaryHookType: analysis.secondaryHookType.value,
        effectivenessScore,
        breakdown: analysis.effectivenessBreakdown,
        success: true,
      });

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      results.push({
        contentId: input.contentId,
        duration: input.videoDuration,
        contentType: input.contentType || (input.videoDuration <= 60 ? "short_form" : "long_form"),
        hookType: "unknown",
        secondaryHookType: null,
        effectivenessScore: 0,
        breakdown: {
          clarityOfPromise: 0,
          patternInterrupt: 0,
          speedToValue: 0,
          contentAlignment: 0,
          reasoning: `Error: ${error}`,
        },
        success: false,
        error: String(error),
      });
    }
  }

  return {
    results,
    summary: {
      total: inputs.length,
      successful: successCount,
      hookTypeDistribution: hookTypeCounts,
      avgEffectiveness: successCount > 0 ? Math.round(totalEffectiveness / successCount) : 0,
      effectivenessRange: {
        min: successCount > 0 ? minEffectiveness : 0,
        max: successCount > 0 ? maxEffectiveness : 0,
      },
      shortFormCount,
      longFormCount,
    },
  };
}

// =============================================================================
// STATUS CHECK
// =============================================================================

export function isHookExtractorReady(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getHookExtractorStatus() {
  return {
    ready: isHookExtractorReady(),
    version: "1.0.0",
    model: MODEL_VERSION,
    hookTypes: Object.keys(HOOK_TYPE_PATTERNS),
    hookWindows: HOOK_WINDOWS,
    capabilities: [
      "Adaptive hook window (short-form: 0-3s, long-form: 0-15s)",
      "12 hook type classifications",
      "Effectiveness scoring (4 dimensions, 0-100)",
      "Claim<T> wrapper with evidence",
      "Transcript + visual + audio analysis",
      "Pattern pre-classification",
      "Batch processing support",
    ],
  };
}
