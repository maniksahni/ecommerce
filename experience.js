(() => {
  "use strict";

  const api = window.ShivaraCatalog;
  const store = window.ShivaraStorefront;
  if (!api || !store || document.body.dataset.page !== "home") return;
  const STOREFRONT_FEATURES = Object.freeze({
    hero: true,
    categoryGallery: true,
    productDeck: true,
    mostWanted: false,
    productStory: false,
    evilEyeOrbit: false,
    stackingStudio: false,
    ringConstellation: false,
    shopTheLook: false,
    watchShop: false
  });
  window.STOREFRONT_FEATURES = STOREFRONT_FEATURES;

  const products = api.getAllProducts();
  const byId = new Map(products.map((product) => [product.id, product]));
  const categoryLabels = {
    earrings: "Earrings", necklaces: "Neck Wear", pendants: "Pendants", bracelets: "Bracelets",
    rings: "Rings", "evil-eye": "Evil Eye", "anti-tarnish": "Anti Tarnish", gifting: "Gifting",
    sets: "Jewellery Sets", watches: "Watches"
  };
  const categories = [
    ["Earrings", "earrings", "butterfly-earring-edit", "A final detail with its own point of view."],
    ["Neck Wear", "necklaces", "butterfly-drop-necklace", "Pieces that pull the whole neckline together."],
    ["Bracelets", "bracelets", "boxed-evil-eye-bracelet", "Build the wrist edit one considered piece at a time."],
    ["Rings", "rings", "floral-statement-ring", "Small scale, unmistakable presence."],
    ["Evil Eye", "evil-eye", "blue-charm-evil-eye-bracelet", "Protective motifs with graphic personality."],
    ["Anti Tarnish", "anti-tarnish", "tulip-pendant", "An explicitly curated edit for repeat styling."],
    ["Gifting", "gifting", "cluster-gift-ring", "Gift-ready choices with personal assistance."],
    ["New Arrivals", "new-arrivals", "halo-gift-ring", "The newest verified additions to Shivara."]
  ];
  const heroIds = ["boxed-evil-eye-bracelet", "floral-statement-ring", "tulip-pendant"];
  const heroBackgrounds = [
    "/assets/instagram-shop/post-001-DYfHBFKBXGi.jpg",
    "/assets/instagram-shop/post-004-DYXLrorhG7w.jpg",
    "/assets/instagram-shop/post-075-DWYrFMnEePF.jpg"
  ];
  const deckProducts = ["butterfly-earring-edit", "tulip-pendant", "floral-statement-ring", "boxed-evil-eye-bracelet", "snake-chain-watch", "floral-pendant-trio"].map((id) => byId.get(id));
  const wantedProducts = ["snake-chain-watch", "floral-pendant-trio", "green-ad-jewellery-set", "gold-rose-pendant", "minimal-heart-pendant"].map((id) => byId.get(id));
  const orbitProducts = api.getCollection("evil-eye").slice(0, 3);
  const stackProducts = api.getCollection("bracelets").slice(0, 5);
  const ringProducts = api.getCollection("rings").slice(0, 7);
  const watchProducts = ["snake-chain-watch", "nail-motif-bangle", "boxed-evil-eye-bracelet"].map((id) => byId.get(id));
  const looks = [
    { title: "Everyday Stack", image: byId.get("boxed-evil-eye-bracelet").images[0], ids: ["boxed-evil-eye-bracelet", "minimal-heart-pendant"], points: [[32, 58], [66, 34]] },
    { title: "Statement Night", image: byId.get("green-ad-jewellery-set").images[0], ids: ["green-ad-jewellery-set", "floral-statement-ring"], points: [[37, 44], [71, 67]] },
    { title: "Gift-Ready Edit", image: byId.get("cluster-gift-ring").images[0], ids: ["cluster-gift-ring", "tulip-pendant"], points: [[35, 61], [69, 37]] }
  ];

  const state = {
    hero: 0,
    deck: 0,
    universe: 0,
    wanted: 0,
    orbit: 0,
    ring: 0,
    look: 0,
    lookProduct: 0,
    watch: 0,
    stack: new Set(),
    heroTargetX: 0,
    heroTargetY: 0,
    heroX: 0,
    heroY: 0,
    activeTilt: null,
    tiltTargetX: 0,
    tiltTargetY: 0,
    tiltX: 0,
    tiltY: 0
  };
  let heroTimer = 0;
  let heroPointer = null;
  let deckPointer = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function image(product) {
    return `/${product.images[0]}`;
  }

  function category(product) {
    return categoryLabels[product.category] || product.category;
  }

  function priceMarkup(product, className = "") {
    const value = api.formatPrice(product);
    return value.confirmed
      ? `<div class="${className}"><strong>${escapeHtml(value.label)}</strong>${value.compareAt ? `<s>${escapeHtml(new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value.compareAt))}</s><span>${value.discount}% off</span>` : ""}</div>`
      : `<div class="${className} is-enquiry"><strong>Price on request</strong></div>`;
  }

  function whatsappHref(product, quantity = 1) {
    return `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(store.productMessage(product, quantity))}`;
  }

  function purchaseMarkup(product, className = "stable-button stable-button--dark") {
    return api.getPurchaseMode(product) === "direct"
      ? `<button class="${className}" type="button" data-experience-purchase="${product.id}">Add to Bag</button>`
      : `<a class="${className}" href="${whatsappHref(product)}" target="_blank" rel="noreferrer">Enquire</a>`;
  }

  function featuredCard(product, position) {
    const badge = product.badge ? `<span class="featured-product-card__badge">${escapeHtml(product.badge)}</span>` : "";
    return `<article class="featured-product-card" data-featured-card="${product.id}" data-deck-position="${position}" aria-hidden="${position !== 0}" ${position !== 0 ? "inert" : ""}>
      <div class="featured-product-card__atmosphere" aria-hidden="true"></div>
      <div class="featured-product-card__media"><img src="${image(product)}" alt="${escapeHtml(product.imageAlt)}" /></div>
      ${badge}
      <button class="featured-product-card__wish" type="button" data-experience-wishlist="${product.id}" aria-label="Save ${escapeHtml(product.title)}">♡</button>
      <div class="featured-product-card__data"><p>${escapeHtml(category(product))} · ${escapeHtml(product.sku)}</p><h3>${escapeHtml(product.title)}</h3>${priceMarkup(product, "featured-product-card__price")}<p>${escapeHtml(product.description)}</p></div>
      <div class="featured-product-card__actions"><button type="button" data-quick-view="${product.id}">Quick View</button>${purchaseMarkup(product, "featured-product-card__purchase")}<a href="/products/${product.slug}">View Full Product</a></div>
      <i class="featured-product-card__reflect" aria-hidden="true"></i>
    </article>`;
  }

  function renderHero(next = state.hero, announce = false) {
    state.hero = (next + heroIds.length) % heroIds.length;
    const product = byId.get(heroIds[state.hero]);
    const before = byId.get(heroIds[(state.hero + heroIds.length - 1) % heroIds.length]);
    const after = byId.get(heroIds[(state.hero + 1) % heroIds.length]);
    const hero = document.querySelector("#floating-atelier");
    hero.classList.add("is-changing");
    const update = () => {
      hero.querySelector("[data-hero-background]").src = heroBackgrounds[state.hero];
      hero.querySelector("[data-hero-product]").src = image(product);
      hero.querySelector("[data-hero-fragment-one]").src = image(before);
      hero.querySelector("[data-hero-fragment-two]").src = image(after);
      hero.querySelector("[data-hero-title]").textContent = product.title;
      hero.querySelector("[data-hero-card-title]").textContent = product.title;
      hero.querySelector("[data-hero-editorial]").textContent = product.description;
      hero.querySelector("[data-hero-card-copy]").textContent = product.description;
      hero.querySelector("[data-hero-category]").textContent = category(product);
      hero.querySelector("[data-hero-sku]").textContent = product.sku;
      hero.querySelector("[data-hero-price]").innerHTML = priceMarkup(product, "floating-atelier__price");
      hero.querySelector("[data-hero-product-link]").href = `/products/${product.slug}`;
      const purchase = hero.querySelector("[data-hero-purchase]");
      purchase.textContent = api.getPurchaseMode(product) === "direct" ? "Add to Bag" : "Enquire";
      purchase.dataset.heroPurchase = product.id;
      hero.querySelector("[data-hero-wishlist]").dataset.experienceWishlist = product.id;
      hero.querySelector("[data-hero-count]").textContent = `${pad(state.hero + 1)} / ${pad(heroIds.length)}`;
      hero.querySelector("[data-hero-progress]").style.width = `${((state.hero + 1) / heroIds.length) * 100}%`;
      if (announce) hero.querySelector("[data-hero-status]").textContent = `${product.title}, slide ${state.hero + 1} of ${heroIds.length}`;
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(update);
    else update();
    setTimeout(() => hero.classList.remove("is-changing"), 380);
    resetHeroTimer();
  }

  function heroPurchase(id) {
    const product = byId.get(id);
    if (api.getPurchaseMode(product) === "direct") store.addProducts([id]);
    else window.open(whatsappHref(product), "_blank", "noopener,noreferrer");
  }

  function resetHeroTimer() {
    clearTimeout(heroTimer);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden || document.body.classList.contains("stable-modal-open")) return;
    heroTimer = setTimeout(() => renderHero(state.hero + 1), 6800);
  }

  function renderUniverse(next = state.universe) {
    state.universe = (next + categories.length) % categories.length;
    const track = document.querySelector("#universe-track");
    track.innerHTML = categories.map(([label, slug, productId, copy], index) => {
      const product = byId.get(productId);
      let offset = index - state.universe;
      if (offset > categories.length / 2) offset -= categories.length;
      if (offset < -categories.length / 2) offset += categories.length;
      return `<article class="universe-card ${offset === 0 ? "is-active" : ""}" style="--universe-offset:${offset};--universe-abs:${Math.abs(offset)}" data-universe-index="${index}" aria-hidden="${Math.abs(offset) > 3}">
        <button type="button" aria-label="Select ${escapeHtml(label)}"><img src="${image(product)}" alt="${escapeHtml(label)} collection" /></button>
        <div><span>${api.getCollection(slug).length} products</span><h3>${escapeHtml(label)}</h3><p>${escapeHtml(copy)}</p><a href="/collections/${slug}">Shop This Edit</a></div>
      </article>`;
    }).join("");
    document.querySelector("#universe-dots").innerHTML = categories.map(([label], index) => `<button class="${index === state.universe ? "is-active" : ""}" type="button" role="tab" aria-selected="${index === state.universe}" aria-label="${escapeHtml(label)}" data-universe-dot="${index}"></button>`).join("");
    if (matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => {
        const card = track.querySelector(`[data-universe-index="${state.universe}"]`);
        const viewport = track.parentElement;
        if (card) viewport.scrollTo({ left: Math.max(0, card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2), behavior: "smooth" });
      });
    }
  }

  function renderDeck(next = state.deck, announce = false) {
    state.deck = (next + deckProducts.length) % deckProducts.length;
    const ordered = deckProducts.map((_, offset) => deckProducts[(state.deck + offset) % deckProducts.length]);
    document.querySelector("#living-deck-stage").innerHTML = ordered.slice(0, 4).map((product, position) => featuredCard(product, position)).join("");
    document.querySelector("#deck-count").textContent = `${pad(state.deck + 1)} / ${pad(deckProducts.length)}`;
    if (announce) document.querySelector("#deck-status").textContent = `${ordered[0].title}, product ${state.deck + 1} of ${deckProducts.length}`;
  }

  function renderWanted(next = state.wanted) {
    state.wanted = (next + wantedProducts.length) % wantedProducts.length;
    const product = wantedProducts[state.wanted];
    const section = document.querySelector("#most-wanted");
    section.style.setProperty("--wanted-hue", String(32 + state.wanted * 22));
    section.classList.add("is-changing");
    section.querySelector("[data-wanted-product]").src = image(product);
    section.querySelector("[data-wanted-product]").alt = product.imageAlt;
    section.querySelector("[data-wanted-backdrop]").src = image(wantedProducts[(state.wanted + 1) % wantedProducts.length]);
    section.querySelector("[data-wanted-count]").textContent = `${pad(state.wanted + 1)} / ${pad(wantedProducts.length)}`;
    document.querySelector("#wanted-selector").innerHTML = wantedProducts.map((item, index) => `<button class="${index === state.wanted ? "is-active" : ""}" type="button" role="option" aria-selected="${index === state.wanted}" data-wanted-index="${index}"><img src="${image(item)}" alt="" /><span>${escapeHtml(item.title)}</span></button>`).join("");
    document.querySelector("#wanted-info").innerHTML = `${product.badge ? `<span>${escapeHtml(product.badge)}</span>` : ""}<p>${escapeHtml(category(product))} · ${escapeHtml(product.sku)}</p><h3>${escapeHtml(product.title)}</h3>${priceMarkup(product, "most-wanted__price")}<p>${escapeHtml(product.description)}</p>${product.optionsStatus === "confirm" ? '<small>Options confirmed personally on WhatsApp</small>' : ""}<div><button type="button" data-experience-wishlist="${product.id}" aria-label="Save ${escapeHtml(product.title)}">♡</button><button type="button" data-quick-view="${product.id}">Quick View</button>${purchaseMarkup(product)}<a href="/products/${product.slug}">View Product</a></div>`;
    setTimeout(() => section.classList.remove("is-changing"), 350);
  }

  function renderStory() {
    const product = byId.get("tulip-pendant");
    document.querySelector("[data-story-product]").src = image(product);
    document.querySelector("[data-story-product]").alt = product.imageAlt;
    document.querySelector("[data-story-link]").href = `/products/${product.slug}`;
    document.querySelector("#story-annotations").innerHTML = `<span>01 · ${escapeHtml(category(product))}</span><span>02 · ${escapeHtml(product.sku)}</span><span>03 · ${api.formatPrice(product).confirmed ? "Confirmed price" : "Price confirmed personally"}</span>`;
  }

  function renderOrbit(next = state.orbit) {
    state.orbit = (next + orbitProducts.length) % orbitProducts.length;
    const active = orbitProducts[state.orbit];
    document.querySelector("#orbit-scene").innerHTML = orbitProducts.map((product, index) => {
      const relative = (index - state.orbit + orbitProducts.length) % orbitProducts.length;
      return `<button class="orbit-piece ${relative === 0 ? "is-active" : ""}" style="--orbit-position:${relative}" type="button" data-orbit-index="${index}" aria-label="Select ${escapeHtml(product.title)}"><img src="${image(product)}" alt="${relative === 0 ? escapeHtml(product.imageAlt) : ""}" /></button>`;
    }).join("");
    document.querySelector("#orbit-info").innerHTML = `<p>${escapeHtml(category(active))}</p><h3>${escapeHtml(active.title)}</h3>${priceMarkup(active, "evil-orbit__price")}<p>${escapeHtml(active.description)}</p><div><button type="button" data-quick-view="${active.id}">Quick View</button>${purchaseMarkup(active)}<a href="/products/${active.slug}">View Product</a></div>`;
    document.querySelector("#orbit-selector").innerHTML = orbitProducts.map((product, index) => `<button class="${index === state.orbit ? "is-active" : ""}" type="button" data-orbit-index="${index}" aria-label="${escapeHtml(product.title)}"></button>`).join("");
  }

  function renderStack(message = "") {
    const selected = stackProducts.filter((product) => state.stack.has(product.id));
    document.querySelector("#stack-preview").innerHTML = selected.length ? selected.map((product, index) => `<figure style="--stack-index:${index}"><img src="${image(product)}" alt="${escapeHtml(product.imageAlt)}" /><button type="button" data-stack-toggle="${product.id}" aria-label="Remove ${escapeHtml(product.title)}">×</button></figure>`).join("") : `<div class="stacking-studio__empty">Choose pieces from the tray</div>`;
    document.querySelector("#stack-tray").innerHTML = stackProducts.map((product) => `<button class="${state.stack.has(product.id) ? "is-selected" : ""}" type="button" data-stack-toggle="${product.id}" aria-pressed="${state.stack.has(product.id)}"><img src="${image(product)}" alt="" /><span>${escapeHtml(product.title)}</span><small>${escapeHtml(api.formatPrice(product).label)}</small></button>`).join("");
    const confirmedSubtotal = selected.reduce((sum, product) => sum + (api.formatPrice(product).price || 0), 0);
    const enquiries = selected.filter((product) => !api.formatPrice(product).confirmed || api.getPurchaseMode(product) === "enquiry");
    document.querySelector("#stack-summary").innerHTML = `<div><span>${selected.length} selected</span><strong>Confirmed subtotal: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(confirmedSubtotal)}</strong></div>${enquiries.length ? `<p>${enquiries.length} piece${enquiries.length > 1 ? "s" : ""} require price or option confirmation and are not added to the subtotal.</p>` : ""}<span class="visually-hidden">${escapeHtml(message)}</span>`;
    document.querySelector("[data-stack-add]").disabled = !selected.length;
    document.querySelector("[data-stack-save]").disabled = !selected.length;
  }

  function renderRings(next = state.ring) {
    state.ring = (next + ringProducts.length) % ringProducts.length;
    const active = ringProducts[state.ring];
    document.querySelector("#ring-scene").innerHTML = ringProducts.map((product, index) => {
      let relative = index - state.ring;
      if (relative > ringProducts.length / 2) relative -= ringProducts.length;
      if (relative < -ringProducts.length / 2) relative += ringProducts.length;
      const ringX = relative * 150;
      const ringY = Math.sin(relative) * 130;
      return `<button class="constellation-ring ${relative === 0 ? "is-active" : ""}" style="--ring-x:${ringX}px;--ring-y:${ringY}px;--ring-abs:${Math.abs(relative)}" type="button" data-ring-index="${index}" aria-label="Select ${escapeHtml(product.title)}"><img src="${image(product)}" alt="${relative === 0 ? escapeHtml(product.imageAlt) : ""}" /></button>`;
    }).join("");
    document.querySelector("#ring-info").innerHTML = `<p>${escapeHtml(active.sku)}</p><h3>${escapeHtml(active.title)}</h3>${priceMarkup(active, "ring-constellation__price")}<p>${escapeHtml(active.description)}</p><div><button type="button" data-quick-view="${active.id}">Quick View</button>${purchaseMarkup(active)}<a href="/products/${active.slug}">View Ring</a></div>`;
    document.querySelector("#ring-count").textContent = `${pad(state.ring + 1)} / ${pad(ringProducts.length)}`;
  }

  function renderLook(next = state.look, productIndex = 0) {
    state.look = (next + looks.length) % looks.length;
    state.lookProduct = productIndex;
    const look = looks[state.look];
    const lookProducts = look.ids.map((id) => byId.get(id));
    const active = lookProducts[state.lookProduct] || lookProducts[0];
    document.querySelector("#look-tabs").innerHTML = looks.map((item, index) => `<button class="${index === state.look ? "is-active" : ""}" type="button" role="tab" aria-selected="${index === state.look}" data-look-index="${index}">${escapeHtml(item.title)}</button>`).join("");
    document.querySelector("#look-stage").innerHTML = `<img src="/${escapeHtml(look.image)}" alt="${escapeHtml(look.title)} jewellery scene" /><div class="look-scenes__shade"></div><h3>${escapeHtml(look.title)}</h3>${lookProducts.map((product, index) => `<button class="look-hotspot ${index === state.lookProduct ? "is-active" : ""}" style="left:${look.points[index][0]}%;top:${look.points[index][1]}%" type="button" data-look-product="${index}" aria-label="View ${escapeHtml(product.title)}">${index + 1}</button>`).join("")}<article class="look-annotation"><img src="${image(active)}" alt="" /><div><span>${escapeHtml(category(active))}</span><strong>${escapeHtml(active.title)}</strong>${priceMarkup(active, "look-annotation__price")}<button type="button" data-quick-view="${active.id}">Quick View</button></div></article><div class="look-scenes__actions"><button class="stable-button stable-button--light" type="button" data-look-add>Add Complete Look</button><a class="stable-button stable-button--line" href="/collections/all">Explore Products</a></div>`;
    document.querySelector("#look-products").innerHTML = lookProducts.map((product, index) => `<button type="button" data-look-product="${index}"><img src="${image(product)}" alt="" /><span><strong>${escapeHtml(product.title)}</strong><small>${escapeHtml(api.formatPrice(product).label)}</small></span></button>`).join("");
  }

  function renderWatch(next = state.watch) {
    state.watch = (next + watchProducts.length) % watchProducts.length;
    const active = watchProducts[state.watch];
    document.querySelector("#watch-stage").innerHTML = watchProducts.map((product, index) => {
      let offset = index - state.watch;
      if (offset > 1) offset -= watchProducts.length;
      if (offset < -1) offset += watchProducts.length;
      return `<button class="watch-media ${offset === 0 ? "is-active" : ""}" style="--watch-offset:${offset};--watch-abs:${Math.abs(offset)}" type="button" data-watch-index="${index}" aria-label="Select ${escapeHtml(product.title)}"><img src="${image(product)}" alt="${offset === 0 ? escapeHtml(product.imageAlt) : ""}" /><span>Image story</span></button>`;
    }).join("");
    document.querySelector("#watch-info").innerHTML = `<p>IMAGE STORY · ${escapeHtml(category(active))}</p><h3>${escapeHtml(active.title)}</h3>${priceMarkup(active, "watch-shop__price")}<p>${escapeHtml(active.description)}</p><div><button type="button" data-quick-view="${active.id}">Quick View</button>${purchaseMarkup(active)}<a href="/products/${active.slug}">View Product</a></div>`;
    document.querySelector("#watch-count").textContent = `${pad(state.watch + 1)} / ${pad(watchProducts.length)}`;
  }

  function initializeStaticExperiences() {
    renderHero();
    renderUniverse();
    renderDeck();
  }

  function handleAction(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("[data-mobile-search]")) return store.openSearch(target.closest("[data-mobile-search]"));
    if (target.closest("[data-mobile-cart]")) return store.openCart(target.closest("[data-mobile-cart]"));
    const experienceWishlist = target.closest("[data-experience-wishlist]");
    if (experienceWishlist) return store.toggleWishlist(experienceWishlist.dataset.experienceWishlist);
    const experiencePurchase = target.closest("[data-experience-purchase]");
    if (experiencePurchase) return store.addProducts([experiencePurchase.dataset.experiencePurchase]);
    if (target.closest("[data-hero-prev], [data-hero-next]")) return renderHero(state.hero + (target.closest("[data-hero-prev]") ? -1 : 1), true);
    const heroPurchaseButton = target.closest("[data-hero-purchase]");
    if (heroPurchaseButton) return heroPurchase(heroPurchaseButton.dataset.heroPurchase);
    if (target.closest("[data-universe-prev], [data-universe-next]")) return renderUniverse(state.universe + (target.closest("[data-universe-prev]") ? -1 : 1));
    const universeCard = target.closest("[data-universe-index]");
    if (universeCard && target.closest("button")) return renderUniverse(Number(universeCard.dataset.universeIndex));
    const universeDot = target.closest("[data-universe-dot]");
    if (universeDot) return renderUniverse(Number(universeDot.dataset.universeDot));
    if (target.closest("[data-deck-prev], [data-deck-next]")) return renderDeck(state.deck + (target.closest("[data-deck-prev]") ? -1 : 1), true);
    if (target.closest("[data-wanted-prev], [data-wanted-next]")) return renderWanted(state.wanted + (target.closest("[data-wanted-prev]") ? -1 : 1));
    const wanted = target.closest("[data-wanted-index]");
    if (wanted) return renderWanted(Number(wanted.dataset.wantedIndex));
    if (target.closest("[data-orbit-prev], [data-orbit-next]")) return renderOrbit(state.orbit + (target.closest("[data-orbit-prev]") ? -1 : 1));
    const orbit = target.closest("[data-orbit-index]");
    if (orbit) return renderOrbit(Number(orbit.dataset.orbitIndex));
    const stackToggle = target.closest("[data-stack-toggle]");
    if (stackToggle) {
      const id = stackToggle.dataset.stackToggle;
      if (state.stack.has(id)) state.stack.delete(id);
      else state.stack.add(id);
      return renderStack(`${byId.get(id).title} ${state.stack.has(id) ? "selected" : "removed"}`);
    }
    if (target.closest("[data-stack-reset]")) {
      state.stack.clear();
      return renderStack("Stack reset");
    }
    if (target.closest("[data-stack-save]")) {
      state.stack.forEach((id) => store.toggleWishlist(id));
      return store.showToast("Saved to Your Shivara Edit.");
    }
    if (target.closest("[data-stack-add]")) return store.addProducts([...state.stack], { openBag: true, allowEnquiry: true });
    if (target.closest("[data-ring-prev], [data-ring-next]")) return renderRings(state.ring + (target.closest("[data-ring-prev]") ? -1 : 1));
    const ring = target.closest("[data-ring-index]");
    if (ring) return renderRings(Number(ring.dataset.ringIndex));
    const lookTab = target.closest("[data-look-index]");
    if (lookTab) return renderLook(Number(lookTab.dataset.lookIndex), 0);
    const lookProduct = target.closest("[data-look-product]");
    if (lookProduct) return renderLook(state.look, Number(lookProduct.dataset.lookProduct));
    if (target.closest("[data-look-add]")) return store.addProducts(looks[state.look].ids, { openBag: true, allowEnquiry: true });
    if (target.closest("[data-watch-prev], [data-watch-next]")) return renderWatch(state.watch + (target.closest("[data-watch-prev]") ? -1 : 1));
    const watch = target.closest("[data-watch-index]");
    if (watch) return renderWatch(Number(watch.dataset.watchIndex));
  }

  function keyNavigation(event) {
    if (!["ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) return;
    if (event.target.closest("#floating-atelier")) {
      if (event.key !== "Escape") {
        event.preventDefault();
        renderHero(state.hero + (event.key === "ArrowLeft" ? -1 : 1), true);
      }
    } else if (event.target.closest("#category-universe")) {
      event.preventDefault();
      if (event.key !== "Escape") renderUniverse(state.universe + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.target.closest("#shivara-deck")) {
      event.preventDefault();
      if (event.key === "Escape") {
        document.querySelector("#living-deck-stage").style.removeProperty("--deck-drag");
        deckPointer = null;
      } else renderDeck(state.deck + (event.key === "ArrowLeft" ? -1 : 1), true);
    } else if (event.target.closest("#most-wanted")) {
      event.preventDefault();
      renderWanted(state.wanted + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.target.closest("#evil-eye-orbit")) {
      event.preventDefault();
      renderOrbit(state.orbit + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.target.closest("#ring-constellation")) {
      event.preventDefault();
      renderRings(state.ring + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.target.closest("#watch-shop")) {
      event.preventDefault();
      renderWatch(state.watch + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  function setupPointerGestures() {
    const hero = document.querySelector("#floating-atelier");
    const deck = document.querySelector("#living-deck-stage");
    const universe = document.querySelector(".universe-gallery__viewport");
    const watch = STOREFRONT_FEATURES.watchShop ? document.querySelector("#watch-stage") : null;
    let universePointer = null;
    let watchPointer = null;
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      state.heroTargetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
      state.heroTargetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      state.heroTargetX = 0;
      state.heroTargetY = 0;
    });
    hero.addEventListener("pointerdown", (event) => {
      heroPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      clearTimeout(heroTimer);
    });
    hero.addEventListener("pointerup", (event) => {
      if (!heroPointer || heroPointer.id !== event.pointerId) return;
      const distance = event.clientX - heroPointer.x;
      if (Math.abs(distance) > 55) renderHero(state.hero + (distance < 0 ? 1 : -1), true);
      heroPointer = null;
      resetHeroTimer();
    });

    deck.addEventListener("pointerdown", (event) => {
      if (event.target.closest("a, button")) return;
      deckPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
      deck.classList.add("is-pressing");
    });
    deck.addEventListener("pointermove", (event) => {
      if (!deckPointer || deckPointer.id !== event.pointerId) return;
      const x = event.clientX - deckPointer.x;
      const y = event.clientY - deckPointer.y;
      if (!deckPointer.horizontal && Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.3) {
        deckPointer.horizontal = true;
        deck.setPointerCapture(event.pointerId);
      }
      if (!deckPointer.horizontal) return;
      event.preventDefault();
      deck.style.setProperty("--deck-drag", `${Math.max(-130, Math.min(130, x))}px`);
      deck.style.setProperty("--deck-rotate", `${Math.max(-3.5, Math.min(3.5, x / 32))}deg`);
    });
    function releaseDeck(event) {
      if (!deckPointer || deckPointer.id !== event.pointerId) return;
      const distance = event.clientX - deckPointer.x;
      deck.classList.remove("is-pressing");
      deck.style.removeProperty("--deck-drag");
      deck.style.removeProperty("--deck-rotate");
      if (deckPointer.horizontal && Math.abs(distance) > 68) renderDeck(state.deck + (distance < 0 ? 1 : -1), true);
      deckPointer = null;
    }
    deck.addEventListener("pointerup", releaseDeck);
    deck.addEventListener("pointercancel", releaseDeck);

    universe.addEventListener("pointerdown", (event) => {
      if (matchMedia("(max-width: 767px)").matches || event.target.closest("a, button")) return;
      universePointer = { id: event.pointerId, x: event.clientX };
      universe.setPointerCapture(event.pointerId);
    });
    universe.addEventListener("pointerup", (event) => {
      if (!universePointer || universePointer.id !== event.pointerId) return;
      const distance = event.clientX - universePointer.x;
      if (Math.abs(distance) > 45) renderUniverse(state.universe + (distance < 0 ? 1 : -1));
      universePointer = null;
    });
    universe.addEventListener("wheel", (event) => {
      if (matchMedia("(max-width: 767px)").matches || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      renderUniverse(state.universe + (event.deltaX > 0 ? 1 : -1));
    }, { passive: false });

    watch?.addEventListener("pointerdown", (event) => {
      if (event.target.closest("a, button")) return;
      watchPointer = { id: event.pointerId, x: event.clientX };
    });
    watch?.addEventListener("pointerup", (event) => {
      if (!watchPointer || watchPointer.id !== event.pointerId) return;
      const distance = event.clientX - watchPointer.x;
      if (Math.abs(distance) > 50) renderWatch(state.watch + (distance < 0 ? 1 : -1));
      watchPointer = null;
    });

    document.addEventListener("pointerover", (event) => {
      if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const card = event.target.closest?.(".featured-product-card");
      if (card) state.activeTilt = card;
    });
    document.addEventListener("pointermove", (event) => {
      if (!state.activeTilt) return;
      const rect = state.activeTilt.getBoundingClientRect();
      state.tiltTargetX = ((event.clientX - rect.left) / rect.width - .5) * 2;
      state.tiltTargetY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    }, { passive: true });
    document.addEventListener("pointerout", (event) => {
      if (state.activeTilt && !state.activeTilt.contains(event.relatedTarget)) {
        state.activeTilt.style.removeProperty("--tilt-x");
        state.activeTilt.style.removeProperty("--tilt-y");
        state.activeTilt = null;
        state.tiltTargetX = 0;
        state.tiltTargetY = 0;
      }
    });
  }

  function setupMotion() {
    const motion = window.SHIVARA_MOTION;
    if (!motion) return;
    const hero = document.querySelector("#floating-atelier");
    motion.register("floating-atelier", {
      element: hero,
      initialize: resetHeroTimer,
      pause() { clearTimeout(heroTimer); },
      resume: resetHeroTimer,
      destroy() { clearTimeout(heroTimer); }
    });
    motion.addFrameCallback(() => {
      state.heroX += (state.heroTargetX - state.heroX) * .07;
      state.heroY += (state.heroTargetY - state.heroY) * .07;
      hero.style.setProperty("--hero-x", state.heroX.toFixed(3));
      hero.style.setProperty("--hero-y", state.heroY.toFixed(3));
      if (state.activeTilt) {
        state.tiltX += (state.tiltTargetX - state.tiltX) * .12;
        state.tiltY += (state.tiltTargetY - state.tiltY) * .12;
        state.activeTilt.style.setProperty("--tilt-x", state.tiltX.toFixed(3));
        state.activeTilt.style.setProperty("--tilt-y", state.tiltY.toFixed(3));
      }
    });
  }

  function injectUtilities() {
    document.body.insertAdjacentHTML("beforeend", `<div class="ask-shivara"><button type="button" data-concierge-toggle aria-expanded="false">Ask Shivara</button><aside id="ask-shivara-panel" aria-hidden="true"><div><strong>Ask Shivara</strong><button type="button" data-concierge-close aria-label="Close assistance">×</button></div>${[
      ["Help me choose a gift", "I would like help choosing a jewellery gift."],
      ["Find something under ₹499", "Please help me find confirmed-price pieces under ₹499."],
      ["Build a jewellery stack", "I would like help building a jewellery stack."],
      ["Check product availability", "I would like to check product availability."],
      ["Ask about delivery", "Please share delivery information for my location."],
      ["Request a custom piece", "I would like to ask about a custom jewellery request."]
    ].map(([label, message]) => `<a href="https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(`Hi Shivara, ${message}`)}" target="_blank" rel="noreferrer">${label}<span>→</span></a>`).join("")}</aside></div>
    <nav class="mobile-commerce-dock" aria-label="Quick navigation"><a href="/" aria-current="page"><span>⌂</span>Home</a><button type="button" data-mobile-search><span>⌕</span>Search</button><a href="/wishlist"><span>♡</span>Wishlist <i data-wishlist-count>0</i></a><button type="button" data-mobile-cart><span>Bag</span>Bag <i data-cart-count>0</i></button></nav>`);
    store.refreshCounts();
  }

  function setupMobileControls() {
    const dock = document.querySelector(".mobile-commerce-dock");
    const universeViewport = document.querySelector(".universe-gallery__viewport");
    let lastY = window.scrollY;
    let universeTimer = 0;

    const updateDock = () => {
      const currentY = Math.max(0, window.scrollY);
      const beyondHero = currentY > document.querySelector("#floating-atelier").offsetHeight * .72;
      const movingDown = currentY > lastY + 4;
      const modalOpen = document.body.classList.contains("stable-modal-open");
      const shouldShow = matchMedia("(max-width: 767px)").matches && beyondHero && !movingDown && !modalOpen;
      dock.classList.toggle("is-visible", shouldShow);
      dock.setAttribute("aria-hidden", String(!shouldShow));
      lastY = currentY;
    };

    window.addEventListener("scroll", updateDock, { passive: true });
    window.addEventListener("resize", updateDock, { passive: true });
    document.addEventListener("shivara:modal-change", updateDock);
    updateDock();

    universeViewport.addEventListener("scroll", () => {
      if (!matchMedia("(max-width: 767px)").matches) return;
      clearTimeout(universeTimer);
      universeTimer = setTimeout(() => {
        const cards = [...universeViewport.querySelectorAll(".universe-card")];
        const center = universeViewport.scrollLeft + universeViewport.clientWidth / 2;
        const nearest = cards.reduce((best, card, index) => {
          const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          return distance < best.distance ? { index, distance } : best;
        }, { index: 0, distance: Infinity });
        state.universe = nearest.index;
        document.querySelectorAll("[data-universe-dot]").forEach((dot, index) => {
          dot.classList.toggle("is-active", index === state.universe);
          dot.setAttribute("aria-selected", String(index === state.universe));
        });
      }, 90);
    }, { passive: true });
  }

  document.addEventListener("click", handleAction);
  document.addEventListener("keydown", keyNavigation);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-concierge-toggle]")) {
      const panel = document.querySelector("#ask-shivara-panel");
      const open = panel.getAttribute("aria-hidden") === "true";
      panel.setAttribute("aria-hidden", String(!open));
      event.target.closest("[data-concierge-toggle]").setAttribute("aria-expanded", String(open));
    }
    if (event.target.closest("[data-concierge-close]")) {
      document.querySelector("#ask-shivara-panel").setAttribute("aria-hidden", "true");
      document.querySelector("[data-concierge-toggle]").setAttribute("aria-expanded", "false");
    }
  });

  const lockedBefore = JSON.stringify(products.map((product) => [product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants]));
  initializeStaticExperiences();
  injectUtilities();
  setupMobileControls();
  setupPointerGestures();
  if (window.SHIVARA_MOTION) setupMotion();
  else document.addEventListener("shivara:motion-ready", setupMotion, { once: true });
  const lockedAfter = JSON.stringify(api.getAllProducts().map((product) => [product.id, product.title, product.price, product.priceStatus, product.category, product.optionsStatus, product.variants]));
  if (lockedBefore !== lockedAfter) throw new Error("Phase B attempted to mutate locked catalogue data");
  document.documentElement.classList.add("phase-b-ready");
})();
