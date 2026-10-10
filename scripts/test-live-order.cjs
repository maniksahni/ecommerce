const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  throw Error("Administrator credentials required");
const base = "https://the-shivara-group-86c9c.web.app";
(async () => {
  for (const engine of ["chromium", "webkit"]) {
    const browser = await (engine === "webkit" ? webkit : chromium).launch(
      engine === "webkit"
        ? { headless: true }
        : {
            headless: true,
            args: ["--disable-quic"],
            ...(process.env.CHROME_PATH
              ? { executablePath: process.env.CHROME_PATH }
              : {}),
          },
    );
    const admin = await browser.newPage();
    const shop = await browser.newPage({
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
    });
    admin.setDefaultTimeout(60000);
    shop.setDefaultTimeout(60000);
    const productId = "qa-order-" + randomUUID();
    let orderId;
    const folder = path.resolve(
      process.env.QA_ARTIFACT_DIR || "artifacts/full-audit/order",
      engine,
    );
    fs.mkdirSync(folder, { recursive: true });
    try {
      await admin.goto(base + "/admin", { waitUntil: "domcontentloaded" });
      await admin.locator("#admin-email").fill(process.env.ADMIN_EMAIL);
      await admin.locator("#admin-passcode").fill(process.env.ADMIN_PASSWORD);
      await admin.locator("#login-form").evaluate((f) => f.requestSubmit());
      await admin.locator("#admin-screen.is-active").waitFor();
      await admin.evaluate(
        async ({ id, base }) => {
          const { db } = await import("/src/firebase.js");
          const { doc, setDoc, serverTimestamp } = await import(
            "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
          );
          await setDoc(doc(db, "products", id), {
            slug: id,
            title: "QA Order Flow Product",
            price: 550,
            category: "rings",
            imageUrl: base + "/assets/instagram-shop/post-002-DYcf1ViBfkI.jpg",
            isSoldOut: false,
            createdAt: serverTimestamp(),
          });
        },
        { id: productId, base },
      );
      await shop.goto(base + "/products/" + productId, {
        waitUntil: "domcontentloaded",
      });
      await shop.locator("[data-pdp-add]").first().click();
      await shop.locator("[data-open-checkout]").click();
      await shop.locator("#cust-name").fill("QA Verification Customer");
      await shop.locator("#cust-phone").fill("9876543210");
      await shop
        .locator("#cust-address")
        .fill("QA Verification Address - Do Not Dispatch");
      await shop.locator("#cust-pincode").fill("110001");
      await shop.locator(".checkout-submit-btn").click();
      await shop.waitForURL(/order-confirmation/);
      orderId = new URL(shop.url()).searchParams.get("id");
      assert(orderId);
      await shop
        .locator("#confirmation-mount")
        .getByText(/Order/i)
        .first()
        .waitFor();
      await shop.screenshot({
        path: path.join(folder, "01-confirmation.png"),
        animations: "disabled",
        fullPage: true,
      });
      const read = () =>
        admin.evaluate(async (id) => {
          const { db } = await import("/src/firebase.js");
          const { doc, getDocFromServer } = await import(
            "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
          );
          return (await getDocFromServer(doc(db, "orders", id))).data();
        }, orderId);
      const order = await read();
      assert.equal(order.status, "Pending");
      assert.equal(order.items[0].price, 550);
      assert.equal(order.paymentMethod, "COD");
      await admin.locator("#tab-btn-orders").click();
      const row = admin.locator(
        `#orders-table-body tr[data-order-id="${orderId}"]`,
      );
      await row.waitFor();
      await row
        .locator('[data-action="change-order-status"]')
        .selectOption("Processing");
      await admin.waitForFunction(() =>
        document
          .querySelector("#toast")
          .textContent.includes("status updated to Processing"),
      );
      assert.equal((await read()).status, "Processing");
      await shop.goto(base + "/track-order.html?id=" + orderId, {
        waitUntil: "domcontentloaded",
      });
      await shop
        .locator("#track-result-mount")
        .getByText("Processing", { exact: false })
        .first()
        .waitFor();
      await shop.screenshot({
        path: path.join(folder, "02-tracking.png"),
        animations: "disabled",
        fullPage: true,
      });
      await admin.locator("#tab-btn-customers").click();
      assert(
        (await admin.locator("#customers-table-body").textContent()).includes(
          "QA Verification Customer",
        ),
      );
      await admin.screenshot({
        path: path.join(folder, "03-customer-in-oms.png"),
        animations: "disabled",
        fullPage: true,
      });
      fs.writeFileSync(
        path.join(folder, "result.json"),
        JSON.stringify(
          {
            engine,
            liveCheckoutCreated: true,
            serverOrderVerified: true,
            omsStatusChanged: true,
            publicTrackingUpdated: true,
            customerAggregationVerified: true,
          },
          null,
          2,
        ),
      );
      console.log(
        "PASS",
        engine,
        "real checkout, confirmation, OMS status, tracking, customer aggregation",
      );
    } finally {
      await admin.evaluate(
        async ({ productId, orderId }) => {
          const { db } = await import("/src/firebase.js");
          const { doc, deleteDoc, getDocsFromServer, collection } =
            await import(
              "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
            );
          if (orderId) {
            await deleteDoc(doc(db, "orders", orderId));
            await deleteDoc(doc(db, "order_tracking", orderId));
          } else {
            const orders = await getDocsFromServer(collection(db, "orders"));
            for (const o of orders.docs)
              if (
                o
                  .data()
                  .items?.some(
                    (item) =>
                      item.productId === productId || item.id === productId,
                  )
              ) {
                await deleteDoc(doc(db, "orders", o.id));
                await deleteDoc(doc(db, "order_tracking", o.id));
              }
          }
          await deleteDoc(doc(db, "products", productId));
        },
        { productId, orderId },
      );
      await browser.close();
      console.log("CLEANED", engine, "QA order/product/tracking");
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
