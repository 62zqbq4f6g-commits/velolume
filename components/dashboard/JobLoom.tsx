"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
  FileVideo,
  Mic,
  Brain,
  Download,
  Eraser,
  Sparkles,
  Palette,
  Terminal,
  Server,
  Wand2,
} from "lucide-react";

interface LogEntry {
  timestamp: string;
  status: string;
  message: string;
  details?: string;
}

interface Job {
  id: string;
  status: string;
  platform?: string;
  originalUrl?: string;
  key?: string;
  createdAt: string;
  updatedAt?: string;
  log?: LogEntry[];
  metadata?: {
    title?: string;
    author?: string;
    duration?: number;
  };
  analysis?: {
    products?: string[];
    keywords?: string[];
    sentiment?: string;
  };
  error?: string;
}

interface JobLoomProps {
  pollInterval?: number;
  maxJobs?: number;
  highlightJobId?: string | null;
  showTechnicalLog?: boolean;
}

const statusConfig: Record<string, {
  label: string;
  class: string;
  icon: React.ElementType;
}> = {
  pending: { label: "Pending", class: "job-status-pending", icon: Clock },
  queued: { label: "Queued", class: "job-status-queued", icon: Clock },
  processing: { label: "Processing", class: "job-status-processing", icon: Loader2 },
  uploaded: { label: "Uploaded", class: "job-status-queued", icon: FileVideo },
  transcribing: { label: "Transcribing", class: "job-status-transcribing", icon: Mic },
  analyzing: { label: "Analyzing", class: "job-status-analyzing", icon: Brain },
  completed: { label: "Completed", class: "job-status-completed", icon: CheckCircle2 },
  failed: { label: "Failed", class: "job-status-failed", icon: XCircle },
  // Velolume-specific statuses
  fetching_source: { label: "Fetching Source", class: "job-status-fetching", icon: Download },
  removing_watermark: { label: "Removing Watermark", class: "job-status-watermark", icon: Eraser },
  transcribing_audio: { label: "Transcribing Audio", class: "job-status-transcribing", icon: Mic },
  generating_soho_vibe: { label: "Generating Soho Vibe", class: "job-status-soho", icon: Palette },
  // Velolume Noir technical log statuses
  ingest_start: { label: "INGEST_START", class: "job-status-ingest", icon: Server },
  ai_whisper: { label: "AI_WHISPER", class: "job-status-whisper", icon: Mic },
  ai_vision: { label: "AI_VISION", class: "job-status-vision", icon: Sparkles },
  soho_gen: { label: "SOHO_GEN", class: "job-status-soho", icon: Wand2 },
};

