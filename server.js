const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { loadCatalog } = require("./scripts/catalog-lib");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const siteUrl = (process.env.SITE_URL || "https://shivara.up.railway.app").replace(/\/$/, "");
const { catalog } = loadCatalog();
const products = catalog.products;
const productMap = new Map(products.map((product) => [product.slug, product]));
const sourceProductMap = new Map(products.map((product) => [product.sourcePostId, product]));
const supportedCollections = [
  "all", "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye",
  "anti-tarnish", "gifting", "sets", "watches", "new-arrivals"
];
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
  const confirmed = product.priceStatus === "confirmed" && Number.isFinite(product.price);
  const compareAt = confirmed && Number.isFinite(product.compareAtPrice) && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  return { confirmed, compareAt, discount: compareAt ? Math.round(((compareAt - product.price) / compareAt) * 100) : null };
}

function productUrl(product) {
  return `/products/${encodeURIComponent(product.slug)}`;
}

function collectionProducts(slug) {
  if (slug === "all") return products;
  if (slug === "new-arrivals") return products.filter((product) => product.collections.includes("new-arrivals"));
  if (slug === "necklaces") return products.filter((product) => product.category === "necklaces" || product.category === "pendants");
  return products.filter((product) => product.category === slug || product.collections.includes(slug));
}

function priceHtml(product, className) {
  const value = pricing(product);
  if (!value.confirmed) return `<div class="${className} price-enquiry"><strong>Confirm price on WhatsApp</strong></div>`;
  return `<div class="${className}"><strong>${money(product.price)}</strong>${value.compareAt ? `<s>${money(value.compareAt)}</s><span>${value.discount}% off</span>` : ""}</div>`;
}

function semanticCard(product, index = 0) {
  const primary = product.images[0];
  const secondary = product.images.find((image) => image !== primary);
  const badge = product.badge ? `<span class="stable-card__badge">${escapeHtml(product.badge)}</span>` : "";
  const direct = pricing(product).confirmed && product.optionsStatus === "none" && !product.variants.length;
  return `<article class="stable-card ssr-product-card" data-product-card="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}" itemscope itemtype="https://schema.org/Product">
    <div class="stable-card__media"><a href="${productUrl(product)}" itemprop="url" aria-label="View ${escapeHtml(product.title)}"><img class="stable-card__image stable-card__image--primary" src="/${escapeHtml(primary)}" alt="${escapeHtml(product.imageAlt)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} itemprop="image" />${secondary ? `<img class="stable-card__image stable-card__image--secondary" src="/${escapeHtml(secondary)}" alt="" width="640" height="800" loading="lazy" />` : ""}</a>${badge}<button class="stable-card__wish" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="Save ${escapeHtml(product.title)}">♡</button><button class="stable-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}">Quick View</button></div>
    <div class="stable-card__body"><a class="stable-card__title" href="${productUrl(product)}" itemprop="name">${escapeHtml(product.title)}</a>${priceHtml(product, "stable-card__price")}${product.optionsStatus === "confirm" ? '<small class="stable-card__options">Options confirmed on WhatsApp</small>' : ""}<button class="stable-card__add ${direct ? "" : "stable-card__add--enquire"}" type="button" ${direct ? `data-card-add="${escapeHtml(product.id)}"` : `data-quick-view="${escapeHtml(product.id)}"`}>${direct ? "Add to Bag" : product.optionsStatus === "confirm" ? "Confirm Options" : "Enquire"}</button></div>
  </article>`;
}

