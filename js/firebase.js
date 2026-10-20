import { FIREBASE_CONFIG } from './config.js';

let app, auth, db;
export async function initializeFirebase() {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId || !FIREBASE_CONFIG.appId) throw new Error('Firebase is not configured. Set FIREBASE_CONFIG in js/config.js.');
  if (app) return { app, auth, db };
  const sdk = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([import(`${sdk}firebase-app.js`),import(`${sdk}firebase-auth.js`),import(`${sdk}firebase-firestore.js`)]);
  app = appSdk.initializeApp(FIREBASE_CONFIG); auth = authSdk.getAuth(app); db = firestoreSdk.getFirestore(app);
  return { app, auth, db, authSdk, firestoreSdk };
}
export async function register(email,password,displayName) { const x=await initializeFirebase(); const credential=await x.authSdk.createUserWithEmailAndPassword(x.auth,email,password); if(displayName)await x.authSdk.updateProfile(credential.user,{displayName}); await x.firestoreSdk.setDoc(x.firestoreSdk.doc(x.db,'users',credential.user.uid),{displayName:displayName||'',email,createdAt:x.firestoreSdk.serverTimestamp(),preferences:{theme:'dark'}}); return credential.user; }
export async function login(email,password) { const x=await initializeFirebase(); return (await x.authSdk.signInWithEmailAndPassword(x.auth,email,password)).user; }
export async function logout() { const x=await initializeFirebase(); return x.authSdk.signOut(x.auth); }
export async function resetPassword(email) { const x=await initializeFirebase(); return x.authSdk.sendPasswordResetEmail(x.auth,email); }
export async function savePrivateDocument(collection,id,data) { const x=await initializeFirebase(); const uid=x.auth.currentUser?.uid; if(!uid)throw new Error('Sign in first.'); await x.firestoreSdk.setDoc(x.firestoreSdk.doc(x.db,collection,id),{...data,ownerUid:uid,updatedAt:x.firestoreSdk.serverTimestamp()},{merge:true}); }
export async function watchUser(callback) { const x=await initializeFirebase(); return x.authSdk.onAuthStateChanged(x.auth,callback); }
export async function saveUploadedTrack(track) { const x=await initializeFirebase(); const uid=x.auth.currentUser?.uid; if(!uid)throw new Error('Sign in to publish an upload.'); const ref=x.firestoreSdk.doc(x.db,'tracks',crypto.randomUUID()); await x.firestoreSdk.setDoc(ref,{ownerUid:uid,title:track.title,artist:track.artist,album:track.album||'Single',genre:track.genre||'',releaseYear:track.releaseYear||null,duration:track.duration||0,audioUrl:track.audioUrl,audioPublicId:track.audioPublicId,artworkUrl:track.artworkUrl||'',artworkPublicId:track.artworkPublicId||'',source:'upload',license:'Uploaded by owner',createdAt:x.firestoreSdk.serverTimestamp(),visibility:'private'}); return ref.id; }
export async function getMyTracks() { const x=await initializeFirebase(); const uid=x.auth.currentUser?.uid; if(!uid)return []; const q=x.firestoreSdk.query(x.firestoreSdk.collection(x.db,'tracks'),x.firestoreSdk.where('ownerUid','==',uid)); const snap=await x.firestoreSdk.getDocs(q); return snap.docs.map(doc=>{const d=doc.data();return {...d,id:`firebase:${doc.id}`,source:'Your upload',artwork:d.artworkUrl||''};}); }
