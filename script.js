const shopData = window.SHIVARA_SHOP_DATA || { products: [], profile: {} };

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

const heroOrder = [
  "DW3H_GZDD_4",
  "DXRflQ2ARK2",
  "DVsiM2WEctG",
  "DW9Cf8OkWo0",
  "DWtcQ8OAefp",
  "DWERaGlEYB6",
  "DV0yEUUkTHq",
  "DUsq31AgXWw"
];

const categoryLabels = {
  "Anti-tarnish": "Anti Tarnish",
  Pendants: "Neck Wear"
};

function inferCategory(product) {
  const text = `${product.title} ${product.caption || ""}`.toLowerCase();
  if (/\bearring|ear cuff|studs?\b/.test(text)) return "Earrings";
  if (/\bnecklace|neckpiece|pendant\b/.test(text)) return "Pendants";
  if (/\bbracelet|bangle|wrist\b/.test(text)) return product.category === "Evil Eye" || /evil eye/.test(text) ? "Evil Eye" : "Bracelets";
  if (/\bring\b/.test(text)) return "Rings";
  if (/\bevil eye|protection\b/.test(text)) return "Evil Eye";
  return product.category || "Anti-tarnish";
}

const heroRank = new Map(heroOrder.map((id, index) => [id, index]));
const products = (Array.isArray(shopData.products) ? shopData.products : [])
  .map((product) => ({
    ...product,
    title: titleOverrides[product.id] || product.title,
    category: inferCategory({ ...product, title: titleOverrides[product.id] || product.title })
  }))
  .sort((a, b) => {
    const aRank = heroRank.has(a.id) ? heroRank.get(a.id) : 1000 + Number(a.index || 0);
    const bRank = heroRank.has(b.id) ? heroRank.get(b.id) : 1000 + Number(b.index || 0);
    return aRank - bRank;
  });

const productMap = new Map(products.map((product) => [product.id, product]));
const categoryRail = [
  ["New Arrivals", "All", "post-080-DWERaGlEYB6.jpg"],
  ["Anti Tarnish", "Anti-tarnish", "post-068-DWjfG3oBmR5.jpg"],
  ["Earrings", "Earrings", "post-038-DXO-ucIBdig.jpg"],
  ["Neck Wear", "Pendants", "post-036-DXRflQ2ARK2.jpg"],
  ["Bracelets", "Bracelets", "post-049-DW9Cf8OkWo0.jpg"],
  ["Rings", "Rings", "post-090-DVsiM2WEctG.jpg"],
  ["Evil Eye", "Evil Eye", "post-051-DW3H_GZDD_4.jpg"],
  ["Celebrity Styles", "Celebrity", "post-067-DWlGxA6DBMP.jpg"],
  ["Gifts", "Gifting", "post-103-DUsq31AgXWw.jpg"]
];
const announcementMessages = [
  "Gift-ready packaging with every order",
  "PAN India delivery available",
  "Personal shopping on WhatsApp: +91 94570 41215"
];

function escapeMarkup(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function readLocalJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function productPricing(product) {
  const basePrices = {
    Rings: 199,
    Bracelets: 399,
    Pendants: 299,
    Earrings: 299,
    "Evil Eye": 499,
    Gifting: 699,
    "Anti-tarnish": 499
  };
  const price = basePrices[product.category] || 399;
  const compareAt = price + (price >= 499 ? 200 : 100);
  const discount = Math.round(((compareAt - price) / compareAt) * 100);
  return { price, compareAt, discount };
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function productVariants(product) {
  if (product.category === "Rings") return ["Adjustable", "Size 6", "Size 7", "Size 8"];
  if (product.category === "Bracelets" || product.category === "Evil Eye") return ["Standard", "Adjustable"];
  if (product.category === "Anti-tarnish") return ["Gold tone", "Silver tone"];
  return ["Standard"];
}

function productUrl(product) {
  return `/products/${encodeURIComponent(product.id)}`;
}

function collectionUrl(category) {
  if (category === "All") return "/collections/all";
  if (category === "Rings") return "/collections/rings";
  if (category === "Celebrity") return "/collections/all?category=Anti-tarnish";
  return `/collections/all?category=${encodeURIComponent(category)}`;
}

function productsForCategory(category, limit = 12) {
  const filtered = category === "All" ? products : products.filter((product) => product.category === category);
  return filtered.slice(0, limit);
}

function normalizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (Array.isArray(entry)) {
        const [id, qty] = entry;
        const product = productMap.get(id);
        return product ? { id, variant: productVariants(product)[0], qty: Number(qty) || 1 } : null;
      }
      if (!entry || !productMap.has(entry.id)) return null;
      return { id: entry.id, variant: entry.variant || productVariants(productMap.get(entry.id))[0], qty: Math.max(1, Number(entry.qty) || 1) };
    })
    .filter(Boolean);
}

let cart = normalizeCart(readLocalJson("shivara-cart", []));
const wishlist = new Set(readLocalJson("shivara-saved-posts", []).filter((id) => productMap.has(id)));
let recentSearches = readLocalJson("shivara-recent-searches", []).filter((item) => typeof item === "string").slice(0, 5);
let lastFocused = null;
let announcementIndex = 0;
let quickViewState = { product: null, quantity: 1 };
let pdpQuantity = 1;

