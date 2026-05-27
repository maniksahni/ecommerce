const shopData = window.SHIVARA_SHOP_DATA || { products: [], profile: {} };
const productHeroOrder = [
  "DX09iTpxHvB",
  "DXybkxCRoaE",
  "DXtZLoWkVZo",
  "DXbGtV-kd5A",
  "DXUKeYosxOa",
  "DXRflQ2ARK2",
  "DXO-ucIBdig",
  "DW9Cf8OkWo0",
  "DW3H_GZDD_4",
  "DWtcQ8OAefp",
  "DWERaGlEYB6",
  "DV0yEUUkTHq",
  "DVsiM2WEctG",
  "DVGLWtPEbN4",
  "DUsq31AgXWw",
  "DYfHBFKBXGi",
  "DYcf1ViBfkI",
  "DYPpSpxhPO0"
];
const productOverrides = {
  DX09iTpxHvB: { title: "Statement Hand Stack", category: "Bracelets" },
  DXybkxCRoaE: { title: "Client Happiness Gift Box", category: "Gifting" },
  DXtZLoWkVZo: { title: "Evil Eye Bracelet Duo", category: "Evil Eye" },
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
  "DVVyuaREdE-",
  "DWambX9EROs"
]);
function extractPrice(product) {
  const caption = product.caption || "";
  const title = product.title || "";
  const text = (title + " " + caption).toLowerCase();

  // Special cases for known promotions
  if (text.includes("buy any 2 for 599") || text.includes("evil eye bracelets for just 599") || text.includes("bracelets for just 599")) {
    return "₹599";
  }
  if (text.includes("buy any 3 for 999") || text.includes("any 3 for 999")) {
    return "₹999";
  }
  if ((text.includes("buy one at 199") && text.includes("2 at 299")) || text.includes("199/- and 2 at 299")) {
    return "₹199";
  }
  if (text.includes("under 500")) {
    return "₹399";
  }

  // Regex matches for common price styles
  const regexes = [
    /(?:at just|only at|price of|only|just|at|price)\s*₹?\s*(\d{3})(?:\s*\/-)?/i,
    /(?:under)\s*₹?\s*(\d{3})(?:\s*\/-)?/i,
    /₹\s*(\d{3})/i,
    /(\d{3})\s*\/-/i
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match) {
      return `₹${match[1]}`;
    }
  }

  // Generate a mock realistic price if none exists to simulate a real e-commerce store
  // Rings: 199-299, Bracelets: 299-499, Pendants: 249-399, Evil Eye: 299-599, Gifting: 499-799
  const cat = product.category || "";
  if (cat === "Rings") return `₹249`;
  if (cat === "Bracelets") return `₹349`;
  if (cat === "Pendants") return `₹299`;
  if (cat === "Evil Eye") return `₹399`;
  if (cat === "Earrings") return `₹249`;
  return "₹299";
}

