/**
 * Test script for /api/upload/url endpoint (Video Scraper)
 * Run with: npm run test:scraper
 *
 * Prerequisites: Next.js dev server running on localhost:3000
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

// Test URLs - replace with real URLs for live testing
const TEST_URLS = {
  tiktok: "https://www.tiktok.com/@tiktok/video/7106594312292453675",
  instagram: "https://www.instagram.com/reel/C1234567890",
  youtube: "https://youtube.com/shorts/dQw4w9WgXcQ",
  xiaohongshu: "https://www.xiaohongshu.com/explore/6543210fedcba",
};

async function testScraperEndpoint() {
  console.log("=".repeat(60));
  console.log("Testing /api/upload/url endpoint (Video Scraper)");
  console.log("=".repeat(60));

  // Test 1: Health check (GET)
  console.log("\n[Test 1] Health check (GET /api/upload/url)");
  try {
    const healthRes = await fetch(`${API_URL}/api/upload/url`);
    const healthData = await healthRes.json();

    if (healthRes.ok && healthData.status === "ok") {
      console.log("  ✓ Health check passed");
      console.log("  Supported platforms:");
      healthData.supportedPlatforms.forEach((p) => {
        console.log(`    - ${p.name}: ${p.example}`);
      });
    } else {
      console.log("  ✗ Health check failed");
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ Health check failed - is the server running?");
    console.log(`    Error: ${error.message}`);
    console.log("\n  Start the server with: npm run dev");
    process.exit(1);
  }

  // Test 2: Validation - missing URL
  console.log("\n[Test 2] Validation - missing URL");
  try {
    const res = await fetch(`${API_URL}/api/upload/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    if (res.status === 400 && data.error) {
      console.log("  ✓ Correctly rejected missing URL");
    } else {
      console.log("  ✗ Should reject missing URL");
      process.exit(1);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Validation - invalid URL
  console.log("\n[Test 3] Validation - invalid/unsupported URL");
  try {
    const res = await fetch(`${API_URL}/api/upload/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/video.mp4" }),
    });
    const data = await res.json();

    if (res.status === 400 && data.error.includes("Unsupported platform")) {
      console.log("  ✓ Correctly rejected unsupported platform");
    } else {
      console.log("  ✗ Should reject unsupported platform");
      process.exit(1);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  // Test 4: Platform detection via URL patterns
  console.log("\n[Test 4] Platform detection (URL patterns)");
  const platformTests = [
    { url: "https://www.tiktok.com/@user/video/123456", expected: "tiktok" },
    { url: "https://vm.tiktok.com/ABC123", expected: "tiktok" },
    { url: "https://www.instagram.com/reel/ABC123", expected: "instagram" },
    { url: "https://instagram.com/p/ABC123", expected: "instagram" },
    { url: "https://youtube.com/shorts/ABC123", expected: "youtube" },
    { url: "https://youtu.be/ABC123", expected: "youtube" },
    { url: "https://www.xiaohongshu.com/explore/abc123", expected: "xiaohongshu" },
  ];

  let allPassed = true;
  for (const test of platformTests) {
    const res = await fetch(`${API_URL}/api/upload/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: test.url }),
    });
    const data = await res.json();

    // We expect either success with correct platform, or 422 (scrape failed but platform detected)
    const platformDetected = data.platform === test.expected;
    if (platformDetected) {
      console.log(`  ✓ ${test.url.substring(0, 40)}... → ${test.expected}`);
    } else {
      console.log(`  ✗ ${test.url} → expected ${test.expected}, got ${data.platform}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("  ✓ All platform patterns detected correctly");
  }

  // Test 5: Live TikTok scrape (optional - requires real URL)
  console.log("\n[Test 5] Live TikTok scrape (optional)");
  const liveTikTokUrl = process.env.TEST_TIKTOK_URL;

  if (liveTikTokUrl) {
    console.log(`  Testing with: ${liveTikTokUrl}`);
    try {
      const res = await fetch(`${API_URL}/api/upload/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: liveTikTokUrl }),
      });
      const data = await res.json();

      if (data.success) {
        console.log("  ✓ Live scrape successful!");
        console.log(`    File ID: ${data.fileId}`);
        console.log(`    Key: ${data.key}`);
        console.log(`    Size: ${(data.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Endpoint: ${data.endpoint}`);
      } else {
        console.log(`  ⚠ Live scrape failed: ${data.error}`);
        console.log("    (This is expected if the video URL is invalid or API rate limited)");
      }
    } catch (error) {
      console.log(`  ⚠ Live test error: ${error.message}`);
    }
  } else {
    console.log("  ⏭ Skipped (set TEST_TIKTOK_URL env var to test)");
    console.log("  Example: TEST_TIKTOK_URL='https://vm.tiktok.com/...' npm run test:scraper");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Scraper endpoint tests completed!");
  console.log("=".repeat(60));
}

testScraperEndpoint();
