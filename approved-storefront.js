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
  decorate();
  new MutationObserver(decorate).observe(
    document.getElementById("shared-header"),
    { childList: true },
  );
})();
