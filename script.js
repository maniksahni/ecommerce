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
    const val = Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 499;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  }

  function pricing(product) {
    const rawPrice = (product && Number.isFinite(Number(product.price)) && Number(product.price) > 0)
      ? Number(product.price)
      : 499;
    const compareAt = (product && product.compareAtPrice && Number(product.compareAtPrice) > rawPrice)
      ? Number(product.compareAtPrice)
      : null;
    const discount = compareAt ? Math.round(((compareAt - rawPrice) / compareAt) * 100) : 0;
    return {
      confirmed: true,
      price: rawPrice,
      compareAt,
      discount,
      label: formatMoney(rawPrice)
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
        <button class="stable-header__menu" type="button" data-menu-open aria-label="Open menu">☰</button>
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
          <a href="/collections/new-arrivals">New Arrivals</a>
          <a href="/collections/earrings">Earrings</a>
          <a href="/collections/rings">Rings</a>
          <a href="/collections/bracelets">Bracelets</a>
          <a href="/collections/neckwear">Neck Wear</a>
          <a href="/collections/evil-eye">Evil Eye</a>
          <a href="/collections/watches">Watches</a>
          <a href="/collections/jewellery-sets">Sets</a>
          <a href="/track-order.html" class="stable-track-nav-link" style="color:#c5a059; font-weight:600;">Track Order</a>
        </nav>
        <div class="stable-header__actions">
          <button type="button" data-search-open aria-label="Search">⌕</button>
          <a href="/track-order.html" class="stable-header-track" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; text-decoration:none; color:inherit; padding:6px 10px; border-radius:4px; border:1px solid rgba(0,0,0,0.1);">Track</a>
          <button type="button" data-account-open class="stable-header-account" aria-label="Account" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; padding:6px 10px; border-radius:4px; border:1px solid rgba(0,0,0,0.1); background:transparent; cursor:pointer; color:inherit;">👤 <span data-account-name>${escapeHtml(accountLabel)}</span></button>
          <a class="stable-wish-link" href="/wishlist" aria-label="Wishlist">♡<span data-wishlist-count>0</span></a>
          <button type="button" data-cart-open aria-label="Open bag">Bag <span data-cart-count>0</span></button>
        </div>
      </header>
      <nav class="stable-mobile-dock" aria-label="Mobile shopping navigation">
        <a href="/"><span aria-hidden="true">⌂</span><small>Home</small></a>
        <button type="button" data-menu-open><span aria-hidden="true">☰</span><small>Shop</small></button>
        <button type="button" data-search-open><span aria-hidden="true">⌕</span><small>Search</small></button>
        <a href="/track-order.html"><span aria-hidden="true">📦</span><small>Track</small></a>
        <button type="button" data-account-open><span aria-hidden="true">👤</span><small>Account</small></button>
        <a href="/wishlist"><span aria-hidden="true">♡</span><small>Wishlist</small><b data-wishlist-count>0</b></a>
        <button type="button" data-cart-open><span aria-hidden="true">Bag</span><small>Bag</small><b data-cart-count>0</b></button>
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
        <div class="stable-menu-utility"><button type="button" data-menu-search>Search products <span>⌕</span></button><a href="/wishlist">Your wishlist <span data-wishlist-count>0</span></a></div>
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
            <p>Enter your shipping details and select your payment method.</p>
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
              <label for="cust-pincode"><span>PIN Code <strong class="req">*</strong></span><input type="text" id="cust-pincode" required placeholder="e.g. 110001" pattern="[0-9]{6}" maxlength="6" /></label>
              <label for="cust-city"><span>City</span><input type="text" id="cust-city" placeholder="City" /></label>
              <label for="cust-state"><span>State</span><input type="text" id="cust-state" placeholder="State" /></label>
            </div>
            <div class="form-row">
              <label for="cust-note"><span>Gift Message / Order Note <small>(Optional)</small></span><input type="text" id="cust-note" placeholder="Gift card message or delivery instructions" /></label>
            </div>
            <div class="payment-methods-box">
              <small>PAYMENT METHOD</small>
              <div class="payment-options">
                <label class="payment-option">
                  <input type="radio" name="payment-method" value="COD" checked />
                  <div class="payment-option__content">
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Pay at your doorstep upon express delivery</small>
                  </div>
                </label>
                <label class="payment-option">
                  <input type="radio" name="payment-method" value="UPI" />
                  <div class="payment-option__content">
                    <strong>UPI Express (GPay, PhonePe, Paytm, QR)</strong>
                    <small>Instant zero-fee payment confirmation</small>
                  </div>
                </label>
                <label class="payment-option">
                  <input type="radio" name="payment-method" value="Card" />
                  <div class="payment-option__content">
                    <strong>Debit / Credit Card / NetBanking</strong>
                    <small>100% Encrypted 256-bit bank checkout</small>
                  </div>
                </label>
              </div>
            </div>
            <div class="checkout-actions">
              <button type="submit" class="stable-button stable-button--dark checkout-submit-btn">
                <span>Confirm Order</span>
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
    if (!product || product.priceStatus === "unavailable") return false;
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
      return sum + (value.price || 499) * item.qty;
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
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(clean)}&amount=${summary.subtotal}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.coupon) {
          activeCoupon = data.coupon;
          saveStorage(storageKeys.coupon, activeCoupon);
          renderCart();
          showToast(`Coupon ${clean} applied! You saved ${formatMoney(data.discountAmount || 0)}`);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || "Invalid or expired promo code");
    } catch {
      const localCoupons = {
        "WELCOME10": { code: "WELCOME10", discountType: "percent", discountValue: 10, minOrderValue: 499, isActive: true },
        "LUXE15": { code: "LUXE15", discountType: "percent", discountValue: 15, minOrderValue: 1499, isActive: true },
        "SHIVARA500": { code: "SHIVARA500", discountType: "flat", discountValue: 500, minOrderValue: 2499, isActive: true }
      };
      if (localCoupons[clean]) {
        activeCoupon = localCoupons[clean];
        saveStorage(storageKeys.coupon, activeCoupon);
        renderCart();
        showToast(`Coupon ${clean} applied!`);
      } else {
        showToast("Invalid promo code");
      }
    }
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
      </div>`;

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
      if (saved.pincode && document.querySelector("#cust-pincode")) document.querySelector("#cust-pincode").value = saved.pincode;
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

  function initialisePremiumMotion() {
    const hero = document.querySelector("[data-hero]");
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (hero && precisePointer.matches && !reducedMotion.matches) {
      hero.addEventListener("pointermove", (event) => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
        hero.style.setProperty("--pointer-x", x.toFixed(3));
        hero.style.setProperty("--pointer-y", y.toFixed(3));
      }, { passive: true });
      hero.addEventListener("pointerleave", () => {
        hero.style.setProperty("--pointer-x", "0");
        hero.style.setProperty("--pointer-y", "0");
      }, { passive: true });
    }

    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .08, rootMargin: "0px 0px -6% 0px" });
      document.querySelectorAll(".category-rail-section, .living-deck, .home-products, .signature-edit, .stable-reassurance").forEach((section) => {
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

  document.addEventListener("submit", (event) => {
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

      const name = (document.querySelector("#cust-name")?.value || "").trim();
      const phone = (document.querySelector("#cust-phone")?.value || "").trim();
      const email = (document.querySelector("#cust-email")?.value || "").trim();
      const address = (document.querySelector("#cust-address")?.value || "").trim();
      const pincode = (document.querySelector("#cust-pincode")?.value || "").trim();
      const city = (document.querySelector("#cust-city")?.value || "").trim();
      const state = (document.querySelector("#cust-state")?.value || "").trim();
      const note = (document.querySelector("#cust-note")?.value || "").trim();
      const paymentMethod = (document.querySelector('input[name="payment-method"]:checked')?.value || "COD").trim();

      if (!name || !phone || !address || !pincode) {
        showToast("Please fill in all required delivery details.");
        return;
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

      const summary = cartSummary();
      const orderRef = "SHV-" + Math.floor(10000 + Math.random() * 90000);
      const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

      const orderItems = cart.map(item => {
        const product = productMap.get(item.id);
        const variant = validVariant(product, item.variantId);
        const value = pricing(product);
        return {
          productId: product?.id || item.id,
          slug: product?.slug || item.id,
          sku: product?.sku || "",
          title: product?.title || "Jewellery Item",
          price: value.confirmed ? value.price : 499,
          quantity: item.qty,
          imageUrl: (product?.images && product.images[0]) || "",
          variantLabel: variant?.label || null
        };
      });

      const customerInfo = {
        name,
        phone,
        email,
        address,
        pincode,
        city,
        state,
        note: note || ""
      };

      const orderDocument = {
        orderId: orderRef,
        customerInfo,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        shippingAddress: address,
        pincode: pincode,
        city: city || "",
        state: state || "",
        orderNote: note || "",
        shippingDetails: customerInfo,
        items: orderItems,
        itemCount: cart.reduce((sum, i) => sum + i.qty, 0),
        totalAmount: summary.confirmedTotal,
        subtotal: summary.subtotal,
        discountAmount: summary.discount,
        appliedCoupon: activeCoupon?.code || null,
        paymentMethod,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for frictionless guest reference
      try {
        localStorage.setItem("shivara_recent_order", JSON.stringify({
          orderId: orderRef,
          date: dateStr,
          totalAmount: summary.confirmedTotal,
          items: orderItems,
          customerInfo,
          paymentMethod,
          status: "Pending"
        }));
      } catch {}

      // Send to local Node.js Server
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderDocument)
      }).catch(() => {});

      // Execute Atomic writeBatch in Firestore
      (async () => {
        try {
          const { db } = await import("/src/firebase.js");
          const { doc, writeBatch, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js");
          const batch = writeBatch(db);

          // 1. Order Document
          const orderDocRef = doc(db, "orders", orderRef);
          batch.set(orderDocRef, {
            ...orderDocument,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // 2. Mark each purchased product as Sold Out
          orderItems.forEach(item => {
            if (item.productId) {
              const prodRef = doc(db, "products", String(item.productId));
              batch.set(prodRef, {
                isSoldOut: true,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          });

          await batch.commit();
          console.log("[OMS] Atomic checkout transaction committed:", orderRef);
        } catch (err) {
          console.warn("[OMS] Note on Firestore atomic order persistence:", err?.message || err);
        }
      })();

      // Clear the Cart on successful order placement
      cart.length = 0;
      saveCart();
      activeCoupon = null;
      localStorage.removeItem(storageKeys.coupon);
      updateCounts();
      renderCart();
      localStorage.removeItem(storageKeys.cart);

      closeLayer();
      window.location.href = `/order-confirmation.html?id=${encodeURIComponent(orderRef)}`;
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
