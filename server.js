const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const siteUrl = process.env.SITE_URL || "https://shivara.up.railway.app";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const titleOverrides = {
  DW3H_GZDD_4: "Boxed Evil Eye Bracelet",
  DXRflQ2ARK2: "Tulip Pendant",
  DVsiM2WEctG: "Iconic Ring Set",
  DW9Cf8OkWo0: "Curated Bracelet Collection",
  DWtcQ8OAefp: "Gold Flower Pendant",
  DWERaGlEYB6: "Blue Earring Gift Edit",
  DV0yEUUkTHq: "Charm Bracelet Tray",
  DUsq31AgXWw: "Gift-ready Jewellery Set",
  "DXO-ucIBdig": "Bow Love Earrings",
  DXUKeYosxOa: "Blue Evil Eye Bracelet",
  "DXbGtV-kd5A": "Boutique Earring Card",
  DXZqgaJBA9l: "Butterfly Love Pendant",
  "DXWiT4SxF-w": "Cherry Charm Pendant",
  DXOonNskfbi: "Icon Bracelet Set",
  DXMpqNMxs1F: "Refined Bracelet Stack",
  DXLqgBTkXIL: "Solitaire Promise Ring",
  DXKG78JhH1P: "Infinity Shine Ring",
  DXHUsl9BfJh: "Rose Proposal Ring"
};

const categoryMeta = {
  All: { label: "THE COMPLETE ATELIER", title: "All Shivara drops", description: "Explore Shivara rings, earrings, neckwear, bracelets, gifting and expressive anti-tarnish jewellery.", image: "assets/instagram-shop/post-051-DW3H_GZDD_4.jpg" },
  Earrings: { label: "THE FINAL TOUCH", title: "Earrings that change the whole look.", description: "Discover Shivara earrings curated for everyday polish, gifting and statement dressing.", image: "assets/instagram-shop/post-080-DWERaGlEYB6.jpg" },
  Pendants: { label: "THE NECKLINE EDIT", title: "The piece that pulls everything together.", description: "Explore expressive Shivara pendants and neckwear for effortless layering.", image: "assets/instagram-shop/post-036-DXRflQ2ARK2.jpg" },
  Bracelets: { label: "THE STACKING STUDIO", title: "Build the stack your way.", description: "Curated Shivara bracelets designed to wear solo, layer and gift.", image: "assets/instagram-shop/post-049-DW9Cf8OkWo0.jpg" },
  Rings: { label: "THE RING EDIT", title: "Small detail. Major effect.", description: "Shop sculptural, romantic and adjustable Shivara rings.", image: "assets/instagram-shop/post-090-DVsiM2WEctG.jpg" },
  "Evil Eye": { label: "THE PROTECTION EDIT", title: "A little protection. A lot of personality.", description: "Explore Shivara evil-eye jewellery with graphic detail and confident energy.", image: "assets/instagram-shop/post-007-DYPpSpxhPO0.jpg" },
  "Anti-tarnish": { label: "EVERYDAY ICONS", title: "Designed to stay in rotation.", description: "Browse Shivara anti-tarnish jewellery selected for repeat wear.", image: "assets/instagram-shop/post-068-DWjfG3oBmR5.jpg" },
  Gifting: { label: "THE GIFTING ROOM", title: "Small box. Big reaction.", description: "Find gift-ready Shivara jewellery with personal WhatsApp assistance.", image: "assets/instagram-shop/post-103-DUsq31AgXWw.jpg" }
};

function loadProducts() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "shop-data.js"), "utf8"), sandbox);
  return sandbox.window.SHIVARA_SHOP_DATA.products.map((product) => {
    const title = titleOverrides[product.id] || product.title;
    const text = `${title} ${product.caption || ""}`.toLowerCase();
    let category = product.category || "Anti-tarnish";
    if (/\bearring|ear cuff|studs?\b/.test(text)) category = "Earrings";
    else if (/\bnecklace|neckpiece|pendant\b/.test(text)) category = "Pendants";
    else if (/\bbracelet|bangle|wrist\b/.test(text)) category = product.category === "Evil Eye" || /evil eye/.test(text) ? "Evil Eye" : "Bracelets";
    else if (/\bring\b/.test(text)) category = "Rings";
    else if (/\bevil eye|protection\b/.test(text)) category = "Evil Eye";
    return { ...product, title, category };
  });
}

