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
    const value = String(src || "");
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
    return `/${value.replace(/^\/+/, "")}`;
  }

  function productUrl(product) {
    return `/products/${encodeURIComponent(product.slug)}`;
  }

  function priceMarkup(api, product, className) {
    const value = api.formatPrice(product);
    if (!value.confirmed) return `<div class="${className} price-enquiry"><strong>Price on request</strong></div>`;
    return `<div class="${className}"><strong>${escapeHtml(value.label)}</strong>${value.compareAt ? `<s>${escapeHtml(new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value.compareAt))}</s><span>${value.discount}% off</span>` : ""}</div>`;
  }

  function enquiryHref(product, origin, whatsappNumber) {
    const value = product.priceStatus === "confirmed"
      ? `Confirmed price: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price)}`
      : "Price: To be confirmed";
    const message = [
      `Hi Shivara, I would like to enquire about ${product.title}.`,
      `SKU: ${product.sku}`,
      `Product: ${String(origin || "").replace(/\/$/, "")}${productUrl(product)}`,
      value,
      "Please confirm availability, options, final payable amount and delivery."
    ].join("\n");
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function renderProductCard(api, product, options = {}) {
    if (!api?.validateCommerceObject?.(product, options.context || "shared product card renderer")) return "";
    const {
      index = 0,
      isWishlisted = false,
      origin = "",
      whatsappNumber = "919457041215"
    } = options;
    const primary = product.images[0];
    const secondary = product.images.find((image) => image !== primary);
    const badge = allowedBadges.has(product.badge) ? product.badge : null;
    const mode = api.getPurchaseMode(product);
    let action = "";
    if (mode === "direct") {
      action = `<button class="stable-card__add" type="button" data-card-add="${escapeHtml(product.id)}">Add to Bag</button>`;
    } else if (mode === "variant") {
      action = `<button class="stable-card__add stable-card__add--enquire" type="button" data-quick-view="${escapeHtml(product.id)}">Choose Options</button>`;
    } else if (mode === "enquiry") {
      action = `<a class="stable-card__add stable-card__add--enquire" href="${escapeHtml(enquiryHref(product, origin, whatsappNumber))}" target="_blank" rel="noreferrer">Enquire on WhatsApp</a>`;
    }
    return `<article class="stable-card" data-commerce-renderer="shared-v1" data-product-card="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}" itemscope itemtype="https://schema.org/Product">
      <div class="stable-card__media">
        <a href="${productUrl(product)}" aria-label="View ${escapeHtml(product.title)}" itemprop="url">
          <img class="stable-card__image stable-card__image--primary" src="${escapeHtml(mediaHref(primary))}" alt="${escapeHtml(product.imageAlt)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" itemprop="image" />
          ${secondary ? `<img class="stable-card__image stable-card__image--secondary" src="${escapeHtml(mediaHref(secondary))}" alt="" width="640" height="800" loading="lazy" decoding="async" />` : ""}
        </a>
        ${badge ? `<span class="stable-card__badge">${escapeHtml(badge)}</span>` : ""}
        <button class="stable-card__wish ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="${isWishlisted ? "Remove" : "Save"} ${escapeHtml(product.title)}" aria-pressed="${isWishlisted}">♡</button>
        <button class="stable-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}" aria-label="Quick view ${escapeHtml(product.title)}" title="Quick view"><span aria-hidden="true">⌕</span><span>Quick view</span></button>
      </div>
      <div class="stable-card__body">
        <small class="stable-card__category">${escapeHtml(categoryLabels[product.category] || product.category)}</small>
        <a class="stable-card__title" href="${productUrl(product)}" itemprop="name">${escapeHtml(product.title)}</a>
        ${priceMarkup(api, product, "stable-card__price")}
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
      origin = "",
      whatsappNumber = "919457041215"
    } = options;
    const mode = api.getPurchaseMode(product);
    const value = api.formatPrice(product);
    const category = categoryLabels[product.category] || product.category;
    const variantMarkup = product.variants.length
      ? `<fieldset class="stable-variants"><legend>Options</legend>${product.variants.map((variant, index) => `<label><input type="radio" name="pdp-variant" value="${escapeHtml(variant.id)}" ${index === 0 ? "checked" : ""} ${variant.available ? "" : "disabled"} />${escapeHtml(variant.label)}</label>`).join("")}</fieldset>`
      : product.optionsStatus === "confirm" ? '<div class="stable-notice">Product options have not been verified. Shivara will confirm available options on WhatsApp.</div>' : "";
    const commerceAction = mode === "direct" || mode === "variant"
      ? `<button class="stable-button stable-button--dark" type="button" data-pdp-add="${escapeHtml(product.id)}">Add to Bag</button>`
      : "";
    const whatsapp = enquiryHref(product, origin, whatsappNumber);
    const cardOptions = { origin, whatsappNumber, context: "shared related product renderer" };
    const media = [
      ...product.images.map((src, index) => ({ type: "image", src, index })),
      ...(product.videos || []).map((src, index) => ({ type: "video", src, index }))
    ];
    const mediaThumbs = media.map((item, index) => `<button type="button" data-pdp-thumb="${index}" class="${index === 0 ? "is-active" : ""}" aria-label="${item.type === "video" ? "Play product video" : `View image ${item.index + 1}`}"><img src="${escapeHtml(mediaHref(product.images[Math.min(item.index, product.images.length - 1)]))}" alt="" />${item.type === "video" ? '<span class="stable-pdp__play" aria-hidden="true">▶</span>' : ""}</button>`).join("");
    const mediaSlides = media.map((item, index) => item.type === "video"
      ? `<video src="${escapeHtml(mediaHref(item.src))}" aria-label="${escapeHtml(product.title)} product video ${item.index + 1}" controls playsinline preload="metadata"></video>`
      : `<img src="${escapeHtml(mediaHref(item.src))}" alt="${index === 0 ? escapeHtml(product.imageAlt) : `${escapeHtml(product.title)} detail ${item.index + 1}`}" itemprop="${index === 0 ? "image" : ""}" />`
    ).join("");
    const availabilityLabel = product.priceStatus === "unavailable"
      ? "Currently unavailable"
      : value.confirmed ? "Available to order" : "Availability on request";
    return `<div data-shared-product-page="${escapeHtml(product.id)}">
      <nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections/${escapeHtml(product.category)}">${escapeHtml(category)}</a><span>/</span><span>${escapeHtml(product.title)}</span></nav>
      <article class="stable-pdp" itemscope itemtype="https://schema.org/Product">
        <div class="stable-pdp__media"><div class="stable-pdp__thumbs">${mediaThumbs}</div><div><div class="stable-pdp__gallery" id="pdp-gallery">${mediaSlides}</div><div class="stable-pdp__gallery-meta"><span data-pdp-gallery-count>1 / ${media.length}</span><small>${media.length > 1 ? "Swipe or use thumbnails" : "Product view"}</small></div></div></div>
        <div class="stable-pdp__info"><p>${escapeHtml(category)}</p><h1 itemprop="name">${escapeHtml(product.title)}</h1><div class="stable-pdp__meta"><small>SKU: ${escapeHtml(product.sku)}</small><span><i aria-hidden="true"></i>${escapeHtml(availabilityLabel)}</span></div>${priceMarkup(api, product, "stable-pdp__price")}${product.offerText ? `<p class="stable-offer">${escapeHtml(product.offerText)}</p>` : ""}<p itemprop="description">${escapeHtml(product.description)}</p>${variantMarkup}
        ${mode === "direct" || mode === "variant" ? '<div class="stable-pdp__qty"><span>Quantity</span><div class="stable-qty"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-qty">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></div>' : ""}
        <div class="stable-pdp__actions">${commerceAction}<a class="stable-button stable-button--whatsapp" id="pdp-whatsapp" href="${escapeHtml(whatsapp)}" target="_blank" rel="noreferrer">${value.confirmed ? "Order on WhatsApp" : "Confirm Price on WhatsApp"}</a><button class="stable-button stable-button--plain ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-pressed="${isWishlisted}">♡ Wishlist</button><button class="stable-share" type="button" data-share>Share</button></div>
        <div class="stable-pdp__assurance" aria-label="Order support"><div><strong>Catalogue verified</strong><span>Curated product record</span></div><div><strong>Personal assistance</strong><span>Human confirmation on WhatsApp</span></div><div><strong>PAN India</strong><span>Delivery details confirmed before payment</span></div></div>
        <div class="stable-delivery-check"><div><small>DELIVERY ASSISTANCE</small><strong>Check service for your area</strong></div><form data-delivery-form><label class="visually-hidden" for="delivery-pincode">Delivery pincode</label><input id="delivery-pincode" name="pincode" inputmode="numeric" autocomplete="postal-code" maxlength="6" pattern="[0-9]{6}" placeholder="Enter 6-digit pincode" /><button type="submit">Check</button></form><p data-delivery-result role="status">Exact timeline and charges are confirmed personally before payment.</p></div>
        <div class="stable-accordions"><details open><summary>Product Details</summary><p>${escapeHtml(product.description)}</p><dl><div><dt>Category</dt><dd>${escapeHtml(category)}</dd></div><div><dt>SKU</dt><dd>${escapeHtml(product.sku)}</dd></div><div><dt>Price status</dt><dd>${value.confirmed ? "Confirmed" : "Confirm on WhatsApp"}</dd></div></dl></details><details><summary>Shipping and Exchange</summary><p>PAN India delivery, shipping charges, timelines and exchange eligibility are confirmed before payment on WhatsApp.</p></details><details><summary>Care Guidance</summary><p>Care can vary by product. Ask Shivara for the exact storage and cleaning guidance for this piece before purchase.</p></details></div></div>
      </article>
      <section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOU MAY ALSO LIKE</p><h2>Related products</h2></div></div><div class="commerce-product-grid">${related.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>
      ${recent.length ? `<section class="stable-products stable-products--pdp" data-recently-viewed><div class="stable-section-heading"><div><p>YOUR TRAIL</p><h2>Recently viewed</h2></div></div><div class="commerce-product-grid">${recent.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>` : ""}
      <div class="stable-mobile-buy"><div>${priceMarkup(api, product, "stable-mobile-buy__price")}<small>${value.confirmed ? "Price confirmed" : "Final price on WhatsApp"}</small></div>${commerceAction || `<a class="stable-button stable-button--whatsapp" id="pdp-mobile-whatsapp" href="${escapeHtml(whatsapp)}" target="_blank" rel="noreferrer">Enquire</a>`}</div>
    </div>`;
  }

  return Object.freeze({ renderProductCard, renderProductPage, priceMarkup, productUrl, mediaHref, categoryLabels, allowedBadges: [...allowedBadges] });
});
