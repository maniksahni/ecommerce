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
const discoveryEdits = {
  Everyday: { category: "Pendants", title: "Polished, never overdone.", copy: "Easy neckwear and quiet details that make a simple outfit feel considered." },
  Party: { category: "Earrings", title: "Turn up the detail.", copy: "High-impact accents that catch light and hold attention." },
  "Date Night": { category: "Rings", title: "A little closer.", copy: "Romantic shine, sculptural rings and details worth noticing." },
  Gifting: { category: "Gifting", title: "The reaction is the gift.", copy: "Gift-ready pieces with personal help when you need a second opinion." },
  Office: { category: "Anti-tarnish", title: "Your weekday signature.", copy: "Clean, repeatable jewellery that works hard across your wardrobe." },
  "Statement Look": { category: "Evil Eye", title: "Nothing about blending in.", copy: "Graphic protection motifs and pieces with unmistakable personality." }
};
const shivaraLooks = [
  { title: "Everyday Stack", image: "assets/instagram-shop/post-049-DW9Cf8OkWo0.jpg", ids: ["DW9Cf8OkWo0", "DXMpqNMxs1F", "DV0yEUUkTHq"], positions: [[23, 56], [56, 31], [72, 68]] },
  { title: "Statement Night", image: "assets/instagram-shop/post-090-DVsiM2WEctG.jpg", ids: ["DVsiM2WEctG", "DXO-ucIBdig", "DXKG78JhH1P"], positions: [[28, 64], [62, 38], [77, 72]] },
  { title: "Gift-Ready Edit", image: "assets/instagram-shop/post-103-DUsq31AgXWw.jpg", ids: ["DUsq31AgXWw", "DWERaGlEYB6", "DXRflQ2ARK2"], positions: [[22, 42], [54, 66], [76, 30]] }
];
const heroSlides = [
  { id: "DW3H_GZDD_4", label: "THE SIGNATURE DROP", title: ["Not made", "to blend in."], copy: "Jewellery that finishes the entire look.", tone: "#11100e" },
  { id: "DVsiM2WEctG", label: "THE RING EDIT", title: ["Small detail.", "Major effect."], copy: "Sculptural shine for hands that do the talking.", tone: "#2a2118" },
  { id: "DXRflQ2ARK2", label: "THE NECKLINE EDIT", title: ["One piece.", "Whole look."], copy: "An everyday pendant with main-character energy.", tone: "#16201d" }
];
const finderQuestions = [
  { key: "shoppingFor", label: "What are you shopping for?", options: ["Yourself", "A gift"] },
  { key: "mood", label: "Choose the mood.", options: ["Minimal", "Everyday", "Statement", "Romantic", "Protective", "Party"] },
  { key: "budget", label: "Choose a budget.", options: ["Under ₹499", "₹500–₹999", "₹1,000 and above"] }
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
let activeStageIndex = 0;
let activeLookIndex = 0;
let activeLookProduct = 0;
let activeHeroIndex = 0;
let heroStartX = 0;
let finderState = (() => {
  try {
    return { shoppingFor: "", mood: "", budget: "", ...JSON.parse(sessionStorage.getItem("shivara-finder") || "{}") };
  } catch {
    return { shoppingFor: "", mood: "", budget: "" };
  }
})();
let lastAddedId = "";
let searchDebounce = 0;

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
  lastAddedId = id;
  saveCart();
  renderCart();
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.classList.remove("is-bumping");
    window.requestAnimationFrame(() => badge.classList.add("is-bumping"));
  });
  showToast(`${product.title} added to bag`);
}

