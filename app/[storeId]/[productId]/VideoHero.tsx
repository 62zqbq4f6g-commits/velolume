"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface VideoHeroProps {
  videoUrl: string;
  posterUrl?: string;
  creator: {
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}

export function VideoHero({ videoUrl, posterUrl, creator }: VideoHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-hide controls after 3 seconds of playback
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="video-hero-fullbleed">
      <div
        className="video-hero-container cursor-pointer"
        onClick={togglePlay}
        onMouseMove={() => setShowControls(true)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
        />

        {/* Dirty Purple Gradient Overlay - transitions to background */}
        <div className="video-gradient-overlay" />

        {/* Top gradient for nav visibility */}
        <div className="video-gradient-top" />

        {/* Navigation Overlay */}
        <nav
          className={`absolute top-0 left-0 right-0 z-20 p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-xl text-ivory-100 hover:text-mocha-300 transition-colors drop-shadow-lg"
            >
              Velolume
            </Link>
            <button
              onClick={toggleMute}
              className="w-10 h-10 flex items-center justify-center bg-velolume-600/60 backdrop-blur-sm text-ivory-100 hover:bg-velolume-500/60 transition-colors"
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Play Button Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 flex items-center justify-center bg-ivory-100/10 backdrop-blur-sm transition-transform hover:scale-110">
              <svg
                className="w-8 h-8 text-ivory-100 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Creator Badge - bottom left */}
        <div
          className={`absolute bottom-24 left-4 z-20 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-3 bg-velolume-600/60 backdrop-blur-sm p-2 pr-4">
            <div className="w-10 h-10 bg-mocha-500/30 flex items-center justify-center">
              <span className="text-mocha-400 font-mono text-sm">
                {creator.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-ivory-100 text-sm font-medium">{creator.name}</p>
              <p className="text-ivory-400 text-micro font-mono">{creator.handle}</p>
            </div>
          </div>
        </div>

        {/* Progress indicator - thin line at bottom */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ivory-100/20 z-20">
            <div className="h-full bg-mocha-500 w-0 animate-progress" />
          </div>
        )}
      </div>
    </div>
  );
}
