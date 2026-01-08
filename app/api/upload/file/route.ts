/**
 * API Route: POST /api/upload/file
 *
 * Direct video file upload endpoint.
 * Accepts MP4, MOV, WebM files up to 100MB.
 * Uploads directly to S3, skipping the scraper step.
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { enqueueVideoJob } from "@/lib/queue/video-queue";

// S3 Client for DigitalOcean Spaces
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

// Allowed file types and max size
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"];
const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!ALLOWED_TYPES.includes(fileType) && !hasValidExtension) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${fileType}. Allowed: MP4, MOV, WebM`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_SIZE_MB}MB`,
        },
        { status: 400 }
      );
    }

    // Generate file ID and key
    const fileId = randomUUID();
    const extension = fileName.match(/\.(mp4|mov|webm)$/i)?.[0] || ".mp4";
    const key = `raw/${fileId}${extension}`;

    console.log(`[Upload] Processing direct upload: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    console.log(`[Upload] Uploading to S3: ${key}`);
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: fileType || "video/mp4",
      ACL: "private",
    });

    await s3Client.send(uploadCommand);
    console.log(`[Upload] Successfully uploaded: ${key} (${buffer.length} bytes)`);

    // Create job and enqueue for processing
    const job = await enqueueVideoJob({
      fileId,
      key,
      bucket: BUCKET_NAME,
      source: "direct",
      platform: "direct",
      originalUrl: `file://${fileName}`,
      size: buffer.length,
      contentType: fileType || "video/mp4",
    });

    console.log(`[Upload] Job created and queued: ${fileId} (status: ${job.status})`);

    return NextResponse.json({
      success: true,
      fileId,
      jobId: fileId,
      jobStatus: job.status || "queued",
      key,
      fileName: file.name,
      fileSize: buffer.length,
      fileSizeMB: (buffer.length / 1024 / 1024).toFixed(2),
      endpoint: `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`,
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Return upload requirements
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/upload/file",
    method: "POST",
    contentType: "multipart/form-data",
    field: "file",
    allowedTypes: ALLOWED_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxSizeMB: MAX_SIZE_MB,
    maxSizeBytes: MAX_SIZE_BYTES,
  });
}
