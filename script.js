(() => {
  "use strict";

  const catalogApi = window.ShivaraCatalog;
  const cardRenderer = window.ShivaraStorefrontRenderer;
  const mediaHref = typeof cardRenderer?.mediaHref === "function"
    ? cardRenderer.mediaHref
    : (src) => `/${String(src || "").replace(/^\/+/, "")}`;
  if (!catalogApi || !cardRenderer) {
    console.error("[Shivara] Curated catalogue failed to load. Commerce has been disabled.");
    document.querySelector("#main")?.insertAdjacentHTML("afterbegin", '<div class="stable-shop-unavailable" role="alert"><strong>The Shivara shop is temporarily unavailable.</strong><span>Please contact support for assistance.</span></div>');
    document.querySelectorAll("[data-card-add], [data-pdp-add], [data-quick-add]").forEach((control) => {
      control.disabled = true;
    });
    document.documentElement.classList.add("catalogue-unavailable");
    return;
  }
  const products = catalogApi.getAllProducts();
  const productMap = new Map();
  products.forEach((p) => {
    productMap.set(p.id, p);
    if (p.slug) productMap.set(p.slug, p);
    if (p.sourcePostId) productMap.set(p.sourcePostId, p);
    if (p.sku) productMap.set(p.sku, p);
  });
  const storageKeys = {
    cart: "shivara-cart-v3",
    cartNote: "shivara-cart-note-v1",
    wishlist: "shivara-wishlist-v3",
    recent: "shivara-recent-v2",
    legacyCart: "shivara-cart-v2",
    legacyWishlist: "shivara-wishlist-v2",
    coupon: "shivara-applied-coupon-v1",
    customer: "shivara-customer-session-v1"
  };
  const allowedBadges = new Set(["New", "Best Seller", "Limited", "Low Stock", "Sale", "Exclusive"]);
  const categoryMeta = {
    all: { title: "All products", kicker: "THE COMPLETE CATALOGUE", description: "Every Shivara product that has been manually reviewed for catalogue accuracy." },
    earrings: { title: "Earrings", kicker: "THE FINAL TOUCH", description: "Curated Shivara earrings with transparent pricing and availability states." },
    necklaces: { title: "Necklaces", kicker: "THE NECKLINE EDIT", description: "Shivara necklaces selected from explicitly identified product posts." },
    neckwear: { title: "Neck Wear", kicker: "THE NECKLINE EDIT", description: "Shivara necklaces and pendants selected for everyday luxury." },
    pendants: { title: "Pendants", kicker: "EVERYDAY NECK WEAR", description: "Curated pendants for everyday styling and gifting." },
    bracelets: { title: "Bracelets", kicker: "THE WRIST EDIT", description: "Bracelets and bangles, each classified and priced individually." },
    rings: { title: "Rings", kicker: "THE RING EDIT", description: "Statement and gift-ready rings with options confirmed product by product." },
    "evil-eye": { title: "Evil Eye", kicker: "THE PROTECTION EDIT", description: "Products explicitly classified in Shivara's evil-eye collection." },
    "anti-tarnish": { title: "Anti Tarnish", kicker: "THE EVERYDAY EDIT", description: "Products explicitly included in Shivara's anti-tarnish collection." },
    gifting: { title: "Gifting", kicker: "THE GIFTING ROOM", description: "Gift-ready products with signature luxury velvet box packaging." },
    sets: { title: "Jewellery Sets", kicker: "THE COORDINATED EDIT", description: "Curated multi-piece jewellery sets with item-specific pricing." },
    "jewellery-sets": { title: "Jewellery Sets", kicker: "THE COORDINATED EDIT", description: "Curated multi-piece jewellery sets with item-specific pricing." },
    watches: { title: "Watches", kicker: "THE WATCH EDIT", description: "Watches kept separate from bracelet and ring collections." },
    "new-arrivals": { title: "New Arrivals", kicker: "JUST LANDED", description: "The latest products explicitly included in the curated catalogue." }
  };
  const categoryRail = [
    ["New Arrivals", "new-arrivals", "halo-gift-ring"],
    ["Earrings", "earrings", "butterfly-earring-edit"],
    ["Rings", "rings", "floral-statement-ring"],
    ["Bracelets", "bracelets", "geometric-boxed-bracelet"],
    ["Neck Wear", "necklaces", "butterfly-drop-necklace"],
    ["Evil Eye", "evil-eye", "blue-charm-evil-eye-bracelet"],
    ["Watches", "watches", "snake-chain-watch"],
    ["Jewellery Sets", "sets", "halo-gift-ring"],
    ["Anti Tarnish", "anti-tarnish", "boxed-evil-eye-bracelet"],
    ["Gifting", "gifting", "cluster-gift-ring"]
  ];
  const heroIds = ["boxed-evil-eye-bracelet", "floral-statement-ring", "tulip-pendant"];
  const announcements = [
    "PAN India express complimentary shipping",
    "Handcrafted 18K gold-plated anti-tarnish statement edits",
    "Concierge shopping & WhatsApp styling: +91 94570 41215"
  ];
  const rotationDelays = Object.freeze({
    announcement: 6000,
    hero: 8000,
    signature: 12000
  });

  const migratedCart = readVersionedItems(storageKeys.cart, storageKeys.legacyCart);
  const normalizedMigratedCart = normalizeCart(migratedCart);
  const wishlistItems = readVersionedItems(storageKeys.wishlist, storageKeys.legacyWishlist);
  let cart = normalizedMigratedCart;
  let cartNote = String(localStorage.getItem(storageKeys.cartNote) || "").slice(0, 240);
  const wishlist = new Set(wishlistItems.filter((id) => productMap.has(id)));
  if (migratedCart.length !== cart.length) console.info(`[Shivara] Discarded ${migratedCart.length - cart.length} invalid legacy cart item(s).`);
  if (wishlistItems.length !== wishlist.size) console.info(`[Shivara] Discarded ${wishlistItems.length - wishlist.size} invalid legacy wishlist item(s).`);
  saveStorage(storageKeys.cart, { version: 3, items: cart });
  saveStorage(storageKeys.wishlist, { version: 3, items: [...wishlist] });
  localStorage.removeItem(storageKeys.legacyCart);
  localStorage.removeItem(storageKeys.legacyWishlist);
  let recent = readStorage(storageKeys.recent, []).filter((id) => productMap.has(id)).slice(0, 8);
  let activeCoupon = readStorage(storageKeys.coupon, null);
  let customerSession = readStorage(storageKeys.customer, null);
  let activeLayer = null;
  let lastFocus = null;
  let quickState = { product: null, quantity: 1, image: 0 };
  let heroIndex = 0;
  let signatureIndex = 0;
  let announcementIndex = 0;
  let announcementTimer = 0;
  let heroTimer = 0;
  let signatureTimer = 0;
  let searchTimer = 0;
  let collectionVisible = 24;
  const liveCouponsMap = new Map();
  const liveInventoryMap = new Map();
  let liveCategoriesList = [];

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

  function readVersionedItems(key, legacyKey) {
    const current = readStorage(key, null);
    if (current?.version === 3 && Array.isArray(current.items)) return current.items;
    const legacy = readStorage(legacyKey, []);
    const items = Array.isArray(current) ? current : Array.isArray(legacy) ? legacy : [];
    if (items.length && typeof console !== "undefined") console.info(`[Shivara] Migrating ${items.length} legacy storefront item(s) to state version 3.`);
    return items;
  }

  function saveCart() {
    saveStorage(storageKeys.cart, { version: 3, items: cart });
  }

  function formatMoney(value) {
    const val = Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  }

  function pricing(product) {
    const hasValidPrice = product && Number.isFinite(Number(product.price)) && Number(product.price) > 0;
    const isConfirmed = hasValidPrice && product?.priceStatus === "confirmed";
    const rawPrice = hasValidPrice ? Number(product.price) : null;
    const compareAt = (product && rawPrice && product.compareAtPrice && Number(product.compareAtPrice) > rawPrice)
      ? Number(product.compareAtPrice)
      : null;
    const discount = (compareAt && rawPrice) ? Math.round(((compareAt - rawPrice) / compareAt) * 100) : 0;
    return {
      confirmed: isConfirmed,
      price: rawPrice,
      compareAt,
      discount,
      label: rawPrice ? formatMoney(rawPrice) : "Price upon request"
    };
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
    return product && product.isSoldOut !== true;
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
    return `<div class="${className}"><strong>${formatMoney(value.price)}</strong>${value.compareAt ? `<s>${formatMoney(value.compareAt)}</s><span>${value.discount}% off</span>` : ""}</div>`;
  }

  function productCard(product, index = 0) {
    return cardRenderer.renderProductCard(catalogApi, product, {
      index,
      isWishlisted: wishlist.has(product.id),
      origin: location.origin,
      context: "client shared product card renderer"
    });
  }

  function renderGrid(mount, source) {
    if (!mount) return;
    mount.innerHTML = source.filter((product) => catalogApi.validateCommerceObject(product, "renderGrid")).map(productCard).join("");
  }

  function renderAccountContent() {
    if (customerSession && customerSession.phone) {
      return `<div class="stable-account-profile">
        <div class="account-avatar">👑</div>
        <h3>Welcome, ${escapeHtml(customerSession.name || "Patron")}</h3>
        <p class="account-phone">📱 ${escapeHtml(customerSession.phone)}</p>
        ${customerSession.email ? `<p class="account-email">✉️ ${escapeHtml(customerSession.email)}</p>` : ""}
        <div class="account-details-box">
          <small>SAVED DELIVERY ADDRESS</small>
          <p>${escapeHtml(customerSession.address || "No address saved yet.")} ${customerSession.pincode ? `– PIN: ${escapeHtml(customerSession.pincode)}` : ""}</p>
        </div>
        <div class="account-actions-grid">
          <a href="/track-order.html" class="stable-button stable-button--dark">📦 Track Orders &amp; Receipts</a>
          <a href="/wishlist" class="stable-button stable-button--line">♡ View Wishlist (<span data-wishlist-count>${wishlist.size}</span>)</a>
          <a href="https://wa.me/919457041215?text=Hello%20Shivara%20Concierge,%20I%20need%20assistance%20with%20my%20account" target="_blank" rel="noreferrer" class="stable-button stable-button--plain">💬 WhatsApp Concierge</a>
        </div>
        <button type="button" data-account-logout class="account-logout-btn">Log Out</button>
      </div>`;
    }
    return `<div class="stable-account-login">
      <div class="account-login-header">
        <small>THE SHIVARA CONCIERGE</small>
        <h3>Patron Sign In</h3>
        <p>Access your personalized order history, saved addresses, and concierge styling.</p>
      </div>
      <form id="customer-login-form" class="account-form">
        <div class="form-row">
          <label for="acc-name"><span>Full Name</span><input type="text" id="acc-name" required placeholder="e.g. Radhika Sharma" /></label>
        </div>
        <div class="form-row">
          <label for="acc-phone"><span>Mobile Number <strong class="req">*</strong></span><input type="tel" id="acc-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" /></label>
        </div>
        <div class="form-row">
          <label for="acc-email"><span>Email Address <small>(Optional)</small></span><input type="email" id="acc-email" placeholder="e.g. radhika@example.com" /></label>
        </div>
        <button type="submit" class="stable-button stable-button--dark" style="width:100%; margin-top:8px;">Sign In to Shivara</button>
      </form>
      <div class="account-perks">
        <small>PATRON PRIVILEGES</small>
        <ul>
          <li>✨ 1-Click Express Checkout</li>
          <li>📦 Live PAN India GPS Tracking</li>
          <li>🎁 Early Access to Limited Edition Drops</li>
        </ul>
      </div>
    </div>`;
  }

  function sharedHeader() {
    const megaFeatures = [
      ["lavender-bloom-ring", "RINGS"],
      ["mint-butterfly-earrings", "EARRINGS"],
      ["green-coil-watch", "WATCHES"]
    ].map(([id, label]) => [productMap.get(id), label]).filter(([product]) => product);
    const accountLabel = customerSession ? (customerSession.name ? customerSession.name.split(" ")[0] : "Account") : "Sign In";
    return `<div class="stable-announcement"><span data-announcement-text>${announcements[0]}</span></div>
      <header class="stable-header">
        <button class="stable-header__menu" type="button" data-menu-open aria-label="Open menu">
          <span class="menu-icon" aria-hidden="true">☰</span>
          <span class="menu-label">Menu</span>
        </button>
        <a class="stable-logo" href="/" aria-label="Shivara home">SHIVARA<small>JEWELLERY ATELIER</small></a>
        <nav class="stable-nav" aria-label="Main navigation">
          <div class="stable-nav__mega-wrap">
            <button type="button" aria-haspopup="true">Shop</button>
            <div class="stable-nav__mega">
              <div class="stable-nav__mega-links">
                <small>SHOP THE CATALOGUE</small>
                <a href="/collections/all">View All Products</a>
                <a href="/collections/new-arrivals">New Arrivals</a>
                <a href="/collections/all?price=confirmed">Ready to Order</a>
                <a href="/collections/anti-tarnish">Anti Tarnish</a>
                <a href="/collections/gifting">Gifting Edit</a>
              </div>
              <div class="stable-nav__mega-categories">
                <small>BY CATEGORY</small>
                <a href="/collections/earrings">Earrings</a>
                <a href="/collections/rings">Rings</a>
                <a href="/collections/bracelets">Bracelets</a>
                <a href="/collections/neckwear">Neck Wear</a>
                <a href="/collections/evil-eye">Evil Eye</a>
                <a href="/collections/watches">Watches</a>
                <a href="/collections/jewellery-sets">Jewellery Sets</a>
              </div>
              <div class="stable-nav__mega-features">${megaFeatures.map(([product, label]) => `<a href="${productUrl(product)}"><img src="${escapeHtml(mediaHref(product.images[0]))}" alt="" /><span><small>${label}</small><strong>${escapeHtml(product.title)}</strong></span></a>`).join("")}</div>
            </div>
          </div>
          <a href="/collections/new-arrivals" data-nav-category="new-arrivals">New Arrivals</a>
          <a href="/collections/earrings" data-nav-category="earrings">Earrings</a>
          <a href="/collections/rings" data-nav-category="rings">Rings</a>
          <a href="/collections/bracelets" data-nav-category="bracelets">Bracelets</a>
          <a href="/collections/neckwear" data-nav-category="neckwear">Neck Wear</a>
          <a href="/collections/evil-eye" data-nav-category="evil-eye">Evil Eye</a>
          <a href="/collections/watches" data-nav-category="watches">Watches</a>
          <a href="/collections/jewellery-sets" data-nav-category="jewellery-sets">Sets</a>
          <a href="/track-order.html" class="stable-track-nav-link">Track Order</a>
        </nav>
        <div class="stable-header__actions">
          <button type="button" class="stable-header__btn stable-header__btn--icon" data-search-open aria-label="Search" title="Search">⌕</button>
          <a href="/track-order.html" class="stable-header__btn stable-header__btn--text">Track</a>
          <button type="button" data-account-open class="stable-header__btn stable-header__btn--account" aria-label="Account">👤 <span data-account-name>${escapeHtml(accountLabel)}</span></button>
          <a class="stable-header__btn stable-header__btn--wish stable-wish-link" href="/wishlist" aria-label="Wishlist">♡<span class="header-badge" data-wishlist-count>0</span></a>
          <button type="button" data-cart-open class="stable-header__btn stable-header__btn--bag" aria-label="Open bag"><span>Bag</span><span class="header-badge" data-cart-count>0</span></button>
        </div>
      </header>
      <div id="storefront-promo-strip" class="storefront-promo-strip" style="display:none;"></div>
      <nav class="stable-mobile-dock" aria-label="Mobile shopping navigation">
        <a href="/" class="stable-dock-item" aria-label="Home">
          <span class="dock-icon" aria-hidden="true">⌂</span>
          <span class="dock-label">Home</span>
        </a>
        <button type="button" class="stable-dock-item" data-menu-open aria-label="Explore categories">
          <span class="dock-icon" aria-hidden="true">☰</span>
          <span class="dock-label">Explore</span>
        </button>
        <button type="button" class="stable-dock-item" data-search-open aria-label="Search catalog">
          <span class="dock-icon" aria-hidden="true">⌕</span>
          <span class="dock-label">Search</span>
        </button>
        <a href="/wishlist" class="stable-dock-item" aria-label="Wishlist">
          <span class="dock-icon-wrap">
            <span class="dock-icon" aria-hidden="true">♡</span>
            <b class="dock-badge" data-wishlist-count>0</b>
          </span>
          <span class="dock-label">Wishlist</span>
        </a>
        <button type="button" class="stable-dock-item" data-cart-open aria-label="Shopping bag">
          <span class="dock-icon-wrap">
            <span class="dock-icon" aria-hidden="true">👜</span>
            <b class="dock-badge" data-cart-count>0</b>
          </span>
          <span class="dock-label">Bag</span>
        </button>
      </nav>`;
  }

  function sharedFooter() {
    const footerProduct = productMap.get("tulip-pendant");
    return `<footer class="stable-footer phase-footer">
      <section class="phase-footer__finale"><div><p>THE LOOK IS NEVER FINISHED</p><h2>Until the<br />jewellery is.</h2><a class="stable-button stable-button--light" href="/collections/all">Explore Collection</a></div><figure aria-hidden="true"><span></span><img src="${escapeHtml(mediaHref(footerProduct.images[0]))}" alt="" /></figure><strong aria-hidden="true">SHIVARA</strong></section>
      <div class="phase-footer__links">
        <div>
          <a class="stable-logo stable-logo--footer" href="/">SHIVARA<small>JEWELLERY ATELIER</small></a>
          <p>A curated statement jewellery atelier with PAN India express delivery and personalized concierge styling.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <a href="/collections/all">All Products</a>
          <a href="/collections/earrings">Earrings</a>
          <a href="/collections/rings">Rings</a>
          <a href="/collections/bracelets">Bracelets</a>
          <a href="/collections/neckwear">Neck Wear</a>
          <a href="/collections/evil-eye">Evil Eye</a>
          <a href="/collections/watches">Watches</a>
          <a href="/collections/jewellery-sets">Jewellery Sets</a>
          <a href="/collections/new-arrivals">New Arrivals</a>
          <a href="/wishlist">Wishlist</a>
        </div>
        <div>
          <strong>Orders &amp; Concierge</strong>
          <a href="/track-order.html">Track Your Order</a>
          <a href="tel:+919457041215">Call Concierge: +91 94570 41215</a>
          <a href="https://wa.me/919457041215" target="_blank" rel="noreferrer">WhatsApp Concierge</a>
          <a href="https://www.instagram.com/shivara.luxe" target="_blank" rel="noreferrer">Instagram @shivara.luxe</a>
          <span>PAN India Express Shipping</span>
        </div>
        <div>
          <strong>Policies</strong>
          <a href="/policies/shipping">Shipping &amp; Exchange</a>
          <a href="/policies/privacy">Privacy</a>
          <a href="/policies/terms">Terms of Service</a>
        </div>
      </div>
      <small>© ${new Date().getFullYear()} Shivara Luxe. All jewellery verified for catalogue authenticity.</small>
    </footer>`;
  }

  function layerShell() {
    const menuFeature = productMap.get("boxed-evil-eye-bracelet") || products[0];
    return `<div class="stable-backdrop" data-layer-close hidden></div>
      <aside class="stable-drawer stable-drawer--menu" id="menu-drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" aria-hidden="true">
        <div class="stable-layer__head"><div><small>JEWELLERY ATELIER</small><h2 id="menu-title">Shop Shivara</h2></div><button type="button" data-layer-close aria-label="Close menu">×</button></div>
        <div class="stable-menu-utility"><button type="button" data-menu-search>Search products <span>⌕</span></button><a href="/wishlist">Your wishlist <span data-wishlist-count>0</span></a><button type="button" data-account-open class="stable-menu-account">Patron Account <span>👤</span></button></div>
        <nav><small>SHOP BY CATEGORY</small>${categoryRail.map(([label, slug]) => `<a href="${collectionUrl(slug)}">${label}<span>${productsForCollection(slug).length}</span></a>`).join("")}<a href="/collections/all"><strong>All Products</strong><span>${products.length}</span></a><a href="/track-order.html" style="color:#c5a059; font-weight:600;"><strong>Track Order</strong><span>Live Status</span></a></nav>
        <a class="stable-menu-feature" href="${productUrl(menuFeature)}"><img src="${escapeHtml(mediaHref(menuFeature.images[0]))}" alt="${escapeHtml(menuFeature.imageAlt)}" /><span><small>THE SHIVARA EDIT</small><strong>${escapeHtml(menuFeature.title)}</strong><em>View product</em></span></a>
        <div class="stable-menu-help"><p>Need concierge assistance?</p><a href="tel:+919457041215">Call Concierge: +91 94570 41215</a></div>
      </aside>
      <aside class="stable-drawer stable-drawer--search" id="search-drawer" role="dialog" aria-modal="true" aria-labelledby="search-title" aria-hidden="true">
        <div class="stable-layer__head"><div><small>DISCOVER THE EDIT</small><h2 id="search-title">Search Shivara</h2></div><button type="button" data-layer-close aria-label="Close search">×</button></div>
        <label class="stable-search-box"><span class="visually-hidden">Search products</span><input id="stable-search" type="search" autocomplete="off" placeholder="Search rings, bracelets, pendants..." /><button type="button" data-search-clear aria-label="Clear search">×</button></label>
        <div class="stable-search-discovery" id="search-discovery"><div><span>Trending</span><button type="button" data-search-term="Rings">Rings</button><button type="button" data-search-term="Evil Eye">Evil Eye</button><button type="button" data-search-term="Earrings">Earrings</button><button type="button" data-search-term="Watches">Watches</button><button type="button" data-search-term="Gifting">Gifting</button></div><div><span>Shop by category</span><a href="/collections/earrings">Earrings</a><a href="/collections/rings">Rings</a><a href="/collections/bracelets">Bracelets</a><a href="/collections/neckwear">Neck Wear</a><a href="/collections/watches">Watches</a></div></div>
        <p class="stable-search-count" id="search-count" role="status" aria-live="polite"></p>
        <div class="stable-search-results" id="search-results"></div>
      </aside>
      <aside class="stable-drawer stable-drawer--account" id="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-title" aria-hidden="true">
        <div class="stable-layer__head"><div><small>THE SHIVARA PATRON</small><h2 id="account-title">Account</h2></div><button type="button" data-layer-close aria-label="Close account">×</button></div>
        <div class="stable-account-container" id="account-container">${renderAccountContent()}</div>
      </aside>
      <aside class="stable-drawer stable-drawer--cart" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true">
        <div class="stable-layer__head"><h2 id="cart-title">Your Bag <span data-cart-count>0</span></h2><button type="button" data-layer-close aria-label="Close bag">×</button></div>
        <div class="stable-cart-lines" id="cart-lines"></div><div class="stable-cart-footer" id="cart-footer"></div>
      </aside>
      <section class="stable-quick" id="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-title" aria-hidden="true"></section>
      <section class="stable-checkout-modal" id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" aria-hidden="true">
        <div class="luxury-checkout-card">
          <button class="stable-quick__close" type="button" data-layer-close aria-label="Close Checkout">×</button>
          <div class="checkout-header">
            <small>THE SHIVARA ATELIER</small>
            <h2 id="checkout-modal-title">Express Secure Checkout</h2>
            <p>Enter your shipping details. Cash on Delivery is currently the only available payment method.</p>
          </div>
          <div class="checkout-order-summary" id="checkout-order-summary"></div>
          <form class="checkout-form" id="checkout-details-form">
            <div class="form-row">
              <label for="cust-name"><span>Full Name <strong class="req">*</strong></span><input type="text" id="cust-name" required placeholder="e.g. Radhika Sharma" /></label>
            </div>
            <div class="form-row form-row--two">
              <label for="cust-phone"><span>Phone Number <strong class="req">*</strong></span><input type="tel" id="cust-phone" required placeholder="e.g. 9876543210" pattern="[0-9]{10}" maxlength="10" /></label>
              <label for="cust-email"><span>Email Address <small>(Optional)</small></span><input type="email" id="cust-email" placeholder="e.g. radhika@example.com" /></label>
            </div>
            <div class="form-row">
              <label for="cust-address"><span>Delivery Address <strong class="req">*</strong></span><textarea id="cust-address" required rows="2" placeholder="House/Flat No, Apartment/Street, Landmark"></textarea></label>
            </div>
            <div class="form-row form-row--three">
              <label for="cust-pincode"><span>PIN Code <strong class="req">*</strong></span><input type="text" id="cust-pincode" required placeholder="e.g. 110001" pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="postal-code" /></label>
              <label for="cust-city"><span>City</span><input type="text" id="cust-city" placeholder="City" /></label>
              <label for="cust-state"><span>State</span><input type="text" id="cust-state" placeholder="State" /></label>
            </div>
            <div id="pincode-status-msg" class="pincode-status-msg" style="display:none;" role="status"></div>
            <div class="form-row">
              <label for="cust-note"><span>Gift Message / Order Note <small>(Optional)</small></span><input type="text" id="cust-note" placeholder="Gift card message or delivery instructions" /></label>
            </div>
            <div class="payment-methods-box">
              <small>PAYMENT METHOD</small>
              <div class="payment-options">
                <div class="payment-option is-selected" aria-label="Cash on Delivery selected">
                  <div class="payment-option__content">
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Complimentary insured delivery · Pay upon arrival at doorstep</small>
                  </div>
                </div>
                <div class="payment-option payment-option--disabled" style="opacity:0.55; cursor:not-allowed; background:#faf8f5; border:1px dashed #d8cfc4;">
                  <div class="payment-option__content">
                    <strong>UPI &amp; Card Gateway</strong>
                    <small style="color:#8c827a;">Direct gateway launching soon · Use COD for ₹0-risk checkout</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="checkout-actions">
              <button type="submit" class="stable-button stable-button--dark checkout-submit-btn">
                <span>Place COD Order</span>
              </button>
              <button type="button" class="stable-button stable-button--plain" data-layer-close>Return to Bag</button>
            </div>
          </form>
        </div>
      </section>
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

  function advanceAnnouncement(direction = 1) {
    announcementIndex = (announcementIndex + direction + announcements.length) % announcements.length;
    renderAnnouncement();
  }

  function isVisibleInViewport(element) {
    if (!element) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  }

  function scheduleAnnouncementRotation() {
    window.clearTimeout(announcementTimer);
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    announcementTimer = window.setTimeout(() => {
      const bar = document.querySelector(".stable-announcement");
      if (isVisibleInViewport(bar) && !bar.matches(":hover") && !bar.contains(document.activeElement)) advanceAnnouncement();
      scheduleAnnouncementRotation();
    }, rotationDelays.announcement);
  }

  function scheduleHeroRotation() {
    window.clearTimeout(heroTimer);
    const hero = document.querySelector("[data-hero]");
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hero) return;
    heroTimer = window.setTimeout(() => {
      if (isVisibleInViewport(hero) && !hero.matches(":hover") && !hero.contains(document.activeElement)) renderHero(heroIndex + 1);
      scheduleHeroRotation();
    }, rotationDelays.hero);
  }

  function scheduleSignatureRotation() {
    window.clearTimeout(signatureTimer);
    const edit = document.querySelector(".signature-edit");
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !edit) return;
    signatureTimer = window.setTimeout(() => {
      if (isVisibleInViewport(edit) && !edit.matches(":hover") && !edit.contains(document.activeElement)) renderSignature(signatureIndex + 1);
      scheduleSignatureRotation();
    }, rotationDelays.signature);
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
    toast.innerHTML = product ? `<img src="${escapeHtml(mediaHref(product.images[0]))}" alt="" /><span>${escapeHtml(message)}</span>` : `<span>${escapeHtml(message)}</span>`;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function saveWishlist() {
    saveStorage(storageKeys.wishlist, { version: 3, items: [...wishlist] });
    updateCounts();
  }

  function syncWishlistControls() {
    document.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
      const saved = wishlist.has(button.dataset.wishlistToggle);
      button.classList.toggle("is-active", saved);
      button.setAttribute("aria-pressed", String(saved));
    });
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

  function addToCart(id, variantId = null, quantity = 1) {
    const product = productMap.get(id) || products.find((p) => p.id === id || p.slug === id || p.sourcePostId === id);
    if (!product || product.priceStatus === "unavailable" || !product.price || Number(product.price) <= 0) {
      showToast("Price for this piece is upon request. Contact concierge.");
      return false;
    }
    if (product.isSoldOut === true) {
      showToast("This item is currently sold out");
      return false;
    }
    const targetId = product.id;
    const variant = validVariant(product, variantId);
    if (product.variants.length && !variant) {
      showToast("Choose an available option");
      return false;
    }
    const normalizedVariant = variant?.id || null;
    const existing = cart.find((item) => item.id === targetId && item.variantId === normalizedVariant);
    if (existing) existing.qty += Math.max(1, Number(quantity) || 1);
    else cart.push({ id: targetId, variantId: normalizedVariant, qty: Math.max(1, Number(quantity) || 1) });
    saveCart();
    renderCart();
    updateCounts();
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.classList.remove("is-confirming");
      requestAnimationFrame(() => badge.classList.add("is-confirming"));
    });
    showToast(`${product.title} added to bag`, product);
    return true;
  }

  function updateLiveProducts(updatedList) {
    if (!Array.isArray(updatedList) || !updatedList.length) return;
    updatedList.forEach((item) => {
      const existing = productMap.get(item.id) || productMap.get(item.slug);
      const updated = existing ? { ...existing, ...item } : { ...item };
      productMap.set(updated.id, updated);
      if (updated.slug) productMap.set(updated.slug, updated);
      const idx = products.findIndex((p) => p.id === updated.id || (updated.slug && p.slug === updated.slug));
      if (idx !== -1) {
        products[idx] = updated;
      } else {
        products.unshift(updated);
      }
    });
    if (document.body.dataset.page === "home") {
      renderHome();
    }
    syncWishlistControls();
    updateCounts();
  }

  document.addEventListener("shivara:products-synced", (e) => {
    if (e.detail?.products) {
      updateLiveProducts(e.detail.products);
    }
  });

  function calculateDiscount(subtotal) {
    if (!activeCoupon) return 0;
    if (activeCoupon.minOrderValue && subtotal < activeCoupon.minOrderValue) return 0;
    if (activeCoupon.discountType === "percent") {
      let discount = Math.round((subtotal * (Number(activeCoupon.discountValue) || 10)) / 100);
      if (activeCoupon.maxDiscount && discount > activeCoupon.maxDiscount) discount = activeCoupon.maxDiscount;
      return discount;
    }
    return Math.min(subtotal, Number(activeCoupon.discountValue) || 0);
  }

  function cartSummary() {
    const rawSubtotal = cart.reduce((sum, item) => {
      const product = productMap.get(item.id);
      const value = pricing(product);
      return sum + (Number(value.price) || 0) * item.qty;
    }, 0);
    const discount = calculateDiscount(rawSubtotal);
    const finalTotal = Math.max(0, rawSubtotal - discount);
    return {
      confirmedTotal: finalTotal,
      subtotal: rawSubtotal,
      discount,
      coupon: activeCoupon
    };
  }

  async function applyCouponCode(code) {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) {
      showToast("Please enter a promo code");
      return;
    }
    const summary = cartSummary();

    // 1. Check live in-memory realtime coupons map (SSOT)
    let c = liveCouponsMap.get(clean);

    // 2. Direct Firestore fallback check if listener hasn't received snapshot yet
    if (!c) {
      try {
        const { db } = await import("/src/firebase.js");
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
        const couponSnap = await getDoc(doc(db, "coupons", clean));
        if (couponSnap.exists()) {
          const cData = couponSnap.data();
          c = { code: clean, ...cData };
          liveCouponsMap.set(clean, c);
        }
      } catch (fsErr) {
        console.warn("[Storefront] Firestore coupon check note:", fsErr);
      }
    }

    // 3. Strict verification: must exist and have isActive === true
    if (!c || c.isActive === false) {
      showToast("Invalid or inactive promo code");
      return;
    }

    const minVal = Number(c.minOrderValue || 0);
    if (minVal > 0 && summary.subtotal < minVal) {
      showToast(`Coupon ${clean} requires minimum order value of ₹${minVal}`);
      return;
    }

    activeCoupon = c;
    saveStorage(storageKeys.coupon, activeCoupon);
    renderCart();
    const disc = cartSummary().discount;
    showToast(`Coupon ${clean} applied! You saved ${formatMoney(disc)}`);
  }

  function removeCoupon() {
    activeCoupon = null;
    localStorage.removeItem(storageKeys.coupon);
    renderCart();
    showToast("Promo code removed");
  }

  function updateAccountBadge() {
    const accountLabel = customerSession ? (customerSession.name ? customerSession.name.split(" ")[0] : "Account") : "Sign In";
    document.querySelectorAll("[data-account-name]").forEach((el) => {
      el.textContent = accountLabel;
    });
    const container = document.querySelector("#account-container");
    if (container) container.innerHTML = renderAccountContent();
  }

  function renderCart() {
    const lines = document.querySelector("#cart-lines");
    const footer = document.querySelector("#cart-footer");
    if (!lines || !footer) return;
    if (!cart.length) {
      const activeOffers = Array.from(liveCouponsMap.values()).filter(c => c.isActive !== false);
      const emptyOffersHtml = activeOffers.length > 0 ? `
        <div class="cart-promo-offers" id="cart-promo-offers" style="margin-top:16px; padding:12px; background:#faf7f2; border:1px dashed #d4af37; border-radius:6px; text-align:left;">
          <div style="font-size:10px; font-weight:700; color:#8c6d23; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">✨ Available Offers</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${activeOffers.map(c => `
              <div class="cart-promo-card" data-coupon-card="${escapeHtml(c.code)}" style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:6px 10px; border-radius:4px; border:1px solid #ebd8b5;">
                <div>
                  <strong style="color:#1a1512; font-family:monospace; font-size:12px;">${escapeHtml(c.code)}</strong>
                  <span style="color:#666; font-size:11px; margin-left:4px;">${c.discountType === 'percent' ? `Get ${c.discountValue}% off` : `Flat ₹${c.discountValue} off`}${c.minOrderValue ? ` on orders above ₹${c.minOrderValue}` : ''}</span>
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="btn-copy-code" data-copy-coupon="${escapeHtml(c.code)}" style="background:transparent; border:1px solid #d4af37; color:#8c6d23; font-size:10px; font-weight:600; padding:2px 6px; border-radius:3px; cursor:pointer;">Copy Code</button>
                  <button type="button" class="btn-apply-code" data-apply-coupon="${escapeHtml(c.code)}" style="background:#1a1512; border:none; color:#fff; font-size:10px; font-weight:600; padding:2px 8px; border-radius:3px; cursor:pointer;">Apply</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : "";

      lines.innerHTML = `<div class="stable-empty"><h3>Your bag is empty</h3><p>Start with the curated catalogue.</p>${emptyOffersHtml}</div>`;
      footer.innerHTML = `<button class="stable-button stable-button--dark" type="button" data-layer-close>Continue Shopping</button>`;
      updateCounts();
      return;
    }
    const renderLine = (item) => {
      const product = productMap.get(item.id);
      const variant = validVariant(product, item.variantId);
      const value = pricing(product);
      return `<article class="stable-cart-line">
        <img src="${escapeHtml(mediaHref(product.images[0]))}" alt="${escapeHtml(product.imageAlt)}" />
        <div><a href="${productUrl(product)}">${escapeHtml(product.title)}</a><small>${escapeHtml(product.sku)}${variant ? ` · ${escapeHtml(variant.label)}` : ""}</small><span class="stable-cart-line__mode">Unit price ${formatMoney(value.price)}</span><strong>Line total ${formatMoney(value.price * item.qty)}</strong>
        <div class="stable-qty"><button type="button" data-cart-delta="-1" data-cart-id="${product.id}" data-variant-id="${variant?.id || ""}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-delta="1" data-cart-id="${product.id}" data-variant-id="${variant?.id || ""}" aria-label="Increase quantity">+</button></div>
        <div class="stable-cart-line__links"><button type="button" data-cart-wishlist="${product.id}" data-variant-id="${variant?.id || ""}">Move to Wishlist</button><button class="stable-remove" type="button" data-cart-remove="${product.id}" data-variant-id="${variant?.id || ""}">Remove</button></div></div>
      </article>`;
    };
    const summary = cartSummary();

    const targetGiftBox = 999;
    const currentSubtotal = summary.subtotal || 0;
    const giftDiff = Math.max(0, targetGiftBox - currentSubtotal);
    const giftPercent = Math.min(100, Math.round((currentSubtotal / targetGiftBox) * 100));
    const giftBarHtml = `<div class="luxury-packaging-bar">
      <div class="luxury-packaging-text">
        <span>🎁 ${giftDiff > 0 ? `Add <strong>${formatMoney(giftDiff)}</strong> more for Complimentary Velvet Gift Box &amp; Delivery` : `<strong>✓ Unlocked:</strong> Complimentary Velvet Gift Box &amp; Delivery`}</span>
        <small>${giftPercent}%</small>
      </div>
      <div class="luxury-packaging-track"><div class="luxury-packaging-fill" style="width: ${giftPercent}%;"></div></div>
    </div>`;

    lines.innerHTML = `${giftBarHtml}<div class="stable-cart-group">${cart.map(renderLine).join("")}</div>`;
    const complement = catalogApi.getRelatedProducts(productMap.get(cart[0].id)).find((product) => !cart.some((item) => item.id === product.id));

    const activeOffers = Array.from(liveCouponsMap.values()).filter(c => c.isActive !== false);
    const promoOffersHtml = (!activeCoupon && activeOffers.length > 0) ? `
      <div class="cart-promo-offers" id="cart-promo-offers" style="margin-top:10px; padding:10px 12px; background:#faf7f2; border:1px dashed #d4af37; border-radius:6px;">
        <div style="font-size:10px; font-weight:700; color:#8c6d23; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">✨ Available Offers</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${activeOffers.map(c => `
            <div class="cart-promo-card" data-coupon-card="${escapeHtml(c.code)}" style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:6px 10px; border-radius:4px; border:1px solid #ebd8b5;">
              <div>
                <strong style="color:#1a1512; font-family:monospace; font-size:12px;">${escapeHtml(c.code)}</strong>
                <span style="color:#666; font-size:11px; margin-left:4px;">${c.discountType === 'percent' ? `Get ${c.discountValue}% off` : `Flat ₹${c.discountValue} off`}${c.minOrderValue ? ` on orders above ₹${c.minOrderValue}` : ''}</span>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn-copy-code" data-copy-coupon="${escapeHtml(c.code)}" style="background:transparent; border:1px solid #d4af37; color:#8c6d23; font-size:10px; font-weight:600; padding:2px 6px; border-radius:3px; cursor:pointer;">Copy Code</button>
                <button type="button" class="btn-apply-code" data-apply-coupon="${escapeHtml(c.code)}" style="background:#1a1512; border:none; color:#fff; font-size:10px; font-weight:600; padding:2px 8px; border-radius:3px; cursor:pointer;">Apply</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : "";

    const couponDockHtml = activeCoupon ? `
      <div class="cart-coupon-applied">
        <div>
          <span class="coupon-tag">🏷️ ${escapeHtml(activeCoupon.code)}</span>
          <small>Saved ${formatMoney(summary.discount)}</small>
        </div>
        <button type="button" data-coupon-remove class="coupon-remove-btn">Remove</button>
      </div>` : `
      <div class="cart-coupon-box">
        <input type="text" id="cart-coupon-input" placeholder="Promo code (e.g. WELCOME10)" autocomplete="off" />
        <button type="button" id="cart-coupon-apply" class="stable-button stable-button--dark">Apply</button>
      </div>
      ${promoOffersHtml}`;

    footer.innerHTML = `
      ${complement ? `<article class="stable-cart-complement"><img src="${escapeHtml(mediaHref(complement.images[0]))}" alt="" /><div><small>COMPLETE THE EDIT</small><strong>${escapeHtml(complement.title)}</strong>${priceMarkup(complement, "stable-search-price")}</div><button type="button" data-quick-view="${complement.id}">View</button></article>` : ""}
      <label class="stable-cart-note"><span>Order note or gifting request <small>Optional</small></span><textarea data-cart-note maxlength="240" rows="2" placeholder="Gift message, preferred delivery date, or anything Shivara should know">${escapeHtml(cartNote)}</textarea></label>
      <div class="cart-coupon-section">${couponDockHtml}</div>
      <div class="stable-cart-total-breakdown">
        <div class="cart-breakdown-row"><span>Subtotal</span><span>${formatMoney(summary.subtotal)}</span></div>
        ${summary.discount > 0 ? `<div class="cart-breakdown-row cart-discount-row"><span>Discount (${escapeHtml(activeCoupon?.code || "Promo")})</span><span style="color:#1f6b3b; font-weight:600;">-${formatMoney(summary.discount)}</span></div>` : ""}
        <div class="cart-breakdown-row"><span>Express Delivery</span><span style="color:#1f6b3b; font-weight:600;">FREE</span></div>
        <div class="cart-breakdown-row cart-total-row"><strong>Payable Total</strong><strong style="color:var(--stable-rose,#d8b36a); font-size:18px;">${formatMoney(summary.confirmedTotal)}</strong></div>
      </div>
      <div class="stable-cart-service"><span>✓ 100% Anti-Tarnish Lifetime Warranty</span><span>✓ Handcrafted Luxury Finish</span><span>✓ Verified atelier pieces</span></div>
      <button class="stable-button stable-button--dark" type="button" data-open-checkout>Proceed to Checkout</button>
      <button class="stable-button stable-button--plain" type="button" data-layer-close>Continue Shopping</button>`;
    updateCounts();
  }

  function openCheckoutModal() {
    if (!cart.length) {
      showToast("Your bag is empty");
      return;
    }
    const summary = cartSummary();
    const summaryEl = document.querySelector("#checkout-order-summary");
    if (summaryEl) {
      const itemsHtml = cart.map((item) => {
        const product = productMap.get(item.id);
        const variant = validVariant(product, item.variantId);
        const value = pricing(product);
        const priceStr = formatMoney(value.price * item.qty);
        return `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
          <span><strong>${item.qty}×</strong> ${escapeHtml(product?.title || "Item")}${variant ? ` <small>(${escapeHtml(variant.label)})</small>` : ""}</span>
          <strong>${priceStr}</strong>
        </div>`;
      }).join("");

      const discountRow = summary.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#1f6b3b; margin-bottom:6px;">
          <span>Coupon Discount (${escapeHtml(activeCoupon.code)}):</span>
          <strong>-${formatMoney(summary.discount)}</strong>
        </div>` : "";

      summaryEl.innerHTML = `<div style="margin-bottom:10px; border-bottom:1px dashed rgba(180,130,60,0.3); padding-bottom:8px;">${itemsHtml}</div>
        ${discountRow}
        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700;">
          <span>Payable Total:</span>
          <strong style="color:var(--stable-rose,#d8b36a); font-size:16px;">${formatMoney(summary.confirmedTotal)}</strong>
        </div>`;
    }

    try {
      const saved = customerSession || JSON.parse(localStorage.getItem("shivara_customer_info") || "{}");
      if (saved.name && document.querySelector("#cust-name")) document.querySelector("#cust-name").value = saved.name;
      if (saved.phone && document.querySelector("#cust-phone")) document.querySelector("#cust-phone").value = saved.phone;
      if (saved.email && document.querySelector("#cust-email")) document.querySelector("#cust-email").value = saved.email;
      if (saved.address && document.querySelector("#cust-address")) document.querySelector("#cust-address").value = saved.address;
      if (saved.city && document.querySelector("#cust-city")) document.querySelector("#cust-city").value = saved.city;
      if (saved.state && document.querySelector("#cust-state")) document.querySelector("#cust-state").value = saved.state;
      if (saved.pincode && document.querySelector("#cust-pincode")) {
        document.querySelector("#cust-pincode").value = saved.pincode;
        if (String(saved.pincode).trim().length === 6) {
          handlePincodeAutofill(saved.pincode);
        }
      }
      if (cartNote && document.querySelector("#cust-note")) document.querySelector("#cust-note").value = cartNote;
    } catch {}

    closeLayer(false);
    openLayer("#checkout-modal");
  }

  function renderQuick(product) {
    if (!product) return;
    quickState = { product, quantity: 1, image: 0 };
    const value = pricing(product);
    const isSoldOut = product.isSoldOut === true;
    const addControl = isSoldOut
      ? `<button class="stable-button stable-button--dark" type="button" disabled aria-disabled="true" style="opacity:0.6; cursor:not-allowed;">Sold Out</button>`
      : `<button class="stable-button stable-button--dark" type="button" data-quick-add="${product.id}">Add to Bag</button>`;
    const distinctImages = [...new Set(product.images)];
    const gallery = distinctImages.map((image, index) => `<figure class="${index === 0 ? "is-active" : ""}" data-quick-media="${index}"><img src="${escapeHtml(mediaHref(image))}" alt="${index === 0 ? escapeHtml(product.imageAlt) : `${escapeHtml(product.title)} detail ${index + 1}`}" ${index ? "loading=\"lazy\"" : ""} /></figure>`).join("");
    const thumbs = distinctImages.length > 1 ? `<div class="stable-quick__thumbs">${distinctImages.map((image, index) => `<button class="${index === 0 ? "is-active" : ""}" type="button" data-quick-thumb="${index}" aria-label="View image ${index + 1}"><img src="${escapeHtml(mediaHref(image))}" alt="" /></button>`).join("")}</div>` : "";
    const badge = allowedBadges.has(product.badge) ? `<span class="stable-quick__badge">${escapeHtml(product.badge)}</span>` : "";
    const craftsmanshipBadgesHtml = `<div class="quick-craftsmanship-tags">
      <span class="spec-tag">🛡️ 100% Anti-Tarnish</span>
      <span class="spec-tag">✨ Handcrafted Artistry</span>
      <span class="spec-tag">🎁 Velvet Gift Box</span>
    </div>`;

    const modal = document.querySelector("#quick-view");
    modal.innerHTML = `<button class="stable-quick__close" type="button" data-layer-close aria-label="Close Quick View">×</button>
      <div class="stable-quick__stage"><div class="stable-quick__gallery">${gallery}</div>${thumbs}<span class="stable-quick__pagination">1 / ${distinctImages.length}</span></div>
      <div class="stable-quick__info">${badge}<p>${escapeHtml(categoryMeta[product.category]?.title || product.category)}</p><h2 id="quick-title">${escapeHtml(product.title)}</h2><small>SKU: ${escapeHtml(product.sku)}</small>${priceMarkup(product, "stable-quick__price")}${craftsmanshipBadgesHtml}<p>${escapeHtml(product.description)}</p>
      ${!isSoldOut ? '<div class="stable-qty"><button type="button" data-quick-qty="-1" aria-label="Decrease quantity">−</button><span id="quick-qty">1</span><button type="button" data-quick-qty="1" aria-label="Increase quantity">+</button></div>' : ""}
      <div class="stable-quick__actions">${addControl}<button class="stable-button stable-button--plain ${wishlist.has(product.id) ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}">♡ Save to Your Edit</button><a class="stable-button stable-button--plain" href="${productUrl(product)}">View Full Product</a></div><details><summary>Craftsmanship &amp; Specifications</summary><p><strong>Material:</strong> Premium Stainless Steel with 18K Luxury Gold PVD Plating<br><strong>Water Resistance:</strong> 100% Waterproof &amp; Sweatproof<br><strong>Skin Friendly:</strong> Hypoallergenic, Lead &amp; Nickel Free<br><strong>Warranty:</strong> Anti-Tarnish Lifetime Warranty Guarantee</p></details></div>`;
  }

  function openQuick(id, trigger) {
    const product = productMap.get(id);
    if (!product) return;
    renderQuick(product);
    openLayer("#quick-view", trigger);
  }

  function renderSearch(query = "") {
    const mount = document.querySelector("#search-results");
    if (!mount) return;
    const term = query.trim().toLowerCase();
    const matches = (term ? catalogApi.search(term) : catalogApi.getFeaturedProducts(6)).slice(0, 12);
    document.querySelector("#search-count").textContent = `${matches.length} ${matches.length === 1 ? "piece" : "pieces"}${term ? ` for “${query.trim()}”` : " selected for you"}`;
    mount.innerHTML = matches.length ? matches.map(productCard).join("") : `<div class="stable-empty"><p>No products match “${escapeHtml(query)}”.</p><a href="/collections/all">Browse the curated catalogue</a></div>`;
    document.querySelector("#search-discovery").hidden = Boolean(term);
  }

  function renderCategoryRail() {
    const mount = document.querySelector("#commerce-category-grid");
    if (!mount) return;
    mount.innerHTML = categoryRail.map(([label, slug, productId]) => {
      const product = productMap.get(productId);
      const count = productsForCollection(slug).length;
      return `<a href="${collectionUrl(slug)}"><span><img src="${escapeHtml(mediaHref(product.images[0]))}" alt="${escapeHtml(label)} collection" loading="lazy" /></span><strong>${escapeHtml(label)}</strong><small>${count} ${count === 1 ? "product" : "products"}</small></a>`;
    }).join("");
  }

  function renderLivingDeck() {
    const mount = document.querySelector("#living-product-deck");
    if (!mount) return;
    const deckIds = ["lavender-bloom-ring", "boxed-evil-eye-bracelet", "tulip-pendant"];
    mount.innerHTML = deckIds.map((id, index) => {
      const product = productMap.get(id);
      if (!catalogApi.validateCommerceObject(product, "living product deck")) return "";
      const value = pricing(product);
      return `<article class="living-card living-card--${index + 1}">
        <a class="living-card__media" href="${productUrl(product)}">
          <img src="${escapeHtml(mediaHref(product.images[0]))}" alt="${escapeHtml(product.imageAlt)}" loading="${index ? "lazy" : "eager"}" />
          <span>${String(index + 1).padStart(2, "0")}</span>
        </a>
        <div class="living-card__copy">
          <small>${escapeHtml(categoryMeta[product.category]?.kicker || product.category)}</small>
          <h3><a href="${productUrl(product)}">${escapeHtml(product.title)}</a></h3>
          <div><strong>${formatMoney(value.price || 499)}</strong></div>
          <button type="button" data-quick-view="${escapeHtml(product.id)}">Quick view <span aria-hidden="true">↗</span></button>
        </div>
      </article>`;
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
    mount.style.setProperty("--hero-progress", `${((heroIndex + 1) / heroIds.length) * 100}%`);
    mount.dataset.heroIndex = String(heroIndex);
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
    mount.innerHTML = `<a class="signature-edit__image" href="${productUrl(product)}"><img src="${escapeHtml(mediaHref(product.images[0]))}" alt="${escapeHtml(product.imageAlt)}" loading="lazy" /></a><div><small>${signatureIndex + 1} / ${signatureProducts.length} · ${escapeHtml(product.sku)}</small><h3>${escapeHtml(product.title)}</h3>${priceMarkup(product, "signature-edit__price")}<p>${escapeHtml(product.description)}</p><button class="stable-button stable-button--light" type="button" data-quick-view="${product.id}">Quick View</button></div>`;
  }

  function renderHome() {
    if (document.body.dataset.page !== "home") return;
    renderCategoryRail();
    renderLivingDeck();
    [
      ["new-arrivals", productsForCollection("new-arrivals").slice(0, 12)],
      ["all", products.slice(12, 24)],
      ["rings", productsForCollection("rings").slice(0, 8)],
      ["neck-wear", productsForCollection("necklaces").slice(0, 10)]
    ].forEach(([section, source]) => {
      const mount = document.querySelector(`[data-product-section="${section}"]`);
      if (!mount) return;
      const renderedIds = [...mount.querySelectorAll("[data-product-card]")].map((card) => card.dataset.productCard);
      const sourceIds = source.map((product) => product.id);
      const serverMarkupMatches = renderedIds.length === sourceIds.length && renderedIds.every((id, index) => id === sourceIds[index]);
      if (!serverMarkupMatches) renderGrid(mount, source);
    });
    syncWishlistControls();
    renderHero();
    renderSignature();
  }

  /* ─── Lightweight Stable Motion Engine ─── */
  function initialisePremiumMotion() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -4% 0px" });

      document.querySelectorAll(".category-rail-section, .living-deck, .home-products, .signature-edit, .stable-reassurance, .stable-editorial").forEach((section) => {
        section.classList.add("motion-reveal");
        observer.observe(section);
      });
    }
  }

  function collectionSlug() {
    const slug = location.pathname.split("/").filter(Boolean)[1] || "all";
    return categoryMeta[slug] ? slug : "all";
  }

  function collectionState() {
    const params = new URLSearchParams(location.search);
    return { sort: params.get("sort") || "featured", price: params.get("price") || "all", category: params.get("category") || "all", query: params.get("q") || "" };
  }

  function updateCollectionState(state, { replace = false } = {}) {
    collectionVisible = 24;
    const params = new URLSearchParams();
    if (state.sort !== "featured") params.set("sort", state.sort);
    if (state.price !== "all") params.set("price", state.price);
    if (state.category && state.category !== "all") params.set("category", state.category);
    if (state.query?.trim()) params.set("q", state.query.trim());
    history[replace ? "replaceState" : "pushState"]({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
    renderCollection();
  }

  function renderCollection({ hydrateServerMarkup = false } = {}) {
    if (document.body.dataset.page !== "collection") return;
    const slug = collectionSlug();
    const meta = categoryMeta[slug];
    const state = collectionState();
    let selected = productsForCollection(slug);
    if (state.price === "confirmed") selected = selected.filter((product) => pricing(product).confirmed);
    if (slug === "all" && state.category !== "all" && categoryMeta[state.category]) {
      selected = selected.filter((product) => product.category === state.category || (product.collections || []).includes(state.category));
    }
    if (state.query.trim()) {
      const query = state.query.trim().toLowerCase();
      selected = selected.filter((product) => [
        product.title,
        product.sku,
        product.category,
        ...(product.collections || [])
      ].some((value) => String(value || "").toLowerCase().includes(query)));
    }
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
    const collectionSearch = document.querySelector("#collection-search");
    if (collectionSearch && collectionSearch.value !== state.query) collectionSearch.value = state.query;
    document.querySelector("[data-collection-search-clear]")?.toggleAttribute("hidden", !state.query);
    document.querySelectorAll(".stable-collection-chips a").forEach((link) => {
      link.classList.toggle("is-active", link.pathname === location.pathname);
    });
    const categoryFilter = slug === "all" ? `<fieldset><legend>Product type</legend>${[["all", "All types"], ...Object.entries(categoryMeta).filter(([key]) => !["all", "new-arrivals"].includes(key)).map(([key, item]) => [key, item.title])].map(([value, label]) => `<label><input type="radio" name="category-filter" value="${value}" ${state.category === value ? "checked" : ""} />${label}</label>`).join("")}</fieldset>` : "";
    document.querySelector("#collection-filters").innerHTML = `${categoryFilter}<nav><strong>Collections</strong>${Object.entries(categoryMeta).map(([key, item]) => `<a class="${key === slug ? "is-active" : ""}" href="${collectionUrl(key)}">${item.title}<span>${productsForCollection(key).length}</span></a>`).join("")}</nav>`;
    const grid = document.querySelector("#collection-grid");
    const visible = selected.slice(0, collectionVisible);
    const renderedIds = [...grid.querySelectorAll("[data-product-card]")].map((card) => card.dataset.productCard);
    const selectedIds = visible.map((product) => product.id);
    const defaultState = state.sort === "featured" && state.price === "all" && state.category === "all";
    const serverMarkupMatches = renderedIds.length === selectedIds.length && renderedIds.every((id, index) => id === selectedIds[index]);
    if (!(hydrateServerMarkup && defaultState && serverMarkupMatches)) renderGrid(grid, visible);
    grid.hidden = !selected.length;
    const loadMore = document.querySelector("#collection-load-more");
    if (loadMore) {
      loadMore.hidden = visible.length >= selected.length;
      loadMore.textContent = `Load more products (${selected.length - visible.length} remaining)`;
    }
    document.querySelector("#collection-empty")?.remove();
    if (!selected.length) {
      const filtered = state.price !== "all" || state.category !== "all" || Boolean(state.query);
      grid.insertAdjacentHTML("afterend", `<div class="stable-empty" id="collection-empty"><h2>${filtered ? "No products match these filters" : "No products are currently available"}</h2><p>${filtered ? "Clear the active filters to see the complete curated collection." : "Explore the complete catalogue while this edit is updated."}</p>${filtered ? '<button class="stable-button stable-button--dark" type="button" data-clear-filters>Clear Filters</button>' : '<a href="/collections/all">Browse all products</a>'}</div>`);
    }
    syncWishlistControls();
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
    const related = catalogApi.getRelatedProducts(product, 5);
    const recentProducts = recent.filter((recentId) => recentId !== product.id).map((recentId) => productMap.get(recentId)).filter(Boolean).slice(0, 5);
    const serverPage = mount.querySelector(`[data-shared-product-page="${CSS.escape(product.id)}"]`);
    if (!serverPage) {
      mount.innerHTML = cardRenderer.renderProductPage(catalogApi, product, {
        related,
        recent: recentProducts,
        isWishlisted: wishlist.has(product.id),
        origin: location.origin,
        context: "client shared product page renderer"
      });
    } else if (recentProducts.length && !mount.querySelector("[data-recently-viewed]")) {
      const mobileBuy = mount.querySelector(".stable-mobile-buy");
      mobileBuy?.insertAdjacentHTML("beforebegin", `<section class="stable-products stable-products--pdp" data-recently-viewed><div class="stable-section-heading"><div><p>YOUR TRAIL</p><h2>Recently viewed</h2></div></div><div class="commerce-product-grid">${recentProducts.map(productCard).join("")}</div></section>`);
    }
    setupMobileBuyBar();
    setupPdpGallery();
    if (sessionStorage.getItem("shivara-transition-product") === product.id) {
      const destinationImage = mount.querySelector(".stable-pdp__gallery img");
      if (destinationImage) {
        destinationImage.style.viewTransitionName = `shivara-product-${product.id}`;
        setTimeout(() => { destinationImage.style.viewTransitionName = ""; }, 700);
      }
      sessionStorage.removeItem("shivara-transition-product");
    }
  }

  function setupMobileBuyBar() {
    const bar = document.querySelector(".stable-mobile-buy");
    const nativeActions = document.querySelector(".stable-pdp__actions");
    if (!bar || !nativeActions || bar.dataset.mobileBuyReady) return;
    bar.dataset.mobileBuyReady = "true";
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const mobile = matchMedia("(max-width: 767px)").matches;
      const actionsPassed = nativeActions.getBoundingClientRect().bottom < 0;
      const modalOpen = document.body.classList.contains("stable-modal-open");
      bar.classList.toggle("is-visible", mobile && actionsPassed && !modalOpen);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("shivara:modal-change", schedule);
    update();
  }

  function setupPdpGallery() {
    const gallery = document.querySelector("#pdp-gallery");
    if (!gallery || gallery.dataset.galleryReady) return;
    gallery.dataset.galleryReady = "true";
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const index = Math.max(0, Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth)));
      document.querySelectorAll("[data-pdp-thumb]").forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === index));
      const count = document.querySelector("[data-pdp-gallery-count]");
      if (count) count.textContent = `${index + 1} / ${gallery.children.length}`;
    };
    gallery.addEventListener("scroll", () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function pdpQuantity() {
    return Math.max(1, Number(document.querySelector("#pdp-qty")?.textContent || 1));
  }

  function selectedPdpVariant(product) {
    const id = document.querySelector('input[name="pdp-variant"]:checked')?.value;
    return validVariant(product, id);
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
    if (target.closest("[data-menu-open]")) return openLayer("#menu-drawer", target.closest("[data-menu-open]"));
    if (target.closest("[data-menu-search]")) {
      renderSearch();
      closeLayer(false);
      return openLayer("#search-drawer", document.querySelector(".stable-header [data-search-open]"));
    }
    if (target.closest("[data-search-open]")) {
      renderSearch();
      return openLayer("#search-drawer", target.closest("[data-search-open]"));
    }
    if (target.closest("[data-cart-open]")) {
      renderCart();
      return openLayer("#cart-drawer", target.closest("[data-cart-open]"));
    }
    if (target.closest("[data-account-open]")) {
      updateAccountBadge();
      return openLayer("#account-drawer", target.closest("[data-account-open]"));
    }
    if (target.closest("[data-account-logout]")) {
      customerSession = null;
      localStorage.removeItem(storageKeys.customer);
      updateAccountBadge();
      showToast("Signed out successfully.");
      return;
    }
    if (target.closest("#cart-coupon-apply")) {
      const input = document.querySelector("#cart-coupon-input");
      if (input) applyCouponCode(input.value);
      return;
    }
    const applyQuickCoupon = target.closest("[data-apply-coupon]");
    if (applyQuickCoupon) {
      const code = applyQuickCoupon.getAttribute("data-apply-coupon");
      const input = document.querySelector("#cart-coupon-input");
      if (input) input.value = code;
      applyCouponCode(code);
      return;
    }
    const copyQuickCoupon = target.closest("[data-copy-coupon]");
    if (copyQuickCoupon) {
      const code = copyQuickCoupon.getAttribute("data-copy-coupon");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
      const input = document.querySelector("#cart-coupon-input");
      if (input) input.value = code;
      showToast(`Coupon code ${code} copied!`);
      return;
    }
    if (target.closest("[data-coupon-remove]")) {
      removeCoupon();
      return;
    }
    if (target.closest("[data-open-checkout]")) {
      return openCheckoutModal();
    }
    if (target.closest("[data-layer-close]")) return closeLayer();
    if (target.closest("[data-account]")) {
      updateAccountBadge();
      return openLayer("#account-drawer", target.closest("[data-account]"));
    }
    if (target.closest("[data-clear-filters]")) return updateCollectionState({ sort: "featured", price: "all", category: "all", query: "" });
    const filterToggle = target.closest("[data-filter-toggle]");
    if (filterToggle) {
      const filters = document.querySelector("#collection-filters");
      const expanded = filterToggle.getAttribute("aria-expanded") === "true";
      filterToggle.setAttribute("aria-expanded", String(!expanded));
      filters?.classList.toggle("is-open", !expanded);
      return;
    }
    if (target.closest("[data-collection-search-clear]")) {
      updateCollectionState({ ...collectionState(), query: "" });
      document.querySelector("#collection-search")?.focus();
      return;
    }
    if (target.closest("[data-load-more]")) {
      collectionVisible += 24;
      renderCollection();
      return;
    }
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
      saveCart();
      renderCart();
      return;
    }
    const remove = target.closest("[data-cart-remove]");
    if (remove) {
      cart = cart.filter((line) => !(line.id === remove.dataset.cartRemove && (line.variantId || "") === remove.dataset.variantId));
      saveCart();
      renderCart();
      return;
    }
    const moveToWishlist = target.closest("[data-cart-wishlist]");
    if (moveToWishlist) {
      if (!wishlist.has(moveToWishlist.dataset.cartWishlist)) toggleWishlist(moveToWishlist.dataset.cartWishlist);
      cart = cart.filter((line) => !(line.id === moveToWishlist.dataset.cartWishlist && (line.variantId || "") === moveToWishlist.dataset.variantId));
      saveCart();
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
    const pdpQtyButton = target.closest("[data-pdp-qty]");
    if (pdpQtyButton) {
      const amount = Math.max(1, pdpQuantity() + Number(pdpQtyButton.dataset.pdpQty));
      document.querySelector("#pdp-qty").textContent = String(amount);
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
    if (event.target.matches("#collection-search")) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => updateCollectionState({ ...collectionState(), query: event.target.value }, { replace: true }), 180);
    }
    if (event.target.matches("[data-cart-note]")) {
      cartNote = event.target.value.slice(0, 240);
      localStorage.setItem(storageKeys.cartNote, cartNote);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("#collection-sort")) updateCollectionState({ ...collectionState(), sort: event.target.value });
    if (event.target.matches('input[name="price-filter"]')) updateCollectionState({ ...collectionState(), price: event.target.value });
    if (event.target.matches('input[name="category-filter"]')) updateCollectionState({ ...collectionState(), category: event.target.value });
  });

  document.addEventListener("keydown", (event) => {
    trapFocus(event);
    if (event.key === "Escape") closeLayer();
    if (activeLayer?.id === "search-drawer" && event.target.matches("#stable-search") && event.key === "ArrowDown") {
      event.preventDefault();
      activeLayer.querySelector("[data-product-card] a")?.focus();
    }
    if (activeLayer?.id === "search-drawer" && event.key === "Enter" && event.target.matches("#stable-search")) {
      activeLayer.querySelector("[data-product-card] a")?.click();
    }
    if (activeLayer?.id === "quick-view" && ["ArrowLeft", "ArrowRight"].includes(event.key) && quickState.product?.images.length > 1) {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const total = [...new Set(quickState.product.images)].length;
      quickState.image = (quickState.image + direction + total) % total;
      document.querySelectorAll("[data-quick-media]").forEach((media, index) => media.classList.toggle("is-active", index === quickState.image));
      document.querySelectorAll("[data-quick-thumb]").forEach((thumb, index) => thumb.classList.toggle("is-active", index === quickState.image));
      const pagination = document.querySelector(".stable-quick__pagination");
      if (pagination) pagination.textContent = `${quickState.image + 1} / ${total}`;
    }
  });

  document.addEventListener("submit", async (event) => {
    if (event.target && event.target.id === "customer-login-form") {
      event.preventDefault();
      const name = (document.querySelector("#acc-name")?.value || "").trim();
      const phone = (document.querySelector("#acc-phone")?.value || "").trim();
      const email = (document.querySelector("#acc-email")?.value || "").trim();
      if (!name || !phone) {
        showToast("Please enter your name and phone number.");
        return;
      }
      customerSession = { name, phone, email, address: "", pincode: "" };
      saveStorage(storageKeys.customer, customerSession);
      updateAccountBadge();
      showToast(`Welcome to Shivara Luxe, ${name}!`);
      return;
    }

    if (event.target && event.target.id === "checkout-details-form") {
      event.preventDefault();
      event.stopPropagation();

      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      const name = (document.querySelector("#cust-name")?.value || "").trim();
      let phone = (document.querySelector("#cust-phone")?.value || "").trim().replace(/\D/g, "");
      if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);
      if (phone.length === 11 && phone.startsWith("0")) phone = phone.slice(1);

      const email = (document.querySelector("#cust-email")?.value || "").trim();
      const address = (document.querySelector("#cust-address")?.value || "").trim();
      const pincode = (document.querySelector("#cust-pincode")?.value || "").trim();
      const city = (document.querySelector("#cust-city")?.value || "").trim();
      const state = (document.querySelector("#cust-state")?.value || "").trim();
      const note = (document.querySelector("#cust-note")?.value || "").trim();
      const paymentMethod = "COD";

      // Indian E-Commerce Checkout Validations
      if (!name || name.length < 2) {
        showToast("Please enter your full name.");
        document.querySelector("#cust-name")?.focus();
        return;
      }
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        showToast("Please enter a valid 10-digit Indian mobile number.");
        document.querySelector("#cust-phone")?.focus();
        return;
      }
      if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
        showToast("Please enter a valid 6-digit Indian PIN code.");
        document.querySelector("#cust-pincode")?.focus();
        return;
      }
      if (!address || address.length < 5) {
        showToast("Please enter complete delivery street address.");
        document.querySelector("#cust-address")?.focus();
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Please enter a valid email address.");
        document.querySelector("#cust-email")?.focus();
        return;
      }
      if (!cart.length) {
        showToast("Your shopping bag is empty.");
        return;
      }

      // Prevent duplicate order submissions
      if (submitBtn) {
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<span>Confirming Order...</span>";
      }

      try {
        const customerInfo = { name, phone, email, address, pincode, city, state, note: note || "" };
        localStorage.setItem("shivara_customer_info", JSON.stringify(customerInfo));
        if (!customerSession) {
          customerSession = customerInfo;
          saveStorage(storageKeys.customer, customerSession);
          updateAccountBadge();
        }
      } catch {}

      // Post to Trusted Backend Endpoint for Server-Side Verification & Atomic Transaction
      let confirmedOrder = null;
      let orderRef = null;
      try {
        const payload = {
          items: cart.map((item) => ({
            productId: item.id,
            variantId: item.variantId || null,
            quantity: Math.max(1, Number(item.qty) || 1)
          })),
          customer: {
            name,
            phone,
            email,
            address,
            pincode,
            city,
            state,
            note: note || ""
          },
          couponCode: activeCoupon?.code || null
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.ok && data.orderId) {
            confirmedOrder = data.order;
            orderRef = confirmedOrder.orderId || confirmedOrder.id;
          }
        }
      } catch (err) {
        console.warn("[Checkout] Backend endpoint unavailable, falling back to direct Firestore order creation:", err);
      }

      // If backend was not reachable (e.g. static hosting without API rewrite), persist directly to Firestore
      if (!confirmedOrder) {
        try {
          const now = new Date();
          const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          orderRef = `SHV-${datePrefix}-${randomSuffix}`;

          const orderItems = cart.map((item) => {
            const product = productMap.get(item.id);
            const variant = validVariant(product, item.variantId);
            const val = pricing(product);
            return {
              productId: product.id,
              variantId: variant?.id || null,
              title: product.title,
              sku: product.sku,
              price: val.price,
              quantity: item.qty,
              lineTotal: val.price * item.qty,
              imageUrl: mediaHref(product.images[0])
            };
          });

          const summary = cartSummary();
          const customerInfo = { name, phone, email, address, pincode, city, state, note: note || "" };

          const orderDocument = {
            id: orderRef,
            orderId: orderRef,
            customer: customerInfo,
            customerInfo: customerInfo,
            customerName: name,
            customerPhone: phone,
            customerEmail: email || "",
            shippingAddress: address,
            pincode: pincode,
            city: city || "",
            state: state || "",
            orderNote: note || "",
            shippingDetails: customerInfo,
            items: orderItems,
            itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
            total: summary.confirmedTotal,
            totalAmount: summary.confirmedTotal,
            subtotal: summary.subtotal,
            discountAmount: summary.discount,
            appliedCoupon: activeCoupon?.code || null,
            paymentMethod: "COD",
            paymentStatus: "Pending COD Collection",
            status: "Pending",
            trackingNumber: null,
            courierPartner: null,
            createdAt: now.toISOString(),
            createdAtIso: now.toISOString()
          };

          const { db } = await import("/src/firebase.js");
          const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");

          await setDoc(doc(db, "orders", orderRef), {
            ...orderDocument,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          try {
            const maskedName = name ? `${name.charAt(0)}. ${name.split(" ").slice(1).join(" ").replace(/./g, "*") || "***"}` : "Customer";
            await setDoc(doc(db, "order_tracking", orderRef), {
              orderId: orderRef,
              status: "Pending",
              trackingNumber: null,
              courierPartner: null,
              createdAt: serverTimestamp(),
              createdAtIso: now.toISOString(),
              itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
              items: orderItems.map(i => ({
                title: i.title,
                quantity: i.quantity,
                price: i.price,
                imageUrl: i.imageUrl || "",
                sku: i.sku || ""
              })),
              total: summary.confirmedTotal,
              totalAmount: summary.confirmedTotal,
              city: city || "",
              state: state || "",
              pincode: pincode || "",
              customerName: maskedName,
              paymentMethod: "COD"
            });
          } catch (tErr) {
            console.warn("[Checkout] Tracking projection note:", tErr);
          }

          confirmedOrder = orderDocument;
        } catch (fErr) {
          console.error("[Checkout] Direct Firestore order placement error:", fErr);
          showToast(fErr.message || "Unable to complete order. Please try again.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText || "<span>Place COD Order</span>";
          }
          return;
        }
      }

      const finalOrderId = orderRef;

      // Save to localStorage for immediate receipt hydration
      // Note: Order document doc(db, "orders", orderRef) is created and synced by the trusted backend
      try {
        localStorage.setItem("shivara_recent_order", JSON.stringify({
          orderId: finalOrderId,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          totalAmount: confirmedOrder.totalAmount || confirmedOrder.total,
          items: confirmedOrder.items,
          customerInfo: confirmedOrder.customer || confirmedOrder.customerInfo,
          paymentMethod: "COD",
          status: "Pending"
        }));
      } catch {}

      // Clear the Cart on successful order placement
      cart.length = 0;
      saveCart();
      activeCoupon = null;
      localStorage.removeItem(storageKeys.coupon);
      updateCounts();
      renderCart();
      localStorage.removeItem(storageKeys.cart);

      closeLayer();
      window.location.href = `/order-confirmation.html?id=${encodeURIComponent(finalOrderId)}`;
      return;
    }

    const form = event.target.closest?.("[data-delivery-form]");
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector('input[name="pincode"]');
    const result = document.querySelector("[data-delivery-result]");
    const pincode = String(input?.value || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      input?.setAttribute("aria-invalid", "true");
      if (result) result.textContent = "Enter a valid 6-digit Indian pincode.";
      input?.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    if (result) result.innerHTML = `Shivara serves PAN India. Express complimentary delivery active for <strong>${escapeHtml(pincode)}</strong>.`;
  });

  /* ─── Indian Pincode Auto-Fill & Delivery Timeline Estimation ─── */
  let pincodeLookupAbort = null;

  async function handlePincodeAutofill(pinValue) {
    const cityInput = document.querySelector("#cust-city");
    const stateInput = document.querySelector("#cust-state");
    const statusMsg = document.querySelector("#pincode-status-msg");

    const cleanPin = String(pinValue || "").replace(/\D/g, "");

    if (cleanPin.length !== 6) {
      if (statusMsg) {
        statusMsg.style.display = "none";
        statusMsg.textContent = "";
        statusMsg.className = "pincode-status-msg";
      }
      return;
    }

    if (pincodeLookupAbort) {
      try { pincodeLookupAbort.abort(); } catch {}
    }
    pincodeLookupAbort = new AbortController();

    if (statusMsg) {
      statusMsg.style.display = "block";
      statusMsg.className = "pincode-status-msg pincode-status--loading";
      statusMsg.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;">⚡ Verifying PIN code &amp; fetching delivery timeline…</span>`;
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: pincodeLookupAbort.signal
      });
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();

      if (Array.isArray(data) && data[0]?.Status === "Success" && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const district = po.District || po.Name || "";
        const state = po.State || "";

        if (cityInput) cityInput.value = district;
        if (stateInput) stateInput.value = state;

        // Delivery Timeline Logic:
        // - Uttar Pradesh: "Estimated Delivery: 1-2 Days"
        // - Delhi, Maharashtra, Karnataka: "Estimated Delivery: 3-4 Days"
        // - All other states: "Estimated Delivery: 5-7 Days"
        let timeline = "Estimated Delivery: 5-7 Days";
        const stateLower = (state || "").trim().toLowerCase();
        if (stateLower === "uttar pradesh") {
          timeline = "Estimated Delivery: 1-2 Days";
        } else if (["delhi", "maharashtra", "karnataka"].includes(stateLower)) {
          timeline = "Estimated Delivery: 3-4 Days";
        }

        if (statusMsg) {
          statusMsg.style.display = "block";
          statusMsg.className = "pincode-status-msg pincode-status--success";
          statusMsg.innerHTML = `📍 <strong>${escapeHtml(district ? district + ", " : "")}${escapeHtml(state)}</strong> · <span class="pincode-timeline-badge">${timeline}</span>`;
        }
      } else {
        // Invalid PIN / No records found
        if (cityInput) cityInput.value = "";
        if (stateInput) stateInput.value = "";
        if (statusMsg) {
          statusMsg.style.display = "block";
          statusMsg.className = "pincode-status-msg pincode-status--error";
          statusMsg.textContent = "Invalid PIN";
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      if (cityInput) cityInput.value = "";
      if (stateInput) stateInput.value = "";
      if (statusMsg) {
        statusMsg.style.display = "block";
        statusMsg.className = "pincode-status-msg pincode-status--error";
        statusMsg.textContent = "Invalid PIN";
      }
    }
  }

  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "cust-pincode") {
      handlePincodeAutofill(e.target.value);
    }
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".stable-header");
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 20);
    }
  }, { passive: true });

  window.addEventListener("popstate", () => {
    collectionVisible = 24;
    renderCollection();
  });
  document.addEventListener("visibilitychange", () => {
    document.body.classList.toggle("stable-page-hidden", document.hidden);
    scheduleAnnouncementRotation();
    scheduleHeroRotation();
    scheduleSignatureRotation();
  });

  // ─────────────────────────────────────────────────────────────
  // UNIVERSAL STOREFRONT REALTIME SERVICE (FIRESTORE ONSNAPSHOT)
  // ─────────────────────────────────────────────────────────────
  let universalRealtimeInitialized = false;

  function updateProductDomRealtime(productId, patch) {
    const product = productMap.get(productId);
    if (!product) return;

    const liveStock = patch.stock !== undefined ? Number(patch.stock) : liveInventoryMap.get(product.sku || product.id);
    const isSoldOut = patch.isSoldOut !== undefined ? Boolean(patch.isSoldOut) : (liveStock !== undefined ? liveStock <= 0 : Boolean(product.isSoldOut));
    const currentPrice = patch.price !== undefined ? Number(patch.price) : Number(product.price || 499);
    const currentTitle = patch.title !== undefined ? patch.title : product.title;

    // 1. Update all product cards on the page
    const matchingCards = document.querySelectorAll(`article[data-product-card="${product.id}"], article[data-product-card="${product.slug}"]`);
    matchingCards.forEach((card) => {
      if (isSoldOut) {
        card.classList.add("is-sold-out");
        const media = card.querySelector(".stable-card__media");
        if (media && !media.querySelector(".stable-card__badge--sold-out")) {
          media.insertAdjacentHTML("beforeend", `<span class="stable-card__badge stable-card__badge--sold-out">SOLD OUT</span><div class="stable-card__sold-out-overlay" aria-hidden="true"><span>SOLD OUT</span></div>`);
        }
        const addBtn = card.querySelector(".stable-card__add");
        if (addBtn) {
          addBtn.disabled = true;
          addBtn.classList.add("stable-card__add--sold-out");
          addBtn.textContent = "Sold Out";
          addBtn.removeAttribute("data-card-add");
        }
      } else {
        card.classList.remove("is-sold-out");
        card.querySelector(".stable-card__badge--sold-out")?.remove();
        card.querySelector(".stable-card__sold-out-overlay")?.remove();
        const addBtn = card.querySelector(".stable-card__add");
        if (addBtn) {
          addBtn.disabled = false;
          addBtn.classList.remove("stable-card__add--sold-out");
          addBtn.textContent = "Add to Bag";
          addBtn.setAttribute("data-card-add", product.id);
        }
      }

      if (patch.price !== undefined) {
        const priceElem = card.querySelector(".stable-card__price strong");
        if (priceElem) priceElem.textContent = formatMoney(currentPrice);
        const bestPriceElem = card.querySelector(".stable-card__best-price strong");
        if (bestPriceElem) bestPriceElem.textContent = formatMoney(Math.round(currentPrice * 0.85));
      }

      if (patch.title !== undefined) {
        const titleElem = card.querySelector(".stable-card__title");
        if (titleElem) titleElem.textContent = currentTitle;
      }
    });

    // 2. Update PDP (Product Detail Page) if active
    const pdpContainer = document.querySelector(`[data-shared-product-page="${product.id}"], [data-shared-product-page="${product.slug}"]`);
    if (pdpContainer) {
      const availElem = pdpContainer.querySelector(".stable-pdp__meta span");
      if (availElem) {
        availElem.innerHTML = isSoldOut ? '<i aria-hidden="true"></i>Sold Out' : '<i aria-hidden="true"></i>In Stock · Available for Express Dispatch';
      }

      const pdpButtons = pdpContainer.querySelectorAll(".stable-pdp__actions button, .stable-mobile-buy button");
      pdpButtons.forEach((btn) => {
        if (btn.classList.contains("stable-button--dark")) {
          if (isSoldOut) {
            btn.disabled = true;
            btn.style.opacity = "0.6";
            btn.style.cursor = "not-allowed";
            btn.textContent = "Sold Out";
            btn.removeAttribute("data-pdp-add");
          } else {
            btn.disabled = false;
            btn.style.opacity = "";
            btn.style.cursor = "";
            btn.textContent = "Add to Bag";
            btn.setAttribute("data-pdp-add", product.id);
          }
        }
      });

      if (patch.price !== undefined) {
        pdpContainer.querySelectorAll(".stable-pdp__price strong, .stable-mobile-buy__price strong").forEach((el) => {
          el.textContent = formatMoney(currentPrice);
        });
      }

      if (patch.title !== undefined) {
        const h1 = pdpContainer.querySelector("h1[itemprop='name']");
        if (h1) h1.textContent = currentTitle;
      }
    }

    // 3. Update Quick View modal if active
    const quickModal = document.querySelector("#quick-view");
    if (quickModal && quickModal.classList.contains("is-open") && quickState.product?.id === product.id) {
      const quickAddBtn = quickModal.querySelector("[data-quick-add]");
      if (quickAddBtn) {
        if (isSoldOut) {
          quickAddBtn.disabled = true;
          quickAddBtn.textContent = "Sold Out";
        } else {
          quickAddBtn.disabled = false;
          quickAddBtn.textContent = "Add to Bag";
        }
      }
      if (patch.price !== undefined) {
        const qPrice = quickModal.querySelector(".stable-quick__price strong");
        if (qPrice) qPrice.textContent = formatMoney(currentPrice);
      }
    }

    // 4. Update cart maximum quantity & sold-out alerts
    const cartItem = cart.find(i => i.id === product.id);
    if (cartItem && isSoldOut) {
      const cartDrawer = document.querySelector("#cart-drawer");
      if (cartDrawer && cartDrawer.classList.contains("is-open")) {
        renderCart();
      }
    }
  }

  function renderStorefrontPromoStrip() {
    const strip = document.querySelector("#storefront-promo-strip");
    if (!strip) return;

    const activeList = Array.from(liveCouponsMap.values()).filter(c => c.isActive !== false);
    if (!activeList.length) {
      strip.style.display = "none";
      strip.innerHTML = "";
      return;
    }

    strip.style.display = "block";
    strip.innerHTML = `
      <div class="storefront-promo-strip__content" style="background: linear-gradient(90deg, #1f1b14 0%, #29241b 100%); border-bottom: 1px solid rgba(197, 160, 89, 0.35); padding: 7px 16px; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; font-size: 0.82rem; color: #f5ede1;">
        ${activeList.map(c => {
          const discountDesc = c.discountType === "percent"
            ? `${c.discountValue}% off`
            : `₹${c.discountValue} off`;
          const minText = Number(c.minOrderValue) > 0 ? ` on orders above ₹${c.minOrderValue}` : "";
          return `
            <div class="promo-strip-offer" data-coupon-strip="${escapeHtml(c.code)}" style="display:inline-flex; align-items:center; gap:8px;">
              <span style="background:#c5a059; color:#121212; font-weight:700; font-size:0.75rem; padding:2px 7px; border-radius:3px; letter-spacing:0.04em;">${escapeHtml(c.code)}</span>
              <span style="letter-spacing:0.02em;">Get <strong>${discountDesc}</strong>${minText}</span>
              <button type="button" class="promo-strip-copy-btn" data-copy-coupon="${escapeHtml(c.code)}" style="background:transparent; border:1px solid #c5a059; color:#c5a059; padding:2px 8px; border-radius:3px; font-size:0.72rem; font-weight:600; cursor:pointer; text-transform:uppercase; letter-spacing:0.05em; transition:all 0.2s ease;">Copy Code</button>
            </div>
          `;
        }).join('<span style="color:rgba(197,160,89,0.4); user-select:none;">•</span>')}
      </div>
    `;
  }

  function renderCategoriesNavigationRealtime(categoriesList) {
    const activeCats = (categoriesList || []).filter(c => c.isActive !== false);
    if (!activeCats.length) return;

    // 1. Update mega-menu categories
    const megaCatContainer = document.querySelector(".stable-nav__mega-categories");
    if (megaCatContainer) {
      megaCatContainer.innerHTML = `<small>BY CATEGORY</small>` + activeCats.map(c => `
        <a href="/collections/${escapeHtml(c.slug)}">${escapeHtml(c.name || c.title || c.slug)}</a>
      `).join("");
    }

    // 2. Update top navbar direct collection links
    const stableNav = document.querySelector(".stable-nav");
    if (stableNav) {
      categoriesList.forEach(c => {
        const slug = c.slug || c.id;
        const navLink = stableNav.querySelector(`a[data-nav-category="${slug}"], a[href="/collections/${slug}"]:not(.stable-nav__mega a)`);
        const shouldShow = c.isActive !== false && c.showInNav !== false;
        if (navLink) {
          navLink.style.display = shouldShow ? "" : "none";
          if (!navLink.hasAttribute("data-nav-category")) navLink.setAttribute("data-nav-category", slug);
        } else if (shouldShow) {
          const trackLink = stableNav.querySelector(".stable-track-nav-link");
          const newA = document.createElement("a");
          newA.href = `/collections/${slug}`;
          newA.setAttribute("data-nav-category", slug);
          newA.textContent = c.name || c.title || slug;
          if (trackLink) {
            stableNav.insertBefore(newA, trackLink);
          } else {
            stableNav.appendChild(newA);
          }
        }
      });
    }

    // 3. Update mobile drawer category navigation
    const drawerNav = document.querySelector("#menu-drawer nav");
    if (drawerNav) {
      const totalCount = products.length;
      drawerNav.innerHTML = `<small>SHOP BY CATEGORY</small>` + activeCats.map(c => {
        const slug = c.slug;
        const count = productsForCollection(slug).length;
        return `<a href="${collectionUrl(slug)}" data-drawer-category="${escapeHtml(slug)}">${escapeHtml(c.name || c.title || slug)}<span>${count}</span></a>`;
      }).join("") + `<a href="/collections/all"><strong>All Products</strong><span>${totalCount}</span></a><a href="/track-order.html" style="color:#c5a059; font-weight:600;"><strong>Track Order</strong><span>Live Status</span></a>`;
    }

    // 4. Update homepage category rail
    const railContainer = document.querySelector("#commerce-category-grid");
    if (railContainer) {
      const railCats = activeCats.filter(c => c.showInRail !== false);
      railContainer.innerHTML = railCats.map(c => {
        const slug = c.slug;
        const label = c.name || c.title || slug;
        const prod = productsForCollection(slug)[0] || products[0];
        const count = productsForCollection(slug).length;
        const imgUrl = c.image || (prod ? mediaHref(prod.images[0]) : "");
        return `<a href="${collectionUrl(slug)}" data-rail-category="${escapeHtml(slug)}">
          <span><img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(label)} collection" loading="lazy" /></span>
          <strong>${escapeHtml(label)}</strong>
          <small>${count} ${count === 1 ? "product" : "products"}</small>
        </a>`;
      }).join("");
    }
  }

  async function initUniversalRealtimeService() {
    if (universalRealtimeInitialized) return;
    universalRealtimeInitialized = true;

    try {
      const { db } = await import("/src/firebase.js");
      const { collection, doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");

      // ─── 1. REALTIME INVENTORY SUBSCRIPTION ───
      try {
        onSnapshot(collection(db, "inventory"), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const docId = change.doc.id;
            const sku = data?.sku || docId;
            const stock = Number(data?.stock || 0);
            const isSoldOut = Boolean(data?.isSoldOut || stock <= 0);

            liveInventoryMap.set(sku, stock);
            liveInventoryMap.set(docId, stock);

            // Find matching product in catalog
            const prod = products.find(p =>
              p.sku === sku || p.id === sku || p.slug === sku ||
              p.sku === docId || p.id === docId || p.slug === docId
            );
            if (prod) {
              liveInventoryMap.set(prod.id, stock);
              if (prod.slug) liveInventoryMap.set(prod.slug, stock);
              if (prod.sku) liveInventoryMap.set(prod.sku, stock);
              updateProductDomRealtime(prod.id, { stock, isSoldOut });
            }
          });
        }, (err) => {
          console.warn("[Realtime] Inventory listener note:", err.message);
        });
      } catch (invErr) {
        console.warn("[Realtime] Inventory setup error:", invErr);
      }

      // ─── 2. REALTIME PRODUCTS CATALOG SUBSCRIPTION ───
      try {
        onSnapshot(collection(db, "products"), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const prodId = change.doc.id;
            const prod = productMap.get(prodId) || products.find(p => p.id === prodId || p.slug === prodId);
            if (prod) {
              const patch = {};
              if (data.price !== undefined) patch.price = Number(data.price);
              if (data.title !== undefined) patch.title = data.title;
              if (data.isSoldOut !== undefined) patch.isSoldOut = Boolean(data.isSoldOut);
              updateProductDomRealtime(prod.id, patch);
            }
          });
        }, (err) => {
          console.warn("[Realtime] Products listener note:", err.message);
        });
      } catch (prodErr) {
        console.warn("[Realtime] Products setup error:", prodErr);
      }

      // ─── 3. REALTIME CATEGORIES TAXONOMY SUBSCRIPTION ───
      try {
        onSnapshot(collection(db, "categories"), (snapshot) => {
          const list = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, slug: docSnap.id, ...docSnap.data() });
          });
          list.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
          liveCategoriesList = list;
          renderCategoriesNavigationRealtime(list);
        }, (err) => {
          console.warn("[Realtime] Categories listener note:", err.message);
        });
      } catch (catErr) {
        console.warn("[Realtime] Categories setup error:", catErr);
      }

      // ─── 4. REALTIME COUPONS / PROMOTIONS SUBSCRIPTION ───
      try {
        onSnapshot(collection(db, "coupons"), (snapshot) => {
          liveCouponsMap.clear();
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const code = (data.code || docSnap.id).toUpperCase();
            liveCouponsMap.set(code, { ...data, code });
          });

          // Live coupon invalidation guard
          if (activeCoupon) {
            const currentLive = liveCouponsMap.get(activeCoupon.code.toUpperCase());
            if (!currentLive || currentLive.isActive === false) {
              const revokedCode = activeCoupon.code;
              activeCoupon = null;
              localStorage.removeItem(storageKeys.coupon);
              renderCart();
              showToast(`Promotion "${revokedCode}" is no longer active.`);
            }
          }

          // Update storefront promo strip live
          renderStorefrontPromoStrip();

          // If cart is currently visible, re-render offers
          const cartDrawer = document.querySelector("#cart-drawer");
          if (cartDrawer && cartDrawer.classList.contains("is-open")) {
            renderCart();
          }
        }, (err) => {
          console.warn("[Realtime] Coupons listener note:", err.message);
        });
      } catch (coupErr) {
        console.warn("[Realtime] Coupons setup error:", coupErr);
      }

      // ─── 5. REALTIME BANNERS & ANNOUNCEMENTS SUBSCRIPTION ───
      try {
        onSnapshot(doc(db, "banners", "config"), (docSnap) => {
          if (docSnap.exists()) {
            const bData = docSnap.data();
            if (Array.isArray(bData.announcements) && bData.announcements.length > 0) {
              announcements.length = 0;
              announcements.push(...bData.announcements);
              const node = document.querySelector("[data-announcement-text]");
              if (node && announcements.length > 0) {
                node.textContent = announcements[announcementIndex % announcements.length];
              }
            }
            if (bData.hero?.title) {
              const heroTitle = document.querySelector("[data-hero-title]");
              if (heroTitle) heroTitle.textContent = bData.hero.title;
            }
            if (bData.hero?.kicker) {
              const heroKicker = document.querySelector("[data-hero-kicker]");
              if (heroKicker) heroKicker.textContent = bData.hero.kicker;
            }
          }
        }, (err) => {
          console.warn("[Realtime] Banners listener note:", err.message);
        });
      } catch (banErr) {
        console.warn("[Realtime] Banners setup error:", banErr);
      }

      // ─── 6. REALTIME SETTINGS & CONCIERGE CONTACTS SUBSCRIPTION ───
      try {
        onSnapshot(doc(db, "admin_settings", "general"), (docSnap) => {
          if (docSnap.exists()) {
            const sData = docSnap.data();
            if (sData.whatsapp) {
              const cleanWa = String(sData.whatsapp).replace(/[^0-9]/g, "");
              if (cleanWa) {
                const fullWa = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;
                document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
                  link.href = link.href.replace(/wa\.me\/\d+/, `wa.me/${fullWa}`);
                });
              }
            }
            if (sData.phone) {
              document.querySelectorAll('a[href*="tel:"]').forEach(link => {
                link.href = `tel:${sData.phone.replace(/\s+/g, '')}`;
              });
            }
          }
        }, (err) => {
          console.warn("[Realtime] Settings listener note:", err.message);
        });
      } catch (setErr) {
        console.warn("[Realtime] Settings setup error:", setErr);
      }
    } catch (globalErr) {
      console.warn("[Realtime] Service initialization error:", globalErr);
    }
  }

  async function bootstrapStorefront() {
    if (!catalogApi.getAllProducts().length) throw new Error("Curated catalogue integrity check failed during bootstrap");
    renderChrome();
    scheduleAnnouncementRotation();
    renderHome();
    initialisePremiumMotion();
    scheduleHeroRotation();
    scheduleSignatureRotation();
    renderCollection({ hydrateServerMarkup: true });
    renderProductPage();
    renderWishlist();
    renderCart();
    syncWishlistControls();
    initUniversalRealtimeService().catch(() => {});
    document.dispatchEvent(new CustomEvent("shivara:storefront-ready", {
      detail: { catalogueVersion: catalogApi.version, productCount: products.length }
    }));
  }

  window.ShivaraStorefront = Object.freeze({
    addProducts(ids, { openBag = true } = {}) {
      const uniqueIds = [...new Set(Array.isArray(ids) ? ids : [])];
      const added = uniqueIds.filter((id) => addToCart(id, null, 1));
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
    showToast
  });

  window.bootstrapStorefront = bootstrapStorefront;
  bootstrapStorefront().catch((error) => {
    console.error("[Shivara] Storefront bootstrap failed", error);
    document.documentElement.classList.add("catalogue-unavailable");
  });
})();
