const shopData = window.SHIVARA_SHOP_DATA || { products: [], profile: {} };

const productHeroOrder = [
  "DW3H_GZDD_4",
  "DXRflQ2ARK2",
  "DVsiM2WEctG",
  "DW9Cf8OkWo0",
  "DWtcQ8OAefp",
  "DWERaGlEYB6",
  "DV0yEUUkTHq",
  "DUsq31AgXWw",
  "DXO-ucIBdig",
  "DXUKeYosxOa",
  "DXbGtV-kd5A",
  "DXZqgaJBA9l",
  "DXWiT4SxF-w",
  "DXOonNskfbi",
  "DXMpqNMxs1F",
  "DXLqgBTkXIL",
  "DXKG78JhH1P",
  "DXHUsl9BfJh",
  "DVGLWtPEbN4",
  "DYfHBFKBXGi",
  "DYcf1ViBfkI",
  "DYPpSpxhPO0",
  "DW6Zoq5xNHr",
  "DW0r-SYxASu",
  "DWyr2aXjKHn"
];

const productOverrides = {
  "DXbGtV-kd5A": { title: "Boutique Earring Card", category: "Earrings" },
  DXUKeYosxOa: { title: "Blue Evil Eye Bracelet", category: "Evil Eye" },
  DXRflQ2ARK2: { title: "Tulip Pendant", category: "Pendants" },
  "DXO-ucIBdig": { title: "Bow Love Earrings", category: "Earrings" },
  DW9Cf8OkWo0: { title: "Curated Bracelet Collection", category: "Bracelets" },
  DW3H_GZDD_4: { title: "Boxed Evil Eye Bracelet", category: "Evil Eye" },
  DWtcQ8OAefp: { title: "Gold Flower Pendant", category: "Pendants" },
  DWERaGlEYB6: { title: "Blue Earring Gift Edit", category: "Earrings" },
  DV0yEUUkTHq: { title: "Charm Bracelet Tray", category: "Bracelets" },
  DVsiM2WEctG: { title: "Iconic Ring Set", category: "Rings" },
  DVGLWtPEbN4: { title: "Minimal Pendant Box", category: "Pendants" },
  DUsq31AgXWw: { title: "Gift-ready Jewellery Set", category: "Gifting" },
  DYfHBFKBXGi: { title: "Anxious Queen Pendant", category: "Pendants" },
  DYcf1ViBfkI: { title: "Blush Ring Gift", category: "Rings" },
  DYPpSpxhPO0: { title: "Evil Eye Protection Bracelet", category: "Evil Eye" }
};

const duplicateProductIds = new Set([
  "DYKVkoiRRKO",
  "DYFT4Jfhw5p",
  "DYCvFefB7M-",
  "DX7CBRqhpCo",
  "DXt3fWXkRRT",
  "DXrYH47xp1H",
  "DXjb4FvRnBr",
  "DXhSZihhguK",
  "DXgQIktxtyJ",
  "DXXB1vAgdZX",
  "DXR62clhWZp",
  "DXRFDglM27U",
  "DXCOQ0_hnf0",
  "DW-66E7R1z0",
  "DW1NbAZRAVn",
  "DWY2FmABOVM",
  "DWYrFMnEePF",
  "DWWVjE7BrMg",
  "DWVjIp9xjU4",
  "DWD6L0wEQ2g",
  "DVtBynukTwQ",
  "DVVyuaREdE-"
]);

