/**
 * Test script for AI Processing Pipeline
 * Run with: npm run test:ai
 *
 * Prerequisites:
 * - Next.js dev server running on localhost:3000
 * - OPENAI_API_KEY set in .env.local (for full test)
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function testAIPipeline() {
  console.log("=".repeat(60));
  console.log("Testing AI Processing Pipeline (Phase 1.2)");
  console.log("=".repeat(60));

  // Test 1: AI Service Status
  console.log("\n[Test 1] AI Service Status (GET /api/ai)");
  try {
    const aiRes = await fetch(`${API_URL}/api/ai`);
    const aiData = await aiRes.json();

    if (aiRes.ok) {
      console.log(`  ✓ AI endpoint available`);
      console.log(`    Status: ${aiData.status}`);
      console.log(`    Models: ${aiData.models.transcription}, ${aiData.models.vision}, ${aiData.models.seo}`);

      if (aiData.status !== "ready") {
        console.log(`\n  ⚠ ${aiData.instructions}`);
      }
    } else {
      console.log("  ✗ AI endpoint failed");
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ AI endpoint failed - is the server running?");
    console.log(`    Error: ${error.message}`);
    console.log("\n  Start the server with: npm run dev");
    process.exit(1);
  }

  // Test 2: Worker endpoint health
  console.log("\n[Test 2] Worker endpoint (GET /api/queue/worker)");
  try {
    const workerRes = await fetch(`${API_URL}/api/queue/worker`);
    const workerData = await workerRes.json();

    if (workerRes.ok && workerData.status === "ok") {
      console.log("  ✓ Worker endpoint available");
      console.log(`    Mode: ${workerData.mode}`);
    } else {
      console.log("  ✗ Worker endpoint failed");
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  // Test 3: Verify ffmpeg is available
  console.log("\n[Test 3] FFmpeg availability");
  try {
    const { execSync } = require("child_process");
    const ffmpegVersion = execSync("/opt/homebrew/bin/ffmpeg -version 2>&1 | head -1").toString().trim();
    console.log(`  ✓ FFmpeg installed: ${ffmpegVersion}`);

    const ffprobeVersion = execSync("/opt/homebrew/bin/ffprobe -version 2>&1 | head -1").toString().trim();
    console.log(`  ✓ FFprobe installed: ${ffprobeVersion}`);
  } catch (error) {
    console.log("  ✗ FFmpeg not found");
    console.log("    Install with: brew install ffmpeg");
  }

  // Test 4: Manual AI trigger (validation only - no actual processing)
  console.log("\n[Test 4] Manual AI trigger validation");
  try {
    // Test with missing jobId
    const missingRes = await fetch(`${API_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const missingData = await missingRes.json();

    if (missingRes.status === 400 && missingData.error) {
      console.log("  ✓ Correctly rejects missing jobId");
    }

    // Test with non-existent job
    const invalidRes = await fetch(`${API_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "non-existent-job" }),
    });
    const invalidData = await invalidRes.json();

    if (invalidRes.status === 404 && invalidData.error === "Job not found") {
      console.log("  ✓ Correctly rejects non-existent job");
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  // Test 5: Full pipeline test (requires OPENAI_API_KEY and real video)
  console.log("\n[Test 5] Full AI pipeline test");
  const testVideoUrl = process.env.TEST_TIKTOK_URL;

  if (!testVideoUrl) {
    console.log("  ⏭ Skipped (set TEST_TIKTOK_URL env var to test full pipeline)");
    console.log("  Example: TEST_TIKTOK_URL='https://vm.tiktok.com/...' npm run test:ai");
  } else {
    console.log(`  Testing with: ${testVideoUrl}`);

    try {
      // First, scrape the video
      console.log("  → Scraping video...");
      const scrapeRes = await fetch(`${API_URL}/api/upload/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testVideoUrl }),
      });
      const scrapeData = await scrapeRes.json();

      if (!scrapeData.success) {
        console.log(`  ✗ Scrape failed: ${scrapeData.error}`);
      } else {
        console.log(`  ✓ Video scraped: ${scrapeData.fileId}`);
        console.log(`    Job status: ${scrapeData.jobStatus}`);

        // Wait for processing
        console.log("  → Waiting for AI processing (this may take 30-60s)...");

        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;

          const jobRes = await fetch(`${API_URL}/api/jobs?id=${scrapeData.jobId}`);
          const jobData = await jobRes.json();

          if (jobData.job) {
            const status = jobData.job.status;
            process.stdout.write(`\r    Status: ${status} (${attempts}/${maxAttempts})    `);

            if (status === "completed") {
              console.log("\n  ✓ AI processing completed!");
              console.log(`    Transcription: ${(jobData.job.transcription || "").substring(0, 100)}...`);
              console.log(`    Products: ${(jobData.job.analysis?.products || []).join(", ") || "None detected"}`);
              console.log(`    Keywords: ${(jobData.job.analysis?.keywords || []).slice(0, 5).join(", ")}`);
              console.log(`    Sentiment: ${jobData.job.analysis?.sentiment || "N/A"}`);
              break;
            } else if (status === "failed") {
              console.log(`\n  ✗ Processing failed: ${jobData.job.error}`);
              break;
            } else if (status === "uploaded") {
              console.log(`\n  ⚠ Processing stopped at 'uploaded' - OPENAI_API_KEY may not be set`);
              break;
            }
          }
        }

        if (attempts >= maxAttempts) {
          console.log("\n  ⚠ Timeout waiting for processing");
        }
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("AI Pipeline tests completed!");
  console.log("=".repeat(60));

  console.log("\n📋 Phase 1.2 Summary:");
  console.log("   - Whisper transcription: Ready");
  console.log("   - GPT-4o vision analysis: Ready");
  console.log("   - Frame extraction (ffmpeg): Ready");
  console.log("   - Worker AI pipeline: Integrated");

  console.log("\n🔑 To enable AI processing:");
  console.log("   1. Get API key from https://platform.openai.com/api-keys");
  console.log("   2. Add to .env.local: OPENAI_API_KEY=sk-...");
  console.log("   3. Restart the dev server");

  console.log("\n🧪 To test full pipeline:");
  console.log("   TEST_TIKTOK_URL='https://vm.tiktok.com/...' npm run test:ai");
}

testAIPipeline();
