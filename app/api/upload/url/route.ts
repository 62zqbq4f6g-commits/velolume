/**
 * API Route: /api/upload/url
 *
 * Accepts a social video URL, scrapes the video (no watermark),
 * and uploads it directly to DigitalOcean Spaces.
 *
 * Supported platforms: TikTok, Instagram, YouTube Shorts, Xiaohongshu
 */

import { NextRequest, NextResponse } from "next/server";
import { scrapeAndUpload, validateUrl } from "@/lib/scraper/video-scraper";
import { getPlatformDisplayName } from "@/lib/scraper/platforms";
import { enqueueVideoJob } from "@/lib/queue/video-queue";

export const maxDuration = 60; // Allow up to 60 seconds for video processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    console.log(`[Scraper] Processing ${getPlatformDisplayName(validation.platform!)} URL: ${url}`);

    // Scrape and upload
    const result = await scrapeAndUpload(url);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          platform: result.platform,
        },
        { status: 422 }
      );
    }

    console.log(`[Scraper] Successfully uploaded: ${result.key} (${result.size} bytes)`);

    // Enqueue for processing
    const job = await enqueueVideoJob({
      fileId: result.fileId,
      key: result.key,
      bucket: "auto-storefront-media",
      source: "scrape",
      platform: result.platform,
      originalUrl: result.originalUrl,
      size: result.size,
      contentType: "video/mp4",
    });

    console.log(`[Scraper] Job queued: ${job.id} (status: ${job.status})`);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      jobId: job.id,
      jobStatus: job.status,
      key: result.key,
      platform: result.platform,
      originalUrl: result.originalUrl,
      endpoint: result.endpoint,
      size: result.size,
    });
  } catch (error) {
    console.error("[Scraper] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Scraper error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

// Health check and supported platforms info
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "video-scraper",
    supportedPlatforms: [
      { id: "tiktok", name: "TikTok", example: "https://www.tiktok.com/@user/video/123" },
      { id: "instagram", name: "Instagram", example: "https://www.instagram.com/reel/ABC123" },
      { id: "youtube", name: "YouTube Shorts", example: "https://youtube.com/shorts/ABC123" },
      { id: "xiaohongshu", name: "Xiaohongshu (RED)", example: "https://www.xiaohongshu.com/explore/123" },
    ],
    usage: {
      method: "POST",
      body: { url: "string (required)" },
      example: {
        url: "https://www.tiktok.com/@user/video/7123456789",
      },
    },
  });
}
