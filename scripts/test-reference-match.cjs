/* Screenshot-reference compatibility checks for SHIVARA homepage.
   These checks validate structure and truthful catalogue references.
   A pixel-accuracy claim requires separate real-browser screenshot comparison. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCatalog, root } = require("./catalog-lib");

const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const css = fs.readFileSync(path.join(root,"shivara-reference-match.css"),"utf8");
const build = fs.readFileSync(path.join(root,"scripts/netlify-build.js"),"utf8");
const app = fs.readFileSync(path.join(root,"script.js"),"utf8");
const api = loadCatalog().catalogApi;
const bySlug = new Map(api.getAllProducts().map(p=>[p.slug,p]));

assert.match(html,/A Love Story<br><em>in Every Design<\/em>/);
assert.match(html,/href="\/shivara-reference-match\.css\?v=/);
assert(build.includes('"shivara-reference-match.css"'));
assert(html.includes('id="commerce-category-grid"'));
assert(html.includes('data-product-section="new-arrivals"'));
assert(html.includes('id="products-grid"'));
assert(html.includes('id="shared-header"'));
assert(html.includes('src="/script.js'));
assert(html.includes('class="approved-campaigns cream-edits"'));
assert(css.includes("ref-scene__stone"));
assert(css.includes("ref-hero__slide-links"));
for(const s of ["max-width:767px","max-width:360px",".stable-mobile-dock",".stable-header__actions"]){
  assert(css.includes(s), "Responsive style missing: "+s);
}
const h=html.match(/<section class="approved-hero cream-hero ref-hero"[\s\S]*?<\/section>/)?.[0];
assert(h,"Reference hero missing");
const links=[...h.matchAll(/<a class="cream-hero__product[^"]*" href="\/products\/([^"]+)"[\s\S]*?<img src="([^"]+)"/g)];
assert.equal(links.length,4);
for(const [_,slug,src] of links) {
  const item=bySlug.get(slug);
  assert(item,"Hero does not match real catalogue slug "+slug);
  assert(fs.existsSync(path.join(root,src.replace(/^\//,""))), "Missing hero image "+src);
  assert(item.images.some(im=>"/"+im.replace(/^\//,"")===src), "Image/product mismatch "+slug);
}
for(const match of html.matchAll(/<img\b[^>]*\bsrc="(\/assets\/[^"]+)"/g)){
  assert(fs.existsSync(path.join(root,match[1].slice(1))), "Missing image "+match[1]);
}
assert(app.includes('Math.min(...prices).toLocaleString("en-IN")'),
  "Category price must be computed from real catalogue data, never a mockup number");
for(const c of ["Free Shipping on Orders Above ₹2,499","10% Off on Your First Order",
  "Tarnish Resistant","Waterproof","Designed in India"]){
  assert(!h.includes(c),"Unverified concept claim is visible in live hero: "+c);
}
let depth=0;
for(const ch of css){if(ch==="{")depth++;else if(ch==="}")depth--;assert(depth>=0);}
assert.equal(depth,0,"CSS braces not balanced");
console.log("Screenshot-reference source checks passed (four real hero products, responsive desktop/mobile, truthful category pricing).");
