import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// DigitalOcean Spaces configuration (S3-compatible)
const s3Client = new S3Client({
  endpoint: "https://sgp1.digitaloceanspaces.com",
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_ID,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.SPACES_BUCKET || "auto-storefront-media";
const URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename) {
      return Response.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = randomUUID();
    const extension = filename.split(".").pop() || "mp4";
    const key = `raw/${fileId}.${extension}`;

    // Create the PUT command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || "video/mp4",
    });

    // Generate signed URL (expires in 15 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: URL_EXPIRY_SECONDS,
    });

    return Response.json({
      success: true,
      fileId,
      key,
      signedUrl,
      expiresIn: URL_EXPIRY_SECONDS,
      bucket: BUCKET_NAME,
      endpoint: `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`,
      // Client should call this after successful upload to enqueue processing
      confirmUrl: "/api/upload/confirm",
      confirmPayload: { fileId, key },
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return Response.json(
      { error: "Failed to generate signed URL", details: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return Response.json({
    status: "ok",
    service: "upload-sign",
    bucket: BUCKET_NAME,
    region: "sgp1",
  });
}
