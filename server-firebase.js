const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "the-shivara-group-86c9c";

let adminApp = null;
let adminDb = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
  } else {
    // Automatically uses Application Default Credentials (ADC) in Google Cloud Run / environment
    adminApp = initializeApp({
      projectId: PROJECT_ID
    });
  }
  return adminApp;
}

function getAdminFirestore() {
  if (adminDb) return adminDb;
  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

/**
 * Execute atomic checkout transaction in Firestore using Firebase Admin SDK:
 * 1. Checks inventory for all items in the transaction
 * 2. Prevents overselling (throws 409 if insufficient)
 * 3. Atomically decrements inventory
 * 4. Updates product isSoldOut status if stock hits 0
 * 5. Creates private orders document
 * 6. Creates sanitized order_tracking document
 * Entire transaction fails atomically if any check fails.
 */
async function processOrderTransaction({
  orderDocument,
  trackingDocument,
  itemsToValidate
}) {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. Transactional reads of all inventory documents
    const invReads = [];
    for (const item of itemsToValidate) {
      const invKey = item.sku || item.productId || item.slug;
      const invRef = db.collection("inventory").doc(invKey);
      invReads.push({ item, invKey, invRef });
    }

    const invSnapshots = await Promise.all(invReads.map(r => transaction.get(r.invRef)));

    // 2. Validate sufficient inventory under concurrency
    const inventoryUpdates = [];
    for (let i = 0; i < invReads.length; i++) {
      const { item, invKey, invRef } = invReads[i];
      const snap = invSnapshots[i];
      let currentStock = 5;
      if (snap.exists) {
        const data = snap.data();
        currentStock = Number(data?.stock !== undefined ? data.stock : 0);
      }

      if (currentStock < item.quantity) {
        const err = new Error(`Insufficient stock for "${item.title}". Only ${currentStock} available.`);
        err.statusCode = 409;
        throw err;
      }

      const nextStock = Math.max(0, currentStock - item.quantity);
      const isSoldOut = nextStock === 0;

      inventoryUpdates.push({
        invKey,
        invRef,
        nextStock,
        isSoldOut,
        productId: item.productId || item.slug
      });
    }

    // 3. Transactional writes: Inventory decrement
    for (const update of inventoryUpdates) {
      transaction.set(update.invRef, {
        stock: update.nextStock,
        isSoldOut: update.isSoldOut,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // If key differs from productId, also sync productId document
      if (update.productId && update.productId !== update.invKey) {
        const prodInvRef = db.collection("inventory").doc(update.productId);
        transaction.set(prodInvRef, {
          stock: update.nextStock,
          isSoldOut: update.isSoldOut,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      // If sold out, update product catalog document
      if (update.isSoldOut && update.productId) {
        const prodRef = db.collection("products").doc(update.productId);
        transaction.set(prodRef, {
          isSoldOut: true,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    // 4. Transactional writes: Orders document
    const orderRef = orderDocument.orderId || orderDocument.id;
    const orderDocRef = db.collection("orders").doc(orderRef);
    transaction.set(orderDocRef, {
      ...orderDocument,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 5. Transactional writes: Sanitized Tracking document
    if (trackingDocument) {
      const trackingDocRef = db.collection("order_tracking").doc(orderRef);
      transaction.set(trackingDocRef, {
        ...trackingDocument,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return {
      orderId: orderRef,
      inventoryUpdates
    };
  });
}

/**
 * Backward compatibility sync function
 */
async function syncOrderToFirestore(orderDocument, trackingDocument, inventoryUpdates = []) {
  try {
    const db = getAdminFirestore();
    const orderRef = orderDocument.orderId || orderDocument.id;

    if (orderRef) {
      await db.collection("orders").doc(orderRef).set({
        ...orderDocument,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      if (trackingDocument) {
        await db.collection("order_tracking").doc(orderRef).set({
          ...trackingDocument,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    for (const item of inventoryUpdates) {
      if (item.invKey) {
        await db.collection("inventory").doc(item.invKey).set({
          stock: item.nextStock,
          isSoldOut: item.isSoldOut,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        if (item.isSoldOut && item.productId) {
          try {
            await db.collection("products").doc(item.productId).set({
              isSoldOut: true,
              updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
          } catch {}
        }
      }
    }
    return true;
  } catch (err) {
    console.warn("[Firebase Admin Sync]:", err.message);
    return false;
  }
}

module.exports = {
  getAdminFirestore,
  processOrderTransaction,
  syncOrderToFirestore,
  PROJECT_ID
};
