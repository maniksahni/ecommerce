const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const pkg = require(path.join(root, "package.json"));
const { catalogApi } = loadCatalog();

function gitCommit() {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "local";
  }
}

const buildInfo = {
  commit: gitCommit(),
  catalogVersion: String(catalogApi.version),
  builtAt: new Date().toISOString(),
  appVersion: pkg.version
};

const publicFiles = [
  "index.html",
  "product.html",
  "order-confirmation.html",
  "track-order.html",
  "admin.html",
  "admin-store.js",
  "shop-data.js",
  "catalog-supplement.js",
  "catalog-overrides.js",
  "catalog-data.js",
  "admin-catalog-snapshot.js",
  "storefront-renderer.js",
  "script.js",
  "commerce-stable.css"
];

const collectionMeta = {
  all: ["All products", "THE COMPLETE CATALOGUE", "Browse Shivara products that have been manually reviewed for catalogue accuracy."],
  "new-arrivals": ["New Arrivals", "JUST IN", "Discover the newest verified additions to the Shivara edit."],
  earrings: ["Earrings", "FRAME THE FACE", "Explore curated Shivara earrings for everyday and occasion styling."],
  necklaces: ["Neck wear", "LAYER YOUR STORY", "Shop necklaces and neck wear selected for effortless styling."],
  neckwear: ["Neck wear", "LAYER YOUR STORY", "Shop necklaces and neck wear selected for effortless styling."],
  pendants: ["Pendants", "SMALL DETAILS", "Discover expressive pendants from the curated Shivara catalogue."],
  bracelets: ["Bracelets", "WRIST STORIES", "Browse verified Shivara bracelets and hand accessories."],
  rings: ["Rings", "STATEMENT RINGS", "Explore sculptural and expressive rings from Shivara."],
  "evil-eye": ["Evil eye", "PROTECTIVE DETAILS", "Discover Shivara evil-eye jewellery across verified categories."],
  "anti-tarnish": ["Anti tarnish", "EVERYDAY EDIT", "Browse pieces explicitly confirmed for the anti-tarnish collection."],
  gifting: ["Gifting", "READY TO GIFT", "Find curated Shivara jewellery for thoughtful gifting."],
  sets: ["Jewellery sets", "STYLE TOGETHER", "Browse coordinated jewellery sets from Shivara."],
  "jewellery-sets": ["Jewellery sets", "STYLE TOGETHER", "Browse coordinated jewellery sets from Shivara."],
  watches: ["Watches", "TIME, STYLED", "Explore verified watches from the Shivara catalogue."],
  other: ["More jewellery", "THE SHIVARA EDIT", "Explore more verified pieces from the Shivara catalogue."]
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
}

function stamp(html) {
  const meta = `<meta name="shivara-build" content="${escapeHtml(buildInfo.commit)}" /><meta name="shivara-catalog-version" content="${escapeHtml(buildInfo.catalogVersion)}" /><meta name="shivara-build-timestamp" content="${escapeHtml(buildInfo.builtAt)}" /><meta name="shivara-app-version" content="${escapeHtml(buildInfo.appVersion)}" />`;
  return html.replace("</head>", `${meta}<script src="/netlify-build-info.js?v=${escapeHtml(buildInfo.commit.slice(0, 12))}"></script></head>`);
}

function withSeo(html, { title, description, canonical }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${escapeHtml(`https://the-shivara-group-86c9c.web.app${canonical}`)}" /></head>`);
}

function write(relative, content) {
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of publicFiles) {
  const source = path.join(root, file);
  const content = fs.readFileSync(source);
  write(file, file.endsWith(".html") ? stamp(content.toString("utf8")) : content);
}

for (const directory of ["assets", "vendor", "src"]) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(output, directory), { recursive: true });
}

const adminPage = fs.readFileSync(path.join(output, "admin.html"), "utf8");
write("admin/index.html", adminPage);

const trackPage = fs.readFileSync(path.join(output, "track-order.html"), "utf8");
write("track-order/index.html", trackPage);
write("my-orders/index.html", trackPage);

const wishlist = stamp(fs.readFileSync(path.join(root, "wishlist/index.html"), "utf8"));
write("wishlist/index.html", wishlist);

