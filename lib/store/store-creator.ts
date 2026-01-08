/**
 * Store Creator
 *
 * Auto-creates store entries from processed video jobs.
 * Generates Velolume Noir themed storefronts.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { ProcessedVideoData } from "@/lib/ai/processor";

const DATA_DIR = join(process.cwd(), "data");
const STORES_FILE = join(DATA_DIR, "stores.json");

// Velolume Noir default theme
const VELOLUME_NOIR_THEME = {
  name: "Velolume Noir",
  colors: {
    background: "#3D2B3D",
    backgroundAlt: "#2D1F2D",
    accent: "#A38A7E",
    accentHover: "#BFA393",
    text: "#F5F5F5",
    textMuted: "#B8A8B8",
  },
};

// Alternative themes based on dominant colors
function selectTheme(dominantColors: string[]): typeof VELOLUME_NOIR_THEME {
  // For now, always use Velolume Noir
  // Future: Generate themes from dominant colors
  return VELOLUME_NOIR_THEME;
}

export interface StoreEntry {
  id: string;
  name: string;
  creator: string;
  creatorHandle?: string;
  thumbnail?: string;
  videoUrl?: string;
  productCount: number;
  views: number;
  status: "draft" | "live" | "archived";
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  jobId: string;
  theme: {
    name: string;
    colors: Record<string, string>;
  };
  products?: Array<{
    name: string;
    category: string;
    subcategory: string;
    colors: string[];
    material: string | null;
    style: string | null;
    pattern: string | null;
    brand: string | null;
    location: string;
    description: string;
    searchTerms: string[];
    estimatedPriceUSD: string | null;
    confidence: number;
    identifiability: "high" | "medium" | "low";
    frameIndices: number[];
  }>;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    tags: string[];
  };
}

interface StoresDatabase {
  stores: Record<string, StoreEntry>;
  lastUpdated: string;
}

function loadStores(): StoresDatabase {
  if (!existsSync(DATA_DIR)) {
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
    mkdirSync(DATA_DIR, { recursive: true });
  }
  db.lastUpdated = new Date().toISOString();
  writeFileSync(STORES_FILE, JSON.stringify(db, null, 2));
}

/**
 * Create a store from processed video data
 */
export async function createStoreFromJob(
  jobId: string,
  processedData: ProcessedVideoData
): Promise<StoreEntry> {
  const db = loadStores();

  // Generate store ID
  const storeId = `store-${Date.now()}`;

  // Select theme based on detected colors
  const theme = selectTheme(processedData.visual.dominantColors);

  // Extract creator info from aesthetic style or use default
  const creatorName = processedData.visual.targetAudience
    ? `${processedData.visual.aestheticStyle} Creator`
    : "Content Creator";

  // Create store entry
  const store: StoreEntry = {
    id: storeId,
    name: processedData.seo.title,
    creator: creatorName,
    creatorHandle: `@${storeId.replace("store-", "creator")}`,
    thumbnail: undefined, // Could extract from first frame
    videoUrl: undefined, // Original video URL if available
    productCount: processedData.products.length,
    views: 0,
    status: "live",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    featured: true, // Mark new stores as featured
    jobId,
    theme: {
      name: theme.name,
      colors: theme.colors,
    },
    products: processedData.products,
    seo: processedData.seo,
  };

  // Save to database
  db.stores[storeId] = store;
  saveStores(db);

  return store;
}

/**
 * Get all stores
 */
export function getAllStores(): StoreEntry[] {
  const db = loadStores();
  return Object.values(db.stores).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a store by ID
 */
export function getStore(id: string): StoreEntry | null {
  const db = loadStores();
  return db.stores[id] || null;
}

/**
 * Update a store
 */
export function updateStore(id: string, updates: Partial<StoreEntry>): StoreEntry | null {
  const db = loadStores();

  if (!db.stores[id]) {
    return null;
  }

  db.stores[id] = {
    ...db.stores[id],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveStores(db);
  return db.stores[id];
}

/**
 * Delete a store
 */
export function deleteStore(id: string): boolean {
  const db = loadStores();

  if (!db.stores[id]) {
    return false;
  }

  delete db.stores[id];
  saveStores(db);
  return true;
}
