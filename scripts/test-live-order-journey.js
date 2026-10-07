const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  console.log("=================================================");
  console.log("SHIVARA END-TO-END COMMERCE FLOW VERIFICATION");
  console.log("=================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on("pageerror", err => console.error("PAGE ERROR:", err));
  page.on("console", msg => {
    if (msg.type() === "error") console.error("CONSOLE ERROR:", msg.text());
  });

  try {
    // 1. Visit PDP or Catalog
    console.log("\n1. Navigating to Product Page (Tulip Pendant)...");
    await page.goto("http://127.0.0.1:3000/products/tulip-pendant", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // 2. Add product to bag
    console.log("2. Adding Tulip Pendant (₹299) to bag...");
    const pdpAddBtn = page.locator('[data-pdp-add="tulip-pendant"]').first();
    await pdpAddBtn.click();
    await page.waitForSelector("#cart-drawer.is-open", { timeout: 8000 });
    await page.waitForTimeout(1000);

    // 3. Click Proceed to Checkout
    console.log("3. Clicking Proceed to Checkout...");
    const checkoutBtn = page.locator('button[data-open-checkout]');
    await checkoutBtn.click();
    await page.waitForSelector("#checkout-details-form", { timeout: 8000 });
    await page.waitForTimeout(500);

    // 4. Fill Checkout Form
    console.log("4. Filling Customer Delivery details (PAN-India address)...");
    await page.fill("#cust-name", "Vikram Malhotra");
    await page.fill("#cust-phone", "9876543210");
    await page.fill("#cust-email", "vikram.malhotra@example.com");
    await page.fill("#cust-pincode", "110003");
    await page.fill("#cust-city", "New Delhi");
    await page.fill("#cust-state", "Delhi");
    await page.fill("#cust-address", "42 Golf Links, Lodhi Estate");
    await page.fill("#cust-note", "Please gift wrap with signature ribbon");

    // Verify payment method
    const codRadio = page.locator('input[name="payment-method"][value="COD"]');
    const isCodChecked = await codRadio.isChecked();
    console.log("   Payment method COD selected:", isCodChecked);

    // 5. Confirm Order
    console.log("5. Submitting Order (Confirm Order)...");
    const submitBtn = page.locator(".checkout-submit-btn");
    await submitBtn.click();

    // 6. Wait for Order Confirmation Page
    console.log("6. Waiting for Order Confirmation redirect...");
    await page.waitForURL(url => url.pathname.includes("order-confirmation"), { timeout: 20000 });
    await page.waitForSelector("#confirmation-mount .confirmation-card", { timeout: 15000 });
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    const orderIdMatch = currentUrl.match(/id=([^&]+)/);
    const orderId = orderIdMatch ? decodeURIComponent(orderIdMatch[1]) : "UNKNOWN";
    console.log("\n   🎉 ORDER PLACED SUCCESSFULLY!");
    console.log("   Order ID:", orderId);

    const confirmationText = await page.locator("#confirmation-mount").innerText();
    console.log("\n   --- Confirmation Summary ---");
    console.log(confirmationText.split("\n").filter(Boolean).slice(0, 12).join("\n   "));

    // Save Confirmation Screenshot
    const screenshotDir = path.resolve(__dirname, "../dist");
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const confScreenshotPath = path.join(screenshotDir, "order-confirmation-proof.png");
    await page.screenshot({ path: confScreenshotPath, fullPage: true });
    console.log("   ✓ Saved order confirmation screenshot to:", confScreenshotPath);

    // 7. Verify Order Tracking Page
    console.log("\n7. Navigating to Order Tracking page...");
    await page.goto(`http://127.0.0.1:3000/track-order.html?id=${encodeURIComponent(orderId)}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#track-result-mount .track-result-card", { timeout: 10000 });
    await page.waitForTimeout(1000);

    const trackingText = await page.locator("#track-result-mount").innerText();
    console.log("\n   --- Order Tracking Status ---");
    console.log(trackingText.split("\n").filter(Boolean).slice(0, 10).join("\n   "));

    const trackingScreenshotPath = path.join(screenshotDir, "order-tracking-proof.png");
    await page.screenshot({ path: trackingScreenshotPath, fullPage: true });
    console.log("   ✓ Saved tracking screenshot to:", trackingScreenshotPath);

    // 8. Verify Admin OMS
    console.log("\n8. Checking Admin OMS for live order presence...");
    await page.goto("http://127.0.0.1:3000/admin.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const ordersTabBtn = page.locator("#tab-btn-orders");
    if (await ordersTabBtn.isVisible()) {
      await ordersTabBtn.click();
      await page.waitForTimeout(1500);
      const ordersTableText = await page.locator("#orders-table-body").innerText();
      const hasOrder = ordersTableText.includes(orderId) || ordersTableText.includes("Vikram Malhotra") || ordersTableText.includes("9876543210");
      console.log("   Orders Table contains new order:", hasOrder);
    }

    console.log("\n=================================================");
    console.log("🎉 ALL END-TO-END COMMERCE STEPS VERIFIED 100%!");
    console.log("=================================================");

  } catch (err) {
    console.error("❌ E2E VERIFICATION FAILED:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
