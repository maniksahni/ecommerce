# Product photo and duplicate cleanup

Reviewed all 114 original catalogue primary photos, and compared cloud primary photos with them. The only different cloud upload was the Blue White Pebble Ring; it is a matching product photo. Removed seven visually confirmed duplicate cloud product records after saving a local backup in ignored `artifacts/catalog-photo-audit/cloud-products-backup.json`.

| Removed duplicate | Retained product |
| --- | --- |
| Boxed Blue Evil Eye Bracelet | Boxed Evil Eye Bracelet |
| Butterfly Drop Necklace | Crystal Butterfly Drop Necklace |
| Green Butterfly Earrings | Mint Butterfly Earrings |
| Cherry Charm Pendant | Cherry Drop Pendant |
| Floral Statement Ring | Black Floral Cluster Ring |
| Green AD Jewellery Set | Pastel Crystal Bracelet Set |
| Snake Chain Watch | Green Coil Watch |

The retained listings use clearer product photographs. Different designs, colours and bundles were retained. Static and cloud catalogue access both exclude the duplicate slugs. Old product slugs and Instagram source IDs redirect to their retained product URLs. Existing cart entries migrate to canonical product IDs and combine quantities; wishlist IDs migrate too.

Watch & Buy uses only actual catalogue product photos with an existing matching Instagram post/reel URL. Clicking the photo opens that Instagram URL; product-title, quick-view and bag controls retain their storefront behavior. Listings without an Instagram URL are excluded from this section rather than sent to an unrelated reel. The social photo gallery also uses catalogue photos.

Local verification: catalogue/admin/security tests, Chromium/WebKit mobile/desktop image-link and overflow checks, seven old URL redirects, and old-cart quantity migration passed. Screenshots are saved under ignored `artifacts/catalog-photo-audit/`.

Final validation: full mobile suite passed 488 checks with zero failures against the cleaned cloud catalogue. Realtime suite passed 32 Chromium/WebKit commerce checks. Static build verification passed for 107 products. The live catalogue has 106 records because one original static listing was already absent before this cleanup.
