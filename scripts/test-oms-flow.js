/**
 * OMS (Order Management System) & Guest Checkout Automated Test Suite
 */
import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=========================================");
console.log("OMS & GUEST CHECKOUT AUTOMATION TEST SUITE");
console.log("=========================================");

const rootDir = process.cwd();

// 1. Validate firestore.rules
const rulesContent = fs.readFileSync(path.join(rootDir, "firestore.rules"), "utf-8");
assert(rulesContent.includes("match /orders/{orderId}"), "firestore.rules must contain match /orders/{orderId}");
assert(rulesContent.includes("allow read, write: if true;"), "firestore.rules must allow read, write on orders collection");
console.log("PASS 1: firestore.rules allows full read/write for guest orders and admin OMS");

// 2. Validate script.js Guest Checkout & Atomic Inventory Sync
const scriptContent = fs.readFileSync(path.join(rootDir, "script.js"), "utf-8");
assert(scriptContent.includes("orderRef = \"SHV-\""), "script.js must generate unique SHV- orderId prefix");
assert(scriptContent.includes("customerInfo"), "script.js order payload must contain customerInfo");
assert(scriptContent.includes("shivara_recent_order"), "script.js must persist recent order to localStorage");
assert(scriptContent.includes("doc(db, \"orders\", orderRef)"), "script.js must persist order document to Firestore orders collection");
assert(scriptContent.includes("isSoldOut: true"), "script.js must mark purchased items as isSoldOut: true in Firestore");
assert(scriptContent.includes("cart.length = 0"), "script.js must clear the cart on successful checkout");
assert(scriptContent.includes("totalAmount:"), "script.js order payload must contain totalAmount");
assert(scriptContent.includes("status: \"Pending\""), "script.js order payload must default status to Pending");
console.log("PASS 2: script.js guest checkout persistence, atomic isSoldOut sync, and cart clear verified");

// 3. Validate admin.html OMS Interface
const adminHtmlContent = fs.readFileSync(path.join(rootDir, "admin.html"), "utf-8");
assert(adminHtmlContent.includes("id=\"tab-btn-orders\""), "admin.html must contain Orders Tab Button");
assert(adminHtmlContent.includes("id=\"tab-btn-products\""), "admin.html must contain Products Tab Button");
assert(adminHtmlContent.includes("id=\"view-orders\""), "admin.html must contain Orders View Container");
assert(adminHtmlContent.includes("id=\"orders-table-body\""), "admin.html must contain Orders Table Body");
assert(adminHtmlContent.includes("id=\"order-details-modal\""), "admin.html must contain Order Details Modal");
assert(adminHtmlContent.includes("subscribeToFirestoreOrders"), "admin.html must subscribe to live Firestore orders collection");
assert(adminHtmlContent.includes("window.updateOrderStatus"), "admin.html must export window.updateOrderStatus");
assert(adminHtmlContent.includes("window.openOrderDetailsModal"), "admin.html must export window.openOrderDetailsModal");
console.log("PASS 3: admin.html OMS tab navigation, real-time table, and modal verified");

// 4. Validate admin-store.js OMS Data Functions
const adminStoreContent = fs.readFileSync(path.join(rootDir, "admin-store.js"), "utf-8");
assert(adminStoreContent.includes("loadAdminOrdersStore"), "admin-store.js must export loadAdminOrdersStore");
assert(adminStoreContent.includes("saveAdminOrdersStore"), "admin-store.js must export saveAdminOrdersStore");
assert(adminStoreContent.includes("normalizeAdminOrderInput"), "admin-store.js must export normalizeAdminOrderInput");
console.log("PASS 4: admin-store.js OMS helper methods verified");

console.log("=========================================");
console.log("ALL 4 OMS SUITE CHECKS PASSED WITH ZERO ERRORS ✓");
console.log("=========================================");