const collectionTemplate = fs.readFileSync(path.join(root, "collections/all/index.html"), "utf8");
const searchPage = stamp(withSeo(collectionTemplate, {
  title: "Search Curated Catalogue | Shivara",
  description: "Search rings, earrings, bracelets, neckwear, watches, and jewellery sets from Shivara.",
  canonical: "/search"
})).replace('data-collection="all"', 'data-collection="search"');
write("search/index.html", searchPage);
for (const [slug, [title, kicker, description]] of Object.entries(collectionMeta)) {
  const selected = catalogApi.getCollection(slug);
  const page = stamp(withSeo(collectionTemplate, {
    title: `${title} | Shivara`,
    description,
    canonical: `/collections/${slug}`
  }))
    .replace('data-collection="all"', `data-collection="${slug}"`)
    .replace(/<span data-collection-breadcrumb>[\s\S]*?<\/span>/, `<span data-collection-breadcrumb>${title}</span>`)
    .replace(/<p data-collection-kicker>[\s\S]*?<\/p>/, `<p data-collection-kicker>${kicker}</p>`)
    .replace(/<h1 data-collection-title>[\s\S]*?<\/h1>/, `<h1 data-collection-title>${title}</h1>`)
    .replace(/<p data-collection-description>[\s\S]*?<\/p>/, `<p data-collection-description>${description}</p>`)
    .replace(/<strong data-collection-count>[\s\S]*?<\/strong>/, `<strong data-collection-count>${selected.length} ${selected.length === 1 ? "product" : "products"}</strong>`);
  write(`collections/${slug}/index.html`, page);
}

const productTemplate = fs.readFileSync(path.join(root, "product.html"), "utf8");
for (const product of catalogApi.getAllProducts()) {
  const description = product.description || `Shop ${product.title} from the curated Shivara jewellery catalogue.`;
  const page = stamp(withSeo(productTemplate, {
    title: `${product.title} | Shivara`,
    description,
    canonical: `/products/${product.slug}`
  }));
  write(`products/${product.slug}/index.html`, page);
}

write("netlify-build-info.js", `window.SHIVARA_BUILD_INFO=Object.freeze(${JSON.stringify(buildInfo)});\n`);
write("404.html", stamp(`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Shivara</title><link rel="stylesheet" href="/commerce-stable.css?v=4"></head><body class="catalog-stable"><main class="stable-empty" style="min-height:100vh;display:grid;place-content:center;text-align:center;padding:24px"><p>404</p><h1 style="font:400 52px/1 Italiana,serif;letter-spacing:0">Page not found</h1><p>This page is not part of the curated Shivara catalogue.</p><a class="stable-button stable-button--dark" href="/collections/all">Browse jewellery</a></main></body></html>`));
write("_headers", `/*\n  X-Shivara-Build: ${buildInfo.commit}\n  X-Shivara-Catalog-Version: ${buildInfo.catalogVersion}\n  X-Shivara-App-Version: ${buildInfo.appVersion}\n  Cache-Control: public, max-age=0, must-revalidate\n`);

const routeRules = [
  ...Object.keys(collectionMeta).map((slug) => `/collections/${slug} /collections/${slug}/index.html 200!`),
  ...catalogApi.getAllProducts().map((product) => `/products/${product.slug} /products/${product.slug}/index.html 200!`),
  ...catalogApi.getAllProducts()
    .filter((product) => product.sourcePostId && product.sourcePostId !== product.slug)
    .map((product) => `/products/${product.sourcePostId} /products/${product.slug} 301!`),
  "/wishlist /wishlist/index.html 200!"
];
write("_redirects", `${routeRules.join("\n")}\n`);

const firebaseConfigPath = path.join(root, "firebase.json");
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    firebaseConfig.hosting = firebaseConfig.hosting || {};
    firebaseConfig.hosting.redirects = catalogApi.getAllProducts()
      .filter((product) => product.sourcePostId && product.sourcePostId !== product.slug)
      .map((product) => ({
        source: `/products/${product.sourcePostId}`,
        destination: `/products/${product.slug}`,
        type: 301
      }));
    firebaseConfig.hosting.headers = [
      {
        source: "**",
        headers: [
          { key: "X-Shivara-Build", value: buildInfo.commit },
          { key: "X-Shivara-Catalog-Version", value: buildInfo.catalogVersion },
          { key: "X-Shivara-App-Version", value: buildInfo.appVersion }
        ]
      },
      {
        source: "**/*.@(html|htm|js|css)",
        headers: [
          { key: "Cache-Control", value: "max-age=0, no-cache, no-store, must-revalidate" }
        ]
      },
      {
        source: "**/*.@(jpg|jpeg|gif|png|webp|svg|ico|woff2|woff|ttf)",
        headers: [
          { key: "Cache-Control", value: "max-age=31536000, immutable" }
        ]
      }
    ];
    fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2) + "\n");
  } catch (err) {
    console.warn("Could not sync firebase.json configuration:", err);
  }
}

console.log(`Netlify storefront built: ${catalogApi.getAllProducts().length} products, ${Object.keys(collectionMeta).length} collections, commit ${buildInfo.commit.slice(0, 8)}.`);
