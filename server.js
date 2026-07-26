const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { loadCatalog } = require("./scripts/catalog-lib");
const storefrontRenderer = require("./storefront-renderer");
const packageInfo = require("./package.json");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const siteUrl = (process.env.SITE_URL || "https://shivara.up.railway.app").replace(/\/$/, "");
const { catalog, catalogApi } = loadCatalog();
const products = catalogApi.getAllProducts();
const gitCommit = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
})();
const buildInfo = Object.freeze({
  commit: gitCommit,
  catalogVersion: catalog.version,
  builtAt: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
  appVersion: packageInfo.version
});
const assetVersion = `${packageInfo.version}-${catalog.version}-${gitCommit.slice(0, 8)}`;
const supportedCollections = [
  "all", "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye",
  "anti-tarnish", "gifting", "sets", "watches", "new-arrivals"
];
const policyContent = {
  shipping: {
    title: "Shipping & Exchange",
    copy: "PAN India delivery timelines, shipping charges and exchange eligibility are confirmed with each order before payment. Contact Shivara on WhatsApp with your product and delivery location for the current terms."
  },
  privacy: {
    title: "Privacy",
    copy: "Shivara uses the contact and delivery details you provide only to assist with enquiries and fulfil confirmed orders. Do not send payment credentials or sensitive identity documents through the website."
  },
  terms: {
    title: "Terms",
    copy: "Website availability, product options, enquiry prices, delivery and final payable totals remain subject to confirmation by Shivara. Adding an item or preparing a WhatsApp message does not by itself confirm an order."
  }
};
const collectionMeta = {
  all: { title: "All products", kicker: "THE COMPLETE CATALOGUE", description: "Every Shivara product that has been manually reviewed for catalogue accuracy." },
  earrings: { title: "Earrings", kicker: "THE FINAL TOUCH", description: "Curated Shivara earrings with transparent pricing and availability states." },
  necklaces: { title: "Necklaces", kicker: "THE NECKLINE EDIT", description: "Shivara necklaces and pendants selected from explicitly identified product posts." },
  pendants: { title: "Pendants", kicker: "EVERYDAY NECK WEAR", description: "Curated pendants for everyday styling and gifting." },
  bracelets: { title: "Bracelets", kicker: "THE WRIST EDIT", description: "Bracelets and bangles, each classified and priced individually." },
  rings: { title: "Rings", kicker: "THE RING EDIT", description: "Statement and gift-ready rings with options confirmed product by product." },
  "evil-eye": { title: "Evil Eye", kicker: "THE PROTECTION EDIT", description: "Products explicitly classified in Shivara's evil-eye collection." },
  "anti-tarnish": { title: "Anti Tarnish", kicker: "THE EVERYDAY EDIT", description: "Products explicitly included in Shivara's anti-tarnish collection." },
  gifting: { title: "Gifting", kicker: "THE GIFTING ROOM", description: "Gift-ready products with personal WhatsApp assistance." },
  sets: { title: "Jewellery Sets", kicker: "THE COORDINATED EDIT", description: "Curated multi-piece jewellery sets with item-specific pricing." },
  watches: { title: "Watches", kicker: "THE WATCH EDIT", description: "Watches kept separate from bracelet and ring collections." },
  "new-arrivals": { title: "New Arrivals", kicker: "JUST LANDED", description: "The latest products explicitly included in the curated catalogue." }
};
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function pricing(product) {
  return catalogApi.formatPrice(product);
}

function productUrl(product) {
  return `/products/${encodeURIComponent(product.slug)}`;
}

function collectionProducts(slug) {
  return catalogApi.getCollection(slug);
}

function priceHtml(product, className) {
  const value = pricing(product);
  if (!value.confirmed) return `<div class="${className} price-enquiry"><strong>Confirm price on WhatsApp</strong></div>`;
  return `<div class="${className}"><strong>${money(product.price)}</strong>${value.compareAt ? `<s>${money(value.compareAt)}</s><span>${value.discount}% off</span>` : ""}</div>`;
}

function productCard(product, index = 0) {
  return storefrontRenderer.renderProductCard(catalogApi, product, {
    index,
    origin: siteUrl,
    context: "server shared product card renderer"
  });
}

