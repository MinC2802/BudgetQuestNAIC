import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import.meta.env.VITE_FIREBASE_API_KEY
console.log("Check 1 (Next):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("Check 2 (Vite):", import.meta.env?.VITE_FIREBASE_API_KEY);
console.log("Check 3 (All Env):", process.env);
console.log("Checking API Key:", meta.env.VITE_FIREBASE_API_KEY);
const firebaseConfig = {
  apiKey:meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "budgetquest-e2e34.firebaseapp.com",
  projectId: "budgetquest-e2e34",
  storageBucket: "budgetquest-e2e34.firebasestorage.app",
  messagingSenderId: "29982819286",
  appId: "1:29982819286:web:9c837d89ac8a586ea8da77",
  measurementId: "G-9SMD8B5ZJY"
};

// Replace the JSON import with this object


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence immediately before any operations
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

// Test connection on boot
async function testConnection() {
  try {
    // Attempt to get a dummy doc to verify connection and config
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();