function saveCart() {
  localStorage.setItem("shivara-cart", JSON.stringify(cart));
}

function saveWishlist() {
  localStorage.setItem("shivara-saved-posts", JSON.stringify(Array.from(wishlist)));
}

function cartQuantity() {
  return cart.reduce((total, item) => total + item.qty, 0);
}

function cartTotals() {
  return cart.reduce(
    (totals, item) => {
      const product = productMap.get(item.id);
      if (!product) return totals;
      const line = productPricing(product).price * item.qty;
      totals.subtotal += line;
      totals.total += line;
      return totals;
    },
    { subtotal: 0, total: 0 }
  );
}

function addToCart(id, variant, quantity = 1) {
  const product = productMap.get(id);
  if (!product) return;
  const selectedVariant = variant || productVariants(product)[0];
  const existing = cart.find((item) => item.id === id && item.variant === selectedVariant);
  if (existing) existing.qty += Math.max(1, Number(quantity) || 1);
  else cart.push({ id, variant: selectedVariant, qty: Math.max(1, Number(quantity) || 1) });
  saveCart();
  renderCart();
  showToast(`${product.title} added to bag`);
}

function updateCartLine(id, variant, delta) {
  const item = cart.find((line) => line.id === id && line.variant === variant);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((line) => line !== item);
  saveCart();
  renderCart();
}

function removeCartLine(id, variant) {
  cart = cart.filter((line) => !(line.id === id && line.variant === variant));
  saveCart();
  renderCart();
}

function productCard(product, options = {}) {
  const pricing = productPricing(product);
  const saved = wishlist.has(product.id);
  const variants = productVariants(product);
  const eager = options.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  const badge = product.index % 5 === 0 ? "Best Seller" : "Sale";
  return `
    <article class="jlt-product-card" data-product-card="${product.id}" data-category="${product.category}">
      <div class="jlt-product-card__media">
        <a href="${productUrl(product)}" aria-label="View ${escapeMarkup(product.title)}">
          <img class="jlt-product-card__image jlt-product-card__image--primary" src="/${product.image}" alt="${escapeMarkup(product.title)}" ${eager} decoding="async" />
          <img class="jlt-product-card__image jlt-product-card__image--secondary" src="/${product.image}" alt="" loading="lazy" decoding="async" />
        </a>
        <div class="jlt-product-card__badges"><span>${badge}</span><span>${pricing.discount}% off</span></div>
        <button class="jlt-product-card__wishlist ${saved ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}" aria-label="${saved ? "Remove" : "Save"} ${escapeMarkup(product.title)}" aria-pressed="${saved}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 5.8a5.2 5.2 0 0 0-7.4 0L12 6.6l-.8-.8a5.2 5.2 0 0 0-7.4 7.4L12 21l8.2-7.8a5.2 5.2 0 0 0 0-7.4Z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
        </button>
        <button class="jlt-product-card__quick" type="button" data-quick-view="${product.id}">Quick View</button>
      </div>
      <div class="jlt-product-card__content">
        <a class="jlt-product-card__title" href="${productUrl(product)}">${escapeMarkup(product.title)}</a>
        <div class="jlt-product-card__price">
          <strong>${formatPrice(pricing.price)}</strong>
          <s>${formatPrice(pricing.compareAt)}</s>
          <span>${pricing.discount}% off</span>
        </div>
        <button class="jlt-product-card__add" type="button" ${variants.length > 1 ? `data-quick-view="${product.id}"` : `data-card-add="${product.id}"`}>
          ${variants.length > 1 ? "Choose Options" : "Add to Cart"}
        </button>
      </div>
    </article>
  `;
}

function renderProductGrid(mount, source, options = {}) {
  if (!mount) return;
  mount.innerHTML = source.map((product, index) => productCard(product, { eager: options.eager && index < 5 })).join("");
}

function renderAnnouncement() {
  const text = document.querySelector("[data-announcement-text]");
  if (!text) return;
  text.textContent = announcementMessages[announcementIndex];
  document.querySelectorAll("[data-announcement-dot]").forEach((dot, index) => dot.classList.toggle("is-active", index === announcementIndex));
}

function startAnnouncementRotation() {
  renderAnnouncement();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.setInterval(() => {
    announcementIndex = (announcementIndex + 1) % announcementMessages.length;
    renderAnnouncement();
  }, 3600);
}

function renderCategoryRail() {
  const mount = document.querySelector("#commerce-category-grid");
  if (!mount) return;
  mount.innerHTML = categoryRail
    .map(
      ([label, category, image]) => `
        <a class="category-rail__item" href="${collectionUrl(category)}">
          <span><img src="/assets/instagram-shop/${image}" alt="" loading="lazy" decoding="async" /></span>
          <strong>${label}</strong>
        </a>
      `
    )
    .join("");
}

