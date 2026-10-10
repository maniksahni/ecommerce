# Light on Gold — review notes

The homepage uses existing product data, prices, facts and routes. Catalogue source files, checkout logic, Firebase configuration and SEO metadata were left unchanged. Best Sellers is a separate query filter; the current catalogue has no Best Seller tags, so its membership is awaiting the owner’s selection. No sales rankings were invented.

## Visual review

Captured the hero, bracelet story, category gallery, craft sequence, product deck, Shivara Edit, editorial cards and concierge at 375, 768 and 1440 px. Repeated the phone review in WebKit. Reviewed additional arrival, ring, brand, social, reassurance and footer panels. Screenshots are in artifacts/light-on-gold/ (generated review files are intentionally not shipped).

Corrections from review: restored light text on dark panels; removed legacy white card backgrounds; replaced editorial lifestyle placeholders with existing jewellery photographs; restored dark header contrast; reduced small-label contrast failures; removed legacy deck positioning and column auto-flow that clipped mobile cards; reduced the initial catalogue to eight cards and arrival/ring previews to four each; retained view-all journeys and all existing catalogue entries.

## Motion and accessibility

Tested normal motion and reduced motion. GSAP/ScrollTrigger loads after interaction, with pinning on large screens and an unpinned phone story. Lenis is restricted to pointer devices. Native scrolling remains the fallback. Lower-power devices omit heavy effects. The first-visit shimmer is under one second, does not cover the hero and is skipped on repeat visits. The trust marquee has a pause control. Header SVG decorations survive realtime rerenders. Focus states, keyboard controls and the sticky Shop/WhatsApp bar are present; the bar hides while commerce dialogs are open.

## Functional checks

Chromium: 375/768/1440 px. WebKit: 375 px. Each loaded eight cards, expanded to sixteen, and added a product to the existing cart; no page errors or horizontal document overflow. Also exercised search, mobile menu, Quick View, and preservation of the Best Sellers filter through sorting. Build verification and catalogue/route audits passed. Storefront consistency checks compare the local generated catalogue to its own fixture; realtime cloud records are isolated in that suite to avoid a 114-vs-113 catalogue race. Live browser checks retain the real cloud connection.

## Performance

Lighthouse mobile simulation on a compressed production build: performance 97, accessibility 100, LCP 2467 ms, CLS 0, TBT 100 ms. This is a lab measurement, not a guarantee for every device or connection. Hero uses responsive AVIF with WebP fallback and preload; other presentation images have responsive WebP variants. Display/UI fonts are hosted locally with swap, and the display font is subset. Production CSS and interface JS are minified; homepage CSS is inlined from showroom.css.

## Remaining verification

Physical iPhone Safari and a physical mid-range Android are not available to this automation. WebKit and Chromium viewport tests do not establish physical-device performance. Best Sellers membership needs the owner’s existing product names/SKUs before that filter can show a truthful selection.
