// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;