function renderHome() {
  if (document.body.dataset.page !== "home") return;
  renderCategoryRail();
  renderProductGrid(document.querySelector('[data-commerce-products="bestsellers"]'), products.slice(0, 10), { eager: true });
  renderProductGrid(document.querySelector('[data-commerce-products="new"]'), products.slice(10, 20));
  renderProductGrid(document.querySelector('[data-commerce-products="earrings"]'), productsForCategory("Earrings", 10));
  renderProductGrid(document.querySelector('[data-commerce-products="Pendants"]'), productsForCategory("Pendants", 10));
  renderProductGrid(document.querySelector('[data-commerce-products="Bracelets"]'), productsForCategory("Bracelets", 10));
  renderProductGrid(document.querySelector('[data-commerce-products="Rings"]'), productsForCategory("Rings", 10));
}

function sharedHeaderMarkup() {
  return `
    <div class="store-announcement">
      <button type="button" data-announcement-prev aria-label="Previous announcement">‹</button>
      <p data-announcement-text>${announcementMessages[0]}</p>
      <div class="store-announcement__dots" aria-hidden="true">${announcementMessages.map((_, index) => `<i class="${index === 0 ? "is-active" : ""}" data-announcement-dot="${index}"></i>`).join("")}</div>
      <button type="button" data-announcement-next aria-label="Next announcement">›</button>
    </div>
    <header class="store-header">
      <div class="store-header__utility">
        <button class="store-icon-button store-header__menu" type="button" data-menu-open aria-label="Open menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
        </button>
        <button class="store-search-trigger" type="button" data-search-open>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
          <span>Search</span>
        </button>
        <a class="store-brand" href="/" aria-label="Shivara.luxe home"><span>SHIVARA</span><small>JEWELS TO BE NOTICED</small></a>
        <div class="store-header__actions">
          <button class="store-icon-button store-header__mobile-search" type="button" data-search-open aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
          </button>
          <button class="store-icon-button store-header__account" type="button" data-account-placeholder aria-label="Account">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
          </button>
          <button class="store-icon-button store-header__wishlist" type="button" data-wishlist-open aria-label="Open wishlist">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 5.8a5.2 5.2 0 0 0-7.4 0L12 6.6l-.8-.8a5.2 5.2 0 0 0-7.4 7.4L12 21l8.2-7.8a5.2 5.2 0 0 0 0-7.4Z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
            <span class="store-action-count" data-wishlist-count>0</span>
          </button>
          <button class="store-icon-button" type="button" data-cart-open aria-label="Open shopping bag">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8h13l-1 12h-11l-1-12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
            <span class="store-action-count" data-cart-count>0</span>
          </button>
        </div>
      </div>
      <nav class="store-nav" aria-label="Shop categories">
        <a href="/collections/all">New Arrivals</a>
        <a href="${collectionUrl("Anti-tarnish")}">Anti Tarnish</a>
        <a href="${collectionUrl("Earrings")}">Earrings</a>
        <a href="${collectionUrl("Pendants")}">Neck Wear</a>
        <a href="${collectionUrl("Bracelets")}">Bracelets</a>
        <a href="/collections/rings">Rings</a>
        <a href="${collectionUrl("Evil Eye")}">Evil Eye</a>
        <a href="${collectionUrl("Gifting")}">Gifts</a>
      </nav>
    </header>
  `;
}

function sharedFooterMarkup() {
  return `
    <footer class="store-footer">
      <div class="store-footer__main store-shell">
        <div class="store-footer__brand">
          <a class="store-brand store-brand--footer" href="/"><span>SHIVARA</span><small>JEWELS TO BE NOTICED</small></a>
          <p>Statement jewellery for everyday confidence, curated in Bareilly and delivered across India.</p>
          <div class="store-footer__social"><a href="https://www.instagram.com/shivara.luxe" target="_blank" rel="noreferrer">Instagram</a><a href="https://wa.me/919457041215" target="_blank" rel="noreferrer">WhatsApp</a></div>
        </div>
        <nav aria-label="Shop"><h3>Shop</h3><a href="/collections/all">New arrivals</a><a href="${collectionUrl("Earrings")}">Earrings</a><a href="${collectionUrl("Pendants")}">Neck Wear</a><a href="${collectionUrl("Bracelets")}">Bracelets</a><a href="/collections/rings">Rings</a></nav>
        <nav aria-label="Help"><h3>Help</h3><a href="https://wa.me/919457041215">Contact us</a><a href="/#faq-title">Ordering</a><a href="/#faq-title">Delivery</a><a href="/#faq-title">Product care</a></nav>
        <div class="store-footer__contact"><h3>Visit &amp; connect</h3><p>Bareilly, Uttar Pradesh</p><a href="tel:+919457041215">+91 94570 41215</a><a href="https://wa.me/917451995279">+91 74519 95279</a></div>
      </div>
      <div class="store-footer__bottom store-shell"><span>© 2026 Shivara.luxe</span><span>Designed to be noticed.</span></div>
    </footer>
  `;
}

function ensureSharedChrome() {
  const headerMount = document.querySelector("#shared-header");
  if (headerMount) headerMount.outerHTML = sharedHeaderMarkup();
  const footerMount = document.querySelector("#shared-footer");
  if (footerMount) footerMount.outerHTML = sharedFooterMarkup();
}

