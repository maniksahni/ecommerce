(() => {
  "use strict";

  const catalogApi = window.ShivaraCatalog;
  if (!catalogApi) {
    console.error("[Shivara] Curated catalogue failed to load. Commerce has been disabled.");
    document.querySelector("#main")?.insertAdjacentHTML("afterbegin", '<div class="stable-shop-unavailable" role="alert"><strong>The Shivara shop is temporarily unavailable.</strong><span>Please contact us on WhatsApp for assistance.</span></div>');
    document.querySelectorAll("[data-card-add], [data-pdp-add], [data-quick-add]").forEach((control) => {
      control.disabled = true;
    });
    document.documentElement.classList.add("catalogue-unavailable");
    return;
  }
  const products = catalogApi.getAllProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const whatsappNumber = "919457041215";
  const storageKeys = { cart: "shivara-cart-v2", wishlist: "shivara-wishlist-v2", recent: "shivara-recent-v2" };
  const allowedBadges = new Set(["New", "Best Seller", "Limited", "Low Stock", "Sale", "Exclusive"]);
  const categoryMeta = {
    all: { title: "All products", kicker: "THE COMPLETE CATALOGUE", description: "Every Shivara product that has been manually reviewed for catalogue accuracy." },
    earrings: { title: "Earrings", kicker: "THE FINAL TOUCH", description: "Curated Shivara earrings with transparent pricing and availability states." },
    necklaces: { title: "Necklaces", kicker: "THE NECKLINE EDIT", description: "Shivara necklaces selected from explicitly identified product posts." },
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
  const categoryRail = [
    ["New Arrivals", "new-arrivals", "halo-gift-ring"],
    ["Anti Tarnish", "anti-tarnish", "boxed-evil-eye-bracelet"],
    ["Earrings", "earrings", "butterfly-earring-edit"],
    ["Neck Wear", "necklaces", "butterfly-drop-necklace"],
    ["Bracelets", "bracelets", "geometric-boxed-bracelet"],
    ["Rings", "rings", "floral-statement-ring"],
    ["Evil Eye", "evil-eye", "blue-charm-evil-eye-bracelet"],
    ["Gifts", "gifting", "cluster-gift-ring"],
    ["Watches", "watches", "snake-chain-watch"]
  ];
  const heroIds = ["boxed-evil-eye-bracelet", "floral-statement-ring", "tulip-pendant"];
  const announcements = [
    "Curated Shivara products only",
    "PAN India delivery confirmed on WhatsApp",
    "Personal shopping: +91 94570 41215"
  ];

  let cart = normalizeCart(readStorage(storageKeys.cart, []));
  const wishlist = new Set(readStorage(storageKeys.wishlist, []).filter((id) => productMap.has(id)));
  let recent = readStorage(storageKeys.recent, []).filter((id) => productMap.has(id)).slice(0, 8);
  let activeLayer = null;
  let lastFocus = null;
  let quickState = { product: null, quantity: 1, image: 0 };
  let heroIndex = 0;
  let signatureIndex = 0;
  let announcementIndex = 0;
  let searchTimer = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function readStorage(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "Price on request";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  }

  function pricing(product) {
    return catalogApi.formatPrice(product);
  }

  function productUrl(product) {
    return `/products/${encodeURIComponent(product.slug)}`;
  }

  function collectionUrl(slug) {
    return `/collections/${slug}`;
  }

  function productsForCollection(slug) {
    return catalogApi.getCollection(slug);
  }

  function validVariant(product, variantId) {
    if (!variantId) return null;
    return product.variants.find((variant) => variant.id === variantId && variant.available) || null;
  }

  function canAddDirectly(product) {
    return catalogApi.getPurchaseMode(product) === "direct";
  }

  function normalizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry) => {
      if (!entry || !productMap.has(entry.id)) return [];
      const product = productMap.get(entry.id);
      if (product.priceStatus === "unavailable") return [];
      const variant = validVariant(product, entry.variantId);
      if (product.variants.length && !variant) return [];
      if (!product.variants.length && entry.variantId) return [];
      return [{ id: product.id, variantId: variant?.id || null, qty: Math.max(1, Math.floor(Number(entry.qty) || 1)) }];
    });
  }

  function priceMarkup(product, className = "") {
    const value = pricing(product);
    if (!value.confirmed) return `<div class="${className} price-enquiry"><strong>Confirm price on WhatsApp</strong></div>`;
    return `<div class="${className}"><strong>${formatMoney(value.price)}</strong>${value.compareAt ? `<s>${formatMoney(value.compareAt)}</s><span>${value.discount}% off</span>` : ""}</div>`;
  }

  function productCard(product, index = 0) {
    if (!catalogApi.validateCommerceObject(product, "productCard")) return "";
    const saved = wishlist.has(product.id);
    const primary = product.images[0];
    const secondary = product.images.find((image) => image !== primary);
    const badge = allowedBadges.has(product.badge) ? product.badge : null;
    const action = canAddDirectly(product)
      ? `<button class="stable-card__add" type="button" data-card-add="${escapeHtml(product.id)}">Add to Bag</button>`
      : `<button class="stable-card__add stable-card__add--enquire" type="button" data-quick-view="${escapeHtml(product.id)}">Enquire</button>`;
    return `<article class="stable-card" data-product-card="${escapeHtml(product.id)}" data-category="${escapeHtml(product.category)}">
      <div class="stable-card__media">
        <a href="${productUrl(product)}" aria-label="View ${escapeHtml(product.title)}">
          <img class="stable-card__image stable-card__image--primary" src="/${escapeHtml(primary)}" alt="${escapeHtml(product.imageAlt)}" width="640" height="800" ${index < 5 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />
          ${secondary ? `<img class="stable-card__image stable-card__image--secondary" src="/${escapeHtml(secondary)}" alt="" width="640" height="800" loading="lazy" decoding="async" />` : ""}
        </a>
        ${badge ? `<span class="stable-card__badge">${escapeHtml(badge)}</span>` : ""}
        <button class="stable-card__wish ${saved ? "is-active" : ""}" type="button" data-wishlist-toggle="${escapeHtml(product.id)}" aria-label="${saved ? "Remove" : "Save"} ${escapeHtml(product.title)}" aria-pressed="${saved}">♡</button>
        <button class="stable-card__quick" type="button" data-quick-view="${escapeHtml(product.id)}">Quick View</button>
      </div>
      <div class="stable-card__body">
        <a class="stable-card__title" href="${productUrl(product)}">${escapeHtml(product.title)}</a>
        ${priceMarkup(product, "stable-card__price")}
        ${product.optionsStatus === "confirm" ? `<small class="stable-card__options">Options confirmed on WhatsApp</small>` : ""}
        ${action}
      </div>
    </article>`;
  }

  function renderGrid(mount, source) {
    if (!mount) return;
    mount.innerHTML = source.filter((product) => catalogApi.validateCommerceObject(product, "renderGrid")).map(productCard).join("");
  }

  function sharedHeader() {
    return `<div class="stable-announcement"><button type="button" data-announcement-prev aria-label="Previous announcement">←</button><span data-announcement-text>${announcements[0]}</span><button type="button" data-announcement-next aria-label="Next announcement">→</button></div>
      <header class="stable-header">
        <button class="stable-header__menu" type="button" data-menu-open aria-label="Open menu">☰</button>
        <a class="stable-logo" href="/" aria-label="Shivara home">SHIVARA<small>JEWELLERY ATELIER</small></a>
        <nav class="stable-nav" aria-label="Main navigation">
          <a href="/collections/new-arrivals">New Arrivals</a><a href="/collections/earrings">Earrings</a><a href="/collections/necklaces">Neck Wear</a><a href="/collections/bracelets">Bracelets</a><a href="/collections/rings">Rings</a><a href="/collections/evil-eye">Evil Eye</a>
        </nav>
        <div class="stable-header__actions">
          <button type="button" data-search-open aria-label="Search">⌕</button>
          <button class="stable-account" type="button" data-account aria-label="Account">Account</button>
          <a class="stable-wish-link" href="/wishlist" aria-label="Wishlist">♡<span data-wishlist-count>0</span></a>
          <button type="button" data-cart-open aria-label="Open bag">Bag <span data-cart-count>0</span></button>
        </div>
      </header>`;
  }

  function sharedFooter() {
    const footerProduct = productMap.get("tulip-pendant");
    return `<footer class="stable-footer phase-footer">
      <section class="phase-footer__finale"><div><p>THE LOOK IS NEVER FINISHED</p><h2>Until the<br />jewellery is.</h2><a class="stable-button stable-button--light" href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi Shivara, I would like help styling a jewellery look.")}" target="_blank" rel="noreferrer">Style with Shivara</a></div><figure aria-hidden="true"><span></span><img src="/${escapeHtml(footerProduct.images[0])}" alt="" /></figure><strong aria-hidden="true">SHIVARA</strong></section>
      <div class="phase-footer__links"><div><a class="stable-logo stable-logo--footer" href="/">SHIVARA<small>JEWELLERY ATELIER</small></a><p>A manually curated jewellery catalogue with personal ordering support from Bareilly.</p></div><div><strong>Shop</strong><a href="/collections/all">All Products</a><a href="/collections/new-arrivals">New Arrivals</a><a href="/collections/gifting">Gifting</a><a href="/wishlist">Wishlist</a></div><div><strong>Help</strong><a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noreferrer">WhatsApp Shivara</a><a href="https://www.instagram.com/shivara.luxe" target="_blank" rel="noreferrer">Instagram</a><span>PAN India delivery</span></div><div><strong>Policies</strong><a href="/policies/shipping">Shipping &amp; Exchange</a><a href="/policies/privacy">Privacy</a><a href="/policies/terms">Terms</a></div></div>
      <small>© ${new Date().getFullYear()} Shivara. Availability and unconfirmed prices are verified before purchase.</small>
    </footer>`;
  }

  function layerShell() {
    return `<div class="stable-backdrop" data-layer-close hidden></div>
      <aside class="stable-drawer stable-drawer--menu" id="menu-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" aria-hidden="true">
        <div class="stable-layer__head"><h2 id="menu-title">Shop Shivara</h2><button type="button" data-layer-close aria-label="Close menu">×</button></div>
        <nav>${categoryRail.map(([label, slug]) => `<a href="${collectionUrl(slug)}">${label}<span>→</span></a>`).join("")}<a href="/collections/all">All Products<span>→</span></a></nav>
      </aside>
      <aside class="stable-drawer stable-drawer--search" id="search-drawer" role="dialog" aria-modal="true" aria-labelledby="search-title" aria-hidden="true">
        <div class="stable-layer__head"><div><small>DISCOVER THE EDIT</small><h2 id="search-title">Search Shivara</h2></div><button type="button" data-layer-close aria-label="Close search">×</button></div>
        <label class="stable-search-box"><span class="visually-hidden">Search products</span><input id="stable-search" type="search" autocomplete="off" placeholder="Search rings, bracelets, pendants..." /><button type="button" data-search-clear aria-label="Clear search">×</button></label>
        <div class="stable-search-discovery" id="search-discovery"><div><span>Trending</span><button type="button" data-search-term="Rings">Rings</button><button type="button" data-search-term="Evil Eye">Evil Eye</button><button type="button" data-search-term="Gifting">Gifting</button></div><div><span>Shop by category</span><a href="/collections/earrings">Earrings</a><a href="/collections/necklaces">Neck Wear</a><a href="/collections/bracelets">Bracelets</a></div></div>
        <p class="stable-search-count" id="search-count" role="status" aria-live="polite"></p>
        <div class="stable-search-results" id="search-results"></div>
      </aside>
      <aside class="stable-drawer stable-drawer--cart" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true">
        <div class="stable-layer__head"><h2 id="cart-title">Your Bag <span data-cart-count>0</span></h2><button type="button" data-layer-close aria-label="Close bag">×</button></div>
        <div class="stable-cart-lines" id="cart-lines"></div><div class="stable-cart-footer" id="cart-footer"></div>
      </aside>
      <section class="stable-quick" id="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-title" aria-hidden="true"></section>
      <div class="stable-toast" id="stable-toast" role="status" aria-live="polite"></div>`;
  }

  function updateCounts() {
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => (node.textContent = String(cartCount)));
    document.querySelectorAll("[data-wishlist-count]").forEach((node) => (node.textContent = String(wishlist.size)));
  }

  function renderChrome() {
    const header = document.querySelector("#shared-header");
    const footer = document.querySelector("#shared-footer");
    if (header) header.innerHTML = sharedHeader();
    if (footer) footer.innerHTML = sharedFooter();
    document.body.insertAdjacentHTML("beforeend", layerShell());
    updateCounts();
  }

  function renderAnnouncement() {
    const node = document.querySelector("[data-announcement-text]");
    if (node) node.textContent = announcements[announcementIndex];
  }

  function openLayer(selector, trigger) {
    closeLayer(false);
    const layer = document.querySelector(selector);
    if (!layer) return;
    lastFocus = trigger || document.activeElement;
    activeLayer = layer;
    document.querySelector(".stable-backdrop").hidden = false;
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    document.body.classList.add("stable-modal-open");
    ["#main", "#shared-header", "#shared-footer"].forEach((region) => {
      const node = document.querySelector(region);
      if (node) node.inert = true;
    });
    document.dispatchEvent(new CustomEvent("shivara:modal-change", { detail: { open: true, id: layer.id } }));
    requestAnimationFrame(() => layer.querySelector("input, button, a")?.focus());
  }

  function closeLayer(restore = true) {
    if (!activeLayer) return;
    activeLayer.classList.remove("is-open");
    activeLayer.setAttribute("aria-hidden", "true");
    document.querySelector(".stable-backdrop").hidden = true;
    document.body.classList.remove("stable-modal-open");
    ["#main", "#shared-header", "#shared-footer"].forEach((region) => {
      const node = document.querySelector(region);
      if (node) node.inert = false;
    });
    document.dispatchEvent(new CustomEvent("shivara:modal-change", { detail: { open: false } }));
    activeLayer = null;
    if (restore) lastFocus?.focus?.();
  }

  function showToast(message, product = null) {
    const toast = document.querySelector("#stable-toast");
    if (!toast) return;
    toast.innerHTML = product ? `<img src="/${escapeHtml(product.images[0])}" alt="" /><span>${escapeHtml(message)}</span>` : `<span>${escapeHtml(message)}</span>`;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function saveWishlist() {
    saveStorage(storageKeys.wishlist, [...wishlist]);
    updateCounts();
  }

  function toggleWishlist(id) {
    if (!productMap.has(id)) return;
    if (wishlist.has(id)) wishlist.delete(id);
    else wishlist.add(id);
    saveWishlist();
    document.querySelectorAll(`[data-wishlist-toggle="${CSS.escape(id)}"]`).forEach((button) => {
      button.classList.toggle("is-active", wishlist.has(id));
      button.setAttribute("aria-pressed", String(wishlist.has(id)));
    });
    renderWishlist();
    showToast(wishlist.has(id) ? "Saved to Your Shivara Edit." : "Removed from Your Edit.");
  }

  function addToCart(id, variantId = null, quantity = 1, allowEnquiryOptions = false) {
    const product = productMap.get(id);
    if (!product || product.priceStatus === "unavailable") return false;
    if (product.optionsStatus === "confirm" && !product.variants.length && !allowEnquiryOptions) {
      showToast("Please confirm options on WhatsApp");
      return false;
    }
    const variant = validVariant(product, variantId);
    if (product.variants.length && !variant) {
      showToast("Choose an available option");
      return false;
    }
    const normalizedVariant = variant?.id || null;
    const existing = cart.find((item) => item.id === id && item.variantId === normalizedVariant);
    if (existing) existing.qty += Math.max(1, Number(quantity) || 1);
    else cart.push({ id, variantId: normalizedVariant, qty: Math.max(1, Number(quantity) || 1) });
    saveStorage(storageKeys.cart, cart);
    renderCart();
    updateCounts();
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.classList.remove("is-confirming");
      requestAnimationFrame(() => badge.classList.add("is-confirming"));
    });
    showToast(`${product.title} added to bag`, product);
    return true;
  }

  function cartSummary() {
    return cart.reduce((summary, item) => {
      const product = productMap.get(item.id);
      const value = pricing(product);
      if (value.confirmed) summary.confirmedTotal += value.price * item.qty;
      else summary.enquiryCount += item.qty;
      return summary;
    }, { confirmedTotal: 0, enquiryCount: 0 });
  }

  function cartMessage() {
    const summary = cartSummary();
    const lines = ["Hi Shivara, I would like to enquire about these items:", ""];
    cart.forEach((item, index) => {
      const product = productMap.get(item.id);
      const variant = validVariant(product, item.variantId);
      const value = pricing(product);
      lines.push(`${index + 1}. ${product.title}`);
      lines.push(`SKU: ${product.sku}`);
      lines.push(`Product: ${location.origin}${productUrl(product)}`);
      if (variant) lines.push(`Option: ${variant.label}`);
      else if (product.optionsStatus === "confirm") lines.push("Options: To be confirmed");
      lines.push(`Quantity: ${item.qty}`);
      lines.push(value.confirmed ? `Price: ${formatMoney(value.price)} each` : "Price: To be confirmed");
      if (value.confirmed) lines.push(`Line total: ${formatMoney(value.price * item.qty)}`);
      lines.push("");
    });
    if (summary.confirmedTotal) lines.push(`Confirmed-price subtotal: ${formatMoney(summary.confirmedTotal)}`);
    if (summary.enquiryCount) lines.push(`${summary.enquiryCount} item(s) require price confirmation.`);
    lines.push("Please confirm availability, final payable total, delivery and payment details.");
    return lines.join("\n");
  }

  function renderCart() {
    const lines = document.querySelector("#cart-lines");
    const footer = document.querySelector("#cart-footer");
    if (!lines || !footer) return;
    if (!cart.length) {
      lines.innerHTML = `<div class="stable-empty"><h3>Your bag is empty</h3><p>Start with the curated catalogue.</p></div>`;
      footer.innerHTML = `<button class="stable-button stable-button--dark" type="button" data-layer-close>Continue Shopping</button>`;
      updateCounts();
      return;
    }
    const renderLine = (item) => {
      const product = productMap.get(item.id);
      const variant = validVariant(product, item.variantId);
      const value = pricing(product);
      return `<article class="stable-cart-line">
        <img src="/${escapeHtml(product.images[0])}" alt="${escapeHtml(product.imageAlt)}" />
        <div><a href="${productUrl(product)}">${escapeHtml(product.title)}</a><small>${escapeHtml(product.sku)}${variant ? ` · ${escapeHtml(variant.label)}` : product.optionsStatus === "confirm" ? " · Options to be confirmed" : ""}</small><span class="stable-cart-line__mode">${value.confirmed ? `Unit price ${formatMoney(value.price)}` : "Price confirmation needed"}</span><strong>${value.confirmed ? `Line total ${formatMoney(value.price * item.qty)}` : "To be confirmed"}</strong>
        <div class="stable-qty"><button type="button" data-cart-delta="-1" data-cart-id="${product.id}" data-variant-id="${variant?.id || ""}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-delta="1" data-cart-id="${product.id}" data-variant-id="${variant?.id || ""}" aria-label="Increase quantity">+</button></div>
        <div class="stable-cart-line__links"><button type="button" data-cart-wishlist="${product.id}" data-variant-id="${variant?.id || ""}">Move to Wishlist</button><button class="stable-remove" type="button" data-cart-remove="${product.id}" data-variant-id="${variant?.id || ""}">Remove</button></div></div>
      </article>`;
    };
    const confirmed = cart.filter((item) => pricing(productMap.get(item.id)).confirmed);
    const enquiries = cart.filter((item) => !pricing(productMap.get(item.id)).confirmed);
    lines.innerHTML = `${confirmed.length ? `<h3 class="stable-cart-group">Confirmed items</h3>${confirmed.map(renderLine).join("")}` : ""}${enquiries.length ? `<h3 class="stable-cart-group">Price confirmation needed</h3>${enquiries.map(renderLine).join("")}` : ""}`;
    const summary = cartSummary();
    const complement = catalogApi.getRelatedProducts(productMap.get(cart[0].id)).find((product) => !cart.some((item) => item.id === product.id));
    footer.innerHTML = `${complement ? `<article class="stable-cart-complement"><img src="/${escapeHtml(complement.images[0])}" alt="" /><div><small>COMPLETE THE EDIT</small><strong>${escapeHtml(complement.title)}</strong>${priceMarkup(complement, "stable-search-price")}</div><button type="button" data-quick-view="${complement.id}">View</button></article>` : ""}<div class="stable-cart-total"><span>Confirmed-price subtotal</span><strong>${formatMoney(summary.confirmedTotal)}</strong></div>${summary.enquiryCount ? `<p>${summary.enquiryCount} item(s) need price confirmation and are not included in the subtotal.</p>` : ""}<a class="stable-button stable-button--whatsapp" href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(cartMessage())}" target="_blank" rel="noreferrer">Continue on WhatsApp</a><button class="stable-button stable-button--plain" type="button" data-layer-close>Continue Shopping</button>`;
    updateCounts();
  }

  function renderQuick(product) {
    if (!product) return;
    quickState = { product, quantity: 1, image: 0 };
    const value = pricing(product);
    const addControl = canAddDirectly(product)
      ? `<button class="stable-button stable-button--dark" type="button" data-quick-add="${product.id}">Add to Bag</button>`
      : `<a class="stable-button stable-button--whatsapp" data-quick-whatsapp target="_blank" rel="noreferrer">Confirm on WhatsApp</a>`;
    const distinctImages = [...new Set(product.images)];
    const gallery = distinctImages.map((image, index) => `<figure class="${index === 0 ? "is-active" : ""}" data-quick-media="${index}"><img src="/${escapeHtml(image)}" alt="${index === 0 ? escapeHtml(product.imageAlt) : `${escapeHtml(product.title)} detail ${index + 1}`}" ${index ? "loading=\"lazy\"" : ""} /></figure>`).join("");
    const thumbs = distinctImages.length > 1 ? `<div class="stable-quick__thumbs">${distinctImages.map((image, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-quick-thumb="${index}" aria-label="View image ${index + 1}"><img src="/${escapeHtml(image)}" alt="" /></button>`).join("")}</div>` : "";
    const badge = allowedBadges.has(product.badge) ? `<span class="stable-quick__badge">${escapeHtml(product.badge)}</span>` : "";
    const modal = document.querySelector("#quick-view");
    modal.innerHTML = `<button class="stable-quick__close" type="button" data-layer-close aria-label="Close Quick View">×</button>
      <div class="stable-quick__stage"><div class="stable-quick__gallery">${gallery}</div>${thumbs}<span class="stable-quick__pagination">1 / ${distinctImages.length}</span></div>
      <div class="stable-quick__info">${badge}<p>${escapeHtml(categoryMeta[product.category]?.title || product.category)}</p><h2 id="quick-title">${escapeHtml(product.title)}</h2><small>SKU: ${escapeHtml(product.sku)}</small>${priceMarkup(product, "stable-quick__price")}<p>${escapeHtml(product.description)}</p>
      ${product.optionsStatus === "confirm" ? `<div class="stable-notice">Product options need confirmation. No unverified choices have been added.</div>` : ""}
      <div class="stable-qty"><button type="button" data-quick-qty="-1" aria-label="Decrease quantity">−</button><span id="quick-qty">1</span><button type="button" data-quick-qty="1" aria-label="Increase quantity">+</button></div>
      <div class="stable-quick__actions">${addControl}${value.confirmed ? '<a class="stable-button stable-button--whatsapp" data-quick-whatsapp target="_blank" rel="noreferrer">Order on WhatsApp</a>' : ""}<button class="stable-button stable-button--plain ${wishlist.has(product.id) ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}">♡ Save to Your Edit</button><a class="stable-button stable-button--plain" href="${productUrl(product)}">View Full Product</a></div><details><summary>Product details</summary><p>${escapeHtml(product.description)}</p></details></div>`;
    updateQuickWhatsapp();
  }

  function singleProductMessage(product, quantity = 1, variant = null) {
    const value = pricing(product);
    const lines = [`Hi Shivara, I would like to enquire about ${product.title}.`, `SKU: ${product.sku}`, `Product: ${location.origin}${productUrl(product)}`];
    if (variant) lines.push(`Option: ${variant.label}`);
    lines.push(`Quantity: ${quantity}`);
    if (value.confirmed) {
      lines.push(`Price: ${formatMoney(value.price)} each`);
      lines.push(`Line total: ${formatMoney(value.price * quantity)}`);
    } else {
      lines.push("Price: To be confirmed");
    }
    lines.push("Please confirm availability, options, final payable amount and delivery.");
    return lines.join("\n");
  }

  function updateQuickWhatsapp() {
    const link = document.querySelector("[data-quick-whatsapp]");
    if (!link || !quickState.product) return;
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(singleProductMessage(quickState.product, quickState.quantity))}`;
  }

  function openQuick(id, trigger) {
    const product = productMap.get(id);
    if (!product) return;
    const sourceImage = trigger?.closest?.("[data-product-card], .featured-product-card, section, article")?.querySelector?.("img");
    const transitionName = `shivara-product-${product.id}`;
    const reveal = () => {
      if (sourceImage) sourceImage.style.viewTransitionName = "";
      renderQuick(product);
      const targetImage = document.querySelector("#quick-view [data-quick-media='0'] img");
      if (targetImage) targetImage.style.viewTransitionName = transitionName;
      openLayer("#quick-view", trigger);
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches && sourceImage) {
      sourceImage.style.viewTransitionName = transitionName;
      document.startViewTransition(reveal).finished.finally(() => {
        const targetImage = document.querySelector("#quick-view [data-quick-media='0'] img");
        if (targetImage) targetImage.style.viewTransitionName = "";
      });
    } else reveal();
  }

  function renderSearch(query = "") {
    const mount = document.querySelector("#search-results");
    if (!mount) return;
    const term = query.trim().toLowerCase();
    const matches = (term ? catalogApi.search(term) : catalogApi.getFeaturedProducts(6)).slice(0, 12);
    document.querySelector("#search-count").textContent = `${matches.length} ${matches.length === 1 ? "piece" : "pieces"}${term ? ` for “${query.trim()}”` : " selected for you"}`;
    mount.innerHTML = matches.length ? matches.map((product, index) => `<article data-search-result="${index}"><a href="${productUrl(product)}"><img src="/${escapeHtml(product.images[0])}" alt="" /><span><small>${escapeHtml(categoryMeta[product.category]?.title || product.category)}</small><strong>${escapeHtml(product.title)}</strong>${priceMarkup(product, "stable-search-price")}</span></a><button type="button" data-quick-view="${product.id}">Quick View</button></article>`).join("") : `<div class="stable-empty"><p>No products match “${escapeHtml(query)}”.</p><a href="/collections/all">Browse the curated catalogue</a></div>`;
    document.querySelector("#search-discovery").hidden = Boolean(term);
  }

  function renderCategoryRail() {
    const mount = document.querySelector("#commerce-category-grid");
    if (!mount) return;
    mount.innerHTML = categoryRail.map(([label, slug, productId]) => {
      const product = productMap.get(productId);
      const count = productsForCollection(slug).length;
      return `<a href="${collectionUrl(slug)}"><span><img src="/${escapeHtml(product.images[0])}" alt="${escapeHtml(label)} collection" loading="lazy" /></span><strong>${escapeHtml(label)}</strong><small>${count} ${count === 1 ? "product" : "products"}</small></a>`;
    }).join("");
  }

  function renderHero(nextIndex = heroIndex) {
    const mount = document.querySelector("[data-hero]");
    if (!mount) return;
    heroIndex = (nextIndex + heroIds.length) % heroIds.length;
    const product = productMap.get(heroIds[heroIndex]);
    mount.querySelector("[data-hero-image]").src = `/${product.images[0]}`;
    mount.querySelector("[data-hero-image]").alt = product.imageAlt;
    mount.querySelector("[data-hero-title]").textContent = product.title;
    mount.querySelector("[data-hero-copy]").textContent = product.description;
    mount.querySelector("[data-hero-count]").textContent = `${heroIndex + 1} / ${heroIds.length}`;
    const productLink = mount.querySelector(".stable-hero__content .stable-button--light");
    productLink.href = productUrl(product);
    productLink.textContent = pricing(product).confirmed ? `Shop ${product.title}` : `View ${product.title}`;
  }

  function renderSignature(nextIndex = signatureIndex) {
    const mount = document.querySelector("#signature-product");
    if (!mount) return;
    const signatureProducts = catalogApi.getFeaturedProducts(12).filter((product) => pricing(product).confirmed).slice(0, 6);
    signatureIndex = (nextIndex + signatureProducts.length) % signatureProducts.length;
    const product = signatureProducts[signatureIndex];
    mount.innerHTML = `<a class="signature-edit__image" href="${productUrl(product)}"><img src="/${escapeHtml(product.images[0])}" alt="${escapeHtml(product.imageAlt)}" loading="lazy" /></a><div><small>${signatureIndex + 1} / ${signatureProducts.length} · ${escapeHtml(product.sku)}</small><h3>${escapeHtml(product.title)}</h3>${priceMarkup(product, "signature-edit__price")}<p>${escapeHtml(product.description)}</p><button class="stable-button stable-button--light" type="button" data-quick-view="${product.id}">Quick View</button></div>`;
  }

  function renderHome() {
    if (document.body.dataset.page !== "home") return;
    renderCategoryRail();
    renderGrid(document.querySelector('[data-product-section="new-arrivals"]'), productsForCollection("new-arrivals").slice(0, 10));
    renderGrid(document.querySelector('[data-product-section="all"]'), products.slice(0, 15));
    renderGrid(document.querySelector('[data-product-section="rings"]'), productsForCollection("rings").slice(0, 10));
    renderGrid(document.querySelector('[data-product-section="neck-wear"]'), productsForCollection("necklaces").slice(0, 10));
    renderHero();
    renderSignature();
  }

  function collectionSlug() {
    const slug = location.pathname.split("/").filter(Boolean)[1] || "all";
    return categoryMeta[slug] ? slug : "all";
  }

  function collectionState() {
    const params = new URLSearchParams(location.search);
    return { sort: params.get("sort") || "featured", price: params.get("price") || "all" };
  }

  function updateCollectionState(state) {
    const params = new URLSearchParams();
    if (state.sort !== "featured") params.set("sort", state.sort);
    if (state.price !== "all") params.set("price", state.price);
    history.pushState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
    renderCollection();
  }

  function renderCollection() {
    if (document.body.dataset.page !== "collection") return;
    const slug = collectionSlug();
    const meta = categoryMeta[slug];
    const state = collectionState();
    let selected = productsForCollection(slug);
    if (state.price === "confirmed") selected = selected.filter((product) => pricing(product).confirmed);
    if (state.price === "enquiry") selected = selected.filter((product) => !pricing(product).confirmed);
    if (state.sort === "newest") selected.sort((a, b) => b.sourceIndex - a.sourceIndex);
    if (state.sort === "price-low") selected.sort((a, b) => (pricing(a).price ?? Infinity) - (pricing(b).price ?? Infinity));
    if (state.sort === "price-high") selected.sort((a, b) => (pricing(b).price ?? -1) - (pricing(a).price ?? -1));
    if (state.sort === "title") selected.sort((a, b) => a.title.localeCompare(b.title));
    document.body.dataset.collection = slug;
    document.querySelector("[data-collection-kicker]").textContent = meta.kicker;
    document.querySelector("[data-collection-title]").textContent = meta.title;
    document.querySelector("[data-collection-description]").textContent = meta.description;
    document.querySelector("[data-collection-breadcrumb]").textContent = meta.title;
    document.querySelector("[data-collection-count]").textContent = `${selected.length} ${selected.length === 1 ? "product" : "products"}`;
    document.querySelector("#collection-sort").value = state.sort;
    document.querySelector("#collection-filters").innerHTML = `<fieldset><legend>Price status</legend>${[["all", "All products"], ["confirmed", "Confirmed price"], ["enquiry", "Price on request"]].map(([value, label]) => `<label><input type="radio" name="price-filter" value="${value}" ${state.price === value ? "checked" : ""} />${label}</label>`).join("")}</fieldset><nav><strong>Collections</strong>${Object.entries(categoryMeta).map(([key, item]) => `<a class="${key === slug ? "is-active" : ""}" href="${collectionUrl(key)}">${item.title}<span>${productsForCollection(key).length}</span></a>`).join("")}</nav>`;
    renderGrid(document.querySelector("#collection-grid"), selected);
    document.querySelector("#collection-grid").hidden = !selected.length;
    document.querySelector("#collection-empty").hidden = Boolean(selected.length);
  }

  function rememberProduct(id) {
    recent = [id, ...recent.filter((item) => item !== id)].slice(0, 8);
    saveStorage(storageKeys.recent, recent);
  }

  function renderProductPage() {
    if (document.body.dataset.page !== "product") return;
    const id = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
    const product = catalogApi.getProductBySlug(id) || catalogApi.getProductByLegacyId(id);
    const mount = document.querySelector("#product-page");
    if (!product) return;
    rememberProduct(product.id);
    const value = pricing(product);
    const related = catalogApi.getRelatedProducts(product, 5);
    const recentProducts = recent.filter((recentId) => recentId !== product.id).map((recentId) => productMap.get(recentId)).filter(Boolean).slice(0, 5);
    const variantMarkup = product.variants.length ? `<fieldset class="stable-variants"><legend>Options</legend>${product.variants.map((variant, index) => `<label><input type="radio" name="pdp-variant" value="${escapeHtml(variant.id)}" ${index === 0 ? "checked" : ""} ${variant.available ? "" : "disabled"} />${escapeHtml(variant.label)}</label>`).join("")}</fieldset>` : product.optionsStatus === "confirm" ? `<div class="stable-notice">Options have not been verified for this product. Shivara will confirm them on WhatsApp.</div>` : "";
    const commerceAction = canAddDirectly(product) || product.variants.length
      ? `<button class="stable-button stable-button--dark" type="button" data-pdp-add="${product.id}">Add to Bag</button>`
      : "";
    mount.innerHTML = `<nav class="stable-breadcrumb"><a href="/">Home</a><span>/</span><a href="${collectionUrl(product.category)}">${escapeHtml(categoryMeta[product.category]?.title || product.category)}</a><span>/</span><span>${escapeHtml(product.title)}</span></nav>
      <article class="stable-pdp">
        <div class="stable-pdp__media"><div class="stable-pdp__thumbs">${product.images.map((image, index) => `<button type="button" data-pdp-thumb="${index}" class="${index === 0 ? "is-active" : ""}"><img src="/${escapeHtml(image)}" alt="" /></button>`).join("")}</div><div class="stable-pdp__gallery" id="pdp-gallery">${product.images.map((image, index) => `<img src="/${escapeHtml(image)}" alt="${index === 0 ? escapeHtml(product.imageAlt) : ""}" />`).join("")}</div></div>
        <div class="stable-pdp__info"><p>${escapeHtml(categoryMeta[product.category]?.title || product.category)}</p><h1>${escapeHtml(product.title)}</h1><small>SKU: ${escapeHtml(product.sku)}</small>${priceMarkup(product, "stable-pdp__price")}${product.offerText ? `<p class="stable-offer">${escapeHtml(product.offerText)}</p>` : ""}<p>${escapeHtml(product.description)}</p>${variantMarkup}
        <div class="stable-pdp__qty"><span>Quantity</span><div class="stable-qty"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-qty">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></div>
        <div class="stable-pdp__actions">${commerceAction}<a class="stable-button stable-button--whatsapp" id="pdp-whatsapp" target="_blank" rel="noreferrer">${value.confirmed ? "Order on WhatsApp" : "Confirm Price on WhatsApp"}</a><button class="stable-button stable-button--plain ${wishlist.has(product.id) ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}">♡ Wishlist</button><button class="stable-share" type="button" data-share>Share</button></div>
        <div class="stable-accordions"><details open><summary>Product Details</summary><p>${escapeHtml(product.description)}</p><p>Category: ${escapeHtml(categoryMeta[product.category]?.title || product.category)}.</p></details><details><summary>Shipping and Exchange</summary><p>PAN India delivery, shipping charges, timelines and exchange eligibility are confirmed before payment on WhatsApp.</p></details><details><summary>Care Instructions</summary><p>Keep the piece dry and store it separately. Ask Shivara for product-specific material and care guidance.</p></details></div></div>
      </article>
      <section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOU MAY ALSO LIKE</p><h2>Related products</h2></div></div><div class="commerce-product-grid">${related.map(productCard).join("")}</div></section>
      ${recentProducts.length ? `<section class="stable-products stable-products--pdp"><div class="stable-section-heading"><div><p>YOUR TRAIL</p><h2>Recently viewed</h2></div></div><div class="commerce-product-grid">${recentProducts.map(productCard).join("")}</div></section>` : ""}
      <div class="stable-mobile-buy">${priceMarkup(product, "stable-mobile-buy__price")}${commerceAction || `<a class="stable-button stable-button--whatsapp" id="pdp-mobile-whatsapp" target="_blank">Enquire</a>`}</div>`;
    updatePdpWhatsapp(product);
    if (sessionStorage.getItem("shivara-transition-product") === product.id) {
      const destinationImage = mount.querySelector(".stable-pdp__gallery img");
      if (destinationImage) {
        destinationImage.style.viewTransitionName = `shivara-product-${product.id}`;
        setTimeout(() => { destinationImage.style.viewTransitionName = ""; }, 700);
      }
      sessionStorage.removeItem("shivara-transition-product");
    }
  }

  function pdpQuantity() {
    return Math.max(1, Number(document.querySelector("#pdp-qty")?.textContent || 1));
  }

  function selectedPdpVariant(product) {
    const id = document.querySelector('input[name="pdp-variant"]:checked')?.value;
    return validVariant(product, id);
  }

  function updatePdpWhatsapp(product) {
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(singleProductMessage(product, pdpQuantity(), selectedPdpVariant(product)))}`;
    const link = document.querySelector("#pdp-whatsapp");
    const mobileLink = document.querySelector("#pdp-mobile-whatsapp");
    if (link) link.href = href;
    if (mobileLink) mobileLink.href = href;
  }

  function renderWishlist() {
    if (document.body.dataset.page !== "wishlist") return;
    const selected = products.filter((product) => wishlist.has(product.id));
    const mount = document.querySelector("#wishlist-page-grid");
    renderGrid(mount, selected);
    document.querySelector("#wishlist-page-count").textContent = `${selected.length} ${selected.length === 1 ? "product" : "products"}`;
    mount.hidden = !selected.length;
    document.querySelector("#wishlist-empty").hidden = Boolean(selected.length);
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !activeLayer) return;
    const focusable = [...activeLayer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')].filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="/products/"]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const slug = decodeURIComponent(new URL(link.href).pathname.split("/").filter(Boolean)[1] || "");
    const product = catalogApi.getProductBySlug(slug);
    if (!product) return;
    document.querySelectorAll('[style*="view-transition-name"]').forEach((node) => { node.style.viewTransitionName = ""; });
    const sourceImage = link.closest("[data-product-card], .featured-product-card, #quick-view, article, section")?.querySelector("img");
    if (sourceImage) sourceImage.style.viewTransitionName = `shivara-product-${product.id}`;
    sessionStorage.setItem("shivara-transition-product", product.id);
  }, true);

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("[data-announcement-prev], [data-announcement-next]")) {
      announcementIndex = (announcementIndex + (target.closest("[data-announcement-prev]") ? -1 : 1) + announcements.length) % announcements.length;
      renderAnnouncement();
      return;
    }
    if (target.closest("[data-menu-open]")) return openLayer("#menu-drawer", target.closest("[data-menu-open]"));
    if (target.closest("[data-search-open]")) {
      renderSearch();
      return openLayer("#search-drawer", target.closest("[data-search-open]"));
    }
    if (target.closest("[data-cart-open]")) {
      renderCart();
      return openLayer("#cart-drawer", target.closest("[data-cart-open]"));
    }
    if (target.closest("[data-layer-close]")) return closeLayer();
    if (target.closest("[data-account]")) return showToast("Customer accounts are coming soon");
    const wish = target.closest("[data-wishlist-toggle]");
    if (wish) return toggleWishlist(wish.dataset.wishlistToggle);
    const quick = target.closest("[data-quick-view]");
    if (quick) return openQuick(quick.dataset.quickView, quick);
    const cardAdd = target.closest("[data-card-add]");
    if (cardAdd) {
      if (addToCart(cardAdd.dataset.cardAdd)) openLayer("#cart-drawer", cardAdd);
      return;
    }
    const quickQty = target.closest("[data-quick-qty]");
    if (quickQty) {
      quickState.quantity = Math.max(1, quickState.quantity + Number(quickQty.dataset.quickQty));
      document.querySelector("#quick-qty").textContent = String(quickState.quantity);
      updateQuickWhatsapp();
      return;
    }
    const quickAdd = target.closest("[data-quick-add]");
    if (quickAdd) {
      if (addToCart(quickAdd.dataset.quickAdd, null, quickState.quantity)) openLayer("#cart-drawer", quickAdd);
      return;
    }
    const quickThumb = target.closest("[data-quick-thumb]");
    if (quickThumb) {
      quickState.image = Number(quickThumb.dataset.quickThumb);
      document.querySelectorAll("[data-quick-media]").forEach((media, index) => media.classList.toggle("is-active", index === quickState.image));
      document.querySelectorAll("[data-quick-thumb]").forEach((thumb, index) => thumb.classList.toggle("is-active", index === quickState.image));
      const pagination = document.querySelector(".stable-quick__pagination");
      if (pagination) pagination.textContent = `${quickState.image + 1} / ${quickState.product.images.length}`;
      return;
    }
    const delta = target.closest("[data-cart-delta]");
    if (delta) {
      const item = cart.find((line) => line.id === delta.dataset.cartId && (line.variantId || "") === delta.dataset.variantId);
      if (item) item.qty += Number(delta.dataset.cartDelta);
      cart = cart.filter((line) => line.qty > 0);
      saveStorage(storageKeys.cart, cart);
      renderCart();
      return;
    }
    const remove = target.closest("[data-cart-remove]");
    if (remove) {
      cart = cart.filter((line) => !(line.id === remove.dataset.cartRemove && (line.variantId || "") === remove.dataset.variantId));
      saveStorage(storageKeys.cart, cart);
      renderCart();
      return;
    }
    const moveToWishlist = target.closest("[data-cart-wishlist]");
    if (moveToWishlist) {
      if (!wishlist.has(moveToWishlist.dataset.cartWishlist)) toggleWishlist(moveToWishlist.dataset.cartWishlist);
      cart = cart.filter((line) => !(line.id === moveToWishlist.dataset.cartWishlist && (line.variantId || "") === moveToWishlist.dataset.variantId));
      saveStorage(storageKeys.cart, cart);
      renderCart();
      showToast("Moved to Your Shivara Edit.");
      return;
    }
    const searchTerm = target.closest("[data-search-term]");
    if (searchTerm) {
      const input = document.querySelector("#stable-search");
      input.value = searchTerm.dataset.searchTerm;
      renderSearch(input.value);
      input.focus();
      return;
    }
    if (target.closest("[data-search-clear]")) {
      const input = document.querySelector("#stable-search");
      input.value = "";
      renderSearch();
      input.focus();
      return;
    }
    if (target.closest("[data-hero-prev], [data-hero-next]")) return renderHero(heroIndex + (target.closest("[data-hero-prev]") ? -1 : 1));
    if (target.closest("[data-signature-prev], [data-signature-next]")) return renderSignature(signatureIndex + (target.closest("[data-signature-prev]") ? -1 : 1));
    const pdpQtyButton = target.closest("[data-pdp-qty]");
    if (pdpQtyButton) {
      const amount = Math.max(1, pdpQuantity() + Number(pdpQtyButton.dataset.pdpQty));
      document.querySelector("#pdp-qty").textContent = String(amount);
      const product = productMap.get(decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || ""));
      updatePdpWhatsapp(product);
      return;
    }
    const pdpAdd = target.closest("[data-pdp-add]");
    if (pdpAdd) {
      const product = productMap.get(pdpAdd.dataset.pdpAdd);
      if (addToCart(product.id, selectedPdpVariant(product)?.id || null, pdpQuantity())) openLayer("#cart-drawer", pdpAdd);
      return;
    }
    const thumb = target.closest("[data-pdp-thumb]");
    if (thumb) {
      const gallery = document.querySelector("#pdp-gallery");
      gallery?.scrollTo({ left: gallery.clientWidth * Number(thumb.dataset.pdpThumb), behavior: "smooth" });
      document.querySelectorAll("[data-pdp-thumb]").forEach((button) => button.classList.toggle("is-active", button === thumb));
      return;
    }
    if (target.closest("[data-share]")) {
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => showToast("Product link copied"));
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#stable-search")) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderSearch(event.target.value), 90);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("#collection-sort")) updateCollectionState({ ...collectionState(), sort: event.target.value });
    if (event.target.matches('input[name="price-filter"]')) updateCollectionState({ ...collectionState(), price: event.target.value });
    if (event.target.matches('input[name="pdp-variant"]')) {
      const product = productMap.get(decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || ""));
      updatePdpWhatsapp(product);
    }
  });

  document.addEventListener("keydown", (event) => {
    trapFocus(event);
    if (event.key === "Escape") closeLayer();
    if (activeLayer?.id === "search-drawer" && event.target.matches("#stable-search") && event.key === "ArrowDown") {
      event.preventDefault();
      activeLayer.querySelector("[data-search-result] a")?.focus();
    }
    if (activeLayer?.id === "search-drawer" && event.key === "Enter" && event.target.matches("#stable-search")) {
      activeLayer.querySelector("[data-search-result] a")?.click();
    }
  });

  window.addEventListener("popstate", renderCollection);
  document.addEventListener("visibilitychange", () => {
    document.body.classList.toggle("stable-page-hidden", document.hidden);
  });

  async function bootstrapStorefront() {
    if (catalogApi.getAllProducts().length !== 25) throw new Error("Curated catalogue integrity check failed during bootstrap");
    renderChrome();
    renderHome();
    renderCollection();
    renderProductPage();
    renderWishlist();
    renderCart();
    document.dispatchEvent(new CustomEvent("shivara:storefront-ready", {
      detail: { catalogueVersion: catalogApi.version, productCount: products.length }
    }));
  }

  window.ShivaraStorefront = Object.freeze({
    addProducts(ids, { openBag = true, allowEnquiry = false } = {}) {
      const uniqueIds = [...new Set(Array.isArray(ids) ? ids : [])];
      const added = uniqueIds.filter((id) => addToCart(id, null, 1, allowEnquiry));
      if (added.length && openBag) openLayer("#cart-drawer");
      return added;
    },
    openQuickView(id, trigger) {
      openQuick(id, trigger);
    },
    openCart(trigger) {
      renderCart();
      openLayer("#cart-drawer", trigger);
    },
    openSearch(trigger) {
      renderSearch();
      openLayer("#search-drawer", trigger);
    },
    toggleWishlist,
    isWishlisted(id) {
      return wishlist.has(id);
    },
    refreshCounts: updateCounts,
    showToast,
    productMessage: singleProductMessage,
    whatsappNumber
  });

  window.bootstrapStorefront = bootstrapStorefront;
  bootstrapStorefront().catch((error) => {
    console.error("[Shivara] Storefront bootstrap failed", error);
    document.documentElement.classList.add("catalogue-unavailable");
  });
})();
