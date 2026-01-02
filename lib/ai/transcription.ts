/**
 * Transcription Service
 *
 * Uses OpenAI Whisper API to transcribe video audio.
 * Supports multiple languages and returns timestamped segments.
 */

import OpenAI from "openai";
import { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
}

export interface TranscriptionOptions {
  language?: string; // ISO-639-1 code (e.g., "en", "zh", "th")
  prompt?: string; // Context to improve accuracy
  temperature?: number; // 0-1, higher = more creative
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const { language, prompt, temperature = 0 } = options;

  console.log(`[Transcription] Starting transcription (${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

  try {
    // Create file from buffer
    const audioFile = await toFile(audioBuffer, "audio.mp3", {
      type: "audio/mpeg",
    });

    // Call Whisper API with verbose_json for segments
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language,
      prompt,
      temperature,
      response_format: "verbose_json",
    });

    console.log(`[Transcription] Complete. Language: ${response.language}`);

    // Parse segments from response
    const segments: TranscriptionSegment[] = (response.segments || []).map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    return {
      text: response.text,
      language: response.language || "unknown",
      duration: response.duration || 0,
      segments,
    };
  } catch (error) {
    console.error("[Transcription] Error:", error);
    throw error;
  }
}

/**
 * Transcribe with auto-detected language and SEA market optimization
 */
export async function transcribeForSEA(
  audioBuffer: Buffer
): Promise<TranscriptionResult> {
  // Common prompt for SEA e-commerce content
  const seaPrompt = `
    This is an e-commerce product video from Southeast Asia.
    Common terms: TikTok Shop, Shopee, Lazada, product review, unboxing.
    May include: Thai, Vietnamese, Indonesian, Malay, Tagalog, or English.
  `.trim();

  return transcribeAudio(audioBuffer, {
    prompt: seaPrompt,
    temperature: 0,
  });
}

/**
 * Check if OpenAI API is configured
 */
export function isTranscriptionConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get transcription service status
 */
export function getTranscriptionStatus(): {
  configured: boolean;
  model: string;
  provider: string;
} {
  return {
    configured: isTranscriptionConfigured(),
    model: "whisper-1",
    provider: "OpenAI",
  };
}
