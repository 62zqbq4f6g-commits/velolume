"use client";

import { GlassCard, GlassNav } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/ui/ProductCard";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import Link from "next/link";
import { useParams } from "next/navigation";

// Demo data - in production this would come from the database
const demoStore = {
  id: "demo",
  name: "Sofia's Summer Finds",
  creator: "@sofia.style",
  description: "Curated summer essentials from my latest TikTok haul. Each piece hand-picked for the perfect warm-weather aesthetic.",
  videoUrl: "/demo/video.mp4",
  posterUrl: "/demo/poster.jpg",
  products: [
    {
      id: "prod-1",
      name: "Linen Blend Oversized Blazer",
      category: "Outerwear",
      price: "$89.00",
      imageUrl: "/demo/blazer.jpg",
      colors: ["Sand", "Ivory", "Sage"],
      confidence: 0.94,
    },
    {
      id: "prod-2",
      name: "Silk Midi Skirt",
      category: "Bottoms",
      price: "$124.00",
      imageUrl: "/demo/skirt.jpg",
      colors: ["Champagne", "Blush"],
      confidence: 0.91,
    },
    {
      id: "prod-3",
      name: "Woven Leather Sandals",
      category: "Footwear",
      price: "$156.00",
      imageUrl: "/demo/sandals.jpg",
      colors: ["Tan", "Cognac"],
      confidence: 0.88,
    },
    {
      id: "prod-4",
      name: "Gold Chain Layered Necklace",
      category: "Accessories",
      price: "$42.00",
      imageUrl: "/demo/necklace.jpg",
      colors: ["Gold"],
      confidence: 0.96,
    },
    {
      id: "prod-5",
      name: "Raffia Tote Bag",
      category: "Bags",
      price: "$78.00",
      imageUrl: "/demo/tote.jpg",
      colors: ["Natural", "Black Trim"],
      confidence: 0.89,
    },
    {
      id: "prod-6",
      name: "Cotton Ribbed Tank Top",
      category: "Tops",
      price: "$34.00",
      imageUrl: "/demo/tank.jpg",
      colors: ["White", "Black", "Oatmeal"],
      confidence: 0.97,
    },
  ],
  stats: {
    views: "12.4K",
    products: 6,
    aiConfidence: "93%",
  },
};

export default function StorePage() {
  const params = useParams();
  const storeId = params.storeId as string;

  // In production, fetch store data based on storeId
  const store = demoStore;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <GlassNav>
        <div className="flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl text-ivory-100 hover:text-mocha-300 transition-colors">
            Velolume
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-ivory-400 font-mono text-sm">
              {store.creator}
            </span>
            <Button variant="ghost" size="sm">
              Share Store
            </Button>
          </div>
        </div>
      </GlassNav>

      {/* Store Header - Asymmetric */}
      <section className="pt-32 pb-16">
        <div className="container-editorial">
          <div className="grid-asymmetric items-start gap-gallery">
            {/* Left - Video with breathing room */}
            <div className="pl-asymmetric">
              <div className="sticky top-32">
                <VideoPlayer
                  src={store.videoUrl}
                  poster={store.posterUrl}
                  aspectRatio="9/16"
                  className="max-w-sm mx-auto"
                />

                {/* Video stats */}
                <div className="mt-6 flex justify-center gap-8">
                  <div className="text-center">
                    <p className="font-mono text-xl text-mocha-400">{store.stats.views}</p>
                    <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-xl text-mocha-400">{store.stats.products}</p>
                    <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">Products</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-xl text-mocha-400">{store.stats.aiConfidence}</p>
                    <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">AI Match</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Store info offset */}
            <div className="pr-asymmetric pt-8">
              <Badge variant="accent" className="mb-4">AI-Curated Collection</Badge>

              <h1 className="text-headline text-ivory-100 mb-4">
                {store.name}
              </h1>

              <p className="text-body text-ivory-400 leading-relaxed mb-8">
                {store.description}
              </p>

              <div className="flex gap-4">
                <Button size="lg">
                  Shop All Products
                </Button>
                <Button variant="ghost" size="lg">
                  Follow Creator
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-breathing bg-velolume-600/30">
        <div className="container-editorial">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-subheadline text-ivory-100 mb-2">
                Featured Products
              </h2>
              <p className="text-body-sm text-ivory-400">
                AI-detected items from this video
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm">All</Button>
              <Button variant="ghost" size="sm">Clothing</Button>
              <Button variant="ghost" size="sm">Accessories</Button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gallery">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                storeId={storeId}
                name={product.name}
                category={product.category}
                price={product.price}
                imageUrl={product.imageUrl}
                colors={product.colors}
                confidence={product.confidence}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="py-breathing">
        <div className="container-editorial">
          <GlassCard className="max-w-3xl mx-auto text-center">
            <Badge variant="success" className="mb-4">AI Analysis Complete</Badge>
            <h3 className="font-serif text-xl text-ivory-100 mb-4">
              How we built this store
            </h3>
            <p className="text-ivory-400 mb-6">
              Our AI analyzed 47 frames, transcribed 2:34 of audio, and detected 6 distinct products
              with an average confidence of 93%. Each product was matched to similar items across
              our partner retailers.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="ghost" size="sm">View AI Report</Button>
              <Button variant="ghost" size="sm">Suggest Corrections</Button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-ivory-100/10">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-serif text-xl text-ivory-400">Velolume</p>
            <p className="font-mono text-micro text-ivory-400">
              Store powered by AI. Products verified by humans.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
