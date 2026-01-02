/**
 * Frame Extractor Service
 *
 * Uses ffmpeg to extract frames from videos for vision analysis.
 * Extracts one frame every 2 seconds.
 */

import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { existsSync, mkdirSync, unlinkSync, readdirSync, readFileSync } from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { writeFile, unlink, mkdir, readdir } from "fs/promises";

// Set ffmpeg path for Homebrew installation
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_PATH = "/opt/homebrew/bin/ffprobe";

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

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
const TMP_DIR = join(process.cwd(), "tmp");
const FRAMES_DIR = join(TMP_DIR, "frames");

export interface ExtractedFrames {
  frames: Buffer[];
  frameCount: number;
  duration: number;
  fps: number;
}

export interface FrameExtractionOptions {
  interval?: number; // Seconds between frames (default: 2)
  maxFrames?: number; // Maximum number of frames to extract (default: 15)
  format?: "jpg" | "png"; // Output format (default: jpg)
  quality?: number; // JPEG quality 1-31, lower is better (default: 2)
}

/**
 * Ensure temp directories exist
 */
async function ensureTempDirs(): Promise<void> {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
  if (!existsSync(FRAMES_DIR)) {
    await mkdir(FRAMES_DIR, { recursive: true });
  }
}

/**
 * Download video from S3 to local temp file
 */
async function downloadVideoFromS3(key: string): Promise<string> {
  await ensureTempDirs();

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;

  // Generate temp filename
  const tempPath = join(TMP_DIR, `video-${Date.now()}.mp4`);

  // Write stream to file
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  await writeFile(tempPath, Buffer.concat(chunks));

  return tempPath;
}

/**
 * Get video duration using ffprobe
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Extract frames from video at specified interval
 */
export async function extractFrames(
  key: string,
  options: FrameExtractionOptions = {}
): Promise<ExtractedFrames> {
  const {
    interval = 2,
    maxFrames = 15,
    format = "jpg",
    quality = 2,
  } = options;

  console.log(`[FrameExtractor] Extracting frames from: ${key}`);

  let videoPath: string | null = null;
  const frameDir = join(FRAMES_DIR, `job-${Date.now()}`);

  try {
    // Download video from S3
    videoPath = await downloadVideoFromS3(key);
    console.log(`[FrameExtractor] Downloaded video to: ${videoPath}`);

    // Get video duration
    const duration = await getVideoDuration(videoPath);
    console.log(`[FrameExtractor] Video duration: ${duration}s`);

    // Create frame output directory
    await mkdir(frameDir, { recursive: true });

    // Calculate FPS for extraction (1 frame every N seconds)
    const fps = 1 / interval;

    // Extract frames
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath!)
        .outputOptions([
          `-vf fps=${fps}`, // Extract at specified interval
          `-q:v ${quality}`, // Quality setting
          `-frames:v ${maxFrames}`, // Limit number of frames
        ])
        .output(join(frameDir, `frame-%03d.${format}`))
        .on("start", (cmd) => {
          console.log(`[FrameExtractor] Running: ${cmd}`);
        })
        .on("end", () => {
          console.log("[FrameExtractor] Frame extraction complete");
          resolve();
        })
        .on("error", (err) => {
          console.error("[FrameExtractor] Error:", err);
          reject(err);
        })
        .run();
    });

    // Read extracted frames
    const frameFiles = await readdir(frameDir);
    const frames: Buffer[] = [];

    for (const file of frameFiles.sort()) {
      if (file.endsWith(`.${format}`)) {
        const framePath = join(frameDir, file);
        const frameBuffer = readFileSync(framePath);
        frames.push(frameBuffer);
      }
    }

    console.log(`[FrameExtractor] Extracted ${frames.length} frames`);

    return {
      frames,
      frameCount: frames.length,
      duration,
      fps,
    };
  } finally {
    // Cleanup temp files
    if (videoPath && existsSync(videoPath)) {
      await unlink(videoPath);
    }
    if (existsSync(frameDir)) {
      const files = await readdir(frameDir);
      for (const file of files) {
        await unlink(join(frameDir, file));
      }
      await unlink(frameDir).catch(() => {});
    }
  }
}

/**
 * Extract audio from video for transcription
 */
export async function extractAudio(key: string): Promise<Buffer> {
  console.log(`[AudioExtractor] Extracting audio from: ${key}`);

  let videoPath: string | null = null;
  let audioPath: string | null = null;

  try {
    // Download video from S3
    videoPath = await downloadVideoFromS3(key);

    // Generate temp audio path
    audioPath = join(TMP_DIR, `audio-${Date.now()}.mp3`);

    // Extract audio
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath!)
        .outputOptions([
          "-vn", // No video
          "-acodec libmp3lame", // MP3 codec
          "-ab 128k", // Bitrate
          "-ar 16000", // Sample rate (optimal for Whisper)
        ])
        .output(audioPath!)
        .on("start", (cmd) => {
          console.log(`[AudioExtractor] Running: ${cmd}`);
        })
        .on("end", () => {
          console.log("[AudioExtractor] Audio extraction complete");
          resolve();
        })
        .on("error", (err) => {
          console.error("[AudioExtractor] Error:", err);
          reject(err);
        })
        .run();
    });

    // Read audio file
    const audioBuffer = readFileSync(audioPath);
    console.log(`[AudioExtractor] Extracted audio: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    return audioBuffer;
  } finally {
    // Cleanup
    if (videoPath && existsSync(videoPath)) {
      await unlink(videoPath);
    }
    if (audioPath && existsSync(audioPath)) {
      await unlink(audioPath);
    }
  }
}

/**
 * Add tmp directory to gitignore
 */
export function getTempDir(): string {
  return TMP_DIR;
}