function ensureGlobalLayers() {
  if (!document.querySelector("#search-drawer")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="commerce-side-drawer" id="search-drawer" role="dialog" aria-modal="true" aria-label="Search products" aria-hidden="true" data-modal>
        <button class="commerce-side-drawer__overlay" type="button" data-drawer-close aria-label="Close search"></button>
        <div class="commerce-side-drawer__panel">
          <header><div><small>DISCOVER</small><h2>Search Shivara</h2></div><button type="button" data-drawer-close>Close</button></header>
          <label class="commerce-search-input"><span class="visually-hidden">Search products</span><input id="drawer-search" type="search" placeholder="Search rings, earrings, gifts..." autocomplete="off" /></label>
          <div id="search-results"></div>
        </div>
      </aside>`
    );
  }
  if (!document.querySelector("#mobile-menu-drawer")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="commerce-side-drawer commerce-side-drawer--left" id="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label="Shop menu" aria-hidden="true" data-modal>
        <button class="commerce-side-drawer__overlay" type="button" data-drawer-close aria-label="Close menu"></button>
        <div class="commerce-side-drawer__panel">
          <header><a class="store-brand" href="/"><span>SHIVARA</span><small>JEWELS TO BE NOTICED</small></a><button type="button" data-drawer-close>Close</button></header>
          <nav class="commerce-mobile-nav">${categoryRail.map(([label, category], index) => `<a href="${collectionUrl(category)}"><span>${label}</span><b>${String(index + 1).padStart(2, "0")}</b></a>`).join("")}</nav>
          <a class="commerce-mobile-nav__whatsapp" href="https://wa.me/919457041215">Personal shopping on WhatsApp <span>→</span></a>
        </div>
      </aside>`
    );
  }
  if (!document.querySelector("#wishlist-drawer")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="commerce-side-drawer" id="wishlist-drawer" role="dialog" aria-modal="true" aria-label="Wishlist" aria-hidden="true" data-modal>
        <button class="commerce-side-drawer__overlay" type="button" data-wishlist-close aria-label="Close wishlist"></button>
        <div class="commerce-side-drawer__panel">
          <header><div><small>YOUR EDIT</small><h2>Wishlist</h2></div><button type="button" data-wishlist-close>Close</button></header>
          <div id="wishlist-items"></div>
        </div>
      </aside>`
    );
  }
  if (!document.querySelector(".cart-drawer")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="commerce-side-drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden="true" data-modal>
        <button class="commerce-side-drawer__overlay" type="button" data-cart-close aria-label="Close shopping bag"></button>
        <div class="commerce-side-drawer__panel commerce-cart-panel">
          <header><div><small>YOUR SELECTION</small><h2>Shopping Bag</h2></div><button type="button" data-cart-close>Close</button></header>
          <div class="commerce-cart-lines" id="cart-items"></div>
          <div class="commerce-cart-empty" id="cart-empty"><strong>Your bag is empty.</strong><p>Start with a Shivara bestseller.</p><button class="store-button store-button--dark" type="button" data-continue-shopping>Continue Shopping</button></div>
          <div class="commerce-cart-summary" id="cart-summary-wrap">
            <p><span>Subtotal</span><strong id="cart-subtotal">${formatPrice(0)}</strong></p>
            <p><span>Total</span><strong id="cart-total">${formatPrice(0)}</strong></p>
            <small>Shipping and final availability are confirmed on WhatsApp.</small>
            <a class="store-button store-button--dark" id="checkout-link" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">Send Order on WhatsApp</a>
            <button type="button" data-continue-shopping>Continue Shopping</button>
          </div>
        </div>
      </aside>`
    );
  }
  if (!document.querySelector("#quick-view")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<aside class="quick-view-v2" id="quick-view" role="dialog" aria-modal="true" aria-label="Product quick view" aria-hidden="true" data-modal>
        <button class="quick-view-v2__overlay" type="button" data-quick-close aria-label="Close quick view"></button>
        <div class="quick-view-v2__panel"><button class="quick-view-v2__close" type="button" data-quick-close aria-label="Close quick view">×</button><div id="quick-view-content"></div></div>
      </aside>`
    );
  }
  if (!document.querySelector("#commerce-toast")) {
    document.body.insertAdjacentHTML("beforeend", '<div class="commerce-toast" id="commerce-toast" role="status" aria-live="polite"></div>');
  }
}

function setLayerOpen(selector, open) {
  const layer = document.querySelector(selector);
  if (!layer) return;
  layer.classList.toggle("is-open", open);
  layer.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("commerce-modal-open", Boolean(document.querySelector(".commerce-side-drawer.is-open, .quick-view-v2.is-open")));
  if (open) {
    const focusTarget =
      selector === "#search-drawer"
        ? layer.querySelector("#drawer-search")
        : selector === "#quick-view"
          ? layer.querySelector(".quick-view-v2__close")
          : layer.querySelector(".commerce-side-drawer__panel button, .commerce-side-drawer__panel a");
    window.requestAnimationFrame(() => focusTarget?.focus());
  }
}

function closeAllLayers() {
  document.querySelectorAll(".commerce-side-drawer.is-open, .quick-view-v2.is-open").forEach((layer) => {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("commerce-modal-open");
  const focusTarget = lastFocused;
  if (focusTarget?.isConnected) window.requestAnimationFrame(() => focusTarget.focus());
  lastFocused = null;
}

function renderWishlist() {
  document.querySelectorAll("[data-wishlist-count]").forEach((badge) => {
    badge.textContent = String(wishlist.size);
    badge.hidden = wishlist.size === 0;
  });
  document.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
    const saved = wishlist.has(button.getAttribute("data-wishlist-toggle"));
    button.classList.toggle("is-active", saved);
    button.setAttribute("aria-pressed", String(saved));
  });
  const mount = document.querySelector("#wishlist-items");
  if (!mount) return;
  const savedProducts = products.filter((product) => wishlist.has(product.id));
  mount.innerHTML = savedProducts.length
    ? savedProducts
        .map((product) => {
          const pricing = productPricing(product);
          return `<article class="commerce-mini-line"><a href="${productUrl(product)}"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" loading="lazy" /></a><div><small>${categoryLabels[product.category] || product.category}</small><a href="${productUrl(product)}"><strong>${escapeMarkup(product.title)}</strong></a><p>${formatPrice(pricing.price)} <s>${formatPrice(pricing.compareAt)}</s></p><button type="button" data-quick-view="${product.id}">Choose Options</button><button type="button" data-wishlist-toggle="${product.id}">Remove</button></div></article>`;
        })
        .join("")
    : '<div class="commerce-empty-state"><b>♡</b><strong>Your wishlist is empty.</strong><p>Save pieces you love and they will stay here.</p><button class="store-button store-button--dark" type="button" data-continue-shopping>Explore Products</button></div>';
}

