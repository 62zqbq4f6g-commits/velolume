/**
 * Video Queue Service
 *
 * Uses Upstash QStash for serverless job processing.
 * No dedicated worker server needed - QStash calls our API endpoints.
 *
 * For local development, we use a simple in-process queue.
 */

import { Client } from "@upstash/qstash";
import { createJob, updateJobStatus, VideoJob, JobStatus } from "@/lib/store/job-store";

// QStash client (only initialized if credentials are available)
const qstashClient = process.env.QSTASH_TOKEN
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null;

// Worker endpoint URL
const WORKER_URL = process.env.WORKER_URL || "http://localhost:3000/api/queue/worker";

export interface QueueJobPayload {
  jobId: string;
  action: "process_video";
  data: {
    fileId: string;
    key: string;
    bucket: string;
    source: "direct" | "scrape";
    platform?: string;
    originalUrl?: string;
    size?: number;
  };
}

/**
 * Add a video processing job to the queue
 */
export async function enqueueVideoJob(payload: {
  fileId: string;
  key: string;
  bucket: string;
  source: "direct" | "scrape";
  platform?: string;
  originalUrl?: string;
  size?: number;
  contentType?: string;
}): Promise<VideoJob> {
  const { fileId, key, bucket, source, platform, originalUrl, size, contentType } = payload;

  // Create job record in store
  const job = createJob({
    id: fileId,
    status: "queued",
    source,
    platform,
    originalUrl,
    key,
    bucket,
    endpoint: `https://${bucket}.sgp1.digitaloceanspaces.com/${key}`,
    size,
    contentType: contentType || "video/mp4",
  });

  // Queue the job
  const queuePayload: QueueJobPayload = {
    jobId: fileId,
    action: "process_video",
    data: {
      fileId,
      key,
      bucket,
      source,
      platform,
      originalUrl,
      size,
    },
  };

  if (qstashClient && process.env.NODE_ENV === "production") {
    // Production: Use QStash
    try {
      await qstashClient.publishJSON({
        url: WORKER_URL,
        body: queuePayload,
        retries: 3,
        delay: 0,
      });
      console.log(`[Queue] Job ${fileId} enqueued via QStash`);
    } catch (error) {
      console.error(`[Queue] Failed to enqueue job ${fileId}:`, error);
      updateJobStatus(fileId, "failed", "Failed to enqueue job");
      throw error;
    }
  } else {
    // Development: Use local processing
    console.log(`[Queue] Job ${fileId} queued locally (dev mode)`);
    // Trigger local worker asynchronously
    processJobLocally(queuePayload).catch((err) => {
      console.error(`[Queue] Local processing failed for ${fileId}:`, err);
    });
  }

  return job;
}

/**
 * Local job processing for development
 */
async function processJobLocally(payload: QueueJobPayload): Promise<void> {
  const { jobId } = payload;

  // Small delay to simulate queue behavior
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Call the worker endpoint locally
    const response = await fetch(`http://localhost:3000/api/queue/worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-local-dev": "true", // Skip signature verification in dev
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Worker returned ${response.status}: ${error}`);
    }

    console.log(`[Queue] Local job ${jobId} processed successfully`);
  } catch (error) {
    console.error(`[Queue] Local job ${jobId} failed:`, error);
    updateJobStatus(jobId, "failed", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Get queue status
 */
export function getQueueInfo(): {
  mode: "qstash" | "local";
  workerUrl: string;
  configured: boolean;
} {
  return {
    mode: qstashClient ? "qstash" : "local",
    workerUrl: WORKER_URL,
    configured: !!qstashClient,
  };
}

/**
 * Verify QStash webhook signature (for production)
 */
export async function verifyQStashSignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!qstashClient || !process.env.QSTASH_CURRENT_SIGNING_KEY) {
    // In development, allow local requests
    return true;
  }

  if (!signature) {
    return false;
  }

  try {
    const { Receiver } = await import("@upstash/qstash");
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
    });

    await receiver.verify({
      signature,
      body,
    });

    return true;
  } catch {
    return false;
  }
}
