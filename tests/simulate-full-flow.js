#!/usr/bin/env node

/**
 * Simulate Full Creator Flow
 *
 * This script mimics a creator pasting a URL and watches the job progress
 * through all Velolume statuses:
 *   [FETCHING_SOURCE] → [REMOVING_WATERMARK] → [TRANSCRIBING_AUDIO] → [GENERATING_SOHO_VIBE] → [COMPLETED]
 *
 * Usage:
 *   node tests/simulate-full-flow.js [options]
 *
 * Options:
 *   --url <url>     Custom URL to simulate (default: TikTok mock)
 *   --sync          Wait for completion before exiting
 *   --watch         Poll and display status updates
 *   --create-store  Create a store entry after completion
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Velolume Noir palette (approximated for terminal)
  purple: "\x1b[35m",
  mocha: "\x1b[33m",
  ivory: "\x1b[37m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Status display config
const statusDisplay = {
  queued: { symbol: "○", color: colors.dim, label: "QUEUED" },
  fetching_source: { symbol: "↓", color: colors.cyan, label: "FETCHING_SOURCE" },
  removing_watermark: { symbol: "✂", color: colors.mocha, label: "REMOVING_WATERMARK" },
  transcribing_audio: { symbol: "♪", color: colors.blue, label: "TRANSCRIBING_AUDIO" },
  generating_soho_vibe: { symbol: "◆", color: colors.purple, label: "GENERATING_SOHO_VIBE" },
  completed: { symbol: "✓", color: colors.green, label: "COMPLETED" },
  failed: { symbol: "✗", color: colors.red, label: "FAILED" },
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: "https://www.tiktok.com/@sofia.style/video/mock-summer-haul",
    sync: false,
    watch: true,
    createStore: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--url":
        options.url = args[++i];
        break;
      case "--sync":
        options.sync = true;
        break;
      case "--watch":
        options.watch = true;
        break;
      case "--no-watch":
        options.watch = false;
        break;
      case "--create-store":
        options.createStore = true;
        break;
    }
  }

  return options;
}

// Print styled header
function printHeader() {
  console.log();
  console.log(
    `${colors.purple}${colors.bright}╔══════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.purple}${colors.bright}║${colors.reset}  ${colors.ivory}${colors.bright}VELOLUME${colors.reset} ${colors.mocha}Full Flow Simulator${colors.reset}                           ${colors.purple}${colors.bright}║${colors.reset}`
  );
  console.log(
    `${colors.purple}${colors.bright}║${colors.reset}  ${colors.dim}Testing the creator journey with Mock AI${colors.reset}                ${colors.purple}${colors.bright}║${colors.reset}`
  );
  console.log(
    `${colors.purple}${colors.bright}╚══════════════════════════════════════════════════════════╝${colors.reset}`
  );
  console.log();
}

// Print status update
function printStatus(status, message) {
  const config = statusDisplay[status] || statusDisplay.queued;
  const timestamp = new Date().toLocaleTimeString();

  console.log(
    `  ${colors.dim}[${timestamp}]${colors.reset} ${config.color}${config.symbol}${colors.reset} ${config.color}${colors.bright}[${config.label}]${colors.reset} ${message || ""}`
  );
}

// Start simulation
async function startSimulation(url, sync) {
  console.log(`${colors.dim}Starting simulation...${colors.reset}`);
  console.log(`${colors.dim}URL: ${url}${colors.reset}`);
  console.log();

  try {
    const response = await fetch(`${BASE_URL}/api/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, sync }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Simulation failed");
    }

    console.log(`${colors.green}✓${colors.reset} Job created: ${colors.bright}${data.jobId}${colors.reset}`);
    console.log();

    return data;
  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset} ${error.message}`);
    process.exit(1);
  }
}

// Poll for job status
async function pollJobStatus(jobId, maxAttempts = 30) {
  let lastStatus = "";
  let attempts = 0;

  console.log(`${colors.dim}Watching job progress...${colors.reset}`);
  console.log();

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs?id=${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job");
      }

      const job = data.jobs?.find((j) => j.id === jobId) || data.job;

      if (!job) {
        throw new Error("Job not found");
      }

      // Print status update if changed
      if (job.status !== lastStatus) {
        let message = "";

        switch (job.status) {
          case "fetching_source":
            message = "Downloading video from source...";
            break;
          case "removing_watermark":
            message = "Cleaning up video watermarks...";
            break;
          case "transcribing_audio":
            message = "Extracting audio and transcribing...";
            break;
          case "generating_soho_vibe":
            message = "Applying Velolume Noir aesthetic...";
            break;
          case "completed":
            message = "Store ready!";
            break;
          case "failed":
            message = job.error || "Processing failed";
            break;
        }

        printStatus(job.status, message);
        lastStatus = job.status;
      }

      // Exit conditions
      if (job.status === "completed") {
        console.log();
        return job;
      }

      if (job.status === "failed") {
        console.log();
        throw new Error(job.error || "Job failed");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      console.error(`${colors.red}✗ Poll error:${colors.reset} ${error.message}`);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("Polling timeout - job did not complete");
}

// Create store from completed job
async function createStore(jobId, name) {
  console.log(`${colors.dim}Creating store...${colors.reset}`);

  try {
    const response = await fetch(`${BASE_URL}/api/stores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        name: name || "Sofia's Summer Finds",
        featured: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create store");
    }

    console.log(`${colors.green}✓${colors.reset} Store created: ${colors.bright}${data.store.id}${colors.reset}`);
    return data.store;
  } catch (error) {
    console.error(`${colors.red}✗ Store error:${colors.reset} ${error.message}`);
    return null;
  }
}

// Print final summary
function printSummary(job, store) {
  console.log();
  console.log(
    `${colors.purple}${colors.bright}══════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log(`${colors.bright}  SIMULATION COMPLETE${colors.reset}`);
  console.log(
    `${colors.purple}${colors.bright}══════════════════════════════════════════════════════════${colors.reset}`
  );
  console.log();

  console.log(`  ${colors.dim}Job ID:${colors.reset}         ${job.id}`);
  console.log(`  ${colors.dim}Status:${colors.reset}         ${colors.green}${job.status}${colors.reset}`);
  console.log(`  ${colors.dim}Platform:${colors.reset}       ${job.platform || "unknown"}`);

  if (job.metadata?.title) {
    console.log(`  ${colors.dim}Title:${colors.reset}          ${job.metadata.title}`);
  }

  if (job.analysis?.products) {
    console.log(`  ${colors.dim}Products:${colors.reset}       ${job.analysis.products.length} detected`);
  }

  if (job.analysis?.keywords) {
    console.log(`  ${colors.dim}Keywords:${colors.reset}       ${job.analysis.keywords.slice(0, 3).join(", ")}`);
  }

  if (store) {
    console.log();
    console.log(`  ${colors.mocha}${colors.bright}Store Created:${colors.reset}`);
    console.log(`  ${colors.dim}Store ID:${colors.reset}       ${store.id}`);
    console.log(`  ${colors.dim}Name:${colors.reset}           ${store.name}`);
    console.log(`  ${colors.dim}Theme:${colors.reset}          ${store.theme.name}`);
  }

  console.log();
  console.log(`  ${colors.dim}View dashboard:${colors.reset} ${BASE_URL}/dashboard`);

  if (store) {
    console.log(`  ${colors.dim}Preview store:${colors.reset}  ${BASE_URL}/${store.id}/prod-1`);
  }

  console.log();

  // Print Velolume Noir theme colors
  console.log(`  ${colors.purple}${colors.bright}Velolume Noir Theme:${colors.reset}`);
  console.log(`  ${colors.dim}├─${colors.reset} Background:  #3D2B3D (Dirty Purple)`);
  console.log(`  ${colors.dim}├─${colors.reset} Accent:      #A38A7E (Mocha Mousse)`);
  console.log(`  ${colors.dim}├─${colors.reset} Text:        #F5F5F5 (Off-White)`);
  console.log(`  ${colors.dim}└─${colors.reset} Typography:  Playfair Display + JetBrains Mono`);
  console.log();
}

// Print Mock AI data
function printMockAIData(job) {
  if (!job.analysis) return;

  console.log();
  console.log(`  ${colors.mocha}${colors.bright}Mock AI Response:${colors.reset}`);

  if (job.analysis.visionData?.dominantColors) {
    console.log(`  ${colors.dim}├─${colors.reset} Dominant Colors: ${job.analysis.visionData.dominantColors.join(", ")}`);
  }

  if (job.analysis.visionData?.aestheticStyle) {
    console.log(`  ${colors.dim}├─${colors.reset} Style: ${job.analysis.visionData.aestheticStyle}`);
  }

  if (job.analysis.sentiment) {
    console.log(`  ${colors.dim}├─${colors.reset} Sentiment: ${job.analysis.sentiment}`);
  }

  if (job.analysis.products) {
    console.log(`  ${colors.dim}└─${colors.reset} Products:`);
    job.analysis.products.forEach((product, i) => {
      const prefix = i === job.analysis.products.length - 1 ? "   └─" : "   ├─";
      console.log(`      ${colors.dim}${prefix}${colors.reset} ${product}`);
    });
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  printHeader();

  // Step 1: Start simulation
  const { jobId, job: initialJob } = await startSimulation(options.url, options.sync);

  let finalJob = initialJob;
  let store = null;

  // Step 2: Watch progress (if not sync mode)
  if (options.watch && !options.sync) {
    finalJob = await pollJobStatus(jobId);
  } else if (options.sync) {
    // In sync mode, fetch the final job state
    const response = await fetch(`${BASE_URL}/api/jobs?id=${jobId}`);
    const data = await response.json();
    finalJob = data.jobs?.find((j) => j.id === jobId) || data.job || initialJob;
  }

  // Step 3: Create store (if requested and job completed)
  if (options.createStore && finalJob?.status === "completed") {
    store = await createStore(jobId, finalJob.metadata?.title);
  }

  // Step 4: Print summary
  printSummary(finalJob, store);
  printMockAIData(finalJob);

  console.log(`${colors.green}${colors.bright}✓ Simulation complete!${colors.reset}`);
  console.log();
}

// Run
main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset} ${error.message}`);
  process.exit(1);
});
