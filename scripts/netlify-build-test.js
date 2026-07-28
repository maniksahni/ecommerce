const fs = require("node:fs");
const path = require("node:path");
const { loadCatalog } = require("./catalog-lib");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const { catalogApi } = loadCatalog();
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`PASS: ${message}`);
  else {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
}

const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
check(home.includes('name="shivara-build"'), "homepage contains deployment build stamp");
check(!home.includes("experience.js") && !home.includes("motion-controller.js"), "retired motion bundles remain absent");
check(fs.existsSync(path.join(dist, "products/tulip-pendant/index.html")), "readable product routes are generated");
check(fs.existsSync(path.join(dist, "collections/rings/index.html")), "readable collection routes are generated");
check(!fs.existsSync(path.join(dist, "products/packaging-little-happiness/index.html")), "social content cannot receive a product route");
check(fs.existsSync(path.join(dist, "404.html")), "static 404 page is generated");
check(fs.existsSync(path.join(dist, "_headers")), "Netlify deployment headers are generated");
const redirects = fs.readFileSync(path.join(dist, "_redirects"), "utf8");
check(redirects.includes("/collections/rings /collections/rings/index.html 200!"), "collection routes bypass directory redirects");
check(redirects.includes("/products/DW3H_GZDD_4 /products/boxed-evil-eye-bracelet 301!"), "verified legacy IDs redirect to curated slugs");
check(
  catalogApi.getAllProducts().every((product) => fs.existsSync(path.join(dist, `products/${product.slug}/index.html`))),
  "every curated product has a static route"
);

if (failures) process.exitCode = 1;
else console.log(`Netlify build verification passed for ${catalogApi.getAllProducts().length} products.`);
