/**
 * Google Shopping Configuration
 *
 * Environment-based configuration for SERP API integration.
 */

export const SHOPPING_CONFIG = {
  // SERP API configuration
  serpApiKey: process.env.SERP_API_KEY || "",
  serpApiUrl: "https://serpapi.com/search",

  // Default search parameters
  defaultCountry: "us",
  defaultLanguage: "en",

  // Result limits
  defaultResultsPerPage: 10,
  maxResultsPerPage: 100,
  maxPages: 5,

  // Rate limiting
  requestDelayMs: 1000, // 1 second between requests
  maxRetries: 3,
  retryDelayMs: 2000,

  // Timeout
  requestTimeoutMs: 10000,
};

/**
 * Check if Google Shopping is configured
 */
export function isShoppingConfigured(): boolean {
  return !!SHOPPING_CONFIG.serpApiKey;
}

/**
 * Get configuration status
 */
export function getShoppingStatus(): {
  configured: boolean;
  apiKeySet: boolean;
  apiKeyPreview: string;
} {
  const apiKey = SHOPPING_CONFIG.serpApiKey;
  return {
    configured: !!apiKey,
    apiKeySet: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "not set",
  };
}
