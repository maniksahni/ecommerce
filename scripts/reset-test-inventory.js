/**
 * Reset test inventory & products — restores Firestore documents
 * drained or altered by automated test suites.
 * Run before smoke-test or any browser E2E test.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = "the-shivara-group-86c9c";
const API_KEY = "AIzaSyBIejOcangE6DzqzW0xrwHDFSMHwAboCt4";

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

async function main() {
  console.log("🔄 Resetting Firestore test inventory & products...");
  const creds = getAdminCredentials();
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig, "inventory-reset");
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, creds.email, creds.password);
  console.log("✓ Authenticated as admin");
  const db = getFirestore(app);

  // Restore inventory documents
  await setDoc(doc(db, "inventory", "SHV-PND-003"), { stock: 999, isSoldOut: false }, { merge: true });
  console.log("✓ Reset inventory/SHV-PND-003 → stock: 999");
  await setDoc(doc(db, "inventory", "tulip-pendant"), { stock: 999, isSoldOut: false }, { merge: true });
  console.log("✓ Reset inventory/tulip-pendant → stock: 999");
  await setDoc(doc(db, "inventory", "SHV-RNG-001"), { stock: 999, isSoldOut: false }, { merge: true });
  console.log("✓ Reset inventory/SHV-RNG-001 → stock: 999");

  // Restore product document prices & availability
  await setDoc(doc(db, "products", "tulip-pendant"), { price: 299, isSoldOut: false }, { merge: true });
  console.log("✓ Reset products/tulip-pendant → price: 299, isSoldOut: false");
  await setDoc(doc(db, "products", "halo-gift-ring"), { price: 399, isSoldOut: false }, { merge: true });
  console.log("✓ Reset products/halo-gift-ring → price: 399, isSoldOut: false");

  // Also reset local admin-inventory.json
  const inventoryFile = path.resolve(__dirname, "../admin-inventory.json");
  const inv = JSON.parse(fs.readFileSync(inventoryFile, "utf8"));
  inv["SHV-PND-003"] = 999;
  inv["SHV-RNG-001"] = 999;
  inv["halo-gift-ring"] = 999;
  fs.writeFileSync(inventoryFile, JSON.stringify(inv, null, 2) + "\n");
  console.log("✓ Reset admin-inventory.json");

  console.log("\n✅ Inventory and products reset complete. Ready for tests.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed:", err.message);
  process.exit(1);
});
