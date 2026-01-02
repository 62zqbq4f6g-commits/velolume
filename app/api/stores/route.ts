/**
 * API Route: /api/stores
 *
 * Manages storefront data. Currently uses in-memory + file storage.
 * Will migrate to Supabase in Phase 2.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { getAllJobs } from "@/lib/store/job-store";

const DATA_DIR = join(process.cwd(), "data");
const STORES_FILE = join(DATA_DIR, "stores.json");

interface Store {
  id: string;
  name: string;
  creator: string;
  creatorHandle: string;
  thumbnail?: string;
  videoUrl?: string;
  productCount: number;
  views: number;
  status: "draft" | "live" | "archived";
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  jobId?: string;
  theme: {
    name: string;
    colors: {
      background: string;
      accent: string;
      text: string;
    };
  };
}

interface StoresDatabase {
  stores: Record<string, Store>;
  lastUpdated: string;
}

function loadStores(): StoresDatabase {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(STORES_FILE)) {
    return { stores: {}, lastUpdated: new Date().toISOString() };
  }

  try {
    const data = readFileSync(STORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { stores: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveStores(db: StoresDatabase): void {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(DATA_DIR, { recursive: true });
  }
  db.lastUpdated = new Date().toISOString();
  writeFileSync(STORES_FILE, JSON.stringify(db, null, 2));
}

// GET: List all stores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const includeJobs = searchParams.get("includeJobs") === "true";

    const db = loadStores();
    let stores = Object.values(db.stores);

    // Filter by status
    if (status) {
      stores = stores.filter((s) => s.status === status);
    }

    // Sort by createdAt descending
    stores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limit results
    stores = stores.slice(0, limit);

    // If no stores, generate from completed jobs
    if (stores.length === 0 && includeJobs) {
      const jobs = getAllJobs().filter((j) => j.status === "completed");
      stores = jobs.slice(0, limit).map((job) => ({
        id: `store-${job.id}`,
        name: job.metadata?.title || "Untitled Store",
        creator: job.metadata?.author || "Unknown",
        creatorHandle: `@${job.metadata?.author || "creator"}`,
        thumbnail: job.metadata?.thumbnail,
        productCount: job.analysis?.products?.length || 0,
        views: Math.floor(Math.random() * 10000),
        status: "draft" as const,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        jobId: job.id,
        theme: {
          name: "Velolume Noir",
          colors: {
            background: "#3D2B3D",
            accent: "#A38A7E",
            text: "#F5F5F5",
          },
        },
      }));
    }

    return NextResponse.json({
      stores,
      total: stores.length,
      hasMore: stores.length >= limit,
    });
  } catch (error) {
    console.error("[Stores API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

// POST: Create a new store from a completed job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, name, featured = false } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Get job data
    const jobs = getAllJobs();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const db = loadStores();
    const storeId = `store-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const store: Store = {
      id: storeId,
      name: name || job.metadata?.title || "Untitled Store",
      creator: job.metadata?.author || "Unknown",
      creatorHandle: `@${job.metadata?.author || "creator"}`,
      thumbnail: job.metadata?.thumbnail,
      videoUrl: job.key ? `https://sgp1.digitaloceanspaces.com/auto-storefront-media/${job.key}` : undefined,
      productCount: job.analysis?.products?.length || 0,
      views: 0,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured,
      jobId,
      theme: {
        name: "Velolume Noir",
        colors: {
          background: job.analysis?.visionData?.dominantColors?.[0] || "#3D2B3D",
          accent: job.analysis?.visionData?.dominantColors?.[1] || "#A38A7E",
          text: "#F5F5F5",
        },
      },
    };

    db.stores[storeId] = store;
    saveStores(db);

    return NextResponse.json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("[Stores API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create store" },
      { status: 500 }
    );
  }
}
