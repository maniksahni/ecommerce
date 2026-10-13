/* Presentation icons only; original commerce buttons and event handlers remain. */
(() => {
  if (!document.body.classList.contains("approved-storefront")) return;
  const shapes = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    account:
      '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 21c0-5 3-7 7.5-7s7.5 2 7.5 7"/>',
    wishlist:
      '<path d="M12 20.8 4.2 13.5C-1 8.5 6.4 2.1 12 8.1c5.6-6 13 .4 7.8 5.4z"/>',
    cart: '<path d="M4 8h16l-1 13H5zM8 10V7a4 4 0 0 1 8 0v3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    home: '<path d="M3 11 12 3l9 8v10h-6v-7H9v7H3z"/>',
  };
  const svg = (key) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">${shapes[key]}</svg>`;
  function decorate() {
    const header = document.querySelector(".stable-header");
    if (!header || header.dataset.approvedIcons) return;
    header.dataset.approvedIcons = "true";
    [
      ["[data-search-open]", "search"],
      ["[data-account-open]", "account"],
      [".stable-wish-link", "wishlist"],
      ["[data-cart-open]", "cart"],
      ["[data-menu-open]", "menu"],
    ].forEach(([selector, key]) => {
      const el = header.querySelector(selector);
      if (!el) return;
      const keep = [
        ...el.querySelectorAll(".header-badge,[data-account-name]"),
      ];
      el.replaceChildren();
      el.insertAdjacentHTML("afterbegin", svg(key));
      keep.forEach((n) => el.append(n));
    });
    document
      .querySelectorAll(".stable-mobile-dock .dock-icon")
      .forEach(
        (el, i) =>
          (el.innerHTML = svg(
            ["home", "menu", "search", "wishlist", "cart"][i],
          )),
      );
  }
  // Safari/WebKit can retain the 125x39 desktop search-pill sizing while
  // evaluating a 320px mobile viewport. Inline !important provides a reliable
  // 44x44 *clickable* target without changing click handlers or desktop layout.
  function enforceMobileHeaderTargets() {
    const header = document.querySelector(".stable-header");
    if (!header) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const controls = [
      header.querySelector("[data-menu-open]"),
      header.querySelector("[data-search-open]"),
      header.querySelector(".stable-wish-link"),
      header.querySelector("[data-cart-open]"),
    ].filter(Boolean);
    const declarations = {
      width: "44px",
      "min-width": "44px",
      "max-width": "44px",
      height: "44px",
      "min-height": "44px",
      "max-height": "44px",
      "flex-basis": "44px",
      "flex-shrink": "0",
      transform: "none",
    };
    for (const element of controls) {
      if (mobile) {
        if (!element.hasAttribute("data-shivara-touch-sized")) {
          const savedStyle = element.getAttribute("style");
          element.dataset.shivaraTouchOriginalStyle =
            savedStyle === null ? "" : savedStyle;
        }
        for (const [property, value] of Object.entries(declarations)) {
          element.style.setProperty(property, value, "important");
        }
        element.dataset.shivaraTouchSized = "true";
      } else if (element.dataset.shivaraTouchSized === "true") {
        // Restore the exact previous inline declaration set on desktop, so
        // media changes never leave the mobile touch sizing behind.
        const original = element.dataset.shivaraTouchOriginalStyle;
        delete element.dataset.shivaraTouchSized;
        delete element.dataset.shivaraTouchOriginalStyle;
        if (original) element.setAttribute("style", original);
        else element.removeAttribute("style");
      }
    }
  }
  function syncPresentation() {
    decorate();
    enforceMobileHeaderTargets();
  }
  syncPresentation();
  const headerMount = document.getElementById("shared-header");
  if (headerMount) {
    new MutationObserver(syncPresentation).observe(headerMount, {
      childList: true,
    });
  }
  window.addEventListener("resize", enforceMobileHeaderTargets, { passive: true });
  // Some WebKit versions update matchMedia before dispatching resize; listen
  // directly to the breakpoint and visual viewport as well.
  const mobileBreakpoint = window.matchMedia("(max-width: 767px)");
  if (mobileBreakpoint.addEventListener) {
    mobileBreakpoint.addEventListener("change", enforceMobileHeaderTargets);
  } else if (mobileBreakpoint.addListener) {
    mobileBreakpoint.addListener(enforceMobileHeaderTargets);
  }
  window.visualViewport?.addEventListener(
    "resize",
    enforceMobileHeaderTargets,
    { passive: true },
  );
})();