function injectMetadata(html, { title, description, canonical, image, type = "website" }) {
  const absoluteImage = `${siteUrl}/${image || "assets/instagram-shop/post-051-DW3H_GZDD_4.jpg"}`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${siteUrl}${canonical}" /><meta property="og:type" content="${type}" /><meta property="og:site_name" content="Shivara" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${siteUrl}${canonical}" /><meta property="og:image" content="${absoluteImage}" /><meta name="twitter:card" content="summary_large_image" /></head>`);
}

function stampHtml(html) {
  const stampedAssets = html.replace(/((?:src|href)="\/[^"]+\.(?:js|css))\?v=[^"]+"/g, `$1?v=${assetVersion}"`);
  if (stampedAssets.includes('name="shivara-build"')) return stampedAssets;
  const serialized = JSON.stringify(buildInfo).replace(/</g, "\\u003c");
  return stampedAssets.replace("</head>", `<meta name="shivara-build" content="${escapeHtml(buildInfo.commit)}" /><meta name="shivara-catalog-version" content="${escapeHtml(buildInfo.catalogVersion)}" /><meta name="shivara-build-timestamp" content="${escapeHtml(buildInfo.builtAt)}" /><meta name="shivara-app-version" content="${escapeHtml(buildInfo.appVersion)}" /><script>window.SHIVARA_BUILD_INFO=Object.freeze(${serialized});</script></head>`);
}

function injectHome(html) {
  const selections = {
    "new-arrivals": collectionProducts("new-arrivals").slice(0, 12),
    bestsellers: catalogApi.getFeaturedProducts(10),
    all: products.slice(12, 24),
    rings: collectionProducts("rings").slice(0, 8),
    "neck-wear": collectionProducts("necklaces").slice(0, 10)
  };
  html = html.replace(/<div class="commerce-product-grid" data-product-section="([^"]+)"><\/div>/g, (match, section) => {
    const selected = selections[section] || [];
    return `<div class="commerce-product-grid" data-product-section="${section}">${selected.map(productCard).join("")}</div>`;
  });
  return injectMetadata(html, {
    title: "Shivara | Curated Jewellery",
    description: "Shop Shivara's manually curated jewellery catalogue with transparent pricing and personal WhatsApp assistance.",
    canonical: "/",
    image: products[0].images[0]
  });
}

function injectCollection(html, slug) {
  const meta = collectionMeta[slug];
  const selected = collectionProducts(slug);
  const initiallyVisible = selected.slice(0, 24);
  html = html
    .replace('data-collection="all"', `data-collection="${escapeHtml(slug)}"`)
    .replace(/<span data-collection-breadcrumb>[\s\S]*?<\/span>/, `<span data-collection-breadcrumb>${escapeHtml(meta.title)}</span>`)
    .replace(/<p data-collection-kicker>[\s\S]*?<\/p>/, `<p data-collection-kicker>${escapeHtml(meta.kicker)}</p>`)
    .replace(/<h1 data-collection-title>[\s\S]*?<\/h1>/, `<h1 data-collection-title>${escapeHtml(meta.title)}</h1>`)
    .replace(/<p data-collection-description>[\s\S]*?<\/p>/, `<p data-collection-description>${escapeHtml(meta.description)}</p>`)
    .replace(/<strong data-collection-count>[\s\S]*?<\/strong>/, `<strong data-collection-count>${selected.length} ${selected.length === 1 ? "product" : "products"}</strong>`)
    .replace('<div class="commerce-product-grid" id="collection-grid"></div>', `<div class="commerce-product-grid" id="collection-grid">${initiallyVisible.map(productCard).join("")}</div>`)
    .replace("<!-- COLLECTION_EMPTY_STATE -->", selected.length ? "" : '<div class="stable-empty" id="collection-empty"><h2>No products are currently available</h2><p>Explore the complete curated catalogue while this edit is updated.</p><a href="/collections/all">Browse all products</a></div>');
  return injectMetadata(html, {
    title: `${meta.title} | Shivara`,
    description: meta.description,
    canonical: `/collections/${slug}`,
    image: selected[0]?.images[0]
  });
}

function injectProduct(html, product) {
  const value = pricing(product);
  const related = catalogApi.getRelatedProducts(product, 5);
  const offer = value.confirmed ? {
    "@type": "Offer",
    priceCurrency: "INR",
    price: product.price,
    availability: "https://schema.org/LimitedAvailability",
    url: `${siteUrl}${productUrl(product)}`
  } : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((image) => `${siteUrl}/${image}`),
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Shivara" },
    ...(offer ? { offers: offer } : {})
  };
  const body = storefrontRenderer.renderProductPage(catalogApi, product, {
    related,
    origin: siteUrl,
    context: "server shared product page renderer"
  });
  html = html
    .replace('<div id="product-page"></div>', `<div id="product-page">${body}</div>`)
    .replace("</head>", `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script></head>`);
  return injectMetadata(html, {
    title: `${product.title} | Shivara`,
    description: product.description,
    canonical: productUrl(product),
    image: product.images[0],
    type: "product"
  });
}

function unavailablePage(title, message, status = 404) {
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="robots" content="noindex" /><title>${escapeHtml(title)} | Shivara</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&amp;family=Italiana&amp;display=swap" rel="stylesheet" /><link rel="stylesheet" href="/commerce-stable.css?v=2" /></head><body class="catalog-stable"><main class="stable-empty" style="min-height:100vh;display:grid;place-content:center"><p>${status}</p><h1 style="font:400 clamp(40px,8vw,80px)/1 Italiana,serif;letter-spacing:0;margin:8px">${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="stable-button stable-button--dark" href="/collections/all">Browse curated products</a></main></body></html>`;
  return { html, status };
}

