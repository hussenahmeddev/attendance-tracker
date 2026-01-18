// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkRCc1DMJ9V1q5C8Y8z3Md5HyAwx3KluE",
  authDomain: "attendance-tracker-dcadf.firebaseapp.com",
  projectId: "attendance-tracker-dcadf",
  storageBucket: "attendance-tracker-dcadf.firebasestorage.app",
  messagingSenderId: "643796194168",
  appId: "1:643796194168:web:65f4b5b8973dbc92c96e8d",
  measurementId: "G-E06VD82TNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

// Function to get or initialize a secondary app (for creating users without logging out)
// We need to initialize a separate app instance for creating users
// so we don't overwrite the current user's session
export const getSecondaryApp = () => {
  // Check if secondary app already exists to avoid duplicate initialization
  const secondaryAppName = "secondaryApp";
  const existingApp = getApps().find(app => app.name === secondaryAppName);

  if (existingApp) {
    return existingApp;
  }

  return initializeApp(firebaseConfig, secondaryAppName);
};

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;