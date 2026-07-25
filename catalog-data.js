(function exposeCatalog(root, factory) {
  const builder = factory();
  if (typeof module === "object" && module.exports) module.exports = builder;
  if (root?.SHIVARA_SHOP_DATA && root?.SHIVARA_CATALOG_OVERRIDES) {
    root.SHIVARA_CATALOG = builder.build(root.SHIVARA_SHOP_DATA, root.SHIVARA_CATALOG_OVERRIDES);
  }
})(typeof window !== "undefined" ? window : null, function createCatalogBuilder() {
  const supportedContentTypes = new Set(["product", "campaign", "packaging", "announcement", "lifestyle", "review", "unavailable"]);

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
      return {
        ...product,
        id: product.slug,
        contentType: "product",
        isPurchasable: true,
        requiresReview: false,
        socialCaption: sourcePost.caption || "",
        instagram: sourcePost.instagram,
        sourceDate: sourcePost.date,
        sourceIndex: sourcePost.index
      };
    });

    return {
      version: overrides?.version || 1,
      generatedAt: new Date().toISOString(),
      profile: source?.profile || {},
      products,
      socialContent,
      contentTypeBySourceId: Object.fromEntries(contentTypeBySourceId)
    };
  }

  return { build, supportedContentTypes: Array.from(supportedContentTypes) };
});
