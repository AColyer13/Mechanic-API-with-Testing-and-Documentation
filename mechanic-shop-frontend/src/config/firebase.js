/**
 * Firebase Configuration
 * Initialize Firebase app and auth
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAja5DUvoRoBHLbhbYgBOOLG9I-_3Gk9cg",
  authDomain: "mechanicshopapi.firebaseapp.com",
  projectId: "mechanicshopapi",
  storageBucket: "mechanicshopapi.firebasestorage.app",
  messagingSenderId: "737481324946",
  appId: "1:737481324946:web:6884876fd318952058e94b",
  measurementId: "G-ZB8VNM5E4Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
