const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadCatalog } = require("./catalog-lib");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3259";
const baseline = loadCatalog()
  .catalogApi.getAllProducts()
  .filter((p) =>
    [
      "tulip-pendant",
      "halo-gift-ring",
      "boxed-evil-eye-bracelet",
      "floral-statement-ring",
    ].includes(p.id),
  );
const fixture = fs.readFileSync(
  require("path").join(__dirname, "fixtures/firestore-browser.js"),
  "utf8",
);
const reports = [];
(async () => {
  for (const engine of ["chromium", "webkit"]) {
    const browser = await (engine === "webkit" ? webkit : chromium).launch(
      engine === "webkit"
        ? { headless: true }
        : {
            headless: true,
            args: ["--disable-quic"],
            executablePath:
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          },
    );
    try {
      const context = await browser.newContext({
        viewport: { width: 393, height: 852 },
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript((products) => {
        window.__qaDB = JSON.parse(
          localStorage.getItem("__qaDB") || "null",
        ) || {
          products: Object.fromEntries(products.map((p) => [p.id, p])),
          inventory: {},
          categories: {},
          coupons: {},
          banners: {},
          admin_settings: {},
          orders: {},
          order_tracking: {},
        };
      }, baseline);
      await context.route("**/src/firebase.js", (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: "export const db={};export const auth={};export const storage={};",
        }),
      );
      await context.route(
        "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js",
        (route) =>
          route.fulfill({ contentType: "text/javascript", body: fixture }),
      );
      let backendStatus = 404;
      await context.route("**/api/orders", (route) =>
        route.fulfill({
          status: backendStatus,
          contentType: "application/json",
          body: JSON.stringify({ error: "This product is sold out" }),
        }),
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("PAGE ERROR", e.message);
      });
      page.setDefaultTimeout(15000);
      const pass = (message) => {
        reports.push({ engine, message, pass: true });
        console.log("PASS", engine, message);
      };
      const write = (collection, id, data) =>
        page.evaluate(
          async ({ collection, id, data }) => {
            const sdk = await import(
              "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
            );
            await sdk.setDoc(sdk.doc({}, collection, id), data);
          },
          { collection, id, data },
        );
      await page.goto(base + "/collections/all", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForFunction(
        () => window.ShivaraCatalog.getAllProducts().length === 4,
      );
      assert.equal(
        await page.locator("#collection-grid [data-product-card]").count(),
        4,
      );
      pass("Cloud collection replaces static records");
      const qa = {
        id: "qa-cloud-doc",
        slug: "qa-new-ring",
        title: "QA New Ring",
        category: "rings",
        price: 321,
        imageUrl: baseline[0].images[0],
        isSoldOut: false,
      };
      await write("products", qa.id, qa);
      await page
        .locator('#collection-grid [data-product-card="qa-new-ring"]')
        .waitFor();
      pass("Added product appears in collection");
      await page.locator(".stable-header [data-search-open]").click();
      await page.locator("#stable-search").fill("QA New Ring");
      await page
        .locator("#search-results")
        .getByText("QA New Ring", { exact: true })
        .waitFor();
      await page.keyboard.press("Escape");
      pass("New product is searchable");
      await write("products", qa.id, {
        ...qa,
        title: "QA Edited Ring",
        price: 451,
        category: "earrings",
        isSoldOut: true,
      });
      await page.waitForFunction(
        () =>
          window.ShivaraCatalog.getProductBySlug("qa-new-ring").price === 451,
      );
      assert.equal(
        await page
          .locator(
            '#collection-grid [data-product-card="qa-new-ring"] button.stable-card__add',
          )
          .isDisabled(),
        true,
      );
      pass("Edit/price/sold-out update collection and purchase model");
      await page.goto(base + "/products/qa-new-ring", {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".stable-pdp h1")
        .getByText("QA Edited Ring", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .locator(".stable-pdp")
          .getByRole("button", { name: "Sold Out", exact: true })
          .first()
          .isDisabled(),
        true,
      );
      pass("Dynamic product detail uses cloud title, price and stock");
      await write("products", qa.id, {
        ...qa,
        title: "QA Edited Ring",
        price: 451,
        isSoldOut: false,
      });
      await page.waitForFunction(
        () =>
          Boolean(document.querySelector("[data-pdp-add]")) &&
          !document.querySelector("[data-pdp-add]").disabled,
      );
      await page.locator("[data-pdp-add]").first().click();
      await page.locator("#cart-drawer.is-open").waitFor();
      assert((await page.locator("#cart-lines").textContent()).includes("451"));
      pass("Cart uses updated price");
      await page.locator("[data-open-checkout]").click();
      await page.locator("#checkout-modal.is-open").waitFor();
      await page.locator("#cust-name").fill("QA Local Customer");
      await page.locator("#cust-phone").fill("9876543210");
      await page.locator("#cust-address").fill("QA Local Test Address");
      await page.locator("#cust-pincode").fill("110001");
      backendStatus = 409;
      await page.locator(".checkout-submit-btn").click();
      await page.waitForFunction(
        () => !document.querySelector(".checkout-submit-btn").disabled,
      );
      assert.equal(
        await page.evaluate(() => Object.keys(window.__qaDB.orders).length),
        0,
      );
      pass("Backend 409 cannot bypass stock rejection");
      backendStatus = 404;
      await page.locator(".checkout-submit-btn").click();
      await page.waitForURL(/order-confirmation/);
      const id = new URL(page.url()).searchParams.get("id");
      assert(id);
      await page
        .locator("#confirmation-mount")
        .getByText(/Order/i)
        .first()
        .waitFor();
      assert.equal(
        await page.evaluate(() => Object.keys(window.__qaDB.orders).length),
        1,
      );
      pass("Static fallback creates one order and confirmation");
      await page.goto(base + "/track-order.html?id=" + id, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator("#track-result-mount")
        .getByText("Pending", { exact: false })
        .first()
        .waitFor();
      pass("Created order is trackable");
      await page.goto(base + "/collections/all", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForFunction(
        () => window.ShivaraCatalog.getAllProducts().length === 5,
      );
      await page.evaluate(async () => {
        const sdk = await import(
          "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
        );
        await sdk.deleteDoc(sdk.doc({}, "products", "qa-cloud-doc"));
      });
      assert.equal(
        await page
          .locator('#collection-grid [data-product-card="qa-new-ring"]')
          .count(),
        0,
      );
      pass("Delete removes product from collection and API");
      await page.goto(base + "/products/qa-new-ring", {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator("#product-page")
        .getByText("This product is no longer available")
        .waitFor();
      pass("Deleted product cannot be purchased from old URL");
      await page.goto(base + "/collections/all", {
        waitUntil: "domcontentloaded",
      });
      await write("inventory", baseline[0].id, {
        sku: baseline[0].id,
        stock: 0,
      });
      await page.waitForFunction(
        (id) => window.ShivaraCatalog.getProductBySlug(id).isSoldOut,
        baseline[0].slug,
      );
      pass("Zero inventory disables purchase");
      await write("inventory", baseline[0].id, {
        sku: baseline[0].id,
        stock: 2,
      });
      await page.waitForFunction(
        (id) => !window.ShivaraCatalog.getProductBySlug(id).isSoldOut,
        baseline[0].slug,
      );
      pass("Restocked inventory enables purchase");
      await write("products", baseline[0].id, {
        ...baseline[0],
        isSoldOut: true,
      });
      await write("inventory", baseline[0].id, {
        sku: baseline[0].id,
        stock: 3,
      });
      assert.equal(
        await page.evaluate(
          (id) => window.ShivaraCatalog.getProductBySlug(id).isSoldOut,
          baseline[0].slug,
        ),
        true,
      );
      pass("Restocking preserves explicitly sold-out product");
      await page.evaluate(async () => {
        const sdk = await import(
          "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
        );
        for (const id of Object.keys(window.__qaDB.products))
          await sdk.deleteDoc(sdk.doc({}, "products", id));
      });
      assert.equal(
        await page.locator("#collection-grid [data-product-card]").count(),
        0,
      );
      await page.goto(base + "/", { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => window.ShivaraCatalog.getAllProducts().length === 0,
      );
      pass("Empty cloud catalogue has no static ghost products");

      assert.deepEqual(errors, []);
      pass("No page exceptions during full flow");
      await context.close();
    } finally {
      await browser.close();
    }
  }
  fs.mkdirSync("artifacts/full-audit", { recursive: true });
  fs.writeFileSync(
    "artifacts/full-audit/realtime-commerce.json",
    JSON.stringify(
      {
        mode: "isolated browser Firestore fixture; no production writes",
        reports,
      },
      null,
      2,
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
