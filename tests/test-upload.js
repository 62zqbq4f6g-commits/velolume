/**
 * Test script for /api/upload/sign endpoint
 * Run with: npm run test:upload
 *
 * Prerequisites: Next.js dev server running on localhost:3000
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

async function testUploadSign() {
  console.log("=".repeat(50));
  console.log("Testing /api/upload/sign endpoint");
  console.log("=".repeat(50));

  // Test 1: Health check (GET)
  console.log("\n[Test 1] Health check (GET /api/upload/sign)");
  try {
    const healthRes = await fetch(`${API_URL}/api/upload/sign`);
    const healthData = await healthRes.json();

    if (healthRes.ok && healthData.status === "ok") {
      console.log("  ✓ Health check passed");
      console.log(`    Bucket: ${healthData.bucket}`);
      console.log(`    Region: ${healthData.region}`);
    } else {
      console.log("  ✗ Health check failed");
      console.log(`    Response: ${JSON.stringify(healthData)}`);
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ Health check failed - is the server running?");
    console.log(`    Error: ${error.message}`);
    console.log("\n  Start the server with: npm run dev");
    process.exit(1);
  }

  // Test 2: Generate signed URL (POST)
  console.log("\n[Test 2] Generate signed URL (POST /api/upload/sign)");
  try {
    const signRes = await fetch(`${API_URL}/api/upload/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "test-video.mp4",
        contentType: "video/mp4",
      }),
    });
    const signData = await signRes.json();

    if (signRes.ok && signData.success) {
      console.log("  ✓ Signed URL generated successfully");
      console.log(`    File ID: ${signData.fileId}`);
      console.log(`    Key: ${signData.key}`);
      console.log(`    Expires in: ${signData.expiresIn} seconds`);
      console.log(`    URL: ${signData.signedUrl.substring(0, 80)}...`);

      // Validate URL structure
      if (signData.signedUrl.includes("sgp1.digitaloceanspaces.com")) {
        console.log("  ✓ URL points to Singapore region");
      }
      if (signData.key.startsWith("raw/")) {
        console.log("  ✓ Key starts with raw/ folder");
      }
      if (signData.signedUrl.includes("X-Amz-Expires=900")) {
        console.log("  ✓ URL expires in 15 minutes (900s)");
      }
    } else {
      console.log("  ✗ Failed to generate signed URL");
      console.log(`    Response: ${JSON.stringify(signData)}`);
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ Request failed");
    console.log(`    Error: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Missing filename validation
  console.log("\n[Test 3] Validation - missing filename");
  try {
    const validationRes = await fetch(`${API_URL}/api/upload/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const validationData = await validationRes.json();

    if (validationRes.status === 400 && validationData.error) {
      console.log("  ✓ Validation works - rejected missing filename");
    } else {
      console.log("  ✗ Validation failed - should reject empty body");
      process.exit(1);
    }
  } catch (error) {
    console.log("  ✗ Request failed");
    console.log(`    Error: ${error.message}`);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log("All tests passed! Upload signing service is working.");
  console.log("=".repeat(50));
}

testUploadSign();
