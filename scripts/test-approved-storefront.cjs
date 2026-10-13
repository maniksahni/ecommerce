const { chromium, webkit } = require(
  process.cwd() + "/node_modules/playwright",
);
const fs = require("fs");
(async () => {
  const report = [];
  fs.mkdirSync("artifacts/approved-storefront", { recursive: true });
  for (const [name, engine] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    const b = await engine.launch();
    const p = await b.newPage({ viewport: { width: 320, height: 844 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.APPROVED_BASE_URL || "http://localhost:3000", {
      waitUntil: "domcontentloaded",
    });
    await p.locator(".stable-header [data-search-open] svg").first().waitFor();
    await p.locator("[data-product-card]").first().waitFor();
    await p.locator(".product-discovery-rail .stable-card").first().waitFor();
    for (const width of [320, 340, 350, 360, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await p.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({
        path: `artifacts/approved-storefront/${name}-${width}-hero.png`,
      });
      const result = await p.evaluate(() => {
        const inside = (s) => {
          const r = document.querySelector(s).getBoundingClientRect();
          return r.width >= 20 && r.left >= 0 && r.right <= innerWidth;
        };
        return {
          width: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          cart: inside(".stable-header [data-cart-open]"),
          search: inside(".stable-header [data-search-open]"),
          wishlist: inside(".stable-header .stable-wish-link"),
          cta: inside(".approved-hero .approved-outline"),
          heroPhotoGlow: getComputedStyle(document.querySelector(".cream-hero-photo")).filter,
          watchBuyStockOrder: (() => {
            const cards = [...document.querySelectorAll(".product-discovery-rail .stable-card")];
            const firstSoldOut = cards.findIndex((card) => card.classList.contains("is-sold-out"));
            return firstSoldOut < 0 || cards.slice(firstSoldOut).every((card) => card.classList.contains("is-sold-out"));
          })(),
          headerClear: (() => {
            const nodes = [...document.querySelectorAll('.stable-header__menu,.stable-header>.stable-logo,.cream-reference-nav,.stable-header__actions>button,.stable-header__actions>a')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width);
            const boxes=nodes.map(e=>e.getBoundingClientRect());
            return boxes.every((a,i)=>boxes.every((b,j)=>i===j||a.right<=b.left+1||b.right<=a.left+1||a.bottom<=b.top+1||b.bottom<=a.top+1));
          })(),
          touch: [
            ...document.querySelectorAll(
              ".stable-header__actions>button,.stable-header__actions>a",
            ),
          ]
            .filter((e) => getComputedStyle(e).display !== "none")
            .every((e) => e.getBoundingClientRect().width >= 44),
          badImages: [
            ...document.querySelectorAll(
              ".approved-hero img,.approved-campaign img,.approved-editorial img",
            ),
          ].filter((i) => i.complete && !i.naturalWidth).length,
        };
      });
      report.push({ browser: name, ...result });
      console.log(name, width, JSON.stringify(result));
      if (
        result.overflow ||
        !result.headerClear ||
        !result.cart ||
        !result.search ||
        !result.wishlist ||
        !result.cta ||
        !result.heroPhotoGlow.includes("brightness(1.08)") ||
        !result.watchBuyStockOrder ||
        !result.touch ||
        result.badImages
      )
        throw Error("Layout failed");
      if ([375, 768, 1440].includes(width)) {
        for (const [section, selector] of [
          ["arrivals", ".approved-arrivals"],
          ["campaigns", ".approved-campaigns"],
          ["services", ".approved-services"],
        ]) {
          await p.locator(selector).scrollIntoViewIfNeeded();
          await p.screenshot({
            path: `artifacts/approved-storefront/${name}-${width}-${section}.png`,
          });
        }
        await p.evaluate(() => scrollTo(0, 0));
        await p.screenshot({
          path: `artifacts/approved-storefront/${name}-${width}-full.png`,
          fullPage: true,
        });
      }
    }
    if (errors.length) throw Error(errors.join("\n"));
    await b.close();
  }
  fs.writeFileSync(
    "artifacts/approved-storefront/responsive-results.json",
    JSON.stringify(report, null, 2),
  );
})();
