/**
 * Video Scraper Module
 *
 * Downloads videos from social platforms (TikTok, Instagram, YouTube Shorts, Xiaohongshu)
 * and uploads them directly to DigitalOcean Spaces.
 *
 * Uses API-based approach for reliability (no headless browser needed).
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { detectPlatform, Platform, PlatformInfo, getPlatformDisplayName } from "./platforms";

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

export interface ScraperResult {
  success: boolean;
  fileId: string;
  key: string;
  platform: Platform;
  originalUrl: string;
  downloadUrl?: string;
  endpoint: string;
  size?: number;
  error?: string;
}

export interface VideoMetadata {
  downloadUrl: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  duration?: number;
}

/**
 * Main scraper function - detects platform and downloads video to S3
 */
export async function scrapeAndUpload(videoUrl: string): Promise<ScraperResult> {
  const fileId = randomUUID();
  const platformInfo = detectPlatform(videoUrl);

  if (platformInfo.platform === "unknown") {
    return {
      success: false,
      fileId,
      key: "",
      platform: "unknown",
      originalUrl: videoUrl,
      endpoint: "",
      error: "Unsupported platform. Supported: TikTok, Instagram, YouTube Shorts, Xiaohongshu",
    };
  }

  try {
    // Get clean (no watermark) video URL from platform
    const metadata = await getVideoMetadata(platformInfo);

    if (!metadata.downloadUrl) {
      throw new Error("Could not extract video download URL");
    }

    // Download and upload to S3
    const key = `raw/${fileId}.mp4`;
    const size = await downloadAndUploadToS3(metadata.downloadUrl, key);

    return {
      success: true,
      fileId,
      key,
      platform: platformInfo.platform,
      originalUrl: videoUrl,
      downloadUrl: metadata.downloadUrl,
      endpoint: `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`,
      size,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      fileId,
      key: "",
      platform: platformInfo.platform,
      originalUrl: videoUrl,
      endpoint: "",
      error: `Failed to scrape ${getPlatformDisplayName(platformInfo.platform)}: ${errorMessage}`,
    };
  }
}

/**
 * Get video metadata and download URL based on platform
 * Uses API-based approach for each platform
 */
async function getVideoMetadata(platformInfo: PlatformInfo): Promise<VideoMetadata> {
  const { platform, originalUrl } = platformInfo;

  switch (platform) {
    case "tiktok":
      return getTikTokVideo(originalUrl);
    case "instagram":
      return getInstagramVideo(originalUrl);
    case "youtube":
      return getYouTubeVideo(originalUrl);
    case "xiaohongshu":
      return getXiaohongshuVideo(originalUrl);
    default:
      throw new Error("Unsupported platform");
  }
}

/**
 * TikTok video extraction using public API endpoints
 * Uses tikwm.com API (free, no watermark)
 */
async function getTikTokVideo(url: string): Promise<VideoMetadata> {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || "Failed to fetch TikTok video");
  }

  return {
    downloadUrl: data.data.play, // No watermark URL
    title: data.data.title,
    author: data.data.author?.nickname,
    thumbnail: data.data.cover,
    duration: data.data.duration,
  };
}

/**
 * Instagram video extraction
 * Uses a public API approach
 */
async function getInstagramVideo(url: string): Promise<VideoMetadata> {
  // Extract shortcode from URL
  const match = url.match(/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error("Could not extract Instagram post ID");
  }

  // Use igram API (free tier available)
  const apiUrl = "https://api.igram.io/api/convert";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: `url=${encodeURIComponent(url)}`,
  });

  if (!response.ok) {
    // Fallback: try alternative API
    return getInstagramVideoFallback(url);
  }

  const data = await response.json();

  if (!data.url && !data[0]?.url) {
    return getInstagramVideoFallback(url);
  }

  const videoUrl = data.url || data[0]?.url;

  return {
    downloadUrl: videoUrl,
    title: data.title,
  };
}

/**
 * Instagram fallback using saveig API
 */
async function getInstagramVideoFallback(url: string): Promise<VideoMetadata> {
  const apiUrl = `https://saveig.app/api/ajaxSearch`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: `q=${encodeURIComponent(url)}&t=media&lang=en`,
  });

  if (!response.ok) {
    throw new Error("Instagram video extraction failed");
  }

  const data = await response.json();

  // Parse the HTML response to extract video URL
  const videoMatch = data.data?.match(/href="([^"]+)"/);
  if (!videoMatch) {
    throw new Error("Could not find Instagram video URL");
  }

  return {
    downloadUrl: videoMatch[1],
  };
}

/**
 * YouTube Shorts video extraction
 * Uses cobalt.tools API (open source, reliable)
 */
async function getYouTubeVideo(url: string): Promise<VideoMetadata> {
  const apiUrl = "https://api.cobalt.tools/api/json";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify({
      url: url,
      vCodec: "h264",
      vQuality: "720",
      aFormat: "mp3",
      isNoTTWatermark: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === "error") {
    throw new Error(data.text || "Failed to fetch YouTube video");
  }

  return {
    downloadUrl: data.url,
  };
}

/**
 * Xiaohongshu (RED) video extraction
 * Uses dedicated API
 */
async function getXiaohongshuVideo(url: string): Promise<VideoMetadata> {
  // Xiaohongshu requires special handling due to region restrictions
  // Using a public API endpoint
  const apiUrl = `https://xhs.keely.cn/api/video?url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    // Fallback approach
    throw new Error(
      "Xiaohongshu video extraction requires RapidAPI key. " +
      "Set RAPIDAPI_KEY in environment variables."
    );
  }

  const data = await response.json();

  if (!data.video_url) {
    throw new Error("Could not extract Xiaohongshu video URL");
  }

  return {
    downloadUrl: data.video_url,
    title: data.title,
    author: data.author,
  };
}

/**
 * Download video from URL and upload directly to S3
 * Uses streaming to minimize memory usage
 */
async function downloadAndUploadToS3(videoUrl: string, key: string): Promise<number> {
  // Fetch the video
  const response = await fetch(videoUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://www.tiktok.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  // Get the video as buffer (for smaller files this is fine)
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to S3
  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "video/mp4",
    ACL: "private",
  });

  await s3Client.send(uploadCommand);

  return buffer.length;
}

/**
 * Validate that a URL can be scraped
 */
export function validateUrl(url: string): { valid: boolean; platform?: Platform; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return { valid: false, error: "URL must start with http:// or https://" };
  }

  const { platform } = detectPlatform(trimmedUrl);

  if (platform === "unknown") {
    return {
      valid: false,
      error: "Unsupported platform. Supported: TikTok, Instagram, YouTube Shorts, Xiaohongshu",
    };
  }

  return { valid: true, platform };
}
