const fs = require('node:fs');
const path = require('node:path');
const {loadCatalog} = require('./catalog-lib');
const root = path.resolve(__dirname,'..');
const products = loadCatalog().catalogApi.getAllProducts();
const records = {};
const missing = [];
for (const product of products) {
  const relative = `assets/golden-galleries/${product.id}.jpg`;
  const full = path.join(root,relative);
  if (!fs.existsSync(full)) {missing.push(product.id);continue;}
  const bytes = fs.readFileSync(full);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Error(`${product.id}: gallery must be a JPEG image`);
  let width = 0, height = 0;
  for (let i = 2; i < bytes.length - 9;) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    const length = bytes.readUInt16BE(i + 2);
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      height = bytes.readUInt16BE(i + 5); width = bytes.readUInt16BE(i + 7); break;
    }
    if (length < 2) break;
    i += length + 2;
  }
  if (width !== height) throw Error(`${product.id}: gallery atlas must be square, got ${width}x${height}`);
  records[product.id] = {atlas:`/${relative}`,views:4};
}
const source = `(function(root,factory){const media=factory();if(typeof module==="object"&&module.exports)module.exports=media;if(root)root.ShivaraGoldenMedia=media;})(typeof window!=="undefined"?window:null,function(){return ${JSON.stringify(records,null,2)};});\n`;
fs.writeFileSync(path.join(root,'golden-media.js'),source);
fs.mkdirSync(path.join(root,'artifacts/golden-gallery'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/golden-gallery/coverage.json'),JSON.stringify({total:products.length,ready:Object.keys(records).length,missing},null,2));
console.log(`${Object.keys(records).length}/${products.length} product galleries ready`);
if (process.argv.includes('--complete') && missing.length) {console.error('Missing: '+missing.join(', '));process.exitCode=1;}
