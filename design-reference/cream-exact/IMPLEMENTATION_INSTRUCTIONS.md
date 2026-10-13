# SHIVARA — EXACT VISUAL REFERENCE PACKAGE

This package is based **only** on the user's repeatedly approved image `reference/original-desktop-and-mobile.png`. No alternative design direction is allowed.

## Use the real art, not hand-drawn substitutes
The approved screenshot has one **continuous hero photography scene**. Do not recreate it using four photographs with arbitrary dark frames, CSS gold boxes, fake white marble shapes, giant floating cards, or mismatched lighting. The asset `assets/shivara-final/hero-still-life.webp` is cropped from the same **approved screenshot**, and preserves its photogenic bracelet, necklace, ring, earrings, gift box, cream props, flowers and lighting.

### How to apply to GitHub PR #5 (`design/shivara-approved-screenshot-match`)
1. Copy `assets/shivara-final/hero-still-life.webp` into the repository at the **same path**. Git must track it (`git add assets/shivara-final/hero-still-life.webp`).
2. Copy `shivara_exact_artwork_patch.css` into the repository root.
3. In `index.html`, load the new CSS *after* `/shivara-reference-match.css?v=2`:
   `<link rel="stylesheet" href="/shivara_exact_artwork_patch.css?v=1">`
4. In `scripts/netlify-build.js`, add `"shivara_exact_artwork_patch.css"` to the `publicFiles` array.
5. `VISUAL_BENCHMARK_ONLY.html` shows the exact accepted desktop/mobile art; it is NOT a functioning shop and MUST NOT replace actual store HTML.
6. In browsers at 320/360/375/390/430 and desktop 1024/1440, screenshot the **real new webpage** and show side-by-side with desktop/mobile visual reference. Refine sizes and other sections until approved.
7. Keep product/price cards connected to real Shivara catalogue. The hero artwork is *illustrative brand artwork*: AI-synthesized items shown in the original user-approved concept are not automatically sellable inventory. Do not link its composite jewellery to different SKUs or portray as actual product detail photography.
8. Preserve header search, bag, wishlist, categories, cart, checkout, Firestore and admin behavior. No fake review counts, verified material properties, or price promos without evidence.
9. Verify the 25 reported local-only restored products are synchronized with GitHub *before* Firebase Hosting deployment. Do not overwrite those assets.
10. Only then merge, deploy `npx firebase-tools deploy --only hosting --project the-shivara-group-86c9c`, and verify live visuals and every image request.

## Why exact image equality does not automatically equal dynamic webpage equality
This screenshot contains baked photography, lettering, stylized jewellery and simulated app elements; real HTML and real products cannot be 101% pixel-identical at every viewport without the separate original art/font/product resources. This package **locks the exact visual composition** rather than claiming an untested implementation is perfect.
