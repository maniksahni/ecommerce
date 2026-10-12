# SHIVARA — Locked final screenshot reference (13 October 2026)

**Reference:** The user-uploaded 1448×1086 image of the ivory/champagne desktop storefront (left) and phone view (right). THIS IMAGE IS THE SOURCE OF TRUTH, not previous black After Dark mockups or the initial October 12 cream collage implementation.

**Locked brand tagline:** A Love Story in Every Design.

## Exact desired visual composition

### Desktop
1. Whole store is warm ivory, minimal champagne gold/bronze accents, dark espresso serif headings, airy backgrounds; NO black sections, NO fashion models.
2. Slim bronze delivery bar, then WHITE horizontal header. Large SHIVARA serif wordmark on left, compact collection links across centre, short search capsule, account, wishlist, and bag controls on right.
3. HERO is one continuous photographic jewellery **still life**, not four framed floating rectangular product tiles. Left 35–42% contains the short "MODERN JEWELLERY / FOR A BRIGHTER YOU" eyebrow, two-line hero tagline, small supporting copy, pill CTA. Right includes warm cream marble/stone plinths, necklace/heart pendant at upper left, sparkling ring near upper centre, striking blue-eye bracelet as the central foreground product, sculptural gold earrings on a short plinth at right, wrapped gold SHIVARA gift box at far right, ivory blossoms/ribbon. Photography should feel like one coherent shoot with the same light, perspective and shadows. Small brand-benefit pictograms appear at hero lower left. Navigation dots centred at bottom.
4. Five equal-width CIRCULAR category thumbnails: Earrings, Necklaces, Rings, Bracelets, Gift Sets. Labels beneath, and only real catalogue-derived category minimum prices.
5. New Arrivals contains FIVE compact cards in one row: photo, name, price, legitimate compare-price if available, wishlist button. Only real actual product pictures and catalogue-linked prices. Do not fabricate star ratings/review counts.
6. Three compact rectangular editorial cards side by side: "The Art of Meaningful Gifting", "Everyday Luxury" / bracelets, "Crafted for Every Chapter". Light cream, one product/gift composition each. No tall dark banners.

### Mobile phone
1. Slim bronze announcement strip and WHITE header: hamburger, centred SHIVARA, search, wishlist and visible BAG (previous user requires bag never clipped).
2. An approx 355–420 CSS-pixel-high cream hero: same two-line slogan near upper left, short paragraph and bronze CTA, main blue-eye bracelet dramatically staged across lower half. Artwork must not hide text.
3. 4–5 small circular category thumbnails across the screen, horizontally scrollable (no overflow or clipped text).
4. Two New Arrivals cards visible per row/carousel position, compact image, readable name+price.
5. First editorial gift banner immediately below arrivals; remaining cards accessible by scrolling.
6. Light ivory fixed mobile bottom dock with accessible shopping actions (keep current functional Bag).
7. No horizontal page overflow from 320px through 430px; header and cart touch targets at least 44px.

## Non-negotiable brand / commerce constraints
- Theme: #fffdf9 / warm champagne / gold, NOT black.
- Exact text: **A Love Story in Every Design**, with the same two-line hierarchy.
- Do not silently switch this user-approved screenshot to a different design direction.
- Do not publish invented jewellery/product names, unverified offers, material properties, waterproof claims, reviews or reference-screenshot prices as real catalogue facts.
- No product tiles containing unrelated Instagram Reel cover images.
- Do not alter checkout, prices, SKUs, inventory, customer accounts, admin or Firestore records as part of visual approval.
- Preserve 4–6 Business Days copy unless the business confirms another delivery promise.

## Blockers for a literal 101% pixel match
The attached image is a generated **composite**, not independent high-resolution original jewellery photography. CSS recreation with existing Instagram product stills can match *structure* but NOT literally replicate the photograph. Required for photograph-for-photograph fidelity: verified high-quality isolated photos of the **same sold products** arranged as the composite (or the owner's approval to use mockup art as purely illustrative editorial artwork), plus downloadable hero/campaign image assets. Never claim full pixel parity without those assets.

## Release gate
This PR is draft. Test a real local checkout with \`npm ci\`, \`npm test\`, \`npm run build\`, browser screenshots in Chromium+WebKit at 320,360,375,390,430,768,1024,1280,1440 CSS pixels. Visually compare desktop+phone side by side with the reference. Verify Firestore product image paths and restored assets are synchronized before overwriting Firebase Hosting. Get the owner's approval of actual screenshots, then merge and deploy Hosting. Verify the published build hash and UI; roll back on image/checkout breakage.
