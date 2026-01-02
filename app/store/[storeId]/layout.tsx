/**
 * Store Layout with Dynamic Metadata
 *
 * Generates OpenGraph meta tags for social sharing.
 * Creates Vogue-style preview images when shared on IG/WhatsApp.
 */

import { Metadata } from "next";
import { getStore } from "@/lib/store/store-creator";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: { storeId: string };
}

// Generate dynamic metadata for SEO and social sharing
export async function generateMetadata({
  params,
}: {
  params: { storeId: string };
}): Promise<Metadata> {
  const store = getStore(params.storeId);

  // Default metadata for demo/unknown stores
  const defaultTitle = "Velolume Store";
  const defaultDescription = "AI-curated luxury essentials with the signature Dirty Purple aesthetic.";

  const title = store?.name || defaultTitle;
  const description = store?.seo?.description || defaultDescription;
  const creator = store?.creatorHandle || "@velolume";
  const productCount = store?.productCount?.toString() || "0";

  // Build OG image URL with store data
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("description", description);
  ogImageUrl.searchParams.set("creator", creator);
  ogImageUrl.searchParams.set("products", productCount);
  ogImageUrl.searchParams.set("theme", "noir");
  ogImageUrl.searchParams.set("type", "store");

  return {
    title: `${title} | Velolume`,
    description,
    keywords: store?.seo?.keywords || ["velolume", "fashion", "ai store", "tiktok shopping"],
    authors: [{ name: creator.replace("@", "") }],
    creator: creator,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "Velolume",
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
      creator,
    },
    other: {
      "instagram:card": "summary_large_image",
      "instagram:title": title,
      "instagram:description": description,
      "instagram:image": ogImageUrl.toString(),
    },
  };
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return <>{children}</>;
}
