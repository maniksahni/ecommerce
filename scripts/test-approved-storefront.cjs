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
    const p = await b.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.APPROVED_BASE_URL || "http://localhost:3000", {
      waitUntil: "domcontentloaded",
    });
    await p.locator(".stable-header [data-search-open] svg").first().waitFor();
    await p.locator("[data-product-card]").first().waitFor();
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
          media: {
            mobile: matchMedia("(max-width: 767px)").matches,
            desktop: matchMedia("(min-width: 1101px)").matches,
          },
          overflow: document.documentElement.scrollWidth > innerWidth,
          cart: inside(".stable-header [data-cart-open]"),
          search: inside(".stable-header [data-search-open]"),
          wishlist: inside(".stable-header .stable-wish-link"),
          cta: inside(".approved-hero .approved-outline"),
          /* The mobile header must expose real >=44x44 clickable rectangles,
             not just 21px SVG glyphs inside 28px buttons. */
          touchTargets: [...[
            [".stable-header [data-menu-open]", "menu"],
            [".stable-header [data-search-open]", "search"],
            [".stable-header .stable-wish-link", "wishlist"],
            [".stable-header [data-cart-open]", "bag"],
          ].map(([selector, label]) => {
            const element = document.querySelector(selector);
            if (!element) return { label, found: false, ok: false };
            const rectangle = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              label, found: true,
              width: Number(rectangle.width.toFixed(2)),
              height: Number(rectangle.height.toFixed(2)),
              left: Number(rectangle.left.toFixed(2)),
              right: Number(rectangle.right.toFixed(2)),
              visible: style.display !== "none" && style.visibility !== "hidden",
              ok: rectangle.width >= 43.5 && rectangle.height >= 43.5 &&
                  rectangle.left >= -0.5 && rectangle.right <= innerWidth + 0.5 &&
                  style.display !== "none" && style.visibility !== "hidden",
            };
          })],
          touch: innerWidth > 767 || [...[
            ".stable-header [data-menu-open]",
            ".stable-header [data-search-open]",
            ".stable-header .stable-wish-link",
            ".stable-header [data-cart-open]",
          ].map((selector) => document.querySelector(selector))]
            .every((element) => {
              if (!element) return false;
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width >= 43.5 && rect.height >= 43.5 &&
                rect.left >= -0.5 && rect.right <= innerWidth + 0.5 &&
                style.display !== "none" && style.visibility !== "hidden";
            }),
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
        !result.cart ||
        !result.search ||
        !result.wishlist ||
        !result.cta ||
        !result.touch ||
        result.badImages
      )
        throw Error("Layout failed");
      if ([375, 768, 1440].includes(width)) {
        for (const [section, selector] of [
          ["arrivals", ".approved-arrivals"],
          ["campaigns", ".approved-campaigns"],
          ["editorial", ".approved-editorial"],
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
