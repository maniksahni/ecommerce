# Production Dockerfile for Shivara Commerce API (Cloud Run)
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source files
COPY server.js ./
COPY server-firebase.js ./
COPY admin-store.js ./
COPY storefront-renderer.js ./
COPY shop-data.js ./
COPY catalog-data.js ./
COPY catalog-overrides.js ./
COPY catalog-supplement.js ./
COPY scripts/catalog-lib.js ./scripts/
COPY admin-inventory.json ./
COPY admin-orders.json ./
COPY admin-products.json ./
COPY admin.html ./
COPY index.html ./
COPY product.html ./
COPY order-confirmation.html ./
COPY track-order.html ./
COPY collections ./collections
COPY wishlist ./wishlist

EXPOSE 8080

CMD ["node", "server.js"]
