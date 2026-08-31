const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.CONSISTENCY_PORT || 3224);
const baseUrl = (process.env.STOREFRONT_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, "");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BLOCKED_PRODUCT_PHRASES = [
  "you followed us or not", "dm now", "comment for links", "life these days",
  "packaging little happiness", "silver girlie", "make her hands look pretty", "cocktail saree"
];
const collectionSlugs = [
  "all", "new-arrivals", "rings", "earrings", "bracelets", "necklaces",
  "pendants", "evil-eye", "anti-tarnish", "gifting", "watches"
];
const { catalog, catalogApi } = loadCatalog();
let server;
let failures = 0;

function assert(condition, message) {
  if (condition) console.log(`PASS: ${message}`);
  else {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
}

function blocked(text) {
  const normalized = String(text || "").toLowerCase();
  return BLOCKED_PRODUCT_PHRASES.filter((phrase) => normalized.includes(phrase));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Storefront did not start at ${baseUrl}`);
}

async function main() {
  assert(catalogApi.getAll().length === catalog.products.length && catalogApi.getBySlug("tulip-pendant")?.sku === "SHV-PND-003", "canonical catalogue API aliases expose curated products only");
  if (!process.env.STOREFRONT_BASE_URL) {
    server = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env: { ...process.env, PORT: String(port), SITE_URL: baseUrl },
      stdio: ["ignore", "pipe", "pipe"]
    });
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  }
  await waitForServer();
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });

  for (const slug of collectionSlugs) {
    const expected = catalogApi.getCollection(slug);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    const missing = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && /\.(?:js|css|jpe?g|png|webp)(?:\?|$)/i.test(response.url())) missing.push(response.url());
    });
    const response = await page.goto(`${baseUrl}/collections/${slug}`, { waitUntil: "domcontentloaded" });
    const state = await page.evaluate(() => ({
      title: document.querySelector("[data-collection-title]")?.textContent.trim(),
      description: document.querySelector("[data-collection-description]")?.textContent.trim(),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      count: document.querySelector("[data-collection-count]")?.textContent.trim(),
      cards: [...document.querySelectorAll("#collection-grid [data-product-card]")].map((card) => ({
        id: card.dataset.productCard,
        category: card.dataset.category,
        renderer: card.dataset.commerceRenderer,
        title: card.querySelector(".stable-card__title")?.textContent.trim(),
        badge: card.querySelector(".stable-card__badge")?.textContent.trim() || null,
        image: card.querySelector(".stable-card__image--primary")?.getAttribute("src")
      })),
      emptyVisible: Boolean(document.querySelector("#collection-empty")),
      css: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => new URL(node.href).pathname),
      js: [...document.scripts].map((node) => node.src && new URL(node.src).pathname).filter(Boolean),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    const initialExpected = expected.slice(0, 24);
    assert(response?.status() === 200, `${slug} returns 200`);
    assert(state.title && state.description, `${slug} has route-specific title and description`);
    assert(state.canonical === `${baseUrl}/collections/${slug}`, `${slug} has the correct canonical URL`);
    assert(state.count === `${expected.length} ${expected.length === 1 ? "product" : "products"}`, `${slug} reports ${expected.length} curated products`);
    assert(JSON.stringify(state.cards.map((card) => card.id)) === JSON.stringify(initialExpected.map((product) => product.id)), `${slug} initial page matches the curated API`);
    assert(new Set(state.cards.map((card) => card.id)).size === state.cards.length, `${slug} has no duplicate product IDs`);
    assert(state.cards.every((card) => card.renderer === "shared-v1"), `${slug} uses the shared card renderer only`);
    assert(state.cards.every((card) => blocked(card.title).length === 0), `${slug} contains no blocked social title`);
    assert(state.cards.every((card) => card.badge === (catalogApi.getBySlug(card.id).badge || null)), `${slug} badges match curated data`);
    const confirmedPrices = expected.filter((product) => product.priceStatus === "confirmed").map((product) => product.price);
    assert(!(confirmedPrices.length > 2 && new Set(confirmedPrices).size === 1), `${slug} has no category-wide generated price pattern`);
    if (slug === "rings") assert(state.cards.every((card) => card.category === "rings"), "rings contains explicitly curated rings only");
    assert(!state.emptyVisible, `${slug} does not render a false empty state`);
    assert(state.css.every((asset) => !["/styles.css", "/storefront-v2.css", "/atelier.css", "/phase-b.css"].includes(asset)), `${slug} loads no legacy or homepage-only CSS`);
    assert(!state.js.includes("/experience.js") && !state.js.includes("/motion-controller.js"), `${slug} loads no homepage experience scripts`);
    assert(state.overflow <= 1, `${slug} has no horizontal overflow`);
    assert(errors.length === 0 && missing.length === 0, `${slug} has no console or asset errors`);
    assert(state.cards.every((card) => card.image && card.image.startsWith("/assets/")), `${slug} cards expose audited local images`);
    while (await page.locator("[data-load-more]:visible").count()) {
      await page.locator("[data-load-more]").click();
    }
    const completeIds = await page.locator("#collection-grid [data-product-card]").evaluateAll((cards) => cards.map((card) => card.dataset.productCard));
    assert(JSON.stringify(completeIds) === JSON.stringify(expected.map((product) => product.id)), `${slug} load-more journey exactly matches the complete curated API`);
    await context.close();
  }

  const stateContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await stateContext.addInitScript(() => {
    localStorage.setItem("shivara-cart-v2", JSON.stringify([{ id: "tulip-pendant", variantId: null, qty: 1 }, { id: "DYH8S7oRbLk", qty: 9 }]));
    localStorage.setItem("shivara-wishlist-v2", JSON.stringify(["tulip-pendant", "DYH8S7oRbLk"]));
  });
  const page = await stateContext.newPage();
  await page.goto(`${baseUrl}/collections/all`, { waitUntil: "domcontentloaded" });
  const migration = await page.evaluate(() => ({
    cart: JSON.parse(localStorage.getItem("shivara-cart-v3")),
    wishlist: JSON.parse(localStorage.getItem("shivara-wishlist-v3")),
    oldCart: localStorage.getItem("shivara-cart-v2"),
    oldWishlist: localStorage.getItem("shivara-wishlist-v2")
  }));
  assert(migration.cart.version === 3 && migration.cart.items.length === 1 && migration.cart.items[0].id === "tulip-pendant", "cart migration keeps only valid curated entries");
  assert(migration.wishlist.version === 3 && migration.wishlist.items.length === 1 && migration.wishlist.items[0] === "tulip-pendant", "wishlist migration keeps only valid curated entries");
  assert(migration.oldCart === null && migration.oldWishlist === null, "obsolete state keys are removed after migration");
  await page.locator(".stable-header [data-cart-open]").click();
  assert((await page.locator("#cart-lines").textContent()).includes("Tulip Pendant") && (await page.locator("#cart-lines").textContent()).includes("SHV-PND-003"), "cart uses the curated title and SKU");
  assert(blocked(await page.locator("#cart-drawer").textContent()).length === 0, "cart contains no blocked social content");
  await page.keyboard.press("Escape");

  const tulip = catalogApi.getBySlug("tulip-pendant");
  const card = page.locator('[data-product-card="tulip-pendant"]').first();
  const cardState = {
    title: await card.locator(".stable-card__title").textContent(),
    image: await card.locator(".stable-card__image--primary").getAttribute("src"),
    price: await card.locator(".stable-card__price").textContent()
  };
  await card.locator("[data-quick-view]").click();
  assert((await page.locator("#quick-title").textContent()) === tulip.title, "Quick View title matches the curated card object");
  assert((await page.locator(".stable-quick__price").textContent()).includes("299"), "Quick View price matches the curated card object");
  assert(blocked(await page.locator("#quick-view").textContent()).length === 0, "Quick View contains no blocked social content");
  await page.keyboard.press("Escape");
  await page.goto(`${baseUrl}/products/${tulip.slug}`, { waitUntil: "domcontentloaded" });
  assert((await page.locator(".stable-pdp h1").textContent()) === cardState.title, "product page title matches card title");
  assert((await page.locator(".stable-pdp__gallery img").first().getAttribute("src")) === cardState.image, "product page image matches card image");
  assert((await page.locator(".stable-pdp__price").textContent()).includes("299") && cardState.price.includes("299"), "card and product page prices match");
  assert(blocked(await page.locator("#product-page").textContent()).length === 0, "product page contains no blocked social content");
  await page.goto(`${baseUrl}/wishlist`, { waitUntil: "domcontentloaded" });
  assert((await page.locator('[data-product-card="tulip-pendant"]').count()) === 1, "wishlist uses the same curated product");
  assert(blocked(await page.locator("body").textContent()).length === 0, "wishlist contains no blocked social content");

  await page.goto(`${baseUrl}/collections/watches`, { waitUntil: "domcontentloaded" });
  assert((await page.locator("#collection-grid [data-product-card]").count()) === catalogApi.getCollection("watches").length && (await page.locator("#collection-empty").count()) === 0, "Watches collection displays all curated products with direct pricing");

  const invalidLegacy = await fetch(`${baseUrl}/products/DYH8S7oRbLk`, { redirect: "manual" });
  const invalidCollection = await fetch(`${baseUrl}/collections/not-real`, { redirect: "manual" });
  assert(invalidLegacy.status === 404, "raw Instagram IDs cannot create product pages");
  assert(invalidCollection.status === 404, "invalid collection routes return 404");
  await stateContext.close();

  const homeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const home = await homeContext.newPage();
  await home.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const allLinks = await home.locator('a[href="/collections/all"]').count();
  assert(allLinks >= 2, "homepage View All journeys use the curated /collections/all route");
  assert(blocked(await home.locator("body").textContent()).length === 0, "homepage commerce contains no blocked social content");
  await home.locator(".stable-header [data-search-open]").click();
  await home.locator("#stable-search").fill("ring");
  await home.waitForTimeout(120);
  assert(blocked(await home.locator("#search-results").textContent()).length === 0, "search results contain curated products only");
  assert((await home.locator("#search-results [data-product-card]").count()) === catalogApi.search("ring").slice(0, 12).length, "search result count matches the curated API");
  await homeContext.close();

  await browser.close();
  if (failures) throw new Error(`${failures} storefront consistency assertion(s) failed`);
  console.log("Unified storefront consistency suite passed.");
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(() => {
    server?.kill("SIGTERM");
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  });
