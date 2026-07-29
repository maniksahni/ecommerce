const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.EXPERIENCE_PORT || 3221);
const baseUrl = (process.env.EXPERIENCE_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, "");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const viewports = [[320, 700], [360, 800], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 900], [1440, 1000]];
let server;
let failures = 0;

function assert(condition, message) {
  if (condition) console.log(`PASS: ${message}`);
  else {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Experience server did not start at ${baseUrl}`);
}

async function main() {
  if (!process.env.EXPERIENCE_BASE_URL) {
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

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const initialTruth = await page.evaluate(() => JSON.stringify(window.ShivaraCatalog.getAllProducts().map((product) => [
    product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants
  ])));
  assert(await page.locator(".stable-hero").count() === 1, "one stable commerce hero is mounted");
  assert(await page.locator(".floating-atelier, #shivara-deck, .universe-card").count() === 0, "legacy overlapping experience systems are absent");
  assert((await page.locator('script[src*="experience.js"], script[src*="motion-controller.js"]').count()) === 0, "optional motion bundles stay disabled");
  assert((await page.locator('[data-product-section="new-arrivals"] [data-product-card]').count()) === 12, "New Arrivals is intentionally capped at twelve products");
  assert((await page.locator('[data-product-section="rings"] [data-product-card]').count()) === 8, "ring edit remains compact");
  assert((await page.locator('[data-product-section="all"] [data-product-card]').count()) === 12, "catalogue preview remains compact");
  assert((await page.locator("#commerce-category-grid a").count()) >= 9, "category rail exposes the complete shopping journey");

  const heroBefore = await page.locator("[data-hero-title]").textContent();
  await page.waitForFunction((before) => document.querySelector("[data-hero-title]")?.textContent !== before, heroBefore, { timeout: 10000 });
  assert((await page.locator("[data-hero-title]").textContent()) !== heroBefore, "hero automatically changes the verified product");
  assert(await page.locator("[data-hero-prev], [data-hero-next], [data-signature-prev], [data-signature-next]").count() === 0, "automatic edits do not render arrow controls");

  const quickCard = page.locator('[data-product-section="new-arrivals"] [data-product-card]').first();
  const quickTitle = await quickCard.locator(".stable-card__title").textContent();
  await quickCard.locator("[data-quick-view]").click();
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "false", "Quick View opens from the stable storefront");
  assert((await page.locator("#quick-title").textContent()) === quickTitle, "Quick View uses locked catalogue data");
  await page.keyboard.press("Escape");
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "true", "Quick View closes with Escape");

  const finalTruth = await page.evaluate(() => JSON.stringify(window.ShivaraCatalog.getAllProducts().map((product) => [
    product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants
  ])));
  assert(initialTruth === finalTruth, "visual interactions do not mutate catalogue truth");
  assert(errors.length === 0, `stable experience emits no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();

  for (const [width, height] of viewports) {
    const viewportContext = await browser.newContext({ viewport: { width, height } });
    const viewportPage = await viewportContext.newPage();
    await viewportPage.goto(baseUrl, { waitUntil: "networkidle" });
    const state = await viewportPage.evaluate(() => {
      const grid = document.querySelector(".commerce-product-grid");
      const hero = document.querySelector(".stable-hero")?.getBoundingClientRect();
      const title = document.querySelector(".stable-hero h1")?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        heroFits: Boolean(hero && title && title.left >= hero.left && title.right <= hero.right + 1 && title.bottom <= hero.bottom + 1),
        broken: [...document.images].filter((image) => image.complete && !image.naturalWidth).length
      };
    });
    assert(state.overflow <= 1, `${width}x${height} has no horizontal overflow`);
    if (width <= 430) assert(state.columns === 2, `${width}x${height} preserves two catalogue columns`);
    if (width === 768) assert(state.columns === 3, "768px tablet layout has three product columns");
    if (width >= 1280) assert(state.columns === 5, `${width}px desktop layout has five product columns`);
    assert(state.heroFits, `${width}x${height} keeps hero content inside its bounds`);
    assert(state.broken === 0, `${width}x${height} has no broken loaded images`);
    await viewportContext.close();
  }

  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 2500))
  ]);
  if (failures) throw new Error(`${failures} experience assertion(s) failed`);
  console.log("Stable storefront experience suite passed.");
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
