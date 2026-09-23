import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC9Yu4WJ_f5fD079OfDUPRJZWX0lPhHBaU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "conteo-panol.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "conteo-panol",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "conteo-panol.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "516970206987",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:516970206987:web:54ff818025cbe19529b40e"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.projectId !== 'undefined'
);

let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(app);
  } catch (error) {
    console.warn('Error inicializando Firebase SDK:', error);
    dbInstance = null;
  }
}

// Exportar la base de datos (Firestore o null si no está configurado)
export const db = dbInstance as Firestore;

export async function testFirebaseConnection(): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    await Promise.race([
      getDoc(doc(db, 'settings', 'global')),
      timeoutPromise
    ]);
    return true;
  } catch {
    return false;
  }
}