function addProductsToCart(source) {
  source.forEach((product) => {
    if (!product) return;
    const variant = productVariants(product)[0];
    const existing = cart.find((item) => item.id === product.id && item.variant === variant);
    if (existing) existing.qty += 1;
    else cart.push({ id: product.id, variant, qty: 1 });
    lastAddedId = product.id;
  });
  saveCart();
  renderCart();
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.classList.remove("is-bumping");
    window.requestAnimationFrame(() => badge.classList.add("is-bumping"));
  });
  showToast(`${source.length} pieces added to your bag`);
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
          <img class="jlt-product-card__image jlt-product-card__image--primary" src="/${product.image}" alt="${escapeMarkup(product.title)}" width="640" height="800" ${eager} decoding="async" />
          <img class="jlt-product-card__image jlt-product-card__image--secondary" src="/${product.image}" alt="" width="640" height="800" loading="lazy" decoding="async" />
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
        <div class="atelier-swatches" aria-label="Available finishes">${variants.slice(0, 3).map((variant, index) => `<i class="atelier-swatch atelier-swatch--${index}" title="${escapeMarkup(variant)}"></i>`).join("")}</div>
        <button class="jlt-product-card__add" type="button" ${variants.length > 1 ? `data-quick-view="${product.id}"` : `data-card-add="${product.id}"`}>
          ${variants.length > 1 ? "Choose Options" : "Add to Bag"}
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
          <span><img src="/assets/instagram-shop/${image}" alt="${escapeMarkup(label)} jewellery edit" width="480" height="640" loading="lazy" decoding="async" /></span>
          <strong>${label}</strong>
          <em>${category === "All" ? products.length : products.filter((product) => product.category === (category === "Celebrity" ? "Anti-tarnish" : category)).length} pieces</em>
        </a>
      `
    )
    .join("");
  renderFinishNavigator(sessionStorage.getItem("shivara-finish-category") || "Earrings");
}

function renderFinishNavigator(category) {
  const mount = document.querySelector("#finish-navigator");
  if (!mount) return;
  const activeCategory = categoryRail.find(([, value]) => value === category) || categoryRail[2];
  const [label, value, image] = activeCategory;
  const featured = productsForCategory(value === "Celebrity" ? "Anti-tarnish" : value, 3);
  sessionStorage.setItem("shivara-finish-category", value);
  mount.innerHTML = `<div class="finish-navigator__labels" role="tablist" aria-label="Choose a jewellery category">${categoryRail.filter(([, item]) => item !== "Celebrity").map(([itemLabel, item]) => `<button class="${item === value ? "is-active" : ""}" type="button" role="tab" aria-selected="${item === value}" data-finish-category="${escapeMarkup(item)}">${itemLabel}<span>${item === "All" ? products.length : products.filter((product) => product.category === item).length}</span></button>`).join("")}</div><div class="finish-navigator__visual"><img src="/assets/instagram-shop/${image}" alt="${escapeMarkup(label)} from Shivara" loading="lazy" decoding="async" /><div><p class="atelier-kicker">${escapeMarkup(label)}</p><h3>${finishCategoryCopy(value).title}</h3><p>${finishCategoryCopy(value).copy}</p><a class="atelier-button atelier-button--ivory" href="${collectionUrl(value)}">Shop This Edit</a></div></div><div class="finish-navigator__products">${featured.map((product) => `<button type="button" data-quick-view="${product.id}"><img src="/${product.image}" alt="" loading="lazy" /><span><strong>${escapeMarkup(product.title)}</strong><small>${formatPrice(productPricing(product).price)}</small></span></button>`).join("")}</div>`;
}

function finishCategoryCopy(category) {
  const copy = {
    All: { title: "The newest finishing moves.", copy: "Fresh from the Shivara atelier and ready to enter your rotation." },
    Earrings: { title: "The detail that changes everything.", copy: "From quiet shine to party energy, meet your final touch." },
    Pendants: { title: "Pull the whole look together.", copy: "Everyday pendants and expressive neckwear designed for easy layering." },
    Bracelets: { title: "Build the stack your way.", copy: "Start with one signature, then add texture and personality." },
    Rings: { title: "Small detail. Major effect.", copy: "Sculptural, romantic and adjustable shapes for every mood." },
    "Evil Eye": { title: "Protection with personality.", copy: "Graphic symbols and confident details made to be noticed." },
    "Anti-tarnish": { title: "Made for the regular rotation.", copy: "Polished everyday icons selected for repeat wear." },
    Gifting: { title: "The reaction is the gift.", copy: "Gift-ready pieces with personal help whenever you need it." }
  };
  return copy[category] || copy.All;
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
  renderProductGrid(document.querySelector('[data-commerce-products="Earrings"]'), productsForCategory("Earrings", 6));
  renderProductGrid(document.querySelector('[data-commerce-products="Bracelets"]'), productsForCategory("Bracelets", 8));
  renderDiscovery();
  renderSignatureStage();
  renderLookbook();
  renderMotionShop();
  renderHero();
  renderFinder();
  renderHomeRecentlyViewed();
}

function renderHero(index = activeHeroIndex) {
  const hero = document.querySelector(".atelier-hero");
  if (!hero) return;
  activeHeroIndex = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[activeHeroIndex];
  const product = productMap.get(slide.id);
  const value = productPricing(product);
  hero.style.setProperty("--hero-tone", slide.tone);
  hero.querySelector(".atelier-hero__media img").src = `/${product.image}`;
  hero.querySelector(".atelier-hero__media img").alt = `${product.title} featured in the Shivara drop`;
  hero.querySelector(".atelier-kicker").textContent = slide.label;
  hero.querySelector("h1").innerHTML = slide.title.map((line) => `<span>${escapeMarkup(line)}</span>`).join(" ");
  hero.querySelector(".atelier-hero__content > p:not(.atelier-kicker)").textContent = slide.copy;
  const featureLink = hero.querySelector(".atelier-hero__actions a:last-child");
  featureLink.href = productUrl(product);
  featureLink.textContent = "View Featured Piece";
  hero.querySelector(".atelier-hero__product").href = productUrl(product);
  hero.querySelector(".atelier-hero__product").innerHTML = `<span>${String(activeHeroIndex + 1).padStart(2, "0")}</span><span>${escapeMarkup(product.title)}</span><strong>${formatPrice(value.price)}</strong>`;
  hero.querySelector(".atelier-hero__progress").innerHTML = `<i style="--hero-progress:${((activeHeroIndex + 1) / heroSlides.length) * 100}%"></i><span>${String(activeHeroIndex + 1).padStart(2, "0")} / ${String(heroSlides.length).padStart(2, "0")}</span>`;
  if (!hero.querySelector(".atelier-hero__controls")) hero.insertAdjacentHTML("beforeend", '<div class="atelier-hero__controls"><button type="button" data-hero-prev aria-label="Previous Shivara drop">←</button><button type="button" data-hero-next aria-label="Next Shivara drop">→</button></div>');
}

function renderFinder() {
  const steps = document.querySelector("#finder-steps");
  const result = document.querySelector("#finder-result");
  if (!steps || !result) return;
  steps.innerHTML = finderQuestions.map((question, index) => `<fieldset><legend><span>0${index + 1}</span>${question.label}</legend><div>${question.options.map((option) => `<button class="${finderState[question.key] === option ? "is-active" : ""}" type="button" data-finder-key="${question.key}" data-finder-value="${escapeMarkup(option)}" aria-pressed="${finderState[question.key] === option}">${option}</button>`).join("")}</div></fieldset>`).join("");
  if (!Object.values(finderState).every(Boolean)) {
    result.innerHTML = '<div class="finder-waiting"><span>01 / 03</span><p>Make three choices to reveal your Shivara edit.</p></div>';
    return;
  }
  const categoryByMood = { Minimal: "Anti-tarnish", Everyday: "Pendants", Statement: "Rings", Romantic: "Rings", Protective: "Evil Eye", Party: "Earrings" };
  const category = finderState.shoppingFor === "A gift" ? "Gifting" : categoryByMood[finderState.mood];
  const max = finderState.budget === "Under ₹499" ? 499 : finderState.budget === "₹500–₹999" ? 999 : Infinity;
  let matches = products.filter((product) => product.category === category && productPricing(product).price <= max);
  if (!matches.length) matches = products.filter((product) => productPricing(product).price <= max);
  matches = matches.slice(0, 4);
  result.innerHTML = `<div class="finder-result__heading"><p class="atelier-kicker">YOUR SHIVARA EDIT</p><h3>${finderState.mood} pieces ${finderState.shoppingFor === "A gift" ? "made for giving" : "picked for you"}.</h3><p>${finderState.mood === "Protective" ? "Graphic details with meaning and personality." : "A focused edit that works with the mood, occasion and budget you chose."}</p></div><div class="finder-result__products">${matches.map((product) => `<label><input type="checkbox" value="${product.id}" checked /><img src="/${product.image}" alt="${escapeMarkup(product.title)}" loading="lazy" /><strong>${escapeMarkup(product.title)}</strong><small>${formatPrice(productPricing(product).price)}</small></label>`).join("")}</div><div class="finder-result__actions"><button type="button" data-finder-save>Save This Edit</button><button type="button" data-finder-add>Add Selected to Bag</button><a data-finder-whatsapp href="${finderWhatsapp(matches)}" target="_blank" rel="noreferrer">Send on WhatsApp</a></div>`;
}

function selectedFinderProducts() {
  return Array.from(document.querySelectorAll("#finder-result input:checked")).map((input) => productMap.get(input.value)).filter(Boolean);
}

function finderWhatsapp(source = selectedFinderProducts()) {
  const lines = source.map((product) => `${product.title} (${product.id}) - ${formatPrice(productPricing(product).price)}`);
  const message = `Hi Shivara.luxe, I used the Jewellery Finder.\nShopping for: ${finderState.shoppingFor}\nMood: ${finderState.mood}\nBudget: ${finderState.budget}\n\nMy edit:\n${lines.join("\n")}\n\nPlease help me choose.`;
  return `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
}

