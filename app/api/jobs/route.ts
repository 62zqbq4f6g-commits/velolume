/**
 * API Route: /api/jobs
 *
 * Get job status and list all jobs.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, getJob, getJobStats, getJobsByStatus, JobStatus } from "@/lib/store/job-store";
import { getQueueInfo } from "@/lib/queue/video-queue";

// Get all jobs or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as JobStatus | null;
    const jobId = searchParams.get("id");

    // Get single job by ID
    if (jobId) {
      const job = getJob(jobId);
      if (!job) {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ job });
    }

    // Get jobs by status or all jobs
    const jobs = status ? getJobsByStatus(status) : getAllJobs();
    const stats = getJobStats();
    const queueInfo = getQueueInfo();

    return NextResponse.json({
      jobs,
      total: jobs.length,
      stats,
      queue: queueInfo,
    });
  } catch (error) {
    console.error("[Jobs API] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to fetch jobs: ${errorMessage}` },
      { status: 500 }
    );
  }
}
