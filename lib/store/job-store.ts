/**
 * Job Status Store
 *
 * Simple JSON file-based storage for job statuses.
 * Will migrate to Supabase in Phase 2.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const JOBS_FILE = join(DATA_DIR, "jobs.json");

export type JobStatus =
  | "queued"
  | "processing"
  | "uploaded"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "failed"
  // Velolume-specific statuses for creator flow
  | "fetching_source"
  | "removing_watermark"
  | "transcribing_audio"
  | "generating_soho_vibe"
  // Velolume Noir technical log statuses
  | "ingest_start"
  | "ai_whisper"
  | "ai_vision"
  | "soho_gen";

export interface LogEntry {
  timestamp: string;
  status: JobStatus;
  message: string;
  details?: string;
}

export interface VideoJob {
  id: string;
  status: JobStatus;
  source: "direct" | "scrape";
  platform?: string;
  originalUrl?: string;
  key: string;
  bucket: string;
  endpoint: string;
  size?: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
  // Technical log for Velolume Noir display
  log?: LogEntry[];
  metadata?: {
    title?: string;
    author?: string;
    duration?: number;
    thumbnail?: string;
  };
  // AI Processing fields
  transcription?: string;
  analysis?: {
    products?: string[];
    keywords?: string[];
    sentiment?: string;
    // Extended vision analysis data
    visionData?: {
      dominantColors?: string[];
      aestheticStyle?: string;
      contentType?: string;
      targetAudience?: string;
      productDetails?: Array<{
        name: string;
        category: string;
        colors: string[];
        description?: string;
        estimatedPriceUSD?: string | null;
        confidence: number;
      }>;
      scenes?: Array<{
        timestamp?: string;
        description: string;
        setting: string;
        mood: string;
      }>;
      summary?: string;
    };
    // SEO data (database-ready)
    seo?: {
      keywords: string[];
      tags: string[];
      title: string;
      description: string;
    };
    // Sentiment analysis details
    sentimentData?: {
      overall: string;
      score: number;
      highlights: string[];
    };
    // Processing metadata
    processingMeta?: {
      processedAt: string;
      framesAnalyzed: number;
      audioDuration: number;
      model: string;
    };
  };
}

interface JobsDatabase {
  jobs: Record<string, VideoJob>;
  lastUpdated: string;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJobs(): JobsDatabase {
  ensureDataDir();

  if (!existsSync(JOBS_FILE)) {
    return { jobs: {}, lastUpdated: new Date().toISOString() };
  }

  try {
    const data = readFileSync(JOBS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { jobs: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveJobs(db: JobsDatabase): void {
  ensureDataDir();
  db.lastUpdated = new Date().toISOString();
  writeFileSync(JOBS_FILE, JSON.stringify(db, null, 2));
}

/**
 * Create a new job
 */
export function createJob(job: Omit<VideoJob, "createdAt" | "updatedAt">): VideoJob {
  const db = loadJobs();
  const now = new Date().toISOString();

  const newJob: VideoJob = {
    ...job,
    createdAt: now,
    updatedAt: now,
  };

  db.jobs[job.id] = newJob;
  saveJobs(db);

  return newJob;
}

/**
 * Get a job by ID
 */
export function getJob(id: string): VideoJob | null {
  const db = loadJobs();
  return db.jobs[id] || null;
}

/**
 * Update a job
 */
export function updateJob(id: string, updates: Partial<VideoJob>): VideoJob | null {
  const db = loadJobs();

  if (!db.jobs[id]) {
    return null;
  }

  db.jobs[id] = {
    ...db.jobs[id],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveJobs(db);
  return db.jobs[id];
}

/**
 * Update job status
 */
export function updateJobStatus(id: string, status: JobStatus, error?: string): VideoJob | null {
  return updateJob(id, { status, error });
}

/**
 * Append a log entry to a job
 */
export function appendJobLog(
  id: string,
  status: JobStatus,
  message: string,
  details?: string
): VideoJob | null {
  const db = loadJobs();
  const job = db.jobs[id];

  if (!job) {
    return null;
  }

  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    status,
    message,
    details,
  };

  const currentLog = job.log || [];

  db.jobs[id] = {
    ...job,
    status,
    log: [...currentLog, logEntry],
    updatedAt: new Date().toISOString(),
  };

  saveJobs(db);
  return db.jobs[id];
}

/**
 * Get all jobs
 */
export function getAllJobs(): VideoJob[] {
  const db = loadJobs();
  return Object.values(db.jobs).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get jobs by status
 */
export function getJobsByStatus(status: JobStatus): VideoJob[] {
  return getAllJobs().filter((job) => job.status === status);
}

/**
 * Delete a job
 */
export function deleteJob(id: string): boolean {
  const db = loadJobs();

  if (!db.jobs[id]) {
    return false;
  }

  delete db.jobs[id];
  saveJobs(db);
  return true;
}

/**
 * Get job statistics
 */
export function getJobStats(): Record<JobStatus, number> {
  const jobs = getAllJobs();
  const stats: Record<JobStatus, number> = {
    queued: 0,
    processing: 0,
    uploaded: 0,
    transcribing: 0,
    analyzing: 0,
    completed: 0,
    failed: 0,
    // Velolume-specific
    fetching_source: 0,
    removing_watermark: 0,
    transcribing_audio: 0,
    generating_soho_vibe: 0,
    // Velolume Noir technical log statuses
    ingest_start: 0,
    ai_whisper: 0,
    ai_vision: 0,
    soho_gen: 0,
  };

  for (const job of jobs) {
    if (stats[job.status] !== undefined) {
      stats[job.status]++;
    }
  }

  return stats;
}
