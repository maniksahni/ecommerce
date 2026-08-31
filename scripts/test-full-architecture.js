import http from "node:http";
import assert from "node:assert";
import { spawn } from "node:child_process";

const PORT = 3000;
const BASE = `http://127.0.0.1:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            json: data ? JSON.parse(data) : null,
            text: data
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            json: null,
            text: data
          });
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function ensureServer() {
  try {
    const res = await request("/");
    if (res.status === 200) return null;
  } catch {}

  console.log("Starting local test server on port 3000…");
  const srv = spawn("node", ["server.js"], { stdio: "pipe" });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await request("/");
      if (res.status === 200) return srv;
    } catch {}
  }
  return srv;
}

async function runFullArchitectureTests() {
  const srv = await ensureServer();
  console.log("══════════════════════════════════════════════════════");
  console.log("SHIVARA LUXE FULL ARCHITECTURE & SITEMAP TEST SUITE");
  console.log("══════════════════════════════════════════════════════");

  // 1. Customer Website Sub-Category Routes
  const categories = [
    "/collections/earrings",
    "/collections/rings",
    "/collections/bracelets",
    "/collections/neckwear",
    "/collections/necklaces",
    "/collections/evil-eye",
    "/collections/watches",
    "/collections/jewellery-sets",
    "/collections/sets",
    "/collections/all"
  ];

  for (const cat of categories) {
    const res = await request(cat);
    assert.strictEqual(res.status, 200, `Category route ${cat} should return 200`);
    console.log(`✓ PASS: Storefront category ${cat} returns 200`);
  }

  // 2. Customer Pages
  const pages = ["/", "/search", "/wishlist", "/track-order.html", "/order-confirmation.html", "/admin.html"];
  for (const page of pages) {
    const res = await request(page);
    assert.strictEqual(res.status, 200, `Customer page ${page} should return 200`);
    console.log(`✓ PASS: Route ${page} returns 200`);
  }

  // 3. Public APIs
  // Coupon Validation
  const couponRes = await request("/api/coupons/validate?code=WELCOME10&amount=1000");
  assert.strictEqual(couponRes.status, 200);
  assert.strictEqual(couponRes.json.ok, true);
  assert.strictEqual(couponRes.json.discountAmount, 100);
  console.log("✓ PASS: Public API /api/coupons/validate calculates correct discount");

  // Public Settings
  const settingsRes = await request("/api/settings");
  assert.strictEqual(settingsRes.status, 200);
  assert.strictEqual(settingsRes.json.ok, true);
  assert.strictEqual(settingsRes.json.settings.freeShippingThreshold, 999);
  console.log("✓ PASS: Public API /api/settings returns active store profile");

  // Public Banners
  const bannersRes = await request("/api/banners");
  assert.strictEqual(bannersRes.status, 200);
  assert.strictEqual(bannersRes.json.ok, true);
  assert(bannersRes.json.banners.announcements.length >= 3);
  console.log("✓ PASS: Public API /api/banners returns announcement ticker & hero slides");

  // Public Order Creation & Lookup
  const testOrderId = `SHV-TEST-${Date.now()}`;
  const orderDoc = {
    orderId: testOrderId,
    customerName: "Radhika Test",
    customerPhone: "9876543210",
    customerEmail: "radhika.test@example.com",
    shippingAddress: "Flat 402, Civil Lines",
    pincode: "243001",
    city: "Bareilly",
    state: "Uttar Pradesh",
    totalAmount: 1899,
    subtotal: 1999,
    discountAmount: 100,
    appliedCoupon: "WELCOME10",
    paymentMethod: "COD",
    items: [
      { productId: "halo-gift-ring", title: "Halo Gift Ring", price: 499, quantity: 2 },
      { productId: "tulip-pendant", title: "Tulip Pendant", price: 299, quantity: 3 }
    ]
  };

  const createOrderRes = await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderDoc)
  });
  assert(createOrderRes.status === 200 || createOrderRes.status === 201);
  assert.strictEqual(createOrderRes.json.ok, true);
  console.log(`✓ PASS: Public API POST /api/orders created order #${testOrderId}`);

  const lookupRes = await request(`/api/orders/${testOrderId}`);
  assert.strictEqual(lookupRes.status, 200);
  assert.strictEqual(lookupRes.json.ok, true);
  assert.strictEqual(lookupRes.json.order.customerName, "Radhika Test");
  console.log(`✓ PASS: Public API GET /api/orders/:id looked up order #${testOrderId}`);

  console.log("══════════════════════════════════════════════════════");
  console.log("🎉 ALL FULL ARCHITECTURE & SITEMAP INTEGRATION TESTS PASSED!");
  console.log("══════════════════════════════════════════════════════");
  if (srv) {
    srv.kill();
  }
  process.exit(0);
}

runFullArchitectureTests().catch((err) => {
  console.error("❌ Architecture verification failed:", err);
  process.exit(1);
});
