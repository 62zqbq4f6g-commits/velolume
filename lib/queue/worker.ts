/**
 * Video Processing Worker
 *
 * Handles queued video jobs with full AI processing pipeline:
 * 1. Updates status to "processing"
 * 2. Runs unified AI processor (transcription + vision)
 * 3. Stores structured JSON results
 * 4. Marks as completed
 */

import { getJob, updateJob, updateJobStatus, VideoJob } from "@/lib/store/job-store";
import { QueueJobPayload } from "./video-queue";
import { processVideo, isProcessorReady, ProcessedVideoData } from "@/lib/ai/processor";
import { createStoreFromJob } from "@/lib/store/store-creator";

export interface WorkerResult {
  success: boolean;
  jobId: string;
  status: string;
  message: string;
  data?: ProcessedVideoData;
}

/**
 * Process a video job
 */
export async function processVideoJob(payload: QueueJobPayload): Promise<WorkerResult> {
  const { jobId, action, data } = payload;

  console.log(`[Worker] Processing job ${jobId} - action: ${action}`);

  // Get the job from store
  const job = getJob(jobId);

  if (!job) {
    console.error(`[Worker] Job ${jobId} not found`);
    return {
      success: false,
      jobId,
      status: "error",
      message: "Job not found in store",
    };
  }

  // Update status to processing
  updateJobStatus(jobId, "processing");

  try {
    switch (action) {
      case "process_video":
        return await handleProcessVideo(job, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Worker] Job ${jobId} failed:`, errorMessage);

    updateJobStatus(jobId, "failed", errorMessage);

    return {
      success: false,
      jobId,
      status: "failed",
      message: errorMessage,
    };
  }
}

/**
 * Handle video processing with unified AI pipeline
 */
async function handleProcessVideo(
  job: VideoJob,
  data: QueueJobPayload["data"]
): Promise<WorkerResult> {
  const { fileId, key, source, platform } = data;

  console.log(`[Worker] Processing video: ${key}`);
  console.log(`[Worker] Source: ${source}, Platform: ${platform || "direct upload"}`);

  // Mark as uploaded (video is in S3)
  updateJobStatus(fileId, "uploaded");

  // Check if AI processor is ready
  if (!isProcessorReady()) {
    console.log(`[Worker] AI processor not ready - OPENAI_API_KEY not set`);

    updateJob(fileId, {
      status: "uploaded",
      metadata: {
        ...job.metadata,
        title: job.metadata?.title,
        author: job.metadata?.author,
      },
      analysis: {
        products: [],
        keywords: [],
        sentiment: undefined,
      },
    });

    return {
      success: true,
      jobId: fileId,
      status: "uploaded",
      message: "Video uploaded. Set OPENAI_API_KEY to enable AI processing.",
    };
  }

  // Run AI pipeline
  try {
    // Update status for transcription phase
    updateJobStatus(fileId, "transcribing");

    // Process with unified AI processor v2.0
    console.log(`[Worker] Starting AI processing v2.0 for ${fileId}`);
    const processedData = await processVideo(key, {
      maxFrames: 12,
      detailed: true,
    });

    // Update status for analysis phase
    updateJobStatus(fileId, "analyzing");

    // Store results in job
    updateJob(fileId, {
      status: "completed",
      transcription: processedData.transcription.text,
      metadata: {
        ...job.metadata,
        duration: processedData.transcription.duration,
        title: processedData.seo.title,
      },
      analysis: {
        products: processedData.products.map((p) => p.name),
        keywords: processedData.seo.keywords,
        sentiment: processedData.sentiment.overall,
        // Full structured data for database
        visionData: {
          dominantColors: processedData.visual.dominantColors,
          aestheticStyle: processedData.visual.aestheticStyle,
          contentType: processedData.visual.contentType,
          targetAudience: processedData.visual.targetAudience,
          setting: processedData.visual.setting,
          lighting: processedData.visual.lighting,
          productDetails: processedData.products,
          productCounts: processedData.productCounts,
          scenes: processedData.visual.scenes,
          summary: processedData.seo.description,
        },
        // Additional structured data
        seo: processedData.seo,
        sentimentData: processedData.sentiment,
        processingMeta: processedData.meta,
      },
    });

    console.log(`[Worker] Job ${fileId} completed successfully`);
    console.log(`[Worker] Found ${processedData.products.length} products (${processedData.productCounts.clothing} clothing, ${processedData.productCounts.accessories} accessories, ${processedData.productCounts.jewelry} jewelry, ${processedData.productCounts.beauty} beauty)`);
    console.log(`[Worker] Generated ${processedData.seo.keywords.length} keywords`);

    // Auto-create store from processed data
    try {
      const store = await createStoreFromJob(fileId, processedData);
      console.log(`[Worker] Auto-created store: ${store.id} - ${store.name}`);
    } catch (storeError) {
      console.error(`[Worker] Failed to create store:`, storeError);
      // Don't fail the job if store creation fails
    }

    return {
      success: true,
      jobId: fileId,
      status: "completed",
      message: `Processed: ${processedData.products.length} products, sentiment: ${processedData.sentiment.overall}`,
      data: processedData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Worker] AI processing failed for ${fileId}:`, errorMessage);

    // Still mark as uploaded so it can be retried
    updateJob(fileId, {
      status: "uploaded",
      error: `AI processing failed: ${errorMessage}`,
    });

    return {
      success: false,
      jobId: fileId,
      status: "uploaded",
      message: `AI processing failed: ${errorMessage}. Video is uploaded and can be retried.`,
    };
  }
}

/**
 * Trigger AI processing for an existing job
 */
export async function triggerAIProcessing(jobId: string): Promise<WorkerResult> {
  const job = getJob(jobId);

  if (!job) {
    return {
      success: false,
      jobId,
      status: "error",
      message: "Job not found",
    };
  }

  if (!isProcessorReady()) {
    return {
      success: false,
      jobId,
      status: "error",
      message: "AI processor not ready. Set OPENAI_API_KEY in .env.local",
    };
  }

  return handleProcessVideo(job, {
    fileId: job.id,
    key: job.key,
    bucket: job.bucket,
    source: job.source,
    platform: job.platform,
    originalUrl: job.originalUrl,
    size: job.size,
  });
}
