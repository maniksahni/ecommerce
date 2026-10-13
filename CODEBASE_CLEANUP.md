# Codebase cleanup audit

Scope: 342 tracked project files were inventoried; 86 text/configuration files (40,424 lines before cleanup) were indexed for references and code/data checks. Third-party `node_modules`, generated `dist`, ignored QA artifacts, credentials and production data are outside the removal scope. This is a reference, syntax, runtime and visual audit; it is not a claim that every possible execution path has been formally proved safe.

## Removed

- Retired homepage product deck, hero carousel and signature slider renderers, timers, state and calls. Their DOM mounts no longer exist in the current storefront.
- Obsolete banner hero-selector patches. Live announcements remain subscribed.
- Duplicate homepage SVG icon renderer and its MutationObserver (`approved-storefront.js`). Shared header/dock markup renders those icons once, preserving homepage labels and badges.
- 450 shared-CSS selector branches requiring classes absent from current runtime HTML/JavaScript, plus five unreferenced keyframe definitions. Shared CSS shrank from 176,958 to 127,479 bytes.
- 34 admin-CSS selector branches covering 23 absent classes, including retired header rows, form wrappers, loading skeletons and image-upload layout. Dynamically generated `status-select--*` classes remain.
- Uncalled `canAddDirectly`, server price-markup/currency helpers, admin `loadProducts` wrapper, and the unused non-transactional `syncOrderToFirestore` helper/export. Atomic checkout transaction handling remains.
- Stale `pnpm-lock.yaml` (it lacked the actual Firebase dependencies); npm/package-lock is the installation source of truth.
- Copying a nonexistent `vendor` directory during static builds.
- Homepage selection calculations for product-section mounts that no longer exist.

## Supporting fixes

- Docker packaging now includes the current approved stylesheet and product discovery script referenced by the homepage.
- Static build QA verifies linked homepage scripts/styles actually exist in the release.
- Existing mobile QA supports `QA_ISOLATED=1` on localhost only. Firebase data/auth imports are served from test fixtures, and production Firestore/Auth endpoints are blocked. No production credentials are required. This fixture mode verifies layouts and workflows, not real Firebase authorization.
- README and ownership documentation describe the current storefront rather than nonexistent feature gates.

## Preserved deliberately

Catalogue products/prices/media, duplicate redirects, cart/checkout and stock guards, account/admin security, Firestore synchronization, database files, Firebase SDK versions/override, deployment/security rules, approved design references and standalone QA tools remain. A standalone executable test is not unused simply because production does not import it. Assets referenced through catalogue/cloud records cannot be deleted based on CSS coverage alone. CSS generated dynamically or scoped to interactive states is retained unless its required class is demonstrably absent.

## Verification

- All 47 remaining JavaScript entry files and three inline script blocks passed syntax checks; nine JSON files parsed.
- `npm test`: catalogue/admin/security suites pass.
- `npm run test:netlify`: 107 products, generated routes and linked release assets pass.
- `npm audit --omit=dev`: zero reported vulnerabilities.
- Chrome/WebKit isolated realtime commerce: 32 checks passed.
- Isolated full mobile suite: 490 checks passed, zero failures; all catalogue details, 11 screen sizes, nine admin tabs and product forms.
- 27 storefront before/after screenshots: 23 exactly identical; the remaining four differ by only 4–41 pixels, with at most two RGB levels of rendering noise. No geometry differences observed.
- Admin settled comparison: 650 visible elements have identical computed styles, and the screenshot is pixel-identical. Earlier animated screenshots were replaced with a settled comparison to distinguish animation timing from CSS changes.
- New fixture integration checked in both Chromium and WebKit: authentication gate, all nine admin tabs and product form.
- A fresh Node server starts and serves homepage, collection, product, wishlist, admin and current assets successfully.

QA inventory, selector lists, screenshots and detailed results are in ignored `artifacts/codebase-cleanup/`. No production database writes or deployment were performed for this cleanup.

Reproduce isolated mobile checks with the local server running:

```bash
QA_ISOLATED=1 MOBILE_BASE_URL=http://localhost:3000 npm run test:mobile
```