const products = loadProducts();
const productMap = new Map(products.map((product) => [product.id, product]));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function pricing(product) {
  const base = { Rings: 199, Bracelets: 399, Pendants: 299, Earrings: 299, "Evil Eye": 499, Gifting: 699, "Anti-tarnish": 499 };
  const price = base[product.category] || 399;
  const compareAt = price + (price >= 499 ? 200 : 100);
  return { price, compareAt, discount: Math.round(((compareAt - price) / compareAt) * 100) };
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function productUrl(product) {
  return `/products/${encodeURIComponent(product.id)}`;
}

function semanticCard(product, index = 0) {
  const value = pricing(product);
  const hasOptions = ["Rings", "Bracelets", "Evil Eye", "Anti-tarnish"].includes(product.category);
  return `<article class="jlt-product-card ssr-product-card" itemscope itemtype="https://schema.org/Product" data-product-card="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}">
    <div class="jlt-product-card__media">
      <a href="${productUrl(product)}" itemprop="url" aria-label="View ${escapeHtml(product.title)}">
        <img class="jlt-product-card__image jlt-product-card__image--primary" src="/${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" itemprop="image" />
        <img class="jlt-product-card__image jlt-product-card__image--secondary" src="/${escapeHtml(product.image)}" alt="" width="640" height="800" loading="lazy" decoding="async" />
      </a>
      <div class="jlt-product-card__badges"><span>${product.index % 5 === 0 ? "Best Seller" : "Sale"}</span><span>${value.discount}% off</span></div>
      <button class="jlt-product-card__wishlist" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="Save ${escapeHtml(product.title)}">♡</button>
      <button class="jlt-product-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}">Quick View</button>
    </div>
    <div class="jlt-product-card__content">
      <a class="jlt-product-card__title" href="${productUrl(product)}" itemprop="name">${escapeHtml(product.title)}</a>
      <div class="jlt-product-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <meta itemprop="priceCurrency" content="INR" /><meta itemprop="price" content="${value.price}" /><link itemprop="availability" href="https://schema.org/LimitedAvailability" />
        <strong>${money(value.price)}</strong><s>${money(value.compareAt)}</s><span>${value.discount}% off</span>
      </div>
      <button class="jlt-product-card__add" type="button" ${hasOptions ? `data-quick-view="${escapeHtml(product.id)}"` : `data-card-add="${escapeHtml(product.id)}"`}>${hasOptions ? "Choose Options" : "Add to Bag"}</button>
    </div>
  </article>`;
}

function productSelection(source) {
  if (source === "bestsellers") return products.slice(0, 10);
  if (source === "new") return products.slice(10, 20);
  return products.filter((product) => product.category.toLowerCase() === source.toLowerCase()).slice(0, 10);
}

function injectHomeProducts(html) {
  return html.replace(/<div class="([^"]*\bcommerce-product-grid\b[^"]*)"([^>]*?)data-commerce-products="([^"]+)"([^>]*)><\/div>/g, (_, classes, before, source, after) => {
    const cards = productSelection(source).map(semanticCard).join("");
    return `<div class="${classes}"${before}data-commerce-products="${source}"${after}>${cards}</div>`;
  });
}

function selectedCategory(requestUrl, fallback = "All") {
  const url = new URL(requestUrl, siteUrl);
  return categoryMeta[url.searchParams.get("category")] ? url.searchParams.get("category") : fallback;
}

function injectCollection(html, requestUrl, fallback) {
  const category = selectedCategory(requestUrl, fallback);
  const meta = categoryMeta[category] || categoryMeta.All;
  const selected = category === "All" ? products.slice(0, 40) : products.filter((product) => product.category === category).slice(0, 40);
  return html
    .replace(/<p class="section-kicker">[\s\S]*?<\/p>/, `<p class="section-kicker">${meta.label}</p>`)
    .replace(/<h2>[\s\S]*?<\/h2>/, `<h2>${meta.title}</h2>`)
    .replace(/<header class="collection-hero">([\s\S]*?)<p>[\s\S]*?<\/p>\s*<\/header>/, `<header class="collection-hero" style="--collection-image:url('/${meta.image}')">$1<p>${meta.description}</p></header>`)
    .replace('<div class="product-on-page product-list__inner" id="collection-grid"></div>', `<div class="product-on-page product-list__inner" id="collection-grid">${selected.map(semanticCard).join("")}</div>`);
}

function injectProduct(html, product) {
  const value = pricing(product);
  const description = (product.caption || "A statement jewellery piece curated by Shivara.").replace(/\s+/g, " ").slice(0, 240);
  const fallback = `<article class="ssr-product-detail" itemscope itemtype="https://schema.org/Product">
    <nav class="pdp-breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections/all?category=${encodeURIComponent(product.category)}">${escapeHtml(product.category)}</a><span>/</span><b>${escapeHtml(product.title)}</b></nav>
    <section class="pdp-main">
      <div class="pdp-gallery"><div class="pdp-images"><img src="/${escapeHtml(product.image)}" width="900" height="1125" alt="${escapeHtml(product.title)}" itemprop="image" /></div></div>
      <div class="pdp-info"><small>${escapeHtml(product.category)}</small><h1 itemprop="name">${escapeHtml(product.title)}</h1><p class="pdp-sku">SKU: ${escapeHtml(product.id)}</p>
        <div class="pdp-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer"><meta itemprop="priceCurrency" content="INR" /><meta itemprop="price" content="${value.price}" /><strong>${money(value.price)}</strong><s>${money(value.compareAt)}</s><span>${value.discount}% off</span></div>
        <p itemprop="description">${escapeHtml(description)}</p><button class="store-button store-button--dark" type="button" data-quick-view="${escapeHtml(product.id)}">Choose Options</button>
      </div>
    </section>
  </article>`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: `${siteUrl}/${product.image}`,
    description,
    sku: product.id,
    brand: { "@type": "Brand", name: "Shivara" },
    offers: { "@type": "Offer", priceCurrency: "INR", price: value.price, availability: "https://schema.org/LimitedAvailability", url: `${siteUrl}${productUrl(product)}` }
  };
  return html
    .replace('<div id="product-page"></div>', `<div id="product-page">${fallback}</div>`)
    .replace("</head>", `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script></head>`);
}

