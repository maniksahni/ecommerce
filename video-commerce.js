/**
 * ══════════════════════════════════════════════════════════
 * SHIVARA LUXE — VIDEO COMMERCE & REELS ENGINE ("WATCH & BUY")
 * Inspired by Rainbow रंग & The Indian Sandook luxury video feed
 * ══════════════════════════════════════════════════════════
 */
(function initVideoCommerce() {
  const REELS_DATA = [
    {
      id: "reel-01",
      videoUrl: "/assets/instagram-shop/post-051-DW3H_GZDD_4.jpg",
      videoPoster: "/assets/instagram-shop/post-051-DW3H_GZDD_4.jpg",
      productId: "boxed-evil-eye-bracelet",
      productTitle: "Boxed Evil Eye Bracelet",
      category: "Bracelets",
      price: 299,
      compareAtPrice: 599,
      rating: 4.9,
      views: "14.2k",
      caption: "Our bestselling 18K gold-plated Evil Eye Bracelet ✨ Sweatproof & tarnish-free everyday luxury."
    },
    {
      id: "reel-02",
      videoUrl: "/assets/instagram-shop/post-005-DYU0BW6h3rQ.jpg",
      videoPoster: "/assets/instagram-shop/post-005-DYU0BW6h3rQ.jpg",
      productId: "pearl-drop-hoops",
      productTitle: "Pearl Drop Statement Hoops",
      category: "Earrings",
      price: 499,
      compareAtPrice: 899,
      rating: 5.0,
      views: "28.5k",
      caption: "Handcrafted freshwater pearls framed in 925 silver finish. Perfect for festive & occasion styling! 💫"
    },
    {
      id: "reel-03",
      videoUrl: "/assets/instagram-shop/post-006-DYSSH09hsqL.jpg",
      videoPoster: "/assets/instagram-shop/post-006-DYSSH09hsqL.jpg",
      productId: "emerald-halo-pendant",
      productTitle: "Emerald Halo Solitaire Pendant",
      category: "Necklaces",
      price: 399,
      compareAtPrice: 749,
      rating: 4.9,
      views: "19.8k",
      caption: "Deep royal green zircon stones with micro-pavé halo setting. Layer with your delicate chains ✨"
    },
    {
      id: "reel-04",
      videoUrl: "/assets/instagram-shop/post-002-DYcf1ViBfkI.jpg",
      videoPoster: "/assets/instagram-shop/post-002-DYcf1ViBfkI.jpg",
      productId: "sculptural-statement-ring",
      productTitle: "Sculptural Leaf Cocktail Ring",
      category: "Rings",
      price: 349,
      compareAtPrice: 699,
      rating: 4.8,
      views: "11.6k",
      caption: "Adjustable comfort band with textured artisanal petals. Elevate any evening or Indo-western outfit 🤍"
    },
    {
      id: "reel-05",
      videoUrl: "/assets/instagram-shop/post-004-DYXLrorhG7w.jpg",
      videoPoster: "/assets/instagram-shop/post-004-DYXLrorhG7w.jpg",
      productId: "layered-chain-necklace",
      productTitle: "Dual Layered Paperclip Choker",
      category: "Necklaces",
      price: 549,
      compareAtPrice: 999,
      rating: 5.0,
      views: "34.1k",
      caption: "Hypoallergenic titanium steel that never loses its golden mirror finish. Dispatched within 24h 🚚"
    }
  ];

  function formatInr(val) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  }

  function renderWatchAndBuySection() {
    const container = document.getElementById("watch-and-buy-container");
    if (!container) return;

    const html = `
      <section class="watch-and-buy-section" aria-labelledby="watch-buy-heading">
        <div class="watch-buy-header">
          <div class="watch-buy-title-group">
            <span class="watch-buy-eyebrow">✨ LIVE ATELIER FEED</span>
            <h2 id="watch-buy-heading" class="watch-buy-title">Watch and Buy</h2>
            <p class="watch-buy-subtitle">Explore real customer styling, craftsmanship reels &amp; buy instantly in one tap.</p>
          </div>
          <div class="watch-buy-nav-controls">
            <button type="button" class="reel-nav-btn prev" id="reel-prev-btn" aria-label="Previous reels">‹</button>
            <button type="button" class="reel-nav-btn next" id="reel-next-btn" aria-label="Next reels">›</button>
          </div>
        </div>

        <div class="reels-track-wrap" id="reels-track-wrap">
          <div class="reels-track" id="reels-track">
            ${REELS_DATA.map((reel, idx) => `
              <div class="reel-card" data-reel-id="${reel.id}" data-product-id="${reel.productId}">
                <div class="reel-video-container">
                  <img class="reel-poster-img" src="${reel.videoPoster}" alt="${reel.productTitle}" loading="lazy" />
                  <div class="reel-live-pill">
                    <span class="pulse-dot"></span> REEL
                  </div>
                  <div class="reel-views-pill">
                    <span class="eye-icon">👁</span> ${reel.views}
                  </div>
                  <button type="button" class="reel-play-trigger" data-play-reel="${reel.id}" aria-label="Watch ${reel.productTitle} reel">
                    <span class="play-icon-triangle">▶</span>
                  </button>
                </div>

                <!-- Floating Mini Product Quick-Buy Card -->
                <div class="reel-product-card">
                  <div class="reel-product-thumb">
                    <img src="${reel.videoPoster}" alt="${reel.productTitle}" />
                  </div>
                  <div class="reel-product-info">
                    <span class="reel-product-title">${reel.productTitle}</span>
                    <div class="reel-product-pricing">
                      <strong class="reel-curr-price">${formatInr(reel.price)}</strong>
                      <s class="reel-old-price">${formatInr(reel.compareAtPrice)}</s>
                    </div>
                  </div>
                  <button type="button" class="reel-quick-add-btn" data-reel-add="${reel.productId}" aria-label="Add ${reel.productTitle} to bag">
                    Buy
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `;

    container.innerHTML = html;
    bindWatchAndBuyEvents();
  }

  function bindWatchAndBuyEvents() {
    const track = document.getElementById("reels-track");
    const prevBtn = document.getElementById("reel-prev-btn");
    const nextBtn = document.getElementById("reel-next-btn");

    if (track && prevBtn && nextBtn) {
      prevBtn.addEventListener("click", () => {
        track.scrollBy({ left: -320, behavior: "smooth" });
      });
      nextBtn.addEventListener("click", () => {
        track.scrollBy({ left: 320, behavior: "smooth" });
      });
    }

    // Quick Add from reels
    document.querySelectorAll("[data-reel-add]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute("data-reel-add");
        
        // Find product in catalog
        let prod = null;
        if (window.ShivaraCatalog && typeof window.ShivaraCatalog.getProductById === "function") {
          prod = window.ShivaraCatalog.getProductById(pId);
        }
        if (!prod && window.SHIVARA_CATALOG) {
          prod = window.SHIVARA_CATALOG.find(p => p.id === pId || p.slug === pId);
        }

        if (prod) {
          // Dispatch add to bag event
          const addBtn = document.querySelector(`[data-card-add="${prod.id}"]`);
          if (addBtn) {
            addBtn.click();
          } else {
            // Trigger custom event
            window.dispatchEvent(new CustomEvent("shivara:add-to-cart", {
              detail: { product: prod, quantity: 1 }
            }));
          }

          // Visual feedback on button
          const originalText = btn.textContent;
          btn.textContent = "✓ Added";
          btn.style.background = "#2e7d32";
          btn.style.color = "#fff";
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
            btn.style.color = "";
          }, 1600);
        }
      });
    });

    // Tap to open Reel Modal
    document.querySelectorAll("[data-play-reel]").forEach(trigger => {
      trigger.addEventListener("click", () => {
        const reelId = trigger.getAttribute("data-play-reel");
        const reel = REELS_DATA.find(r => r.id === reelId);
        if (reel) openReelModal(reel);
      });
    });
  }

  function openReelModal(reel) {
    let modal = document.getElementById("reel-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "reel-modal";
      modal.className = "reel-modal";
      modal.innerHTML = `
        <div class="reel-modal-backdrop" id="reel-modal-backdrop"></div>
        <div class="reel-modal-content">
          <button type="button" class="reel-modal-close" id="reel-modal-close" aria-label="Close video reel">✕</button>
          <div class="reel-modal-media">
            <img class="reel-modal-img" id="reel-modal-img" src="" alt="" />
            <div class="reel-modal-overlay">
              <div class="reel-modal-caption" id="reel-modal-caption"></div>
              <div class="reel-modal-product-dock" id="reel-modal-product-dock"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById("reel-modal-close")?.addEventListener("click", closeReelModal);
      document.getElementById("reel-modal-backdrop")?.addEventListener("click", closeReelModal);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-active")) {
          closeReelModal();
        }
      });
    }

    const img = document.getElementById("reel-modal-img");
    const caption = document.getElementById("reel-modal-caption");
    const dock = document.getElementById("reel-modal-product-dock");

    if (img) img.src = reel.videoPoster;
    if (caption) caption.textContent = reel.caption;
    if (dock) {
      dock.innerHTML = `
        <div class="reel-dock-card">
          <div class="reel-dock-details">
            <span class="reel-dock-title">${reel.productTitle}</span>
            <div class="reel-dock-price">
              <strong>${formatInr(reel.price)}</strong>
              <s>${formatInr(reel.compareAtPrice)}</s>
              <span class="reel-dock-discount">${Math.round(((reel.compareAtPrice - reel.price) / reel.compareAtPrice) * 100)}% OFF</span>
            </div>
          </div>
          <button type="button" class="reel-dock-buy-btn" data-reel-add="${reel.productId}">
            Buy Now
          </button>
        </div>
      `;
      dock.querySelector("[data-reel-add]")?.addEventListener("click", () => {
        closeReelModal();
        const cardBtn = document.querySelector(`[data-card-add="${reel.productId}"]`);
        if (cardBtn) cardBtn.click();
      });
    }

    modal.classList.add("is-active");
    document.body.style.overflow = "hidden";
  }

  function closeReelModal() {
    const modal = document.getElementById("reel-modal");
    if (modal) {
      modal.classList.remove("is-active");
      document.body.style.overflow = "";
    }
  }

  // Initialize once DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderWatchAndBuySection);
  } else {
    renderWatchAndBuySection();
  }

  window.ShivaraVideoCommerce = { renderWatchAndBuySection, REELS_DATA };
})();
