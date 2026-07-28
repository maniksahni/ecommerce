# Shivara.luxe

A responsive website matched to the public Instagram profile [@shivara.luxe](https://www.instagram.com/shivara.luxe).

Production storefront: https://shivaraluxe.netlify.app

Netlify runs `npm run build:netlify` and publishes `dist`. The build creates
static product and collection routes from the curated catalogue, adds deployment
metadata, and preserves real 404 responses for invalid catalogue URLs.

The site uses the real profile positioning:

- Designed to be noticed
- Statement jewellery for everyday slay
- Iconic, custom, limited pieces
- DM to shop, PAN India
- WhatsApp ordering: +91-9457041215 / 7451995279
- Feed sections based on recent public reel covers and captions
- A custom Three.js jewellery motion section with gold rings and evil-eye beads
- Scroll reveal, hover depth, and mobile sticky order actions

## Run locally

```bash
node server.js
```

Then open `http://localhost:3000`.

## Deploy

This project is Railway-ready. Railway can run it with:

```bash
node server.js
```
