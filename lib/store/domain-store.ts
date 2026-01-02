/**
 * Custom Domain Store
 *
 * Maps custom domains (e.g., shop.creatorname.com) to Velolume store IDs.
 * Enables white-label storefronts for creators.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DOMAINS_FILE = join(DATA_DIR, "domains.json");

export interface DomainMapping {
  domain: string;
  storeId: string;
  verified: boolean;
  verificationToken?: string;
  createdAt: string;
  updatedAt: string;
  sslStatus: "pending" | "active" | "failed";
  settings?: {
    redirectWww?: boolean;
    forceHttps?: boolean;
  };
}

interface DomainsDatabase {
  domains: Record<string, DomainMapping>;
  lastUpdated: string;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDomains(): DomainsDatabase {
  ensureDataDir();

  if (!existsSync(DOMAINS_FILE)) {
    return { domains: {}, lastUpdated: new Date().toISOString() };
  }

  try {
    const data = readFileSync(DOMAINS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { domains: {}, lastUpdated: new Date().toISOString() };
  }
}

function saveDomains(db: DomainsDatabase): void {
  ensureDataDir();
  db.lastUpdated = new Date().toISOString();
  writeFileSync(DOMAINS_FILE, JSON.stringify(db, null, 2));
}

/**
 * Generate a verification token for domain ownership
 */
function generateVerificationToken(): string {
  return `velolume-verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Add a custom domain mapping
 */
export function addDomainMapping(domain: string, storeId: string): DomainMapping {
  const db = loadDomains();
  const normalizedDomain = domain.toLowerCase().trim();

  const mapping: DomainMapping = {
    domain: normalizedDomain,
    storeId,
    verified: false,
    verificationToken: generateVerificationToken(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sslStatus: "pending",
    settings: {
      redirectWww: true,
      forceHttps: true,
    },
  };

  db.domains[normalizedDomain] = mapping;
  saveDomains(db);

  return mapping;
}

/**
 * Get store ID from custom domain
 */
export function getStoreIdFromDomain(domain: string): string | null {
  const db = loadDomains();
  const normalizedDomain = domain.toLowerCase().trim();

  // Check exact match
  const mapping = db.domains[normalizedDomain];
  if (mapping && mapping.verified) {
    return mapping.storeId;
  }

  // Check without www prefix
  const withoutWww = normalizedDomain.replace(/^www\./, "");
  const mappingWithoutWww = db.domains[withoutWww];
  if (mappingWithoutWww && mappingWithoutWww.verified) {
    return mappingWithoutWww.storeId;
  }

  return null;
}

/**
 * Get domain mapping by domain
 */
export function getDomainMapping(domain: string): DomainMapping | null {
  const db = loadDomains();
  return db.domains[domain.toLowerCase().trim()] || null;
}

/**
 * Get domain mapping by store ID
 */
export function getDomainByStoreId(storeId: string): DomainMapping | null {
  const db = loadDomains();
  return Object.values(db.domains).find((m) => m.storeId === storeId) || null;
}

/**
 * Verify a domain (after DNS check passes)
 */
export function verifyDomain(domain: string): DomainMapping | null {
  const db = loadDomains();
  const normalizedDomain = domain.toLowerCase().trim();

  if (!db.domains[normalizedDomain]) {
    return null;
  }

  db.domains[normalizedDomain] = {
    ...db.domains[normalizedDomain],
    verified: true,
    sslStatus: "active",
    updatedAt: new Date().toISOString(),
  };

  saveDomains(db);
  return db.domains[normalizedDomain];
}

/**
 * Remove a domain mapping
 */
export function removeDomainMapping(domain: string): boolean {
  const db = loadDomains();
  const normalizedDomain = domain.toLowerCase().trim();

  if (!db.domains[normalizedDomain]) {
    return false;
  }

  delete db.domains[normalizedDomain];
  saveDomains(db);
  return true;
}

/**
 * Get all domain mappings
 */
export function getAllDomainMappings(): DomainMapping[] {
  const db = loadDomains();
  return Object.values(db.domains);
}

/**
 * Check if a domain is a custom domain (not the main app domain)
 */
export function isCustomDomain(host: string): boolean {
  const mainDomains = [
    "localhost",
    "127.0.0.1",
    "velolume.com",
    "www.velolume.com",
    "velolume.vercel.app",
  ];

  const normalizedHost = host.toLowerCase().split(":")[0]; // Remove port

  // Check if it's a main domain or a vercel preview
  if (mainDomains.includes(normalizedHost)) {
    return false;
  }

  // Check for Vercel preview URLs
  if (normalizedHost.includes(".vercel.app")) {
    return false;
  }

  return true;
}
