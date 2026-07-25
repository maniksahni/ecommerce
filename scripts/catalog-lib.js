const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const allowedCategories = new Set([
  "earrings",
  "necklaces",
  "pendants",
  "bracelets",
  "rings",
  "evil-eye",
  "anti-tarnish",
  "gifting",
  "sets",
  "watches",
  "other"
]);
const allowedPriceStatuses = new Set(["confirmed", "enquiry", "unavailable"]);
const allowedCollections = new Set([
  "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye",
  "anti-tarnish", "gifting", "sets", "watches", "new-arrivals", "other"
]);
const socialCtas = /\b(dm now|comment for|grab yours|coming soon|last chance|followed us|packaging|feminine urge|make her hands|life these days)\b/i;

function loadSourceData() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "shop-data.js"), "utf8"), sandbox);
  return sandbox.window.SHIVARA_SHOP_DATA;
}

function loadCatalog() {
  const source = loadSourceData();
  const overrides = require(path.join(root, "catalog-overrides.js"));
  const { build } = require(path.join(root, "catalog-data.js"));
  return { source, overrides, catalog: build(source, overrides) };
}

function duplicates(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

function validateProduct(product) {
  const errors = [];
  if (!product.id) errors.push("missing product ID");
  if (!product.slug) errors.push("missing slug");
  if (!product.title) errors.push("missing title");
  if ((product.title || "").length > 60) errors.push("title longer than 60 characters");
  if (socialCtas.test(product.title || "")) errors.push("social CTA phrase in title");
  if (!allowedCategories.has(product.category)) errors.push("missing or unsupported category");
  if (!allowedPriceStatuses.has(product.priceStatus)) errors.push("missing or invalid price status");
  if (product.priceStatus === "confirmed" && (!Number.isFinite(product.price) || product.price <= 0)) errors.push("invalid confirmed price");
  if (product.priceStatus !== "confirmed" && product.price !== null) errors.push("unconfirmed product has a numeric price");
  if (product.compareAtPrice !== null && (!Number.isFinite(product.compareAtPrice) || product.compareAtPrice <= product.price)) {
    errors.push("invalid compare-at price");
  }
  if (!Array.isArray(product.images) || !product.images.length) errors.push("missing image");
  (product.images || []).forEach((image) => {
    if (!fs.existsSync(path.join(root, image))) errors.push(`broken local image path: ${image}`);
  });
  if (new Set(product.images || []).size !== (product.images || []).length) errors.push("duplicate gallery image");
  if (!Array.isArray(product.variants)) errors.push("variants must be an array");
  (product.variants || []).forEach((variant) => {
    if (!variant.id || !variant.label || typeof variant.available !== "boolean") errors.push("unverified variant");
    if (variant.price != null && (!Number.isFinite(variant.price) || variant.price <= 0)) errors.push("invalid variant price");
  });
  if (product.optionsStatus === "none" && product.variants.length) errors.push("variants exist while options status is none");
  if (product.contentType !== "product" || product.isPurchasable !== true) errors.push("non-product exposed as purchasable");
  if (!Array.isArray(product.collections)) errors.push("collections must be an array");
  if ((product.collections || []).some((collection) => !allowedCollections.has(collection))) errors.push("product included in an unrelated collection");
  return errors;
}

module.exports = {
  allowedCategories,
  allowedCollections,
  duplicates,
  loadCatalog,
  root,
  socialCtas,
  validateProduct
};