function renderCart() {
  cart = cart.filter((item) => productMap.has(item.id));
  const count = cartQuantity();
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
  const mount = document.querySelector("#cart-items");
  const empty = document.querySelector("#cart-empty");
  const summary = document.querySelector("#cart-summary-wrap");
  if (!mount || !empty || !summary) return;
  mount.innerHTML = cart
    .map((item) => {
      const product = productMap.get(item.id);
      const pricing = productPricing(product);
      return `<article class="commerce-cart-line">
        <a href="${productUrl(product)}"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" /></a>
        <div><a href="${productUrl(product)}"><strong>${escapeMarkup(product.title)}</strong></a><small>Variant: ${escapeMarkup(item.variant)}</small>
          <div class="commerce-quantity"><button type="button" data-cart-decrease="${product.id}" data-variant="${escapeMarkup(item.variant)}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-increase="${product.id}" data-variant="${escapeMarkup(item.variant)}" aria-label="Increase quantity">+</button></div>
          <button class="commerce-cart-line__remove" type="button" data-cart-remove="${product.id}" data-variant="${escapeMarkup(item.variant)}">Remove</button>
        </div><b>${formatPrice(pricing.price * item.qty)}</b>
      </article>`;
    })
    .join("");
  const totals = cartTotals();
  document.querySelector("#cart-subtotal").textContent = formatPrice(totals.subtotal);
  document.querySelector("#cart-total").textContent = formatPrice(totals.total);
  empty.hidden = cart.length > 0;
  mount.hidden = cart.length === 0;
  summary.hidden = cart.length === 0;
  const lines = cart.map((item, index) => {
    const product = productMap.get(item.id);
    const price = productPricing(product).price;
    return `${index + 1}. ${product.title}\nVariant: ${item.variant}\nQuantity: ${item.qty}\nLine total: ${formatPrice(price * item.qty)}`;
  });
  const message = cart.length
    ? `Hi Shivara.luxe, I would like to order:\n\n${lines.join("\n\n")}\n\nTotal: ${formatPrice(totals.total)}\n\nPlease confirm availability, shipping and payment details.`
    : "Hi Shivara.luxe, I would like to shop your collection.";
  document.querySelector("#checkout-link").href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
  saveCart();
}

function quickViewMarkup(product) {
  const pricing = productPricing(product);
  const variants = productVariants(product);
  return `
    <div class="quick-view-v2__gallery">
      <div class="quick-view-v2__images"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" /><img src="/${product.image}" alt="" /></div>
      <div class="quick-view-v2__thumbs"><button type="button" data-quick-image="0" aria-label="View product image 1"><img src="/${product.image}" alt="" /></button><button type="button" data-quick-image="1" aria-label="View product image 2"><img src="/${product.image}" alt="" /></button></div>
    </div>
    <div class="quick-view-v2__info">
      <small>${categoryLabels[product.category] || product.category} · SKU ${product.id}</small>
      <h2>${escapeMarkup(product.title)}</h2>
      <div class="quick-view-v2__price"><strong>${formatPrice(pricing.price)}</strong><s>${formatPrice(pricing.compareAt)}</s><span>${pricing.discount}% off</span></div>
      <label>Variant<select id="quick-variant">${variants.map((variant) => `<option value="${escapeMarkup(variant)}">${escapeMarkup(variant)}</option>`).join("")}</select></label>
      <label>Quantity<div class="commerce-quantity commerce-quantity--large"><button type="button" data-quick-qty="-1" aria-label="Decrease quantity">−</button><span id="quick-quantity">${quickViewState.quantity}</span><button type="button" data-quick-qty="1" aria-label="Increase quantity">+</button></div></label>
      <button class="store-button store-button--dark" type="button" data-quick-add="${product.id}">Add to Cart</button>
      <a class="store-button store-button--outline" id="quick-whatsapp" href="#" target="_blank" rel="noreferrer">WhatsApp Order</a>
      <a class="quick-view-v2__details" href="${productUrl(product)}">View Full Details →</a>
    </div>
  `;
}

