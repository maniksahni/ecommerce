// Runs only against local Firebase emulators; never connects to production.
const assert = require('node:assert/strict');
const {initializeApp, deleteApp} = require('firebase/app');
const {getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} = require('firebase/auth');
const {getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc, onSnapshot, runTransaction, terminate} = require('firebase/firestore');
async function main() {
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-shivara-grpc');
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
  const app = initializeApp({projectId:'demo-shivara-grpc', apiKey:'emulator-only-key'});
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {disableWarnings:true});
  const db = getFirestore(app);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  const product = doc(db, 'products', 'grpc-compatibility-test');
  try {
    await assert.rejects(setDoc(product, {stock:2}), {code:'permission-denied'});
    console.log('PASS unauthenticated product write rejected');
    await createUserWithEmailAndPassword(auth, 'imperialshivam@gmail.com', 'emulator-test-password');
    await setDoc(product, {title:'Local fixture', stock:2});
    assert.equal((await getDoc(product)).data().stock, 2);
    console.log('PASS admin auth and Firestore write/read');
    let stop;
    const updated = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Realtime update timed out')), 10000);
      stop = onSnapshot(product, snap => {
        if (snap.data()?.stock === 1) {clearTimeout(timer);resolve();}
      }, error => {clearTimeout(timer);reject(error);});
    });
    await runTransaction(db, async tx => {const snap = await tx.get(product);tx.update(product, {stock:snap.data().stock-1});});
    await updated; stop();
    console.log('PASS transaction and realtime listener');
    await deleteDoc(product);
    assert.equal((await getDoc(product)).exists(), false);
    console.log('PASS admin delete');
    await signOut(auth);
    await assert.rejects(setDoc(product, {stock:2}), {code:'permission-denied'});
    console.log('PASS sign-out revokes write access');
    await signInWithEmailAndPassword(auth, 'imperialshivam@gmail.com', 'emulator-test-password');
    await setDoc(product, {stock:3});
    assert.equal((await getDoc(product)).data().stock, 3);
    await deleteDoc(product);
    console.log('PASS fresh admin sign-in restores read/write access');
  } finally {await terminate(db);await deleteApp(app);}
}
main().catch(error => {console.error(error);process.exitCode=1;});
