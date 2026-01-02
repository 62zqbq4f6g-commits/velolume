/**
 * Platform detection utilities for social video URLs
 */

export type Platform = "tiktok" | "instagram" | "youtube" | "xiaohongshu" | "unknown";

export interface PlatformInfo {
  platform: Platform;
  videoId: string | null;
  originalUrl: string;
}

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  tiktok: [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
    /(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/(\w+)/i,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/(\w+)/i,
  ],
  instagram: [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i,
    /(?:https?:\/\/)?(?:www\.)?instagr\.am\/(?:p|reel)\/([A-Za-z0-9_-]+)/i,
  ],
  youtube: [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i,
    /(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i,
  ],
  xiaohongshu: [
    /(?:https?:\/\/)?(?:www\.)?xiaohongshu\.com\/(?:explore|discovery\/item)\/([a-f0-9]+)/i,
    /(?:https?:\/\/)?xhslink\.com\/(\w+)/i,
  ],
  unknown: [],
};

export function detectPlatform(url: string): PlatformInfo {
  const normalizedUrl = url.trim();

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === "unknown") continue;

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match) {
        return {
          platform: platform as Platform,
          videoId: match[1] || null,
          originalUrl: normalizedUrl,
        };
      }
    }
  }

  return {
    platform: "unknown",
    videoId: null,
    originalUrl: normalizedUrl,
  };
}

export function isValidVideoUrl(url: string): boolean {
  const { platform } = detectPlatform(url);
  return platform !== "unknown";
}

export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube: "YouTube Shorts",
    xiaohongshu: "Xiaohongshu (RED)",
    unknown: "Unknown",
  };
  return names[platform];
}
