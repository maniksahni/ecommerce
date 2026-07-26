(function exposeCatalog(root, factory) {
  const builder = factory();
  if (typeof module === "object" && module.exports) module.exports = builder;
  if (root?.SHIVARA_SHOP_DATA && root?.SHIVARA_CATALOG_OVERRIDES) {
    root.SHIVARA_CATALOG = builder.build(root.SHIVARA_SHOP_DATA, root.SHIVARA_CATALOG_OVERRIDES);
    root.ShivaraCatalog = builder.createAccessLayer(root.SHIVARA_CATALOG);
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
      if (!sourcePost) throw new Error(`Missing Instagram source post for ${product.sourcePostId}`);
      return freezeProduct({
        ...product,
        id: product.slug,
        contentType: "product",
        isPurchasable: true,
        requiresReview: false,
        socialCaption: sourcePost.caption || "",
        instagram: sourcePost.instagram,
        sourceDate: sourcePost.date,
        sourceIndex: sourcePost.index
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

  function createAccessLayer(catalog) {
    if (!catalog || !Array.isArray(catalog.products)) throw new Error("Curated Shivara catalogue is unavailable");
    const products = catalog.products;
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    const byLegacyId = new Map(products.map((product) => [product.sourcePostId, product]));

    function validateCommerceObject(product, context = "commerce renderer") {
      const valid = Boolean(
        product &&
        product.contentType === "product" &&
        product.isPurchasable === true &&
        bySlug.get(product.slug) === product
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
      if (key === "new-arrivals") return products.filter((product) => product.collections.includes("new-arrivals"));
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
      const confirmed = product.priceStatus === "confirmed" && Number.isFinite(product.price);
      const compareAt = confirmed && Number.isFinite(product.compareAtPrice) && product.compareAtPrice > product.price
        ? product.compareAtPrice
        : null;
      const discount = compareAt ? Math.round(((compareAt - product.price) / compareAt) * 100) : null;
      return Object.freeze({
        confirmed,
        price: confirmed ? product.price : null,
        compareAt,
        discount,
        label: confirmed ? moneyFormatter.format(product.price) : "Price on request"
      });
    }

    function getPurchaseMode(product) {
      if (!validateCommerceObject(product, "getPurchaseMode") || product.priceStatus === "unavailable") return "unavailable";
      if (product.variants.length) return "variant";
      if (product.optionsStatus === "confirm") return "enquiry";
      return formatPrice(product).confirmed ? "direct" : "enquiry";
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

  return { build, createAccessLayer, supportedContentTypes: Array.from(supportedContentTypes) };
});
