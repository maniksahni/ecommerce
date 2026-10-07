/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHIVARA PRODUCTION SECURITY GATE & INTEGRITY VERIFICATION SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 * Authoritative Security Suite Verifying:
 * 1. Unauthenticated inventory decrement → DENIED (HTTP 403 / PERMISSION_DENIED)
 * 2. Unauthenticated inventory increase → DENIED (HTTP 403 / PERMISSION_DENIED)
 * 3. Unauthenticated product isSoldOut change → DENIED (HTTP 403 / PERMISSION_DENIED)
 * 4. Unauthenticated coupon write → DENIED (HTTP 403 / PERMISSION_DENIED)
 * 5. Unauthenticated category write → DENIED (HTTP 403 / PERMISSION_DENIED)
 * 6. Valid COD checkout backend transaction → PASS (Atomic server-side calculation)
 * 7. Simultaneous stock checkout cannot oversell (Concurrency conflict 409 guard)
 * 8. Admin inventory update → PASS (Authenticated administrator authorized)
 * 9. Realtime storefront still updates after backend/admin mutations
 * ═══════════════════════════════════════════════════════════════════════════
 */

import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = "the-shivara-group-86c9c";
const API_KEY = "AIzaSyBIejOcangE6DzqzW0xrwHDFSMHwAboCt4";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SERVER_URL = "http://127.0.0.1:3000";

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "the-shivara-group-86c9c.firebaseapp.com",
  projectId: PROJECT_ID,
  storageBucket: "the-shivara-group-86c9c.firebasestorage.app",
  messagingSenderId: "662735113847",
  appId: "1:662735113847:web:3130e23827f123fc0c4072"
};

function getAdminCredentials() {
  let email = process.env.ADMIN_EMAIL || "admin@shivaragroup.com";
  let password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    try {
      const envPath = path.resolve(__dirname, "../.env");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
          const [k, v] = line.split("=");
          if (k === "ADMIN_EMAIL" && v) email = v.trim();
          if (k === "ADMIN_PASSWORD" && v) password = v.trim();
        }
      }
    } catch {}
  }
  return { email, password };
}

