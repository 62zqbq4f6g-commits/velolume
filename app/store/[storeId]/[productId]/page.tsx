"use client";

import { GlassCard, GlassNav } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

// Demo product data - in production this would come from the database
const demoProducts: Record<string, {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  videoTimestamp: string;
  colors: string[];
  sizes: string[];
  confidence: number;
  aiNotes: string;
  materials: string[];
  careInstructions: string[];
  similarProducts: { id: string; name: string; price: string; imageUrl: string; }[];
}> = {
  "prod-1": {
    id: "prod-1",
    name: "Linen Blend Oversized Blazer",
    category: "Outerwear",
    price: "$89.00",
    description: "Effortlessly chic oversized blazer in a breathable linen blend. Perfect for layering over summer dresses or pairing with high-waisted trousers.",
    longDescription: "This relaxed-fit blazer combines the timeless appeal of classic tailoring with modern comfort. The linen-cotton blend fabric ensures breathability during warm months while maintaining a polished structure. Features include notched lapels, a single-button closure, and patch pockets that add a casual touch to the sophisticated silhouette.",
    imageUrl: "/demo/blazer.jpg",
    videoTimestamp: "0:34",
    colors: ["Sand", "Ivory", "Sage"],
    sizes: ["XS", "S", "M", "L", "XL"],
    confidence: 0.94,
    aiNotes: "Detected at timestamp 0:34. High confidence match based on structured shoulders, relaxed fit, and natural fiber texture. Color detected as warm sand/beige tone.",
    materials: ["55% Linen", "45% Cotton"],
    careInstructions: ["Dry clean recommended", "Iron on low heat", "Do not tumble dry"],
    similarProducts: [
      { id: "sim-1", name: "Cotton Blazer", price: "$79.00", imageUrl: "/demo/sim-1.jpg" },
      { id: "sim-2", name: "Wool Blend Coat", price: "$145.00", imageUrl: "/demo/sim-2.jpg" },
    ],
  },
};

// Fallback for any product ID
const defaultProduct = {
  id: "default",
  name: "AI-Detected Product",
  category: "Fashion",
  price: "$0.00",
  description: "Product details are being processed by our AI.",
  longDescription: "Our AI is still analyzing this product. Full details will be available shortly.",
  imageUrl: "/demo/placeholder.jpg",
  videoTimestamp: "0:00",
  colors: [],
  sizes: [],
  confidence: 0,
  aiNotes: "Processing...",
  materials: [],
  careInstructions: [],
  similarProducts: [],
};

