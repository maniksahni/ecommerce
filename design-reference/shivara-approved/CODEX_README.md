# SHIVARA — APPROVED DESIGN: executable visual reference

## What is in this package
- `screenshots/approved-original.webp`: the user's FINAL APPROVED screenshot (desktop mockup + mobile mockup).
- `index.html`, `styles.css`, `preview.js`: self-contained visual/layout **reference**, tested in a browser.
- `assets/*.webp`: image crops taken from **the user's own approved concept screenshot**, not from third-party jewellery vendors.

## Priority / design fidelity
**The original screenshot is the visual ground truth.** `index.html` is the implementation guide if details are unclear. Do not use the rejected earlier “After Dark” white/beige design. Do not swap the look for a minimalist template. Do not simply add a CSS coat over the previous homepage; build the composition.

### Desktop target
- Full-bleed black background in bordered gold frame with champagne announcement strip.
- Black horizontal nav: cream SHIVARA wordmark, actual shop category links, search/account/wishlist/cart.
- Portrait-led cinematic hero, EXACT headline `JEWELLERY THAT LIVES BEYOND TRENDS` on the left, CTA, gold details and 01/02/03 vertical index.
- 6 tall arched category images (jewellery, cord sets, sarees, anarkali, lehengas, gifts).
- 2 wide campaign panels (New Arrivals and Festive Edit).
- Thin icon-based service strip, editorial image with `TRADITION MEETS TOMORROW`.
- Do not invent shipping benefits, payments, material certifications, prices, or clothing inventory. Populate sections only with items/copy verified in the real store.

### Mobile target
- Header in one visible row (menu, centred SHIVARA, search, wishlist, cart): **cart NEVER clipped**.
- Full-width portrait hero; headline overlays image and CTA stays fully visible.
- Category rail horizontally scrollable with no page-level x-overflow, card labels visible.
- New Arrivals product cards show image, name, real price and working add-to-cart.
- 5 visible fixed bottom navigation actions: Home, Categories, Search, Wishlist, Cart; safe area respected.
- All touch targets at least 44px in production. Nav icons never collide with wordmark at 320px.

## INTEGRATE INTO REAL REPO (`maniksahni/ecommerce`)
Actual storefront uses `index.html`, `commerce-stable.css`, `script.js`, `storefront-renderer.js`, shop/catalogue scripts, Firebase, and a dynamic `#shared-header` / `#shared-footer`. **Do not replace the repo `index.html` with this standalone prototype or else shopping will break.** Instead, refactor the existing homepage markup and CSS carefully and wire visual cards to existing verified routes/cart state.

- Preserve current `4–6 Business Days` wording and existing legitimate policies.
- Keep catalogue/product routes/cart/checkout/wishlist/admin/security/Firestore.
- Keep product price, availability and images *driven by existing catalogue*.
- Preserve handling of any sold-out variants.
- Do not show mockup prices as real prices.
- For media, use the files in `assets/` as reference/proposed campaign art; replace low-resolution crops with rights-cleared, high-resolution production photography before deployment. Reference crops are **not production-resolution assets**.
- Do not merge/deploy until desktop and mobile screenshots reviewed and approved.

## QA/Acceptance
Run `npm run build`, `npm test`, `npm run test:mobile`, `npm run test:cart-matrix`, plus relevant ecommerce browser flows. For real production page take screenshots at widths 320, 360, 375, 390, 430, 768, 1024, 1280, 1440. Check for:
- `document.documentElement.scrollWidth <= window.innerWidth` (except horizontal inner card rails), including open menu/cart.
- Header logo, bag, search icons all visible and tappable.
- Headline readable and CTA fully within viewport.
- Product labels, prices, add-to-cart buttons and imagery never clipped.
- Sticky bottom nav remains on screen and does not cover last item (padding-bottom with safe-area inset).
- Keyboard focus states, images with alt, motion-reduction preference, loading behavior.
- Place screenshots side by side with `screenshots/approved-original.webp` and resolve discrepancies before requesting approval.

## Note
This is a **visual reference prototype**, not a production rebuild. Its interactive bag is intentionally local/demo only, and it contains no actual prices, real checkout, or backend writes.
