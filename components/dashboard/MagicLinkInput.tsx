"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2, CheckCircle, AlertCircle, Link2 } from "lucide-react";

interface MagicLinkInputProps {
  onJobCreated?: (jobId: string) => void;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export function MagicLinkInput({ onJobCreated }: MagicLinkInputProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setState("error");
      setMessage("Please enter a URL");
      return;
    }

    setState("loading");
    setMessage("Analyzing video...");

    try {
      const response = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process URL");
      }

      setState("success");
      setMessage(`Job created: ${data.jobId}`);
      setJobId(data.jobId);

      if (onJobCreated) {
        onJobCreated(data.jobId);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setState("idle");
        setUrl("");
        setMessage("");
        setJobId(null);
      }, 3000);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unknown error");

      // Reset error after 5 seconds
      setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 5000);
    }
  }, [url, onJobCreated]);

  const getIcon = () => {
    switch (state) {
      case "loading":
        return <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />;
      default:
        return <Link2 className="w-5 h-5 text-industrial-dark/50" strokeWidth={1.5} />;
    }
  };

  const getButtonText = () => {
    switch (state) {
      case "loading":
        return "Processing...";
      case "success":
        return "Done!";
      case "error":
        return "Try Again";
      default:
        return "Transform";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl text-velolume-500 mb-2">
          Drop the Magic Link
        </h2>
        <p className="text-industrial-dark font-mono text-sm">
          TikTok, Instagram Reels, YouTube Shorts, or Xiaohongshu
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {getIcon()}
          </div>

          {/* Input */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            className={`
              magic-input pl-12 pr-36
              ${state === "error" ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}
              ${state === "success" ? "border-green-400 focus:border-green-500 focus:ring-green-500/10" : ""}
            `}
            disabled={state === "loading"}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={state === "loading" || state === "success"}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center gap-2 px-4 py-2
              font-mono text-sm uppercase tracking-wider
              transition-all duration-200
              ${state === "success"
                ? "bg-green-600 text-white"
                : state === "error"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-velolume-500 text-ivory-100 hover:bg-velolume-400"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {state === "idle" && <Upload className="w-4 h-4" strokeWidth={1.5} />}
            {getButtonText()}
          </button>
        </div>

        {/* Message */}
        {message && (
          <p className={`
            mt-3 font-mono text-sm text-center
            ${state === "error" ? "text-red-500" : ""}
            ${state === "success" ? "text-green-600" : ""}
            ${state === "loading" ? "text-industrial-dark animate-pulse-soft" : ""}
          `}>
            {message}
          </p>
        )}
      </form>

      {/* Supported Platforms */}
      <div className="mt-8 flex justify-center gap-6">
        {[
          { name: "TikTok", pattern: "tiktok.com" },
          { name: "Instagram", pattern: "instagram.com" },
          { name: "YouTube", pattern: "youtube.com" },
          { name: "Xiaohongshu", pattern: "xiaohongshu.com" },
        ].map((platform) => (
          <span
            key={platform.name}
            className="text-industrial-dark/50 font-mono text-xs uppercase tracking-wider"
          >
            {platform.name}
          </span>
        ))}
      </div>
    </div>
  );
}
