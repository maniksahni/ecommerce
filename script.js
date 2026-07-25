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
  DXZqgaJBA9l: { title: "Butterfly Love Pendant", category: "Pendants" },
  "DXWiT4SxF-w": { title: "Cherry Charm Pendant", category: "Pendants" },
  DXUKeYosxOa: { title: "Blue Evil Eye Bracelet", category: "Evil Eye" },
  DXRflQ2ARK2: { title: "Tulip Pendant", category: "Pendants" },
  "DXO-ucIBdig": { title: "Bow Love Earrings", category: "Earrings" },
  DXOonNskfbi: { title: "Icon Bracelet Set", category: "Bracelets" },
  DXMpqNMxs1F: { title: "Refined Bracelet Stack", category: "Bracelets" },
  DXLqgBTkXIL: { title: "Solitaire Promise Ring", category: "Rings" },
  DXKG78JhH1P: { title: "Infinity Shine Ring", category: "Rings" },
  DXHUsl9BfJh: { title: "Rose Proposal Ring", category: "Rings" },
  DW9Cf8OkWo0: { title: "Curated Bracelet Collection", category: "Bracelets" },
  DW6Zoq5xNHr: { title: "Wrist Glow Bracelet", category: "Bracelets" },
  DW3H_GZDD_4: { title: "Boxed Evil Eye Bracelet", category: "Evil Eye" },
  DW3G6dhRMJR: { title: "Celebration Bracelet Box", category: "Bracelets" },
  "DW0r-SYxASu": { title: "Italian Ring Drop", category: "Rings" },
  "DWyr2aXjKHn": { title: "Italian Ring Duo", category: "Rings" },
  "DWypw-1MTe5": { title: "Everyday Italian Rings", category: "Rings" },
  DWwJbnmhBzK: { title: "Glow Ring Edit", category: "Rings" },
  DWtcQ8OAefp: { title: "Gold Flower Pendant", category: "Pendants" },
  DWtcDZJhZVS: { title: "Flower Charm Pendant", category: "Pendants" },
  DWss1yNkbcd: { title: "Heart Keepsake Pendant", category: "Pendants" },
  "DWqQ5tusfA-": { title: "Luxury Snake Watch", category: "Anti-tarnish" },
  DWnoiVcRGns: { title: "Multi Crystal Neckpiece", category: "Pendants" },
  DWlGxA6DBMP: { title: "Premium AD Set", category: "Anti-tarnish" },
  DWjfG3oBmR5: { title: "Shimmer AD Set", category: "Anti-tarnish" },
  "DWf-enREft_": { title: "Fierce Snake Watch", category: "Anti-tarnish" },
  "DWeCV8-hJ8X": { title: "Snake Watch", category: "Anti-tarnish" },
  "DWQku-DkVc3": { title: "Cartier-Inspired Bracelet", category: "Bracelets" },
  DWERaGlEYB6: { title: "Blue Earring Gift Edit", category: "Earrings" },
  DWBxAJDkYzD: { title: "Boardroom Bracelet", category: "Bracelets" },
  "DV7-kUpkXHF": { title: "Eidi Gift Ring", category: "Rings" },
  DV3atErkWR3: { title: "Triple Pendant Set", category: "Pendants" },
  DV0yEUUkTHq: { title: "Charm Bracelet Tray", category: "Bracelets" },
  DVvpo0ukdeE: { title: "Everyday Bracelet Stack", category: "Bracelets" },
  DVsiM2WEctG: { title: "Iconic Ring Set", category: "Rings" },
  "DVqa-xUkQHq": { title: "199 Ring Combo", category: "Rings" },
  DVkvt0ckc1I: { title: "Sparkle Ring Collection", category: "Rings" },
  DVQuWW5gXDq: { title: "Under 400 Bracelet", category: "Bracelets" },
  DVGLWtPEbN4: { title: "Minimal Pendant Box", category: "Pendants" },
  "DU-K3x-ET2s": { title: "Love Again AD Set", category: "Anti-tarnish" },
  DU0czVUATKu: { title: "Soft Luxury Set", category: "Anti-tarnish" },
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
  { title: "New Arrivals", href: "/collections/all", image: "post-080-DWERaGlEYB6.jpg", category: "All" },
  { title: "Demifine", href: "/collections/all", image: "post-090-DVsiM2WEctG.jpg", category: "Anti-tarnish" },
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

function readLocalJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const cart = new Map(readLocalJson("shivara-cart", []));
let recentSearches = readLocalJson("shivara-recent-searches", []).filter((item) => typeof item === "string").slice(0, 6);
let activeFilter = "All";
let quickViewTrigger = null;

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
  return selectedCartProducts().reduce((total, entry) => total + entry.qty, 0);
}

function selectedCartProducts() {
  const validEntries = [];
  let changed = false;

  Array.from(cart.entries()).forEach(([id, qty]) => {
    const product = productById(id);
    if (!product) {
      cart.delete(id);
      changed = true;
      return;
    }
    validEntries.push({ product, qty });
  });

  if (changed) saveCart();
  return validEntries;
}

function shortCaption(product) {
  return (product.caption || "DM to order from Shivara.luxe").replace(/\s+/g, " ").slice(0, 94);
}

