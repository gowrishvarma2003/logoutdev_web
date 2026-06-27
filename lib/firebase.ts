import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());

    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    }
  }
  return auth;
}

export async function loginWithGoogle(): Promise<string> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user.getIdToken();
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

export { GoogleAuthProvider };
