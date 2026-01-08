/**
 * Multi-Model Router
 *
 * Routes extraction tasks to the most cost-effective model:
 * - Complex vision (multi-frame, nuanced) → GPT-4o
 * - High-volume image tasks → Gemini 1.5 Flash (100x cheaper)
 * - Text-only tasks → GPT-4o-mini
 *
 * Based on research: GPT-4o-mini uses 2,833 tokens/image vs 85 for GPT-4o,
 * making it MORE expensive for image-heavy workloads. Gemini Flash is the
 * clear winner for bulk image processing.
 */

import OpenAI from "openai";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ============================================================================
// Types
// ============================================================================

export type ModelProvider = "openai" | "google";
export type ModelTier = "premium" | "standard" | "budget";

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  tier: ModelTier;
  inputCostPer1M: number;
  outputCostPer1M: number;
  supportsVision: boolean;
  supportsJSON: boolean;
}

export interface TaskResult<T> {
  data: T;
  cost: CostBreakdown;
  latencyMs: number;
}

export interface CostBreakdown {
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export type ExtractionTask =
  | "product_detection"      // Complex: Scan all frames, detect all products
  | "reference_extraction"   // Complex: Multi-frame attribute fusion
  | "visual_tiebreaker"      // Complex: Compare product to candidate
  | "candidate_extraction"   // High-volume: Extract attributes from product images
  | "hook_extraction"        // Medium: Analyze opening seconds
  | "content_analysis"       // Medium: Analyze themes, angles
  | "seo_generation"         // Simple: Text synthesis
  | "text_analysis";         // Simple: Sentiment, keywords

// ============================================================================
// Model Configurations
// ============================================================================

export const MODELS: Record<string, ModelConfig> = {
  // Premium tier - complex vision tasks
  "gpt-4o": {
    provider: "openai",
    model: "gpt-4o",
    tier: "premium",
    inputCostPer1M: 5.0,
    outputCostPer1M: 15.0,
    supportsVision: true,
    supportsJSON: true,
  },

  // Standard tier - balanced
  "gemini-1.5-pro": {
    provider: "google",
    model: "gemini-1.5-pro",
    tier: "standard",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.0,
    supportsVision: true,
    supportsJSON: true,
  },

  // Budget tier - high volume (using Gemini 2.0 Flash which is widely available)
  "gemini-1.5-flash": {
    provider: "google",
    model: "gemini-2.0-flash", // Gemini 2.0 Flash is the current stable version
    tier: "budget",
    inputCostPer1M: 0.10, // Updated pricing for 2.0
    outputCostPer1M: 0.40,
    supportsVision: true,
    supportsJSON: true,
  },

  // Budget tier - text only
  "gpt-4o-mini": {
    provider: "openai",
    model: "gpt-4o-mini",
    tier: "budget",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    supportsVision: true, // But NOT recommended for images!
    supportsJSON: true,
  },
};

// Task → Model mapping based on research
export const TASK_MODEL_MAP: Record<ExtractionTask, string> = {
  // Complex vision → GPT-4o (best quality, cascade prevention)
  product_detection: "gpt-4o",
  reference_extraction: "gpt-4o",
  visual_tiebreaker: "gpt-4o",

  // High-volume images → Gemini Flash (100x cheaper than GPT-4o-mini!)
  candidate_extraction: "gemini-1.5-flash",

  // Medium complexity → Gemini Flash (good enough, cheap)
  hook_extraction: "gemini-1.5-flash",
  content_analysis: "gemini-1.5-flash",

  // Text-only → GPT-4o-mini (cheapest for text)
  seo_generation: "gpt-4o-mini",
  text_analysis: "gpt-4o-mini",
};

// ============================================================================
// Model Router Class
// ============================================================================

export class ModelRouter {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private costLog: CostBreakdown[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.gemini = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY || ""
    );
  }

  /**
   * Get the recommended model for a task
   */
  getModelForTask(task: ExtractionTask): ModelConfig {
    const modelId = TASK_MODEL_MAP[task];
    return MODELS[modelId];
  }

  /**
   * Execute a vision task with the appropriate model
   */
  async executeVisionTask<T>(
    task: ExtractionTask,
    images: Buffer[],
    systemPrompt: string,
    userPrompt: string,
    schema?: object
  ): Promise<TaskResult<T>> {
    const modelConfig = this.getModelForTask(task);
    const startTime = Date.now();

    let result: TaskResult<T>;

    if (modelConfig.provider === "openai") {
      result = await this.executeOpenAIVision<T>(
        modelConfig,
        task,
        images,
        systemPrompt,
        userPrompt
      );
    } else {
      result = await this.executeGeminiVision<T>(
        modelConfig,
        task,
        images,
        systemPrompt,
        userPrompt,
        schema
      );
    }

    result.latencyMs = Date.now() - startTime;
    this.costLog.push(result.cost);

    return result;
  }