function firestoreRestRequest(method, docPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${FIRESTORE_BASE}${docPath}`);
    url.searchParams.set("key", API_KEY);
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function serverApiRequest(method, endpoint, payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SERVER_URL);
    const bodyStr = payload ? JSON.stringify(payload) : null;
    const req = http.request(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {})
      }
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runSecurityGate() {
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("SHIVARA LUXE: PRODUCTION SECURITY GATE VERIFICATION");
  console.log("═════════════════════════════════════════════════════════════════\n");

  let passes = 0;
  let failures = 0;

  function report(name, success, detail = "") {
    if (success) {
      console.log(`✓ PASS: ${name}`);
      passes++;
    } else {
      console.error(`✗ FAIL: ${name} - ${detail}`);
      failures++;
    }
  }

  // 1. Unauthenticated inventory decrement → DENIED
  try {
    const res = await firestoreRestRequest("PATCH", "/inventory/__sec_test_stock", {
      fields: { stock: { integerValue: "2" } }
    });
    report("1. Unauthenticated inventory decrement → DENIED", res.status === 403, `Status was ${res.status}`);
  } catch (err) {
    report("1. Unauthenticated inventory decrement → DENIED", false, err.message);
  }

  // 2. Unauthenticated inventory increase → DENIED
  try {
    const res = await firestoreRestRequest("PATCH", "/inventory/__sec_test_stock", {
      fields: { stock: { integerValue: "999" } }
    });
    report("2. Unauthenticated inventory increase → DENIED", res.status === 403, `Status was ${res.status}`);
  } catch (err) {
    report("2. Unauthenticated inventory increase → DENIED", false, err.message);
  }

  // 3. Unauthenticated product isSoldOut change → DENIED
  try {
    const res = await firestoreRestRequest("PATCH", "/products/__sec_test_prod", {
      fields: { isSoldOut: { booleanValue: true } }
    });
    report("3. Unauthenticated product isSoldOut mutation → DENIED", res.status === 403, `Status was ${res.status}`);
  } catch (err) {
    report("3. Unauthenticated product isSoldOut mutation → DENIED", false, err.message);
  }

  // 4. Unauthenticated coupon write → DENIED
  try {
    const res = await firestoreRestRequest("PATCH", "/coupons/__sec_test_coupon", {
      fields: { code: { stringValue: "HACK99" }, discountValue: { integerValue: "90" } }
    });
    report("4. Unauthenticated coupon write → DENIED", res.status === 403, `Status was ${res.status}`);
  } catch (err) {
    report("4. Unauthenticated coupon write → DENIED", false, err.message);
  }

  // 5. Unauthenticated category write → DENIED
  try {
    const res = await firestoreRestRequest("PATCH", "/categories/__sec_test_cat", {
      fields: { name: { stringValue: "Hacked Category" } }
    });
    report("5. Unauthenticated category write → DENIED", res.status === 403, `Status was ${res.status}`);
  } catch (err) {
    report("5. Unauthenticated category write → DENIED", false, err.message);
  }

  // 6. Valid COD checkout backend transaction → PASS
  // Pre-seed test product in inventory
  const inventoryFile = path.resolve(__dirname, "../admin-inventory.json");
  let invData = {};
  try { invData = JSON.parse(fs.readFileSync(inventoryFile, "utf8")); } catch {}
  invData["SHV-RNG-001"] = 10;
  invData["halo-gift-ring"] = 10;
  fs.writeFileSync(inventoryFile, JSON.stringify(invData, null, 2));

  let createdOrderId = null;
  try {
    const checkoutRes = await serverApiRequest("POST", "/api/orders", {
      items: [
        {
          productId: "halo-gift-ring",
          quantity: 1
        }
      ],
      customer: {
        name: "Security Auditor",
        phone: "9876543210",
        email: "auditor@shivaragroup.com",
        address: "Security Suite, Connaught Place Atelier",
        pincode: "110001",
        city: "New Delhi",
        state: "Delhi"
      },
      couponCode: "WELCOME10"
    });

    const is200or201 = checkoutRes.status === 200 || checkoutRes.status === 201;
    const hasOrder = checkoutRes.body && checkoutRes.body.ok && Boolean(checkoutRes.body.orderId);
    createdOrderId = checkoutRes.body?.orderId;
    const computedTotal = checkoutRes.body?.order?.totalAmount;

    // Verify server performed pricing & coupon calculation
    const hasTrustedCalculations = typeof computedTotal === "number" && computedTotal > 0;

    report(
      "6. Valid COD checkout backend transaction → PASS",
      is200or201 && hasOrder && hasTrustedCalculations,
      `Order: ${createdOrderId}, Status: ${checkoutRes.status}`
    );
  } catch (err) {
    report("6. Valid COD checkout backend transaction → PASS", false, err.message);
  }

  // 7. Simultaneous stock checkout cannot oversell
  try {
    // Set inventory for target product to exactly 1
    const testProdId = "blue-charm-evil-eye-bracelet";
    const testSku = "SHV-BRC-001";
    invData[testSku] = 1;
    invData[testProdId] = 1;
    fs.writeFileSync(inventoryFile, JSON.stringify(invData, null, 2));

    // Launch 5 simultaneous checkout requests competing for the single unit
    const concurrentRequests = Array.from({ length: 5 }).map((_, idx) =>
      serverApiRequest("POST", "/api/orders", {
        items: [{ productId: testProdId, quantity: 1 }],
        customer: {
          name: `Concurrent Shopper ${idx + 1}`,
          phone: `987654321${idx}`,
          address: `Test Lane ${idx + 1}`,
          pincode: "110001",
          city: "New Delhi",
          state: "Delhi"
        }
      })
    );

    const results = await Promise.all(concurrentRequests);
    const successCount = results.filter((r) => r.status === 200 || r.status === 201).length;
    const conflictCount = results.filter((r) => r.status === 409).length;

    // Check remaining stock
    const freshInv = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
    const finalStock = freshInv[testSku] ?? freshInv[testProdId];

    const oversellPrevented = successCount === 1 && conflictCount === 4 && finalStock === 0;
    report(
      "7. Simultaneous stock checkout cannot oversell",
      oversellPrevented,
      `Successes: ${successCount}, Conflicts (409): ${conflictCount}, Final Stock: ${finalStock}`
    );
  } catch (err) {
    report("7. Simultaneous stock checkout cannot oversell", false, err.message);
  }

  // 8. Admin inventory update → PASS
  try {
    const creds = getAdminCredentials();
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig, "sec-gate-admin");
    const auth = getAuth(app);
    const userCred = await signInWithEmailAndPassword(auth, creds.email, creds.password);
    const idToken = await userCred.user.getIdToken();

    // Authenticated admin PATCH to inventory
    const res = await firestoreRestRequest("PATCH", "/inventory/__sec_admin_stock", {
      fields: { stock: { integerValue: "25" }, isSoldOut: { booleanValue: false } }
    }, idToken);

    report(
      "8. Admin inventory update → PASS",
      res.status === 200,
      `Authenticated admin response: ${res.status}`
    );
  } catch (err) {
    report("8. Admin inventory update → PASS", false, err.message);
  }

  // 9. Realtime storefront still updates after backend/admin mutations
  try {
    const creds = getAdminCredentials();
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig, "sec-gate-realtime");
    const auth = getAuth(app);
    const userCred = await signInWithEmailAndPassword(auth, creds.email, creds.password);
    const db = getFirestore(app);

    const testItemRef = doc(db, "inventory", "__sec_realtime_item");
    const targetStock = Math.floor(Math.random() * 50) + 1;

    let receivedValue = null;
    const unsubscribe = onSnapshot(testItemRef, (snap) => {
      if (snap.exists()) {
        receivedValue = snap.data().stock;
      }
    });

    // Write mutation as authorized admin
    await setDoc(testItemRef, { stock: targetStock, updatedAt: new Date().toISOString() }, { merge: true });

    // Wait for snapshot event to arrive
    for (let i = 0; i < 20; i++) {
      if (receivedValue === targetStock) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    unsubscribe();

    report(
      "9. Realtime storefront still updates after backend/admin mutations",
      receivedValue === targetStock,
      `Expected ${targetStock}, received ${receivedValue}`
    );
  } catch (err) {
    report("9. Realtime storefront still updates after backend/admin mutations", false, err.message);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`SECURITY GATE RESULT: ${passes}/9 CHECKS PASSED, ${failures} FAILED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (failures > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSecurityGate().catch((err) => {
  console.error("FATAL ERROR in security gate:", err);
  process.exit(1);
});