function renderHomeRecentlyViewed() {
  const mount = document.querySelector("#home-recent-products");
  const section = document.querySelector(".recently-viewed-home");
  if (!mount || !section) return;
  const viewed = readLocalJson("shivara-recently-viewed", []).map((id) => productMap.get(id)).filter(Boolean).slice(0, 5);
  section.hidden = viewed.length === 0;
  renderProductGrid(mount, viewed);
}

function renderDiscovery(selected = sessionStorage.getItem("shivara-discovery") || "Everyday") {
  const options = document.querySelector("#discovery-options");
  const result = document.querySelector("#discovery-result");
  if (!options || !result) return;
  const edit = discoveryEdits[selected] || discoveryEdits.Everyday;
  sessionStorage.setItem("shivara-discovery", selected);
  options.innerHTML = Object.keys(discoveryEdits).map((label) => `<button class="${label === selected ? "is-active" : ""}" type="button" data-discovery="${escapeMarkup(label)}" aria-pressed="${label === selected}">${label}</button>`).join("");
  const editProducts = productsForCategory(edit.category, 3);
  result.innerHTML = `<div class="discovery-lab__note"><h3>${edit.title}</h3><p>${edit.copy}</p><a class="store-text-link" href="${collectionUrl(edit.category)}">Shop This Edit <span>→</span></a></div><div class="discovery-lab__products">${editProducts.map((product) => `<a class="discovery-mini" href="${productUrl(product)}"><img src="/${product.image}" alt="" loading="lazy" decoding="async" /><span><strong>${escapeMarkup(product.title)}</strong><small>${formatPrice(productPricing(product).price)}</small></span></a>`).join("")}</div>`;
}

function renderSignatureStage(index = activeStageIndex) {
  const active = document.querySelector("#signature-active");
  const rail = document.querySelector("#signature-rail");
  if (!active || !rail) return;
  const stageProducts = products.slice(0, 7);
  activeStageIndex = Math.max(0, Math.min(index, stageProducts.length - 1));
  const product = stageProducts[activeStageIndex];
  const pricing = productPricing(product);
  active.innerHTML = `<img src="/${product.image}" alt="${escapeMarkup(product.title)}" decoding="async" /><div class="signature-stage__active-copy"><p class="atelier-kicker">${categoryLabels[product.category] || product.category}</p><h3>${escapeMarkup(product.title)}</h3><p>Style it solo or let it anchor your complete Shivara edit.</p><div class="signature-stage__active-actions"><button class="atelier-button atelier-button--ivory" type="button" data-card-add="${product.id}">Add to Bag · ${formatPrice(pricing.price)}</button><a class="atelier-button atelier-button--line" href="${productUrl(product)}">View Details</a></div></div>`;
  rail.innerHTML = stageProducts.map((item, itemIndex) => `<button class="${itemIndex === activeStageIndex ? "is-active" : ""}" type="button" role="option" aria-selected="${itemIndex === activeStageIndex}" data-stage-product="${itemIndex}"><img src="/${item.image}" alt="" loading="lazy" /><span><strong>${escapeMarkup(item.title)}</strong><span>${formatPrice(productPricing(item).price)}</span></span></button>`).join("");
}

function renderLookbook(lookIndex = activeLookIndex, productIndex = activeLookProduct) {
  const tabs = document.querySelector("#look-tabs");
  const visual = document.querySelector("#look-visual");
  const summary = document.querySelector("#look-summary");
  if (!tabs || !visual || !summary) return;
  activeLookIndex = lookIndex;
  activeLookProduct = productIndex;
  const look = shivaraLooks[lookIndex];
  const lookProducts = look.ids.map((id) => productMap.get(id)).filter(Boolean);
  const activeProduct = lookProducts[productIndex] || lookProducts[0];
  tabs.innerHTML = shivaraLooks.map((item, index) => `<button class="${index === lookIndex ? "is-active" : ""}" type="button" role="tab" aria-selected="${index === lookIndex}" data-look="${index}"><span>${String(index + 1).padStart(2, "0")} · ${item.title}</span><span>→</span></button>`).join("");
  visual.innerHTML = `<img src="/${look.image}" alt="${escapeMarkup(look.title)}" loading="lazy" decoding="async" />${lookProducts.map((product, index) => `<button class="look-hotspot" style="left:${look.positions[index][0]}%;top:${look.positions[index][1]}%" type="button" data-look-product="${index}" aria-label="View ${escapeMarkup(product.title)}">+</button>`).join("")}${activeProduct ? `<article class="look-popover" style="left:${Math.min(look.positions[productIndex]?.[0] || 20, 62)}%;top:${Math.min(look.positions[productIndex]?.[1] || 20, 70)}%"><img src="/${activeProduct.image}" alt="" /><div><strong>${escapeMarkup(activeProduct.title)}</strong><small>${formatPrice(productPricing(activeProduct).price)}</small><button type="button" data-card-add="${activeProduct.id}">Add to Bag</button></div></article>` : ""}`;
  summary.innerHTML = `<p>${lookProducts.length} real Shivara pieces, selected to work together.</p><button type="button" data-add-look="${lookIndex}">Add Complete Look · ${formatPrice(lookProducts.reduce((total, product) => total + productPricing(product).price, 0))}</button>`;
}