function getNumericPrice(priceString) {
  if (!priceString || priceString === "DM for price") return 0;
  const match = priceString.match(/₹\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const orderRank = new Map(productHeroOrder.map((id, index) => [id, index]));
const allProducts = (Array.isArray(shopData.products) ? shopData.products : [])
  .map((product) => {
    const overridden = { ...product, ...(productOverrides[product.id] || {}) };
    const parsedPrice = extractPrice(overridden);
    
    // Add real pricing fields for Focal ecommerce layout
    overridden.availability = parsedPrice;
    const numeric = getNumericPrice(parsedPrice);
    overridden.priceVal = numeric;
    
    // Create compare price (mock original price) to show 40-60% discount
    if (numeric > 0) {
      overridden.comparePrice = `₹${Math.round(numeric * 1.8 / 10) * 10 - 1}`;
    } else {
      overridden.comparePrice = "";
    }

    // Mock stars rating (4.6 to 5.0) and reviews count
    const ratingSeed = (overridden.id.charCodeAt(0) + overridden.id.charCodeAt(1)) % 5;
    overridden.rating = (4.6 + ratingSeed * 0.1).toFixed(1);
    overridden.reviewsCount = 12 + (overridden.id.charCodeAt(2) * 5) % 87;

    return overridden;
  })
  .sort((a, b) => {
    const aRank = orderRank.has(a.id) ? orderRank.get(a.id) : 1000 + a.index;
    const bRank = orderRank.has(b.id) ? orderRank.get(b.id) : 1000 + b.index;
    return aRank - bRank;
  });
const products = allProducts.filter((product) => !duplicateProductIds.has(product.id) && product.views === 0);

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const progressBar = document.querySelector(".scroll-progress");
const productGrid = document.querySelector("#product-grid");
const filterRow = document.querySelector("#filter-row");
const searchInput = document.querySelector("#product-search");
const resultCount = document.querySelector("#result-count");
const runwayTrack = document.querySelector("#runway-track");
const cartDrawer = document.querySelector(".cart-drawer");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartSummary = document.querySelector("#cart-summary");
const checkoutLink = document.querySelector("#checkout-link");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const cart = new Map(JSON.parse(localStorage.getItem("shivara-cart") || "[]"));
const urlParams = new URLSearchParams(window.location.search);
let activeFilter = urlParams.get("category") || "All";
let activeQuery = "";
let ticking = false;
let lastSpark = 0;

document.body.classList.add("is-loaded");

function closestFromEvent(event, selector) {
  return event.target instanceof Element ? event.target.closest(selector) : null;
}

function saveCart() {
  localStorage.setItem("shivara-cart", JSON.stringify(Array.from(cart.entries())));
}

function productById(id) {
  return products.find((product) => product.id === id);
}

function formatMetric(value, fallback = "IG post") {
  const number = Number(value);
  if (!number) return fallback;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k views`;
  return `${number} views`;
}

function categoryCounts() {
  return products.reduce(
    (counts, product) => {
      counts.All += 1;
      counts[product.category] = (counts[product.category] || 0) + 1;
      return counts;
    },
    { All: 0 }
  );
}

function categories() {
  const preferred = ["All", "Rings", "Bracelets", "Pendants", "Evil Eye", "Gifting", "Anti-tarnish", "Earrings"];
  const present = new Set(products.map((product) => product.category));
  return preferred.filter((category) => category === "All" || present.has(category));
}

function matchesProduct(product) {
  const inCategory = activeFilter === "All" || product.category === activeFilter;
  const haystack = `${product.title} ${product.category} ${product.caption}`.toLowerCase();
  return inCategory && haystack.includes(activeQuery);
}

function productCard(product) {
  const selected = cart.has(product.id);
  const caption = product.caption || "DM to order from Shivara.luxe";
  const hasPrice = product.priceVal > 0;
  
  // Badges logic
  let badgesHTML = "";
  if (product.comparePrice) {
    badgesHTML += `<span class="badge badge-sale">Sale</span>`;
  }
  if (product.index <= 12) {
    badgesHTML += `<span class="badge badge-new">New</span>`;
  }
  if (product.category === "Evil Eye") {
    badgesHTML += `<span class="badge badge-limited">Combo</span>`;
  }

  // Stars calculation
  const starCount = Math.round(product.rating);
  const starsHTML = "★".repeat(starCount) + "☆".repeat(5 - starCount);

  return `
    <article class="product-card reveal" data-product-card data-id="${product.id}" data-category="${product.category}">
      <div class="product-media">
        <img src="${product.image}" alt="${product.title}" loading="lazy" />
        <div class="product-badges">${badgesHTML}</div>
        <div class="card-quick-add">
          <button class="btn-quick-add ${selected ? "is-added" : ""}" type="button" data-add="${product.id}">
            ${selected ? "✓ Added" : "Quick Add"}
          </button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3>${product.title}</h3>
        <div class="product-rating">
          <span class="stars">${starsHTML}</span>
          <span class="rating-count">(${product.reviewsCount})</span>
        </div>
        <div class="product-price-row">
          <span class="price ${product.comparePrice ? "has-sale" : ""}">${product.availability}</span>
          ${product.comparePrice ? `<span class="compare-price">${product.comparePrice}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderFilters() {
  if (!filterRow) return;

  const counts = categoryCounts();
  filterRow.innerHTML = categories()
    .map(
      (category) => `
        <button class="filter-chip ${category === activeFilter ? "is-active" : ""}" type="button" data-filter="${category}">
          ${category} ${counts[category] || 0}
        </button>
      `
    )
    .join("");

  document.querySelectorAll("[data-category-count]").forEach((item) => {
    const category = item.getAttribute("data-category-count");
    item.textContent = String(counts[category] || 0);
  });
}

function revealNewCards() {
  const targets = document.querySelectorAll(".reveal:not(.is-observed)");
  targets.forEach((target, index) => {
    target.classList.add("is-observed");
    target.style.transitionDelay = `${Math.min((index % 10) * 35, 315)}ms`;
    revealObserver.observe(target);
  });
}

function renderProducts() {
  if (!productGrid) return;

  const visibleProducts = products.filter(matchesProduct);
  productGrid.innerHTML = visibleProducts.map(productCard).join("");
  if (resultCount) {
    resultCount.textContent = `Showing ${visibleProducts.length} curated drops`;
  }
  revealNewCards();
}

function renderRunway() {
  if (!runwayTrack) return;

  const runwayProducts = products.slice(0, 26);
  const repeated = [...runwayProducts, ...runwayProducts];
  runwayTrack.innerHTML = repeated
    .map(
      (product) => `
        <a class="runway-item" href="${product.instagram}" target="_blank" rel="noreferrer">
          <img src="${product.image}" alt="" loading="lazy" />
          <span>${product.title}</span>
        </a>
      `
    )
    .join("");
}

function cartQuantity() {
  return Array.from(cart.values()).reduce((total, quantity) => total + quantity, 0);
}

function updateCartButtons() {
  document.querySelectorAll("[data-add]").forEach((button) => {
    const id = button.getAttribute("data-add");
    const selected = cart.has(id);
    button.classList.toggle("is-added", selected);
    button.textContent = selected ? "✓ Added" : "Quick Add";
  });
}

function renderCart() {
  const quantity = cartQuantity();
  document.querySelectorAll("[data-cart-count]").forEach((item) => {
    item.textContent = String(quantity);
  });

  if (!cartItems || !cartEmpty || !cartSummary || !checkoutLink) return;

  const selectedProducts = Array.from(cart.entries())
    .map(([id, qty]) => ({ product: productById(id), qty }))
    .filter((entry) => entry.product);

  let subtotal = 0;
  selectedProducts.forEach(({ product, qty }) => {
    subtotal += (product.priceVal || 0) * qty;
  });

  cartItems.innerHTML = selectedProducts
    .map(
      ({ product, qty }) => `
        <article class="cart-line">
          <img src="${product.image}" alt="${product.title}" />
          <div class="cart-line-info">
            <h3>${product.title}</h3>
            <span class="cart-line-meta">${product.category} · ${product.availability}</span>
            <div class="qty-row">
              <div class="qty-controls">
                <button type="button" data-decrease="${product.id}" aria-label="Decrease ${product.title}">-</button>
                <span>${qty}</span>
                <button type="button" data-increase="${product.id}" aria-label="Increase ${product.title}">+</button>
              </div>
              <button class="remove-button" type="button" data-remove="${product.id}">Remove</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  cartEmpty.hidden = selectedProducts.length > 0;
  cartItems.hidden = selectedProducts.length === 0;
  cartSummary.textContent = `${quantity} item${quantity === 1 ? "" : "s"}`;

  const subtotalEl = document.querySelector("#cart-subtotal");
  if (subtotalEl) {
    subtotalEl.textContent = subtotal > 0 ? `₹${subtotal}` : "DM for price";
  }

  const message =
    selectedProducts.length === 0
      ? "Hi Shivara.luxe, I want to shop from your Instagram collection."
      : [
          "Hi Shivara.luxe, I want to inquire about these pieces:",
          "",
          ...selectedProducts.map(
            ({ product, qty }, index) => `${index + 1}. ${qty} x ${product.title} (${product.category}) - ${product.id} [${product.availability}] - ${product.instagram}`
          ),
          "",
          `Total Estimated Price: ₹${subtotal}`,
          "",
          "Please confirm price, availability, customization options, and PAN India delivery."
        ].join("\n");

  checkoutLink.href = `https://wa.me/919457041215?text=${encodeURIComponent(message)}`;
  updateCartButtons();
  saveCart();
}

function addToCart(id) {
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
}

function setCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  cartDrawer?.setAttribute("aria-hidden", String(!open));
  if (cartOverlay) {
    cartOverlay.hidden = !open;
  }
}

function updateScrollProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(window.scrollY / maxScroll, 1);
  progressBar?.style.setProperty("--scroll-progress", progress.toFixed(4));
  document.body.classList.toggle("mobile-bar-visible", window.scrollY > Math.min(620, window.innerHeight * 0.72));
  ticking = false;
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
);

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  }
});

