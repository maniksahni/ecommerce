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
          <img class="stable-card__image stable-card__image--primary" src="/${escapeHtml(primary)}" alt="${escapeHtml(product.imageAlt)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" itemprop="image" />
          ${secondary ? `<img class="stable-card__image stable-card__image--secondary" src="/${escapeHtml(secondary)}" alt="" width="640" height="800" loading="lazy" decoding="async" />` : ""}
        </a>
        ${badge ? `<span class="stable-card__badge">${escapeHtml(badge)}</span>` : ""}
        <button class="stable-card__wish ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="${isWishlisted ? "Remove" : "Save"} ${escapeHtml(product.title)}" aria-pressed="${isWishlisted}">♡</button>
        <button class="stable-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}">Quick View</button>
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
    return `<div data-shared-product-page="${escapeHtml(product.id)}">
      <nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><a href="/collections/${escapeHtml(product.category)}">${escapeHtml(category)}</a><span>/</span><span>${escapeHtml(product.title)}</span></nav>
      <article class="stable-pdp" itemscope itemtype="https://schema.org/Product">
        <div class="stable-pdp__media"><div class="stable-pdp__thumbs">${product.images.map((image, index) => `<button type="button" data-pdp-thumb="${index}" class="${index === 0 ? "is-active" : ""}"><img src="/${escapeHtml(image)}" alt="" /></button>`).join("")}</div><div class="stable-pdp__gallery" id="pdp-gallery">${product.images.map((image, index) => `<img src="/${escapeHtml(image)}" alt="${index === 0 ? escapeHtml(product.imageAlt) : `${escapeHtml(product.title)} detail ${index + 1}`}" itemprop="${index === 0 ? "image" : ""}" />`).join("")}</div></div>
        <div class="stable-pdp__info"><p>${escapeHtml(category)}</p><h1 itemprop="name">${escapeHtml(product.title)}</h1><small>SKU: ${escapeHtml(product.sku)}</small>${priceMarkup(api, product, "stable-pdp__price")}${product.offerText ? `<p class="stable-offer">${escapeHtml(product.offerText)}</p>` : ""}<p itemprop="description">${escapeHtml(product.description)}</p>${variantMarkup}
        ${mode === "direct" || mode === "variant" ? '<div class="stable-pdp__qty"><span>Quantity</span><div class="stable-qty"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-qty">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></div>' : ""}
        <div class="stable-pdp__actions">${commerceAction}<a class="stable-button stable-button--whatsapp" id="pdp-whatsapp" href="${escapeHtml(whatsapp)}" target="_blank" rel="noreferrer">${value.confirmed ? "Order on WhatsApp" : "Confirm Price on WhatsApp"}</a><button class="stable-button stable-button--plain ${isWishlisted ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-pressed="${isWishlisted}">♡ Wishlist</button><button class="stable-share" type="button" data-share>Share</button></div>
        <div class="stable-accordions"><details open><summary>Product Details</summary><p>${escapeHtml(product.description)}</p><p>Category: ${escapeHtml(category)}.</p></details><details><summary>Shipping and Exchange</summary><p>PAN India delivery, shipping charges, timelines and exchange eligibility are confirmed before payment on WhatsApp.</p></details></div></div>
      </article>
      <section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOU MAY ALSO LIKE</p><h2>Related products</h2></div></div><div class="commerce-product-grid">${related.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>
      ${recent.length ? `<section class="stable-products stable-products--pdp" data-recently-viewed><div class="stable-section-heading"><div><p>YOUR TRAIL</p><h2>Recently viewed</h2></div></div><div class="commerce-product-grid">${recent.map((item, index) => renderProductCard(api, item, { ...cardOptions, index })).join("")}</div></section>` : ""}
      <div class="stable-mobile-buy">${priceMarkup(api, product, "stable-mobile-buy__price")}${commerceAction || `<a class="stable-button stable-button--whatsapp" id="pdp-mobile-whatsapp" href="${escapeHtml(whatsapp)}" target="_blank" rel="noreferrer">Enquire</a>`}</div>
    </div>`;
  }

  return Object.freeze({ renderProductCard, renderProductPage, priceMarkup, productUrl, categoryLabels, allowedBadges: [...allowedBadges] });
});