export default function ProductPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const productId = params.productId as string;

  const product = demoProducts[productId] || defaultProduct;
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <GlassNav>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif text-2xl text-ivory-100 hover:text-mocha-300 transition-colors">
              Velolume
            </Link>
            <span className="text-ivory-400">/</span>
            <Link href={`/store/${storeId}`} className="text-ivory-400 hover:text-ivory-100 transition-colors font-mono text-sm">
              Back to Store
            </Link>
          </div>
          <Button variant="ghost" size="sm">
            Share Product
          </Button>
        </div>
      </GlassNav>

      {/* Product Detail - Asymmetric Layout */}
      <section className="pt-32 pb-breathing">
        <div className="container-editorial">
          {/*
            ASYMMETRIC GRID: Video gets 60% (breathing room),
            Product info offset on right with 40%
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-16 xl:gap-24">

            {/* LEFT COLUMN - Media (Video + Image) with breathing room */}
            <div className="space-y-8 lg:pl-8 xl:pl-12">
              {/* Source Video Context */}
              <div>
                <p className="text-micro text-ivory-400 font-mono uppercase tracking-wider mb-4">
                  From the original video
                </p>
                <GlassCard padding="none" className="overflow-hidden">
                  <div className="aspect-video bg-velolume-600 relative">
                    {/* Placeholder for video clip */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-mocha-500/20 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-mocha-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="font-mono text-sm text-ivory-400">
                          Product appears at {product.videoTimestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Product Image - Large with room to breathe */}
              <div>
                <p className="text-micro text-ivory-400 font-mono uppercase tracking-wider mb-4">
                  Product Detail
                </p>
                <GlassCard padding="none" className="overflow-hidden">
                  <div className="aspect-[4/5] bg-velolume-600 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-ivory-400 font-mono text-sm">Image loading...</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* AI Detection Info */}
              <GlassCard className="border-mocha-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-mocha-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-mocha-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-micro text-mocha-400 font-mono uppercase tracking-wider mb-1">
                      AI Detection Notes
                    </p>
                    <p className="text-ivory-400 text-sm leading-relaxed">
                      {product.aiNotes}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* RIGHT COLUMN - Product Info (offset, editorial spacing) */}
            <div className="lg:pt-16 xl:pt-24 lg:pr-8">
              {/* Category & Confidence */}
              <div className="flex items-center gap-3 mb-6">
                <Badge>{product.category}</Badge>
                <Badge variant="success">
                  {Math.round(product.confidence * 100)}% AI Match
                </Badge>
              </div>

              {/* Product Name - Editorial typography */}
              <h1 className="font-serif text-3xl md:text-4xl text-ivory-100 leading-tight mb-6">
                {product.name}
              </h1>

              {/* Price - Prominent */}
              <p className="price-tag text-2xl mb-8">
                {product.price}
              </p>

              {/* Short Description */}
              <p className="text-body text-ivory-400 leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Divider */}
              <div className="h-px bg-ivory-100/10 my-8" />

              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="mb-8">
                  <p className="text-micro text-ivory-400 font-mono uppercase tracking-wider mb-3">
                    Color: <span className="text-ivory-100">{selectedColor}</span>
                  </p>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`
                          px-4 py-2 rounded-full font-mono text-sm transition-all
                          ${selectedColor === color
                            ? "bg-mocha-500 text-ivory-100"
                            : "bg-ivory-100/10 text-ivory-400 hover:bg-ivory-100/20"
                          }
                        `}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-micro text-ivory-400 font-mono uppercase tracking-wider mb-3">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          w-12 h-12 rounded-gummy font-mono text-sm transition-all
                          ${selectedSize === size
                            ? "bg-mocha-500 text-ivory-100"
                            : "bg-ivory-100/10 text-ivory-400 hover:bg-ivory-100/20"
                          }
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 mb-8">
                <Button size="lg" className="w-full">
                  Find This Item
                </Button>
                <Button variant="ghost" size="lg" className="w-full">
                  Save to Wishlist
                </Button>
              </div>

              {/* Divider */}
              <div className="h-px bg-ivory-100/10 my-8" />

              {/* Product Details Accordion-style */}
              <div className="space-y-6">
                {/* Description */}
                <details className="group" open>
                  <summary className="flex items-center justify-between cursor-pointer">
                    <span className="text-micro text-ivory-100 font-mono uppercase tracking-wider">
                      Description
                    </span>
                    <svg className="w-4 h-4 text-ivory-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-ivory-400 text-sm leading-relaxed mt-4">
                    {product.longDescription}
                  </p>
                </details>

                {/* Materials */}
                {product.materials.length > 0 && (
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <span className="text-micro text-ivory-100 font-mono uppercase tracking-wider">
                        Materials
                      </span>
                      <svg className="w-4 h-4 text-ivory-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <ul className="text-ivory-400 text-sm mt-4 space-y-1">
                      {product.materials.map((material, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-mocha-400" />
                          {material}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Care Instructions */}
                {product.careInstructions.length > 0 && (
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <span className="text-micro text-ivory-100 font-mono uppercase tracking-wider">
                        Care Instructions
                      </span>
                      <svg className="w-4 h-4 text-ivory-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <ul className="text-ivory-400 text-sm mt-4 space-y-1">
                      {product.careInstructions.map((instruction, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-mocha-400" />
                          {instruction}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {product.similarProducts.length > 0 && (
        <section className="py-breathing bg-velolume-600/30">
          <div className="container-editorial">
            <h2 className="text-subheadline text-ivory-100 mb-8">
              Similar Items
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gallery">
              {product.similarProducts.map((similar) => (
                <GlassCard key={similar.id} padding="none" hover className="cursor-pointer">
                  <div className="aspect-[3/4] bg-velolume-600">
                    {similar.imageUrl && (
                      <img
                        src={similar.imageUrl}
                        alt={similar.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-sm text-ivory-100 line-clamp-1">
                      {similar.name}
                    </h3>
                    <p className="price-tag text-sm mt-1">{similar.price}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-ivory-100/10">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-serif text-xl text-ivory-400">Velolume</p>
            <p className="font-mono text-micro text-ivory-400">
              Product detected by AI. Verify before purchasing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
