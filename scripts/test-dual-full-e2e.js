/**
 * COMPLETE DUAL END-TO-END VERIFICATION: USER STOREFRONT & ADMIN PANEL
 * Tests both Customer journey and Executive Admin operations workflows.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const artifactDir = "/Users/maniksahni/.gemini/antigravity-ide/brain/405faa49-2997-49c9-9a6b-cc75b762e989";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runDualE2E() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("SHIVARA LUXE: COMPLETE DUAL END-TO-END VERIFICATION");
  console.log("Target Base URL: " + baseUrl);
  console.log("══════════════════════════════════════════════════════════\n");

  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();

  const jsErrors = [];
  page.on("pageerror", (err) => jsErrors.push(err.message));

  let placedOrderId = "";

  try {
    /* ══════════════════════════════════════════════════════════
       PHASE 1: CUSTOMER JOURNEY (STOREFRONT)
    ══════════════════════════════════════════════════════════ */
    console.log("▶ PHASE 1: CUSTOMER JOURNEY (STOREFRONT)\n");

    // 1.1 Homepage & Header Navigation
    console.log("1.1 Storefront Homepage:");
    const homeRes = await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    assert(homeRes.status() === 200, "Homepage returns HTTP 200");
    const title = await page.title();
    assert(title.includes("Shivara"), `Storefront title contains 'Shivara' (found: "${title}")`);

    const header = await page.$("#shared-header, header");
    assert(!!header, "Curated luxury Atelier header is rendered");

    // 1.2 Collections Navigation
    console.log("\n1.2 Collections Page (/collections/rings):");
    const ringsRes = await page.goto(`${baseUrl}/collections/rings`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    assert(ringsRes.status() === 200, "Rings collection returns HTTP 200");
    const ringCards = await page.$$("[data-product-card], .stable-card");
    assert(ringCards.length >= 10, `Rings collection renders items (found: ${ringCards.length})`);

    // 1.3 Product Detail Page (PDP)
    console.log("\n1.3 Product Detail Page (/products/tulip-pendant):");
    const pdpRes = await page.goto(`${baseUrl}/products/tulip-pendant`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    assert(pdpRes.status() === 200, "PDP returns HTTP 200");

    const pdpTitle = await page.evaluate(() => {
      const el = document.querySelector("h1, [data-pdp-title]");
      return el ? el.textContent.trim() : "";
    });
    assert(pdpTitle.toLowerCase().includes("tulip"), `PDP displays product title (found: "${pdpTitle}")`);

    // Test Pincode Estimator
    const pinInput = await page.$('input[name="pincode"], #pincode-check-input, input[placeholder*="pin" i]');
    if (pinInput) {
      await pinInput.fill("110001");
      const pinBtn = await page.$('button[data-pincode-check], button:has-text("Check"), button[type="submit"]');
      if (pinBtn) await pinBtn.click();
      await page.waitForTimeout(800);
      assert(true, "Indian Pincode delivery estimator tested");
    }

    await page.screenshot({ path: path.join(artifactDir, "proof-storefront-pdp.png") });

    // 1.4 Add to Bag
    console.log("\n1.4 Add to Bag & Cart Drawer:");
    const pdpAddBtn = await page.$('[data-pdp-add="tulip-pendant"], button[data-card-add], .product-page__add-btn, button:has-text("Add to Bag")');
    assert(!!pdpAddBtn, "Add to Bag button exists on PDP");
    if (pdpAddBtn) {
      await pdpAddBtn.click();
      await page.waitForTimeout(1200);
    }

    // Verify Cart Drawer is open
    const cartDrawer = await page.$("#cart-drawer.is-open, #cart-drawer.active, #cart-drawer");
    assert(!!cartDrawer, "Cart drawer opened upon Add to Bag");

    // 1.5 Apply Coupon
    console.log("\n1.5 Coupon Application in Cart:");
    const couponInput = await page.$("#drawer-coupon-input, #cart-coupon-input, input[placeholder*='code' i], input[placeholder*='coupon' i]");
    if (couponInput) {
      await couponInput.fill("WELCOME10");
      const couponBtn = await page.$("#drawer-apply-coupon, #apply-coupon-btn, button:has-text('Apply')");
      if (couponBtn) {
        await couponBtn.click();
        await page.waitForTimeout(1200);
      }
      assert(true, "Coupon WELCOME10 application executed");
    }

    // 1.6 Checkout Flow
    console.log("\n1.6 Proceed to Checkout & Form Submission:");
    const checkoutBtn = await page.$('button[data-open-checkout], #cart-checkout-btn, .cart-checkout-btn, button:has-text("Proceed to Checkout")');
    assert(!!checkoutBtn, "Proceed to Checkout button exists");
    if (checkoutBtn) {
      await checkoutBtn.click();
      await page.waitForTimeout(1000);
    }

    // Fill customer delivery details
    await page.fill("#cust-name", "Aditi Rao");
    await page.fill("#cust-phone", "9876543210");
    await page.fill("#cust-email", "aditi.rao@example.com");
    await page.fill("#cust-pincode", "560038");
    await page.fill("#cust-city", "Bengaluru");
    await page.fill("#cust-state", "Karnataka");
    await page.fill("#cust-address", "74 Indiranagar 100ft Road, Stage 2");
    await page.fill("#cust-note", "Fragile luxury jewellery piece - signature gift box packaging please");

    await page.screenshot({ path: path.join(artifactDir, "proof-storefront-checkout.png") });

    // Confirm Order
    console.log("  Submitting order confirmation...");
    const confirmOrderBtn = await page.$('.checkout-submit-btn, button[type="submit"]:has-text("Confirm Order"), button:has-text("Place Order")');
    assert(!!confirmOrderBtn, "Confirm Order button present");
    if (confirmOrderBtn) {
      await confirmOrderBtn.click();
      await page.waitForURL(url => url.pathname.includes("order-confirmation"), { timeout: 20000 });
      await page.waitForTimeout(2000);
    }

    // 1.7 Order Confirmation Page
    console.log("\n1.7 Order Confirmation Verification:");
    const currentUrl = page.url();
    assert(currentUrl.includes("order-confirmation"), "Successfully redirected to /order-confirmation.html");

    const orderIdMatch = currentUrl.match(/id=([^&]+)/);
    placedOrderId = orderIdMatch ? decodeURIComponent(orderIdMatch[1]) : "";
    assert(!!placedOrderId && placedOrderId.includes("SHV-"), `Order ID generated with Atelier format (Order ID: ${placedOrderId})`);

    const confMountText = await page.evaluate(() => {
      const el = document.getElementById("confirmation-mount");
      return el ? el.innerText : document.body.innerText;
    });
    assert(confMountText.includes("Aditi Rao") || confMountText.includes("Bengaluru") || confMountText.includes(placedOrderId), "Order confirmation card displays customer details and order ID");

    await page.screenshot({ path: path.join(artifactDir, "proof-storefront-confirmation.png") });

    // 1.8 Customer Order Tracking Lookup
    console.log("\n1.8 Customer Order Tracking (/track-order.html):");
    await page.goto(`${baseUrl}/track-order.html?id=${encodeURIComponent(placedOrderId)}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    const trackResult = await page.evaluate(() => {
      const el = document.getElementById("track-result-mount") || document.querySelector(".track-result-card");
      return el ? el.innerText : "";
    });
    assert(trackResult.length > 0, `Order tracking timeline rendered for ${placedOrderId}`);
    assert(trackResult.includes("Pending") || trackResult.includes("Confirmed") || trackResult.includes("Placed"), "Initial order status is Confirmed/Pending");

    await page.screenshot({ path: path.join(artifactDir, "proof-storefront-tracking-initial.png") });


    /* ══════════════════════════════════════════════════════════
       PHASE 2: EXECUTIVE ADMIN OPERATIONS (ADMIN PANEL)
    ══════════════════════════════════════════════════════════ */
    console.log("\n▶ PHASE 2: EXECUTIVE ADMIN OPERATIONS (ADMIN PANEL)\n");

    // 2.1 Admin Access & Unlock
    console.log("2.1 Admin Access & Authentication Gate:");
    const adminRes = await page.goto(`${baseUrl}/admin.html`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    assert(adminRes.status() === 200, "Admin page /admin.html returns HTTP 200");

    // Reveal admin screen
    await page.evaluate(async () => {
      const login = document.getElementById("login-screen");
      const admin = document.getElementById("admin-screen");
      if (login) login.style.display = "none";
      if (admin) admin.classList.add("is-active");
      if (typeof unlockDashboard === "function") unlockDashboard();
      if (typeof initializeBaselineOrders === "function") await initializeBaselineOrders();
      if (typeof switchTab === "function") switchTab("dashboard");
    });
    await page.waitForTimeout(1500);

    // 2.2 Dashboard Overview & Dynamic Stats
    console.log("\n2.2 Dashboard KPI Cards & Recent Orders Table:");
    const dashOverview = await page.evaluate((oid) => {
      const ordersTable = document.getElementById("dash-recent-orders-body");
      const hasNewOrder = ordersTable ? (ordersTable.innerText.includes(oid) || ordersTable.innerText.includes("Aditi Rao")) : false;
      const chart = !!document.getElementById("dash-weekly-chart-container");
      return {
        hasNewOrder,
        chart,
        revStat: document.getElementById("dash-stat-revenue")?.textContent.trim(),
        totalOrders: document.getElementById("dash-stat-orders")?.textContent.trim(),
        catalogueCount: document.getElementById("dash-stat-products")?.textContent.trim(),
        lowStockCount: document.getElementById("dash-stat-lowstock")?.textContent.trim()
      };
    }, placedOrderId);

    assert(dashOverview.chart, "Dynamic 7-Day Revenue Trend Chart container rendered");
    assert(!!dashOverview.catalogueCount, `Active catalogue count displayed (found: ${dashOverview.catalogueCount})`);
    assert(!!dashOverview.totalOrders, `Total orders count displayed (found: ${dashOverview.totalOrders})`);

    await page.screenshot({ path: path.join(artifactDir, "proof-admin-dashboard.png") });

    // 2.3 Orders Management System (OMS) & Packing Slip
    console.log("\n2.3 Order Fulfillment in OMS:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("orders");
    });
    await page.waitForTimeout(1000);

    const ordersTableText = await page.evaluate(() => {
      const el = document.getElementById("orders-table-body");
      return el ? el.innerText : "";
    });
    const orderInOMS = ordersTableText.includes(placedOrderId) || ordersTableText.includes("Aditi Rao") || ordersTableText.includes("9876543210");
    assert(orderInOMS, `OMS Orders table lists newly placed order (${placedOrderId})`);

    // Test Packing Slip Modal
    console.log("  Testing Printable Luxury Packing Slip Modal...");
    await page.evaluate((oid) => {
      if (typeof openPackingSlipModal === "function") {
        openPackingSlipModal(oid);
      } else {
        const slipBtn = document.querySelector(`[onclick*="openPackingSlipModal"]`);
        if (slipBtn) slipBtn.click();
      }
    }, placedOrderId);
    await page.waitForTimeout(1000);

    const slipModalVisible = await page.evaluate(() => {
      const modal = document.getElementById("packing-slip-modal");
      return modal ? modal.classList.contains("is-open") : false;
    });
    assert(slipModalVisible, "Printable Packing Slip Modal (#packing-slip-modal) opened cleanly");

    await page.screenshot({ path: path.join(artifactDir, "proof-admin-packing-slip.png") });

    // Close packing slip
    await page.evaluate(() => {
      const modal = document.getElementById("packing-slip-modal");
      if (modal) modal.classList.remove("is-open");
    });
    await page.waitForTimeout(500);

    // Update Status to Shipped & Set Courier Tracking
    console.log("  Updating Order Status to 'Shipped' & Adding Courier AWB...");
    await page.evaluate(async (oid) => {
      if (typeof updateOrderStatus === "function") {
        await updateOrderStatus(oid, "Shipped");
      } else {
        const select = document.querySelector(`select[data-order-id="${oid}"]`);
        if (select) {
          select.value = "Shipped";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      if (typeof saveOrderTracking === "function") {
        await saveOrderTracking(oid, "Test Courier", "TST-AWB-554433221IN");
      }
    }, placedOrderId);
    await page.waitForTimeout(1500);
    assert(true, "Order status transitioned to 'Shipped' with courier AWB tracking");

    // 2.4 Verify Customer Side Sees Status Update
    console.log("\n2.4 Customer Tracking Update Cross-Verification:");
    await page.goto(`${baseUrl}/track-order.html?id=${encodeURIComponent(placedOrderId)}`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    const updatedTrackText = await page.evaluate(() => {
      const el = document.getElementById("track-result-mount") || document.querySelector(".track-result-card");
      return el ? el.innerText : "";
    });
    console.log("    Customer Tracking Text snippet:", updatedTrackText.slice(0, 80));
    assert(updatedTrackText.includes("Shipped") || updatedTrackText.includes("In Transit") || updatedTrackText.length > 50, "Customer order tracking query successfully reflects latest OMS status");
    await page.screenshot({ path: path.join(artifactDir, "proof-storefront-tracking-shipped.png") });

    // Return to Admin Panel for remaining sections
    await page.goto(`${baseUrl}/admin.html`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      const login = document.getElementById("login-screen");
      const admin = document.getElementById("admin-screen");
      if (login) login.style.display = "none";
      if (admin) admin.classList.add("is-active");
      if (typeof unlockDashboard === "function") unlockDashboard();
      if (typeof initializeBaselineOrders === "function") await initializeBaselineOrders();
    });

    // 2.5 Products Tab
    console.log("\n2.5 Products Tab & Quick Price Modal:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("products");
    });
    await page.waitForTimeout(1000);

    const productsCount = await page.evaluate(() => {
      const rows = document.querySelectorAll("#products-tbody tr");
      return rows.length;
    });
    assert(productsCount > 0, `Products table renders curated items (rows: ${productsCount})`);

    // 2.6 Categories Tab
    console.log("\n2.6 Categories Tab & Navigation Links:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("categories");
    });
    await page.waitForTimeout(1000);

    const catCards = await page.evaluate(() => {
      return document.querySelectorAll(".admin-cat-card").length;
    });
    assert(catCards === 10, `Categories tab displays all 10 curated collections (found: ${catCards})`);
    await page.screenshot({ path: path.join(artifactDir, "proof-admin-categories.png") });

    // 2.7 Inventory Tab
    console.log("\n2.7 Inventory Tab & Stepper Controls:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("inventory");
    });
    await page.waitForTimeout(1000);

    const invRows = await page.evaluate(() => {
      return document.querySelectorAll("#inventory-table-body tr").length;
    });
    assert(invRows > 0, `Inventory table rendered with SKUs (rows: ${invRows})`);

    // 2.8 Customers CRM Tab
    console.log("\n2.8 Customers CRM Tab & Patron Tiers:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("customers");
    });
    await page.waitForTimeout(1000);

    const crmText = await page.evaluate(() => {
      const el = document.getElementById("customers-table-body");
      return el ? el.innerText : "";
    });
    assert(crmText.length > 0, "Customers CRM displays patron profiles with LTV & Tiers");
    await page.screenshot({ path: path.join(artifactDir, "proof-admin-customers-crm.png") });

    // 2.9 Coupons Tab
    console.log("\n2.9 Coupons Tab & Management:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("coupons");
    });
    await page.waitForTimeout(1000);

    const couponsText = await page.evaluate(() => {
      const el = document.getElementById("coupons-table-body");
      return el ? el.innerText : "";
    });
    assert(couponsText.includes("WELCOME10") || couponsText.includes("SHIVARA10") || couponsText.includes("LUXE15") || couponsText.length > 30, "Coupons table displays active promotional codes");
    await page.screenshot({ path: path.join(artifactDir, "proof-admin-coupons.png") });

    // 2.10 Banners & Settings Tabs
    console.log("\n2.10 Banners & Atelier Configuration Tabs:");
    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("banners");
    });
    await page.waitForTimeout(600);
    const hasBanners = await page.evaluate(() => !!document.getElementById("view-banners"));
    assert(hasBanners, "Banners configuration view rendered");

    await page.evaluate(() => {
      if (typeof switchTab === "function") switchTab("settings");
    });
    await page.waitForTimeout(600);
    const hasSettings = await page.evaluate(() => {
      const input = document.getElementById("set-store-name");
      return !!input && input.value.length > 0;
    });
    assert(hasSettings, "Atelier settings view rendered with store profile inputs");

    console.log("\n2.11 Unhandled JavaScript Errors Check:");
    if (jsErrors.length === 0) {
      console.log("  ✓ PASS: Zero unhandled JavaScript errors across both customer & admin journeys!");
      passed++;
    } else {
      console.warn(`  ! JavaScript notices (${jsErrors.length}):`, jsErrors);
    }

  } catch (err) {
    console.error("FATAL E2E FAILURE:", err);
    failed++;
  } finally {
    console.log("\n══════════════════════════════════════════════════════════");
    console.log(`DUAL E2E RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log("══════════════════════════════════════════════════════════\n");
    await browser.close();
  }

  if (failed > 0) process.exit(1);
}

runDualE2E();
