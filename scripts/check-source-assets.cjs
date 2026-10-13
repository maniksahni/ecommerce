const fs = require('node:fs');
const path = require('node:path');
const { catalogApi } = require('./catalog-lib').loadCatalog();
const root = path.resolve(__dirname, '..');
const build = fs.readFileSync(path.join(root, 'scripts/netlify-build.js'), 'utf8');
const block = build.match(/const publicFiles = \[([\s\S]*?)\];/);
if (!block) throw new Error('Cannot locate build asset manifest');
const files = [...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
const references = new Map();
function add(asset, source) {
  if (/^(https?:|data:)/.test(asset)) return;
  const file = asset.replace(/^\//, '').split(/[?#]/)[0];
  if (!references.has(file)) references.set(file, []);
  references.get(file).push(source);
}
for (const product of catalogApi.getAllProducts()) {
  for (const asset of [...product.images, ...(product.videos || [])]) add(asset, product.slug);
}
for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing build source: ${file}`);
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/["'(]((?:\/)?assets\/[\w\-/.]+\.(?:webp|png|jpe?g|svg|mp4))/g)) add(match[1], file);
}
const missing = [...references].filter(([file]) => !fs.existsSync(path.join(root, file)));
if (missing.length) { console.error('Missing source assets:', JSON.stringify(missing, null, 2)); process.exitCode = 1; }
else console.log(`PASS: ${references.size} unique catalogue and build-source assets exist`);
