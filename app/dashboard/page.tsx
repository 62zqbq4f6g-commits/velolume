"use client";

import { useState } from "react";
import { Zap, TrendingUp, Package, Clock, Play, Loader2 } from "lucide-react";
import { MagicLinkInput } from "@/components/dashboard/MagicLinkInput";
import { JobLoom } from "@/components/dashboard/JobLoom";
import { StoreGallery } from "@/components/dashboard/StoreGallery";
import { Pulse } from "@/components/dashboard/Pulse";

export default function DashboardPage() {
  const [highlightJobId, setHighlightJobId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleJobCreated = (jobId: string) => {
    setHighlightJobId(jobId);
    // Clear highlight after 10 seconds
    setTimeout(() => setHighlightJobId(null), 10000);
  };

  const handleSimulate = async () => {
    if (simulating) return;

    setSimulating(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createStore: true }),
      });

      const data = await response.json();
      if (data.jobId) {
        setHighlightJobId(data.jobId);
        setTimeout(() => setHighlightJobId(null), 15000);
      }
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-velolume-500 mb-2">
            Studio Dashboard
          </h1>
          <p className="font-mono text-sm text-industrial-dark">
            Transform social videos into storefronts with AI
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="flex items-center gap-2 px-4 py-2 bg-velolume-500 text-ivory-100 font-mono text-sm uppercase tracking-wider hover:bg-velolume-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {simulating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              Simulating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" strokeWidth={1.5} />
              Simulate Flow
            </>
          )}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: "3", icon: Zap, change: "+2 today" },
          { label: "Total Stores", value: "12", icon: Package, change: "+1 this week" },
          { label: "Products Found", value: "47", icon: TrendingUp, change: "+12 today" },
          { label: "Avg. Process Time", value: "2.4s", icon: Clock, change: "-0.3s" },
        ].map((stat) => (
          <div key={stat.label} className="studio-card p-4">
            <div className="flex items-start justify-between mb-3">
              <stat.icon className="w-5 h-5 text-velolume-500" strokeWidth={1.5} />
              <span className="text-green-600 font-mono text-xs">{stat.change}</span>
            </div>
            <p className="font-mono text-2xl text-velolume-500 mb-1">{stat.value}</p>
            <p className="font-mono text-xs text-industrial-dark uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Magic Link Input - Centered */}
      <div className="studio-card p-8">
        <MagicLinkInput onJobCreated={handleJobCreated} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Job Loom */}
        <div className="col-span-5">
          <JobLoom
            pollInterval={3000}
            maxJobs={8}
            highlightJobId={highlightJobId}
          />
        </div>

        {/* Right: Store Gallery */}
        <div className="col-span-7">
          <StoreGallery />
        </div>
      </div>

      {/* Analytics Pulse */}
      <Pulse pollInterval={5000} showRealtime={true} />
    </div>
  );
}