export function JobLoom({
  pollInterval = 2000,
  maxJobs = 10,
  highlightJobId,
  showTechnicalLog = true,
}: JobLoomProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs?limit=${maxJobs}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data.jobs || []);
      setLastUpdated(new Date());
      setError(null);

      // Auto-expand job with active log
      const activeJob = (data.jobs || []).find(
        (j: Job) => j.log && j.log.length > 0 && j.status !== "completed" && j.status !== "failed"
      );
      if (activeJob && !expandedJobId) {
        setExpandedJobId(activeJob.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [maxJobs, expandedJobId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, pollInterval);
    return () => clearInterval(interval);
  }, [fetchJobs, pollInterval]);

  // Auto-scroll log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [jobs]);

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatLogTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getPlatformLabel = (platform?: string) => {
    const labels: Record<string, string> = {
      tiktok: "TikTok",
      instagram: "Instagram",
      youtube: "YouTube",
      xiaohongshu: "Xiaohongshu",
    };
    return labels[platform || ""] || "Direct";
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="studio-card p-8">
        <div className="flex items-center justify-center gap-3 text-industrial-dark">
          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
          <span className="font-mono text-sm">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-industrial-grey flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-velolume-500" strokeWidth={1.5} />
          <h3 className="font-mono text-sm uppercase tracking-wider text-velolume-500">
            Progress Loom
          </h3>
          {showTechnicalLog && (
            <span className="px-2 py-0.5 bg-velolume-500/10 text-velolume-500 font-mono text-[10px] uppercase tracking-wider rounded">
              Technical Log
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-industrial-dark/50 font-mono text-xs">
              {formatTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={fetchJobs}
            className="p-2 hover:bg-industrial-grey/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-industrial-dark" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-red-600 font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-industrial-grey/50 flex items-center justify-center">
            <Terminal className="w-8 h-8 text-industrial-dark/30" strokeWidth={1.5} />
          </div>
          <p className="text-industrial-dark font-mono text-sm mb-2">No jobs yet</p>
          <p className="text-industrial-dark/50 font-mono text-xs">
            Drop a link above to start processing
          </p>
        </div>
      ) : (
        <div className="divide-y divide-industrial-grey">
          {jobs.map((job) => {
            const config = getStatusConfig(job.status);
            const StatusIcon = config.icon;
            const isHighlighted = highlightJobId === job.id;
            const isProcessing = !["completed", "failed", "queued"].includes(job.status);
            const isExpanded = expandedJobId === job.id;
            const hasLog = job.log && job.log.length > 0;

            return (
              <div
                key={job.id}
                className={`transition-colors ${isHighlighted ? "bg-velolume-500/5" : ""}`}
              >
                {/* Job Header */}
                <div
                  className={`px-6 py-4 cursor-pointer hover:bg-industrial-grey/30 ${
                    hasLog ? "" : ""
                  }`}
                  onClick={() => hasLog && setExpandedJobId(isExpanded ? null : job.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status Badge */}
                        <span className={`${config.class} ${isProcessing ? "animate-pulse-soft" : ""}`}>
                          <StatusIcon
                            className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`}
                            strokeWidth={1.5}
                          />
                          {config.label}
                        </span>

                        {/* Platform */}
                        <span className="text-industrial-dark/50 font-mono text-xs">
                          {getPlatformLabel(job.platform)}
                        </span>

                        {/* Log indicator */}
                        {hasLog && (
                          <span className="text-velolume-500/70 font-mono text-xs">
                            {job.log!.length} logs
                          </span>
                        )}
                      </div>

                      {/* Title or URL */}
                      <p className="text-velolume-500 font-mono text-sm truncate mb-1">
                        {job.metadata?.title || job.originalUrl || job.id}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-industrial-dark/50 font-mono text-xs">
                        <span>{formatTime(job.createdAt)}</span>
                        {job.analysis?.products && job.analysis.products.length > 0 && (
                          <span>{job.analysis.products.length} products</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      {job.status === "completed" && (
                        <Link
                          href={`/demo/${job.id}`}
                          className="p-2 hover:bg-industrial-grey rounded-lg transition-colors group"
                          title="Preview Store"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye
                            className="w-4 h-4 text-industrial-dark group-hover:text-velolume-500"
                            strokeWidth={1.5}
                          />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Log Panel - JetBrains Mono scrolling display */}
                {showTechnicalLog && hasLog && isExpanded && (
                  <div className="border-t border-industrial-grey bg-velolume-600">
                    <div
                      ref={logContainerRef}
                      className="technical-log max-h-64 overflow-y-auto scrollbar-hide"
                    >
                      <div className="p-4 space-y-1">
                        {job.log!.map((entry, index) => {
                          const entryConfig = getStatusConfig(entry.status);
                          const EntryIcon = entryConfig.icon;

                          return (
                            <div
                              key={index}
                              className="technical-log-entry flex items-start gap-3 animate-fade-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {/* Timestamp */}
                              <span className="font-mono text-xs text-ivory-400/50 whitespace-nowrap">
                                {formatLogTime(entry.timestamp)}
                              </span>

                              {/* Icon */}
                              <EntryIcon
                                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                  entry.status === "completed"
                                    ? "text-green-400"
                                    : entry.status === "failed"
                                    ? "text-red-400"
                                    : "text-mocha-400"
                                }`}
                                strokeWidth={1.5}
                              />

                              {/* Message */}
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-xs text-ivory-100 leading-relaxed">
                                  {entry.message}
                                </p>
                                {entry.details && (
                                  <p className="font-mono text-[10px] text-ivory-400/70 mt-0.5">
                                    {entry.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Processing indicator */}
                        {isProcessing && (
                          <div className="flex items-center gap-3 pt-2">
                            <span className="font-mono text-xs text-ivory-400/50">
                              {formatLogTime(new Date().toISOString())}
                            </span>
                            <Loader2
                              className="w-3.5 h-3.5 text-mocha-400 animate-spin"
                              strokeWidth={1.5}
                            />
                            <span className="font-mono text-xs text-mocha-400 animate-pulse">
                              Processing...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Log Footer */}
                    <div className="px-4 py-2 border-t border-ivory-100/10 bg-velolume-700/50">
                      <div className="flex items-center justify-between text-ivory-400/50 font-mono text-[10px]">
                        <span>Velolume Noir Technical Log</span>
                        <span>{job.log!.length} entries</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress bar for processing jobs */}
                {isProcessing && !isExpanded && (
                  <div className="px-6 pb-4">
                    <div className="h-1 bg-industrial-grey rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-velolume-500/50 rounded-full animate-loom" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {jobs.length > 0 && (
        <div className="px-6 py-3 border-t border-industrial-grey bg-industrial-grey/20">
          <div className="flex items-center justify-between">
            <p className="text-industrial-dark/50 font-mono text-xs">
              {jobs.length} jobs | Polling every {pollInterval / 1000}s
            </p>
            {showTechnicalLog && (
              <span className="text-velolume-500/50 font-mono text-[10px] uppercase tracking-wider">
                JetBrains Mono
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