const productPhotoIds = new Set([
  "DXbGtV-kd5A",
  "DXZqgaJBA9l",
  "DXWiT4SxF-w",
  "DXUKeYosxOa",
  "DXRflQ2ARK2",
  "DXO-ucIBdig",
  "DXOonNskfbi",
  "DXMpqNMxs1F",
  "DXLqgBTkXIL",
  "DXKG78JhH1P",
  "DXHUsl9BfJh",
  "DW9Cf8OkWo0",
  "DW6Zoq5xNHr",
  "DW3H_GZDD_4",
  "DW3G6dhRMJR",
  "DW0r-SYxASu",
  "DWyr2aXjKHn",
  "DWypw-1MTe5",
  "DWwJbnmhBzK",
  "DWtcQ8OAefp",
  "DWtcDZJhZVS",
  "DWss1yNkbcd",
  "DWqQ5tusfA-",
  "DWnoiVcRGns",
  "DWlGxA6DBMP",
  "DWjfG3oBmR5",
  "DWf-enREft_",
  "DWeCV8-hJ8X",
  "DWQku-DkVc3",
  "DWERaGlEYB6",
  "DWBxAJDkYzD",
  "DV7-kUpkXHF",
  "DV3atErkWR3",
  "DV0yEUUkTHq",
  "DVvpo0ukdeE",
  "DVsiM2WEctG",
  "DVqa-xUkQHq",
  "DVkvt0ckc1I",
  "DVQuWW5gXDq",
  "DVGLWtPEbN4",
  "DU-K3x-ET2s",
  "DU0czVUATKu",
  "DUsq31AgXWw"
]);

const orderRank = new Map(productHeroOrder.map((id, index) => [id, index]));
const allProducts = (Array.isArray(shopData.products) ? shopData.products : [])
  .map((product) => ({ ...product, ...(productOverrides[product.id] || {}) }))
  .sort((a, b) => {
    const aRank = orderRank.has(a.id) ? orderRank.get(a.id) : 1000 + a.index;
    const bRank = orderRank.has(b.id) ? orderRank.get(b.id) : 1000 + b.index;
    return aRank - bRank;
  });
const products = allProducts.filter((product) => productPhotoIds.has(product.id) && !duplicateProductIds.has(product.id));

const categories = [
  { title: "New Arrivals", href: "/collections/all", image: "post-049-DW9Cf8OkWo0.jpg", category: "All" },
  { title: "Demifine", href: "/collections/all", image: "post-064-DWqQ5tusfA-.jpg", category: "Anti-tarnish" },
  { title: "Earrings", href: "/#earrings", image: "post-080-DWERaGlEYB6.jpg", category: "Earrings" },
  { title: "Necklaces", href: "/#neck-wear", image: "post-036-DXRflQ2ARK2.jpg", category: "Pendants" },
  { title: "Bracelets", href: "/#bracelets", image: "post-051-DW3H_GZDD_4.jpg", category: "Bracelets" },
  { title: "Rings", href: "/collections/rings", image: "post-090-DVsiM2WEctG.jpg", category: "Rings" },
  { title: "Evil Eye", href: "/collections/all", image: "post-007-DYPpSpxhPO0.jpg", category: "Evil Eye" },
  { title: "Gifts", href: "/#gifts", image: "post-103-DUsq31AgXWw.jpg", category: "Gifting" },
  { title: "JLT Basics", href: "/collections/all", image: "post-060-DWtcQ8OAefp.jpg", category: "All" },
  { title: "Organisers/ Cases", href: "/collections/all", image: "post-018-DXybkxCRoaE.jpg", category: "Gifting" },
  { title: "Hair Tie", href: "/collections/all", image: "post-029-DXbGtV-kd5A.jpg", category: "Earrings" },
  { title: "Mens Collection", href: "/collections/all", image: "post-039-DXOonNskfbi.jpg", category: "Bracelets" }
];

const cart = new Map(JSON.parse(localStorage.getItem("shivara-cart") || "[]"));
let activeFilter = "All";

