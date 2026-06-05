import { initializeApp, FirebaseApp, getApp, getApps } from "firebase/app";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getIdToken } from "firebase/auth";

let app: FirebaseApp | null = null;

export function initFirebase() {
  if (typeof window === "undefined") return null;
  if (getApps().length) return getApp();

  const { VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_STORAGE_BUCKET) {
    return null;
  }

  const config = {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(config);
  return app;
}

export function getFirebaseApp() {
  return app || (getApps().length ? getApp() : null);
}

export function getFirestoreIfAvailable() {
  const fb = app || (getApps().length ? getApp() : null);
  if (!fb) return null;
  return getFirestore(fb as any);
}

export async function uploadToFirebase(dataUrl: string, fileName: string) {
  const fb = initFirebase();
  if (!fb) throw new Error("Firebase not configured");
  const storage = getStorage(fb as any);
  const bucketPath = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const ref = storageRef(storage, bucketPath);
  // dataUrl should be a data URL like data:image/png;base64,...
  await uploadString(ref, dataUrl, "data_url");
  const url = await getDownloadURL(ref);
  const db = getFirestore(fb as any);
  const doc = {
    url,
    fileName,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "images"), doc as any);
  return { url, id: docRef.id };
}

export async function signInAnonymouslyAndGetToken() {
  if (typeof window === "undefined") return null;
  const fb = initFirebase();
  if (!fb) return null;
  const auth = getAuth(fb as any);
  try {
    const cred = await signInAnonymously(auth as any);
    if (!cred.user) return null;
    const token = await getIdToken(cred.user as any);
    return token;
  } catch (err) {
    console.warn("Anonymous sign-in failed:", err);
    return null;
  }
}
