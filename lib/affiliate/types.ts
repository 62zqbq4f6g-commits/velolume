/**
 * Affiliate Link Types
 *
 * TypeScript types for affiliate link conversion module.
 */

// ============================================================================
// Affiliate Networks
// ============================================================================

export type AffiliateNetwork =
  | "amazon"
  | "skimlinks"
  | "involve_asia"
  | "direct";

// ============================================================================
// Commission Rates
// ============================================================================

export interface CommissionRate {
  min: number;
  max: number;
  average: number;
  category?: string;
}

export const AMAZON_COMMISSION_RATES: Record<string, CommissionRate> = {
  "luxury-beauty": { min: 10, max: 10, average: 10, category: "Luxury Beauty" },
  fashion: { min: 4, max: 4, average: 4, category: "Fashion" },
  shoes: { min: 4, max: 4, average: 4, category: "Shoes & Accessories" },
  furniture: { min: 8, max: 8, average: 8, category: "Furniture & Home" },
  electronics: { min: 1, max: 1, average: 1, category: "Electronics" },
  default: { min: 1, max: 10, average: 4, category: "General" },
};

export const SHOPEE_COMMISSION_RATES: Record<string, CommissionRate> = {
  fashion: { min: 6, max: 12, average: 8, category: "Fashion" },
  beauty: { min: 6, max: 12, average: 8, category: "Beauty" },
  electronics: { min: 3, max: 6, average: 4, category: "Electronics" },
  default: { min: 3, max: 12, average: 6, category: "General" },
};

export const LAZADA_COMMISSION_RATES: Record<string, CommissionRate> = {
  fashion: { min: 6, max: 12, average: 8, category: "Fashion" },
  beauty: { min: 6, max: 12, average: 8, category: "Beauty" },
  electronics: { min: 3, max: 6, average: 4, category: "Electronics" },
  default: { min: 3, max: 12, average: 6, category: "General" },
};

export const SKIMLINKS_COMMISSION_RATES: Record<string, CommissionRate> = {
  // Skimlinks takes 25% of commission, so effective rates are lower
  default: { min: 1, max: 8, average: 3, category: "General (after 25% cut)" },
};

// ============================================================================
// Affiliate Result
// ============================================================================

export interface AffiliateResult {
  originalUrl: string;
  affiliateUrl: string;
  network: AffiliateNetwork;
  retailer: string;
  estimatedCommission: number; // Percentage (e.g., 4 for 4%)
  metadata: {
    videoId?: string;
    productIndex?: number;
    trackingId?: string;
  };
}

// ============================================================================
// Affiliate Metadata (Input)
// ============================================================================

export interface AffiliateMetadata {
  videoId?: string;
  productIndex?: number;
  category?: string;
}

// ============================================================================
// Retailer Detection
// ============================================================================

export interface RetailerInfo {
  name: string;
  domain: string;
  network: AffiliateNetwork;
  region: "us" | "uk" | "eu" | "sea" | "global";
  commissionRate: CommissionRate;
}

export const RETAILER_MAP: Record<string, RetailerInfo> = {
  // Amazon (Direct)
  "amazon.com": {
    name: "Amazon",
    domain: "amazon.com",
    network: "amazon",
    region: "us",
    commissionRate: AMAZON_COMMISSION_RATES.default,
  },
  "amazon.co.uk": {
    name: "Amazon UK",
    domain: "amazon.co.uk",
    network: "amazon",
    region: "uk",
    commissionRate: AMAZON_COMMISSION_RATES.default,
  },

  // Shopee (Involve Asia)
  "shopee.sg": {
    name: "Shopee Singapore",
    domain: "shopee.sg",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },
  "shopee.com.my": {
    name: "Shopee Malaysia",
    domain: "shopee.com.my",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },
  "shopee.co.id": {
    name: "Shopee Indonesia",
    domain: "shopee.co.id",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },
  "shopee.ph": {
    name: "Shopee Philippines",
    domain: "shopee.ph",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },
  "shopee.vn": {
    name: "Shopee Vietnam",
    domain: "shopee.vn",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },
  "shopee.co.th": {
    name: "Shopee Thailand",
    domain: "shopee.co.th",
    network: "involve_asia",
    region: "sea",
    commissionRate: SHOPEE_COMMISSION_RATES.default,
  },

  // Lazada (Involve Asia)
  "lazada.sg": {
    name: "Lazada Singapore",
    domain: "lazada.sg",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
  "lazada.com.my": {
    name: "Lazada Malaysia",
    domain: "lazada.com.my",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
  "lazada.co.id": {
    name: "Lazada Indonesia",
    domain: "lazada.co.id",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
  "lazada.com.ph": {
    name: "Lazada Philippines",
    domain: "lazada.com.ph",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
  "lazada.vn": {
    name: "Lazada Vietnam",
    domain: "lazada.vn",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
  "lazada.co.th": {
    name: "Lazada Thailand",
    domain: "lazada.co.th",
    network: "involve_asia",
    region: "sea",
    commissionRate: LAZADA_COMMISSION_RATES.default,
  },
};

// ============================================================================
// Conversion Result (Internal)
// ============================================================================

export interface ConversionResult {
  success: boolean;
  affiliateUrl?: string;
  error?: string;
}
