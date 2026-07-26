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
      const response = await fetch(baseUrl);
      if (response.ok) return;
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
  await context.addInitScript(() => { window.SHIVARA_VISUAL_TIER = "high"; });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  const initialTruth = await page.evaluate(() => JSON.stringify(window.ShivaraCatalog.getAllProducts().map((product) => [
    product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants
  ])));
  assert(await page.locator("html.phase-b-ready").count() === 1, "Phase B experience bootstrap completes");
  assert((await page.locator("[data-experience]").count()) === 3, "only the three approved homepage experiences mount");
  assert(await page.evaluate(() => Object.entries(window.STOREFRONT_FEATURES).filter(([, enabled]) => !enabled).length === 7), "nonessential homepage experiences are feature-disabled");
  assert((await page.locator("html").getAttribute("data-visual-tier")) === "high", "development performance-tier override works");

  const heroBefore = await page.locator("[data-hero-title]").textContent();
  await page.locator("[data-hero-next]").click();
  await page.waitForFunction((before) => document.querySelector("[data-hero-title]")?.textContent !== before, heroBefore);
  assert((await page.locator("[data-hero-title]").textContent()) !== heroBefore, "hero arrow changes verified product");
  await page.locator("#floating-atelier").focus();
  const heroKeyboardBefore = await page.locator("[data-hero-title]").textContent();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction((before) => document.querySelector("[data-hero-title]")?.textContent !== before, heroKeyboardBefore);
  assert((await page.locator("[data-hero-title]").textContent()) !== heroKeyboardBefore, "hero keyboard navigation works");

  const deckBefore = await page.locator("#deck-count").textContent();
  await page.locator("[data-deck-next]").click();
  assert((await page.locator("#deck-count").textContent()) !== deckBefore, "Living Product Deck advances");
  await page.locator("#shivara-deck").focus();
  const deckKeyboardBefore = await page.locator("#deck-count").textContent();
  await page.keyboard.press("ArrowLeft");
  assert((await page.locator("#deck-count").textContent()) !== deckKeyboardBefore, "Living Product Deck supports keyboard control");
  assert(await page.locator(".featured-product-card:not([inert])").count() === 1, "only the active deck card is interactive");

  const categoryChecks = await page.locator(".universe-card").evaluateAll((cards) => cards.map((card) => ({
    href: card.querySelector("a")?.getAttribute("href"),
    count: card.querySelector("span")?.textContent
  })));
  assert(categoryChecks.length === 8 && categoryChecks.every((item) => /^\/collections\//.test(item.href) && /^\d+ products?$/.test(item.count)), "category universe uses real routes and counts");

  const quickTrigger = page.locator('[data-quick-view="tulip-pendant"]').last();
  await quickTrigger.click();
  await page.waitForFunction(() => document.querySelector("#quick-view")?.getAttribute("aria-hidden") === "false");
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "false", "Jewellery Detail Quick View opens");
  assert(await page.locator("#main").evaluate((node) => node.inert), "Quick View makes background content inert");
  assert((await page.locator("#quick-title").textContent()) === "Tulip Pendant", "Quick View uses locked catalogue data");
  await page.keyboard.press("Escape");
  assert(await page.locator("#quick-view").getAttribute("aria-hidden") === "true", "Quick View closes with Escape");

  const finalTruth = await page.evaluate(() => JSON.stringify(window.ShivaraCatalog.getAllProducts().map((product) => [
    product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants
  ])));
  assert(initialTruth === finalTruth, "visual interactions do not mutate catalogue truth");
  assert(errors.length === 0, `signature experiences emit no console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  await context.close();

  const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
  assert((await reducedPage.locator("html").getAttribute("data-visual-tier")) === "lite", "reduced motion selects the Lite visual tier");
  assert(await reducedPage.locator("html.motion-reduced").count() === 1, "reduced-motion fallback is active");
  await reducedContext.close();

  for (const [width, height] of viewports) {
    const viewportContext = await browser.newContext({ viewport: { width, height } });
    const viewportPage = await viewportContext.newPage();
    await viewportPage.goto(baseUrl, { waitUntil: "networkidle" });
    const state = await viewportPage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      columns: getComputedStyle(document.querySelector(".commerce-product-grid")).gridTemplateColumns.split(" ").length,
      broken: [...document.images].filter((image) => image.complete && !image.naturalWidth).length
    }));
    assert(state.overflow <= 1, `${width}x${height} signature layout has no horizontal overflow`);
    if (width <= 430) assert(state.columns === 2, `${width}x${height} preserves two catalogue columns`);
    assert(state.broken === 0, `${width}x${height} has no broken loaded images`);
    await viewportContext.close();
  }

  await browser.close();
  if (failures) throw new Error(`${failures} experience assertion(s) failed`);
  console.log("Phase B experience suite passed.");
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
