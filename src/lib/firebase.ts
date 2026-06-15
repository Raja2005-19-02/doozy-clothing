// Firebase client init.
// Live mode when env vars are present AND NEXT_PUBLIC_USE_MOCK != "true".
// In dev with no config, the app gracefully runs against an in-memory store.

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const FORCE_MOCK =
  String(process.env.NEXT_PUBLIC_USE_MOCK || "").toLowerCase() === "true";

export const firebaseEnabled =
  !FORCE_MOCK && Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (firebaseEnabled) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(cfg as any);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Analytics is browser-only & needs measurementId
    if (typeof window !== "undefined" && cfg.measurementId) {
      isSupported()
        .then((ok) => {
          if (ok && app) analytics = getAnalytics(app);
        })
        .catch(() => {});
    }
  } catch (e) {
    console.warn("[Firebase] init failed, falling back to mock:", e);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
}

export { app, auth, db, storage, analytics };

// Admin emails are an OPTIONAL bootstrap list — on first sign-in we promote
// these emails to role:"admin" in their users/{uid} document. After that the
// role is read from Firestore as the source of truth.
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "Doozy@rook.com"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const SEED_ADMIN = {
  email: (
    process.env.NEXT_PUBLIC_SEED_ADMIN_EMAIL || "Doozy@rook.com"
  ).toLowerCase(),
  password: process.env.NEXT_PUBLIC_SEED_ADMIN_PASSWORD || "Doozyadmin",
};
