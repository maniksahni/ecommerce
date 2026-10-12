# SHIVARA — Final Cream & Gold Home (October 2026)

## User-approved creative direction
**Exact brand tagline:** A Love Story in Every Design

Source: final desktop + mobile image approved in the ChatGPT conversation. The screenshot is a VISUAL REFERENCE, not production HTML or a verified photo catalogue. This implementation does not turn a screenshot into a noninteractive background.

## Implementation
- Homepage: `index.html` using `approved-storefront` plus scoped `shivara-cream-final` class.
- New theme: `shivara-cream-final.css` (loaded *after* existing dark approved stylesheet).
- Real catalogue categories: `script.js` maps 5 category cards to existing product IDs and category paths.
- Production build: `scripts/netlify-build.js` copies the theme into `dist/`.
- Real product photos are linked from existing `assets/instagram-shop` items; no fabricated product image, item name, claim or price is used in the hero.
- New Arrivals and the main product grid keep existing Shopify-like client logic (ShivaraCatalog, live Firestore overlays, cart, wishlist, products, checkout, admin). Price/name/image on product CARDS are produced by the existing renderer, not by the mockup.

## Visual design tokens
Ivory #fffdf9; powder cream #f5ede2; champagne #eee1cf; warm metallic gold #b48a52; burnished bronze #805f3a; espresso ink #2e2119; soft borders #e4d5bf. Cormorant Garamond display + DM Sans UI.

## Photo identity and product QA
- Hero: `boxed-blue-evil-eye-bracelet`, `cluster-gift-ring`, `minimal-heart-pendant`, `bow-love-earrings`, all real current source IDs.
- Editorial/gifting links use real paths; category counts are dynamically rendered.
- The hero uses multiple product-photography tiles rather than the mockup’s imaginary CGI jewellery.
- Image restoration that has only happened on a local machine must be committed separately before claiming live parity. Verify images in `assets/` exist, load, and match the item.
- Promotions, reviews, discounts and certifications must reflect live approved commercial data rather than numbers shown in an AI mockup.
- Preserve original **4–6 Business Days** delivery wording; do not introduce unconfirmed service promises.

## Pre-deploy checklist
1. `npm ci && npm run test:cream && npm test && npm run test:mobile && npm run test:approved && npm run build`
2. Open responsive screenshots in Chromium and WebKit at 320/360/375/390/430/768/1024/1280/1440.
3. Confirm header cart/search/wishlist icons never clip, bottom dock is accessible, hero CTA fully visible.
4. Confirm all hero and catalogue image requests return 200 and the object shown is the correct actual product.
5. Check product page, filters, search, wishlist, cart, price, coupon, inventory and checkout flows.
6. Compare desktop + mobile against approved screenshot. Visual match is *approximate* where the approved mockup depicts photography not present in actual catalog.
7. Deploy Firebase Hosting from authenticated project terminal: `npx firebase-tools deploy --only hosting --project the-shivara-group-86c9c`.
8. Verify hosted build hash, page 200 status, and manual device QA.

## Rollback
Remove `shivara-cream-final` from the homepage body and remove theme stylesheet import, or revert this commit. Existing `approved-storefront.css` remains untouched.
