const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "admin-products.json");
const allowedCategories = new Set([
  "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye",
  "anti-tarnish", "gifting", "sets", "watches", "other"
]);
const allowedCollections = new Set([
  "earrings", "necklaces", "pendants", "bracelets", "rings", "evil-eye",
  "anti-tarnish", "gifting", "sets", "watches", "new-arrivals", "other"
]);

function emptyStore() {
  return { products: [], deleted: [] };
}

function loadAdminStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(raw)) return { products: raw, deleted: [] };
    return {
      products: Array.isArray(raw.products) ? raw.products : [],
      deleted: Array.isArray(raw.deleted) ? raw.deleted : []
    };
  } catch {
    return emptyStore();
  }
}

function saveAdminStore(store) {
  const payload = {
    products: Array.isArray(store.products) ? store.products : [],
    deleted: Array.isArray(store.deleted) ? [...new Set(store.deleted.map(String))] : []
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

function adminStoreMtime() {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isRemoteMedia(src) {
  return /^(https?:)?\/\//i.test(String(src || "")) || String(src || "").startsWith("data:");
}

function normalizeAdminProductInput(body, { existingSlugs = new Set() } = {}) {
  const title = String(body?.title || "").trim();
  const slug = slugify(body?.slug || title);
  const category = String(body?.category || "").trim();
  const imageUrl = String(body?.imageUrl || (Array.isArray(body?.images) ? body.images[0] : "") || "").trim();
  const priceStatus = body?.priceStatus === "confirmed" ? "confirmed" : "enquiry";
  const price = priceStatus === "confirmed" ? Number(body?.price) : null;
  const compareAtPrice = priceStatus === "confirmed" && body?.compareAtPrice ? Number(body.compareAtPrice) : null;
  const collections = [...new Set((Array.isArray(body?.collections) ? body.collections : [])
    .map(String)
    .filter((value) => allowedCollections.has(value)))];

  if (!title) return { error: "Title is required" };
  if (title.length > 60) return { error: "Title must be 60 characters or fewer" };
  if (!slug) return { error: "A valid slug is required" };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Slug may only contain lowercase letters, numbers and hyphens" };
  if (existingSlugs.has(slug)) return { error: "A product with this slug already exists" };
  if (!allowedCategories.has(category)) return { error: "Select a valid category" };
  if (!imageUrl) return { error: "Image URL is required" };
  if (!isRemoteMedia(imageUrl) && !imageUrl.startsWith("assets/")) return { error: "Image must be a public http(s) URL" };
  if (priceStatus === "confirmed" && (!Number.isFinite(price) || price <= 0)) return { error: "Enter a valid price" };
  if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
    return { error: "Compare-at price must be higher than the selling price" };
  }

  if (!collections.includes(category)) collections.unshift(category);
  if (!collections.includes("new-arrivals")) collections.push("new-arrivals");

  const sku = String(body?.sku || "").trim() || `SHV-ADM-${slug.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  return {
    product: {
      sourcePostId: `admin-${slug}`,
      sourceType: "admin",
      slug,
      sku,
      title,
      category,
      collections,
      price: priceStatus === "confirmed" ? price : null,
      compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : null,
      currency: "INR",
      priceStatus,
      offerText: String(body?.offerText || "").trim() || null,
      badge: "New",
      optionsStatus: "none",
      variants: [],
      images: [imageUrl],
      videos: [],
      imageAlt: String(body?.imageAlt || title).trim(),
      description: String(body?.description || "").trim(),
      createdAt,
      _source: "admin"
    }
  };
}

module.exports = {
  adminStoreMtime,
  allowedCategories,
  file,
  isRemoteMedia,
  loadAdminStore,
  normalizeAdminProductInput,
  saveAdminStore,
  slugify
};