function escapeMarkup(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function productCard(product, options = {}) {
  const pricing = productPricing(product);
  const selected = cart.has(product.id);
  const saved = typeof socialState !== "undefined" && socialState.saved.has(product.id);
  const loading = options.eager ? "eager" : "lazy";
  const priority = options.eager ? ' fetchpriority="high" decoding="sync"' : ' decoding="async"';
  return `
    <product-item class="product-item commerce-product-card ${options.slide ? "list_product_item splide__slide" : ""}" data-id="${product.id}" data-category="${product.category}">
      <div class="product-item__image-wrapper">
        <button class="commerce-product-card__media" type="button" data-quick="${product.id}" aria-label="View ${product.title}">
          <img class="product-item__primary-image" src="/${product.image}" alt="${product.title}" loading="${loading}"${priority} />
        </button>
        <span class="commerce-product-card__badge">${product.index % 5 === 0 ? "Bestseller" : product.badge === "Latest" ? "New" : product.category}</span>
        <button class="commerce-product-card__save ${saved ? "is-active" : ""}" type="button" data-save-post="${product.id}" aria-label="${saved ? "Remove" : "Save"} ${product.title}" aria-pressed="${saved}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 5.8a5.2 5.2 0 0 0-7.4 0L12 6.6l-.8-.8a5.2 5.2 0 0 0-7.4 7.4L12 21l8.2-7.8a5.2 5.2 0 0 0 0-7.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        </button>
        <button class="commerce-product-card__quick" type="button" data-quick="${product.id}">Quick view</button>
      </div>
      <div class="product-item__info">
        <div class="commerce-product-card__meta">
          <span>${product.category}</span>
          <span aria-label="Five star style rating">★★★★★</span>
        </div>
        <button class="product-item-meta__title" type="button" data-quick="${product.id}">${product.title}</button>
        <div class="price-list">
          <strong>₹${pricing.price}</strong>
          <s>₹${pricing.compareAt}</s>
        </div>
        <button class="product-item__quick-form ${selected ? "is-added" : ""}" type="button" data-add="${product.id}">
          <span>${selected ? "Add another" : "Add to bag"}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8h13l-1 12h-11l-1-12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
        </button>
      </div>
    </product-item>
  `;
}

function ensureSocialMounts() {
  if (!document.querySelector("#social-modal-root")) {
    const modalRoot = document.createElement("div");
    modalRoot.id = "social-modal-root";
    document.body.appendChild(modalRoot);
  }
  if (!document.querySelector("#social-toast")) {
    const toast = document.createElement("div");
    toast.id = "social-toast";
    toast.className = "social-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
  }
  if (!document.querySelector("#social-status")) {
    const status = document.createElement("p");
    status.id = "social-status";
    status.className = "visually-hidden";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    document.body.appendChild(status);
  }
}

function ensureQuickView() {
  let quickView = document.querySelector("#quick-view");
  if (quickView) return quickView;

  quickView = document.createElement("aside");
  quickView.id = "quick-view";
  quickView.className = "quick-view";
  quickView.setAttribute("aria-hidden", "true");
  quickView.setAttribute("data-modal", "");
  quickView.innerHTML = `
    <button class="quick-view__overlay" type="button" data-quick-close aria-label="Close quick view"></button>
    <div class="quick-view__panel" role="dialog" aria-modal="true" aria-label="Product quick view">
      <button class="quick-view__close" type="button" data-quick-close>Close</button>
      <div id="quick-view-content"></div>
    </div>
  `;
  document.body.appendChild(quickView);
  return quickView;
}

function openQuickView(product) {
  if (!product) return;
  const pricing = productPricing(product);
  const quickView = ensureQuickView();
  const message = `Hi Shivara.luxe, I want to inquire about ${product.title} (${product.category}) - ${product.id} - ${product.instagram}`;
  quickView.querySelector("#quick-view-content").innerHTML = `
    <div class="quick-view__media">
      <img src="/${product.image}" alt="${product.title}" />
    </div>
    <div class="quick-view__info">
      <p class="quick-view__eyebrow">${product.category} | Shivara.luxe</p>
      <h2>${product.title}</h2>
      <div class="quick-view__price">
        <span>INR</span>
        <s>${pricing.compareAt}</s>
        <strong>${pricing.price}</strong>
      </div>
      <p class="quick-view__member">Member Price INR ${pricing.member}</p>
      <p class="quick-view__note">Premium-looking everyday jewellery, curated from the Shivara Instagram drop. Add it to your inquiry list and confirm availability on WhatsApp.</p>
      <div class="quick-view__actions">
        <button class="button button--primary" type="button" data-add="${product.id}">Add to bag</button>
        <a class="button button--outline" href="https://wa.me/919457041215?text=${encodeURIComponent(message)}" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
      <a class="quick-view__insta" href="${product.instagram}" target="_blank" rel="noreferrer">View Instagram post</a>
    </div>
  `;
  quickView.classList.add("is-open");
  quickView.setAttribute("aria-hidden", "false");
  document.body.classList.add("quick-view-open");
  quickView.querySelector(".quick-view__close")?.focus();
}

function closeQuickView() {
  const quickView = document.querySelector("#quick-view");
  quickView?.classList.remove("is-open");
  quickView?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("quick-view-open");
  const restoreTarget = quickViewTrigger;
  quickViewTrigger = null;
  if (restoreTarget?.isConnected) window.requestAnimationFrame(() => restoreTarget.focus());
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
    container.innerHTML = sectionProducts(kind).map((product, index) => productCard(product, { slide: true, eager: index < 4 })).join("");
  });
}

function renderCommerceHome(filter = "All") {
  if (!document.body.classList.contains("commerce-home")) return;

  const categoryGrid = document.querySelector("#commerce-category-grid");
  if (categoryGrid) {
    const featuredCategories = [
      categories.find((item) => item.category === "Rings"),
      categories.find((item) => item.category === "Bracelets"),
      categories.find((item) => item.category === "Pendants"),
      categories.find((item) => item.category === "Earrings"),
      categories.find((item) => item.category === "Evil Eye"),
      categories.find((item) => item.category === "Gifting")
    ].filter(Boolean);
    categoryGrid.innerHTML = featuredCategories
      .map(
        (item) => `
          <a class="commerce-category" href="${item.href}">
            <span class="commerce-category__image"><img src="/assets/instagram-shop/${item.image}" alt="${item.title} collection" loading="lazy" decoding="async" /></span>
            <span class="commerce-category__label">${item.title}<small>Explore collection</small></span>
          </a>
        `
      )
      .join("");
  }

  const bestsellers = document.querySelector('[data-commerce-products="bestsellers"]');
  if (bestsellers) bestsellers.innerHTML = products.slice(0, 8).map((product, index) => productCard(product, { eager: index < 4 })).join("");

  const filteredGrid = document.querySelector("#filtered-product-grid");
  if (filteredGrid) {
    const source = filter === "All" ? products.slice(8, 16) : products.filter((product) => product.category === filter).slice(0, 8);
    filteredGrid.innerHTML = source.map((product) => productCard(product)).join("");
  }

  renderWishlist();
}

function renderWishlist() {
  const count = socialState.saved.size;
  document.querySelectorAll("[data-wishlist-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });

  const mount = document.querySelector("#wishlist-items");
  if (!mount) return;
  const savedProducts = products.filter((product) => socialState.saved.has(product.id));
  mount.innerHTML = savedProducts.length
    ? savedProducts
        .map((product) => {
          const pricing = productPricing(product);
          return `
            <article class="wishlist-line">
              <button type="button" data-quick="${product.id}"><img src="/${product.image}" alt="${product.title}" loading="lazy" /></button>
              <div>
                <span>${product.category}</span>
                <button type="button" data-quick="${product.id}"><strong>${product.title}</strong></button>
                <p>₹${pricing.price} <s>₹${pricing.compareAt}</s></p>
                <button type="button" data-add="${product.id}">Add to bag</button>
                <button type="button" data-save-post="${product.id}">Remove</button>
              </div>
            </article>
          `;
        })
        .join("")
    : '<div class="wishlist-empty"><span>♡</span><strong>Your wishlist is empty.</strong><p>Save the pieces that catch your eye and find them here anytime.</p><button class="store-button store-button--dark" type="button" data-wishlist-close>Explore the collection</button></div>';
}

function setWishlistOpen(open) {
  const drawer = document.querySelector("#wishlist-drawer");
  drawer?.classList.toggle("is-open", open);
  drawer?.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("wishlist-open", open);
  if (open) {
    renderWishlist();
    window.requestAnimationFrame(() => drawer?.querySelector("[data-wishlist-close]")?.focus());
  }
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
  grid.innerHTML = visible.map((product, index) => productCard(product, { eager: index < 6 })).join("");
  const filters = document.querySelector("#facet-filters");
  if (filters) filters.innerHTML = filterMarkup(collection);
}

function renderSearch(query = "") {
  const results = document.querySelector("#search-results");
  if (!results) return;
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    const recentMarkup = recentSearches.length
      ? `<section class="search-recents"><header><strong>Recent searches</strong><button type="button" data-clear-searches>Clear all</button></header><div>${recentSearches
          .map((item) => `<button type="button" data-recent-search="${escapeMarkup(item)}">${socialIcons.search}<span>${escapeMarkup(item)}</span></button>`)
          .join("")}</div></section>`
      : '<div class="search-empty"><strong>Find your next statement piece</strong><p>Search by product, category, collection, or keyword.</p></div>';
    results.innerHTML = `${recentMarkup}<p class="search-section-label">Suggested</p>${products.slice(0, 5).map(searchResultMarkup).join("")}`;
    return;
  }
  const matches = socialProducts
    .filter((product) => `${product.title} ${product.category} ${product.caption || ""} ${product.id}`.toLowerCase().includes(normalized))
    .slice(0, 12);
  results.innerHTML = matches.length
    ? `<p class="search-section-label">${matches.length} result${matches.length === 1 ? "" : "s"}</p>${matches.map(searchResultMarkup).join("")}`
    : '<div class="search-empty"><strong>No jewellery found</strong><p>Try a category such as rings, bracelets, earrings, or gifting.</p></div>';
}

