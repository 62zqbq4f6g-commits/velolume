/**
 * API Route: /api/queue/worker
 *
 * Worker endpoint that processes queued video jobs.
 * Called by Upstash QStash in production, or directly in development.
 */

import { NextRequest, NextResponse } from "next/server";
import { processVideoJob } from "@/lib/queue/worker";
import { verifyQStashSignature, QueueJobPayload } from "@/lib/queue/video-queue";

export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("upstash-signature");
    const isLocalDev = request.headers.get("x-local-dev") === "true";

    // Verify signature in production
    if (!isLocalDev && process.env.NODE_ENV === "production") {
      const isValid = await verifyQStashSignature(signature, body);
      if (!isValid) {
        console.error("[Worker] Invalid QStash signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload: QueueJobPayload = JSON.parse(body);

    console.log(`[Worker] Received job: ${payload.jobId}`);

    // Process the job
    const result = await processVideoJob(payload);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          jobId: result.jobId,
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
    console.error("[Worker] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Worker error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "video-worker",
    mode: process.env.QSTASH_TOKEN ? "qstash" : "local",
  });
}
