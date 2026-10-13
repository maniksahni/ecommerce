(() => {
  "use strict";
  // Product discovery uses the same verified, live catalogue as the shop.
  // Raw Instagram post thumbnails can depict unrelated people or profile screens.
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderProductDiscovery() {
    const api = window.ShivaraCatalog;
    const renderer = window.ShivaraStorefrontRenderer;
    if (!api || !renderer) return;
    const products = api.getAllProducts().filter(p => p.images?.length && api.validateCommerceObject(p, "product discovery"));
    const reelProducts = products.filter(p => /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\//.test(p.instagram || ""))
      .sort((a, b) => Number(a.isSoldOut === true) - Number(b.isSoldOut === true));
    const container = document.getElementById("watch-and-buy-container");
    if (container) {
      container.innerHTML = reelProducts.length ? `<section class="watch-and-buy-section" aria-labelledby="watch-buy-heading"><div class="watch-buy-header"><div class="watch-buy-title-group"><span class="watch-buy-eyebrow">THE PRODUCT EDIT</span><h2 id="watch-buy-heading" class="watch-buy-title">Watch and Buy</h2><p class="watch-buy-subtitle">Explore product photos and open their matching Instagram reels.</p></div><a class="stable-button stable-button--line" href="/collections/all">Explore the collection →</a></div><div class="product-discovery-rail">${reelProducts.slice(0,8).map((p,index)=>renderer.renderProductCard(api,p,{index,context:"product discovery"})).join("")}</div></section>` : "";
    }
    if (container) container.querySelectorAll(".stable-card").forEach((card, index) => {
      const product = reelProducts[index];
      const photoLink = card.querySelector(".stable-card__media > a");
      if (photoLink && product) {
        photoLink.href = product.instagram;
        photoLink.target = "_blank";
        photoLink.rel = "noopener noreferrer";
        photoLink.setAttribute("aria-label", `Watch ${product.title} on Instagram`);
      }
    });
    const social = document.querySelector(".atelier-social-grid");
    if (social) {
      social.innerHTML = products.slice(0,6).map(p=>`<a class="atelier-social-item" href="${escape(renderer.productUrl(p))}" aria-label="${escape(p.title)}"><img src="${escape(renderer.mediaHref(p.images[0]))}" alt="${escape(p.title)}" loading="lazy" /></a>`).join("");
      social.closest("section").hidden = products.length === 0;
    }
  }
  document.addEventListener("shivara:catalogue-synced", renderProductDiscovery);
  document.addEventListener("shivara:storefront-ready", renderProductDiscovery);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderProductDiscovery);
  else renderProductDiscovery();
})();
