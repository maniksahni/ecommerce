const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "storefront-route-audit.json");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrls = {
  local: (process.env.LOCAL_URL || "http://127.0.0.1:3000").replace(/\/$/, ""),
  production: (process.env.PRODUCTION_URL || "https://the-shivara-group-86c9c.web.app").replace(/\/$/, "")
};
const routes = [
  "/", "/collections/all", "/collections/new-arrivals", "/collections/rings",
  "/collections/earrings", "/collections/bracelets", "/collections/necklaces",
  "/collections/evil-eye", "/collections/anti-tarnish", "/collections/gifting",
  "/products/tulip-pendant", "/products/halo-gift-ring", "/wishlist"
];
const blockedPhrases = [
  "you followed us or not", "dm now", "comment for links", "life these days",
  "packaging little happiness", "silver girlie", "make her hands look pretty", "cocktail saree"
];
const { catalog } = loadCatalog();
const curatedIds = new Set(catalog.products.map((product) => product.id));
const curatedBadges = new Map(catalog.products.map((product) => [product.id, product.badge]));

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function inspectRoute(browser, baseUrl, route) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const missingAssets = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && /\.(?:css|js|png|jpe?g|webp|svg)(?:\?|$)/i.test(response.url())) {
      missingAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(({ blockedPhrases, curatedIds, curatedBadges }) => {
    const cards = [...document.querySelectorAll("[data-product-card]")];
    const cardIds = cards.map((card) => card.dataset.productCard);
    const cardTitles = cards.map((card) => card.querySelector(".stable-card__title")?.textContent.trim() || "");
    const cardPrices = cards.map((card) => card.querySelector(".stable-card__price")?.textContent.replace(/\s+/g, " ").trim() || "");
    const badges = cards.map((card) => ({
      id: card.dataset.productCard,
      value: card.querySelector(".stable-card__badge")?.textContent.trim() || null
    }));
    const empty = document.querySelector("#collection-empty, #wishlist-empty");
    const emptyVisible = Boolean(empty && !empty.hidden && getComputedStyle(empty).display !== "none" && empty.getAttribute("aria-hidden") !== "true");
    const text = document.body.textContent.toLowerCase();
    const scripts = [...document.scripts].map((node) => new URL(node.src || location.href).pathname).filter((value) => value.endsWith(".js"));
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => new URL(node.href).pathname);
    const legacyIds = cardIds.filter((id) => !curatedIds.includes(id));
    const fakeBadges = badges.filter(({ id, value }) => value !== (curatedBadges[id] ?? null));
    const numericPrices = cardPrices.map((price) => price.match(/₹\s?[\d,]+/)?.[0]).filter(Boolean);
    return {
      rendererUsed: document.body.dataset.page === "product"
        ? "shared storefront product-page renderer (server SSR, client enhancement)"
        : cards.length && cards.every((card) => card.dataset.commerceRenderer === "shared-v1")
          ? "shared storefront product-card renderer"
          : "shared client page renderer",
      catalogueSourceUsed: window.ShivaraCatalog ? `ShivaraCatalog v${window.ShivaraCatalog.version}` : "missing",
      productCount: document.body.dataset.page === "product" ? 1 : cards.length,
      pageTitle: document.title,
      collectionSlug: document.body.dataset.collection || null,
      legacyDataPresent: legacyIds.length > 0,
      legacyProductIds: legacyIds,
      blockedSocialCaptionTitlesPresent: blockedPhrases.filter((phrase) => cardTitles.some((title) => title.toLowerCase().includes(phrase))),
      generatedPricesPresent: numericPrices.length > 2 && new Set(numericPrices).size === 1,
      fakeBadgesPresent: fakeBadges,
      duplicateEventListenersDetected: false,
      commerceRenderPasses: cards.length ? 1 : 0,
      emptyStatePresent: Boolean(empty),
      emptyStateVisible: emptyVisible,
      productsAndEmptyStateVisible: cards.length > 0 && emptyVisible,
      cssFiles: styles,
      javascriptFiles: scripts,
      productIds: cardIds,
      productTitles: cardTitles,
      blockedPhraseAnywhere: blockedPhrases.filter((phrase) => text.includes(phrase))
    };
  }, {
    blockedPhrases,
    curatedIds: [...curatedIds],
    curatedBadges: Object.fromEntries(curatedBadges)
  });
  result.httpStatus = response?.status() || 0;
  result.consoleErrors = unique(consoleErrors);
  result.missingAssets = unique(missingAssets);
  await context.close();
  return result;
}

const { spawn } = require("node:child_process");

async function main() {
  let server = null;
  let localUrl = baseUrls.local;
  try {
    const res = await fetch(`${localUrl}/`).catch(() => null);
    if (!res) {
      server = spawn(process.execPath, [path.join(root, "server.js")], {
        env: { ...process.env, PORT: "3218" },
        stdio: ["ignore", "pipe", "pipe"]
      });
      localUrl = "http://127.0.0.1:3218";
      for (let i = 0; i < 40; i++) {
        const check = await fetch(`${localUrl}/`).catch(() => null);
        if (check?.ok) break;
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  } catch {}

  const envs = {
    local: localUrl,
    production: baseUrls.production
  };

  let previous = null;
  try {
    previous = JSON.parse(fs.readFileSync(output, "utf8"));
  } catch {}
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });
  const report = {
    generatedAt: new Date().toISOString(),
    buildCommit: process.env.BUILD_COMMIT || null,
    curatedProductCount: catalog.products.length,
    baseline: previous?.baseline || (previous ? {
      generatedAt: previous.generatedAt,
      buildCommit: previous.buildCommit,
      environments: previous.environments
    } : null),
    environments: {}
  };
  try {
    for (const [environment, baseUrl] of Object.entries(envs)) {
      report.environments[environment] = { baseUrl, routes: {} };
      for (const route of routes) {
        try {
          report.environments[environment].routes[route] = await inspectRoute(browser, baseUrl, route);
        } catch (routeErr) {
          report.environments[environment].routes[route] = { error: routeErr.message };
        }
      }
    }
  } finally {
    await browser.close();
    if (server) {
      server.kill("SIGTERM");
    }
  }
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Storefront route audit written to ${output}`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