function productPricing(product) {
  const basePrices = {
    Rings: 199,
    Bracelets: 399,
    Pendants: 299,
    "Evil Eye": 499,
    Earrings: 299,
    Gifting: 699,
    "Anti-tarnish": 499
  };
  const price = basePrices[product.category] || 399;
  const compareAt = price + (price >= 499 ? 200 : 100);
  const member = Math.max(79, Math.round((price * 0.8) / 10) * 10 - 1);
  return { price, compareAt, member };
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function saveCart() {
  localStorage.setItem("shivara-cart", JSON.stringify(Array.from(cart.entries())));
}

function cartQuantity() {
  return Array.from(cart.values()).reduce((total, quantity) => total + quantity, 0);
}

function shortCaption(product) {
  return (product.caption || "DM to order from Shivara.luxe").replace(/\s+/g, " ").slice(0, 94);
}

function productCard(product, options = {}) {
  const pricing = productPricing(product);
  const selected = cart.has(product.id);
  const quick = options.quick || product.index % 3 === 0;
  return `
    <product-item class="product-item ${options.slide ? "list_product_item splide__slide" : ""}" data-id="${product.id}" data-category="${product.category}">
      <div class="product-item__image-wrapper product-item__image-wrapper--multiple">
        <a href="${product.instagram}" target="_blank" rel="noreferrer">
          <img class="product-item__primary-image" src="/${product.image}" alt="${product.title}" loading="lazy" />
          <img class="product-item__secondary-image" src="/${product.image}" alt="" loading="lazy" />
        </a>
        <div class="product-item__label-list label-list">
          <span class="label label--highlight">Sale</span>
          ${product.index % 5 === 0 ? '<span class="label label--subdued">BEST SELLING</span>' : ""}
        </div>
      </div>
      <div class="product-item__info">
        <a class="product-item-meta__title" href="${product.instagram}" target="_blank" rel="noreferrer">${product.title}</a>
        <div class="price-list">
          <span>INR</span>
          <span>Regular price</span>
          <s>${pricing.compareAt}</s>
          <strong>${pricing.price}</strong>
        </div>
        <p class="member-price">Member Price INR ${pricing.member} <a href="/collections/all">JOIN NOW</a></p>
        <p class="product-excerpt">${shortCaption(product)}</p>
        <button class="product-item__quick-form" type="button" data-add="${product.id}">
          ${selected ? "ADDED" : quick ? "QUICK VIEW" : "ADD TO CART"}
        </button>
      </div>
    </product-item>
  `;
}

function sectionProducts(kind) {
  if (kind === "bestsellers") return products.slice(0, 14);
  const filtered = products.filter((product) => product.category === kind);
  return filtered.length ? filtered.slice(0, 14) : products.slice(0, 10);
}

function renderHome() {
  const categoryStrip = document.querySelector("#category-strip");
  if (categoryStrip) {
    categoryStrip.innerHTML = categories
      .map(
        (item) => `
          <div class="featured_collection_list_item scroll-item">
            <a class="featured_collection_list_link" href="${item.href}">
              <img class="featured_collection_list_image" src="/assets/instagram-shop/${item.image}" alt="" loading="lazy" />
              <p class="featured-collection_item_title h5 m-0">${item.title}</p>
            </a>
          </div>
        `
      )
      .join("");
  }

  document.querySelectorAll("[data-section-products]").forEach((container) => {
    const kind = container.getAttribute("data-section-products");
    container.innerHTML = sectionProducts(kind).map((product) => productCard(product, { slide: true })).join("");
  });
}

function filterMarkup(collection) {
  const counts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  const filterCats = ["Rings", "Bracelets", "Pendants", "Earrings", "Evil Eye", "Gifting", "Anti-tarnish"];
  const colorItems = collection === "Rings" ? ["Blue", "Rose Gold", "Silver", "White"] : ["Gold", "Silver", "Blue", "Green", "Rose Gold", "White", "Black"];
  return `
    <div class="drawer__overlay" data-drawer-close></div>
    <div class="drawer__header hidden-lap-and-up">
      <p class="drawer__title heading h6">Filters</p>
      <button class="drawer__close-button tap-area" type="button" data-drawer-close>Close</button>
    </div>
    <div class="drawer__content">
      <div class="product-facet__filter-list">
        <details class="product-facet__filter-item" open>
          <summary class="collapsible-toggle text--strong">Availability</summary>
          <label class="checkbox-container"><input class="checkbox" type="checkbox" /> In stock (${products.length})</label>
          <label class="checkbox-container"><input class="checkbox" type="checkbox" /> Out of stock (0)</label>
        </details>
        <details class="product-facet__filter-item" open>
          <summary class="collapsible-toggle text--strong">Price</summary>
          <div class="price-range"><span>₹</span><input type="number" placeholder="0" /><span>to</span><span>₹</span><input type="number" placeholder="999" /></div>
        </details>
        <details class="product-facet__filter-item" open>
          <summary class="collapsible-toggle text--strong">Color</summary>
          ${colorItems.map((color) => `<label class="checkbox-container"><input class="checkbox" type="checkbox" /> ${color}</label>`).join("")}
        </details>
        <details class="product-facet__filter-item" open>
          <summary class="collapsible-toggle text--strong">Style</summary>
          ${filterCats
            .map((cat) => `<label class="checkbox-container"><input class="checkbox" type="radio" name="style-filter" data-style-filter="${cat}" /> ${cat} (${counts[cat] || 0})</label>`)
            .join("")}
        </details>
        <details class="product-facet__filter-item" open>
          <summary class="collapsible-toggle text--strong">More filters</summary>
          <label class="checkbox-container"><input class="checkbox" type="checkbox" /> New Arrivals (${products.length})</label>
          <label class="checkbox-container"><input class="checkbox" type="checkbox" /> best seller (12)</label>
          <label class="checkbox-container"><input class="checkbox" type="checkbox" /> Anti Tarnish (${counts["Anti-tarnish"] || 0})</label>
        </details>
        <button class="button button--primary apply-filters" type="button" data-drawer-close>Apply filters</button>
      </div>
    </div>
  `;
}

function renderCollection() {
  const grid = document.querySelector("#collection-grid");
  if (!grid) return;
  const collection = document.body.dataset.collection || "All";
  const visible = collection === "Rings" ? products.filter((product) => product.category === "Rings") : products;
  grid.innerHTML = visible.map((product) => productCard(product)).join("");
  const filters = document.querySelector("#facet-filters");
  if (filters) filters.innerHTML = filterMarkup(collection);
}

function renderSearch(query = "") {
  const results = document.querySelector("#search-results");
  if (!results) return;
  const normalized = query.toLowerCase().trim();
  const matches = products
    .filter((product) => `${product.title} ${product.category} ${product.caption}`.toLowerCase().includes(normalized))
    .slice(0, 8);
  results.innerHTML = matches.length
    ? matches
        .map(
          (product) => `
            <a class="search-result" href="${product.instagram}" target="_blank" rel="noreferrer">
              <img src="/${product.image}" alt="" />
              <span>${product.title}</span>
            </a>
          `
        )
        .join("")
    : '<p class="empty-search">View all results</p>';
}

function renderCart() {
  const quantity = cartQuantity();
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = String(quantity);
  });

  const cartItems = document.querySelector("#cart-items");
  const cartEmpty = document.querySelector("#cart-empty");
  const cartSummary = document.querySelector("#cart-summary");
  const checkoutLink = document.querySelector("#checkout-link");
  if (!cartItems || !cartEmpty || !cartSummary || !checkoutLink) return;

  const selectedProducts = Array.from(cart.entries())
    .map(([id, qty]) => ({ product: productById(id), qty }))
    .filter((entry) => entry.product);

  cartItems.innerHTML = selectedProducts
    .map(
      ({ product, qty }) => `
        <article class="cart-line">
          <img src="/${product.image}" alt="" />
          <div>
            <h3>${product.title}</h3>
            <p>${product.category} | ${product.id}</p>
            <div class="qty-row">
              <button type="button" data-decrease="${product.id}">-</button>
              <span>${qty}</span>
              <button type="button" data-increase="${product.id}">+</button>
              <button type="button" data-remove="${product.id}">Remove</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  cartEmpty.hidden = selectedProducts.length > 0;
  cartItems.hidden = selectedProducts.length === 0;
  cartSummary.textContent = `${quantity} item${quantity === 1 ? "" : "s"} selected`;
  const message =
    selectedProducts.length === 0
      ? "Hi Shivara.luxe, I want to shop from your collection."
      : [
          "Hi Shivara.luxe, I want to inquire about these pieces:",
          "",
          ...selectedProducts.map(({ product, qty }, index) => `${index + 1}. ${qty} x ${product.title} (${product.category}) - ${product.id} - ${product.instagram}`),
          "",
          "Please confirm price, availability, customization options, and PAN India delivery."
        ].join("\n");
  checkoutLink.href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
  saveCart();
}

function injectSharedLayout() {
  const headerMount = document.querySelector("#shared-header");
  if (headerMount) {
    headerMount.outerHTML = `
      <div class="announcement-bar" aria-hidden="true"></div>
      <div class="shopify-section shopify-section--header" id="shopify-section-header">
        <store-header class="header header--bordered">
          <div class="container"><div class="header__wrapper">
            <nav class="header__inline-navigation" aria-label="Navigation">
              <div class="header__icon-list hidden-desk"><button class="header__icon-wrapper tap-area" type="button" data-menu-open aria-label="Navigation"><svg class="icon icon--header-hamburger" viewBox="0 0 18 14" aria-hidden="true"><path d="M0 1h18M0 7h18M0 13h18" fill="none" stroke="currentColor" stroke-width="2"/></svg></button><button class="header__icon-wrapper tap-area" type="button" data-search-open aria-label="Search"><svg class="icon icon--header-search" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14 14 5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div>
              <ul class="header__linklist hidden-pocket"><li><a href="/">Home</a></li><li><a href="/collections/all">New Arrivals</a></li><li><a href="/#earrings">Earrings</a></li><li><a href="/#neck-wear">Neck Wear</a></li><li><a href="/#bracelets">Bracelets</a></li><li><a href="/collections/rings">Rings</a></li></ul>
            </nav>
            <h1 class="header__logo"><a class="header__logo-link" href="/"><img class="header__logo-image" src="/assets/instagram/profile.jpg" alt="" /><span>Shivara.luxe</span></a></h1>
            <div class="header__secondary-links"><div class="header__icon-list"><button class="header__icon-wrapper tap-area hidden-pocket" type="button" data-search-open aria-label="Search"><svg class="icon icon--header-search" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m14 14 5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button><button class="nn header__icon-wrapper tap-area" type="button" data-cart-open aria-label="Open cart"><svg class="icon icon--header-cart" viewBox="0 0 23 23" aria-hidden="true"><path d="M6 7h12l-1.2 9.5H7.2L6 7Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><cart-count class="header__cart-count header__cart-count--floating bubble-count" data-cart-count>0</cart-count></button></div></div>
          </div></div>
        </store-header>
      </div>
    `;
  }
  const footerMount = document.querySelector("#shared-footer");
  if (footerMount) {
    footerMount.outerHTML = `
      <footer class="shopify-section shopify-section--footer site-footer"><div class="footer__inner container"><div class="footer__newsletter"><img src="/assets/instagram/profile.jpg" alt="" /><p class="footer__item-title heading h3 footer_newsletter_item_title">Stay in the Loop!</p><p>Join our WhatsApp list for new products, special offers, and deals.</p><a class="footer-input" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">WhatsApp Shivara</a></div><div class="footer__columns"><div><h3>Quick Links</h3><a href="/">Home</a><a href="/collections/all">New Arrivals</a><a href="/collections/rings">Rings</a><a href="https://www.instagram.com/shivara.luxe" target="_blank" rel="noreferrer">Instagram</a></div><div><h3>Buy With Us</h3><a href="/#bracelets">Bracelets</a><a href="/#earrings">Earrings</a><a href="/#neck-wear">Neck Wear</a><a href="/#gifts">Gifts</a></div><div><h3>Contact Us</h3><p>Bareilly, Uttar Pradesh</p><p>DM to shop | PAN India</p><p>WhatsApp: +91 9457041215</p></div></div></div><p class="footer-bottom">Shivara.luxe</p></footer>
      <predictive-search-drawer class="predictive-search drawer drawer--large" id="search-drawer" aria-hidden="true"><div class="drawer__overlay" data-drawer-close></div><div class="drawer__content"><button class="drawer__close-button tap-area" type="button" data-drawer-close>Close</button><label class="predictive-search__form"><span>Search</span><input class="predictive-search__input" id="drawer-search" type="text" placeholder="What are you looking for?" /></label><div class="predictive-search__results" id="search-results"></div></div></predictive-search-drawer>
      <mobile-navigation class="drawer drawer--from-left" id="mobile-menu-drawer" aria-hidden="true"><div class="drawer__overlay" data-drawer-close></div><div class="drawer__content"><button class="drawer__close-button tap-area" type="button" data-drawer-close>Close</button><nav class="mobile-nav"><a href="/">Home</a><a href="/collections/all">New Arrivals</a><a href="/#earrings">Earrings</a><a href="/#neck-wear">Neck Wear</a><a href="/#bracelets">Bracelets</a><a href="/collections/rings">Rings</a></nav></div></mobile-navigation>
      <div class="cart-overlay" data-cart-close hidden></div><aside class="cart-drawer" aria-label="Shopping bag" aria-hidden="true"><div class="cart-head"><div><p>Your bag</p><h2>Inquiry list</h2></div><button class="drawer__close-button" type="button" data-cart-close>Close</button></div><div class="cart-items" id="cart-items"></div><div class="cart-empty" id="cart-empty"><strong>Your bag is empty.</strong><p>Add jewellery drops and send one clean WhatsApp inquiry.</p></div><div class="cart-foot"><p id="cart-summary">0 items selected</p><a class="button button--primary" id="checkout-link" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">Send WhatsApp inquiry</a></div></aside>
    `;
  }
}

function openDrawer(selector) {
  document.querySelector(selector)?.classList.add("is-open");
  document.body.classList.add("drawer-open");
}

function closeDrawers() {
  document.querySelectorAll(".drawer.is-open").forEach((drawer) => drawer.classList.remove("is-open"));
  document.body.classList.remove("drawer-open");
}

function setCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  const drawer = document.querySelector(".cart-drawer");
  const overlay = document.querySelector(".cart-overlay");
  drawer?.setAttribute("aria-hidden", String(!open));
  if (overlay) overlay.hidden = !open;
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest("[data-search-open]")) {
    openDrawer("#search-drawer");
    renderSearch("");
    return;
  }
  if (target.closest("[data-menu-open]")) {
    openDrawer("#mobile-menu-drawer");
    return;
  }
  if (target.closest("[data-filter-open]")) {
    openDrawer("#facet-filters");
    return;
  }
  if (target.closest("[data-drawer-close]")) {
    closeDrawers();
    return;
  }
  if (target.closest("[data-cart-open]")) {
    setCartOpen(true);
    return;
  }
  if (target.closest("[data-cart-close]")) {
    setCartOpen(false);
    return;
  }
  const addButton = target.closest("[data-add]");
  if (addButton) {
    const id = addButton.getAttribute("data-add");
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    setCartOpen(true);
    return;
  }
  const increase = target.closest("[data-increase]");
  if (increase) {
    const id = increase.getAttribute("data-increase");
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    return;
  }
  const decrease = target.closest("[data-decrease]");
  if (decrease) {
    const id = decrease.getAttribute("data-decrease");
    const next = (cart.get(id) || 0) - 1;
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    renderCart();
    return;
  }
  const remove = target.closest("[data-remove]");
  if (remove) {
    cart.delete(remove.getAttribute("data-remove"));
    renderCart();
  }
});

document.addEventListener("input", (event) => {
  if (event.target?.matches?.("#drawer-search")) {
    renderSearch(event.target.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawers();
    setCartOpen(false);
  }
});

injectSharedLayout();
renderHome();
renderCollection();
renderCart();
