const db = window.__qaDB;
const listeners = [];
export const collection = (_, name) => ({ name });
export const doc = (_, name, id) => ({ name, id });
function snapshot(ref) {
  if (ref.id) return { id: ref.id, exists: () => !!db[ref.name]?.[ref.id], data: () => db[ref.name]?.[ref.id] };
  const docs = Object.entries(db[ref.name] || {}).map(([id, data]) => ({ id, data: () => data }));
  return { docs, empty: !docs.length, size: docs.length, metadata: { fromCache: false, hasPendingWrites: false }, forEach: fn => docs.forEach(fn), docChanges: () => docs.map(doc => ({ type: 'added', doc })) };
}
export function onSnapshot(ref, callback) {
  const subscription = { ref, callback };
  listeners.push(subscription);
  queueMicrotask(() => callback(snapshot(ref)));
  return () => listeners.splice(listeners.indexOf(subscription), 1);
}
export async function setDoc(ref, data, options) {
  db[ref.name] ||= {};
  db[ref.name][ref.id] = options?.merge ? { ...db[ref.name][ref.id], ...data } : data;
  localStorage.setItem('__qaDB', JSON.stringify(db));
  listeners.filter(item => item.ref.name === ref.name).forEach(item => item.callback(snapshot(item.ref)));
}
export async function deleteDoc(ref) {
  delete db[ref.name]?.[ref.id];
  localStorage.setItem('__qaDB', JSON.stringify(db));
  listeners.filter(item => item.ref.name === ref.name).forEach(item => item.callback(snapshot(item.ref)));
}
export const getDoc = async ref => snapshot(ref);
export const getDocFromServer = getDoc;
export const getDocsFromServer = async ref => snapshot(ref);
export const getDocs = getDocsFromServer;
export const serverTimestamp = () => new Date().toISOString();
