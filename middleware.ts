/**
 * Velolume Middleware
 *
 * Handles custom domain routing for white-label storefronts.
 * Routes requests from shop.creatorname.com to the correct store.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Main app domains that should not be treated as custom domains
const MAIN_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "velolume.com",
  "www.velolume.com",
];

// Paths that should never be rewritten (API, static, etc.)
const BYPASS_PATHS = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/demo/",
  "/dashboard",
];

/**
 * Check if this is a custom domain request
 */
function isCustomDomain(host: string): boolean {
  const normalizedHost = host.toLowerCase().split(":")[0];

  // Check main domains
  if (MAIN_DOMAINS.includes(normalizedHost)) {
    return false;
  }

  // Check Vercel preview URLs
  if (normalizedHost.includes(".vercel.app")) {
    return false;
  }

  return true;
}

/**
 * Get store ID from domain via edge-compatible lookup
 * In production, this would query a KV store or database
 */
async function getStoreIdFromDomain(domain: string): Promise<string | null> {
  // Edge-compatible domain lookup
  // In production, use Vercel KV or similar edge store
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/domains/lookup?domain=${encodeURIComponent(domain)}`, {
      headers: {
        "x-middleware-request": "true",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.storeId || null;
    }
  } catch {
    // Fallback: domain not found
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Bypass paths that shouldn't be rewritten
  if (BYPASS_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  if (isCustomDomain(host)) {
    // For custom domains, we need to rewrite to the store page
    const storeId = await getStoreIdFromDomain(host);

    if (storeId) {
      // Rewrite to store page
      const url = request.nextUrl.clone();

      if (pathname === "/" || pathname === "") {
        // Root path -> store homepage
        url.pathname = `/store/${storeId}`;
      } else if (pathname.startsWith("/product/")) {
        // Product page -> store product page
        const productId = pathname.replace("/product/", "");
        url.pathname = `/store/${storeId}/${productId}`;
      } else {
        // Other paths -> append to store path
        url.pathname = `/store/${storeId}${pathname}`;
      }

      // Add custom domain header for downstream use
      const response = NextResponse.rewrite(url);
      response.headers.set("x-custom-domain", host);
      response.headers.set("x-store-id", storeId);
      return response;
    }

    // Domain not found - redirect to main site
    return NextResponse.redirect(new URL("https://velolume.com", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)",
  ],
};
