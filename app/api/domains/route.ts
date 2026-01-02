/**
 * API Route: /api/domains
 *
 * Manage custom domain mappings for white-label storefronts.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addDomainMapping,
  getDomainMapping,
  getDomainByStoreId,
  verifyDomain,
  removeDomainMapping,
  getAllDomainMappings,
} from "@/lib/store/domain-store";

// GET: List all domains or get domain for a store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const domain = searchParams.get("domain");

    if (domain) {
      const mapping = getDomainMapping(domain);
      if (!mapping) {
        return NextResponse.json({ error: "Domain not found" }, { status: 404 });
      }
      return NextResponse.json({ domain: mapping });
    }

    if (storeId) {
      const mapping = getDomainByStoreId(storeId);
      return NextResponse.json({ domain: mapping });
    }

    const domains = getAllDomainMappings();
    return NextResponse.json({
      domains,
      total: domains.length,
    });
  } catch (error) {
    console.error("[Domains API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}

// POST: Add a new custom domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, storeId } = body;

    if (!domain || !storeId) {
      return NextResponse.json(
        { error: "domain and storeId are required" },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existing = getDomainMapping(domain);
    if (existing) {
      return NextResponse.json(
        { error: "Domain already registered" },
        { status: 409 }
      );
    }

    const mapping = addDomainMapping(domain, storeId);

    return NextResponse.json({
      success: true,
      domain: mapping,
      instructions: {
        dns: {
          type: "CNAME",
          name: domain.startsWith("www.") ? "www" : "@",
          value: "cname.vercel-dns.com",
          ttl: 3600,
        },
        verification: {
          type: "TXT",
          name: `_vercel.${domain}`,
          value: mapping.verificationToken,
          ttl: 3600,
        },
      },
    });
  } catch (error) {
    console.error("[Domains API] Error:", error);
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
  }
}

// PATCH: Verify a domain
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, action } = body;

    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    if (action === "verify") {
      const mapping = verifyDomain(domain);
      if (!mapping) {
        return NextResponse.json({ error: "Domain not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, domain: mapping });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Domains API] Error:", error);
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
  }
}

// DELETE: Remove a domain mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const removed = removeDomainMapping(domain);
    if (!removed) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Domains API] Error:", error);
    return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 });
  }
}
