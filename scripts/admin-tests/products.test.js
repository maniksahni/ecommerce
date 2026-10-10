const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../../admin.html'), 'utf8');
const start = html.indexOf('    const pendingProductDeletes = new Set();');
const end = html.indexOf('    // Attach listeners', start);
function harness(deleteDoc) {
  const context = vm.createContext({ window: {}, allProducts: [{ id: 'cloud-id', slug: 'ring' }], deleteDoc, doc: (_db, _collection, id) => id, db: {}, applyFilters() {}, updateStats() {}, showToast() {} });
  vm.runInContext(html.slice(start, end), context);
  return context;
}
test('failed cloud delete leaves the product visible', async () => {
  const c = harness(async () => { throw new Error('permission-denied'); });
  assert.equal(await c.window.deleteAdminProduct('ring'), false);
  assert.equal(c.allProducts.length, 1);
});
test('delete uses the cloud document ID and waits for acknowledgement', async () => {
  let release;
  let id;
  const c = harness(value => { id = value; return new Promise(r => { release = r; }); });
  const pending = c.window.deleteAdminProduct('ring');
  assert.equal(id, 'cloud-id');
  assert.equal(c.allProducts.length, 1);
  assert.equal(await c.window.deleteAdminProduct('ring'), false);
  release();
  assert.equal(await pending, true);
  assert.equal(c.allProducts.length, 0);
});
test('snapshot document ID overrides a stale payload ID', () => {
  const expression = html.match(/firestoreProducts.push\(\{([\s\S]*?)\}\);/)[1];
  const c = vm.createContext({ data: { id: 'stale-id', price: 100 }, docSnap: { id: 'actual-id' } });
  assert.equal(vm.runInContext('({' + expression + '})', c).id, 'actual-id');
});
test('empty collection remains empty instead of restoring deleted products', () => {
  const emptyBranch = html.slice(html.indexOf('// An empty cloud catalogue'), html.indexOf('\n        applyFilters();', html.indexOf('// An empty cloud catalogue')));
  assert.ok(emptyBranch.includes('allProducts = []'));
  assert.ok(!emptyBranch.includes('autoSeedMissingBaselineProducts'));
});
test('save creates one product during concurrent submits and snapshot updates', async () => {
  let resolveSave;
  let writes = 0;
  const fields = { 'form-title': { value: 'Ring' }, 'form-category': { value: 'rings' }, 'form-price': { value: '250' }, 'form-image-url': { value: 'https://example.com/ring.jpg' }, 'form-submit-btn': {} };
  const c = vm.createContext({ window: {}, document: { getElementById: id => fields[id], querySelector() {} }, currentUploadedBase64: '', isEditing: false, editingDocId: null, allProducts: [], crypto: { randomUUID: () => 'test-id' }, doc: () => 'item-test-id', db: {}, setDoc: () => { writes++; return new Promise(r => { resolveSave = r; }); }, serverTimestamp: () => 123, applyFilters() {}, updateStats() {}, showToast() {}, closeProductModal() {}, console });
  const a = html.indexOf('    let productSavePending = false;');
  const b = html.indexOf('    // Expose global helper', a);
  vm.runInContext(html.slice(a, b), c);
  const pending = vm.runInContext('executeDirectFirestoreSave()', c);
  await vm.runInContext('executeDirectFirestoreSave()', c);
  assert.equal(writes, 1);
  c.allProducts = [{ id: 'item-test-id', title: 'Ring' }];
  resolveSave(); await pending;
  assert.equal(c.allProducts.length, 1);
  assert.equal(fields['form-submit-btn'].disabled, false);
});
test('price modal close controller exists and dismisses the modal', () => {
  const source = html.match(/function closePriceModal\(\) \{[^\n]+\}/)[0];
  let removed;
  const c = vm.createContext({ $: selector => { assert.equal(selector, '#price-modal'); return { classList: { remove: value => { removed = value; } } }; } });
  vm.runInContext(source + ';closePriceModal();', c);
  assert.equal(removed, 'is-open');
});