filterRow?.addEventListener("click", (event) => {
  const button = closestFromEvent(event, "[data-filter]");
  if (!button) return;
  activeFilter = button.getAttribute("data-filter") || "All";
  renderFilters();
  renderProducts();
});

searchInput?.addEventListener("input", (event) => {
  activeQuery = event.target.value.toLowerCase().trim();
  renderProducts();
});

document.addEventListener("click", (event) => {
  const openCartButton = closestFromEvent(event, "[data-cart-open]");
  if (openCartButton) {
    setCartOpen(true);
    return;
  }

  const circleCard = closestFromEvent(event, ".collection-circle-card");
  if (circleCard) {
    activeFilter = circleCard.getAttribute("data-circle-filter") || "All";
    renderFilters();
    renderProducts();
    // Do not return to allow natural scrolling to #shop anchor
  }

  const closeCartButton = closestFromEvent(event, "[data-cart-close]");
  if (closeCartButton) {
    setCartOpen(false);
    return;
  }

  const addButton = closestFromEvent(event, "[data-add]");
  if (addButton) {
    addToCart(addButton.getAttribute("data-add"));
    setCartOpen(true);
    return;
  }

  const increaseButton = closestFromEvent(event, "[data-increase]");
  if (increaseButton) {
    const id = increaseButton.getAttribute("data-increase");
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    return;
  }

  const decreaseButton = closestFromEvent(event, "[data-decrease]");
  if (decreaseButton) {
    const id = decreaseButton.getAttribute("data-decrease");
    const next = (cart.get(id) || 0) - 1;
    if (next <= 0) cart.delete(id);
    else cart.set(id, next);
    renderCart();
    return;
  }

  const removeButton = closestFromEvent(event, "[data-remove]");
  if (removeButton) {
    cart.delete(removeButton.getAttribute("data-remove"));
    renderCart();
  }
});

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollProgress);
      ticking = true;
    }
  },
  { passive: true }
);

document.addEventListener(
  "pointermove",
  (event) => {
    if (!finePointer || reducedMotion) return;

    const card = closestFromEvent(event, ".product-card, .stage-card, .drop-card, .luxe-panel");
    if (card) {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
    }

    const now = performance.now();
    if (now - lastSpark > 48) {
      const spark = document.createElement("span");
      spark.className = "pointer-spark";
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 760);
      lastSpark = now;
    }
  },
  { passive: true }
);

document.addEventListener(
  "pointerleave",
  (event) => {
    const card = event.target.closest?.(".product-card, .stage-card, .drop-card");
    if (card) card.style.transform = "";
  },
  true
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setCartOpen(false);
    siteNav?.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  }
});

renderFilters();
renderProducts();
renderRunway();
renderCart();
updateScrollProgress();
revealNewCards();
