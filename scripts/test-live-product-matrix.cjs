const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  throw Error(
    "ADMIN_EMAIL and ADMIN_PASSWORD are required for explicitly authorized live tests.",
  );
const base =
  process.env.QA_BASE_URL || "https://the-shivara-group-86c9c.web.app";
const out = path.resolve(
  process.env.QA_ARTIFACT_DIR || "artifacts/full-audit/live-matrix",
);
const cycles = Number(process.env.QA_CYCLES || 15);
const rows = [];
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
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
    });
    const admin = await context.newPage();
    admin.setDefaultTimeout(60000);
    const shopper = await browser.newPage({
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
    });
    shopper.setDefaultTimeout(60000);
    const prefix = "QA audit " + randomUUID();
    let currentId;
    try {
      await admin.goto(base + "/admin", { waitUntil: "domcontentloaded" });
      await admin.locator("#admin-email").fill(process.env.ADMIN_EMAIL);
      await admin.locator("#admin-passcode").fill(process.env.ADMIN_PASSWORD);
      await admin.locator("#login-form").evaluate((f) => f.requestSubmit());
      await admin.locator("#admin-screen.is-active").waitFor();
      await admin.waitForFunction(() => window.adminProductsCache?.length > 0);
      await admin.locator("#tab-btn-products").click();
      const read = (id) =>
        admin.evaluate(async (id) => {
          const { db } = await import("/src/firebase.js");
          const { doc, getDocFromServer } = await import(
            "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
          );
          const d = await getDocFromServer(doc(db, "products", id));
          return d.exists() ? d.data() : null;
        }, id);
      for (let i = 1; i <= cycles; i++) {
        const title = prefix + " " + i;
        const price = 250 + i;
        const dir = path.join(out, engine, String(i).padStart(2, "0"));
        fs.mkdirSync(dir, { recursive: true });
        const shot = (page, name) =>
          page.screenshot({
            path: path.join(dir, name + ".png"),
            animations: "disabled",
            fullPage: true,
          });
        await admin.locator("#search-input").fill("");
        await admin.locator("#btn-add-new-product").click();
        await admin.locator("#form-title").fill(title);
        await admin.locator("#form-category").selectOption("rings");
        await admin.locator("#form-price").fill(String(price));
        await admin.locator("#form-is-sold-out").selectOption("false");
        await admin
          .locator("#form-image-url")
          .fill(base + "/assets/instagram-shop/post-002-DYcf1ViBfkI.jpg");
        if (process.env.QA_UPLOAD_PHOTO === "1") {
          await admin.locator("#form-image-url").fill("");
          await admin
            .locator("#form-image-file")
            .setInputFiles("assets/instagram-shop/post-002-DYcf1ViBfkI.jpg");
        }
        await admin.locator("#form-submit-btn").click();
        await admin.waitForFunction(
          (title) => window.adminProductsCache?.some((p) => p.title === title),
          title,
        );
        currentId = await admin.evaluate(
          (title) =>
            window.adminProductsCache.find((p) => p.title === title).id,
          title,
        );
        const added = await read(currentId);
        assert.equal(added.price, price);
        await admin.locator("#search-input").fill(title);
        await admin
          .locator(`.admin-product-row[data-id="${currentId}"]`)
          .scrollIntoViewIfNeeded();
        await shot(admin, "01-added");
        if (process.env.QA_EDGE_CASES === "1")
          await admin.evaluate(
            async ({ id, image, base }) => {
              const { db } = await import("/src/firebase.js");
              const { doc, setDoc } = await import(
                "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
              );
              await setDoc(
                doc(db, "products", id),
                {
                  images: [
                    image,
                    base + "/assets/catalog-2026-07-26/item-099.jpg",
                  ],
                },
                { merge: true },
              );
            },
            { id: currentId, image: added.imageUrl, base },
          );
        await shopper.goto(base + "/products/" + added.slug, {
          waitUntil: "domcontentloaded",
        });
        await shopper
          .locator(".stable-pdp h1")
          .getByText(title, { exact: true })
          .waitFor();
        assert.equal(
          await shopper.locator("[data-pdp-add]").first().isEnabled(),
          true,
        );
        await shot(shopper, "02-new-product-live-url");
        await admin
          .locator(`[data-action="open-edit"][data-id="${currentId}"]`)
          .first()
          .click();
        await admin.locator("#form-title").fill(title + " edited");
        await admin.locator("#form-price").fill(String(price + 100));
        await admin.locator("#form-submit-btn").click();
        await admin.waitForFunction(
          ({ id, price }) =>
            window.adminProductsCache.find((p) => p.id === id)?.price === price,
          { id: currentId, price: price + 100 },
        );
        assert.equal((await read(currentId)).title, title + " edited");
        if (process.env.QA_EDGE_CASES === "1")
          assert.equal((await read(currentId)).images.length, 2);
        await shot(admin, "03-edited");
        await shopper.waitForFunction(
          ({ slug, price }) =>
            window.ShivaraCatalog.getProductBySlug(slug)?.price === price,
          { slug: added.slug, price: price + 100 },
        );
        await shopper.locator("[data-pdp-add]").first().click();
        await shopper.locator("#cart-drawer.is-open").waitFor();
        assert(
          (await shopper.locator("#cart-lines").textContent()).includes(
            String(price + 100),
          ),
        );
        await shot(shopper, "04-correct-cart-price");
        await shopper.keyboard.press("Escape");
        if (process.env.QA_EDGE_CASES === "1")
          await admin.evaluate(async (id) => {
            const { db } = await import("/src/firebase.js");
            const { doc, setDoc } = await import(
              "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
            );
            await setDoc(doc(db, "inventory", id), { sku: id, stock: 0 });
          }, currentId);
        await admin
          .locator(`[data-action="toggle-stock"][data-id="${currentId}"]`)
          .first()
          .click();
        await admin.waitForFunction(
          (id) =>
            window.adminProductsCache.find((p) => p.id === id)?.isSoldOut ===
            true,
          currentId,
        );
        assert.equal((await read(currentId)).isSoldOut, true);
        await shopper
          .locator(".stable-pdp")
          .getByRole("button", { name: "Sold Out", exact: true })
          .first()
          .waitFor();
        assert.equal(
          await shopper
            .locator(".stable-pdp")
            .getByRole("button", { name: "Sold Out", exact: true })
            .first()
            .isDisabled(),
          true,
        );
        await shot(shopper, "05-sold-out");
        await admin
          .locator(`[data-action="toggle-stock"][data-id="${currentId}"]`)
          .first()
          .click();
        await admin.waitForFunction(
          (id) =>
            window.adminProductsCache.find((p) => p.id === id)?.isSoldOut ===
            false,
          currentId,
        );
        assert.equal((await read(currentId)).isSoldOut, false);
        await shopper.locator("[data-pdp-add]").first().waitFor();
        if (process.env.QA_EDGE_CASES === "1") {
          const stock = await admin.evaluate(async (id) => {
            const { db } = await import("/src/firebase.js");
            const { doc, getDocFromServer } = await import(
              "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
            );
            return (await getDocFromServer(doc(db, "inventory", id))).data()
              .stock;
          }, currentId);
          assert.equal(stock, 1);
        }
        await shot(shopper, "06-back-in-stock");
        await admin
          .locator(`[data-action="delete-product"][data-id="${currentId}"]`)
          .first()
          .click();
        await admin.locator("#delete-confirm-btn").click();
        await admin.waitForFunction(
          (id) => !window.adminProductsCache.some((p) => p.id === id),
          currentId,
        );
        assert.equal(await read(currentId), null);
        if (process.env.QA_EDGE_CASES === "1")
          await admin.evaluate(async (id) => {
            const { db } = await import("/src/firebase.js");
            const { doc, deleteDoc } = await import(
              "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
            );
            await deleteDoc(doc(db, "inventory", id));
          }, currentId);
        currentId = null;
        await shopper
          .locator("#product-page")
          .getByText("This product is no longer available")
          .waitFor();
        assert.equal(await shopper.locator("[data-pdp-add]").count(), 0);
        await shot(shopper, "07-deleted");
        rows.push({
          engine,
          cycle: i,
          add: true,
          edit: true,
          cartPrice: true,
          soldOut: true,
          inStock: true,
          delete: true,
          liveProductRoute: true,
          galleryPreserved: process.env.QA_EDGE_CASES === "1",
          zeroQuantityRestocked: process.env.QA_EDGE_CASES === "1",
        });
        fs.writeFileSync(
          path.join(out, "result.json"),
          JSON.stringify({ base, rows }, null, 2),
        );
        console.log(
          "PASS",
          engine,
          "cycle",
          i,
          "add/edit/cart/sold-out/in-stock/delete and live route",
        );
      }
    } finally {
      await admin.evaluate(async (prefix) => {
        const { db } = await import("/src/firebase.js");
        const { collection, getDocsFromServer, doc, deleteDoc } = await import(
          "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"
        );
        const records = await getDocsFromServer(collection(db, "products"));
        for (const item of records.docs)
          if (item.data().title?.startsWith(prefix)) {
            await deleteDoc(doc(db, "products", item.id));
            await deleteDoc(doc(db, "inventory", item.data().sku || item.id));
          }
      }, prefix);
      await browser.close();
    }
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
