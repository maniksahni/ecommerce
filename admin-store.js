const fs = require("node:fs");
const path = require("node:path");

const dataDirectory = process.env.ADMIN_DATA_DIR || (fs.existsSync("/data") ? "/data" : __dirname);
const file = path.join(dataDirectory, "admin-products.json");
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
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
  const priceStatus = "confirmed";
  const price = Number.isFinite(Number(body?.price)) && Number(body?.price) > 0 ? Number(body.price) : 499;
  const compareAtPrice = body?.compareAtPrice && Number(body.compareAtPrice) > price ? Number(body.compareAtPrice) : null;
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

const ordersFile = path.join(dataDirectory, "admin-orders.json");

function loadAdminOrdersStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    return Array.isArray(raw) ? raw : (raw.orders || []);
  } catch {
    return [];
  }
}

function saveAdminOrdersStore(orders) {
  const payload = Array.isArray(orders) ? orders : [];
  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
  fs.writeFileSync(ordersFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return payload;
}

function normalizeAdminOrderInput(body) {
  const orderId = String(body?.orderId || `SHV-${Math.floor(10000 + Math.random() * 90000)}`).trim();
  const customerName = String(body?.customerName || body?.name || "").trim();
  const customerPhone = String(body?.customerPhone || body?.phone || "").trim();
  const shippingAddress = String(body?.shippingAddress || body?.address || "").trim();
  const pincode = String(body?.pincode || "").trim();
  const items = Array.isArray(body?.items) ? body.items : [];
  const totalAmount = Number(body?.totalAmount) || 0;
  const status = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(body?.status) ? body.status : "Pending";

  if (!customerName) return { error: "Customer name is required" };
  if (!customerPhone) return { error: "Customer phone is required" };
  if (!shippingAddress) return { error: "Shipping address is required" };
  if (!items.length) return { error: "Order must contain at least one item" };

  return {
    order: {
      orderId,
      customerName,
      customerPhone,
      customerEmail: String(body?.customerEmail || body?.email || "").trim(),
      shippingAddress,
      pincode,
      city: String(body?.city || "").trim(),
      state: String(body?.state || "").trim(),
      orderNote: String(body?.orderNote || "").trim(),
      items,
      totalAmount,
      discountAmount: Number(body?.discountAmount) || 0,
      appliedCoupon: String(body?.appliedCoupon || "").trim() || null,
      paymentMethod: String(body?.paymentMethod || "COD").trim(),
      trackingNumber: String(body?.trackingNumber || "").trim() || null,
      courierPartner: String(body?.courierPartner || "Delhivery Express").trim(),
      status,
      createdAt: body?.createdAt || new Date().toISOString()
    }
  };
}

const couponsFile = path.join(dataDirectory, "admin-coupons.json");

const defaultCoupons = [
  {
    code: "WELCOME10",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 499,
    maxDiscount: 500,
    description: "10% off on your first luxury jewellery order",
    isActive: true,
    usageCount: 18,
    expiresAt: "2027-12-31T23:59:59Z"
  },
  {
    code: "LUXE15",
    discountType: "percent",
    discountValue: 15,
    minOrderValue: 1499,
    maxDiscount: 1000,
    description: "15% off on orders above ₹1,499",
    isActive: true,
    usageCount: 7,
    expiresAt: "2027-12-31T23:59:59Z"
  },
  {
    code: "SHIVARA500",
    discountType: "flat",
    discountValue: 500,
    minOrderValue: 2499,
    maxDiscount: 500,
    description: "Flat ₹500 off on festive collection orders above ₹2,499",
    isActive: true,
    usageCount: 4,
    expiresAt: "2027-12-31T23:59:59Z"
  }
];

function loadAdminCouponsStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(couponsFile, "utf8"));
    return Array.isArray(raw) ? raw : defaultCoupons;
  } catch {
    return defaultCoupons;
  }
}

