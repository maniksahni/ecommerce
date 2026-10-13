"use strict";
/* Header collision & warm-glow regression test (source check; no browser).
   To verify pixels also run npm run test:approved in a served local checkout. */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const page=read("index.html");
const build=read("scripts/netlify-build.js");
const css=read("shivara-header-glow-fix.css");
const application=read("script.js");
assert.match(page,/shivara-header-glow-fix\.css\?v=\d+/,"homepage hotfix stylesheet missing");
assert(build.includes('"shivara-header-glow-fix.css"'),"production build omits hotfix stylesheet");
assert(page.indexOf("shivara-header-glow-fix.css")>page.indexOf("shivara-cream-final.css"),
  "hotfix must load after the approved cream-gold theme");
assert(page.includes('class="catalog-stable approved-storefront shivara-cream-final"'),
  "the scoped cream-gold body class was changed unexpectedly");
for(const token of ["grid-template-columns: max-content minmax(0, 1fr) max-content",
  ".stable-header > .stable-logo",".stable-header > .stable-nav",
  ".stable-header > .stable-header__actions",
  '[data-nav-category="new-arrivals"]',
  '[data-nav-category="earrings"]',
  '[data-nav-category="neckwear"]',
  '[data-nav-category="rings"]',
  '[data-nav-category="bracelets"]',
  ".stable-nav > a[data-nav-category]:not(",
  "min-width: 1101px",
  "max-width: 767px",
  "mix-blend-mode: screen",
  "brightness(1.12)"]){
  assert(css.includes(token),"Missing a header/glow fix rule: "+token);
}
assert(application.includes("renderCategoriesNavigationRealtime"),
  "Existing realtime category functionality must remain intact");
assert(page.includes("A Love Story<br><em>in Every Design</em>"),
  "Original approved brand tagline changed");
let braces=0;for(const ch of css){
  if(ch==="{")braces++;
  if(ch==="}")braces--;
  assert(braces>=0,"Extra CSS closing brace");
}
assert.equal(braces,0,"Unbalanced CSS braces");
console.log("SHIVARA header/glow static regression: PASS");
