(function exposeCatalog(root, factory) {
  const builder = factory();
  if (typeof module === "object" && module.exports) module.exports = builder;
  if (root?.SHIVARA_SHOP_DATA && root?.SHIVARA_CATALOG_OVERRIDES) {
    const catalog = builder.mergeAdminCatalog(
      builder.build(root.SHIVARA_SHOP_DATA, root.SHIVARA_CATALOG_OVERRIDES),
      root.SHIVARA_ADMIN_STORE
    );
    root.SHIVARA_CATALOG = catalog;
    root.ShivaraCatalog = builder.createAccessLayer(catalog);
  }
})(typeof window !== "undefined" ? window : null, function createCatalogBuilder() {
  const supportedContentTypes = new Set(["product", "campaign", "packaging", "announcement", "lifestyle", "review", "unavailable"]);
  const moneyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  function freezeProduct(product) {
    product.collections = Object.freeze([...(product.collections || [])]);
    product.images = Object.freeze([...(product.images || [])]);
    product.videos = Object.freeze([...(product.videos || [])]);
    product.variants = Object.freeze((product.variants || []).map((variant) => Object.freeze({ ...variant })));
    return Object.freeze(product);
  }

  function build(source, overrides) {
    const sourcePosts = Array.isArray(source?.products) ? source.products : [];
    const sourceMap = new Map(sourcePosts.map((post) => [post.id, post]));
    const contentTypeBySourceId = new Map(sourcePosts.map((post) => [post.id, "unavailable"]));

    Object.entries(overrides?.contentTypeGroups || {}).forEach(([contentType, ids]) => {
      if (!supportedContentTypes.has(contentType)) throw new Error(`Unsupported content type: ${contentType}`);
      ids.forEach((id) => contentTypeBySourceId.set(id, contentType));
    });

    const socialContent = sourcePosts.map((post) => ({
      ...post,
      socialCaption: post.caption || "",
      contentType: contentTypeBySourceId.get(post.id) || "unavailable"
    }));

    const products = (overrides?.products || []).map((product) => {
      const sourcePost = sourceMap.get(product.sourcePostId);
      const isDirectSource = product.sourceType === "catalog" || product.sourceType === "direct" || !sourceMap.has(product.sourcePostId);
      if (!sourcePost && !isDirectSource) throw new Error(`Missing Instagram source post for ${product.sourcePostId}`);
      return freezeProduct({
        ...product,
        id: product.slug,
        contentType: "product",
        isPurchasable: true,
        requiresReview: false,
        socialCaption: sourcePost?.caption || "",
        instagram: sourcePost?.instagram || null,
        sourceDate: product.sourceDate || sourcePost?.date || null,
        sourceIndex: Number.isFinite(product.sourceIndex) ? product.sourceIndex : sourcePost?.index
      });
    });

    return Object.freeze({
      version: overrides?.version || 1,
      generatedAt: new Date().toISOString(),
      profile: Object.freeze({ ...(source?.profile || {}) }),
      products: Object.freeze(products),
      socialContent: Object.freeze(socialContent.map((item) => Object.freeze(item))),
      contentTypeBySourceId: Object.freeze(Object.fromEntries(contentTypeBySourceId))
    });
  }

  function normalizeAdminProduct(entry, index) {
    const slug = String(entry?.slug || "").trim();
    const images = Array.isArray(entry?.images) && entry.images.length
      ? entry.images
      : (entry?.imageUrl ? [entry.imageUrl] : []);
    return freezeProduct({
      sourcePostId: entry.sourcePostId || `admin-${slug}`,
      sourceType: "admin",
      slug,
      id: slug,
      sku: entry.sku || `SHV-ADM-${slug.replace(/-/g, "").slice(0, 10).toUpperCase()}`,
      title: entry.title,
      category: entry.category,
      collections: Array.isArray(entry.collections) && entry.collections.length
        ? entry.collections
        : [entry.category, "new-arrivals"].filter(Boolean),
      price: Number.isFinite(entry.price) ? entry.price : null,
      compareAtPrice: Number.isFinite(entry.compareAtPrice) ? entry.compareAtPrice : null,
      currency: entry.currency || "INR",
      priceStatus: entry.priceStatus || "confirmed",
      offerText: entry.offerText || null,
      badge: entry.badge || "New",
      optionsStatus: entry.optionsStatus || "none",
      variants: Array.isArray(entry.variants) ? entry.variants : [],
      images,
      videos: Array.isArray(entry.videos) ? entry.videos : [],
      imageAlt: entry.imageAlt || entry.title,
      description: entry.description || "",
      contentType: "product",
      isPurchasable: true,
      requiresReview: false,
      socialCaption: "",
      instagram: null,
      sourceDate: entry.sourceDate || (entry.createdAt || "").slice(0, 10) || null,
      sourceIndex: Number.isFinite(entry.sourceIndex) ? entry.sourceIndex : 100000 + index,
      _source: "admin"
    });
  }

  function mergeAdminCatalog(catalog, adminStore) {
    if (!catalog || !adminStore) return catalog;
    const deleted = new Set((adminStore.deleted || []).map(String));
    const adminProducts = (adminStore.products || [])
      .filter((entry) => entry && entry.slug && !deleted.has(String(entry.slug)))
      .map((entry, index) => normalizeAdminProduct(entry, index));
    const adminSlugs = new Set(adminProducts.map((product) => product.slug));
    const kept = (catalog.products || []).filter((product) => !deleted.has(product.slug) && !adminSlugs.has(product.slug));
    return Object.freeze({
      ...catalog,
      products: Object.freeze([...adminProducts, ...kept])
    });
  }

  function createAccessLayer(catalog) {
    if (!catalog || !Array.isArray(catalog.products)) throw new Error("Curated Shivara catalogue is unavailable");
    const products = catalog.products;
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    const byLegacyId = new Map(products.map((product) => [product.sourcePostId, product]));

    function validateCommerceObject(product, context = "commerce renderer") {
      const valid = Boolean(
        product &&
        (product.contentType === "product" || product.isPurchasable === true) &&
        (bySlug.has(product.slug) || bySlug.has(product.id))
      );
      if (!valid && typeof console !== "undefined") {
        console.error(`[ShivaraCatalog] BLOCKED non-curated commerce object in ${context}`, product?.id || product);
      }
      return valid;
    }

    function getAllProducts() {
      return [...products];
    }

    function getProductBySlug(slug) {
      return bySlug.get(String(slug || "")) || null;
    }

    function getProductByLegacyId(id) {
      return byLegacyId.get(String(id || "")) || null;
    }

    function getCollection(slug) {
      const key = String(slug || "all");
      if (key === "all") return getAllProducts();
      if (key === "new-arrivals") {
        return products
          .filter((product) => product.collections.includes("new-arrivals"))
          .sort((a, b) => b.sourceIndex - a.sourceIndex);
      }
      if (key === "necklaces") return products.filter((product) => product.category === "necklaces" || product.category === "pendants");
      return products.filter((product) => product.category === key || product.collections.includes(key));
    }

    function search(query) {
      const term = String(query || "").trim().toLowerCase();
      if (!term) return [];
      return products.filter((product) =>
        [product.title, product.sku, product.category, ...product.collections].join(" ").toLowerCase().includes(term)
      );
    }

    function formatPrice(product) {
      if (!validateCommerceObject(product, "formatPrice")) {
        return Object.freeze({ confirmed: false, price: null, compareAt: null, discount: null, label: "Unavailable" });
      }
      const rawPrice = (Number.isFinite(Number(product.price)) && Number(product.price) > 0) ? Number(product.price) : 499;
      const compareAt = (Number.isFinite(Number(product.compareAtPrice)) && Number(product.compareAtPrice) > rawPrice)
        ? Number(product.compareAtPrice)
        : null;
      const discount = compareAt ? Math.round(((compareAt - rawPrice) / compareAt) * 100) : null;
      return Object.freeze({
        confirmed: true,
        price: rawPrice,
        compareAt,
        discount,
        label: moneyFormatter.format(rawPrice)
      });
    }

    function getPurchaseMode(product) {
      if (!validateCommerceObject(product, "getPurchaseMode") || product.isSoldOut === true) return "sold-out";
      return "direct";
    }

    function getFeaturedProducts(limit = 7) {
      return [...products]
        .sort((a, b) => Number(formatPrice(b).confirmed) - Number(formatPrice(a).confirmed) || a.sourceIndex - b.sourceIndex)
        .slice(0, Math.max(0, limit));
    }

    function getNewArrivals(limit = Infinity) {
      return getCollection("new-arrivals").slice(0, Math.max(0, limit));
    }

    function getRelatedProducts(product, limit = 5) {
      if (!validateCommerceObject(product, "getRelatedProducts")) return [];
      const complementary = {
        earrings: ["necklaces", "pendants"], necklaces: ["earrings", "pendants"], pendants: ["earrings", "bracelets"],
        bracelets: ["rings", "watches"], rings: ["bracelets", "earrings"], watches: ["bracelets"],
        sets: ["earrings", "rings"], "evil-eye": ["bracelets", "pendants"]
      };
      return products
        .filter((item) => item.id !== product.id)
        .map((item) => {
          const sameCategory = item.category === product.category;
          const sharedCollection = item.collections.some((collection) => product.collections.includes(collection));
          const complementaryCategory = (complementary[product.category] || []).includes(item.category);
          const featuredFallback = getFeaturedProducts(products.length).some((featured) => featured.id === item.id);
          const score = sameCategory ? 4 : sharedCollection ? 3 : complementaryCategory ? 2 : featuredFallback ? 1 : 0;
          return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.item.sourceIndex - b.item.sourceIndex)
        .slice(0, Math.max(0, limit))
        .map(({ item }) => item);
    }

    return Object.freeze({
      version: catalog.version,
      getAll: getAllProducts,
      getBySlug: getProductBySlug,
      getByLegacyId: getProductByLegacyId,
      getAllProducts,
      getProductBySlug,
      getProductByLegacyId,
      getCollection,
      search,
      getFeaturedProducts,
      getFeatured: getFeaturedProducts,
      getNewArrivals,
      getRelated: getRelatedProducts,
      getRelatedProducts,
      formatPrice,
      getPurchaseMode,
      validateCommerceObject
    });
  }

  return { build, createAccessLayer, mergeAdminCatalog, supportedContentTypes: Array.from(supportedContentTypes) };
});
