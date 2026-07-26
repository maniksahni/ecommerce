# Shivara Storefront Ownership

## Commerce Data

- `shop-data.js`: raw Instagram source and editorial media only. It is never a commerce renderer.
- `catalog-overrides.js`: manually curated product classification and verified business fields.
- `catalog-data.js`: builds and freezes the curated catalogue, then exposes `ShivaraCatalog`.
- `storefront-renderer.js`: the single product-card and product-page HTML renderer used by both Node and the browser.

## Runtime

- `server.js`: routes, metadata, canonical URLs, build stamps and server rendering from `ShivaraCatalog`.
- `script.js`: commerce state, collection filters/sorting, search, Quick View, cart and wishlist enhancement.
- `experience.js`: homepage-only hero, category gallery and product deck.
- `motion-controller.js`: homepage performance tier, reduced-motion and animation lifecycle.

## Styling

- `commerce-stable.css`: reset, typography, shared header/footer, product cards, collection pages, product pages and commerce overlays.
- `phase-b.css`: homepage signature experiences only.

The older `styles.css`, `storefront-v2.css`, `atelier.css` and `motion.js` files are retained as historical source but are not loaded by production pages.

## Homepage Feature Gate

Production currently enables:

- Floating Atelier hero
- Category gallery
- Shivara Product Deck
- Curated catalogue grid
- Reassurance and footer

Most Wanted, product story, Evil Eye Orbit, Stacking Studio, Ring Constellation, Shop the Look and Watch & Shop remain implemented but disabled through `STOREFRONT_FEATURES` until the compact storefront is proven stable.
