# Admin verification — 10 October 2026

The Firebase production admin was repaired and tested against project the-shivara-group-86c9c.

- 1,000 isolated product scenarios and 6 targeted regression checks pass using actual admin controllers and a mocked Firestore persistence layer. These are not 1,000 live cloud writes.
- Authenticated browser checks against real Firestore verify New Product, full edit (title, SKU, price, compare-at price and description), quick price update, sold-out/in-stock round trip, reload persistence and deletion.
- All nine admin tabs render and a 390px mobile viewport has no horizontal overflow or page exceptions.
- Temporary QA products are removed after verification.
- Build/route verification and production security checks pass.

Run `npm run test:admin` for isolated tests. To verify production, set ADMIN_EMAIL and ADMIN_PASSWORD in the environment, optionally CHROME_PATH, then run `npm run test:admin:live`. The live test creates and removes one temporary sold-out product; it briefly toggles that fixture in stock to verify both stock states.

Fixes restore the missing price modal close controller, grant the specified admin email write permission through the existing allowlist, preserve authoritative cloud IDs, keep intentional deletions from triggering baseline reseeding, prevent simultaneous saves and stock updates, wait for write acknowledgement before changing visible price/stock, retain product URLs during edits, and persist SKU/compare-at price. Dashboard statistics are simpler and use two columns on mobile.

Production hosting is deployed by preserving the existing hosting file manifest/configuration and replacing both admin routes, so newer storefront content is retained. The repository's build also generates both admin routes. Firestore rules are deployed to the same project.
