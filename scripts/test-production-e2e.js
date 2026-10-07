/**
 * PRODUCTION HARDENING FULL E2E TEST SUITE (Playwright)
 * Testing all routes across 9 viewports:
 * 320x700, 360x800, 375x812, 390x844, 430x932, 768x1024, 1024x768, 1280x900, 1440x1000
 * Zero horizontal overflow verification, checkout validation, drawers, dock, modals.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.E2E_PORT || 3218);
const baseUrl = `http://127.0.0.1:${port}`;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const viewports = [
  { name: "320x700 (Mobile Small)", width: 320, height: 700, isMobile: true },
  { name: "360x800 (Galaxy S)", width: 360, height: 800, isMobile: true },
  { name: "375x812 (iPhone Mini)", width: 375, height: 812, isMobile: true },
  { name: "390x844 (iPhone 14)", width: 390, height: 844, isMobile: true },
  { name: "430x932 (iPhone Pro Max)", width: 430, height: 932, isMobile: true },
  { name: "768x1024 (iPad Portrait)", width: 768, height: 1024, isMobile: true },
  { name: "1024x768 (iPad Landscape)", width: 1024, height: 768, isMobile: false },
  { name: "1280x900 (Desktop Laptop)", width: 1280, height: 900, isMobile: false },
  { name: "1440x1000 (Desktop Large)", width: 1440, height: 1000, isMobile: false }
];

const routes = [
  "/",
  "/collections/all",
  "/collections/rings",
  "/collections/earrings",
  "/products/tulip-pendant",
  "/wishlist",
  "/track-order.html",
  "/order-confirmation.html",
  "/admin.html"
];

let server;
let browser;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function startServer() {
  server = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port), SITE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"]
  });

  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("E2E test server failed to start");
}

async function run() {
  console.log("══════════════════════════════════════════════════════");
  console.log("SHIVARA LUXE PRODUCTION PLAYWRIGHT E2E QA SUITE");
  console.log("══════════════════════════════════════════════════════\n");

  await startServer();

  browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });

  // 1. Viewport Horizontal Overflow Audit Across All Key Routes
  console.log("1. Viewport Horizontal Overflow & Responsive Layout Audit:");
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile
    });
    const page = await ctx.newPage();

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      });
      assert(overflow <= 1, `${vp.name} on ${route} has ZERO horizontal overflow (${overflow}px)`);
    }

    await ctx.close();
  }

  // 2. Checkout Modal & Keyboard Collision Verification
  console.log("\n2. Checkout Modal & Dock Collision Verification (390px):");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await mobileCtx.newPage();
  await page.goto(`${baseUrl}/products/tulip-pendant`, { waitUntil: "domcontentloaded" });

  // Add to Bag
  await page.locator('[data-pdp-add="tulip-pendant"]').first().click();
  await page.waitForSelector("#cart-drawer.is-open");
  assert(await page.locator("#cart-drawer").isVisible(), "Cart drawer opened on mobile");

  // Proceed to Checkout
  await page.locator('[data-open-checkout]').click();
  await page.waitForSelector("#checkout-modal.is-open");
  assert(await page.locator("#checkout-modal").isVisible(), "Checkout modal opened on mobile");

  // Verify dock is hidden during checkout modal
  const dockHidden = await page.evaluate(() => {
    const dock = document.querySelector(".stable-mobile-dock");
    return !dock || getComputedStyle(dock).display === "none" || getComputedStyle(dock).visibility === "hidden";
  });
  assert(dockHidden, "Mobile dock is hidden when checkout modal is open (No collision)");

  // Verify Checkout Form Validation
  const submitBtn = page.locator("#checkout-details-form button[type='submit']");
  await submitBtn.click();
  assert(await page.locator("#checkout-modal").isVisible(), "Checkout does not proceed with empty required fields");

  // Fill partial info
  await page.locator("#cust-name").fill("Radhika Sharma");
  await page.locator("#cust-phone").fill("9876543210");
  await page.locator("#cust-address").fill("Flat 402, Shivara Heights");
  await page.locator("#cust-pincode").fill("243001");
  await page.waitForTimeout(600);

  // Verify Pincode autofill status
  const pinStatus = await page.locator("#pincode-status-msg").textContent();
  assert(pinStatus.length > 0, "PIN code lookup triggered and updated status");

  await mobileCtx.close();

  // 3. Admin Panel Responsive & Security Verification
  console.log("\n3. Admin Panel Responsive Audit (390px & 430px):");
  for (const width of [390, 430]) {
    const adminCtx = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true
    });
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(`${baseUrl}/admin.html`, { waitUntil: "domcontentloaded" });

    const adminOverflow = await adminPage.evaluate(() => {
      return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    });
    assert(adminOverflow <= 1, `Admin panel on ${width}px has ZERO horizontal overflow (${adminOverflow}px)`);

    // Verify login screen exists
    assert(await adminPage.locator("#login-screen").isVisible(), `Admin on ${width}px shows secure login gate`);
    await adminCtx.close();
  }

  await browser.close();
  if (server) server.kill("SIGTERM");

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("══════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal E2E error:", err);
  if (server) server.kill("SIGTERM");
  process.exit(1);
});
