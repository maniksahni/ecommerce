const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../../admin.html'), 'utf8');
const source = html.slice(html.indexOf('    let productSavePending = false;'), html.indexOf('    // Attach listeners'));
let complete = 0;
for (let i = 0; i < 1000; i++) test(`product scenario ${i + 1}: ${['create/edit/delete', 'stock roundtrip', 'price roundtrip', 'write failure', 'invalid price', 'duplicate submit', 'concurrent stock', 'SKU and compare price', 'edit stable slug', 'delete failure'][i % 10]}`, async () => {
  const fields = Object.fromEntries(Object.entries({ 'form-title': `Queen's <Ring> ${i}`, 'form-category': 'rings', 'form-price': String(100 + i), 'form-sku': `QA-${i}`, 'form-compare-price': String(2000 + i), 'form-image-url': 'https://example.com/ring.jpg', 'form-is-sold-out': 'false', 'form-desc': `Description ${i}` }).map(([k,value])=>[k,{value}]));
  fields['form-submit-btn'] = {};
  const persisted = new Map();
  let fail = false, gate = null, writes = 0;
  const c = vm.createContext({ window: {}, document: { getElementById: id=>fields[id], querySelector() {} }, inventoryStore: {}, currentUploadedBase64: '', isEditing: false, editingDocId: null, allProducts: [], crypto: {randomUUID:()=>`id-${i}`}, doc: (_db,_collection,id)=>id, db: {}, setDoc: async(id,data)=>{ writes++; if(gate)await gate; if(fail)throw Error('permission-denied'); persisted.set(id,{...persisted.get(id),...data}); }, deleteDoc: async id=>{if(fail)throw Error('permission-denied');persisted.delete(id);}, serverTimestamp:()=>123, applyFilters(){}, updateStats(){}, showToast(){}, closeProductModal(){}, alert(){}, console:{log(){},error(){},warn(){}} });
  vm.runInContext(source,c);
  const save = ()=>vm.runInContext('executeDirectFirestoreSave()',c);
  const id = `item-id-${i}`;
  await save(); assert.ok(persisted.has(id)); assert.equal(c.allProducts.length,1);
  switch(i%10) {
    case 0: c.isEditing=true;c.editingDocId=id;fields['form-title'].value='Edited '+i;await save();assert.equal(persisted.get(id).title,'Edited '+i);assert.equal(c.allProducts.length,1);assert.equal(await c.window.deleteAdminProduct(id),true);assert.equal(persisted.size,0);break;
    case 1: assert.equal(await c.window.toggleStockStatus(id),true);assert.equal(persisted.get(id).isSoldOut,true);await c.window.toggleStockStatus(id);assert.equal(persisted.get(id).isSoldOut,false);break;
    case 2: await c.window.updateProductPrice(id,400+i);assert.equal(persisted.get(id).price,400+i);break;
    case 3: fail=true;assert.equal(await c.window.toggleStockStatus(id),false);assert.equal(c.allProducts[0].isSoldOut,false);assert.equal(await c.window.updateProductPrice(id,800),false);assert.equal(c.allProducts[0].price,100+i);break;
    case 4: for(const value of [0,-1,'abc',Infinity])assert.equal(await c.window.updateProductPrice(id,value),false);assert.equal(writes,1);break;
    case 5: {let release;gate=new Promise(r=>release=r);c.isEditing=true;c.editingDocId=id;const a=save();await save();assert.equal(writes,2);release();await a;assert.equal(c.allProducts.length,1);break;}
    case 6: {let release;gate=new Promise(r=>release=r);const a=c.window.toggleStockStatus(id);assert.equal(await c.window.toggleStockStatus(id),false);assert.equal(c.allProducts[0].isSoldOut,false);release();await a;assert.equal(persisted.get(id).isSoldOut,true);break;}
    case 7: assert.equal(persisted.get(id).sku,`QA-${i}`);assert.equal(persisted.get(id).compareAtPrice,2000+i);c.isEditing=true;c.editingDocId=id;fields['form-sku'].value='EDITED';fields['form-compare-price'].value='';await save();assert.equal(persisted.get(id).sku,'EDITED');assert.equal(persisted.get(id).compareAtPrice,null);break;
    case 8: {const slug=persisted.get(id).slug;c.isEditing=true;c.editingDocId=id;fields['form-title'].value='Changed title';await save();assert.equal(persisted.get(id).slug,slug);break;}
    case 9: fail=true;assert.equal(await c.window.deleteAdminProduct(id),false);assert.equal(c.allProducts.length,1);assert.ok(persisted.has(id));break;
  }
  assert.equal(fields['form-submit-btn'].disabled,false);complete++;
});
process.on('exit',()=>{fs.mkdirSync(path.join(__dirname,'../../artifacts/admin-fix'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../../artifacts/admin-fix/stress-results.json'),JSON.stringify({requestedScenarios:1000,passedScenarios:complete,mode:'isolated mocked Firestore, actual admin controllers',generatedAt:new Date().toISOString()},null,2));});
