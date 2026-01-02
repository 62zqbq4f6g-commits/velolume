/**
 * API Route: /api/og
 *
 * Dynamic OpenGraph image generation for Velolume storefronts.
 * Creates high-end Vogue-style preview images for social sharing.
 */

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Velolume Noir color palette
const COLORS = {
  dirtyPurple: "#3D2B3D",
  dirtyPurpleDark: "#2D1F2D",
  mochaMousse: "#A38A7E",
  mochaLight: "#BFA393",
  ivory: "#F5F5F5",
  ivoryMuted: "#B8A8B8",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const title = searchParams.get("title") || "Velolume Store";
    const description = searchParams.get("description") || "Curated luxury essentials";
    const creator = searchParams.get("creator") || "@velolume";
    const productCount = searchParams.get("products") || "0";
    const theme = searchParams.get("theme") || "noir";
    const type = searchParams.get("type") || "store"; // store, product, share

    // Select colors based on theme
    const bg = theme === "noir" ? COLORS.dirtyPurple : "#1a1a1a";
    const bgDark = theme === "noir" ? COLORS.dirtyPurpleDark : "#0a0a0a";
    const accent = theme === "noir" ? COLORS.mochaMousse : "#c9a87c";
    const text = COLORS.ivory;
    const textMuted = COLORS.ivoryMuted;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(135deg, ${bg} 0%, ${bgDark} 100%)`,
            padding: "60px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Top bar with logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {/* Logo mark */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: text, fontSize: "20px", fontWeight: "bold" }}>V</span>
              </div>
              <span
                style={{
                  color: text,
                  fontSize: "18px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontWeight: 300,
                }}
              >
                Velolume
              </span>
            </div>
            <span
              style={{
                color: textMuted,
                fontSize: "14px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {type === "product" ? "Product" : "Store"}
            </span>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Title */}
            <h1
              style={{
                color: text,
                fontSize: type === "product" ? "56px" : "64px",
                fontWeight: 400,
                lineHeight: 1.1,
                margin: 0,
                marginBottom: "24px",
                fontFamily: "Georgia, serif",
                maxWidth: "900px",
              }}
            >
              {title.length > 60 ? `${title.substring(0, 60)}...` : title}
            </h1>

            {/* Description */}
            <p
              style={{
                color: textMuted,
                fontSize: "24px",
                lineHeight: 1.5,
                margin: 0,
                maxWidth: "700px",
              }}
            >
              {description.length > 100 ? `${description.substring(0, 100)}...` : description}
            </p>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `1px solid ${accent}40`,
              paddingTop: "30px",
            }}
          >
            {/* Creator info */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "24px",
                  background: `linear-gradient(135deg, ${accent} 0%, ${COLORS.mochaLight} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: text, fontSize: "18px", fontWeight: "bold" }}>
                  {creator.replace("@", "").charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: text, fontSize: "16px", fontWeight: 500 }}>
                  {creator}
                </span>
                <span style={{ color: textMuted, fontSize: "14px" }}>Creator</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "40px" }}>
              {parseInt(productCount) > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ color: accent, fontSize: "32px", fontWeight: 600 }}>
                    {productCount}
                  </span>
                  <span
                    style={{
                      color: textMuted,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Products
                  </span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span
                  style={{
                    color: accent,
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontWeight: 500,
                  }}
                >
                  Shop Now
                </span>
                <span style={{ color: textMuted, fontSize: "12px" }}>One-Tap Buy</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("[OG Image] Error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
