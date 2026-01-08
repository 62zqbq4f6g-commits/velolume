/**
 * Engagement Scraper v1.0
 *
 * Captures engagement metrics alongside video download.
 * Uses platform APIs for metrics + yt-dlp for reliable video download.
 *
 * Supported platforms:
 * - TikTok: views, likes, comments, shares, saves
 * - Instagram: views, likes, comments
 * - YouTube: views, likes, comments
 */

import { spawn, execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { detectPlatform, Platform, PlatformInfo } from "./platforms";

const YTDLP_PATH = "/opt/homebrew/bin/yt-dlp";
const TMP_DIR = join(process.cwd(), "tmp", "scraper");

// =============================================================================
// TYPES
// =============================================================================

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  // Calculated metrics
  engagementRate: number; // (likes + comments + shares) / views * 100
  likeToViewRatio: number;
  commentToViewRatio: number;
  // Raw data timestamp
  scrapedAt: Date;
}

export interface VideoInfo {
  platform: Platform;
  videoId: string;
  url: string;
  // Content metadata
  title: string;
  description: string;
  author: {
    username: string;
    displayName: string;
    followers?: number;
    verified?: boolean;
  };
  // Video metadata
  duration: number;
  uploadDate?: Date;
  hashtags: string[];
  mentions: string[];
  // Audio info (for TikTok)
  sound?: {
    id: string;
    name: string;
    author: string;
    isOriginal: boolean;
  };
  // Engagement
  engagement: EngagementMetrics;
}

export interface ScrapeResult {
  success: boolean;
  videoInfo?: VideoInfo;
  localPath?: string;
  error?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR, { recursive: true });
  }
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u4e00-\u9fff]+/g) || [];
  return [...new Set(matches.map(t => t.toLowerCase()))];
}

function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w.]+/g) || [];
  return [...new Set(matches.map(m => m.toLowerCase()))];
}

function calculateEngagementRate(metrics: Partial<EngagementMetrics>): number {
  const { views = 0, likes = 0, comments = 0, shares = 0 } = metrics;
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

// =============================================================================
// TIKTOK SCRAPER
// =============================================================================

async function scrapeTikTok(url: string): Promise<VideoInfo> {
  // Use tikwm.com API for metadata and engagement
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || "Failed to fetch TikTok data");
  }

  const v = data.data;
  const text = v.title || "";

  const engagement: EngagementMetrics = {
    views: v.play_count || 0,
    likes: v.digg_count || 0,
    comments: v.comment_count || 0,
    shares: v.share_count || 0,
    saves: v.collect_count || 0,
    engagementRate: 0,
    likeToViewRatio: 0,
    commentToViewRatio: 0,
    scrapedAt: new Date(),
  };

  engagement.engagementRate = calculateEngagementRate(engagement);
  engagement.likeToViewRatio = engagement.views > 0 ? (engagement.likes / engagement.views) * 100 : 0;
  engagement.commentToViewRatio = engagement.views > 0 ? (engagement.comments / engagement.views) * 100 : 0;

  return {
    platform: "tiktok",
    videoId: v.id || "",
    url,
    title: v.title || "",
    description: v.title || "",
    author: {
      username: v.author?.unique_id || "",
      displayName: v.author?.nickname || "",
      followers: v.author?.follower_count,
      verified: v.author?.verified,
    },
    duration: v.duration || 0,
    uploadDate: v.create_time ? new Date(v.create_time * 1000) : undefined,
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
    sound: v.music
      ? {
          id: v.music.id || "",
          name: v.music.title || "",
          author: v.music.author || "",
          isOriginal: v.music.original || false,
        }
      : undefined,
    engagement,
  };
}

// =============================================================================
// INSTAGRAM SCRAPER
// =============================================================================

