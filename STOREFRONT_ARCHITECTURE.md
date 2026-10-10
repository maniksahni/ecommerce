# Shivara Storefront Ownership

## Commerce Data

- `shop-data.js`: raw Instagram source and editorial media only. It is never a commerce renderer.
- `catalog-overrides.js`: manually curated product classification and verified business fields.
- `catalog-data.js`: builds and freezes the curated catalogue, then exposes `ShivaraCatalog`.
- `storefront-renderer.js`: the single product-card and product-page HTML renderer used by both Node and the browser.

## Runtime

- `server.js`: routes, metadata, canonical URLs, build stamps and server rendering from `ShivaraCatalog`.
- `script.js`: commerce state, collection filters/sorting, search, Quick View, cart and wishlist enhancement.
- `src/admin-session.js`: approved-account gate, protected server permission check and one credential refresh on rejected writes.
- Firestore is authoritative after the first snapshot. The shared catalogue replaces static records so additions, edits and deletions reach search, collections, product pages and cart.

## Styling

- `commerce-stable.css`: reset, typography, shared header/footer, product cards, collection pages, product pages and commerce overlays.
Unused legacy styles, motion bundles, Three.js and the duplicate homepage Firestore renderer have been removed.

Static Hosting rewrites `/products/**` to the product template for cloud-created products. Existing generated routes retain their server-rendered content and receive the same cloud updates.

`npm test` runs non-mutating catalogue, admin unit and source security checks. `npm run test:realtime` runs Chrome/WebKit with an isolated browser Firestore fixture; it creates no production orders. Live browser tests require explicit administrator environment credentials.

## Homepage Feature Gate

Production currently enables:

- Floating Atelier hero
- Category gallery
- Shivara Product Deck
- Curated catalogue grid
- Reassurance and footer

Most Wanted, product story, Evil Eye Orbit, Stacking Studio, Ring Constellation, Shop the Look and Watch & Shop remain implemented but disabled through `STOREFRONT_FEATURES` until the compact storefront is proven stable.