  /**
   * Execute a text-only task with the appropriate model
   */
  async executeTextTask<T>(
    task: ExtractionTask,
    systemPrompt: string,
    userPrompt: string
  ): Promise<TaskResult<T>> {
    const modelConfig = this.getModelForTask(task);
    const startTime = Date.now();

    let result: TaskResult<T>;

    if (modelConfig.provider === "openai") {
      result = await this.executeOpenAIText<T>(
        modelConfig,
        task,
        systemPrompt,
        userPrompt
      );
    } else {
      result = await this.executeGeminiText<T>(
        modelConfig,
        task,
        systemPrompt,
        userPrompt
      );
    }

    result.latencyMs = Date.now() - startTime;
    this.costLog.push(result.cost);

    return result;
  }

  /**
   * Get accumulated costs
   */
  getCosts(): CostBreakdown[] {
    return this.costLog;
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.costLog.reduce((sum, c) => sum + c.cost, 0);
  }

  /**
   * Reset cost tracking
   */
  resetCosts(): void {
    this.costLog = [];
  }

  // ============================================================================
  // OpenAI Implementation
  // ============================================================================

  private async executeOpenAIVision<T>(
    config: ModelConfig,
    task: ExtractionTask,
    images: Buffer[],
    systemPrompt: string,
    userPrompt: string
  ): Promise<TaskResult<T>> {
    const imageContent = images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${img.toString("base64")}`,
        detail: "high" as const,
      },
    }));

    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...imageContent,
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    const cost = this.calculateCost(config, inputTokens, outputTokens);

    return {
      data: JSON.parse(content) as T,
      cost: {
        model: config.model,
        task,
        inputTokens,
        outputTokens,
        cost,
      },
      latencyMs: 0,
    };
  }

  private async executeOpenAIText<T>(
    config: ModelConfig,
    task: ExtractionTask,
    systemPrompt: string,
    userPrompt: string
  ): Promise<TaskResult<T>> {
    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    const cost = this.calculateCost(config, inputTokens, outputTokens);

    return {
      data: JSON.parse(content) as T,
      cost: {
        model: config.model,
        task,
        inputTokens,
        outputTokens,
        cost,
      },
      latencyMs: 0,
    };
  }

  // ============================================================================
  // Gemini Implementation
  // ============================================================================

  private async executeGeminiVision<T>(
    config: ModelConfig,
    task: ExtractionTask,
    images: Buffer[],
    systemPrompt: string,
    userPrompt: string,
    schema?: object
  ): Promise<TaskResult<T>> {
    const model = this.gemini.getGenerativeModel({
      model: config.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const imageParts = images.map((img) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.toString("base64"),
      },
    }));

    const result = await model.generateContent([
      userPrompt,
      ...imageParts,
    ]);

    const response = result.response;
    const content = response.text();

    // Estimate tokens (Gemini doesn't always return exact counts)
    const inputTokens = response.usageMetadata?.promptTokenCount ||
      this.estimateTokens(systemPrompt + userPrompt) + (images.length * 500);
    const outputTokens = response.usageMetadata?.candidatesTokenCount ||
      this.estimateTokens(content);

    const cost = this.calculateCost(config, inputTokens, outputTokens);

    let parsedData: T;
    try {
      parsedData = JSON.parse(content) as T;
    } catch {
      console.error("[ModelRouter] Failed to parse Gemini response:", content);
      parsedData = {} as T;
    }

    return {
      data: parsedData,
      cost: {
        model: config.model,
        task,
        inputTokens,
        outputTokens,
        cost,
      },
      latencyMs: 0,
    };
  }

  private async executeGeminiText<T>(
    config: ModelConfig,
    task: ExtractionTask,
    systemPrompt: string,
    userPrompt: string
  ): Promise<TaskResult<T>> {
    const model = this.gemini.getGenerativeModel({
      model: config.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const content = response.text();

    const inputTokens = response.usageMetadata?.promptTokenCount ||
      this.estimateTokens(systemPrompt + userPrompt);
    const outputTokens = response.usageMetadata?.candidatesTokenCount ||
      this.estimateTokens(content);

    const cost = this.calculateCost(config, inputTokens, outputTokens);

    let parsedData: T;
    try {
      parsedData = JSON.parse(content) as T;
    } catch {
      console.error("[ModelRouter] Failed to parse Gemini response:", content);
      parsedData = {} as T;
    }

    return {
      data: parsedData,
      cost: {
        model: config.model,
        task,
        inputTokens,
        outputTokens,
        cost,
      },
      latencyMs: 0,
    };
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private calculateCost(
    config: ModelConfig,
    inputTokens: number,
    outputTokens: number
  ): number {
    const inputCost = (inputTokens / 1_000_000) * config.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * config.outputCostPer1M;
    return inputCost + outputCost;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let routerInstance: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}

// ============================================================================
// Status Check
// ============================================================================

export function isModelRouterReady(): { ready: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missing.push("OPENAI_API_KEY");
  }
  if (!process.env.GOOGLE_AI_API_KEY) {
    missing.push("GOOGLE_AI_API_KEY");
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}