async function scrapeInstagram(url: string): Promise<VideoInfo> {
  // Extract shortcode
  const match = url.match(/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error("Could not extract Instagram post ID");
  }
  const shortcode = match[1];

  // Use yt-dlp to get metadata (more reliable for Instagram)
  const metadataJson = execSync(
    `${YTDLP_PATH} --dump-json --no-download "${url}" 2>/dev/null`,
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
  );

  const meta = JSON.parse(metadataJson);
  const text = meta.description || meta.title || "";

  const engagement: EngagementMetrics = {
    views: meta.view_count || 0,
    likes: meta.like_count || 0,
    comments: meta.comment_count || 0,
    shares: 0, // Instagram doesn't expose shares
    saves: 0, // Instagram doesn't expose saves publicly
    engagementRate: 0,
    likeToViewRatio: 0,
    commentToViewRatio: 0,
    scrapedAt: new Date(),
  };

  engagement.engagementRate = calculateEngagementRate(engagement);
  engagement.likeToViewRatio = engagement.views > 0 ? (engagement.likes / engagement.views) * 100 : 0;
  engagement.commentToViewRatio = engagement.views > 0 ? (engagement.comments / engagement.views) * 100 : 0;

  return {
    platform: "instagram",
    videoId: shortcode,
    url,
    title: meta.title || "",
    description: text,
    author: {
      username: meta.uploader_id || meta.channel || "",
      displayName: meta.uploader || meta.channel || "",
      followers: meta.channel_follower_count,
      verified: false,
    },
    duration: meta.duration || 0,
    uploadDate: meta.upload_date ? parseYtDlpDate(meta.upload_date) : undefined,
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
    engagement,
  };
}

// =============================================================================
// YOUTUBE SCRAPER
// =============================================================================

async function scrapeYouTube(url: string): Promise<VideoInfo> {
  // Extract video ID
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error("Could not extract YouTube video ID");
  }
  const videoId = match[1];

  // Use yt-dlp to get metadata
  const metadataJson = execSync(
    `${YTDLP_PATH} --dump-json --no-download "${url}" 2>/dev/null`,
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
  );

  const meta = JSON.parse(metadataJson);
  const text = meta.description || meta.title || "";

  const engagement: EngagementMetrics = {
    views: meta.view_count || 0,
    likes: meta.like_count || 0,
    comments: meta.comment_count || 0,
    shares: 0, // YouTube doesn't expose shares
    saves: 0, // Not applicable
    engagementRate: 0,
    likeToViewRatio: 0,
    commentToViewRatio: 0,
    scrapedAt: new Date(),
  };

  engagement.engagementRate = calculateEngagementRate(engagement);
  engagement.likeToViewRatio = engagement.views > 0 ? (engagement.likes / engagement.views) * 100 : 0;
  engagement.commentToViewRatio = engagement.views > 0 ? (engagement.comments / engagement.views) * 100 : 0;

  return {
    platform: "youtube",
    videoId,
    url,
    title: meta.title || "",
    description: text,
    author: {
      username: meta.uploader_id || meta.channel_id || "",
      displayName: meta.uploader || meta.channel || "",
      followers: meta.channel_follower_count,
      verified: meta.channel_is_verified,
    },
    duration: meta.duration || 0,
    uploadDate: meta.upload_date ? parseYtDlpDate(meta.upload_date) : undefined,
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
    engagement,
  };
}

function parseYtDlpDate(dateStr: string): Date | undefined {
  // yt-dlp returns dates as YYYYMMDD
  if (dateStr && dateStr.length === 8) {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month, day);
  }
  return undefined;
}

// =============================================================================
// MAIN SCRAPER FUNCTION
// =============================================================================

/**
 * Scrape video with full engagement metrics
 * Downloads video locally and returns metadata + engagement
 */
