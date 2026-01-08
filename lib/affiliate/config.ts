/**
 * Affiliate Configuration
 *
 * Environment variables and configuration for affiliate integrations.
 * Uses placeholder values until real accounts are approved.
 */

// ============================================================================
// Amazon Associates Configuration
// ============================================================================

export const AMAZON_CONFIG = {
  // Associate tag (appended to URLs as ?tag=...)
  associateTag: process.env.AMAZON_ASSOCIATE_TAG || "velolume-20",

  // For future PA-API integration
  accessKey: process.env.AMAZON_ACCESS_KEY || "",
  secretKey: process.env.AMAZON_SECRET_KEY || "",
  partnerTag: process.env.AMAZON_ASSOCIATE_TAG || "velolume-20",

  // Supported Amazon domains
  supportedDomains: [
    "amazon.com",
    "amazon.co.uk",
    "amazon.ca",
    "amazon.de",
    "amazon.fr",
    "amazon.it",
    "amazon.es",
    "amazon.co.jp",
    "amazon.com.au",
    "amazon.in",
    "amazon.com.br",
    "amazon.com.mx",
    "amazon.nl",
    "amazon.sg",
    "amazon.ae",
    "amazon.sa",
    "amazon.se",
    "amazon.pl",
  ],
};

// ============================================================================
// Skimlinks Configuration
// ============================================================================

export const SKIMLINKS_CONFIG = {
  // Publisher ID for tracking
  publisherId: process.env.SKIMLINKS_PUBLISHER_ID || "placeholder",

  // API key for server-side link conversion
  apiKey: process.env.SKIMLINKS_API_KEY || "",

  // API endpoints
  linkApiUrl: "https://go.skimresources.com",

  // Skimlinks redirect format
  // Format: https://go.skimresources.com?id={publisherId}&xs={trackingId}&url={encodedUrl}
  redirectFormat: "go.skimresources.com",

  // Revenue share (Skimlinks takes 25% of commission)
  revenueShare: 0.25,
};

// ============================================================================
// Involve Asia Configuration (Shopee/Lazada)
// ============================================================================

export const INVOLVE_ASIA_CONFIG = {
  // API key for link conversion
  apiKey: process.env.INVOLVE_ASIA_API_KEY || "placeholder",

  // Publisher/affiliate ID
  publisherId: process.env.INVOLVE_ASIA_PUBLISHER_ID || "",

  // API endpoint
  apiUrl: "https://api.involve.asia/v2",

  // Deep link format
  // Format: https://invol.co/{publisherId}?u={encodedUrl}
  deepLinkBase: "https://invol.co",

  // Supported platforms
  supportedPlatforms: ["shopee", "lazada"],
};

// ============================================================================
// General Configuration
// ============================================================================

export const AFFILIATE_CONFIG = {
  // Enable/disable affiliate link conversion
  enabled: process.env.AFFILIATE_ENABLED !== "false",

  // Logging
  debug: process.env.AFFILIATE_DEBUG === "true",

  // Default tracking ID prefix
  trackingPrefix: "vlm",

  // Timeout for API calls (ms)
  apiTimeout: 5000,

  // Retry configuration
  maxRetries: 2,
  retryDelay: 1000,
};

// ============================================================================
// Status Check
// ============================================================================

export interface AffiliateStatus {
  amazon: { configured: boolean; tag: string };
  skimlinks: { configured: boolean; publisherId: string };
  involveAsia: { configured: boolean; publisherId: string };
  enabled: boolean;
}

export function getAffiliateStatus(): AffiliateStatus {
  return {
    amazon: {
      configured: !!AMAZON_CONFIG.associateTag,
      tag: AMAZON_CONFIG.associateTag,
    },
    skimlinks: {
      configured:
        SKIMLINKS_CONFIG.publisherId !== "placeholder" &&
        !!SKIMLINKS_CONFIG.publisherId,
      publisherId: SKIMLINKS_CONFIG.publisherId,
    },
    involveAsia: {
      configured:
        INVOLVE_ASIA_CONFIG.apiKey !== "placeholder" &&
        !!INVOLVE_ASIA_CONFIG.apiKey,
      publisherId: INVOLVE_ASIA_CONFIG.publisherId,
    },
    enabled: AFFILIATE_CONFIG.enabled,
  };
}

// ============================================================================
// Environment Variable Template
// ============================================================================

/**
 * Add these to your .env.local file:
 *
 * # Amazon Associates
 * AMAZON_ASSOCIATE_TAG=velolume-20
 *
 * # Skimlinks (apply at skimlinks.com)
 * SKIMLINKS_PUBLISHER_ID=your_publisher_id
 * SKIMLINKS_API_KEY=your_api_key
 *
 * # Involve Asia (apply at involve.asia)
 * INVOLVE_ASIA_API_KEY=your_api_key
 * INVOLVE_ASIA_PUBLISHER_ID=your_publisher_id
 *
 * # General
 * AFFILIATE_ENABLED=true
 * AFFILIATE_DEBUG=false
 */
