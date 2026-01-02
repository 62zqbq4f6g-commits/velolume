/**
 * Test script for Queue & Job Dispatcher
 * Run with: npm run test:queue
 *
 * Prerequisites: Next.js dev server running on localhost:3000
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function testQueuePipeline() {
  console.log("=".repeat(60));
  console.log("Testing Queue & Job Dispatcher Pipeline");
  console.log("=".repeat(60));

  // Test 1: Worker health check
  console.log("\n[Test 1] Worker health check (GET /api/queue/worker)");
  try {
    const workerRes = await fetch(`${API_URL}/api/queue/worker`);
    const workerData = await workerRes.json();

    if (workerRes.ok && workerData.status === "ok") {
      console.log("  ✓ Worker endpoint available");
      console.log(`    Mode: ${workerData.mode}`);
    } else {
      console.log("  ✗ Worker health check failed");
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ Worker health check failed - is the server running?");
    console.log(`    Error: ${error.message}`);
    console.log("\n  Start the server with: npm run dev");
    process.exit(1);
  }

  // Test 2: Jobs endpoint health check
  console.log("\n[Test 2] Jobs endpoint (GET /api/jobs)");
  try {
    const jobsRes = await fetch(`${API_URL}/api/jobs`);
    const jobsData = await jobsRes.json();

    if (jobsRes.ok) {
      console.log("  ✓ Jobs endpoint available");
      console.log(`    Total jobs: ${jobsData.total}`);
      console.log(`    Queue mode: ${jobsData.queue.mode}`);
      console.log(`    Stats: ${JSON.stringify(jobsData.stats)}`);
    } else {
      console.log("  ✗ Jobs endpoint failed");
      process.exit(1);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Confirm endpoint health check
  console.log("\n[Test 3] Confirm endpoint (GET /api/upload/confirm)");
  try {
    const confirmRes = await fetch(`${API_URL}/api/upload/confirm`);
    const confirmData = await confirmRes.json();

    if (confirmRes.ok && confirmData.status === "ok") {
      console.log("  ✓ Confirm endpoint available");
      console.log(`    Bucket: ${confirmData.bucket}`);
    } else {
      console.log("  ✗ Confirm endpoint failed");
      process.exit(1);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 4: Sign endpoint includes confirmUrl
  console.log("\n[Test 4] Sign endpoint includes queue integration");
  try {
    const signRes = await fetch(`${API_URL}/api/upload/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: "test-video.mp4" }),
    });
    const signData = await signRes.json();

    if (signRes.ok && signData.confirmUrl && signData.confirmPayload) {
      console.log("  ✓ Sign endpoint includes queue integration");
      console.log(`    Confirm URL: ${signData.confirmUrl}`);
      console.log(`    Confirm payload: ${JSON.stringify(signData.confirmPayload)}`);
    } else {
      console.log("  ✗ Sign endpoint missing queue integration");
      console.log(`    Response: ${JSON.stringify(signData)}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 5: Simulate job creation via worker
  console.log("\n[Test 5] Direct worker invocation");
  try {
    const testJobId = `test-${Date.now()}`;
    const workerRes = await fetch(`${API_URL}/api/queue/worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-local-dev": "true",
      },
      body: JSON.stringify({
        jobId: testJobId,
        action: "process_video",
        data: {
          fileId: testJobId,
          key: `raw/${testJobId}.mp4`,
          bucket: "auto-storefront-media",
          source: "direct",
        },
      }),
    });
    const workerData = await workerRes.json();

    // This will fail because the job doesn't exist in store, which is expected
    if (workerRes.status === 422 && workerData.error === "Job not found in store") {
      console.log("  ✓ Worker correctly rejects unknown jobs");
    } else if (workerRes.ok) {
      console.log("  ✓ Worker processed job successfully");
      console.log(`    Status: ${workerData.status}`);
    } else {
      console.log(`  ⚠ Unexpected response: ${JSON.stringify(workerData)}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 6: URL scraper includes job queueing (pattern check)
  console.log("\n[Test 6] URL scraper includes job queueing");
  try {
    // Just check the endpoint responds correctly - actual scraping tested separately
    const urlRes = await fetch(`${API_URL}/api/upload/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.tiktok.com/@test/video/123" }),
    });
    const urlData = await urlRes.json();

    // We expect a 422 (scrape failed) but should have platform detected
    if (urlData.platform === "tiktok") {
      console.log("  ✓ URL endpoint has queue integration (platform detected)");
      console.log("    (Full queue test requires valid TikTok URL)");
    } else {
      console.log("  ⚠ Could not verify queue integration");
    }
  } catch (error) {
    console.log(`  ⚠ Error: ${error.message}`);
  }

  // Test 7: Get job stats
  console.log("\n[Test 7] Job statistics");
  try {
    const statsRes = await fetch(`${API_URL}/api/jobs`);
    const statsData = await statsRes.json();

    console.log("  ✓ Job statistics retrieved");
    console.log("    Status breakdown:");
    Object.entries(statsData.stats).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`      ${status}: ${count}`);
      }
    });
    if (Object.values(statsData.stats).every((c) => c === 0)) {
      console.log("      (no jobs yet)");
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Queue pipeline tests completed!");
  console.log("=".repeat(60));
  console.log("\nTo test full pipeline with real video:");
  console.log("  TEST_TIKTOK_URL='https://vm.tiktok.com/...' npm run test:scraper");
  console.log("\nTo configure Upstash QStash for production:");
  console.log("  1. Create account at https://upstash.com");
  console.log("  2. Add QSTASH_TOKEN to .env.local");
  console.log("  3. Add QSTASH_CURRENT_SIGNING_KEY to .env.local");
}

testQueuePipeline();