function updateQuickViewWhatsapp() {
  const product = quickViewState.product;
  if (!product) return;
  const variant = document.querySelector("#quick-variant")?.value || productVariants(product)[0];
  const total = productPricing(product).price * quickViewState.quantity;
  const message = `Hi Shivara.luxe, I want to order ${product.title}.\nVariant: ${variant}\nQuantity: ${quickViewState.quantity}\nTotal: ${formatPrice(total)}\n${location.origin}${productUrl(product)}`;
  const link = document.querySelector("#quick-whatsapp");
  if (link) link.href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
}

function openQuickView(product) {
  if (!product) return;
  quickViewState = { product, quantity: 1 };
  document.querySelector("#quick-view-content").innerHTML = quickViewMarkup(product);
  updateQuickViewWhatsapp();
  setLayerOpen("#quick-view", true);
}

function renderSearch(query = "") {
  const mount = document.querySelector("#search-results");
  if (!mount) return;
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    mount.innerHTML = `${recentSearches.length ? `<div class="commerce-search-recents"><strong>Recent searches</strong>${recentSearches.map((item) => `<button type="button" data-recent-search="${escapeMarkup(item)}">${escapeMarkup(item)}</button>`).join("")}</div>` : ""}<h3>Popular right now</h3>${products.slice(0, 6).map(searchResultMarkup).join("")}`;
    return;
  }
  const matches = products.filter((product) => `${product.title} ${product.category} ${product.caption || ""}`.toLowerCase().includes(normalized)).slice(0, 18);
  mount.innerHTML = matches.length ? `<h3>${matches.length} products found</h3>${matches.map(searchResultMarkup).join("")}` : '<div class="commerce-empty-state"><strong>No products found.</strong><p>Try rings, earrings, bracelets or gifts.</p></div>';
}

function searchResultMarkup(product) {
  const pricing = productPricing(product);
  return `<a class="commerce-search-result" href="${productUrl(product)}"><img src="/${product.image}" alt="" loading="lazy" /><span><strong>${escapeMarkup(product.title)}</strong><small>${categoryLabels[product.category] || product.category}</small></span><b>${formatPrice(pricing.price)}</b></a>`;
}

function renderCollection() {
  const grid = document.querySelector("#collection-grid");
  if (!grid) return;
  const queryCategory = new URLSearchParams(location.search).get("category");
  const bodyCategory = document.body.dataset.collection;
  const category = queryCategory || (bodyCategory === "Rings" ? "Rings" : "All");
  const visible = productsForCategory(category, 40);
  renderProductGrid(grid, visible, { eager: true });
  const title = document.querySelector(".collection-hero h2");
  const copy = document.querySelector(".collection-hero p:last-child");
  if (title) title.textContent = category === "All" ? "All Shivara drops" : `${categoryLabels[category] || category} collection`;
  if (copy) copy.textContent = `${visible.length} curated pieces ready to add to your Shivara edit.`;
  document.title = `${categoryLabels[category] || category} | Shivara.luxe`;
  const filters = document.querySelector("#facet-filters");
  if (filters) {
    filters.innerHTML = `<nav class="collection-category-filter" aria-label="Filter products">${["All", "Earrings", "Pendants", "Bracelets", "Rings", "Evil Eye", "Anti-tarnish", "Gifting"].map((item) => `<a class="${item === category ? "is-active" : ""}" href="${collectionUrl(item)}">${categoryLabels[item] || item}<span>${item === "All" ? products.length : products.filter((product) => product.category === item).length}</span></a>`).join("")}</nav>`;
  }
  const count = document.querySelector("[data-collection-count]");
  if (count) count.textContent = `${visible.length} products`;
}

function readProductFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] !== "products" || !parts[1]) return null;
  return productMap.get(decodeURIComponent(parts[1])) || null;
}

function rememberViewed(product) {
  const current = readLocalJson("shivara-recently-viewed", []).filter((id) => id !== product.id && productMap.has(id));
  localStorage.setItem("shivara-recently-viewed", JSON.stringify([product.id, ...current].slice(0, 12)));
}

