/**
 * API Route: /api/ai
 *
 * AI service status and manual processing trigger.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProcessorStatus, isProcessorReady } from "@/lib/ai/processor";
import { triggerAIProcessing } from "@/lib/queue/worker";
import { getJob } from "@/lib/store/job-store";

// Get AI service status
export async function GET() {
  const processorStatus = getProcessorStatus();

  return NextResponse.json({
    status: processorStatus.ready ? "ready" : "not_configured",
    models: processorStatus.models,
    outputSchema: {
      transcription: { text: "string", language: "string", duration: "number" },
      products: [{ name: "string", category: "string", colors: "string[]", description: "string", estimatedPriceUSD: "string", confidence: "number" }],
      visual: { dominantColors: "string[]", aestheticStyle: "string", contentType: "string", targetAudience: "string" },
      seo: { keywords: "string[]", tags: "string[]", title: "string", description: "string" },
      sentiment: { overall: "positive|negative|neutral", score: "0-100", highlights: "string[]" },
    },
    instructions: processorStatus.ready
      ? "AI processor is configured and ready. POST with { jobId } to process."
      : "Add OPENAI_API_KEY to .env.local to enable AI processing",
  });
}

// Manually trigger AI processing for a job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Trigger AI processing
    const result = await triggerAIProcessing(jobId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          jobId,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error("[AI API] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `AI processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