function injectMetadata(html, { title, description, canonical, image, type = "website" }) {
  const absoluteImage = `${siteUrl}/${image || "assets/instagram-shop/post-051-DW3H_GZDD_4.jpg"}`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${siteUrl}${canonical}" /><meta property="og:type" content="${type}" /><meta property="og:site_name" content="Shivara" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${siteUrl}${canonical}" /><meta property="og:image" content="${absoluteImage}" /><meta name="twitter:card" content="summary_large_image" /></head>`);
}

function injectHome(html) {
  const selections = {
    "new-arrivals": collectionProducts("new-arrivals").slice(0, 10),
    all: products.slice(0, 15),
    rings: collectionProducts("rings").slice(0, 10),
    "neck-wear": collectionProducts("necklaces").slice(0, 10)
  };
  html = html.replace(/<div class="commerce-product-grid" data-product-section="([^"]+)"><\/div>/g, (match, section) => {
    const selected = selections[section] || [];
    return `<div class="commerce-product-grid" data-product-section="${section}">${selected.map(semanticCard).join("")}</div>`;
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
  html = html
    .replace('data-collection="all"', `data-collection="${escapeHtml(slug)}"`)
    .replace(/<span data-collection-breadcrumb>[\s\S]*?<\/span>/, `<span data-collection-breadcrumb>${escapeHtml(meta.title)}</span>`)
    .replace(/<p data-collection-kicker>[\s\S]*?<\/p>/, `<p data-collection-kicker>${escapeHtml(meta.kicker)}</p>`)
    .replace(/<h1 data-collection-title>[\s\S]*?<\/h1>/, `<h1 data-collection-title>${escapeHtml(meta.title)}</h1>`)
    .replace(/<p data-collection-description>[\s\S]*?<\/p>/, `<p data-collection-description>${escapeHtml(meta.description)}</p>`)
    .replace(/<strong data-collection-count>[\s\S]*?<\/strong>/, `<strong data-collection-count>${selected.length} ${selected.length === 1 ? "product" : "products"}</strong>`)
    .replace('<div class="commerce-product-grid" id="collection-grid"></div>', `<div class="commerce-product-grid" id="collection-grid">${selected.map(semanticCard).join("")}</div>`);
  return injectMetadata(html, {
    title: `${meta.title} | Shivara`,
    description: meta.description,
    canonical: `/collections/${slug}`,
    image: selected[0]?.images[0]
  });
}

function injectProduct(html, product) {
  const value = pricing(product);
  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.collections.some((collection) => product.collections.includes(collection)))).slice(0, 5);
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
  const commerceAction = value.confirmed && product.optionsStatus === "none" ? `<button class="stable-button stable-button--dark" type="button" data-pdp-add="${escapeHtml(product.id)}">Add to Bag</button>` : "";
  const body = `<nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections/${escapeHtml(product.category)}">${escapeHtml(collectionMeta[product.category]?.title || product.category)}</a><span>/</span><span>${escapeHtml(product.title)}</span></nav><article class="stable-pdp" itemscope itemtype="https://schema.org/Product"><div class="stable-pdp__media"><div class="stable-pdp__thumbs"><button class="is-active" type="button"><img src="/${escapeHtml(product.images[0])}" alt="" /></button></div><div class="stable-pdp__gallery"><img src="/${escapeHtml(product.images[0])}" alt="${escapeHtml(product.imageAlt)}" itemprop="image" /></div></div><div class="stable-pdp__info"><p>${escapeHtml(collectionMeta[product.category]?.title || product.category)}</p><h1 itemprop="name">${escapeHtml(product.title)}</h1><small>SKU: ${escapeHtml(product.sku)}</small>${priceHtml(product, "stable-pdp__price")}<p itemprop="description">${escapeHtml(product.description)}</p>${product.optionsStatus === "confirm" ? '<div class="stable-notice">Options are confirmed on WhatsApp; no unverified choices are shown.</div>' : ""}<div class="stable-pdp__actions">${commerceAction}<a class="stable-button stable-button--whatsapp" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">${value.confirmed ? "Order on WhatsApp" : "Confirm Price on WhatsApp"}</a></div></div></article><section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOU MAY ALSO LIKE</p><h2>Related products</h2></div></div><div class="commerce-product-grid">${related.map(semanticCard).join("")}</div></section>`;
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

function sendHtml(response, html, status = 200) {
  response.writeHead(status, { "Content-Type": mimeTypes[".html"], "Cache-Control": "no-cache" });
  response.end(html);
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
    if (sourceProductMap.has(identifier)) {
      response.writeHead(301, { Location: productUrl(sourceProductMap.get(identifier)) });
      return response.end();
    }
    const product = productMap.get(identifier);
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
  const filePath = safeStaticPath(pathname);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return sendStatic(response, filePath);
  const page = unavailablePage("Page not found", "The page you requested does not exist.");
  return sendHtml(response, page.html, page.status);
});

server.listen(port, () => {
  console.log(`Shivara catalogue is running on port ${port}`);
});