function renderMotionShop() {
  const mount = document.querySelector("#motion-shop-rail");
  if (!mount) return;
  mount.innerHTML = products.slice(3, 8).map((product, index) => `<article class="motion-card ${index === 0 ? "is-active" : ""}" data-motion-card><img src="/${product.image}" alt="${escapeMarkup(product.title)}" loading="lazy" decoding="async" /><div class="motion-card__tag">TAGGED · 01</div><button class="motion-card__toggle" type="button" data-motion-toggle aria-pressed="false">Pause motion</button><div class="motion-card__progress" aria-hidden="true"><i></i></div><div class="motion-card__content"><strong>${escapeMarkup(product.title)}</strong><span>${formatPrice(productPricing(product).price)}</span><div><button type="button" data-card-add="${product.id}">Add to Bag</button><a href="${productUrl(product)}">View Product</a></div></div></article>`).join("");
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
      <div class="store-mega" aria-label="Featured shop menu">
        <nav><small>SHOP BY TYPE</small><a href="${collectionUrl("Earrings")}">Earrings</a><a href="${collectionUrl("Pendants")}">Neck Wear</a><a href="${collectionUrl("Bracelets")}">Bracelets</a><a href="/collections/rings">Rings</a></nav>
        <nav><small>SHIVARA EDITS</small><a href="/collections/all">New Arrivals</a><a href="${collectionUrl("Evil Eye")}">Evil Eye</a><a href="${collectionUrl("Anti-tarnish")}">Anti Tarnish</a><a href="${collectionUrl("Gifting")}">Gift Room</a></nav>
        <a class="store-mega__feature" href="${collectionUrl("Bracelets")}"><img src="/assets/instagram-shop/post-049-DW9Cf8OkWo0.jpg" alt="" /><span>Build a signature stack →</span></a>
        <a class="store-mega__feature" href="/products/DXRflQ2ARK2"><img src="/assets/instagram-shop/post-036-DXRflQ2ARK2.jpg" alt="" /><span>Trending: Tulip Pendant →</span></a>
      </div>
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
          <div class="mobile-menu-feature"><img src="/assets/instagram-shop/post-090-DVsiM2WEctG.jpg" alt="" /><span>THE SIGNATURE DROP</span></div>
          <nav class="commerce-mobile-nav">${categoryRail.map(([label, category], index) => `<a href="${collectionUrl(category)}"><span>${label}</span><b>${String(index + 1).padStart(2, "0")}</b></a>`).join("")}</nav>
          <div class="mobile-menu-links"><a href="/wishlist">Saved to Your Edit</a><button type="button" data-account-placeholder>Account</button><a href="https://wa.me/919457041215">Order Assistance</a></div>
          <a class="commerce-mobile-nav__whatsapp" href="https://wa.me/919457041215">Ask a Shivara stylist <span>→</span></a>
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
          <div class="commerce-cart-lines" id="cart-items" aria-live="polite" aria-label="Products in your bag"></div>
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
  if (!document.querySelector("#shivara-concierge")) {
    const questions = [
      ["Help me choose a gift", "I need help choosing a Shivara gift. Please ask me about the occasion and budget."],
      ["Build a jewellery stack", "Please help me build a Shivara jewellery stack."],
      ["Find something under ₹499", "Please show me Shivara pieces under ₹499."],
      ["Check product availability", "I would like to check product availability."],
      ["Ask about delivery", "I have a question about Shivara delivery."],
      ["Request a custom piece", "I would like to discuss a custom jewellery piece."]
    ];
    document.body.insertAdjacentHTML("beforeend", `<aside class="concierge" id="shivara-concierge"><button class="concierge__trigger" type="button" data-concierge-toggle aria-expanded="false"><i></i><span>Ask Shivara</span><b>S</b></button><div class="concierge__panel"><p class="atelier-kicker">STYLE CONCIERGE</p><h2>What can we help with?</h2><p>Choose a starting point. WhatsApp opens with the details prepared; no one is presented as currently online.</p><nav class="concierge__options">${questions.map(([label, message]) => `<a href="https://wa.me/919457041215?text=${encodeURIComponent(`Hi Shivara.luxe, ${message}`)}" target="_blank" rel="noreferrer">${label}<span>↗</span></a>`).join("")}</nav></div></aside>`);
  }
  if (!document.querySelector("#mobile-dock")) {
    document.body.insertAdjacentHTML("beforeend", `<nav class="mobile-dock" id="mobile-dock" aria-label="Quick navigation"><a href="/" aria-label="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>Home</span></a><button type="button" data-search-open><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m15.5 15.5 5 5" stroke="currentColor"/></svg><span>Search</span></button><button type="button" data-wishlist-open><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6c-2-2-5-2-7 0l-1 1-1-1C9 4 6 4 4 6s-2 5 0 7l8 8 8-8c2-2 2-5 0-7Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>Edit</span></button><button type="button" data-cart-open><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Zm4 0a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span>Bag</span></button></nav>`);
  }
  if (document.body.dataset.page === "home" && !sessionStorage.getItem("shivara-entry") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sessionStorage.setItem("shivara-entry", "seen");
    document.body.insertAdjacentHTML("afterbegin", '<div class="atelier-entry" aria-hidden="true"><div class="atelier-entry__mark">SHIVARA</div></div>');
    window.setTimeout(() => document.querySelector(".atelier-entry")?.remove(), 1400);
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
  const pageGrid = document.querySelector("#wishlist-page-grid");
  const pageCount = document.querySelector("#wishlist-page-count");
  if (pageCount) pageCount.textContent = `${savedProducts.length} ${savedProducts.length === 1 ? "piece" : "pieces"}`;
  if (pageGrid) {
    if (savedProducts.length) renderProductGrid(pageGrid, savedProducts, { eager: true });
    else pageGrid.innerHTML = `<div class="wishlist-page__empty"><h2>Your edit is waiting.</h2><p>Save the pieces that feel like you. They will stay here across visits.</p><a class="atelier-button atelier-button--dark" href="/collections/all">Discover Shivara</a></div>`;
  }
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
      return `<article class="commerce-cart-line ${product.id === lastAddedId ? "is-new" : ""}">
        <a href="${productUrl(product)}"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" /></a>
        <div><a href="${productUrl(product)}"><strong>${escapeMarkup(product.title)}</strong></a><small>Variant: ${escapeMarkup(item.variant)}</small>
          <div class="commerce-quantity"><button type="button" data-cart-decrease="${product.id}" data-variant="${escapeMarkup(item.variant)}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-cart-increase="${product.id}" data-variant="${escapeMarkup(item.variant)}" aria-label="Increase quantity">+</button></div>
          <button class="commerce-cart-line__remove" type="button" data-cart-save="${product.id}" data-variant="${escapeMarkup(item.variant)}">Save to Your Edit</button>
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
    return `${index + 1}. ${product.title}\nSKU: ${product.id}\nVariant: ${item.variant}\nQuantity: ${item.qty}\nUnit price: ${formatPrice(price)}\nLine total: ${formatPrice(price * item.qty)}`;
  });
  const message = cart.length
    ? `Hi Shivara.luxe, I would like to order:\n\n${lines.join("\n\n")}\n\nTotal: ${formatPrice(totals.total)}\n\nPlease confirm availability, shipping and payment details.`
    : "Hi Shivara.luxe, I would like to shop your collection.";
  document.querySelector("#checkout-link").href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
  const recommendation = document.querySelector("#cart-recommendation");
  if (recommendation) recommendation.remove();
  if (cart.length) {
    const addOn = products.find((product) => !cart.some((item) => item.id === product.id));
    summary.insertAdjacentHTML("afterbegin", `<article class="cart-recommendation" id="cart-recommendation"><p>You are building a beautiful stack.</p><div><img src="/${addOn.image}" alt="" /><span><strong>${escapeMarkup(addOn.title)}</strong><small>${formatPrice(productPricing(addOn).price)}</small></span><button type="button" data-card-add="${addOn.id}">Add</button></div></article>`);
  }
  saveCart();
  window.setTimeout(() => {
    lastAddedId = "";
    document.querySelector(".commerce-cart-line.is-new")?.classList.remove("is-new");
  }, 1200);
}

function quickViewMarkup(product) {
  const pricing = productPricing(product);
  const variants = productVariants(product);
  return `
    <div class="quick-view-v2__gallery">
      <div class="quick-view-v2__images"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" width="800" height="1000" /><img src="/${product.image}" alt="" width="800" height="1000" /></div>
      <div class="quick-view-v2__thumbs"><button type="button" data-quick-image="0" aria-label="View product image 1"><img src="/${product.image}" alt="" /></button><button type="button" data-quick-image="1" aria-label="View product image 2"><img src="/${product.image}" alt="" /></button></div>
    </div>
    <div class="quick-view-v2__info">
      <small>${categoryLabels[product.category] || product.category} · SKU ${product.id}</small>
      <h2>${escapeMarkup(product.title)}</h2>
      <div class="quick-view-v2__price"><strong>${formatPrice(pricing.price)}</strong><s>${formatPrice(pricing.compareAt)}</s><span>${pricing.discount}% off</span></div>
      <p class="quick-view-v2__preview">A ${escapeMarkup((categoryLabels[product.category] || product.category).toLowerCase())} piece selected for the Shivara edit. Availability is personally confirmed before payment.</p>
      <label>Variant<select id="quick-variant">${variants.map((variant) => `<option value="${escapeMarkup(variant)}">${escapeMarkup(variant)}</option>`).join("")}</select></label>
      <label>Quantity<div class="commerce-quantity commerce-quantity--large"><button type="button" data-quick-qty="-1" aria-label="Decrease quantity">−</button><span id="quick-quantity">${quickViewState.quantity}</span><button type="button" data-quick-qty="1" aria-label="Increase quantity">+</button></div></label>
      <button class="store-button store-button--dark" type="button" data-quick-add="${product.id}">Add to Bag</button>
      <button class="quick-view-wishlist" type="button" data-wishlist-toggle="${product.id}">♡ Save to Your Edit</button>
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
  if (!history.state?.quickView) history.pushState({ quickView: true }, "", `${location.pathname}${location.search}#quick-view`);
}

function renderSearch(query = "") {
  const mount = document.querySelector("#search-results");
  if (!mount) return;
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    mount.innerHTML = `${recentSearches.length ? `<div class="commerce-search-recents"><strong>Recent searches</strong>${recentSearches.map((item) => `<button type="button" data-recent-search="${escapeMarkup(item)}">${escapeMarkup(item)}</button>`).join("")}</div>` : ""}<div class="search-discovery-chips"><button type="button" data-recent-search="Trending">Trending Now</button><button type="button" data-recent-search="Gift">Gifts Under ₹499</button><button type="button" data-recent-search="Latest">New Drops</button><button type="button" data-recent-search="Ring">Most Loved</button></div><h3>Popular right now</h3>${products.slice(0, 6).map(searchResultMarkup).join("")}`;
    return;
  }
  const exactMatches = products.filter((product) => `${product.title} ${product.category} ${product.caption || ""}`.toLowerCase().includes(normalized));
  const queryTokens = normalized.split(/\s+/).map((token) => token.replace(/(.)\1+/g, "$1"));
  const fuzzyMatches = products.filter((product) => {
    const words = `${product.title} ${product.category}`.toLowerCase().replace(/(.)\1+/g, "$1").split(/[^a-z0-9]+/);
    return queryTokens.every((token) => words.some((word) => word.startsWith(token.slice(0, Math.max(3, token.length - 1)))));
  });
  const matches = (exactMatches.length ? exactMatches : fuzzyMatches).slice(0, 18);
  mount.innerHTML = matches.length ? `<h3>${matches.length} products found</h3>${matches.map(searchResultMarkup).join("")}` : '<div class="commerce-empty-state"><strong>No products found.</strong><p>Try rings, earrings, bracelets or gifts.</p></div>';
}

