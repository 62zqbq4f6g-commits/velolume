"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Store,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Play,
  Package,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  creator: string;
  creatorHandle?: string;
  thumbnail?: string;
  videoUrl?: string;
  productCount: number;
  views: number;
  status: "draft" | "live" | "archived";
  createdAt: string;
  featured?: boolean;
  theme?: {
    name: string;
    colors: {
      background: string;
      accent: string;
      text: string;
    };
  };
}

interface StoreGalleryProps {
  pollInterval?: number;
}

// Demo data as fallback
const demoStores: StoreItem[] = [
  {
    id: "store-demo-1",
    name: "Sofia's Summer Finds",
    creator: "Sofia Martinez",
    creatorHandle: "@sofia.style",
    thumbnail: "/demo/poster.jpg",
    productCount: 6,
    views: 12400,
    status: "live",
    createdAt: new Date().toISOString(),
    featured: false,
    theme: {
      name: "Velolume Noir",
      colors: { background: "#3D2B3D", accent: "#A38A7E", text: "#F5F5F5" },
    },
  },
];

export function StoreGallery({ pollInterval = 5000 }: StoreGalleryProps) {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch("/api/stores?limit=10");
      const data = await response.json();

      if (response.ok && data.stores && data.stores.length > 0) {
        // Merge API stores with demo stores
        const apiStores = data.stores.map((s: any) => ({
          ...s,
          creator: s.creator || s.creatorHandle || "Unknown",
        }));
        setStores([...apiStores]);
      } else {
        // Fall back to demo stores
        setStores(demoStores);
      }
    } catch {
      setStores(demoStores);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    const interval = setInterval(fetchStores, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStores, pollInterval]);

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getStatusBadge = (status: StoreItem["status"]) => {
    const config = {
      live: { label: "Live", class: "bg-green-100 text-green-700" },
      draft: { label: "Draft", class: "bg-amber-100 text-amber-700" },
      archived: { label: "Archived", class: "bg-industrial-grey text-industrial-dark" },
    };
    return config[status];
  };

  if (loading) {
    return (
      <div className="studio-card p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-4 text-velolume-500 animate-spin" strokeWidth={1.5} />
        <p className="text-industrial-dark font-mono text-sm">Loading stores...</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="studio-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-industrial-grey/50 flex items-center justify-center">
          <Store className="w-8 h-8 text-industrial-dark/30" strokeWidth={1.5} />
        </div>
        <p className="text-industrial-dark font-mono text-sm mb-2">No stores yet</p>
        <p className="text-industrial-dark/50 font-mono text-xs">
          Run a simulation to create your first store
        </p>
      </div>
    );
  }

  // Find featured/newest store for hero cell
  const featuredStore = stores.find((s) => s.featured) || stores[0];
  const otherStores = stores.filter((s) => s.id !== featuredStore.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-velolume-500" strokeWidth={1.5} />
          <h3 className="font-mono text-sm uppercase tracking-wider text-velolume-500">
            Store Gallery
          </h3>
          {featuredStore?.theme?.name && (
            <span className="px-2 py-0.5 bg-velolume-500 text-ivory-100 font-mono text-[10px] uppercase tracking-wider rounded">
              {featuredStore.theme.name}
            </span>
          )}
        </div>
        <button
          onClick={fetchStores}
          className="flex items-center gap-2 text-industrial-dark hover:text-velolume-500 font-mono text-xs uppercase tracking-wider transition-colors"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Featured Store - Large Cell with Velolume Noir theme */}
        <div
          className="bento-cell-4 studio-card-hover overflow-hidden group"
          onMouseEnter={() => setHoveredId(featuredStore.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            background: featuredStore.theme?.colors?.background
              ? `linear-gradient(135deg, ${featuredStore.theme.colors.background} 0%, ${featuredStore.theme.colors.background}dd 100%)`
              : undefined,
          }}
        >
          {/* Preview - Dirty Purple Theme */}
          <div className="relative aspect-video bg-velolume-500 overflow-hidden">
            {featuredStore.thumbnail ? (
              <img
                src={featuredStore.thumbnail}
                alt={featuredStore.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: featuredStore.theme?.colors?.background || "#3D2B3D" }}
              >
                <Store className="w-12 h-12 text-ivory-100/30" strokeWidth={1.5} />
              </div>
            )}

            {/* Dirty Purple Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${
                  featuredStore.theme?.colors?.background || "#3D2B3D"
                } 0%, transparent 60%)`,
              }}
            />

            {/* Play Button Overlay */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                hoveredId === featuredStore.id ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="w-16 h-16 backdrop-blur-sm flex items-center justify-center"
                style={{
                  background: `${featuredStore.theme?.colors?.accent || "#A38A7E"}cc`,
                }}
              >
                <Play className="w-6 h-6 text-ivory-100 ml-1" strokeWidth={1.5} />
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-1 font-mono text-xs uppercase tracking-wider rounded-full ${
                  getStatusBadge(featuredStore.status).class
                }`}
              >
                {getStatusBadge(featuredStore.status).label}
              </span>
              {featuredStore.featured && (
                <span className="inline-flex items-center px-2 py-1 bg-velolume-500 text-ivory-100 font-mono text-xs uppercase tracking-wider rounded-full">
                  New
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div
              className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-200 ${
                hoveredId === featuredStore.id ? "opacity-100" : "opacity-0"
              }`}
            >
              <Link
                href={`/${featuredStore.id}/prod-1`}
                className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-velolume-500" strokeWidth={1.5} />
              </Link>
            </div>

            {/* Store Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h4
                className="font-serif text-xl mb-1"
                style={{ color: featuredStore.theme?.colors?.text || "#F5F5F5" }}
              >
                {featuredStore.name}
              </h4>
              <p
                className="font-mono text-xs"
                style={{ color: `${featuredStore.theme?.colors?.text || "#F5F5F5"}aa` }}
              >
                {featuredStore.creatorHandle || featuredStore.creator}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            className="px-4 py-3 flex items-center justify-between border-t"
            style={{
              borderColor: `${featuredStore.theme?.colors?.accent || "#A38A7E"}40`,
              background: `${featuredStore.theme?.colors?.background || "#3D2B3D"}`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-1.5"
                style={{ color: featuredStore.theme?.colors?.text || "#F5F5F5" }}
              >
                <Package className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-mono text-xs">{featuredStore.productCount}</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                style={{ color: featuredStore.theme?.colors?.text || "#F5F5F5" }}
              >
                <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-mono text-xs">{formatViews(featuredStore.views)}</span>
              </div>
            </div>
            <Link
              href={`/${featuredStore.id}/prod-1`}
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
              style={{ color: featuredStore.theme?.colors?.accent || "#A38A7E" }}
            >
              Preview
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Other Stores - Smaller Cells */}
        {otherStores.map((store, index) => (
          <div
            key={store.id}
            className={`${index === 0 ? "bento-cell-3" : "bento-cell-1"} studio-card-hover overflow-hidden group`}
            onMouseEnter={() => setHoveredId(store.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Preview */}
            <div
              className="relative aspect-[4/3] overflow-hidden"
              style={{ background: store.theme?.colors?.background || "#3D2B3D" }}
            >
              {store.thumbnail ? (
                <img
                  src={store.thumbnail}
                  alt={store.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-ivory-100/30" strokeWidth={1.5} />
                </div>
              )}

              {/* Gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${
                    store.theme?.colors?.background || "#3D2B3D"
                  }cc 0%, transparent 60%)`,
                }}
              />

              {/* Status */}
              <div className="absolute top-2 left-2">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider rounded-full ${
                    getStatusBadge(store.status).class
                  }`}
                >
                  {getStatusBadge(store.status).label}
                </span>
              </div>

              {/* Hover Actions */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                  hoveredId === store.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <Link
                  href={`/${store.id}/prod-1`}
                  className="p-3 backdrop-blur-sm hover:opacity-80 transition-opacity"
                  style={{ background: `${store.theme?.colors?.accent || "#A38A7E"}cc` }}
                >
                  <Eye className="w-5 h-5 text-ivory-100" strokeWidth={1.5} />
                </Link>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4
                  className="font-serif text-sm truncate"
                  style={{ color: store.theme?.colors?.text || "#F5F5F5" }}
                >
                  {store.name}
                </h4>
                <p
                  className="font-mono text-[10px]"
                  style={{ color: `${store.theme?.colors?.text || "#F5F5F5"}99` }}
                >
                  {store.creatorHandle || store.creator}
                </p>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="px-3 py-2 flex items-center justify-between text-industrial-dark/70 bg-white">
              <span className="font-mono text-xs">{store.productCount} items</span>
              <span className="font-mono text-xs">{formatViews(store.views)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
