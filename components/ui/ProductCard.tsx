"use client";

import Link from "next/link";
import { Badge } from "./Badge";

interface ProductCardProps {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: string;
  imageUrl?: string;
  videoUrl?: string;
  colors?: string[];
  confidence?: number;
}

export function ProductCard({
  id,
  storeId,
  name,
  category,
  price,
  imageUrl,
  videoUrl,
  colors = [],
  confidence,
}: ProductCardProps) {
  return (
    <Link href={`/store/${storeId}/${id}`}>
      <article className="product-card group cursor-pointer">
        {/* Image/Video Container */}
        <div className="product-card-image bg-velolume-600">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-ivory-400 font-mono text-sm">No Image</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-velolume-600 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <Badge>{category}</Badge>
          </div>

          {/* Video indicator */}
          {videoUrl && (
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 rounded-full bg-velolume-600/60 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-4 h-4 text-ivory-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="product-card-content">
          {/* Product name */}
          <h3 className="font-serif text-lg text-ivory-100 group-hover:text-mocha-300 transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Price */}
          <p className="price-tag text-lg">
            {price}
          </p>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-micro text-ivory-400 font-mono uppercase">Colors:</span>
              <div className="flex gap-1">
                {colors.slice(0, 4).map((color, i) => (
                  <span
                    key={i}
                    className="text-micro text-mocha-400 font-mono"
                  >
                    {color}{i < Math.min(colors.length, 4) - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Confidence */}
          {confidence !== undefined && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-micro text-ivory-400 font-mono uppercase">AI:</span>
              <div className="flex-1 h-1 bg-velolume-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mocha-500 rounded-full"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="text-micro text-mocha-400 font-mono">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
