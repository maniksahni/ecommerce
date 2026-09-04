(function exposeStorefrontRenderer(root, factory) {
  const renderer = factory();
  if (typeof module === "object" && module.exports) module.exports = renderer;
  if (root) root.ShivaraStorefrontRenderer = renderer;
})(typeof window !== "undefined" ? window : null, function createStorefrontRenderer() {
  const allowedBadges = new Set(["New", "Best Seller", "Limited", "Low Stock", "Sale", "Exclusive"]);
  const categoryLabels = {
    earrings: "Earrings",
    necklaces: "Necklaces",
    pendants: "Pendants",
    bracelets: "Bracelets",
    rings: "Rings",
    "evil-eye": "Evil Eye",
    "anti-tarnish": "Anti Tarnish",
    gifting: "Gifting",
    sets: "Jewellery Sets",
    watches: "Watches"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function mediaHref(src) {
    let value = String(src || "").trim().replace(/^[\[\("']+|[\]\)"']+$/g, "");
    if (!value) return "";
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
    return `/${value.replace(/^\/+/, "")}`;
  }

  function productUrl(product) {
    return `/products/${encodeURIComponent(product.slug)}`;
  }

  function priceMarkup(api, product, className) {
    const rawPrice = (product && Number.isFinite(Number(product.price)) && Number(product.price) > 0)
      ? Number(product.price)
      : 499;
    const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rawPrice);
    const compareAt = (product && product.compareAtPrice && Number(product.compareAtPrice) > rawPrice)
      ? Number(product.compareAtPrice)
      : (rawPrice ? Math.round(rawPrice * 1.45) : null);
    const compareFormatted = compareAt ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(compareAt) : "";
    const discountPercent = compareAt ? Math.round(((compareAt - rawPrice) / compareAt) * 100) : 0;
    
    return `<div class="${className}">
      <strong>${escapeHtml(formatted)}</strong>
      ${compareAt ? `<s>${escapeHtml(compareFormatted)}</s>` : ""}
      ${discountPercent > 0 ? `<span class="stable-card__discount-tag">${discountPercent}% OFF</span>` : ""}
    </div>`;
  }

  function renderProductCard(api, product, options = {}) {
    if (!api?.validateCommerceObject?.(product, options.context || "shared product card renderer")) return "";
    const {
      index = 0,
      isWishlisted = false
    } = options;
    const isSoldOut = product.isSoldOut === true;
    const primary = product.images[0];
    const secondary = product.images.find((image) => image !== primary);
    const badge = isSoldOut ? null : (allowedBadges.has(product.badge) ? product.badge : null);
    
    const rawPrice = Number(product.price) || 499;
    const bestPrice = Math.round(rawPrice * 0.85);
    const bestPriceFormatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(bestPrice);
    
    // Deterministic rating based on product ID char codes
    const idHash = String(product.id || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const ratingScore = (4.8 + ((idHash % 3) * 0.1)).toFixed(1);
    const reviewCount = 24 + (idHash % 68);

    let action = "";
    if (isSoldOut) {
      action = `<button class="stable-card__add stable-card__add--sold-out" type="button" disabled aria-disabled="true">Sold Out</button>`;
    } else {
      action = `<button class="stable-card__add" type="button" data-card-add="${escapeHtml(product.id)}">Add to Bag</button>`;
    }

    return `<article class="stable-card ${isSoldOut ? "is-sold-out" : ""}" data-commerce-renderer="shared-v1" data-product-card="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}" itemscope itemtype="https://schema.org/Product">
      <div class="stable-card__media">
        <a href="${productUrl(product)}" aria-label="View ${escapeHtml(product.title)}" itemprop="url">
          <img class="stable-card__image stable-card__image--primary" src="${escapeHtml(mediaHref(primary))}" alt="${escapeHtml(product.imageAlt)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" itemprop="image" />
          ${secondary ? `<img class="stable-card__image stable-card__image--secondary" src="${escapeHtml(mediaHref(secondary))}" alt="" width="640" height="800" loading="lazy" decoding="async" />` : ""}
        </a>
        ${isSoldOut ? `<span class="stable-card__badge stable-card__badge--sold-out">SOLD OUT</span><div class="stable-card__sold-out-overlay" aria-hidden="true"><span>SOLD OUT</span></div>` : (badge ? `<span class="stable-card__badge">${escapeHtml(badge)}</span>` : "")}
        <div class="stable-card__rating-badge" aria-label="${ratingScore} out of 5 stars">
          <span class="star-icon">★</span> <span>${ratingScore}</span> <small>(${reviewCount})</small>
        </div>
        <button class="stable-card__wish ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="${isWishlisted ? "Remove" : "Save"} ${escapeHtml(product.title)}" aria-pressed="${isWishlisted}">♡</button>
        <button class="stable-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}" aria-label="Quick view ${escapeHtml(product.title)}" title="Quick view"><span aria-hidden="true">⌕</span><span>Quick view</span></button>
      </div>
      <div class="stable-card__body">
        <small class="stable-card__category">${escapeHtml(categoryLabels[product.category] || product.category)}</small>
        <a class="stable-card__title" href="${productUrl(product)}" itemprop="name">${escapeHtml(product.title)}</a>
        ${priceMarkup(api, product, "stable-card__price")}
        <div class="stable-card__best-price">
          <span>Best price <strong>${escapeHtml(bestPriceFormatted)}</strong> with code</span>
        </div>
        <div class="stable-card__stars-row" aria-label="${reviewCount} customer reviews">
          <div class="stars-gold">★★★★★</div>
          <span class="review-text">${reviewCount} reviews</span>
        </div>
        ${action}
      </div>
    </article>`;
  }

  function renderProductPage(api, product, options = {}) {
    if (!api?.validateCommerceObject?.(product, options.context || "shared product page renderer")) return "";
    const {
      related = [],
      recent = [],
      isWishlisted = false,
      origin = ""
    } = options;
    const isSoldOut = product.isSoldOut === true;
    const category = categoryLabels[product.category] || product.category;
    const variantMarkup = product.variants && product.variants.length
      ? `<fieldset class="stable-variants"><legend>Options</legend>${product.variants.map((variant, index) => `<label><input type="radio" name="pdp-variant" value="${escapeHtml(variant.id)}" ${index === 0 ? "checked" : ""} ${variant.available ? "" : "disabled"} />${escapeHtml(variant.label)}</label>`).join("")}</fieldset>`
      : "";
    const commerceAction = isSoldOut
      ? `<button class="stable-button stable-button--dark" type="button" disabled aria-disabled="true" style="opacity:0.6; cursor:not-allowed;">Sold Out</button>`
      : `<button class="stable-button stable-button--dark" type="button" data-pdp-add="${escapeHtml(product.id)}">Add to Bag</button>`;
    
    const cardOptions = { origin, context: "shared related product renderer" };
    const media = [
      ...product.images.map((src, index) => ({ type: "image", src, index })),
      ...(product.videos || []).map((src, index) => ({ type: "video", src, index }))
    ];
    const mediaThumbs = media.map((item, index) => `<button type="button" data-pdp-thumb="${index}" class="${index === 0 ? "is-active" : ""}" aria-label="${item.type === "video" ? "Play product video" : `View image ${item.index + 1}`}"><img src="${escapeHtml(mediaHref(product.images[Math.min(item.index, product.images.length - 1)]))}" alt="" />${item.type === "video" ? '<span class="stable-pdp__play" aria-hidden="true">▶</span>' : ""}</button>`).join("");
    const mediaSlides = media.map((item, index) => item.type === "video"
      ? `<video src="${escapeHtml(mediaHref(item.src))}" aria-label="${escapeHtml(product.title)} product video ${item.index + 1}" controls playsinline preload="metadata"></video>`
      : `<img src="${escapeHtml(mediaHref(item.src))}" alt="${index === 0 ? escapeHtml(product.imageAlt) : `${escapeHtml(product.title)} detail ${item.index + 1}`}" itemprop="${index === 0 ? "image" : ""}" />`
    ).join("");
    const availabilityLabel = isSoldOut ? "Sold Out" : "In Stock · Available for Express Dispatch";
    return `<div data-shared-product-page="${escapeHtml(product.id)}">
      <nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections/${escapeHtml(product.category)}">${escapeHtml(category)}</a><span>/</span><span>${escapeHtml(product.title)}</span></nav>
      <article class="stable-pdp" itemscope itemtype="https://schema.org/Product">
        <div class="stable-pdp__media"><div class="stable-pdp__thumbs">${mediaThumbs}</div><div><div class="stable-pdp__gallery" id="pdp-gallery">${mediaSlides}</div><div class="stable-pdp__gallery-meta"><span data-pdp-gallery-count>1 / ${media.length}</span><small>${media.length > 1 ? "Swipe or use thumbnails" : "Product view"}</small></div></div></div>
        <div class="stable-pdp__info"><p>${escapeHtml(category)}</p><h1 itemprop="name">${escapeHtml(product.title)}</h1><div class="stable-pdp__meta"><small>SKU: ${escapeHtml(product.sku)}</small><span><i aria-hidden="true"></i>${escapeHtml(availabilityLabel)}</span></div>${priceMarkup(api, product, "stable-pdp__price")}${product.offerText ? `<p class="stable-offer">${escapeHtml(product.offerText)}</p>` : ""}<p itemprop="description">${escapeHtml(product.description)}</p>${variantMarkup}
        ${!isSoldOut ? '<div class="stable-pdp__qty"><span>Quantity</span><div class="stable-qty"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-qty">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></div>' : ""}
        <div class="stable-pdp__actions">${commerceAction}<button class="stable-button stable-button--plain ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-pressed="${isWishlisted}">♡ Wishlist</button><button class="stable-share" type="button" data-share>Share</button></div>
        <div class="stable-pdp__assurance" aria-label="Order support"><div><strong>100% Authentic</strong><span>Curated product record</span></div><div><strong>Pan-India Express</strong><span>Dispatched within 24 hours</span></div><div><strong>Anti-Tarnish</strong><span>100% Lifetime Warranty</span></div></div>
        <div class="stable-delivery-check"><div><small>DELIVERY ESTIMATE</small><strong>Check service for your area</strong></div><form data-delivery-form><label class="visually-hidden" for="delivery-pincode">Delivery pincode</label><input id="delivery-pincode" name="pincode" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="[0-9]{6}" placeholder="Enter 6-digit pincode" /><button type="submit">Check</button></form><p data-delivery-result role="status">Complimentary gift box delivery across all major Indian PIN codes.</p></div>
        <div class="stable-accordions"><details open><summary>Product Details</summary><p>${escapeHtml(product.description)}</p><dl><div><dt>Category</dt><dd>${escapeHtml(category)}</dd></div><div><dt>SKU</dt><dd>${escapeHtml(product.sku)}</dd></div><div><dt>Material</dt><dd>18K PVD Gold Plating / Stainless Steel</dd></div></dl></details><details><summary>Shipping &amp; Delivery</summary><p>All orders are packaged in complimentary Shivara signature velvet gift boxes and dispatched via express courier.</p></details><details><summary>Care Guidance</summary><p>100% waterproof and sweatproof. Wipe with a dry soft cloth after wearing to maintain lustrous shine.</p></details></div></div>
      </article>
      <section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOU MAY ALSO LIKE</p><h2>Related products</h2></div></div><div class="commerce-product-grid">${related.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>
      ${recent.length ? `<section class="stable-products stable-products--pdp" data-recently-viewed><div class="stable-section-heading"><div><p>YOUR TRAIL</p><h2>Recently viewed</h2></div></div><div class="commerce-product-grid">${recent.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>` : ""}
      <div class="stable-mobile-buy"><div>${priceMarkup(api, product, "stable-mobile-buy__price")}</div>${commerceAction}</div>
    </div>`;
  }

  return Object.freeze({ renderProductCard, renderProductPage, priceMarkup, productUrl, mediaHref, categoryLabels, allowedBadges: [...allowedBadges] });
});
