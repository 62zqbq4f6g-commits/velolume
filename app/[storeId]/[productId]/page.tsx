/**
 * Dynamic Product Page - Social-First Layout
 *
 * React Server Component for maximum speed.
 * Full-bleed video hero with Dirty Purple gradient transition.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { OneTapBuyButton, OneTapBuyButtonCompact } from "@/components/ui/OneTapBuyButton";
import { VideoHero } from "./VideoHero";
import { AIHooks } from "./AIHooks";
import { RelatedProducts } from "./RelatedProducts";

// Types
interface ProductPageProps {
  params: Promise<{
    storeId: string;
    productId: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  videoUrl: string;
  posterUrl?: string;
  buyUrl: string;
  platform: "tiktok" | "shopee" | "taobao" | "generic";
  category: string;
  confidence: number;
  aiHooks: string[];
  colors?: string[];
  creator: {
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}

// Simulated data fetch - in production this would be from database
async function getProduct(storeId: string, productId: string): Promise<Product | null> {
  // Simulate network delay for demo
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Demo product data
  const products: Record<string, Product> = {
    "prod-1": {
      id: "prod-1",
      name: "Linen Blend Oversized Blazer",
      price: "$89.00",
      description: "Effortlessly chic oversized blazer in a breathable linen blend. Perfect for layering over summer dresses or pairing with high-waisted trousers. The relaxed fit and natural fabric create that coveted Soho-cool aesthetic.",
      videoUrl: "/demo/video.mp4",
      posterUrl: "/demo/poster.jpg",
      buyUrl: "https://shop.tiktok.com/demo",
      platform: "tiktok",
      category: "Outerwear",
      confidence: 0.94,
      aiHooks: ["Summer Essential", "Bestseller", "Sustainable", "Versatile"],
      colors: ["Sand", "Ivory", "Sage"],
      creator: {
        name: "Sofia Martinez",
        handle: "@sofia.style",
      },
    },
    "prod-2": {
      id: "prod-2",
      name: "Silk Midi Skirt",
      price: "$124.00",
      description: "Luxurious silk midi skirt with a fluid drape that moves beautifully. High-waisted design flatters every figure. The champagne hue catches light like morning sun through gallery windows.",
      videoUrl: "/demo/video.mp4",
      posterUrl: "/demo/poster.jpg",
      buyUrl: "https://shopee.com/demo",
      platform: "shopee",
      category: "Bottoms",
      confidence: 0.91,
      aiHooks: ["Trending Now", "Editorial Pick", "Limited Stock"],
      colors: ["Champagne", "Blush"],
      creator: {
        name: "Sofia Martinez",
        handle: "@sofia.style",
      },
    },
  };

  return products[productId] || null;
}

// Server Component
export default async function ProductPage({ params }: ProductPageProps) {
  const { storeId, productId } = await params;
  const product = await getProduct(storeId, productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-velolume-500">
      {/* Full-Bleed Video Hero */}
      <VideoHero
        videoUrl={product.videoUrl}
        posterUrl={product.posterUrl}
        creator={product.creator}
      />

      {/* Content - overlaps video with negative margin */}
      <div className="relative z-10 -mt-20 md:-mt-32">
        {/* Main Product Info Card */}
        <div className="px-4 md:px-8 max-w-2xl mx-auto">
          <div className="glass-card p-6 md:p-8">
            {/* Category & Confidence */}
            <div className="flex items-center gap-2 mb-4">
              <Badge>{product.category}</Badge>
              <Badge variant="success">
                {Math.round(product.confidence * 100)}% Match
              </Badge>
            </div>

            {/* Product Name - Editorial */}
            <h1 className="font-serif text-2xl md:text-3xl text-ivory-100 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Price - Prominent */}
            <p className="font-mono text-2xl text-mocha-400 mb-4">
              {product.price}
            </p>

            {/* Description */}
            <p className="text-ivory-400 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-micro text-ivory-400 font-mono uppercase">Colors:</span>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className="px-3 py-1 bg-ivory-100/10 text-ivory-100 text-sm font-mono"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Creator attribution */}
            <div className="flex items-center gap-3 pt-4 border-t border-ivory-100/10">
              <div className="w-10 h-10 rounded-full bg-mocha-500/30 flex items-center justify-center">
                <span className="text-mocha-400 font-mono text-sm">
                  {product.creator.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-ivory-100 text-sm">{product.creator.name}</p>
                <p className="text-ivory-400 text-micro font-mono">{product.creator.handle}</p>
              </div>
            </div>
          </div>

          {/* One-Tap Buy Button - Sharp Rectangle */}
          <div className="mt-6">
            <OneTapBuyButton
              href={product.buyUrl}
              price={product.price}
              platform={product.platform}
            />
          </div>

          {/* AI-Generated Hooks */}
          <Suspense fallback={<AIHooksSkeleton />}>
            <AIHooks hooks={product.aiHooks} productId={product.id} />
          </Suspense>
        </div>

        {/* Related Products */}
        <div className="mt-12 px-4 md:px-8">
          <Suspense fallback={<RelatedProductsSkeleton />}>
            <RelatedProducts storeId={storeId} currentProductId={productId} />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-ivory-100/10">
          <div className="px-4 text-center">
            <Link href="/" className="font-serif text-xl text-ivory-400 hover:text-mocha-400 transition-colors">
              Velolume
            </Link>
            <p className="font-mono text-micro text-ivory-400 mt-2">
              AI-detected product. Verify before purchasing.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Skeleton components for Suspense
function AIHooksSkeleton() {
  return (
    <div className="mt-8">
      <div className="h-5 w-32 bg-ivory-100/10 rounded animate-pulse mb-3" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-mocha-500/15 rounded-full animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="h-6 w-40 bg-ivory-100/10 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="aspect-[4/5] bg-velolume-600 animate-shimmer" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-ivory-100/10 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-mocha-500/20 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { storeId, productId } = await params;
  const product = await getProduct(storeId, productId);

  if (!product) {
    return { title: "Product Not Found | Velolume" };
  }

  return {
    title: `${product.name} | Velolume`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "product",
    },
  };
}
