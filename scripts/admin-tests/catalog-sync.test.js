const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCatalog } = require('../catalog-lib');
function fixture() { const api = loadCatalog().catalogApi; return { api, original: api.getAllProducts()[0] }; }
test('authoritative cloud catalogue removes deleted static products, including an empty shop', () => {
  const { api, original } = fixture();
  api.replaceProductsFromCloud([{ ...original, id: 'cloud-document', price: 351 }]);
  assert.equal(api.getAllProducts().length, 1);
  assert.equal(api.getProductBySlug(original.slug).cloudDocId, 'cloud-document');
  api.replaceProductsFromCloud([]);
  assert.equal(api.getAllProducts().length, 0);
  assert.equal(api.getProductBySlug(original.slug), null);
});
test('new cloud product is available to search, collection, PDP and price calculation', () => {
  const { api } = fixture();
  api.replaceProductsFromCloud([{ id: 'random-doc', slug: 'new-qa-ring', title: 'New QA Ring', price: 321, category: 'rings', imageUrl: 'assets/ring.jpg', isSoldOut: false }]);
  const product = api.getProductBySlug('new-qa-ring');
  assert.equal(api.search('New QA')[0], product);
  assert.equal(api.getCollection('rings')[0], product);
  assert.equal(api.formatPrice(product).price, 321);
  assert.equal(api.getPurchaseMode(product), 'direct');
  api.replaceProductsFromCloud([{ id: 'random-doc', slug: 'new-qa-ring', title: 'Edited QA Ring', price: 451, category: 'earrings', imageUrl: 'assets/edited.jpg', isSoldOut: true }]);
  const edited = api.getProductBySlug('new-qa-ring');
  assert.equal(api.search('Edited QA')[0], edited);
  assert.equal(api.getCollection('rings').length, 0);
  assert.equal(api.getCollection('earrings')[0].price, 451);
  assert.equal(api.getPurchaseMode(edited), 'sold-out');
});
test('inventory patch changes the commerce model as well as purchase mode', () => {
  const { api, original } = fixture();
  const updated = api.patchLiveProduct(original.id, { stock: 0, isSoldOut: true });
  assert.equal(api.getProductBySlug(original.slug), updated);
  assert.equal(api.getAllProducts().find(p => p.id === original.id), updated);
  assert.equal(api.getPurchaseMode(updated), 'sold-out');
});
test('cloud document ID cannot be overwritten by stale document payload ID', () => {
  const { api, original } = fixture();
  api.replaceProductsFromCloud([{ ...original, id: 'real-cloud-id', price: 400 }]);
  assert.equal(api.getProductBySlug(original.slug).id, original.id);
  assert.equal(api.getProductBySlug(original.slug).cloudDocId, 'real-cloud-id');
});
