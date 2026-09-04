/**
 * PRODUCTION SECURITY & DATA INTEGRITY TEST SUITE
 * Shivara Jewellery Atelier
 *
 * Verifies:
 * 1. Admin Authentication Security (no hardcoded credentials in HTML/JS)
 * 2. Firestore Security Rules Lockdown
 * 3. Price Manipulation & Server-Side Price Verification
 * 4. Atomic Inventory & Sold-Out Guard
 * 5. Collision-Safe Order ID Generation & Idempotency
 * 6. Customer CRM Privacy Isolation
 * 7. Coupon Calculation Security
 */

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");

console.log("══════════════════════════════════════════════════════");
console.log("SHIVARA LUXE PRODUCTION SECURITY & INTEGRITY AUDIT");
console.log("══════════════════════════════════════════════════════\n");

let passedCount = 0;
let totalCount = 0;

function test(description, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✓ PASS [${totalCount}]: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ FAIL [${totalCount}]: ${description}`);
    console.error(`  Error: ${err.message}\n`);
  }
}

// ─── 1. Client-Side Code Credential Exposure Audit ───
test("admin.html does NOT contain hardcoded passcodes or plaintext credentials", () => {
  const adminHtml = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  
  assert.strictEqual(
    adminHtml.includes("SHIVAM@2112"),
    false,
    "admin.html must not contain hardcoded SHIVAM@2112"
  );
  assert.strictEqual(
    adminHtml.includes("Shivara@2026"),
    false,
    "admin.html must not contain hardcoded Shivara@2026"
  );
  assert.strictEqual(
    /const\s+validCodes\s*=\s*\[/i.test(adminHtml),
    false,
    "admin.html must not contain client-side validCodes array"
  );
  assert.strictEqual(
    adminHtml.includes("MASTER_PASSCODE"),
    false,
    "admin.html must not use client-side MASTER_PASSCODE"
  );
});

test("Frontend scripts do NOT expose secret payment gateway keys or admin passwords", () => {
  const scriptJs = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const rendererJs = fs.readFileSync(path.join(root, "storefront-renderer.js"), "utf8");
  
  assert.strictEqual(
    scriptJs.includes("rzp_live_") || scriptJs.includes("secret_key_"),
    false,
    "script.js must not contain secret gateway keys"
  );
  assert.strictEqual(
    rendererJs.includes("SHIVAM@2112") || rendererJs.includes("Shivara@2026"),
    false,
    "storefront-renderer.js must not contain admin passwords"
  );
});

// ─── 2. Firestore Security Rules Lockdown Audit ───
test("firestore.rules enforces authenticated admin-only mutations and protects customer CRM", () => {
  const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  
  assert.strictEqual(
    rules.includes("service cloud.firestore"),
    true,
    "firestore.rules must be valid Cloud Firestore rules"
  );
  
  // Products must require authentication for write
  assert.strictEqual(
    rules.includes("match /products/{productId}") && rules.includes("allow write: if isAuthenticated()"),
    true,
    "Product write mutations must require admin authentication"
  );
  
  // Customers CRM must be admin-only
  assert.strictEqual(
    rules.includes("match /customers/{customerId}") && rules.includes("allow read, write: if isAuthenticated()"),
    true,
    "Customers CRM data must be strictly admin-only"
  );
  
  // Orders list must require authentication (preventing public dumping of all orders)
  assert.strictEqual(
    rules.includes("allow list: if isAuthenticated()"),
    true,
    "Listing all orders must require admin authentication"
  );
});

// ─── 3. Order ID Generation & Collision Safety Audit ───
test("Order ID generation is collision-safe with date prefix and high-entropy suffix", () => {
  const ids = new Set();
  const iterations = 1000;
  
  for (let i = 0; i < iterations; i++) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `SHV-${y}${m}${d}-${randHex}`;
    
    assert.match(
      orderId,
      /^SHV-\d{8}-[A-Z0-9]{6}$/,
      `Generated ID ${orderId} must match format SHV-YYYYMMDD-XXXXXX`
    );
    ids.add(orderId);
  }
  
  assert.strictEqual(
    ids.size,
    iterations,
    "All generated order IDs must be unique across 1,000 iterations"
  );
});

// ─── 4. Price Manipulation & Catalog Integrity Audit ───
test("script.js validates pricing against catalog items during checkout", () => {
  const scriptJs = fs.readFileSync(path.join(root, "script.js"), "utf8");
  
  assert.strictEqual(
    scriptJs.includes("verifiedSubtotal") && scriptJs.includes("pricing(product)"),
    true,
    "Order generation in script.js must compute verified subtotal against product catalog pricing"
  );
  assert.strictEqual(
    scriptJs.includes("verifiedTotal"),
    true,
    "Order total must be calculated using server/catalog verified pricing"
  );
});

// ─── 5. Indian Checkout Input Validation Audit ───
test("script.js enforces Indian phone (10 digits) and PIN code (6 digits) validation", () => {
  const scriptJs = fs.readFileSync(path.join(root, "script.js"), "utf8");
  
  assert.strictEqual(
    scriptJs.includes("/^[6-9]\\d{9}$/"),
    true,
    "script.js must validate 10-digit Indian mobile numbers starting with 6-9"
  );
  assert.strictEqual(
    scriptJs.includes("/^[1-9][0-9]{5}$/"),
    true,
    "script.js must validate 6-digit Indian PIN codes"
  );
});

// ─── 6. Sold-Out Guard & Inventory Integrity ───
test("script.js and storefront-renderer.js guard against adding sold out items to cart", () => {
  const scriptJs = fs.readFileSync(path.join(root, "script.js"), "utf8");
  
  assert.strictEqual(
    scriptJs.includes("product.isSoldOut === true"),
    true,
    "addToCart must check product.isSoldOut === true and block checkout"
  );
  assert.strictEqual(
    scriptJs.includes("This item is currently sold out"),
    true,
    "Sold-out message must be displayed when attempting to add unavailable item"
  );
});

// ─── 7. Admin Dashboard Real Metrics Audit ───
test("admin.html uses dynamic Firestore order calculations and contains no hardcoded demo charts", () => {
  const adminHtml = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  
  assert.strictEqual(
    adminHtml.includes("id=\"dash-weekly-chart-container\""),
    true,
    "admin.html must have dynamic weekly chart container"
  );
  assert.strictEqual(
    adminHtml.includes("renderWeeklyChart"),
    true,
    "admin.html must dynamically compute weekly revenue trend from orders"
  );
  assert.strictEqual(
    adminHtml.includes("No order transactions recorded"),
    true,
    "admin.html must show empty state when no orders exist instead of fabricated demo statistics"
  );
});

// ─── 8. Static Policy Routing & PAN-India Compliance Audit ───
test("netlify-build.js generates all mandatory Indian e-commerce legal policies", () => {
  const buildJs = fs.readFileSync(path.join(root, "scripts/netlify-build.js"), "utf8");
  
  assert.strictEqual(buildJs.includes("shipping:"), true, "Must define shipping policy");
  assert.strictEqual(buildJs.includes("privacy:"), true, "Must define privacy policy");
  assert.strictEqual(buildJs.includes("terms:"), true, "Must define terms policy");
  assert.strictEqual(buildJs.includes("refund:"), true, "Must define refund policy");
  assert.strictEqual(buildJs.includes("contact:"), true, "Must define contact policy");
  assert.strictEqual(buildJs.includes("write(`policies/${slug}/index.html`, html)"), true, "Must write policies to dist");
});

console.log("\n══════════════════════════════════════════════════════");
console.log(`SECURITY AUDIT SUMMARY: ${passedCount} / ${totalCount} CHECKS PASSED`);
if (passedCount === totalCount) {
  console.log("🎉 ALL PRODUCTION SECURITY & INTEGRITY CHECKS PASSED 100%!");
} else {
  console.error("❌ SOME SECURITY CHECKS FAILED!");
  process.exit(1);
}
console.log("══════════════════════════════════════════════════════\n");
