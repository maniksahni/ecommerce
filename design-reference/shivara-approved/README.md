# SHIVARA — Final Approved Visual Design Reference

**Design status:** Approved visual reference. **Production status:** NOT IMPLEMENTED OR DEPLOYED.

Open [the approved screenshot](screenshots/approved-original.webp) and [the standalone visual reference](index.html). Follow [implementation requirements](CODEX_README.md).

The black/champagne/gold cinematic jewellery design in the screenshot is the **source of truth**. The earlier light/beige After Dark theme was rejected. This folder is isolated from the live storefront: it does not alter the existing homepage, Firestore, cart, catalog, admin or deployment.

## For Codex

Integrate this design into the existing `/index.html`, `commerce-stable.css`, `script.js`, `storefront-renderer.js` etc **without replacing working store features with demo code**. Use real catalogue inventory and approved business claims, preserving the existing **4–6 Business Days** wording. Treat all screenshot prices and product names as illustrative, not live data. Verify 320, 360, 375, 390, 430, 768, 1024, 1280, and 1440 px viewports; mobile header and cart should never clip. Before merging, show mobile/desktop actual store screenshots and functionality tests.

## Files

- `screenshots/approved-original.webp` — approved design, high-fidelity compressed WebP copy. The original PNG is retained in the ChatGPT project conversation.
- `screenshots/reference-preview-1440.webp` — standalone prototype render (NOT the approved screenshot).
- `index.html`, `styles.css`, `preview.js` — prototype layout references; not production checkout code.
- `assets/*.webp` — cropped imagery from the approved concept (reference resolution only, not suitable for retail production photography).
- `CODEX_README.md` — detailed design and QA acceptance criteria.
- `qa_preview.py` — prototype-level preview checks, not live commerce tests.
