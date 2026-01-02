"use client";

import { GlassCard, GlassNav } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <GlassNav>
        <div className="flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl text-ivory-100 hover:text-mocha-300 transition-colors">
            Velolume
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/store/demo" className="text-ivory-400 hover:text-ivory-100 transition-colors font-mono text-sm">
              Demo Store
            </Link>
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </div>
        </div>
      </GlassNav>

      {/* Hero Section - Asymmetric */}
      <section className="pt-32 pb-breathing">
        <div className="container-editorial">
          <div className="grid-asymmetric items-center">
            {/* Left - Editorial copy */}
            <div className="space-y-8 pl-asymmetric">
              <Badge variant="accent">AI-Powered Commerce</Badge>

              <h1 className="text-display-xl text-ivory-100">
                Videos become
                <span className="block text-gradient">storefronts</span>
              </h1>

              <p className="text-body-lg text-ivory-400 max-w-xl leading-relaxed">
                Drop a TikTok, Instagram Reel, or YouTube Short. Our AI extracts products,
                generates descriptions, and builds your store—automatically.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg">
                  Create Your Store
                </Button>
                <Button variant="ghost" size="lg">
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-12 pt-8 border-t border-ivory-100/10">
                <div>
                  <p className="font-mono text-3xl text-mocha-400">2.4s</p>
                  <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">Avg. Processing</p>
                </div>
                <div>
                  <p className="font-mono text-3xl text-mocha-400">98%</p>
                  <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">Product Detection</p>
                </div>
                <div>
                  <p className="font-mono text-3xl text-mocha-400">4</p>
                  <p className="text-micro text-ivory-400 uppercase tracking-wider mt-1">Platforms Supported</p>
                </div>
              </div>
            </div>

            {/* Right - Floating preview card */}
            <div className="relative pr-asymmetric">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-mocha-500/20 blur-3xl rounded-full" />

                {/* Preview card */}
                <GlassCard padding="none" rounded="xl" className="relative overflow-hidden">
                  <div className="aspect-[9/16] bg-velolume-600 relative">
                    {/* Placeholder for video preview */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-mocha-500/20 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-mocha-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="font-mono text-sm text-ivory-400">Drop video here</p>
                      </div>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-velolume-600 via-transparent to-transparent" />
                  </div>

                  {/* Mini product preview */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-mono text-micro text-ivory-400">AI Processing...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-ivory-100/10 rounded-full w-3/4 animate-shimmer" />
                      <div className="h-3 bg-ivory-100/10 rounded-full w-1/2 animate-shimmer" />
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-breathing bg-velolume-600/30">
        <div className="container-editorial">
          <div className="text-center mb-16">
            <h2 className="text-headline text-ivory-100 mb-4">
              From scroll to sold
            </h2>
            <p className="text-body text-ivory-400 max-w-2xl mx-auto">
              The complete pipeline for turning viral content into revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gallery">
            {[
              {
                step: "01",
                title: "Paste URL",
                description: "TikTok, Instagram Reels, YouTube Shorts, or Xiaohongshu",
                icon: "🔗",
              },
              {
                step: "02",
                title: "AI Analyzes",
                description: "Whisper transcribes, GPT-4o Vision extracts products",
                icon: "🧠",
              },
              {
                step: "03",
                title: "Store Ready",
                description: "Beautiful storefront with SEO, ready for customers",
                icon: "✨",
              },
            ].map((feature) => (
              <GlassCard key={feature.step} hover className="text-center">
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <span className="font-mono text-mocha-400 text-micro">{feature.step}</span>
                <h3 className="font-serif text-xl text-ivory-100 mt-2 mb-3">
                  {feature.title}
                </h3>
                <p className="text-ivory-400 text-sm">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-ivory-100/10">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-serif text-xl text-ivory-400">Velolume</p>
            <p className="font-mono text-micro text-ivory-400">
              © 2026 Velolume. Built with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