function renderProductPage() {
  const mount = document.querySelector("#product-page");
  if (!mount) return;
  const product = readProductFromPath();
  if (!product) {
    mount.innerHTML = '<div class="product-not-found"><h1>Piece not found</h1><a class="store-button store-button--dark" href="/collections/all">Browse all jewellery</a></div>';
    return;
  }
  rememberViewed(product);
  const pricing = productPricing(product);
  const variants = productVariants(product);
  const saved = wishlist.has(product.id);
  mount.innerHTML = `
    <nav class="pdp-breadcrumb"><a href="/">Home</a><span>/</span><a href="${collectionUrl(product.category)}">${categoryLabels[product.category] || product.category}</a><span>/</span><b>${escapeMarkup(product.title)}</b></nav>
    <section class="pdp-main">
      <div class="pdp-gallery">
        <div class="pdp-thumbnails"><button class="is-active" type="button" data-pdp-thumb="0"><img src="/${product.image}" alt="" /></button><button type="button" data-pdp-thumb="1"><img src="/${product.image}" alt="" /></button></div>
        <div class="pdp-images" id="pdp-images"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" /><img src="/${product.image}" alt="" /></div>
      </div>
      <div class="pdp-info">
        <small>${categoryLabels[product.category] || product.category}</small>
        <h1>${escapeMarkup(product.title)}</h1>
        <p class="pdp-sku">SKU: ${product.id}</p>
        <div class="pdp-price"><strong>${formatPrice(pricing.price)}</strong><s>${formatPrice(pricing.compareAt)}</s><span>${pricing.discount}% off</span></div>
        <p class="pdp-tax">Inclusive of all taxes. Shipping confirmed on WhatsApp.</p>
        <label class="pdp-field">Select variant<select id="pdp-variant">${variants.map((variant) => `<option value="${escapeMarkup(variant)}">${escapeMarkup(variant)}</option>`).join("")}</select></label>
        <label class="pdp-field">Quantity<div class="commerce-quantity commerce-quantity--large"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-quantity">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></label>
        <div class="pdp-actions"><button class="store-button store-button--dark" type="button" data-pdp-add="${product.id}">Add to Cart</button><button class="pdp-wishlist ${saved ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}" aria-pressed="${saved}">♡ <span>${saved ? "Saved" : "Add to Wishlist"}</span></button></div>
        <a class="store-button store-button--whatsapp" id="pdp-whatsapp" href="#" target="_blank" rel="noreferrer">Order on WhatsApp</a>
        <div class="pdp-accordions">
          <details open><summary>Product Details <span>+</span></summary><p>${escapeMarkup((product.caption || "A statement jewellery piece curated by Shivara.luxe.").replace(/\s+/g, " ").slice(0, 320))}</p></details>
          <details><summary>Shipping and Exchange <span>+</span></summary><p>PAN India delivery is available. Dispatch timeline, shipping charge and exchange eligibility are confirmed before payment on WhatsApp.</p></details>
          <details><summary>Care Instructions <span>+</span></summary><p>Keep away from water, perfume and direct heat. Store separately in the provided packaging and wipe gently after wear.</p></details>
        </div>
      </div>
    </section>
    <section class="pdp-products"><header><h2>You may also like</h2><a href="${collectionUrl(product.category)}">View collection →</a></header><div class="commerce-product-grid" id="related-products"></div></section>
    <section class="pdp-products"><header><h2>Recently viewed</h2></header><div class="commerce-product-grid" id="recent-products"></div></section>
    <div class="pdp-sticky-bar"><div><strong>${escapeMarkup(product.title)}</strong><span>${formatPrice(pricing.price)}</span></div><button type="button" data-pdp-add="${product.id}">Add to Cart</button></div>
  `;
  renderProductGrid(document.querySelector("#related-products"), products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 8));
  const recentIds = readLocalJson("shivara-recently-viewed", []).filter((id) => id !== product.id);
  const recent = recentIds.map((id) => productMap.get(id)).filter(Boolean);
  renderProductGrid(document.querySelector("#recent-products"), (recent.length ? recent : products.filter((item) => item.id !== product.id)).slice(0, 8));
  updatePdpWhatsapp(product);
  document.title = `${product.title} | Shivara.luxe`;
}

function updatePdpWhatsapp(product = readProductFromPath()) {
  if (!product) return;
  const variant = document.querySelector("#pdp-variant")?.value || productVariants(product)[0];
  const total = productPricing(product).price * pdpQuantity;
  const message = `Hi Shivara.luxe, I want to order ${product.title}.\nSKU: ${product.id}\nVariant: ${variant}\nQuantity: ${pdpQuantity}\nTotal: ${formatPrice(total)}\n${location.href}`;
  const link = document.querySelector("#pdp-whatsapp");
  if (link) link.href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
}

