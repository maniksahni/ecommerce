import { auth, db } from './firebase.js';
import { getDocFromServer, doc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const adminEmails = new Set(['maniksahni@gmail.com', 'admin@shivaragroup.com', 'imperialshivam@gmail.com']);
let verifiedUid = null;

export function adminSessionReady() {
  return Boolean(auth.currentUser && verifiedUid === auth.currentUser.uid);
}

export async function verifyAdminSession(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) throw new Error('Your administrator session has ended. Please sign in again.');
  const token = await user.getIdTokenResult(forceRefresh);
  const email = String(token.claims.email || '').toLowerCase();
  if (token.claims.admin !== true && !adminEmails.has(email)) {
    verifiedUid = null;
    throw new Error('This account does not have administrator access.');
  }
  if (forceRefresh || verifiedUid !== user.uid) {
    // A public products snapshot cannot prove that this session may administer the shop.
    await getDocFromServer(doc(db, 'customers', 'admin-session-permission-probe'));
    if (auth.currentUser?.uid !== user.uid) throw new Error('Your session changed. Please sign in again.');
    verifiedUid = user.uid;
  }
  return user;
}

export async function runAdminWrite(operation) {
  await verifyAdminSession();
  try {
    return await operation();
  } catch (error) {
    if (error.code !== 'permission-denied') throw error;
    // Refresh expired credentials once; never turn a rejected write into a local success.
    verifiedUid = null;
    await verifyAdminSession(true);
    return await operation();
  }
}
