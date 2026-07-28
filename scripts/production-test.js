const { execFileSync, spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const baseUrl = (process.env.PRODUCTION_URL || "https://dulcet-starburst-517553.netlify.app").replace(/\/$/, "");
const expectedCommit = process.env.EXPECTED_COMMIT || execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const blockedTitles = [
  "You followed us or not",
  "DM now to book yours",
  "Life these days",
  "Packaging little happiness",
  "Are you a silver girlie too",
  "Make her hands look pretty",
  "Comment for links",
  "Cocktail saree"
];
const { catalogApi } = loadCatalog();
let failures = 0;

function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function commerceSnapshot(products) {
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    title: product.title,
    category: product.category,
    collections: [...product.collections],
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    priceStatus: product.priceStatus,
    optionsStatus: product.optionsStatus,
    variants: product.variants.map((variant) => ({ ...variant })),
    badge: product.badge
  }));
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function main() {
  console.log(`Running production smoke suite against ${baseUrl}`);
  const smoke = spawnSync(process.execPath, ["scripts/smoke-test.js"], {
    cwd: root,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
    stdio: "inherit"
  });
  assert(smoke.status === 0, "complete smoke suite passes against production");
  const storefront = spawnSync(process.execPath, ["scripts/storefront-consistency-test.js"], {
    cwd: root,
    env: { ...process.env, STOREFRONT_BASE_URL: baseUrl },
    stdio: "inherit"
  });
  assert(storefront.status === 0, "unified storefront consistency suite passes against production");
  const experience = spawnSync(process.execPath, ["scripts/experience-test.js"], {
    cwd: root,
    env: { ...process.env, EXPERIENCE_BASE_URL: baseUrl },
    stdio: "inherit"
  });
  assert(experience.status === 0, "complete Phase B experience suite passes against production");

  const response = await fetchWithRetry(baseUrl, { cache: "no-store" });
  const html = await response.text();
  const headerCommit = response.headers.get("x-shivara-build") || "";
  assert(response.ok, "production homepage responds successfully");
  assert(headerCommit === expectedCommit, `response build stamp matches ${expectedCommit.slice(0, 8)}`);
  assert(html.includes(`<meta name="shivara-build" content="${expectedCommit}"`), "HTML build meta matches intended commit");
  assert(html.includes(`name="shivara-catalog-version" content="${catalogApi.version}"`), `HTML exposes catalogue version ${catalogApi.version}`);
  const scriptOrder = ["shop-data.js", "catalog-supplement.js", "catalog-overrides.js", "catalog-data.js", "storefront-renderer.js", "script.js"].map((asset) => html.indexOf(asset));
  assert(scriptOrder.every((index) => index >= 0) && scriptOrder.every((index, position) => position === 0 || index > scriptOrder[position - 1]), "production script loading order is deterministic");
  assert(!html.includes("experience.js") && !html.includes("motion-controller.js"), "removed motion bundles stay out of production");
  assert(!/commerce-stable\.css\?v=2|script\.js\?v=stable-2/.test(html), "production HTML uses build-versioned assets instead of stale static versions");

  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(chromePath) ? { executablePath: chromePath } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failedAssets = [];
  page.on("response", (assetResponse) => {
    if (/\.(?:js|css)(?:\?|$)/.test(assetResponse.url()) && assetResponse.status() >= 400) {
      failedAssets.push(`${assetResponse.status()} ${assetResponse.url()}`);
    }
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  assert(await page.locator(".stable-hero [data-hero-title]").count() === 1, "production stable storefront bootstrap completes");

  const liveState = await page.evaluate(() => ({
    build: window.SHIVARA_BUILD_INFO,
    products: window.ShivaraCatalog.getAllProducts().map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      title: product.title,
      category: product.category,
      collections: [...product.collections],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      priceStatus: product.priceStatus,
      optionsStatus: product.optionsStatus,
      variants: product.variants.map((variant) => ({ ...variant })),
      badge: product.badge
    })),
    cardTitles: [...document.querySelectorAll(".stable-card__title")].map((node) => node.textContent.trim()),
    cards: [...document.querySelectorAll("[data-product-card]")].map((card) => ({
      id: card.dataset.productCard,
      badge: card.querySelector(".stable-card__badge")?.textContent.trim() || null,
      price: card.querySelector(".stable-card__price")?.textContent.replace(/\s+/g, " ").trim() || "",
      action: card.querySelector(".stable-card__add")?.textContent.trim() || ""
    }))
  }));

  assert(liveState.build.commit === expectedCommit, "window.SHIVARA_BUILD_INFO matches intended commit");
  assert(liveState.products.length === catalogApi.getAllProducts().length, "production catalogue API contains the complete curated product set");
  assert(fingerprint(liveState.products) === fingerprint(commerceSnapshot(catalogApi.getAllProducts())), "production commerce data matches the locked local catalogue");
  assert(blockedTitles.every((blocked) => !liveState.cardTitles.some((title) => title.includes(blocked))), "no blocked social-caption title appears");
  assert(liveState.cardTitles.includes("Halo Gift Ring") && liveState.cardTitles.includes("Gold Rose Pendant"), "homepage contains curated product titles");

  for (const card of liveState.cards) {
    const product = catalogApi.getProductBySlug(card.id);
    assert(Boolean(product), `commerce card ${card.id} belongs to the curated catalogue`);
    if (!product) continue;
    assert(card.badge === product.badge, `${card.id} shows only its verified badge`);
    if (product.priceStatus === "enquiry") {
      assert(/Confirm price|Price on request/i.test(card.price), `${card.id} remains in enquiry price mode`);
      assert(card.action === "Enquire on WhatsApp", `${card.id} exposes enquiry rather than a fabricated purchase action`);
    }
  }

  await page.goto(`${baseUrl}/products/tulip-pendant`, { waitUntil: "networkidle" });
  const tulipPrice = (await page.locator(".stable-pdp__price").first().textContent())?.replace(/\s+/g, " ").trim() || "";
  assert(tulipPrice.includes("₹299"), "confirmed Tulip Pendant price is exactly ₹299");
  assert(failedAssets.length === 0, `no failed JavaScript or CSS requests${failedAssets.length ? `: ${failedAssets.join(" | ")}` : ""}`);

  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 2500))]);
  if (failures) throw new Error(`${failures} production regression assertion(s) failed`);
  console.log(`Production integrity suite passed for ${expectedCommit}.`);
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(process.exitCode || 0), 100));