function searchResultMarkup(product) {
  const pricing = productPricing(product);
  return `<button class="search-result" type="button" data-search-result="${product.id}" data-quick="${product.id}"><img src="/${product.image}" alt="" loading="lazy" /><span><strong>${product.title}</strong><small>${product.category} collection</small></span><b>₹${pricing.price}</b></button>`;
}

function rememberSearch(value) {
  const normalized = value.trim();
  if (!normalized) return;
  recentSearches = [normalized, ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
  localStorage.setItem("shivara-recent-searches", JSON.stringify(recentSearches));
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

  const selectedProducts = selectedCartProducts();

  cartItems.innerHTML = selectedProducts
    .map(
      ({ product, qty }) => {
        const pricing = productPricing(product);
        return `
        <article class="cart-line">
          <img src="/${product.image}" alt="${product.title}" />
          <div>
            <h3>${product.title}</h3>
            <p>${product.category} · INR ${pricing.price} each</p>
            <div class="qty-row">
              <button type="button" data-decrease="${product.id}" aria-label="Decrease ${product.title} quantity">−</button>
              <span aria-label="Quantity ${qty}">${qty}</span>
              <button type="button" data-increase="${product.id}" aria-label="Increase ${product.title} quantity">+</button>
              <button type="button" data-remove="${product.id}">Remove</button>
            </div>
            <strong class="cart-line__total">INR ${pricing.price * qty}</strong>
          </div>
        </article>
      `;
      }
    )
    .join("");

  cartEmpty.hidden = selectedProducts.length > 0;
  cartItems.hidden = selectedProducts.length === 0;
  const grandTotal = selectedProducts.reduce((total, { product, qty }) => total + productPricing(product).price * qty, 0);
  cartSummary.innerHTML = `<span>${quantity} item${quantity === 1 ? "" : "s"}</span><strong>Total INR ${grandTotal}</strong>`;
  document.querySelector(".cart-foot")?.toggleAttribute("hidden", selectedProducts.length === 0);
  const message =
    selectedProducts.length === 0
      ? "Hi Shivara.luxe, I want to shop from your collection."
      : [
          "Hi Shivara.luxe, I want to inquire about these pieces:",
          "",
          ...selectedProducts.map(({ product, qty }, index) => {
            const price = productPricing(product).price;
            const variant = product.variant ? ` | Variant: ${product.variant}` : "";
            return `${index + 1}. ${product.title}${variant}\nQuantity: ${qty} | Price: INR ${price} | Line total: INR ${price * qty}\n${product.instagram}`;
          }),
          "",
          `Complete total: INR ${grandTotal}`,
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
      <predictive-search-drawer class="predictive-search drawer drawer--large" id="search-drawer" role="dialog" aria-modal="true" aria-label="Search products" aria-hidden="true" data-modal><div class="drawer__overlay" data-drawer-close></div><div class="drawer__content"><button class="drawer__close-button tap-area" type="button" data-drawer-close>Close</button><label class="predictive-search__form"><span>Search</span><input class="predictive-search__input" id="drawer-search" type="text" placeholder="What are you looking for?" /></label><div class="predictive-search__results" id="search-results"></div></div></predictive-search-drawer>
      <mobile-navigation class="drawer drawer--from-left" id="mobile-menu-drawer" aria-hidden="true"><div class="drawer__overlay" data-drawer-close></div><div class="drawer__content"><button class="drawer__close-button tap-area" type="button" data-drawer-close>Close</button><nav class="mobile-nav"><a href="/">Home</a><a href="/collections/all">New Arrivals</a><a href="/#earrings">Earrings</a><a href="/#neck-wear">Neck Wear</a><a href="/#bracelets">Bracelets</a><a href="/collections/rings">Rings</a></nav></div></mobile-navigation>
      <div class="cart-overlay" data-cart-close hidden></div><aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden="true" data-modal><div class="cart-head"><div><p>Your bag</p><h2>Inquiry list</h2></div><button class="drawer__close-button" type="button" data-cart-close>Close</button></div><div class="cart-items" id="cart-items"></div><div class="cart-empty" id="cart-empty"><strong>Your bag is empty.</strong><p>Add jewellery drops and send one clean WhatsApp inquiry.</p></div><div class="cart-foot"><p id="cart-summary">0 items selected</p><a class="button button--primary" id="checkout-link" href="https://wa.me/919457041215" target="_blank" rel="noreferrer">Send WhatsApp inquiry</a></div></aside>
    `;
  }
}

function openDrawer(selector) {
  const drawer = document.querySelector(selector);
  drawer?.classList.add("is-open");
  drawer?.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  window.requestAnimationFrame(() => (drawer?.querySelector("input") || drawer?.querySelector("button"))?.focus());
}

function closeDrawers() {
  document.querySelectorAll(".drawer.is-open").forEach((drawer) => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("drawer-open");
}

function setCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  const drawer = document.querySelector(".cart-drawer");
  const overlay = document.querySelector(".cart-overlay");
  drawer?.setAttribute("aria-hidden", String(!open));
  if (overlay) overlay.hidden = !open;
  if (open) window.requestAnimationFrame(() => drawer?.querySelector("[data-cart-close]")?.focus());
}

const validSocialTabs = new Set(["posts", "reels", "shop", "tagged"]);
const initialSocialTab = validSocialTabs.has(window.location.hash.slice(1)) ? window.location.hash.slice(1) : "posts";
const socialState = {
  tab: initialSocialTab,
  nav: "home",
  postIndex: 0,
  storyIndex: 0,
  storyTimer: null,
  storyStartedAt: 0,
  storyRemaining: 5200,
  storyPaused: false,
  liked: new Set(readLocalJson("shivara-liked-posts", [])),
  saved: new Set(readLocalJson("shivara-saved-posts", [])),
  readNotifications: new Set(readLocalJson("shivara-read-notifications", [])),
  lastFocused: null,
  showingSaved: false,
  toastTimer: null
};

const socialProducts = allProducts.length ? allProducts : products;
const shoppableIds = new Set(products.map((product) => product.id));

const socialIcons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 10 8.5-7 8.5 7v10a1 1 0 0 1-1 1h-5.5v-6h-4v6H4.5a1 1 0 0 1-1-1V10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  explore: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  reels: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m9.5 8 3 4-3 4V8Zm-4-1.5 3 3m3-5.5 3 4m3-3 2.5 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.8H8.4L4 20V5.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  notifications: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-10.1A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7 2.9C19 15.7 12 20 12 20Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  create: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v8m-4-4h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  wishlist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h12v16L12 17l-6 3.5v-16Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  posts: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h16M12 4v16" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  tagged: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v16l-7-4-7 4V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 7 8 5-8 5V7Z" fill="currentColor"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-7-10.1A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7 2.9C19 15.7 12 20 12 20Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v11H9l-4 3V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 16-8-5 16-3-7-8-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 8h11.6l-1 11H7.2L6.2 8Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

const socialNavItems = [
  ["Home", "home"],
  ["Search", "search"],
  ["Explore", "explore"],
  ["Reels", "reels"],
  ["Messages", "messages"],
  ["Notifications", "notifications"],
  ["Create", "create"],
  ["Wishlist", "wishlist"],
  ["Profile", "profile"],
  ["More", "more"]
];

const socialTabs = [
  ["Posts", "posts"],
  ["Reels", "reels"],
  ["Shop", "bag"],
  ["Tagged", "tagged"]
];

const storyHighlights = [
  ["New", "Latest drops", "DYfHBFKBXGi", "View Collection"],
  ["Rings", "Ring studio", "DVsiM2WEctG", "View Collection"],
  ["Bracelets", "Wrist stacks", "DW3H_GZDD_4", "Order on WhatsApp"],
  ["Earrings", "Statement ears", "DWERaGlEYB6", "View Collection"],
  ["Neck Wear", "Neck layers", "DXRflQ2ARK2", "View Collection"],
  ["Evil Eye", "Protection edit", "DYPpSpxhPO0", "Order on WhatsApp"],
  ["Celebrity", "Styled edit", "DU-K3x-ET2s", "View Collection"],
  ["Custom", "Personal picks", "DUsq31AgXWw", "Message Shivara"],
  ["Reviews", "Client love", "DXybkxCRoaE", "View Collection"],
  ["Offers", "Limited prices", "DVqa-xUkQHq", "Shop Now"]
];

const notificationItems = [
  { id: "new-drop", group: "Today", title: "New jewellery collection available", detail: "The latest Shivara.luxe edit is ready to explore.", icon: "bag" },
  { id: "saved", group: "Today", title: "Your wishlist is ready", detail: "Saved pieces stay on this device for your next visit.", icon: "wishlist" },
  { id: "inquiry", group: "This Week", title: "Inquiry bag tip", detail: "Add quantities, then send the complete list on WhatsApp.", icon: "messages" },
  { id: "offer", group: "This Week", title: "Offer edit available", detail: "Browse limited-price pieces in the Shop tab.", icon: "heart" },
  { id: "reel", group: "Earlier", title: "New reel available", detail: "See a closer look at the latest jewellery styling.", icon: "reels" }
];

function formatCount(value) {
  if (!Number.isFinite(Number(value))) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return String(value);
}

function socialProductById(id) {
  return socialProducts.find((product) => product.id === id) || products[0];
}

function whatsappProductLink(product) {
  const message = `Hi Shivara.luxe, I want to inquire about ${product.title} (${product.category}) - ${product.id} - ${product.instagram}`;
  return `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
}

function saveSocialState() {
  localStorage.setItem("shivara-liked-posts", JSON.stringify(Array.from(socialState.liked)));
  localStorage.setItem("shivara-saved-posts", JSON.stringify(Array.from(socialState.saved)));
  localStorage.setItem("shivara-read-notifications", JSON.stringify(Array.from(socialState.readNotifications)));
}

function productCaption(product) {
  return (product.caption || "DM to order from Shivara.luxe").replace(/\s+/g, " ").trim();
}

function renderSocialNav() {
  const desktop = document.querySelector("#desktop-social-nav");
  const mobile = document.querySelector("#mobile-social-nav");
  const unread = notificationItems.filter((item) => !socialState.readNotifications.has(item.id)).length;
  if (desktop) {
    desktop.innerHTML = socialNavItems
      .map(([label, key]) => `<button class="social-nav-item ${key === socialState.nav ? "is-active" : ""}" type="button" data-social-nav="${key}" aria-label="${label}">${socialIcons[key]}<span>${label}</span>${key === "notifications" && unread ? `<b class="nav-count">${unread}</b>` : key === "wishlist" && socialState.saved.size ? `<b class="nav-count">${socialState.saved.size}</b>` : ""}</button>`)
      .join("");
  }
  if (mobile) {
    mobile.innerHTML = ["home", "search", "reels", "wishlist", "profile"]
      .map((key) => `<button class="social-bottom-nav__item ${key === socialState.nav ? "is-active" : ""}" type="button" data-social-nav="${key}" aria-label="${key}">${socialIcons[key]}<span>${key}</span>${key === "wishlist" && socialState.saved.size ? `<b class="nav-count">${socialState.saved.size}</b>` : ""}</button>`)
      .join("");
  }
  document.querySelectorAll("[data-notification-count]").forEach((badge) => {
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  });
}

function renderProfileMeta() {
  const profile = shopData.profile || {};
  document.querySelector("[data-profile-posts]")?.replaceChildren(document.createTextNode(String(profile.posts || socialProducts.length)));
  document.querySelector("[data-profile-collections]")?.replaceChildren(document.createTextNode(String(categories.length)));
}

function renderHighlights() {
  const mount = document.querySelector("#story-highlights");
  if (!mount) return;
  mount.innerHTML = storyHighlights
    .map(([label, title, id], index) => {
      const product = socialProductById(id);
      return `
        <button class="story-highlight" type="button" data-story-open="${index}" aria-label="Open ${label} story">
          <span class="story-highlight__ring"><img src="/${product.image}" alt="" loading="${index < 4 ? "eager" : "lazy"}" decoding="async" /></span>
          <span>${label}</span>
        </button>
      `;
    })
    .join("");
}

function renderTabs() {
  const tabs = document.querySelector("#profile-tabs");
  if (!tabs) return;
  tabs.setAttribute("role", "tablist");
  tabs.innerHTML = socialTabs
    .map(([label, icon]) => `<button class="profile-tab ${!socialState.showingSaved && socialState.tab === label.toLowerCase() ? "is-active" : ""}" type="button" role="tab" data-social-tab="${label.toLowerCase()}" aria-controls="profile-tab-panel" aria-selected="${!socialState.showingSaved && socialState.tab === label.toLowerCase()}" tabindex="${!socialState.showingSaved && socialState.tab === label.toLowerCase() ? "0" : "-1"}">${socialIcons[icon]}<span>${label}</span></button>`)
    .join("");
}

function renderActiveTab() {
  renderTabs();
  const panel = document.querySelector("#profile-tab-panel");
  if (!panel) return;
  panel.setAttribute("role", "tabpanel");
  if (socialState.showingSaved) {
    panel.innerHTML = renderSavedGrid();
  } else if (socialState.tab === "reels") {
    panel.innerHTML = renderReelsGrid();
  } else if (socialState.tab === "shop") {
    panel.innerHTML = renderShopGrid();
  } else if (socialState.tab === "tagged") {
    panel.innerHTML = renderTaggedGrid();
  } else {
    panel.innerHTML = renderPostsGrid();
  }
}

function selectSocialTab(tab, options = {}) {
  if (!validSocialTabs.has(tab)) return;
  socialState.tab = tab;
  socialState.showingSaved = false;
  renderActiveTab();
  if (document.body.classList.contains("social-home") && options.history !== false) {
    const nextHash = `#${tab}`;
    if (window.location.hash !== nextHash) window.history.pushState({ tab }, "", nextHash);
  }
}

function renderSavedGrid() {
  const savedProducts = socialProducts.filter((product) => socialState.saved.has(product.id));
  if (!savedProducts.length) return `<div class="saved-empty">${socialIcons.wishlist}<strong>No saved pieces yet</strong><p>Tap the bookmark on a post or shop item to build your wishlist.</p><button type="button" data-social-tab="shop">Browse shop</button></div>`;
  return `<header class="saved-heading"><div><span>Wishlist</span><h2>Saved pieces</h2></div><strong>${savedProducts.length} item${savedProducts.length === 1 ? "" : "s"}</strong></header><div class="social-shop-grid">${savedProducts.map((product) => shopCardMarkup(product)).join("")}</div>`;
}

function announce(message) {
  const status = document.querySelector("#social-status");
  if (status) status.textContent = message;
}

function showToast(message) {
  const toast = document.querySelector("#social-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(socialState.toastTimer);
  socialState.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  announce(message);
}

function rememberModalTrigger(trigger) {
  if (!(trigger instanceof HTMLElement)) return;
  if (trigger.closest("#social-modal-root") && socialState.lastFocused) return;
  socialState.lastFocused = trigger;
}

function whatsappQuickAction(label) {
  const messages = {
    "Ask price": "Hi Shivara.luxe, I would like to ask the price of a jewellery piece.",
    "Check availability": "Hi Shivara.luxe, could you please check availability for a jewellery piece?",
    "Custom order": "Hi Shivara.luxe, I would like to discuss a custom jewellery order.",
    "Delivery question": "Hi Shivara.luxe, I have a question about PAN India delivery."
  };
  return `https://wa.me/919457041215?text=${encodeURIComponent(messages[label])}`;
}

function openMessageSheet(trigger) {
  rememberModalTrigger(trigger);
  const actions = ["Ask price", "Check availability", "Custom order", "Delivery question"];
  const root = document.querySelector("#social-modal-root");
  if (!root) return;
  root.innerHTML = `<section class="social-sheet" role="dialog" aria-modal="true" aria-labelledby="message-sheet-title" data-modal><button class="social-sheet__backdrop" type="button" data-social-close aria-label="Close message options"></button><div class="social-sheet__panel"><header><div><span>Direct to WhatsApp</span><h2 id="message-sheet-title">Message Shivara.luxe</h2></div><button type="button" data-social-close aria-label="Close message options">×</button></header><p>Choose a quick question. Your WhatsApp message will be prepared and ready to send.</p><div class="message-actions">${actions.map((label) => `<a href="${whatsappQuickAction(label)}" target="_blank" rel="noreferrer">${socialIcons.messages}<span><strong>${label}</strong><small>Open a prepared WhatsApp message</small></span></a>`).join("")}</div></div></section>`;
  document.body.classList.add("social-modal-open");
  root.querySelector("[data-social-close]")?.focus();
}

function openNotifications(trigger) {
  rememberModalTrigger(trigger);
  const root = document.querySelector("#social-modal-root");
  if (!root) return;
  const groups = ["Today", "This Week", "Earlier"];
  root.innerHTML = `<section class="social-sheet social-sheet--notifications" role="dialog" aria-modal="true" aria-labelledby="notifications-title" data-modal><button class="social-sheet__backdrop" type="button" data-social-close aria-label="Close notifications"></button><div class="social-sheet__panel"><header><div><span>Shivara updates</span><h2 id="notifications-title">Notifications</h2></div><button type="button" data-social-close aria-label="Close notifications">×</button></header><button class="notifications-read-all" type="button" data-read-all>Mark all as read</button><div class="notification-groups">${groups.map((group) => `<section><h3>${group}</h3>${notificationItems.filter((item) => item.group === group).map((item) => `<button class="notification-item ${socialState.readNotifications.has(item.id) ? "is-read" : ""}" type="button" data-read-notification="${item.id}"><span class="notification-item__icon">${socialIcons[item.icon]}</span><span><strong>${item.title}</strong><small>${item.detail}</small></span><i aria-hidden="true"></i></button>`).join("")}</section>`).join("")}</div></div></section>`;
  document.body.classList.add("social-modal-open");
  root.querySelector("[data-social-close]")?.focus();
}

async function shareProduct(product) {
  const data = { title: product.title, text: `${product.title} from Shivara.luxe`, url: product.instagram || window.location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      showToast("Product link copied");
    }
  } catch (error) {
    if (error?.name !== "AbortError") showToast("Unable to share right now");
  }
}

function renderPostsGrid() {
  return `<div class="social-grid social-grid--posts">${socialProducts
    .map((product, index) => `
      <button class="social-post-tile" type="button" data-post-open="${index}" aria-label="Open post for ${product.title}">
        <img src="/${product.image}" alt="${product.title}" loading="${index < 9 ? "eager" : "lazy"}" decoding="async" />
        ${index % 7 === 0 ? '<span class="tile-corner tile-corner--carousel">▣</span>' : ""}
        ${shoppableIds.has(product.id) && index % 4 === 0 ? '<span class="tile-shop-badge">Shop</span>' : ""}
        <span class="social-post-tile__overlay"><span>${socialIcons.heart}${formatCount((product.likes || 0) + 240 + index * 11)}</span><span>${socialIcons.comment}${(index % 19) + 3}</span></span>
      </button>
    `)
    .join("")}</div>`;
}

function renderReelsGrid() {
  const reels = socialProducts.slice(0, 36);
  return `<div class="social-grid social-grid--reels">${reels
    .map((product, index) => `
      <button class="social-reel-tile" type="button" data-reels-open="${index}" aria-label="Open reel for ${product.title}">
        <img src="/${product.image}" alt="${product.title}" loading="${index < 9 ? "eager" : "lazy"}" decoding="async" />
        <span class="reel-play">${socialIcons.play}</span>
        <span class="reel-count">${socialIcons.play}${formatCount(product.views || 1200)}</span>
      </button>
    `)
    .join("")}</div>`;
}

function renderShopGrid() {
  return `<div class="social-shop-grid">${products.map((product, index) => shopCardMarkup(product, index)).join("")}</div>`;
}

function shopCardMarkup(product, index = 9) {
  const pricing = productPricing(product);
  const saved = socialState.saved.has(product.id);
  const shoppable = shoppableIds.has(product.id);
  return `
    <article class="social-shop-card">
      <button class="social-shop-card__media" type="button" ${shoppable ? `data-quick="${product.id}"` : `data-post-id="${product.id}"`} aria-label="View details for ${product.title}">
        <img src="/${product.image}" alt="${product.title}" loading="${index < 8 ? "eager" : "lazy"}" decoding="async" />
      </button>
      <button class="shop-save ${saved ? "is-active" : ""}" type="button" data-save-post="${product.id}" aria-label="${saved ? "Remove" : "Save"} ${product.title}" aria-pressed="${saved}">${socialIcons.wishlist}</button>
      <div class="social-shop-card__info">
        <h2>${product.title}</h2>
        <p>${product.category}</p>
        <strong>INR ${pricing.price}</strong>
        <div>${shoppable ? `<button type="button" data-add="${product.id}">${cart.has(product.id) ? "Add another" : "Quick add"}</button><button class="shop-view" type="button" data-quick="${product.id}">View</button>` : `<button type="button" data-post-id="${product.id}">View post</button>`}</div>
      </div>
    </article>
  `;
}

function renderTaggedGrid() {
  const editorial = socialProducts.filter((product, index) => index % 2 === 1).slice(0, 42);
  return `<div class="social-grid social-grid--tagged">${editorial
    .map((product, index) => `
      <button class="social-post-tile" type="button" data-post-id="${product.id}" aria-label="Open tagged post for ${product.title}">
        <img src="/${product.image}" alt="${product.title}" loading="${index < 9 ? "eager" : "lazy"}" decoding="async" />
        <span class="tile-shop-badge">Tagged</span>
        <span class="social-post-tile__overlay"><span>${socialIcons.profile}@shivara.luxe</span></span>
      </button>
    `)
    .join("")}</div>`;
}

function renderSocialHome() {
  if (!document.body.classList.contains("social-home")) return;
  renderSocialNav();
  renderProfileMeta();
  renderHighlights();
  renderActiveTab();
}

function syncSocialCounters() {
  document.querySelectorAll("[data-save-post]").forEach((button) => {
    const id = button.getAttribute("data-save-post");
    button.classList.toggle("is-active", socialState.saved.has(id));
    button.setAttribute("aria-pressed", String(socialState.saved.has(id)));
  });
  document.querySelectorAll("[data-like-post]").forEach((button) => {
    const id = button.getAttribute("data-like-post");
    button.classList.toggle("is-active", socialState.liked.has(id));
    button.setAttribute("aria-pressed", String(socialState.liked.has(id)));
  });
}

function openPostViewer(index) {
  const safeIndex = Math.max(0, Math.min(index, socialProducts.length - 1));
  socialState.postIndex = safeIndex;
  const product = socialProducts[safeIndex];
  const pricing = productPricing(product);
  const baseLikes = (product.likes || 0) + 240 + safeIndex * 11;
  const liked = socialState.liked.has(product.id);
  const saved = socialState.saved.has(product.id);
  const caption = productCaption(product);
  const quickButton = shoppableIds.has(product.id)
    ? `<button class="post-viewer__primary" type="button" data-quick="${product.id}">View Product</button>`
    : `<a class="post-viewer__primary" href="${product.instagram}" target="_blank" rel="noreferrer">View Product</a>`;

  const root = document.querySelector("#social-modal-root");
  if (!root) return;
  root.innerHTML = `
    <section class="post-viewer" role="dialog" aria-modal="true" aria-label="Shivara.luxe post viewer" data-modal>
      <button class="post-viewer__backdrop" type="button" data-social-close aria-label="Close post"></button>
      <article class="post-viewer__dialog">
        <button class="post-viewer__close" type="button" data-social-close aria-label="Close post">Close</button>
        <div class="post-viewer__media" data-like-post="${product.id}" data-like-surface>
          <img src="/${product.image}" alt="${product.title}" />
          ${safeIndex % 7 === 0 ? `<img src="/${socialProducts[(safeIndex + 1) % socialProducts.length].image}" alt="" />` : ""}
          <span class="post-heart-burst" aria-hidden="true">${socialIcons.heart}</span>
          <button class="post-viewer__step post-viewer__step--prev" type="button" data-post-prev aria-label="Previous post">‹</button>
          <button class="post-viewer__step post-viewer__step--next" type="button" data-post-next aria-label="Next post">›</button>
        </div>
        <div class="post-viewer__panel">
          <header class="post-viewer__header">
            <img src="/assets/instagram/profile.jpg" alt="" />
            <div><strong>shivara.luxe <span class="brand-badge brand-badge--small">✦</span></strong><span>${product.category} collection</span></div>
          </header>
          <div class="post-viewer__actions">
            <button type="button" data-like-post="${product.id}" aria-label="${liked ? "Unlike" : "Like"} ${product.title}" aria-pressed="${liked}">${socialIcons.heart}</button>
            <button type="button" data-message-open aria-label="Ask about this product">${socialIcons.comment}</button>
            <button type="button" data-share-product="${product.id}" aria-label="Share ${product.title}">${socialIcons.share}</button>
            <button type="button" data-save-post="${product.id}" aria-label="${saved ? "Remove from" : "Save to"} wishlist" aria-pressed="${saved}">${socialIcons.wishlist}</button>
          </div>
          <strong class="post-viewer__likes">${formatCount(baseLikes + (liked ? 1 : 0))} likes</strong>
          <p class="post-viewer__caption"><strong>shivara.luxe</strong> <span>${caption.slice(0, 170)}</span>${caption.length > 170 ? `<button type="button" data-expand-caption data-full-caption="${caption.replace(/"/g, "&quot;")}">more</button>` : ""}</p>
          <div class="post-viewer__product">
            <img src="/${product.image}" alt="" />
            <div><strong>${product.title}</strong><span>${product.category} · INR ${pricing.price}</span></div>
          </div>
          <div class="post-viewer__comments">
            <p><strong>Questions?</strong> Ask about price, sizing, availability, or customisation.</p>
            <p><strong>shivara.luxe</strong> WhatsApp to order · PAN India delivery.</p>
          </div>
          <div class="post-viewer__ctas">
            ${quickButton}
            <a class="post-viewer__secondary" href="${whatsappProductLink(product)}" target="_blank" rel="noreferrer">Order on WhatsApp</a>
          </div>
        </div>
      </article>
    </section>
  `;
  document.body.classList.add("social-modal-open");
  root.querySelector(".post-viewer__close")?.focus();
  syncSocialCounters();
}

function closeSocialModal(restoreFocus = true) {
  clearStoryTimer();
  const root = document.querySelector("#social-modal-root");
  if (root) root.innerHTML = "";
  document.body.classList.remove("social-modal-open", "story-open", "reels-open");
  const restoreTarget = socialState.lastFocused;
  socialState.lastFocused = null;
  if (restoreFocus && restoreTarget?.isConnected) window.requestAnimationFrame(() => restoreTarget.focus());
}

function toggleLike(productId, force = false) {
  const alreadyLiked = socialState.liked.has(productId);
  if (alreadyLiked && !force) socialState.liked.delete(productId);
  if (!alreadyLiked) socialState.liked.add(productId);
  saveSocialState();
  syncSocialCounters();
  const activeProductIndex = socialProducts.findIndex((product) => product.id === productId);
  if (activeProductIndex >= 0 && document.querySelector(".post-viewer")) {
    const product = socialProducts[activeProductIndex];
    const count = (product.likes || 0) + 240 + activeProductIndex * 11 + (socialState.liked.has(productId) ? 1 : 0);
    document.querySelector(".post-viewer__likes").textContent = `${formatCount(count)} likes`;
  }
}

function animateHeart(surface) {
  const burst = surface?.querySelector?.(".post-heart-burst");
  if (!burst) return;
  burst.classList.remove("is-visible");
  window.requestAnimationFrame(() => burst.classList.add("is-visible"));
}

function openStoryViewer(index) {
  socialState.storyIndex = Math.max(0, Math.min(index, storyHighlights.length - 1));
  renderStoryViewer();
}

function clearStoryTimer() {
  if (socialState.storyTimer) window.clearTimeout(socialState.storyTimer);
  socialState.storyTimer = null;
}

function scheduleStoryAdvance(duration = 5200) {
  clearStoryTimer();
  socialState.storyStartedAt = Date.now();
  socialState.storyRemaining = duration;
  socialState.storyTimer = window.setTimeout(() => moveStory(1), duration);
}

function renderStoryViewer() {
  const [label, title, id, cta] = storyHighlights[socialState.storyIndex];
  const product = socialProductById(id);
  const pricing = productPricing(product);
  const root = document.querySelector("#social-modal-root");
  if (!root) return;
  root.innerHTML = `
    <section class="story-viewer" role="dialog" aria-modal="true" aria-label="${label} story" data-modal>
      <div class="story-viewer__progress">${storyHighlights.map((_, index) => `<span class="${index < socialState.storyIndex ? "is-done" : index === socialState.storyIndex ? "is-active" : ""}"><i></i></span>`).join("")}</div>
      <header class="story-viewer__header"><img src="/assets/instagram/profile.jpg" alt="" /><strong>shivara.luxe</strong><span>${label}</span><button type="button" data-social-close aria-label="Close story">×</button></header>
      <button class="story-viewer__tap story-viewer__tap--prev" type="button" data-story-prev aria-label="Previous story"></button>
      <figure class="story-viewer__media"><img src="/${product.image}" alt="${title}" /><figcaption><strong>${title}</strong><span>${product.title} · INR ${pricing.price}</span></figcaption></figure>
      <button class="story-viewer__tap story-viewer__tap--next" type="button" data-story-next aria-label="Next story"></button>
      <a class="story-viewer__cta" href="${cta.includes("WhatsApp") || cta.includes("Message") ? whatsappProductLink(product) : "/collections/all"}" target="${cta.includes("WhatsApp") || cta.includes("Message") ? "_blank" : "_self"}" rel="noreferrer">${cta}</a>
    </section>
  `;
  document.body.classList.add("social-modal-open", "story-open");
  scheduleStoryAdvance();
  root.querySelector("[data-social-close]")?.focus();
}

function pauseStory() {
  if (!document.querySelector(".story-viewer") || socialState.storyPaused) return;
  socialState.storyPaused = true;
  socialState.storyRemaining = Math.max(700, socialState.storyRemaining - (Date.now() - socialState.storyStartedAt));
  clearStoryTimer();
  document.querySelector(".story-viewer")?.classList.add("is-paused");
}

function resumeStory() {
  if (!document.querySelector(".story-viewer") || !socialState.storyPaused) return;
  socialState.storyPaused = false;
  document.querySelector(".story-viewer")?.classList.remove("is-paused");
  scheduleStoryAdvance(socialState.storyRemaining);
}

function moveStory(delta) {
  const next = socialState.storyIndex + delta;
  if (next < 0 || next >= storyHighlights.length) {
    closeSocialModal();
    return;
  }
  socialState.storyIndex = next;
  renderStoryViewer();
}

function openReelsViewer(index = 0) {
  const reels = socialProducts.slice(0, 36);
  const root = document.querySelector("#social-modal-root");
  if (!root) return;
  root.innerHTML = `
    <section class="reels-viewer" role="dialog" aria-modal="true" aria-label="Shivara.luxe reels" data-modal>
      <button class="reels-viewer__close" type="button" data-social-close aria-label="Close reels">Close</button>
      <div class="reels-viewer__track" id="reels-track">${reels
        .map((product, reelIndex) => {
          const pricing = productPricing(product);
          return `
            <article class="reel-card ${reelIndex === index ? "is-active" : ""}" data-reel-card>
              <div class="reel-card__motion" data-reel-media><img src="/${product.image}" alt="${product.title}" /></div>
              <button class="reel-card__mute" type="button" data-reel-mute aria-label="Mute or unmute">Muted</button>
              <button class="reel-card__play" type="button" data-reel-play aria-label="Play or pause reel">${socialIcons.play}</button>
              <div class="reel-card__actions">
                <button type="button" data-like-post="${product.id}" aria-label="Like ${product.title}">${socialIcons.heart}<span>${formatCount((product.likes || 0) + 320)}</span></button>
                <button type="button" data-message-open aria-label="Ask about ${product.title}">${socialIcons.comment}<span>Ask</span></button>
                <a href="${whatsappProductLink(product)}" target="_blank" rel="noreferrer" aria-label="Share ${product.title} on WhatsApp">${socialIcons.share}<span>Share</span></a>
                <button type="button" data-save-post="${product.id}" aria-label="Save ${product.title} to wishlist">${socialIcons.wishlist}<span>Save</span></button>
              </div>
              <div class="reel-card__caption">
                <div><img src="/assets/instagram/profile.jpg" alt="" /><strong>shivara.luxe</strong><button type="button">Follow</button></div>
                <p>${productCaption(product).slice(0, 118)}</p>
                <span>${product.title} · INR ${pricing.price}</span>
                <button type="button" data-add="${product.id}" ${shoppableIds.has(product.id) ? "" : "disabled"}>Shop Now</button>
              </div>
            </article>
          `;
        })
        .join("")}</div>
    </section>
  `;
  document.body.classList.add("social-modal-open", "reels-open");
  const track = root.querySelector("#reels-track");
  track?.children[index]?.scrollIntoView({ block: "center" });
  setupReelObserver();
  syncSocialCounters();
  root.querySelector("[data-social-close]")?.focus();
}

function setupReelObserver() {
  const cards = document.querySelectorAll("[data-reel-card]");
  if (!cards.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting && entry.intersectionRatio > 0.65));
    },
    { threshold: [0.35, 0.65, 0.9] }
  );
  cards.forEach((card) => observer.observe(card));
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const navItem = target.closest("[data-social-nav]");
  if (navItem) {
    const key = navItem.getAttribute("data-social-nav");
    socialState.nav = key;
    document.querySelectorAll("[data-social-nav]").forEach((item) => item.classList.toggle("is-active", item.getAttribute("data-social-nav") === key));
    if (key === "search") {
      openDrawer("#search-drawer");
      renderSearch("");
    } else if (key === "reels") {
      openReelsViewer(0);
    } else if (key === "wishlist") {
      socialState.showingSaved = true;
      renderActiveTab();
      document.querySelector("#profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (key === "profile" || key === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (key === "messages") {
      openMessageSheet(navItem);
    } else if (key === "notifications") {
      openNotifications(navItem);
    } else if (key === "explore") {
      selectSocialTab("posts");
      document.querySelector("#profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (key === "create") {
      openMessageSheet(navItem);
    } else if (key === "more") {
      openNotifications(navItem);
    }
    return;
  }
  const tabButton = target.closest("[data-social-tab]");
  if (tabButton) {
    selectSocialTab(tabButton.getAttribute("data-social-tab") || "posts");
    return;
  }
  const storyButton = target.closest("[data-story-open]");
  if (storyButton) {
    rememberModalTrigger(storyButton);
    openStoryViewer(Number(storyButton.getAttribute("data-story-open") || 0));
    return;
  }
  if (target.closest("[data-social-close]")) {
    closeSocialModal();
    return;
  }
  if (target.closest("[data-story-prev]")) {
    moveStory(-1);
    return;
  }
  if (target.closest("[data-story-next]")) {
    moveStory(1);
    return;
  }
  const postOpen = target.closest("[data-post-open]");
  if (postOpen) {
    rememberModalTrigger(postOpen);
    openPostViewer(Number(postOpen.getAttribute("data-post-open") || 0));
    return;
  }
  const postIdOpen = target.closest("[data-post-id]");
  if (postIdOpen) {
    rememberModalTrigger(postIdOpen);
    if (postIdOpen.matches("[data-search-result]")) {
      rememberSearch(document.querySelector("#drawer-search")?.value || postIdOpen.querySelector("strong")?.textContent || "");
      closeDrawers();
      socialState.lastFocused = document.querySelector('[data-social-nav="search"]');
    }
    const index = socialProducts.findIndex((product) => product.id === postIdOpen.getAttribute("data-post-id"));
    openPostViewer(index >= 0 ? index : 0);
    return;
  }
  const reelsOpen = target.closest("[data-reels-open]");
  if (reelsOpen) {
    rememberModalTrigger(reelsOpen);
    openReelsViewer(Number(reelsOpen.getAttribute("data-reels-open") || 0));
    return;
  }
  if (target.closest("[data-post-prev]")) {
    openPostViewer((socialState.postIndex - 1 + socialProducts.length) % socialProducts.length);
    return;
  }
  if (target.closest("[data-post-next]")) {
    openPostViewer((socialState.postIndex + 1) % socialProducts.length);
    return;
  }
  const likeButton = target.closest("[data-like-post]");
  if (likeButton && !target.closest("[data-like-surface]")) {
    toggleLike(likeButton.getAttribute("data-like-post"));
    return;
  }
  const saveButton = target.closest("[data-save-post]");
  if (saveButton) {
    const id = saveButton.getAttribute("data-save-post");
    if (socialState.saved.has(id)) socialState.saved.delete(id);
    else socialState.saved.add(id);
    saveSocialState();
    syncSocialCounters();
    renderSocialNav();
    if (socialState.showingSaved) renderActiveTab();
    renderWishlist();
    showToast(socialState.saved.has(id) ? "Saved to your wishlist" : "Removed from your wishlist");
    return;
  }
  const productFilter = target.closest("[data-product-filter]");
  if (productFilter) {
    const filter = productFilter.getAttribute("data-product-filter") || "All";
    document.querySelectorAll("[data-product-filter]").forEach((button) => {
      const active = button === productFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderCommerceHome(filter);
    return;
  }
  const captionButton = target.closest("[data-expand-caption]");
  if (captionButton) {
    const caption = captionButton.getAttribute("data-full-caption") || "";
    captionButton.parentElement.querySelector("span").textContent = caption;
    captionButton.remove();
    return;
  }
  if (target.closest("[data-shop-now]")) {
    selectSocialTab("shop");
    document.querySelector("#profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (target.closest("[data-message-open]")) {
    openMessageSheet(target.closest("[data-message-open]"));
    return;
  }
  if (target.closest("[data-notifications-open]")) {
    openNotifications(target.closest("[data-notifications-open]"));
    return;
  }
  const readNotification = target.closest("[data-read-notification]");
  if (readNotification) {
    socialState.readNotifications.add(readNotification.getAttribute("data-read-notification"));
    saveSocialState();
    readNotification.classList.add("is-read");
    renderSocialNav();
    return;
  }
  if (target.closest("[data-read-all]")) {
    notificationItems.forEach((item) => socialState.readNotifications.add(item.id));
    saveSocialState();
    openNotifications(socialState.lastFocused);
    renderSocialNav();
    announce("All notifications marked as read");
    return;
  }
  const shareButton = target.closest("[data-share-product]");
  if (shareButton) {
    shareProduct(socialProductById(shareButton.getAttribute("data-share-product")));
    return;
  }
  if (target.closest("[data-share-profile]")) {
    const shareData = { title: "Shivara.luxe", text: "Shop statement jewellery from Shivara.luxe", url: window.location.href };
    if (navigator.share) navigator.share(shareData).catch(() => {});
    else navigator.clipboard?.writeText(window.location.href).then(() => showToast("Profile link copied"));
    return;
  }
  if (target.closest("[data-reel-media]")) {
    target.closest("[data-reel-card]")?.classList.toggle("is-paused");
    return;
  }
  if (target.closest("[data-reel-play]")) {
    target.closest("[data-reel-card]")?.classList.toggle("is-paused");
    return;
  }
  if (target.closest("[data-reel-mute]")) {
    const button = target.closest("[data-reel-mute]");
    button.classList.toggle("is-unmuted");
    button.textContent = button.classList.contains("is-unmuted") ? "Sound on" : "Muted";
    return;
  }
  if (target.closest("[data-search-open]")) {
    openDrawer("#search-drawer");
    renderSearch("");
    return;
  }
  const recentSearch = target.closest("[data-recent-search]");
  if (recentSearch) {
    const value = recentSearch.getAttribute("data-recent-search") || "";
    const input = document.querySelector("#drawer-search");
    if (input) input.value = value;
    renderSearch(value);
    return;
  }
  if (target.closest("[data-clear-searches]")) {
    recentSearches = [];
    localStorage.removeItem("shivara-recent-searches");
    renderSearch("");
    announce("Recent searches cleared");
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
  if (target.closest("[data-wishlist-open]")) {
    setWishlistOpen(true);
    return;
  }
  if (target.closest("[data-wishlist-close]")) {
    setWishlistOpen(false);
    return;
  }
  const addButton = target.closest("[data-add]");
  if (addButton) {
    const id = addButton.getAttribute("data-add");
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    closeQuickView();
    setWishlistOpen(false);
    setCartOpen(true);
    showToast("Added to your inquiry bag");
    return;
  }
  const quickButton = target.closest("[data-quick]");
  if (quickButton) {
    const product = productById(quickButton.getAttribute("data-quick"));
    quickViewTrigger = document.querySelector(".post-viewer") ? socialState.lastFocused : quickButton;
    if (document.querySelector(".post-viewer")) closeSocialModal(false);
    openQuickView(product);
    return;
  }
  if (target.closest("[data-quick-close]")) {
    closeQuickView();
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
  if (event.target?.matches?.("#drawer-search") && event.key === "Enter") {
    rememberSearch(event.target.value);
    renderSearch(event.target.value);
  }
  if (event.target?.matches?.("[data-social-tab]") && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const tabs = Array.from(document.querySelectorAll("[data-social-tab]"));
    const current = tabs.indexOf(event.target);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    selectSocialTab(nextTab.getAttribute("data-social-tab") || "posts");
    document.querySelector(`[data-social-tab="${socialState.tab}"]`)?.focus();
  }
  if (event.key === "Escape") {
    closeDrawers();
    setCartOpen(false);
    setWishlistOpen(false);
    closeQuickView();
    closeSocialModal();
  }
  if (event.key === "Tab") {
    const modal = Array.from(document.querySelectorAll("[data-modal]")).find(
      (item) => item.getAttribute("aria-hidden") !== "true" && item.getClientRects().length > 0
    );
    if (modal) {
      const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(
        (item) => item.offsetParent !== null
      );
      if (focusable.length) {
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
    }
  }
  if (document.querySelector(".post-viewer")) {
    if (event.key === "ArrowLeft") openPostViewer((socialState.postIndex - 1 + socialProducts.length) % socialProducts.length);
    if (event.key === "ArrowRight") openPostViewer((socialState.postIndex + 1) % socialProducts.length);
  }
  if (document.querySelector(".story-viewer")) {
    if (event.key === "ArrowLeft") moveStory(-1);
    if (event.key === "ArrowRight") moveStory(1);
  }
});

document.addEventListener("dblclick", (event) => {
  const surface = event.target instanceof Element ? event.target.closest("[data-like-surface]") : null;
  if (!surface) return;
  toggleLike(surface.getAttribute("data-like-post"), true);
  animateHeart(surface);
});

let lastTap = 0;
document.addEventListener("touchend", (event) => {
  const surface = event.target instanceof Element ? event.target.closest("[data-like-surface]") : null;
  if (!surface) return;
  const now = Date.now();
  if (now - lastTap < 280) {
    toggleLike(surface.getAttribute("data-like-post"), true);
    animateHeart(surface);
  }
  lastTap = now;
});

document.addEventListener("pointerdown", (event) => {
  if (event.target instanceof Element && event.target.closest(".story-viewer__media")) pauseStory();
});

document.addEventListener("pointerup", resumeStory);
document.addEventListener("pointercancel", resumeStory);

let storyTouchX = null;
document.addEventListener("touchstart", (event) => {
  if (!document.querySelector(".story-viewer")) return;
  storyTouchX = event.touches[0]?.clientX ?? null;
});

document.addEventListener("touchend", (event) => {
  if (!document.querySelector(".story-viewer") || storyTouchX === null) return;
  const endX = event.changedTouches[0]?.clientX ?? storyTouchX;
  if (Math.abs(endX - storyTouchX) > 44) moveStory(endX < storyTouchX ? 1 : -1);
  storyTouchX = null;
});

function syncTabFromLocation() {
  if (!document.body.classList.contains("social-home")) return;
  const tab = window.location.hash.slice(1);
  if (!validSocialTabs.has(tab) || tab === socialState.tab && !socialState.showingSaved) return;
  socialState.tab = tab;
  socialState.showingSaved = false;
  renderActiveTab();
}

window.addEventListener("popstate", syncTabFromLocation);
window.addEventListener("hashchange", syncTabFromLocation);
document.addEventListener(
  "load",
  (event) => {
    const image = event.target instanceof HTMLImageElement ? event.target : null;
    image?.closest(".social-post-tile, .social-reel-tile, .social-shop-card__media")?.classList.add("is-loaded");
  },
  true
);

injectSharedLayout();
ensureSocialMounts();
ensureQuickView();
renderHome();
renderCollection();
renderCart();
renderSocialHome();
renderCommerceHome();
if (document.body.classList.contains("social-home") && !window.location.hash) window.history.replaceState({ tab: socialState.tab }, "", `#${socialState.tab}`);
