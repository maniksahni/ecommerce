# The Shivara Group | Curated Luxury Jewellery

A responsive, high-performance e-commerce platform and atelier matched to [@shivara.luxe](https://www.instagram.com/shivara.luxe).

Production storefront: https://the-shivara-group-86c9c.web.app
Executive Admin: https://the-shivara-group-86c9c.web.app/admin

The build compiles static product and collection routes from the curated catalogue, applies real-time Firestore synchronization, and supports responsive storefront and admin layouts. Browser layout and workflow checks are documented with their tested viewports; they do not guarantee every physical device.

The site uses the real profile positioning:

- Designed to be noticed
- Statement jewellery for everyday slay
- Iconic, custom, limited pieces
- Direct online storefront with PAN India express delivery
- Feed sections based on recent public reel covers and captions
- Scroll reveal, hover depth, and mobile sticky order actions

## Run locally

```bash
node server.js
```

Then open `http://localhost:3000`.

## Deploy

Firebase Hosting serves the built storefront; Firestore and Firebase Auth provide live catalogue and admin access.

```bash
npm run build
firebase deploy --only hosting,firestore:rules --project the-shivara-group-86c9c
```

## Verification

`npm test` runs the catalogue audit, 1,020 admin unit scenarios and source security checks without resetting live inventory. For isolated Chrome/WebKit commerce tests, start the local server on port 3259 and run `npm run test:realtime`.

Live QA scripts require `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. `scripts/test-live-product-matrix.cjs` runs 15 UI cycles per browser and deletes its temporary products. `QA_EDGE_CASES=1` additionally verifies photo gallery preservation and an atomic restock from zero quantity. `scripts/test-live-order.cjs` creates a QA COD order, verifies OMS/tracking/customer aggregation, and removes its records. Screenshots and results go to the ignored `artifacts/` directory.

Photos selected from the device are compressed before being saved in Firestore. The unused Firebase Storage SDK and retired motion/3D bundles have been removed.
