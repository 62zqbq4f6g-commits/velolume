/**
 * API Route: /api/simulate
 *
 * SIMULATION MODE: ON
 *
 * Emits Velolume Noir status events to the dashboard every 2 seconds:
 * - [INGEST_START] - Establishing SGP1 connection.
 * - [AI_WHISPER] - Decoding audio artifacts.
 * - [AI_VISION] - Sampling Soho-aesthetic keyframes.
 * - [SOHO_GEN] - Injecting Dirty Purple styles.
 *
 * After completion, creates a 'Sample Luxury Store' card in the Bento Grid.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createJob,
  updateJob,
  appendJobLog,
  JobStatus,
} from "@/lib/store/job-store";

// Velolume Noir Technical Log Events
const VELOLUME_EVENTS: Array<{
  status: JobStatus;
  label: string;
  message: string;
  details: string;
  delay: number;
}> = [
  {
    status: "ingest_start",
    label: "[INGEST_START]",
    message: "Establishing SGP1 connection.",
    details: "→ Connecting to sgp1.digitaloceanspaces.com:443",
    delay: 2000,
  },
  {
    status: "ai_whisper",
    label: "[AI_WHISPER]",
    message: "Decoding audio artifacts.",
    details: "→ Model: whisper-large-v3 | Sample rate: 16kHz",
    delay: 2000,
  },
  {
    status: "ai_vision",
    label: "[AI_VISION]",
    message: "Sampling Soho-aesthetic keyframes.",
    details: "→ Extracting 24 frames | Resolution: 1080x1920",
    delay: 2000,
  },
  {
    status: "soho_gen",
    label: "[SOHO_GEN]",
    message: "Injecting Dirty Purple styles.",
    details: "→ Theme: Velolume Noir | Palette: #3D2B3D, #A38A7E, #F5F5F5",
    delay: 2000,
  },
];

// Mock AI Response - Velolume Noir Theme Data
const MOCK_AI_RESPONSE = {
  transcription: {
    text: "Welcome to our curated collection of luxury essentials. Each piece has been carefully selected for the discerning aesthetic. From structured blazers to flowing silk, this is Soho style refined.",
    language: "en",
    duration: 52,
  },
  products: [
    {
      name: "Cashmere Wrap Coat",
      category: "Outerwear",
      colors: ["Charcoal", "Camel", "Ivory"],
      description: "Luxurious cashmere wrap coat with dramatic drape",
      estimatedPriceUSD: "$890.00",
      confidence: 0.96,
    },
    {
      name: "Silk Charmeuse Blouse",
      category: "Tops",
      colors: ["Champagne", "Noir"],
      description: "Fluid silk charmeuse with French seams",
      estimatedPriceUSD: "$340.00",
      confidence: 0.94,
    },
    {
      name: "High-Waisted Wool Trousers",
      category: "Bottoms",
      colors: ["Espresso", "Slate"],
      description: "Tailored wool trousers with pressed creases",
      estimatedPriceUSD: "$420.00",
      confidence: 0.92,
    },
    {
      name: "Leather Portfolio Clutch",
      category: "Accessories",
      colors: ["Burgundy", "Black"],
      description: "Full-grain leather clutch with suede lining",
      estimatedPriceUSD: "$560.00",
      confidence: 0.91,
    },
  ],
  visual: {
    dominantColors: ["#3D2B3D", "#A38A7E", "#F5F5F5", "#2D1F2D", "#BFA393"],
    aestheticStyle: "Soho Editorial Luxury",
    contentType: "High-End Fashion Showcase",
    targetAudience: "Affluent fashion enthusiasts, 28-45",
    scenes: [
      {
        timestamp: "0:00",
        description: "Minimalist studio with directional lighting",
        setting: "White cyclorama with moody shadows",
        mood: "Sophisticated, aspirational",
      },
      {
        timestamp: "0:18",
        description: "Close-up fabric details and textures",
        setting: "Macro lens product shots",
        mood: "Tactile, luxurious",
      },
      {
        timestamp: "0:35",
        description: "Model styling sequence",
        setting: "Editorial pose against Dirty Purple backdrop",
        mood: "Editorial, commanding",
      },
    ],
  },
  seo: {
    keywords: ["luxury fashion", "Soho style", "cashmere coat", "silk blouse", "editorial fashion"],
    tags: ["#LuxuryFashion", "#SohoStyle", "#EditorialLook", "#VelolumeNoir"],
    title: "Sample Luxury Store",
    description: "Curated luxury essentials with a New York Soho aesthetic. Featuring cashmere, silk, and fine leather in the signature Velolume Noir palette.",
  },
  sentiment: {
    overall: "positive" as const,
    score: 94,
    highlights: ["Premium positioning", "Strong visual storytelling", "High conversion potential"],
  },
  theme: {
    name: "Velolume Noir",
    colors: {
      background: "#3D2B3D",
      backgroundAlt: "#2D1F2D",
      accent: "#A38A7E",
      accentHover: "#BFA393",
      text: "#F5F5F5",
      textMuted: "#B8A8B8",
    },
    typography: {
      fontSerif: "'Playfair Display', Georgia, serif",
      fontMono: "'JetBrains Mono', monospace",
      fontSans: "'Inter', sans-serif",
    },
  },
};

// Simulate the Velolume Noir flow with 2-second intervals
async function simulateVelolumeFlow(jobId: string): Promise<void> {
  // Emit each status event with 2-second delays
  for (const event of VELOLUME_EVENTS) {
    await new Promise((resolve) => setTimeout(resolve, event.delay));

    appendJobLog(
      jobId,
      event.status,
      `${event.label} ${event.message}`,
      event.details
    );

    console.log(`[Simulate] ${event.label} ${event.message}`);
  }

  // Final delay before completion
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Apply mock AI results and mark complete
  updateJob(jobId, {
    status: "completed",
    transcription: MOCK_AI_RESPONSE.transcription.text,
    metadata: {
      title: MOCK_AI_RESPONSE.seo.title,
      author: "velolume.studio",
      duration: MOCK_AI_RESPONSE.transcription.duration,
    },
    analysis: {
      products: MOCK_AI_RESPONSE.products.map((p) => p.name),
      keywords: MOCK_AI_RESPONSE.seo.keywords,
      sentiment: MOCK_AI_RESPONSE.sentiment.overall,
      visionData: {
        dominantColors: MOCK_AI_RESPONSE.visual.dominantColors,
        aestheticStyle: MOCK_AI_RESPONSE.visual.aestheticStyle,
        contentType: MOCK_AI_RESPONSE.visual.contentType,
        targetAudience: MOCK_AI_RESPONSE.visual.targetAudience,
        productDetails: MOCK_AI_RESPONSE.products,
        scenes: MOCK_AI_RESPONSE.visual.scenes,
        summary: MOCK_AI_RESPONSE.seo.description,
      },
      seo: MOCK_AI_RESPONSE.seo,
      sentimentData: MOCK_AI_RESPONSE.sentiment,
      processingMeta: {
        processedAt: new Date().toISOString(),
        framesAnalyzed: 24,
        audioDuration: 52,
        model: "velolume-noir-v1",
      },
    },
  });

  // Append completion log
  appendJobLog(
    jobId,
    "completed",
    "[COMPLETE] Velolume Noir storefront ready.",
    `→ Store: "${MOCK_AI_RESPONSE.seo.title}" | Products: ${MOCK_AI_RESPONSE.products.length} | Theme: Velolume Noir`
  );

  console.log(`[Simulate] Job ${jobId} completed - Store ready!`);
}

// Auto-create store after simulation
async function createStoreFromJob(jobId: string): Promise<any> {
  const { readFileSync, writeFileSync, existsSync, mkdirSync } = await import("fs");
  const { join } = await import("path");

  const DATA_DIR = join(process.cwd(), "data");
  const STORES_FILE = join(DATA_DIR, "stores.json");

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  let stores: Record<string, any> = {};
  if (existsSync(STORES_FILE)) {
    try {
      const data = JSON.parse(readFileSync(STORES_FILE, "utf-8"));
      stores = data.stores || {};
    } catch {
      stores = {};
    }
  }

  const storeId = `store-${Date.now()}`;
  const store = {
    id: storeId,
    name: "Sample Luxury Store",
    creator: "Velolume Studio",
    creatorHandle: "@velolume.studio",
    thumbnail: "/demo/luxury-poster.jpg",
    productCount: MOCK_AI_RESPONSE.products.length,
    views: 0,
    status: "live",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    featured: true,
    jobId,
    theme: {
      name: "Velolume Noir",
      colors: MOCK_AI_RESPONSE.theme.colors,
    },
  };

  stores[storeId] = store;

  writeFileSync(
    STORES_FILE,
    JSON.stringify({ stores, lastUpdated: new Date().toISOString() }, null, 2)
  );

  return store;
}

// POST: Start Velolume Noir simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url, sync = false, createStore = true } = body;

    // Generate job ID
    const jobId = `velo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    console.log(`[Simulate] Starting Velolume Noir simulation: ${jobId}`);

    // Create the job with initial log entry
    const job = createJob({
      id: jobId,
      status: "queued",
      source: "scrape",
      platform: "tiktok",
      originalUrl: url || "https://www.tiktok.com/@velolume.studio/video/luxury-showcase",
      key: `videos/${jobId}.mp4`,
      bucket: "auto-storefront-media",
      endpoint: "https://sgp1.digitaloceanspaces.com",
      contentType: "video/mp4",
      log: [
        {
          timestamp: new Date().toISOString(),
          status: "queued",
          message: "[QUEUE] Job initialized.",
          details: `→ JobID: ${jobId} | Mode: Simulation`,
        },
      ],
      metadata: {
        title: "Processing...",
        author: "velolume.studio",
      },
    });

    if (sync) {
      // Synchronous mode - wait for completion
      await simulateVelolumeFlow(jobId);

      let store = null;
      if (createStore) {
        store = await createStoreFromJob(jobId);
      }

      return NextResponse.json({
        success: true,
        jobId,
        message: "Simulation completed",
        job,
        store,
        mockData: MOCK_AI_RESPONSE,
      });
    } else {
      // Async mode - return immediately, process in background
      (async () => {
        await simulateVelolumeFlow(jobId);
        if (createStore) {
          await createStoreFromJob(jobId);
        }
      })().catch(console.error);

      return NextResponse.json({
        success: true,
        jobId,
        message: "Velolume Noir simulation started",
        job,
        events: VELOLUME_EVENTS.map((e) => ({
          status: e.status,
          label: e.label,
          message: e.message,
          delay: e.delay,
        })),
      });
    }
  } catch (error) {
    console.error("[Simulate API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}

// GET: Get simulation config and mock data
export async function GET() {
  return NextResponse.json({
    simulation: {
      mode: "Velolume Noir",
      events: VELOLUME_EVENTS.map((e) => ({
        status: e.status,
        label: e.label,
        message: e.message,
        details: e.details,
        delay: `${e.delay}ms`,
      })),
      totalDuration: `${VELOLUME_EVENTS.reduce((sum, e) => sum + e.delay, 0) + 1500}ms`,
    },
    mockAI: MOCK_AI_RESPONSE,
    theme: {
      name: "Velolume Noir",
      hexCodes: {
        dirtyPurple: "#3D2B3D",
        mochaMousse: "#A38A7E",
        offWhite: "#F5F5F5",
      },
      typography: {
        serif: "Playfair Display",
        mono: "JetBrains Mono",
        sans: "Inter",
      },
    },
    finalPayload: {
      storeName: "Sample Luxury Store",
      products: MOCK_AI_RESPONSE.products.length,
      theme: "Velolume Noir",
    },
  });
}
