import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration as a fallback
import firebaseConfigFallback from './firebase-applet-config.json';

// Helper to safely access environment variables
const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Silently fail for env access
  }
  return undefined;
};

// Safely access environment variables with fallback to JSON config
const getFirebaseConfig = () => {
  const config = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || firebaseConfigFallback.apiKey,
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfigFallback.authDomain,
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfigFallback.projectId,
    appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfigFallback.appId,
    firestoreDatabaseId: getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || firebaseConfigFallback.firestoreDatabaseId
  };

  // Log configuration (excluding API key) for debugging
  console.log("Firebase Configuration initialized:", {
    projectId: config.projectId,
    authDomain: config.authDomain,
    appId: config.appId,
    firestoreDatabaseId: config.firestoreDatabaseId,
    usingFallback: !getEnv('VITE_FIREBASE_API_KEY')
  });

  // Log errors if critical keys are missing
  if (!config.apiKey) console.error("Firebase API Key is missing. Please check your environment variables.");
  if (!config.projectId) console.error("Firebase Project ID is missing. Please check your environment variables.");

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
        console.error("Firestore connection failed. Please check your Firebase configuration and network status.", error.message);
      } else {
        console.warn("Firestore connection test returned an error (this may be normal if 'test/connection' doesn't exist):", error.message);
      }
    }
  }
}

testConnection();