function policyPage(policy) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="description" content="${escapeHtml(policy.copy)}" /><title>${escapeHtml(policy.title)} | Shivara</title><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&amp;family=Italiana&amp;display=swap" rel="stylesheet" /><link rel="stylesheet" href="/commerce-stable.css?v=2" /></head><body class="catalog-stable"><main class="stable-page"><nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><span>${escapeHtml(policy.title)}</span></nav><article style="max-width:760px;padding:8vh 0 16vh"><p style="font-size:10px;font-weight:700;letter-spacing:1.6px">SHIVARA POLICIES</p><h1 style="font:400 clamp(48px,8vw,90px)/1 Italiana,serif;letter-spacing:0;margin:12px 0 24px">${escapeHtml(policy.title)}</h1><p style="font-size:14px;line-height:1.8">${escapeHtml(policy.copy)}</p><a class="stable-button stable-button--dark" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">Ask Shivara</a></article></main></body></html>`;
}

function sendHtml(response, html, status = 200) {
  response.writeHead(status, {
    "Content-Type": mimeTypes[".html"],
    "Cache-Control": "no-cache, must-revalidate",
    "X-Shivara-Build": buildInfo.commit,
    "X-Shivara-Catalog-Version": String(buildInfo.catalogVersion),
    "X-Shivara-App-Version": buildInfo.appVersion,
    "X-Shivara-Built-At": buildInfo.builtAt
  });
  response.end(stampHtml(html));
}

function sendStatic(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream", "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600" });
  fs.createReadStream(filePath).pipe(response);
}

function safeStaticPath(pathname) {
  const relative = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://localhost:${port}`);
  const pathname = decodeURIComponent(requestUrl.pathname).replace(/\/+$/, "") || "/";
  if (pathname === "/robots.txt") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  }
  if (pathname === "/favicon.ico") {
    response.writeHead(204, { "Cache-Control": "public, max-age=86400" });
    return response.end();
  }
  if (pathname === "/sitemap.xml") {
    const urls = ["/", ...supportedCollections.map((slug) => `/collections/${slug}`), "/wishlist", ...products.map(productUrl)];
    response.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    return response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${siteUrl}${url}</loc></url>`).join("")}</urlset>`);
  }
  if (pathname === "/") {
    return sendHtml(response, injectHome(fs.readFileSync(path.join(root, "index.html"), "utf8")));
  }
  if (pathname.startsWith("/collections/")) {
    const slug = pathname.split("/")[2] || "";
    if (!supportedCollections.includes(slug)) {
      const page = unavailablePage("Collection not found", "This collection does not exist.");
      return sendHtml(response, page.html, page.status);
    }
    const template = fs.readFileSync(path.join(root, "collections/all/index.html"), "utf8");
    return sendHtml(response, injectCollection(template, slug));
  }
  if (pathname.startsWith("/products/")) {
    const identifier = pathname.split("/")[2] || "";
    const legacyProduct = catalogApi.getProductByLegacyId(identifier);
    if (legacyProduct) {
      response.writeHead(301, { Location: productUrl(legacyProduct) });
      return response.end();
    }
    const product = catalogApi.getProductBySlug(identifier);
    if (!product) {
      const sourceEntry = catalog.socialContent.find((item) => item.id === identifier);
      const page = unavailablePage(sourceEntry ? "Product unavailable" : "Product not found", sourceEntry ? "This social post is not a verified purchasable product." : "We could not find that product.");
      return sendHtml(response, page.html, page.status);
    }
    return sendHtml(response, injectProduct(fs.readFileSync(path.join(root, "product.html"), "utf8"), product));
  }
  if (pathname === "/wishlist") {
    const html = injectMetadata(fs.readFileSync(path.join(root, "wishlist/index.html"), "utf8"), {
      title: "Your Wishlist | Shivara",
      description: "Your saved Shivara jewellery edit.",
      canonical: "/wishlist"
    });
    return sendHtml(response, html);
  }
  if (pathname.startsWith("/policies/")) {
    const policy = policyContent[pathname.split("/")[2] || ""];
    if (!policy) {
      const page = unavailablePage("Policy not found", "The requested policy page does not exist.");
      return sendHtml(response, page.html, page.status);
    }
    return sendHtml(response, injectMetadata(policyPage(policy), {
      title: `${policy.title} | Shivara`,
      description: policy.copy,
      canonical: pathname
    }));
  }
  const filePath = safeStaticPath(pathname);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return sendStatic(response, filePath);
  const page = unavailablePage("Page not found", "The page you requested does not exist.");
  return sendHtml(response, page.html, page.status);
});

server.listen(port, () => {
  console.log(`Shivara catalogue is running on port ${port}`);
});
