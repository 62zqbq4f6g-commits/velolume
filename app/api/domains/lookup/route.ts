/**
 * API Route: /api/domains/lookup
 *
 * Fast edge-compatible domain lookup for middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStoreIdFromDomain } from "@/lib/store/domain-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const storeId = getStoreIdFromDomain(domain);

  if (!storeId) {
    return NextResponse.json({ storeId: null }, { status: 404 });
  }

  return NextResponse.json({ storeId, domain });
}