function showToast(message) {
  const toast = document.querySelector("#commerce-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function trapFocus(event) {
  if (event.key !== "Tab") return;
  const modal = Array.from(document.querySelectorAll("[data-modal].is-open")).find((item) => item.getAttribute("aria-hidden") === "false");
  if (!modal) return;
  const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((item) => item.offsetParent !== null);
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
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (target.closest("[data-announcement-prev], [data-announcement-next]")) {
    announcementIndex = (announcementIndex + (target.closest("[data-announcement-prev]") ? -1 : 1) + announcementMessages.length) % announcementMessages.length;
    renderAnnouncement();
    return;
  }
  if (target.closest("[data-search-open]")) {
    lastFocused = target.closest("[data-search-open]");
    setLayerOpen("#search-drawer", true);
    renderSearch();
    return;
  }
  if (target.closest("[data-menu-open]")) {
    lastFocused = target.closest("[data-menu-open]");
    setLayerOpen("#mobile-menu-drawer", true);
    return;
  }
  if (target.closest("[data-wishlist-open]")) {
    lastFocused = target.closest("[data-wishlist-open]");
    renderWishlist();
    setLayerOpen("#wishlist-drawer", true);
    return;
  }
  if (target.closest("[data-cart-open]")) {
    lastFocused = target.closest("[data-cart-open]");
    renderCart();
    setLayerOpen("#cart-drawer", true);
    return;
  }
  if (target.closest("[data-drawer-close], [data-wishlist-close], [data-cart-close], [data-quick-close], [data-continue-shopping]")) {
    closeAllLayers();
    return;
  }
  if (target.closest("[data-account-placeholder]")) {
    showToast("Customer accounts are coming soon");
    return;
  }
  const wishlistButton = target.closest("[data-wishlist-toggle]");
  if (wishlistButton) {
    const id = wishlistButton.getAttribute("data-wishlist-toggle");
    if (wishlist.has(id)) wishlist.delete(id);
    else wishlist.add(id);
    saveWishlist();
    renderWishlist();
    if (document.body.dataset.page === "product") renderProductPage();
    showToast(wishlist.has(id) ? "Saved to wishlist" : "Removed from wishlist");
    return;
  }
  const quickButton = target.closest("[data-quick-view]");
  if (quickButton) {
    lastFocused = quickButton;
    openQuickView(productMap.get(quickButton.getAttribute("data-quick-view")));
    return;
  }
  const cardAdd = target.closest("[data-card-add]");
  if (cardAdd) {
    const id = cardAdd.getAttribute("data-card-add");
    addToCart(id, productVariants(productMap.get(id))[0], 1);
    setLayerOpen("#cart-drawer", true);
    return;
  }
  const quickQty = target.closest("[data-quick-qty]");
  if (quickQty) {
    quickViewState.quantity = Math.max(1, quickViewState.quantity + Number(quickQty.getAttribute("data-quick-qty")));
    document.querySelector("#quick-quantity").textContent = String(quickViewState.quantity);
    updateQuickViewWhatsapp();
    return;
  }
  const quickAdd = target.closest("[data-quick-add]");
  if (quickAdd) {
    const variant = document.querySelector("#quick-variant")?.value;
    addToCart(quickAdd.getAttribute("data-quick-add"), variant, quickViewState.quantity);
    closeAllLayers();
    setLayerOpen("#cart-drawer", true);
    return;
  }
  const cartIncrease = target.closest("[data-cart-increase]");
  if (cartIncrease) {
    updateCartLine(cartIncrease.getAttribute("data-cart-increase"), cartIncrease.getAttribute("data-variant"), 1);
    return;
  }
  const cartDecrease = target.closest("[data-cart-decrease]");
  if (cartDecrease) {
    updateCartLine(cartDecrease.getAttribute("data-cart-decrease"), cartDecrease.getAttribute("data-variant"), -1);
    return;
  }
  const cartRemove = target.closest("[data-cart-remove]");
  if (cartRemove) {
    removeCartLine(cartRemove.getAttribute("data-cart-remove"), cartRemove.getAttribute("data-variant"));
    return;
  }
  const quickImage = target.closest("[data-quick-image]");
  if (quickImage) {
    const gallery = document.querySelector(".quick-view-v2__images");
    gallery?.scrollTo({ left: gallery.clientWidth * Number(quickImage.getAttribute("data-quick-image")), behavior: "smooth" });
    return;
  }
  const pdpThumb = target.closest("[data-pdp-thumb]");
  if (pdpThumb) {
    const index = Number(pdpThumb.getAttribute("data-pdp-thumb"));
    const gallery = document.querySelector("#pdp-images");
    gallery?.scrollTo({ left: gallery.clientWidth * index, behavior: "smooth" });
    document.querySelectorAll("[data-pdp-thumb]").forEach((button) => button.classList.toggle("is-active", button === pdpThumb));
    return;
  }
  const pdpQty = target.closest("[data-pdp-qty]");
  if (pdpQty) {
    pdpQuantity = Math.max(1, pdpQuantity + Number(pdpQty.getAttribute("data-pdp-qty")));
    document.querySelector("#pdp-quantity").textContent = String(pdpQuantity);
    updatePdpWhatsapp();
    return;
  }
  const pdpAdd = target.closest("[data-pdp-add]");
  if (pdpAdd) {
    const product = productMap.get(pdpAdd.getAttribute("data-pdp-add"));
    addToCart(product.id, document.querySelector("#pdp-variant")?.value, pdpQuantity);
    setLayerOpen("#cart-drawer", true);
    return;
  }
  const recent = target.closest("[data-recent-search]");
  if (recent) {
    const value = recent.getAttribute("data-recent-search");
    const input = document.querySelector("#drawer-search");
    if (input) input.value = value;
    renderSearch(value);
  }
});

document.addEventListener("input", (event) => {
  if (event.target?.matches?.("#drawer-search")) renderSearch(event.target.value);
});

document.addEventListener("change", (event) => {
  if (event.target?.matches?.("#quick-variant")) updateQuickViewWhatsapp();
  if (event.target?.matches?.("#pdp-variant")) updatePdpWhatsapp();
});

document.addEventListener("keydown", (event) => {
  trapFocus(event);
  if (event.key === "Escape") closeAllLayers();
  if (event.target?.matches?.("#drawer-search") && event.key === "Enter") {
    const value = event.target.value.trim();
    if (value) {
      recentSearches = [value, ...recentSearches.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 5);
      localStorage.setItem("shivara-recent-searches", JSON.stringify(recentSearches));
    }
  }
});

ensureSharedChrome();
ensureGlobalLayers();
startAnnouncementRotation();
renderHome();
renderCollection();
renderProductPage();
renderCart();
renderWishlist();