function saveAdminCouponsStore(coupons) {
  const payload = Array.isArray(coupons) ? coupons : [];
  fs.mkdirSync(path.dirname(couponsFile), { recursive: true });
  fs.writeFileSync(couponsFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return payload;
}

const bannersFile = path.join(dataDirectory, "admin-banners.json");

const defaultBanners = {
  announcements: [
    "PAN India complimentary express shipping on all orders",
    "Handcrafted 18K gold-plated anti-tarnish statement edits",
    "Direct luxury concierge support: +91 94570 41215"
  ],
  marqueeText: "CURATED LUXERY JEWELLERY • PERSONAL STYLING • GIFT-READY KEEPSAKE BOXES • PAN INDIA EXPRESS DELIVERY • SHIVARA ATELIER •",
  heroSlides: [
    {
      id: "hero-1",
      title: "Boxed Evil Eye Bracelet",
      subtitle: "A structured statement bracelet arranged with iconic sapphire blue evil-eye details.",
      kicker: "THE SHIVARA ATELIER",
      image: "assets/instagram-shop/post-051-DW3H_GZDD_4.jpg",
      primaryCtaText: "View Product",
      primaryCtaLink: "/products/boxed-evil-eye-bracelet",
      secondaryCtaText: "Shop New Arrivals",
      secondaryCtaLink: "/collections/new-arrivals",
      tagText: "RING EDIT",
      badgeProductTitle: "Lavender Bloom Ring",
      badgeProductPrice: "₹499",
      badgeProductImage: "assets/catalog-2026-07-26/item-076.jpg",
      badgeProductLink: "/products/lavender-bloom-ring"
    },
    {
      id: "hero-2",
      title: "Floral Statement Ring",
      subtitle: "Intricate floral craftsmanship cast with radiant gold finish for everyday luxury.",
      kicker: "ICONIC STATEMENTS",
      image: "assets/instagram-shop/post-050-DW3GB-dDA3M.jpg",
      primaryCtaText: "Explore Rings",
      primaryCtaLink: "/collections/rings",
      secondaryCtaText: "View Collection",
      secondaryCtaLink: "/collections/all",
      tagText: "BEST SELLER",
      badgeProductTitle: "Tulip Pendant",
      badgeProductPrice: "₹499",
      badgeProductImage: "assets/instagram-shop/post-036-DXRflQ2ARK2.jpg",
      badgeProductLink: "/products/tulip-pendant"
    }
  ]
};

function loadAdminBannersStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(bannersFile, "utf8"));
    return { ...defaultBanners, ...raw };
  } catch {
    return defaultBanners;
  }
}

function saveAdminBannersStore(banners) {
  const payload = { ...defaultBanners, ...banners };
  fs.mkdirSync(path.dirname(bannersFile), { recursive: true });
  fs.writeFileSync(bannersFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return payload;
}

const settingsFile = path.join(dataDirectory, "admin-settings.json");

const defaultSettings = {
  storeName: "The Shivara Group",
  tagline: "Curated Luxury Statement Jewellery Atelier",
  supportPhone: "+91 94570 41215",
  supportEmail: "concierge@theshivaragroup.com",
  whatsappNumber: "919457041215",
  freeShippingThreshold: 999,
  expressShippingFee: 0,
  codAvailable: true,
  codFee: 0,
  currency: "INR",
  currencySymbol: "₹",
  maintenanceMode: false,
  announcementNotice: "Complimentary luxury keepsake velvet packaging included with all orders."
};

function loadAdminSettingsStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    return { ...defaultSettings, ...raw };
  } catch {
    return defaultSettings;
  }
}

function saveAdminSettingsStore(settings) {
  const payload = { ...defaultSettings, ...settings };
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return payload;
}

const inventoryFile = path.join(dataDirectory, "admin-inventory.json");

function loadAdminInventoryStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
    return typeof raw === "object" && raw !== null ? raw : {};
  } catch {
    return {};
  }
}

function saveAdminInventoryStore(inventory) {
  const payload = typeof inventory === "object" && inventory !== null ? inventory : {};
  fs.mkdirSync(path.dirname(inventoryFile), { recursive: true });
  fs.writeFileSync(inventoryFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  return payload;
}

function computeCustomersFromOrders(orders = []) {
  const map = new Map();
  orders.forEach((ord) => {
    const phone = String(ord.customerPhone || "").trim();
    if (!phone) return;
    const existing = map.get(phone) || {
      id: `CUST-${phone}`,
      name: ord.customerName || "Customer",
      phone: phone,
      email: ord.customerEmail || "",
      city: ord.city || (ord.shippingAddress ? ord.shippingAddress.split(",").slice(-2)[0]?.trim() : "") || "PAN India",
      state: ord.state || "",
      address: ord.shippingAddress || "",
      pincode: ord.pincode || "",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: ord.createdAt,
      orders: []
    };
    existing.totalOrders += 1;
    existing.totalSpent += Number(ord.totalAmount) || 0;
    if (new Date(ord.createdAt) > new Date(existing.lastOrderDate)) {
      existing.lastOrderDate = ord.createdAt;
    }
    existing.orders.push({
      orderId: ord.orderId,
      totalAmount: ord.totalAmount,
      status: ord.status,
      createdAt: ord.createdAt,
      itemCount: Array.isArray(ord.items) ? ord.items.length : 0
    });
    map.set(phone, existing);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
}

module.exports = {
  adminStoreMtime,
  allowedCategories,
  file,
  isRemoteMedia,
  loadAdminStore,
  normalizeAdminProductInput,
  saveAdminStore,
  slugify,
  ordersFile,
  loadAdminOrdersStore,
  saveAdminOrdersStore,
  normalizeAdminOrderInput,
  couponsFile,
  loadAdminCouponsStore,
  saveAdminCouponsStore,
  bannersFile,
  loadAdminBannersStore,
  saveAdminBannersStore,
  settingsFile,
  loadAdminSettingsStore,
  saveAdminSettingsStore,
  inventoryFile,
  loadAdminInventoryStore,
  saveAdminInventoryStore,
  computeCustomersFromOrders
};
