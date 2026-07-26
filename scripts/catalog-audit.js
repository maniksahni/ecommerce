const fs = require("node:fs");
const path = require("node:path");
const { duplicates, loadCatalog, root, validateProduct } = require("./catalog-lib");

const { source, overrides, catalog } = loadCatalog();
const sourcePosts = source.products || [];
const products = catalog.products || [];
const directProducts = products.filter((product) => product.sourceType === "whatsapp");
const instagramProducts = products.filter((product) => product.sourceType !== "whatsapp");
const sourceById = new Map(sourcePosts.map((post) => [post.id, post]));
const contentCounts = catalog.socialContent.reduce((counts, item) => {
  counts[item.contentType] = (counts[item.contentType] || 0) + 1;
  return counts;
}, {});
const productErrors = products.flatMap((product) =>
  validateProduct(product).map((message) => ({ id: product.id, message }))
);
const duplicateIds = duplicates(products.map((product) => product.id));
const duplicateSlugs = duplicates(products.map((product) => product.slug));
const duplicateTitles = duplicates(products.map((product) => product.title.toLowerCase()));
const sourceDuplicateTitles = duplicates(sourcePosts.map((post) => (post.title || "").trim().toLowerCase()));
const sourceDuplicateImages = duplicates(sourcePosts.map((post) => post.image));
const missingImages = products
  .filter((product) => !(product.images || []).length)
  .map((product) => product.id);
const missingPrices = products
  .filter((product) => product.priceStatus === "enquiry")
  .map((product) => product.id);
const titlesOver60 = products.filter((product) => product.title.length > 60).map((product) => product.id);
const invalidVariants = products
  .filter((product) => validateProduct(product).some((message) => message.includes("variant")))
  .map((product) => product.id);
const unclassifiedSource = catalog.socialContent.filter((item) => item.contentType === "unavailable").map((item) => item.id);
const missingSourceReferences = instagramProducts.filter((product) => !sourceById.has(product.sourcePostId)).map((product) => product.id);
const socialCtaTitles = products.filter((product) => /\b(dm now|comment for|grab yours|coming soon|last chance|followed us|packaging|feminine urge)\b/i.test(product.title)).map((product) => product.id);
const invalidPrices = products.filter((product) => product.priceStatus === "confirmed" && (!Number.isFinite(product.price) || product.price <= 0)).map((product) => product.id);
const invalidCompareAtPrices = products.filter((product) => product.compareAtPrice !== null && (!Number.isFinite(product.compareAtPrice) || product.compareAtPrice <= product.price)).map((product) => product.id);
const incorrectDiscounts = products.filter((product) => {
  if (!Number.isFinite(product.discountPercentage)) return false;
  if (!Number.isFinite(product.compareAtPrice) || !Number.isFinite(product.price)) return true;
  return product.discountPercentage !== Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}).map((product) => product.id);
const campaignProductPages = instagramProducts.filter((product) => catalog.contentTypeBySourceId[product.sourcePostId] !== "product").map((product) => product.id);
const unrelatedCollections = products.filter((product) => validateProduct(product).includes("product included in an unrelated collection")).map((product) => product.id);

const audit = {
  generatedAt: new Date().toISOString(),
  source: {
    totalPosts: sourcePosts.length,
    contentTypes: contentCounts,
    postsRemovedFromCommerce: sourcePosts.length - instagramProducts.length,
    directUploadProducts: directProducts.length,
    campaignOnlyPosts: contentCounts.campaign || 0,
    packagingContentPosts: contentCounts.packaging || 0,
    unclassifiedUnavailablePosts: unclassifiedSource
  },
  catalogue: {
    purchasableProducts: products.length,
    confirmedPriceProducts: products.filter((product) => product.priceStatus === "confirmed").length,
    priceEnquiryProducts: missingPrices.length,
    categories: products.reduce((counts, product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
      return counts;
    }, {})
  },
  checks: {
    duplicateProductIds: duplicateIds,
    duplicateProductSlugs: duplicateSlugs,
    duplicateProductTitles: duplicateTitles,
    duplicateSourceTitles: sourceDuplicateTitles,
    duplicateSourceImages: sourceDuplicateImages,
    missingTitles: products.filter((product) => !product.title).map((product) => product.id),
    titlesLongerThan60Characters: titlesOver60,
    socialCtaTitles,
    missingPrices,
    invalidPrices,
    invalidCompareAtPrices,
    incorrectDiscounts,
    suspiciousPrices: Object.keys(overrides.knownConflicts || {}),
    conflictingPrices: overrides.knownConflicts || {},
    missingCategories: products.filter((product) => !product.category).map((product) => product.id),
    suspiciousSourceCategories: overrides.suspiciousCategories || {},
    invalidVariants,
    missingImages,
    missingSourceReferences,
    campaignProductPages,
    unrelatedCollections,
    productValidationErrors: productErrors
  }
};

const blocking = [
  ...productErrors,
  ...duplicateIds.map((item) => ({ id: item.value, message: "duplicate product ID" })),
  ...duplicateSlugs.map((item) => ({ id: item.value, message: "duplicate product slug" })),
  ...duplicateTitles.map((item) => ({ id: item.value, message: "duplicate product title" })),
  ...missingSourceReferences.map((id) => ({ id, message: "missing Instagram source post" }))
];

fs.writeFileSync(path.join(root, "catalog-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);

console.log("Shivara catalogue audit");
console.log("========================");
console.log(`Source posts inspected:     ${sourcePosts.length}`);
console.log(`Curated products:           ${products.length}`);
console.log(`Confirmed prices:           ${audit.catalogue.confirmedPriceProducts}`);
console.log(`Price enquiries:            ${audit.catalogue.priceEnquiryProducts}`);
console.log(`Posts removed from commerce:${audit.source.postsRemovedFromCommerce}`);
console.log(`Known price conflicts:      ${Object.keys(audit.checks.conflictingPrices).length}`);
console.log(`Category corrections:       ${Object.keys(audit.checks.suspiciousSourceCategories).length}`);
console.log(`Blocking catalogue errors:  ${blocking.length}`);
console.log(`Audit written to:           ${path.relative(process.cwd(), path.join(root, "catalog-audit.json"))}`);

if (blocking.length) {
  blocking.forEach((error) => console.error(`ERROR ${error.id}: ${error.message}`));
  process.exitCode = 1;
} else {
  console.log("PASS: production catalogue contains only explicitly curated products.");
}
