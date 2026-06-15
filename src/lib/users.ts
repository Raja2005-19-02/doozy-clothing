// users/{uid} document — Firestore-driven source of truth for role.
// Bootstrap: if the signed-in email is listed in ADMIN_EMAILS env (or matches
// SEED_ADMIN.email), we auto-set role:"admin" on first sign-in.

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ADMIN_EMAILS, SEED_ADMIN, db, firebaseEnabled } from "./firebase";

export type UserRole = "user" | "admin";

export interface UserDoc {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  createdAt?: number;
  updatedAt?: number;
}

/** Read users/{uid}.role. Returns "user" if doc/value missing. */
export async function getUserRole(uid: string): Promise<UserRole> {
  if (!firebaseEnabled || !db) return "user";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data() as Partial<UserDoc>;
      return (data.role === "admin" ? "admin" : "user") as UserRole;
    }
  } catch (e) {
    console.warn("[users] getUserRole failed", e);
  }
  return "user";
}

/** Create or update users/{uid}. Bootstraps role:"admin" for whitelisted emails. */
export async function ensureUserDoc(opts: {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
}): Promise<UserRole> {
  if (!firebaseEnabled || !db) {
    // Mock fallback — admin role derived from env list only
    return ADMIN_EMAILS.includes(opts.email.toLowerCase()) ||
      opts.email.toLowerCase() === SEED_ADMIN.email
      ? "admin"
      : "user";
  }
  const ref = doc(db, "users", opts.uid);
  const lowerEmail = opts.email.toLowerCase();
  const shouldBootstrapAdmin =
    ADMIN_EMAILS.includes(lowerEmail) || lowerEmail === SEED_ADMIN.email;

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const role: UserRole = shouldBootstrapAdmin ? "admin" : "user";
      await setDoc(ref, {
        uid: opts.uid,
        email: lowerEmail,
        name: opts.name || lowerEmail.split("@")[0],
        phone: opts.phone || "",
        role,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return role;
    }
    // Existing doc — promote to admin if env says so but doc says otherwise.
    const data = snap.data() as Partial<UserDoc>;
    if (shouldBootstrapAdmin && data.role !== "admin") {
      await updateDoc(ref, { role: "admin", updatedAt: Date.now() });
      return "admin";
    }
    // Touch profile fields the user may have updated since
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (opts.name && opts.name !== data.name) patch.name = opts.name;
    if (opts.phone && opts.phone !== data.phone) patch.phone = opts.phone;
    if (Object.keys(patch).length > 1) {
      try { await updateDoc(ref, patch); } catch {}
    }
    return (data.role === "admin" ? "admin" : "user") as UserRole;
  } catch (e) {
    console.warn("[users] ensureUserDoc failed", e);
    return shouldBootstrapAdmin ? "admin" : "user";
  }
}