function searchResultMarkup(product) {
  const pricing = productPricing(product);
  return `<a class="commerce-search-result" href="${productUrl(product)}"><img src="/${product.image}" alt="" loading="lazy" /><span><strong>${escapeMarkup(product.title)}</strong><small>${categoryLabels[product.category] || product.category}</small></span><b>${formatPrice(pricing.price)}</b></a>`;
}

const collectionEditorial = {
  All: ["THE COMPLETE ATELIER", "All Shivara drops", "The complete Shivara jewellery wardrobe, ready to browse your way."],
  Earrings: ["THE FINAL TOUCH", "Earrings that change the whole look.", "From quiet shine to statement energy, find the detail that finishes it."],
  Pendants: ["THE NECKLINE EDIT", "The piece that pulls everything together.", "Expressive pendants and neckwear selected for effortless layering."],
  Bracelets: ["THE STACKING STUDIO", "Build the stack your way.", "Start with one signature, then add texture, shine and personality."],
  Rings: ["THE RING EDIT", "Small detail. Major effect.", "Sculptural, romantic and adjustable rings for every mood."],
  "Evil Eye": ["THE PROTECTION EDIT", "A little protection. A lot of personality.", "Graphic symbols and confident details designed to be noticed."],
  "Anti-tarnish": ["EVERYDAY ICONS", "Designed to stay in rotation.", "Polished anti-tarnish pieces curated for repeat wear."],
  Gifting: ["THE GIFTING ROOM", "Small box. Big reaction.", "Gift-ready pieces with personal WhatsApp assistance when you need it."]
};

