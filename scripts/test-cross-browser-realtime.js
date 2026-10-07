/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRUE DUAL-BROWSER-CONTEXT REALTIME E2E TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 * Proves that mutations executed in Browser Context A (Admin) reflect on
 * already-open pages in Browser Context B (Storefront) in real time
 * WITHOUT ANY PAGE RELOAD.
 *
 * Scenarios tested:
 * A. Admin activates test coupon -> Storefront cart promo card appears live
 * B. Admin pauses coupon -> Storefront cart promo card disappears live
 * C. Admin stock 1 -> 0 -> Storefront card & PDP become SOLD OUT live
 * D. Admin stock 0 -> 5 -> Storefront card & PDP restore Add to Bag live
 * E. Admin price update -> Storefront card & PDP price updates live
 * F. Admin order Pending -> Confirmed -> Customer tracking screen updates live
 * G. Admin order Confirmed -> Shipped + AWB -> Customer tracking updates live
 * H. Admin announcement edit -> Storefront announcement bar updates live
 * I. Admin pauses category -> Category disappears from navbar/rail live
 * J. Admin activates category -> Category returns to navbar/rail live
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAdminCredentials() {
  let email = process.env.ADMIN_EMAIL || "admin@shivaragroup.com";
  let password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    try {
      const envPath = path.resolve(__dirname, "../.env");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
          const [k, v] = line.split("=");
          if (k === "ADMIN_EMAIL" && v) email = v.trim();
          if (k === "ADMIN_PASSWORD" && v) password = v.trim();
        }
      }
    } catch {}
  }
  return { email, password };
}

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function log(msg) {
  console.log(`[REALTIME E2E] ${msg}`);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ PASS: ${message}`);
}

async function runDualBrowserRealtimeTests() {
  log("Starting Dual-Context Chromium Playwright Instance...");
  const browser = await chromium.launch({ headless: true });

  try {
    // ═══════════════════════════════════════════════════════════════
    // CONTEXT A: Certified Administrator Session
    // ═══════════════════════════════════════════════════════════════
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const adminPage = await adminContext.newPage();
    adminPage.on("console", msg => {
      if (msg.type() === "error") console.warn("[Admin Console Error]", msg.text());
    });

    log("Logging into Admin Panel in Context A...");
    await adminPage.goto(`${BASE_URL}/admin.html`, { waitUntil: "domcontentloaded" });
    
    // Fill credentials for verified admin account
    const adminCreds = getAdminCredentials();
    await adminPage.fill("#admin-email", adminCreds.email);
    await adminPage.fill("#admin-passcode", adminCreds.password);
    await adminPage.click("#login-btn");

    // Wait for Admin Dashboard to unlock
    await adminPage.waitForSelector("#admin-screen.is-active", { timeout: 15000 });
    log("Context A (Admin) successfully authenticated and unlocked.");

    // ═══════════════════════════════════════════════════════════════
    // CONTEXT B: Storefront Patron Session
    // ═══════════════════════════════════════════════════════════════
    const storefrontContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const storefrontPage = await storefrontContext.newPage();
    storefrontPage.on("console", msg => {
      if (msg.type() === "error") console.warn("[Storefront Console Error]", msg.text());
    });

    log("Loading Storefront Homepage in Context B...");
    await storefrontPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    log("Context B (Storefront) ready.");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO A: Admin activates test coupon -> Storefront promo card appears
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO A: Live Coupon Activation...");
    // Open bag on storefront
    await storefrontPage.click(".stable-header [data-cart-open]");
    await storefrontPage.waitForSelector("#cart-drawer.is-open", { timeout: 5000 });

    // In Admin Context A: Create/Activate coupon LIVEFLASH25
    await adminPage.evaluate(async () => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "coupons", "LIVEFLASH25"), {
        code: "LIVEFLASH25",
        discountType: "percent",
        discountValue: 25,
        minOrderValue: 499,
        maxDiscount: 500,
        isActive: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // In Storefront Context B: Assert card appears without page reload
    log("Waiting for LIVEFLASH25 promo offer card on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector('[data-coupon-card="LIVEFLASH25"]', { timeout: 12000 });
    assert(await storefrontPage.isVisible('[data-coupon-card="LIVEFLASH25"]'), "Scenario A: Coupon LIVEFLASH25 promo card appeared live on storefront");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO B: Admin pauses coupon -> Storefront promo card disappears
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO B: Live Coupon Pausing...");
    // In Admin Context A: Pause coupon LIVEFLASH25
    await adminPage.evaluate(async () => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "coupons", "LIVEFLASH25"), {
        isActive: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // In Storefront Context B: Assert card detaches without page reload
    log("Waiting for LIVEFLASH25 promo offer card to disappear on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector('[data-coupon-card="LIVEFLASH25"]', { state: "detached", timeout: 12000 });
    assert(await storefrontPage.locator('[data-coupon-card="LIVEFLASH25"]').count() === 0, "Scenario B: Coupon LIVEFLASH25 disappeared live upon admin pausing");

    // Close bag drawer
    await storefrontPage.keyboard.press("Escape");
    await storefrontPage.waitForTimeout(300);

    // ─────────────────────────────────────────────────────────────
    // SCENARIO C: Admin changes stock 1 -> 0 -> Storefront SOLD OUT live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO C: Real-Time Stock Depletion (1 -> 0)...");
    const testSku = "SHV-PND-003"; // Tulip Pendant SKU
    const testProductId = "tulip-pendant";

    // In Admin Context A: Set stock to 0 for SKU SHV-PND-003
    await adminPage.evaluate(async ({ sku, pid }) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "inventory", sku), {
        sku: sku,
        stock: 0,
        isSoldOut: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await setDoc(doc(db, "inventory", pid), {
        sku: sku,
        stock: 0,
        isSoldOut: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }, { sku: testSku, pid: testProductId });

    // In Storefront Context B: Assert card gets .is-sold-out and button becomes disabled "Sold Out"
    log("Verifying product card for tulip-pendant becomes Sold Out on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector(`article[data-product-card="${testProductId}"].is-sold-out`, { timeout: 12000 });
    const soldOutBtn = await storefrontPage.locator(`article[data-product-card="${testProductId}"] .stable-card__add`).textContent();
    assert(soldOutBtn.trim().toLowerCase() === "sold out", "Scenario C: Product card rendered SOLD OUT badge & disabled button live");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO D: Admin restores stock 0 -> 5 -> Storefront Add to Bag restored
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO D: Real-Time Stock Restoration (0 -> 5)...");
    // In Admin Context A: Restore stock to 5
    await adminPage.evaluate(async ({ sku, pid }) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "inventory", sku), {
        sku: sku,
        stock: 5,
        isSoldOut: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await setDoc(doc(db, "inventory", pid), {
        sku: sku,
        stock: 5,
        isSoldOut: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }, { sku: testSku, pid: testProductId });

    // In Storefront Context B: Assert card restores "Add to Bag"
    log("Verifying product card restores Add to Bag on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector(`article[data-product-card="${testProductId}"]:not(.is-sold-out)`, { timeout: 12000 });
    const restoredBtn = await storefrontPage.locator(`article[data-product-card="${testProductId}"] .stable-card__add`).textContent();
    assert(restoredBtn.trim().toLowerCase() === "add to bag", "Scenario D: Add to Bag button restored live without page refresh");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO E: Admin updates product price -> Storefront card price changes live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO E: Real-Time Product Price Mutation...");
    const targetPrice = 777;

    // In Admin Context A: Update price for tulip-pendant
    await adminPage.evaluate(async ({ pid, price }) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "products", pid), {
        price: price,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }, { pid: testProductId, price: targetPrice });

    // In Storefront Context B: Assert price reflects ₹777 without reload
    log("Verifying card price changes to ₹777 on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector(`article[data-product-card="${testProductId}"] .stable-card__price strong:has-text("₹777")`, { timeout: 12000 });
    assert(true, "Scenario E: Product card price updated to ₹777 in real time without page reload");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO F: Admin updates order Pending -> Confirmed -> Customer tracking screen updates live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO F: Customer Tracking Live Status (Pending -> Confirmed)...");
    const testOrderId = `SHV-E2E-${Date.now()}`;

    // Seed test order in Firestore
    await adminPage.evaluate(async (orderId) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        orderId: orderId,
        status: "Pending",
        total: 1299,
        items: [{ title: "Tulip Pendant", quantity: 1, price: 1299 }],
        customer: { name: "Ananya Roy", phone: "9876543210", address: "Civil Lines, Bareilly", pincode: "243001" },
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, "order_tracking", orderId), {
        orderId: orderId,
        status: "Pending",
        total: 1299,
        items: [{ title: "Tulip Pendant", quantity: 1, price: 1299 }],
        customerName: "A. R***",
        createdAt: serverTimestamp()
      });
    }, testOrderId);

    // In Storefront Context B: Open tracking page for this order in a new tab
    const trackingPage = await storefrontContext.newPage();
    await trackingPage.goto(`${BASE_URL}/track-order.html?order=${testOrderId}`, { waitUntil: "domcontentloaded" });
    await trackingPage.waitForSelector("#tracking-display-status-pill:has-text('Pending')", { timeout: 10000 });
    log("Tracking page loaded with initial status: Pending.");

    // In Admin Context A: Update order status to Confirmed
    await adminPage.evaluate(async (orderId) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "orders", orderId), { status: "Confirmed", updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "order_tracking", orderId), { status: "Confirmed", updatedAt: serverTimestamp() }, { merge: true });
    }, testOrderId);

    // In Storefront Tracking Page: Assert status changes to Confirmed live
    log("Waiting for status pill to update to Confirmed on tracking page (NO RELOAD)...");
    await trackingPage.waitForSelector("#tracking-display-status-pill:has-text('Confirmed')", { timeout: 12000 });
    assert(true, "Scenario F: Customer tracking page updated status to Confirmed in real time without reload");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO G: Admin updates Confirmed -> Shipped + AWB -> Customer tracking updates live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO G: Customer Tracking Dispatch & AWB Strip Live Update...");
    const courierAWB = "BLUEDART-LIVE-883311";

    // In Admin Context A: Save Shipped status & Tracking AWB
    await adminPage.evaluate(async ({ orderId, awb }) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "orders", orderId), {
        status: "Shipped",
        trackingNumber: awb,
        courierPartner: "Blue Dart Express",
        updatedAt: serverTimestamp()
      }, { merge: true });
      await setDoc(doc(db, "order_tracking", orderId), {
        status: "Shipped",
        trackingNumber: awb,
        courierPartner: "Blue Dart Express",
        updatedAt: serverTimestamp()
      }, { merge: true });
    }, { orderId: testOrderId, awb: courierAWB });

    // In Storefront Tracking Page: Assert status changes to Shipped and AWB strip renders
    log("Waiting for AWB tracking number to appear on tracking page (NO RELOAD)...");
    await trackingPage.waitForSelector("#tracking-display-status-pill:has-text('Shipped')", { timeout: 12000 });
    await trackingPage.waitForSelector(`#tracking-awb-number:has-text("${courierAWB}")`, { timeout: 12000 });
    assert(true, "Scenario G: Customer tracking page showed Shipped status and live AWB number without reload");
    await trackingPage.close();

    // ─────────────────────────────────────────────────────────────
    // SCENARIO H: Admin edits announcement -> Storefront announcement changes live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO H: Real-Time Announcement Ticker...");
    const liveAnnouncementText = "WELCOME10 LIVE NOW — ATELIER SPECIAL";

    // In Admin Context A: Update announcement in Firestore
    await adminPage.evaluate(async (announcement) => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "banners", "config"), {
        announcements: [announcement, "Handcrafted anti-tarnish jewellery", "Complimentary delivery"],
        updatedAt: serverTimestamp()
      }, { merge: true });
    }, liveAnnouncementText);

    // In Storefront Context B: Assert announcement ticker updates live
    log("Waiting for announcement ticker update on Storefront (NO RELOAD)...");
    await storefrontPage.waitForSelector(`[data-announcement-text]:has-text("${liveAnnouncementText}")`, { timeout: 12000 });
    assert(true, "Scenario H: Storefront announcement ticker updated live without page reload");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO I: Admin pauses category -> Category disappears from navbar live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO I: Category Live Pausing...");
    // In Storefront Context B: Confirm earrings link is initially visible
    assert(await storefrontPage.isVisible('a[data-nav-category="earrings"]'), "Earrings category link is initially present in navbar");

    // In Admin Context A: Pause category earrings
    await adminPage.evaluate(async () => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "categories", "earrings"), {
        isActive: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // In Storefront Context B: Assert earrings link is hidden/detached without reload
    log("Waiting for earrings category to disappear from navbar (NO RELOAD)...");
    await storefrontPage.waitForFunction(() => {
      const el = document.querySelector('a[data-nav-category="earrings"]');
      return !el || el.style.display === "none";
    }, null, { timeout: 12000 });
    assert(true, "Scenario I: Earrings category vanished from navbar in real time upon admin pausing");

    // ─────────────────────────────────────────────────────────────
    // SCENARIO J: Admin activates category -> Category returns to navbar live
    // ─────────────────────────────────────────────────────────────
    log("Testing SCENARIO J: Category Live Reactivation...");
    // In Admin Context A: Activate category earrings
    await adminPage.evaluate(async () => {
      const { db } = await import("/src/firebase.js");
      const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
      await setDoc(doc(db, "categories", "earrings"), {
        isActive: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    // In Storefront Context B: Assert earrings link is restored without reload
    log("Waiting for earrings category to reappear in navbar (NO RELOAD)...");
    await storefrontPage.waitForFunction(() => {
      const el = document.querySelector('a[data-nav-category="earrings"]');
      return el && el.style.display !== "none";
    }, null, { timeout: 12000 });
    assert(true, "Scenario J: Earrings category restored in navbar in real time without page reload");

    log("═══════════════════════════════════════════════════════════════");
    log("🎉 ALL 10 DUAL-BROWSER CROSS-CONTEXT REALTIME SCENARIOS PASSED 100%!");
    log("═══════════════════════════════════════════════════════════════");
    return true;
  } finally {
    try {
      if (adminPage && !adminPage.isClosed()) {
        await adminPage.evaluate(async () => {
          const { db } = await import("/src/firebase.js");
          const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
          await setDoc(doc(db, "products", "tulip-pendant"), { price: 299, isSoldOut: false }, { merge: true });
          await setDoc(doc(db, "inventory", "SHV-PND-003"), { stock: 999, isSoldOut: false }, { merge: true });
          await setDoc(doc(db, "inventory", "tulip-pendant"), { stock: 999, isSoldOut: false }, { merge: true });
        });
      }
    } catch {}
    await browser.close();
  }
}

runDualBrowserRealtimeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test run error:", err);
    process.exit(1);
  });
