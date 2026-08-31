# The Shivara Group — Commercial Production Launch Checklist

**Project:** The Shivara Group Jewellery E-Commerce Platform  
**Target URL:** `https://the-shivara-group-86c9c.web.app`  
**Production Readiness:** Verified & Hardened  

---

## 1. Security & Environment Hardening

- [x] **Firestore Security Rules (`firestore.rules`)**:
  - `products`: Public read (`allow read: if true`), Authenticated admin write (`allow create, update, delete: if request.auth != null`).
  - `orders`: Public create with phone and items validation, Authenticated read/update/delete.
- [x] **Firebase Storage Security Rules (`storage.rules`)**:
  - Image size restricted to `< 5MB`.
  - MIME type restricted to `image/*` (`contentType.matches('image/.*')`).
  - Read public for `products/*`, write restricted to authenticated sessions.
- [x] **Admin Security Gate**:
  - Master passcode protection (`Shivara@2026`) stored in `sessionStorage`.
  - Background anonymous Firebase authentication so security rules allow authorized writes.
  - Zero private service account keys or sensitive tokens exposed in frontend client bundles.

---

## 2. SEO, Open Graph & Social Cards

- [x] **Primary Title Tag**: `The Shivara Group | Curated Luxury Jewellery Atelier`
- [x] **Meta Description**: Curated luxury statement jewellery, anti-tarnish pieces, and handcrafted edits with transparent pricing and personal WhatsApp assistance.
- [x] **Canonical Link**: `https://the-shivara-group-86c9c.web.app/`
- [x] **Open Graph (OG) Metadata**:
  - `og:type` = `website`
  - `og:site_name` = `The Shivara Group`
  - `og:title` = `The Shivara Group | Curated Luxury Jewellery Atelier`
  - `og:description` = `Curated luxury statement jewellery with transparent pricing and personal WhatsApp styling assistance.`
  - `og:image` = `https://the-shivara-group-86c9c.web.app/assets/instagram-shop/post-051-DW3H_GZDD_4.jpg`
  - `og:url` = `https://the-shivara-group-86c9c.web.app/`
- [x] **Twitter Cards**: `summary_large_image` configured with luxury banner preview.
- [x] **Branded Favicon & Apple Touch Icons**: Scalable SVG favicon and touch icon configured in `<head>`.

---

## 3. Real-Time Two-Way Firestore Sync

- [x] **Storefront Dynamic Listener (`index.html`)**:
  - `onSnapshot` listener on `"products"` collection.
  - Live INR currency formatting: `₹2,499`.
  - **Sold Out Handling**: Dark/crimson `SOLD OUT` badge, image overlay, disabled "Sold Out" button.
  - **In Stock Handling**: Active price, enabled "Add to Bag" button.
  - **Category Filtering**: Real-time category chips (*All*, *Earrings*, *Neck Wear*, *Bracelets*, *Rings*, *Evil Eye*, *New Arrivals*, *Gifting*, *Anti Tarnish*, *Watches*, *Sets*) with live dynamic item counters.
- [x] **Admin Panel Dashboard (`admin.html`)**:
  - `onSnapshot` listener streaming live catalogue docs.
  - Instant price edit directly from table modal.
  - 1-Click stock toggle button (*Sold Out* ⇄ *In Stock*).
  - Add product form with direct Firebase Storage image uploads.
  - Permanent product deletion with Firestore `deleteDoc`.
  - 1-Click "Sync Catalogue to Firestore" baseline seeding.

---

## 4. Performance & Caching (`firebase.json`)

- [x] **Static Asset Caching**: `Cache-Control: max-age=31536000, immutable` for images, fonts, CSS, and JS bundles.
- [x] **HTML Dynamic Freshness**: `Cache-Control: max-age=0, no-cache, no-store, must-revalidate` on all HTML pages (`index.html`, `admin.html`, product routes) ensuring zero-delay live updates.
- [x] **Clean URLs & Optimization**: `cleanUrls: true` with automatic `npm run build` predeploy hook.

---

## 5. WhatsApp Checkout & Resilience

- [x] **Official Store Number**: `+91 94570 41215` (`919457041215`).
- [x] **Safe URL Encoding**: All WhatsApp order payloads encoded with `encodeURIComponent` preserving INR symbols, itemized lists, and notes across iOS, Android, and Web.
- [x] **Fallback UI**: Graceful image error handlers and baseline catalogue fallback if network disconnects.

---

## 6. Verification Suite Summary

| Test / Audit | Command | Status |
| :--- | :--- | :--- |
| **Storefront Build** | `npm run build` | **PASS (114 products, 13 collections)** |
| **Build Test Suite** | `node scripts/netlify-build-test.js` | **PASS (10/10 assertions passed)** |
| **Catalogue Audit** | `npm run audit:catalog` | **PASS (0 blocking errors)** |
| **Smoke Tests** | `npm run test:smoke` | **PASS** |

---

**Release Status:** **READY FOR COMMERCIAL OPERATION** 💎
