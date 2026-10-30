import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import config from '../firebase-applet-config.json';

try {
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);

  // Enable offline cache persistence for Firestore if available
  try {
    enableIndexedDbPersistence(db).catch(() => {
      // Multiple tabs or browser unsupported, silent fallback
    });
  } catch (e) { }

  const auth = getAuth(app);
  signInAnonymously(auth).catch(() => {
    // If anonymous auth is not configured, Firestore works with rules
  });

  const adapter = {
    raw: db,
    doc(path: string) {
      const dRef = doc(db, path);
      return {
        set(data: any) { return setDoc(dRef, data); },
        delete() { return deleteDoc(dRef); },
        get() { return getDoc(dRef); },
        onSnapshot(onNext: (s: any) => void, onError?: (e: any) => void) {
          return onSnapshot(dRef, onNext, onError);
        }
      };
    },
    collection(path: string) {
      const cRef = collection(db, path);
      return {
        onSnapshot(onNext: (s: any) => void, onError?: (e: any) => void) {
          return onSnapshot(cRef, onNext, onError);
        }
      };
    }
  };

  (window as any).__firebaseDB = adapter;
  if (typeof (window as any).__onCloudDbInit === 'function') {
    (window as any).__onCloudDbInit(adapter);
  }
  window.dispatchEvent(new CustomEvent('cloud-db-ready', { detail: adapter }));
} catch (e) {
  console.error('Firebase init error:', e);
}
