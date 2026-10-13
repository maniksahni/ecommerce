"use strict";

/**
 * Fail closed on dangling source image links before a Firebase Hosting release.
 * Catches filenames that npm build previously copied without verifying.
 * Never guesses, renames, or replaces actual catalogue photography.
 *
 * Usage: npm run test:assets
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const roots = [
  "index.html",
  "product.html",
  "shop-data.js",
  "catalog-overrides.js",
  "catalog-supplement.js",
  "catalog-data.js",
  "script.js",
  "approved-storefront.js",
  "storefront-renderer.js",
  "video-commerce.js",
  "shivara-cream-final.css",
  "shivara-header-glow-fix.css",
  "shivara-reference-match.css",
];
const sourceDirectories = ["src", "app", "components", "data", "config"];
const acceptedExtensions = /\.(?:html?|css|js|jsx|ts|tsx|json)$/i;
const excludes = new Set([
  "node_modules", "dist", "artifacts", "vendor", ".git",
  ".firebase", "design-reference", "tests", "__tests__",
]);
const inspected = new Set();
const missing = [];

function inspectFile(relative) {
  if (!acceptedExtensions.test(relative)) return;
  if (inspected.has(relative)) return;
  inspected.add(relative);
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return;
  const text = fs.readFileSync(absolute, "utf8");
  // Only literal local asset paths; all dynamic products are covered separately
  // by the existing catalogue audit and UI/broken-image checks.
  const pattern = /(?:^|[^a-z\d_])\/?(assets\/[a-z\d_.\-\/%()+@]+\.(?:jpg|jpeg|png|webp|avif|svg))/gim;
  for (const match of text.matchAll(pattern)) {
    const local = match[1];
    if (fs.existsSync(path.join(root, local))) continue;
    const dir = path.dirname(path.join(root, local));
    const prefix = path.basename(local).match(/^post-\d{3}-/i)?.[0];
    let possible = [];
    if (prefix && fs.existsSync(dir)) {
      possible = fs.readdirSync(dir).filter(name => name.startsWith(prefix)).slice(0, 5);
    }
    missing.push({ source: relative, path: local, possible });
  }
}

function visit(relative, depth = 0) {
  if (depth > 5) return;
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  if (fs.statSync(absolute).isDirectory()) {
    for (const name of fs.readdirSync(absolute)) {
      if (excludes.has(name)) continue;
      visit(path.join(relative, name), depth + 1);
    }
  } else {
    inspectFile(relative);
  }
}

roots.forEach(inspectFile);
sourceDirectories.forEach(directory => visit(directory));
const unique = [...new Map(missing.map(item => [item.source + "::" + item.path, item])).values()];
if (unique.length) {
  console.error("\nSHIVARA image audit failed. Missing image references:");
  for (const { source, path: missingPath, possible } of unique) {
    console.error(" - " + source + " -> " + missingPath);
    if (possible.length) {
      console.error("   Existing files with the same post number: " +
        possible.join(", "));
      console.error("   Confirm the intended product/post ID before changing the reference.");
    }
  }
  console.error("Firebase Hosting deploy is BLOCKED until the source media is resolved.");
  process.exitCode = 1;
} else {
  console.log("SHIVARA image audit PASS (" + inspected.size + " source files checked).");
}
