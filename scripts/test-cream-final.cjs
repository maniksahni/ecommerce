/* Static gate for final cream-and-gold Shivara homepage.
 * Browser screenshot/functional testing is additionally required before production deployment.
 */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=(name)=>fs.readFileSync(path.join(root,name),"utf8");
const html=read("index.html");
const css=read("shivara-cream-final.css");
const build=read("scripts/netlify-build.js");
const catalog=read("catalog-overrides.js");
const app=read("script.js");
assert.match(html,/A Love Story<br><em>in Every Design<\/em>/,"approved tagline missing");
assert.match(html,/shivara-cream-final/,"cream page class missing");
assert.match(html,/shivara-cream-final\.css/,"cream theme not loaded");
assert.match(build,/"shivara-cream-final\.css"/,"build omits theme");
assert.match(html,/id="commerce-category-grid"/);
assert.match(html,/data-product-section="new-arrivals"/);
assert.match(html,/id="products-grid"/);
assert.match(html,/id="shared-header"/);
assert.match(html,/src="\/script\.js/);
assert.match(html,/href="\/collections\/new-arrivals"/);
assert.match(css,/@media\(max-width:767px\)/,"mobile responsive styling missing");
assert.match(css,/@media\(max-width:360px\)/,"small-device styling missing");
assert.match(css,/\.stable-mobile-dock/,"mobile navigation not addressed");
assert.ok(!html.includes("hero-desktop.webp"),"old ethnic model hero remains");
assert.ok(!html.includes("TRADITION<br>MEETS TOMORROW"),"old editorial remains");
const srcs=[...html.matchAll(/(?:src|srcset)="(\/assets\/[^"]+)"/g)].map(m=>m[1]);
for(const src of srcs)assert.ok(fs.existsSync(path.join(root,src.slice(1))),"Missing local image: "+src);
for(const slug of ["boxed-blue-evil-eye-bracelet","cluster-gift-ring","minimal-heart-pendant","bow-love-earrings","boxed-evil-eye-bracelet"]){
 assert.ok(catalog.includes('slug: "'+slug+'"'),"Missing referenced catalogue item: "+slug);
}
for(const label of ["Earrings","Necklaces","Rings","Bracelets","Gift Sets"]){
 assert.ok(app.includes('["'+label+'",'),"Missing category: "+label);
}
let depth=0;for(const c of css){if(c==="{")depth++;if(c==="}")depth--;assert.ok(depth>=0,"Bad CSS braces");}
assert.equal(depth,0,"Unbalanced CSS");
console.log("SHIVARA cream final static checks: PASS ("+srcs.length+" actual local image references; 5 real catalogue categories)");
