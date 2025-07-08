import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

// IMPORTANT: Replace the placeholders below with your own Firebase project configuration.
// You can keep them empty for now and supply real values via environment variables later.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

// Prevent re-initialisation when using hot-reload.
const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
export const auth = getAuth(app);

/**
 * Ensures the user is authenticated anonymously and returns the uid.
 */
export const ensureAnonymousAuth = (): Promise<string> =>
  new Promise((resolve, reject) => {
    onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (user) {
          resolve(user.uid);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            resolve(credential.user.uid);
          } catch (err) {
            reject(err);
          }
        }
      },
      reject
    );
  });