export async function scrapeWithEngagement(
  url: string,
  downloadVideo = true
): Promise<ScrapeResult> {
  ensureTmpDir();

  const platformInfo = detectPlatform(url);

  if (platformInfo.platform === "unknown") {
    return {
      success: false,
      error: "Unsupported platform",
    };
  }

  try {
    // Get video info and engagement
    let videoInfo: VideoInfo;

    switch (platformInfo.platform) {
      case "tiktok":
        videoInfo = await scrapeTikTok(url);
        break;
      case "instagram":
        videoInfo = await scrapeInstagram(url);
        break;
      case "youtube":
        videoInfo = await scrapeYouTube(url);
        break;
      default:
        throw new Error("Unsupported platform");
    }

    // Download video if requested
    let localPath: string | undefined;
    if (downloadVideo) {
      const videoPath = join(TMP_DIR, `${videoInfo.videoId}.mp4`);

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(YTDLP_PATH, [
          "-f", "best[ext=mp4]/best",
          "--no-playlist",
          "-o", videoPath,
          "--no-warnings",
          url,
        ]);

        proc.on("close", (code) => {
          if (code === 0 && existsSync(videoPath)) {
            resolve();
          } else {
            reject(new Error("Video download failed"));
          }
        });

        proc.on("error", reject);
      });

      localPath = videoPath;
    }

    return {
      success: true,
      videoInfo,
      localPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Scrape engagement only (no video download)
 * Faster for bulk data collection
 */
export async function scrapeEngagementOnly(url: string): Promise<ScrapeResult> {
  return scrapeWithEngagement(url, false);
}

// =============================================================================
// CATEGORY/HASHTAG SEARCH
// =============================================================================

export interface SearchResult {
  videos: VideoInfo[];
  searchQuery: string;
  platform: Platform;
  scrapedAt: Date;
}

/**
 * Get TikTok challenge ID from hashtag name
 */
async function getTikTokChallengeId(hashtag: string): Promise<string | null> {
  const tag = hashtag.replace(/^#/, "");
  const apiUrl = `https://www.tikwm.com/api/challenge/info?challenge_name=${encodeURIComponent(tag)}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.data?.id || null;
}

/**
 * Search TikTok by hashtag
 * Uses tikwm.com challenge API (two-step: get ID, then fetch posts)
 */
export async function searchTikTokByHashtag(
  hashtag: string,
  count: number = 30
): Promise<VideoInfo[]> {
  const tag = hashtag.replace(/^#/, "");

  // First, get the challenge ID
  const challengeId = await getTikTokChallengeId(tag);
  if (!challengeId) {
    throw new Error(`Could not find challenge ID for hashtag: ${tag}`);
  }

  const apiUrl = `https://www.tikwm.com/api/challenge/posts?challenge_id=${challengeId}&count=${count}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok search API failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 0 || !data.data?.videos) {
    throw new Error(data.msg || "No videos found");
  }

  const videos: VideoInfo[] = [];

  for (const v of data.data.videos) {
    const text = v.title || "";

    const engagement: EngagementMetrics = {
      views: v.play_count || 0,
      likes: v.digg_count || 0,
      comments: v.comment_count || 0,
      shares: v.share_count || 0,
      saves: v.collect_count || 0,
      engagementRate: 0,
      likeToViewRatio: 0,
      commentToViewRatio: 0,
      scrapedAt: new Date(),
    };

    engagement.engagementRate = calculateEngagementRate(engagement);
    engagement.likeToViewRatio = engagement.views > 0 ? (engagement.likes / engagement.views) * 100 : 0;
    engagement.commentToViewRatio = engagement.views > 0 ? (engagement.comments / engagement.views) * 100 : 0;

    videos.push({
      platform: "tiktok",
      videoId: v.video_id || v.id || "",
      url: `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.video_id}`,
      title: v.title || "",
      description: v.title || "",
      author: {
        username: v.author?.unique_id || "",
        displayName: v.author?.nickname || "",
        followers: v.author?.follower_count,
        verified: v.author?.verified,
      },
      duration: v.duration || 0,
      uploadDate: v.create_time ? new Date(v.create_time * 1000) : undefined,
      hashtags: extractHashtags(text),
      mentions: extractMentions(text),
      sound: v.music
        ? {
            id: v.music.id || "",
            name: v.music.title || "",
            author: v.music.author || "",
            isOriginal: v.music.original || false,
          }
        : undefined,
      engagement,
    });
  }

  return videos;
}

/**
 * Search across multiple hashtags and combine results
 */
export async function searchByHashtags(
  hashtags: string[],
  platform: Platform = "tiktok",
  countPerHashtag: number = 30
): Promise<VideoInfo[]> {
  const allVideos: VideoInfo[] = [];
  const seenIds = new Set<string>();

  for (const hashtag of hashtags) {
    try {
      let videos: VideoInfo[] = [];

      if (platform === "tiktok") {
        videos = await searchTikTokByHashtag(hashtag, countPerHashtag);
      }
      // TODO: Add Instagram and YouTube hashtag search

      // Deduplicate
      for (const video of videos) {
        if (!seenIds.has(video.videoId)) {
          seenIds.add(video.videoId);
          allVideos.push(video);
        }
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.warn(`Failed to search hashtag ${hashtag}:`, error);
    }
  }

  // Sort by views (top performing first)
  allVideos.sort((a, b) => b.engagement.views - a.engagement.views);

  return allVideos;
}

// =============================================================================
// UTILITIES
// =============================================================================

export function isEngagementScraperReady(): boolean {
  try {
    execSync(`${YTDLP_PATH} --version`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getEngagementScraperStatus() {
  return {
    ready: isEngagementScraperReady(),
    ytdlpPath: YTDLP_PATH,
    supportedPlatforms: ["tiktok", "instagram", "youtube"],
    capabilities: [
      "Full engagement metrics (views, likes, comments, shares, saves)",
      "Author metadata (username, followers, verified)",
      "Content metadata (title, description, hashtags)",
      "Audio/sound info (TikTok)",
      "Hashtag search (TikTok)",
      "Engagement rate calculation",
    ],
  };
}