function injectMetadata(html, { title, description, canonical, image, type = "website" }) {
  const absoluteImage = image ? `${siteUrl}/${image}` : `${siteUrl}/assets/instagram-shop/post-051-DW3H_GZDD_4.jpg`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace("</head>", `<link rel="canonical" href="${siteUrl}${canonical}" /><meta property="og:type" content="${type}" /><meta property="og:site_name" content="Shivara" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${siteUrl}${canonical}" /><meta property="og:image" content="${absoluteImage}" /><meta name="twitter:card" content="summary_large_image" /></head>`);
}

function renderHtml(filePath, requestUrl) {
  let html = fs.readFileSync(filePath, "utf8");
  const pathname = new URL(requestUrl, siteUrl).pathname;
  if (pathname === "/") {
    html = injectHomeProducts(html);
    html = injectMetadata(html, { title: "Shivara | Digital Jewellery Atelier", description: "Shop expressive Shivara jewellery, signature stacks, earrings, rings and gift-ready edits with personal WhatsApp ordering.", canonical: "/", image: "assets/instagram-shop/post-051-DW3H_GZDD_4.jpg" });
  } else if (pathname.startsWith("/collections/")) {
    const fallback = pathname.includes("/rings") ? "Rings" : "All";
    const category = selectedCategory(requestUrl, fallback);
    const meta = categoryMeta[category] || categoryMeta.All;
    html = injectCollection(html, requestUrl, fallback);
    const canonical = category === "All" || (fallback === "Rings" && category === "Rings") ? pathname : `${pathname}?category=${encodeURIComponent(category)}`;
    html = injectMetadata(html, { title: `${meta.title} | Shivara`, description: meta.description, canonical, image: meta.image });
  } else if (pathname.startsWith("/products/")) {
    const product = productMap.get(decodeURIComponent(pathname.split("/")[2] || ""));
    if (product) {
      html = injectProduct(html, product);
      html = injectMetadata(html, { title: `${product.title} | Shivara`, description: (product.caption || `Shop ${product.title} from Shivara.`).replace(/\s+/g, " ").slice(0, 155), canonical: productUrl(product), image: product.image, type: "product" });
    }
  } else if (pathname === "/wishlist") {
    html = injectMetadata(html, { title: "Your Shivara Edit", description: "Return to the Shivara jewellery pieces saved to your edit.", canonical: "/wishlist" });
  }
  return html;
}

function resolveRequestPath(url) {
  const requestPath = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const normalized = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, normalized === "/" ? "index.html" : normalized);
  return filePath.startsWith(root) ? filePath : null;
}

function sendHtml(response, filePath, requestUrl) {
  try {
    response.writeHead(200, { "Content-Type": mimeTypes[".html"], "Cache-Control": "no-cache" });
    response.end(renderHtml(filePath, requestUrl));
  } catch (error) {
    response.writeHead(500);
    response.end("Unable to render storefront");
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = request.url || "/";
  const pathname = decodeURIComponent(new URL(requestUrl, `http://localhost:${port}`).pathname);
  if (pathname === "/robots.txt") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
    return;
  }
  if (pathname === "/sitemap.xml") {
    const urls = ["/", "/collections/all", "/collections/rings", "/wishlist", ...products.map(productUrl)];
    response.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${siteUrl}${url}</loc></url>`).join("")}</urlset>`);
    return;
  }
  if (pathname.startsWith("/products/")) {
    sendHtml(response, path.join(root, "product.html"), requestUrl);
    return;
  }

  const filePath = resolveRequestPath(requestUrl);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isFile()) {
      if (path.extname(filePath) === ".html") sendHtml(response, filePath, requestUrl);
      else {
        response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(response);
      }
      return;
    }
    const indexPath = path.join(filePath, "index.html");
    fs.stat(indexPath, (indexError, indexStats) => {
      if (indexError || !indexStats.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      sendHtml(response, indexPath, requestUrl);
    });
  });
});

server.listen(port, () => {
  console.log(`Shivara Luxe is running on port ${port}`);
});
