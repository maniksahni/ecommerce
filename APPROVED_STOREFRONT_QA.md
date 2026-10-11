# Approved Shivara storefront implementation

Source: `design-reference/shivara-approved/screenshots/approved-original.webp`, pulled from `origin/main` at `d4f5067`.

The previous local After Dark draft and its stash were removed. This implementation uses the approved package's composition and supplied image crops. No newly generated campaign artwork is included.

## Implementation
- Actual homepage now has the black/champagne frame, editorial serif headline, arched category room, New Arrivals, two campaigns, thin SVG service strip and editorial feature.
- Mobile has a dedicated portrait hero treatment, scrollable category/product rails, visible menu/search/wishlist/bag and five shopping actions at the bottom.
- Product cards, prices, availability, wishlist, cart, product/collection routes, admin, checkout and Firebase remain driven by the original storefront modules.
- Desktop and mobile campaigns link to existing collections. The hero links to all pieces. The editorial links to the existing brand story.
- Clothing categories and unsupported mockup shipping/exchange/certification claims are not introduced. The delivery strip retains 4–6 Business Days.
- Obsolete homepage exhibits are replaced by the approved composition; their product routes remain available.

## Verification
- `npm run build`: passed.
- `npm test`: catalogue, admin and security checks passed; catalogue has 114 curated products and no blocking errors; security checks 9/9.
- `npm run test:netlify`: passed, including generated routes for all 114 products.
- `npm run test:cart-matrix`: 82 checks passed at 11 viewports, including eight-item stress test and empty bag.
- Dedicated Chromium and WebKit layout checks passed at 320, 360, 375, 390, 430, 768, 1024, 1280 and 1440px: no page overflow; hero CTA, search, wishlist, bag and 44px header targets visible; no JavaScript exceptions.
- Full mobile suite: 502 checks passed, zero failures, including all 114 narrow-screen product pages, checkout controls, read-only admin tabs and product form opening/cancelling; results saved under `artifacts/approved-storefront/mobile/results.json`.

## Review assets
`artifacts/approved-storefront/index.html` contains approved-reference comparison and actual store screenshots. JSON responsive evidence is adjacent to the gallery. Actual storefront: http://localhost:3000.

## Remaining production limitation
The approved package explicitly labels its campaign crops as reference-resolution and requests clean, high-resolution production photography before deployment. The supplied crops include baked mockup lettering/graphics. HTML overlays and crop treatment improve the preview, but do not recover missing original image detail. These assets must be replaced with the corresponding clean originals for a final production release. No production deployment or remote push has been performed.