function collectionState() {
  const params = new URLSearchParams(location.search);
  const bodyCategory = document.body.dataset.collection;
  return {
    category: params.get("category") || (bodyCategory === "Rings" ? "Rings" : "All"),
    maxPrice: Number(params.get("maxPrice") || 999),
    sort: params.get("sort") || "featured"
  };
}

function updateCollectionUrl(next, replace = false) {
  const params = new URLSearchParams(location.search);
  if (next.category && next.category !== "All") params.set("category", next.category);
  else params.delete("category");
  if (next.maxPrice && Number(next.maxPrice) !== 999) params.set("maxPrice", String(next.maxPrice));
  else params.delete("maxPrice");
  if (next.sort && next.sort !== "featured") params.set("sort", next.sort);
  else params.delete("sort");
  const url = `${location.pathname}${params.size ? `?${params}` : ""}`;
  history[replace ? "replaceState" : "pushState"]({ collection: true }, "", url);
}

function renderCollection() {
  const grid = document.querySelector("#collection-grid");
  if (!grid) return;
  const { category, sort, maxPrice } = collectionState();
  const visible = (category === "All" ? products.slice() : products.filter((product) => product.category === category))
    .filter((product) => productPricing(product).price <= maxPrice)
    .sort((a, b) => sort === "price-low" ? productPricing(a).price - productPricing(b).price : sort === "price-high" ? productPricing(b).price - productPricing(a).price : 0)
    .slice(0, 40);
  renderProductGrid(grid, visible, { eager: true });
  const editorial = collectionEditorial[category] || collectionEditorial.All;
  const campaign = categoryRail.find(([, value]) => value === category) || categoryRail[0];
  document.querySelector(".collection-hero")?.style.setProperty("--collection-image", `url('/assets/instagram-shop/${campaign[2]}')`);
  const label = document.querySelector(".collection-hero .section-kicker");
  const title = document.querySelector(".collection-hero h2");
  const copy = document.querySelector(".collection-hero p:last-child");
  if (label) label.textContent = editorial[0];
  if (title) title.textContent = editorial[1];
  if (copy) copy.textContent = editorial[2];
  document.title = `${editorial[1]} | Shivara`;
  const canonicalPath = category === "All" || (location.pathname.includes("/rings") && category === "Rings") ? location.pathname : `${location.pathname}?category=${encodeURIComponent(category)}`;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `${location.origin}${canonicalPath}`;
  const metaUpdates = {
    'meta[property="og:title"]': document.title,
    'meta[property="og:description"]': editorial[2],
    'meta[property="og:url"]': `${location.origin}${canonicalPath}`,
    'meta[property="og:image"]': `${location.origin}/assets/instagram-shop/${campaign[2]}`
  };
  Object.entries(metaUpdates).forEach(([selector, value]) => document.querySelector(selector)?.setAttribute("content", value));
  const filters = document.querySelector("#facet-filters");
  if (filters) {
    filters.innerHTML = `<div class="collection-filter-sheet__head"><strong>Refine Your Edit</strong><button type="button" data-filter-close aria-label="Close filters">×</button></div><fieldset><legend>Category</legend><nav class="collection-category-filter" aria-label="Filter products">${Object.keys(collectionEditorial).map((item) => `<button class="${item === category ? "is-active" : ""}" type="button" data-collection-category="${escapeMarkup(item)}" aria-pressed="${item === category}">${categoryLabels[item] || item}<span>${item === "All" ? products.length : products.filter((product) => product.category === item).length}</span></button>`).join("")}</nav></fieldset><fieldset><legend>Price</legend><label><input type="radio" name="mobile-price" value="999" ${maxPrice === 999 ? "checked" : ""} /> All prices</label><label><input type="radio" name="mobile-price" value="499" ${maxPrice === 499 ? "checked" : ""} /> Under ₹499</label><label><input type="radio" name="mobile-price" value="399" ${maxPrice === 399 ? "checked" : ""} /> Under ₹399</label></fieldset><div class="collection-availability"><strong>Availability</strong><p>Current availability is personally confirmed on WhatsApp before payment.</p></div><div class="collection-filter-sheet__actions"><button type="button" data-filter-reset>Reset</button><button type="button" data-filter-apply>Show ${visible.length} products</button></div>`;
  }
  const count = document.querySelector("[data-collection-count]");
  if (count) count.textContent = `${visible.length} products`;
  const meta = document.querySelector(".product-facet__meta-bar");
  if (meta) meta.innerHTML = `<button class="filter-toggle hidden-lap-and-up" type="button" data-filter-open>Filters${category !== "All" || maxPrice !== 999 ? " · Active" : ""}</button><strong data-collection-count>${visible.length} products</strong><div class="collection-active-filters">${category !== "All" ? `<button type="button" data-collection-category="All">${categoryLabels[category] || category} ×</button>` : ""}${maxPrice !== 999 ? `<button type="button" data-clear-price>Under ${formatPrice(maxPrice)} ×</button>` : ""}${category !== "All" || maxPrice !== 999 ? '<button type="button" data-filter-reset>Clear all</button>' : ""}</div><label>Price<select id="collection-price"><option value="999" ${maxPrice === 999 ? "selected" : ""}>All prices</option><option value="499" ${maxPrice === 499 ? "selected" : ""}>Under ₹499</option><option value="399" ${maxPrice === 399 ? "selected" : ""}>Under ₹399</option></select></label><label>Sort<select id="collection-sort"><option value="featured" ${sort === "featured" ? "selected" : ""}>Featured</option><option value="price-low" ${sort === "price-low" ? "selected" : ""}>Price: Low to High</option><option value="price-high" ${sort === "price-high" ? "selected" : ""}>Price: High to Low</option></select></label>`;
  grid.setAttribute("aria-label", `${visible.length} products in ${categoryLabels[category] || category}`);
  if (!visible.length) grid.innerHTML = `<div class="collection-empty"><h2>No pieces match this edit.</h2><p>Clear a filter or explore the complete Shivara atelier.</p><button class="atelier-button atelier-button--dark" type="button" data-filter-reset>Clear Filters</button></div>`;
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
        <div class="pdp-images" id="pdp-images"><img src="/${product.image}" alt="${escapeMarkup(product.title)}" width="900" height="1125" /><img src="/${product.image}" alt="" width="900" height="1125" loading="lazy" /></div>
      </div>
      <div class="pdp-info">
        <small>${categoryLabels[product.category] || product.category}</small>
        <h1>${escapeMarkup(product.title)}</h1>
        <p class="pdp-sku">SKU: ${product.id}</p>
        <div class="pdp-price"><strong>${formatPrice(pricing.price)}</strong><s>${formatPrice(pricing.compareAt)}</s><span>${pricing.discount}% off</span></div>
        <p class="pdp-tax">Inclusive of all taxes. Shipping confirmed on WhatsApp.</p>
        <p class="pdp-availability"><span></span> Availability confirmed personally before payment</p>
        <label class="pdp-field">Select variant<select id="pdp-variant">${variants.map((variant) => `<option value="${escapeMarkup(variant)}">${escapeMarkup(variant)}</option>`).join("")}</select></label>
        <label class="pdp-field">Quantity<div class="commerce-quantity commerce-quantity--large"><button type="button" data-pdp-qty="-1" aria-label="Decrease quantity">−</button><span id="pdp-quantity">1</span><button type="button" data-pdp-qty="1" aria-label="Increase quantity">+</button></div></label>
        <div class="pdp-actions"><button class="store-button store-button--dark" type="button" data-pdp-add="${product.id}">Add to Bag</button><button class="pdp-wishlist ${saved ? "is-active" : ""}" type="button" data-wishlist-toggle="${product.id}" aria-pressed="${saved}">♡ <span>${saved ? "Saved to Your Edit" : "Save to Your Edit"}</span></button></div>
        <a class="store-button store-button--whatsapp" id="pdp-whatsapp" href="#" target="_blank" rel="noreferrer">Order on WhatsApp</a>
        <div class="pdp-service-tools"><label>Check delivery postcode<input id="pdp-pincode" inputmode="numeric" maxlength="6" placeholder="6-digit pincode" /></label><button type="button" data-check-pincode>Check</button><button type="button" data-share-product>Share</button></div>
        <div class="pdp-accordions">
          <details open><summary>Product Details <span>+</span></summary><p>${escapeMarkup((product.caption || "A statement jewellery piece curated by Shivara.luxe.").replace(/\s+/g, " ").slice(0, 320))}</p></details>
          <details><summary>Shipping and Exchange <span>+</span></summary><p>PAN India delivery is available. Dispatch timeline, shipping charge and exchange eligibility are confirmed before payment on WhatsApp.</p></details>
          <details><summary>Care Instructions <span>+</span></summary><p>Keep away from water, perfume and direct heat. Store separately in the provided packaging and wipe gently after wear.</p></details>
        </div>
      </div>
    </section>
    <section class="pdp-story-grid"><article><p class="atelier-kicker">WHY WE PICKED IT</p><h3>The finishing move.</h3><p>Expressive enough to shift the look, easy enough to return to often. That balance is pure Shivara.</p></article><article><p class="atelier-kicker">DETAILS UP CLOSE</p><h3>Designed to be noticed.</h3><p>Polished detail and a confident silhouette. Keep it away from water and perfume to preserve the finish.</p></article><article><p class="atelier-kicker">GIFT-READY</p><h3>Small box. Big reaction.</h3><p>Your order is carefully presented and availability is personally confirmed before payment.</p></article></section>
    <section class="pdp-products"><header><h2>Looks Good With</h2><a href="${collectionUrl(product.category)}">View collection →</a></header><div class="commerce-product-grid" id="related-products"></div></section>
    <section class="pdp-products"><header><h2>Recently viewed</h2></header><div class="commerce-product-grid" id="recent-products"></div></section>
    <div class="pdp-sticky-bar"><div><strong>${escapeMarkup(product.title)}</strong><span>${formatPrice(pricing.price)}</span></div><button type="button" data-pdp-add="${product.id}">Add to Bag</button></div>
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
  const discovery = target.closest("[data-discovery]");
  if (discovery) {
    renderDiscovery(discovery.getAttribute("data-discovery"));
    return;
  }
  const collectionCategory = target.closest("[data-collection-category]");
  if (collectionCategory) {
    updateCollectionUrl({ ...collectionState(), category: collectionCategory.getAttribute("data-collection-category") });
    renderCollection();
    return;
  }
  if (target.closest("[data-clear-price]")) {
    updateCollectionUrl({ ...collectionState(), maxPrice: 999 });
    renderCollection();
    return;
  }
  if (target.closest("[data-filter-reset]")) {
    updateCollectionUrl({ category: document.body.dataset.collection === "Rings" ? "Rings" : "All", maxPrice: 999, sort: "featured" });
    renderCollection();
    document.querySelector(".product-facet__aside")?.classList.remove("is-open");
    return;
  }
  if (target.closest("[data-filter-open]")) {
    document.querySelector(".product-facet__aside")?.classList.add("is-open");
    document.body.classList.add("commerce-modal-open");
    return;
  }
  if (target.closest("[data-filter-close], [data-filter-apply]")) {
    document.querySelector(".product-facet__aside")?.classList.remove("is-open");
    document.body.classList.remove("commerce-modal-open");
    return;
  }
  const finishCategory = target.closest("[data-finish-category]");
  if (finishCategory) {
    renderFinishNavigator(finishCategory.getAttribute("data-finish-category"));
    return;
  }
  if (target.closest("[data-hero-prev], [data-hero-next]")) {
    renderHero(activeHeroIndex + (target.closest("[data-hero-prev]") ? -1 : 1));
    return;
  }
  const finderChoice = target.closest("[data-finder-key]");
  if (finderChoice) {
    finderState[finderChoice.getAttribute("data-finder-key")] = finderChoice.getAttribute("data-finder-value");
    sessionStorage.setItem("shivara-finder", JSON.stringify(finderState));
    renderFinder();
    return;
  }
  if (target.closest("[data-finder-save]")) {
    selectedFinderProducts().forEach((product) => wishlist.add(product.id));
    saveWishlist();
    renderWishlist();
    showToast("Your finder results are saved to your edit");
    return;
  }
  if (target.closest("[data-finder-add]")) {
    addProductsToCart(selectedFinderProducts());
    setLayerOpen("#cart-drawer", true);
    return;
  }
  const motionToggle = target.closest("[data-motion-toggle]");
  if (motionToggle) {
    const card = motionToggle.closest("[data-motion-card]");
    const paused = card.classList.toggle("is-paused");
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.textContent = paused ? "Play motion" : "Pause motion";
    return;
  }
  const stageProduct = target.closest("[data-stage-product]");
  if (stageProduct) {
    renderSignatureStage(Number(stageProduct.getAttribute("data-stage-product")));
    return;
  }
  const lookTab = target.closest("[data-look]");
  if (lookTab) {
    renderLookbook(Number(lookTab.getAttribute("data-look")), 0);
    return;
  }
  const lookProduct = target.closest("[data-look-product]");
  if (lookProduct) {
    renderLookbook(activeLookIndex, Number(lookProduct.getAttribute("data-look-product")));
    return;
  }
  const completeLook = target.closest("[data-add-look]");
  if (completeLook) {
    addProductsToCart(shivaraLooks[Number(completeLook.getAttribute("data-add-look"))].ids.map((id) => productMap.get(id)).filter(Boolean));
    setLayerOpen("#cart-drawer", true);
    return;
  }
  const concierge = target.closest("[data-concierge-toggle]");
  if (concierge) {
    const panel = document.querySelector("#shivara-concierge");
    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open", open);
    concierge.setAttribute("aria-expanded", String(open));
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
  if (target.closest("[data-quick-close]")) {
    closeAllLayers();
    if (history.state?.quickView) history.replaceState(null, "", `${location.pathname}${location.search}`);
    return;
  }
  if (target.closest("[data-drawer-close], [data-wishlist-close], [data-cart-close], [data-continue-shopping]")) {
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
    if (history.state?.quickView) history.replaceState(null, "", `${location.pathname}${location.search}`);
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
  const cartSave = target.closest("[data-cart-save]");
  if (cartSave) {
    const id = cartSave.getAttribute("data-cart-save");
    wishlist.add(id);
    saveWishlist();
    removeCartLine(id, cartSave.getAttribute("data-variant"));
    renderWishlist();
    showToast("Saved to your Shivara edit");
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
  if (target.closest("[data-check-pincode]")) {
    const value = document.querySelector("#pdp-pincode")?.value.trim() || "";
    showToast(/^\d{6}$/.test(value) ? "Delivery details will be confirmed on WhatsApp" : "Enter a valid 6-digit pincode");
    return;
  }
  if (target.closest("[data-share-product]")) {
    if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
    else navigator.clipboard?.writeText(location.href).then(() => showToast("Product link copied"));
    return;
  }
  if (target.closest("[data-share-wishlist]")) {
    const names = products.filter((product) => wishlist.has(product.id)).map((product) => product.title);
    const text = names.length ? `My Shivara edit: ${names.join(", ")}` : "Discover Shivara jewellery";
    if (navigator.share) navigator.share({ title: "My Shivara Edit", text, url: location.href }).catch(() => {});
    else navigator.clipboard?.writeText(`${text}\n${location.href}`).then(() => showToast("Your edit link is ready to share"));
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
  if (event.target?.matches?.("#drawer-search")) {
    window.clearTimeout(searchDebounce);
    const value = event.target.value;
    searchDebounce = window.setTimeout(() => renderSearch(value), 90);
  }
});

document.addEventListener("change", (event) => {
  if (event.target?.matches?.("#quick-variant")) updateQuickViewWhatsapp();
  if (event.target?.matches?.("#pdp-variant")) updatePdpWhatsapp();
  if (event.target?.matches?.("#collection-sort, #collection-price")) {
    const state = collectionState();
    updateCollectionUrl({
      ...state,
      sort: document.querySelector("#collection-sort")?.value || state.sort,
      maxPrice: Number(document.querySelector("#collection-price")?.value || state.maxPrice)
    });
    renderCollection();
  }
  if (event.target?.matches?.('input[name="mobile-price"]')) {
    updateCollectionUrl({ ...collectionState(), maxPrice: Number(event.target.value) });
    renderCollection();
    document.querySelector(".product-facet__aside")?.classList.add("is-open");
  }
  if (event.target?.matches?.("#finder-result input")) {
    const link = document.querySelector("[data-finder-whatsapp]");
    if (link) link.href = finderWhatsapp();
  }
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

window.addEventListener("popstate", () => {
  if (document.querySelector("#quick-view.is-open")) closeAllLayers();
  if (document.querySelector("#collection-grid")) renderCollection();
});

let lastScrollY = 0;
window.addEventListener("scroll", () => {
  const header = document.querySelector(".store-header");
  if (!header || document.body.dataset.page !== "home") return;
  const current = window.scrollY;
  header.classList.toggle("is-solid", current > 80);
  header.classList.toggle("is-hidden", current > lastScrollY && current > 260 && !document.body.classList.contains("commerce-modal-open"));
  lastScrollY = current;
}, { passive: true });

const mediaObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting && entry.intersectionRatio > 0.55));
}, { threshold: [0.55] }) : null;

ensureSharedChrome();
ensureGlobalLayers();
startAnnouncementRotation();
renderHome();
renderCollection();
renderProductPage();
renderCart();
renderWishlist();
document.querySelectorAll("[data-motion-card]").forEach((card) => mediaObserver?.observe(card));
const heroElement = document.querySelector(".atelier-hero");
heroElement?.addEventListener("pointerdown", (event) => {
  heroStartX = event.clientX;
});
heroElement?.addEventListener("pointerup", (event) => {
  const distance = event.clientX - heroStartX;
  if (Math.abs(distance) > 55) renderHero(activeHeroIndex + (distance < 0 ? 1 : -1));
});
