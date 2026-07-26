const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.SMOKE_PORT || 3217);
const baseUrl = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${port}`;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [
  [320, 700], [360, 800], [375, 812], [390, 844], [430, 932],
  [768, 1024], [1024, 768], [1280, 900], [1440, 1000]
];
const { catalog } = loadCatalog();
const productMap = new Map(catalog.products.map((product) => [product.id, product]));
let server;
let browser;
let failures = 0;

async function closeBrowser() {
  if (!browser) return;
  const current = browser;
  browser = null;
  await Promise.race([
    current.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]);
}

function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

async function waitForServer() {
  const remote = Boolean(process.env.SMOKE_BASE_URL);
  const attempts = remote ? 120 : 50;
  const delay = remote ? 500 : 100;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`Server did not start at ${baseUrl}`);
}

async function checkRoute(pathname, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  assert(response.status === expectedStatus, `${pathname} returns ${expectedStatus}`);
  return response;
}

async function pageWithErrors(context) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { page, errors };
}

async function main() {
  if (!process.env.SMOKE_BASE_URL) {
    server = spawn(process.execPath, ["server.js"], {
      cwd: root,
      env: { ...process.env, PORT: String(port), SITE_URL: baseUrl },
      stdio: ["ignore", "pipe", "pipe"]
    });
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  }
  await waitForServer();

  await checkRoute("/");
  for (const slug of ["all", "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye", "anti-tarnish", "gifting", "watches", "new-arrivals"]) {
    const response = await checkRoute(`/collections/${slug}`);
    const html = await response.text();
    const metaTitle = slug === "all" ? "All products" : slug === "new-arrivals" ? "New Arrivals" : null;
    if (metaTitle) assert(html.includes(`<h1 data-collection-title>${metaTitle}</h1>`), `${slug} initial HTML has the correct heading`);
    assert(html.includes(`<link rel="canonical" href="${baseUrl}/collections/${slug}"`), `${slug} has a stable canonical URL`);
  }
  await checkRoute("/products/not-a-product", 404);
  await checkRoute("/products/DYH8S7oRbLk", 404);
  const redirect = await checkRoute("/products/DW3H_GZDD_4", 301);
  assert(redirect.headers.get("location") === "/products/boxed-evil-eye-bracelet", "curated legacy product ID redirects to readable slug");

  browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const { page, errors } = await pageWithErrors(context);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const bootstrapState = await page.evaluate(() => ({
    build: window.SHIVARA_BUILD_INFO,
    api: Boolean(window.ShivaraCatalog),
    count: window.ShivaraCatalog?.getAllProducts().length
  }));
  assert(Boolean(bootstrapState.build?.commit), "HTML exposes a deployment build stamp");
  assert(bootstrapState.api && bootstrapState.count === 25, "storefront bootstraps from the 25-product catalogue API");
  assert((await page.locator("[data-product-card]").count()) > 20, "homepage renders a dense curated catalogue");
  assert(await page.locator("[data-product-card]").evaluateAll((cards) => cards.every((card) => !/\bDM now|comment for links|grab yours now|coming soon\b/i.test(card.textContent))), "product cards contain no social CTA titles");
  await page.locator("img").evaluateAll((images) => images.forEach((image) => {
    image.loading = "eager";
    if (!image.complete) image.scrollIntoView({ block: "nearest" });
  }));
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), null, { timeout: 10000 });
  assert(await page.locator("img").evaluateAll((images) => images.every((image) => image.naturalWidth > 0)), "homepage product images load");

  await page.locator('[data-quick-view="halo-gift-ring"]').first().click();
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "false", "Quick View opens");
  await page.keyboard.press("Escape");
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "true", "Quick View closes with Escape");

  await page.locator("[data-search-open]").click();
  await page.locator("#stable-search").fill("Tulip");
  assert((await page.locator("#search-results").getByText("Tulip Pendant", { exact: true }).count()) === 1, "search returns a real catalogue product");
  await page.keyboard.press("Escape");

  await page.locator('[data-card-add="tulip-pendant"]').first().click();
  assert((await page.locator("#cart-lines").getByText("Tulip Pendant", { exact: true }).count()) === 1, "Add to Bag adds the correct product");
  const cartHref = await page.locator(".stable-cart-footer a[href*='wa.me']").getAttribute("href");
  const cartMessage = decodeURIComponent(cartHref);
  assert(cartMessage.includes("Tulip Pendant") && cartMessage.includes("SHV-PND-003") && cartMessage.includes("Quantity: 1") && cartMessage.includes("₹299"), "WhatsApp bag message contains product, SKU, quantity and confirmed price");
  await page.reload({ waitUntil: "networkidle" });
  assert((await page.locator("[data-cart-count]").first().textContent()) === "1", "cart persists after refresh");

  await page.locator('[data-wishlist-toggle="tulip-pendant"]').first().click();
  await page.reload({ waitUntil: "networkidle" });
  assert((await page.locator("[data-wishlist-count]").first().textContent()) === "1", "wishlist persists after refresh");

  for (const [slug, expectedCategory] of [["earrings", "earrings"], ["rings", "rings"]]) {
    await page.goto(`${baseUrl}/collections/${slug}`, { waitUntil: "networkidle" });
    const categories = await page.locator("#collection-grid [data-product-card]").evaluateAll((cards) => [...new Set(cards.map((card) => card.dataset.category))]);
    assert(categories.length === 1 && categories[0] === expectedCategory, `${slug} collection contains ${expectedCategory} only`);
  }
  await page.goto(`${baseUrl}/collections/bracelets`, { waitUntil: "networkidle" });
  const braceletCategories = await page.locator("#collection-grid [data-product-card]").evaluateAll((cards) => [...new Set(cards.map((card) => card.dataset.category))]);
  assert(!braceletCategories.includes("watches"), "bracelets collection does not include watches");

  const product = productMap.get("tulip-pendant");
  await page.goto(`${baseUrl}/products/${product.slug}`, { waitUntil: "networkidle" });
  assert((await page.locator(".stable-pdp h1").first().textContent()) === product.title, "product page title matches catalogue data");
  assert((await page.locator(".stable-pdp__price strong").first().textContent()).includes("299"), "product page price matches catalogue data");
  assert((await page.locator(".stable-pdp__gallery img").first().getAttribute("src")) === `/${product.images[0]}`, "product page image matches catalogue data");

  assert(errors.length === 0, `no browser console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();

  for (const [width, height] of viewports) {
    const viewportContext = await browser.newContext({ viewport: { width, height } });
    const viewportPage = await viewportContext.newPage();
    await viewportPage.goto(baseUrl, { waitUntil: "networkidle" });
    const layout = await viewportPage.evaluate(() => {
      const grid = document.querySelector(".commerce-product-grid");
      const heroImage = document.querySelector(".floating-atelier__product")?.getBoundingClientRect();
      const heroCopy = document.querySelector(".floating-atelier__editorial")?.getBoundingClientRect();
      const skipLink = document.querySelector(".skip-to-content")?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        heroOverlap: heroImage && heroCopy ? Math.max(0, heroImage.bottom - heroCopy.top) : 0,
        skipLinkHidden: !skipLink || (skipLink.width <= 1 && skipLink.height <= 1),
        conciergeHidden: getComputedStyle(document.querySelector(".ask-shivara")).visibility === "hidden"
      };
    });
    assert(layout.overflow <= 1, `${width}×${height} has no horizontal overflow`);
    if (width <= 430) {
      assert(layout.columns === 2, `${width}×${height} has exactly two product columns`);
      assert(layout.heroOverlap === 0, `${width}×${height} keeps hero copy clear of the product photo`);
      assert(layout.skipLinkHidden, `${width}×${height} hides the skip link until keyboard focus`);
      assert(layout.conciergeHidden, `${width}×${height} keeps assistance controls off the hero`);
    }
    if (width === 768) assert(layout.columns === 3, "768px tablet layout has three product columns");
    if (width >= 1280) assert(layout.columns === 5, `${width}px desktop layout has five product columns`);
    await viewportContext.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${baseUrl}/collections/all`, { waitUntil: "networkidle" });
  const filtersFit = await mobilePage.locator(".stable-filters fieldset").evaluate((fieldset) => (
    fieldset.scrollWidth <= fieldset.clientWidth &&
    [...fieldset.querySelectorAll("label")].every((label) => label.getBoundingClientRect().right <= fieldset.getBoundingClientRect().right + 1)
  ));
  assert(filtersFit, "390px collection filters remain fully visible");
  await mobilePage.goto(`${baseUrl}/products/tulip-pendant`, { waitUntil: "networkidle" });
  assert(!await mobilePage.locator(".stable-mobile-buy").evaluate((bar) => bar.classList.contains("is-visible")), "mobile sticky Add to Bag does not cover initial product content");
  await mobilePage.locator(".stable-pdp__actions").scrollIntoViewIfNeeded();
  await mobilePage.evaluate(() => scrollBy(0, innerHeight));
  await mobilePage.waitForFunction(() => document.querySelector(".stable-mobile-buy")?.classList.contains("is-visible"));
  assert(await mobilePage.locator(".stable-mobile-buy").evaluate((bar) => bar.classList.contains("is-visible")), "mobile sticky Add to Bag appears after native actions pass");
  await mobileContext.close();

  await closeBrowser();
  if (failures) throw new Error(`${failures} smoke test assertion(s) failed`);
  console.log("Smoke suite passed.");
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeBrowser();
    if (server) server.kill("SIGTERM");
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  });
