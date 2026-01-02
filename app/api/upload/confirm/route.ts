/**
 * API Route: /api/upload/confirm
 *
 * Called after a client completes a direct upload using a signed URL.
 * Verifies the upload and enqueues the video for processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { enqueueVideoJob } from "@/lib/queue/video-queue";

const s3Client = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT || "https://sgp1.digitaloceanspaces.com",
  region: process.env.SPACES_REGION || "sgp1",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_ID!,
    secretAccessKey: process.env.SPACES_SECRET_KEY!,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.SPACES_BUCKET || "auto-storefront-media";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, key } = body;

    if (!fileId || !key) {
      return NextResponse.json(
        { error: "fileId and key are required" },
        { status: 400 }
      );
    }

    // Verify the file exists in S3
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const headResult = await s3Client.send(headCommand);

      // File exists - enqueue for processing
      const job = await enqueueVideoJob({
        fileId,
        key,
        bucket: BUCKET_NAME,
        source: "direct",
        size: headResult.ContentLength,
        contentType: headResult.ContentType || "video/mp4",
      });

      console.log(`[Confirm] Upload confirmed and queued: ${fileId}`);

      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: job.status,
        message: "Upload confirmed and queued for processing",
        file: {
          key,
          size: headResult.ContentLength,
          contentType: headResult.ContentType,
        },
      });
    } catch (s3Error: any) {
      if (s3Error.name === "NotFound" || s3Error.$metadata?.httpStatusCode === 404) {
        return NextResponse.json(
          { error: "File not found in storage. Upload may have failed." },
          { status: 404 }
        );
      }
      throw s3Error;
    }
  } catch (error) {
    console.error("[Confirm] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Confirmation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "upload-confirm",
    bucket: BUCKET_NAME,
  });
}
