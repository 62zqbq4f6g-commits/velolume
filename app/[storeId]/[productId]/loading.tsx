/**
 * Loading Skeleton for Product Page
 *
 * Provides instant "vibe" while AI-generated content streams in.
 * Uses the Velolume Noir aesthetic with shimmer animations.
 */

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-velolume-500">
      {/* Full-bleed Video Skeleton */}
      <div className="video-hero-fullbleed">
        <div className="video-hero-container bg-velolume-600">
          {/* Shimmer effect */}
          <div className="absolute inset-0 animate-shimmer" />

          {/* Play button skeleton */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-ivory-100/10 animate-pulse" />
          </div>

          {/* Gradient overlay */}
          <div className="video-gradient-overlay" />
          <div className="video-gradient-top" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="relative z-10 -mt-16 px-4 pb-8">
        {/* Product info card skeleton */}
        <div className="glass-card p-6 space-y-4">
          {/* Badge skeleton */}
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-ivory-100/10 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-mocha-500/20 rounded-full animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-ivory-100/10 rounded w-3/4 animate-pulse" />
            <div className="h-8 bg-ivory-100/10 rounded w-1/2 animate-pulse" />
          </div>

          {/* Price skeleton */}
          <div className="h-10 w-32 bg-mocha-500/20 rounded animate-pulse" />

          {/* Description skeleton */}
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-ivory-100/10 rounded w-full animate-pulse" />
            <div className="h-4 bg-ivory-100/10 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-ivory-100/10 rounded w-4/6 animate-pulse" />
          </div>
        </div>

        {/* One-Tap Buy skeleton */}
        <div className="mt-6">
          <div className="h-14 bg-mocha-500/30 animate-pulse" />
        </div>

        {/* AI Hooks skeleton */}
        <div className="mt-8 space-y-3">
          <div className="h-5 w-32 bg-ivory-100/10 rounded animate-pulse" />
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-24 bg-mocha-500/15 rounded-full animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Related products skeleton */}
        <div className="mt-8">
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
      </div>
    </div>
  );
}
