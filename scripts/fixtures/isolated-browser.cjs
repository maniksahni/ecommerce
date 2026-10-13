// Test-only transport. Auth and records stay in the browser, never in Firebase.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");

const authFixture = `
import { auth } from '/src/firebase.js';
const listeners = [];
export function onAuthStateChanged(_, listener) {
  listeners.push(listener);
  queueMicrotask(() => listener(auth.currentUser));
  return () => listeners.splice(listeners.indexOf(listener), 1);
}
export async function signInWithEmailAndPassword(target) {
  const user = {
    uid: 'isolated-admin', email: 'admin@shivaragroup.com',
    getIdTokenResult: async () => ({ claims: { admin: true, email: 'admin@shivaragroup.com' } })
  };
  auth.currentUser = target.currentUser = user;
  listeners.forEach(listener => listener(user));
  return { user };
}
export async function signOut() {
  auth.currentUser = null;
  listeners.forEach(listener => listener(null));
}
`;

const adminFirestoreFixture = `
export const query = ref => ref;
export const orderBy = () => ({});
export function writeBatch() {
  const operations = [];
  const batch = {
    set: (...args) => { operations.push(() => setDoc(...args)); return batch; },
    delete: (...args) => { operations.push(() => deleteDoc(...args)); return batch; },
    update: (ref, data) => { operations.push(() => setDoc(ref, data, { merge: true })); return batch; },
    commit: async () => { for (const operation of operations) await operation(); }
  };
  return batch;
}
`;

async function install(context) {
  const products = require("../catalog-lib").loadCatalog().catalogApi.getAllProducts();
  await context.addInitScript((records) => {
    window.__qaDB = {
      products: Object.fromEntries(records.map(product => [product.id, product])),
      inventory: {}, categories: {}, coupons: { QA: { code: "QA", isActive: false } },
      banners: {}, admin_settings: {}, orders: {}, order_tracking: {}, customers: {}
    };
  }, products);
  const fulfill = (body) => (route) => route.fulfill({ contentType: "text/javascript", body });
  await context.route("**/src/firebase.js", fulfill(
    "export const db={}; export const auth=window.__qaAuth ||= {currentUser:null};"
  ));
  const firestoreFixture = fs.readFileSync(path.join(__dirname, "firestore-browser.js"), "utf8");
  await context.route("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js",
    fulfill(firestoreFixture + adminFirestoreFixture));
  await context.route("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js", fulfill(authFixture));
  // Fail closed if a test accidentally attempts a production data/auth request.
  await context.route("**/firestore.googleapis.com/**", route => route.abort());
  await context.route("**/identitytoolkit.googleapis.com/**", route => route.abort());
}

module.exports = { install };
