"use client";
import {
  ADMIN_EMAILS,
  SEED_ADMIN,
  auth as fbAuth,
  firebaseEnabled,
} from "@/lib/firebase";
import { ensureUserDoc } from "@/lib/users";
import { AppUser } from "@/types";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
  updateProfile,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  // Passwordless email link (the "OTP" in our UX)
  requestOtp: (email: string) => Promise<{ devCode?: string; viaEmailLink?: boolean }>;
  verifyOtp: (email: string, code: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

const LS_USER = "doozy_user";
const LS_MOCK_DB = "doozy_mock_users";
const LS_EMAILLINK_EMAIL = "doozy_emaillink_email";

type MockUserRecord = { password: string; name: string };

const readMockDb = (): Record<string, MockUserRecord> => {
  try {
    return JSON.parse(localStorage.getItem(LS_MOCK_DB) || "{}");
  } catch {
    return {};
  }
};
const writeMockDb = (db: Record<string, MockUserRecord>) => {
  try {
    localStorage.setItem(LS_MOCK_DB, JSON.stringify(db));
  } catch {}
};
const roleFor = (email: string): AppUser["role"] =>
  ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";

const seedAdmin = () => {
  const db = readMockDb();
  if (!db[SEED_ADMIN.email]) {
    db[SEED_ADMIN.email] = { password: SEED_ADMIN.password, name: "Admin" };
    writeMockDb(db);
  }
};

const FATAL_FB_CODES = new Set([
  "auth/configuration-not-found",
  "auth/api-key-not-valid",
  "auth/invalid-api-key",
  "auth/network-request-failed",
  "auth/project-not-found",
]);
const friendlyError = (e: any): string => {
  const code = (e?.code as string) || "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password",
    "auth/wrong-password": "Incorrect password",
    "auth/user-not-found": "No account found with that email",
    "auth/email-already-in-use": "Account already exists. Sign in instead.",
    "auth/weak-password": "Password should be at least 6 characters",
    "auth/invalid-email": "Invalid email address",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/operation-not-allowed":
      "This sign-in method isn't enabled in Firebase Auth → Sign-in method.",
    "auth/expired-action-code": "Sign-in link expired. Request a new one.",
    "auth/invalid-action-code": "Invalid sign-in link.",
  };
  return map[code] || e?.message || "Something went wrong";
};

const emailLinkActionSettings = () => ({
  url:
    (typeof window !== "undefined" ? window.location.origin : "") +
    "/login?mode=emailLink",
  handleCodeInApp: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(!firebaseEnabled);
  const seeded = useRef(false);

  // Initial setup
  useEffect(() => {
    if (!seeded.current) {
      seedAdmin();
      seeded.current = true;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      if (firebaseEnabled && fbAuth && !mockMode) {
        try {
          // Persistent sessions across reloads/tabs
          await setPersistence(fbAuth, browserLocalPersistence);

          // Complete Email Link sign-in if we landed via the magic link
          try {
            if (
              typeof window !== "undefined" &&
              isSignInWithEmailLink(fbAuth, window.location.href)
            ) {
              const email =
                window.localStorage.getItem(LS_EMAILLINK_EMAIL) ||
                window.prompt("Please confirm your email to complete sign-in:") ||
                "";
              if (email) {
                await signInWithEmailLink(fbAuth, email, window.location.href);
                window.localStorage.removeItem(LS_EMAILLINK_EMAIL);
                // Clean the URL of auth params
                const clean = new URL(window.location.href);
                clean.search = "";
                window.history.replaceState({}, document.title, clean.toString());
              }
            }
          } catch (e: any) {
            console.warn("[Auth] email link finalize:", e);
          }

          unsub = onAuthStateChanged(
            fbAuth,
            async (u) => {
              if (u) {
                const email = (u.email || "").toLowerCase();
                const displayName =
                  u.displayName || email.split("@")[0];
                // Ensure users/{uid} exists & get authoritative role
                let role: AppUser["role"] = "user";
                try {
                  role = await ensureUserDoc({
                    uid: u.uid,
                    email,
                    name: displayName,
                  });
                } catch {
                  role = roleFor(email);
                }
                setUser({
                  uid: u.uid,
                  email,
                  name: displayName,
                  role,
                  createdAt: Date.now(),
                });
              } else {
                setUser(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn("[Auth] listener failed:", err);
              setMockMode(true);
              setLoading(false);
            }
          );
        } catch (e) {
          console.warn("[Auth] setup failed, switching to mock:", e);
          setMockMode(true);
        }
      } else {
        // Mock path
        try {
          const raw = localStorage.getItem(LS_USER);
          if (raw) {
            const parsed = JSON.parse(raw) as AppUser;
            parsed.role = roleFor(parsed.email);
            setUser(parsed);
          }
        } catch {}
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [mockMode]);

  const persist = (u: AppUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(LS_USER, JSON.stringify(u));
      else localStorage.removeItem(LS_USER);
    } catch {}
  };

  // ── Mock auth helpers ──
  const mockSignIn = (email: string, password: string) => {
    seedAdmin();
    const e = email.toLowerCase().trim();
    const db = readMockDb();
    const rec = db[e];
    if (!rec) throw new Error("No account found with that email");
    if (rec.password !== password) throw new Error("Incorrect password");
    persist({
      uid: "mock-" + e,
      email: e,
      name: rec.name,
      role: roleFor(e),
      createdAt: Date.now(),
    });
  };
  const mockSignUp = (email: string, password: string, name: string) => {
    seedAdmin();
    const e = email.toLowerCase().trim();
    const db = readMockDb();
    if (db[e]) throw new Error("Account already exists. Sign in instead.");
    db[e] = { password, name };
    writeMockDb(db);
    persist({
      uid: "mock-" + e,
      email: e,
      name,
      role: roleFor(e),
      createdAt: Date.now(),
    });
  };

  // ── Public API ──
  const signIn = async (email: string, password: string) => {
    if (firebaseEnabled && fbAuth && !mockMode) {
      try {
        await signInWithEmailAndPassword(fbAuth, email, password);
        return;
      } catch (e: any) {
        if (FATAL_FB_CODES.has(e?.code)) {
          setMockMode(true);
          mockSignIn(email, password);
          return;
        }
        throw new Error(friendlyError(e));
      }
    }
    mockSignIn(email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (firebaseEnabled && fbAuth && !mockMode) {
      try {
        const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        return;
      } catch (e: any) {
        if (FATAL_FB_CODES.has(e?.code)) {
          setMockMode(true);
          mockSignUp(email, password, name);
          return;
        }
        throw new Error(friendlyError(e));
      }
    }
    mockSignUp(email, password, name);
  };

  const signOutUser = async () => {
    if (firebaseEnabled && fbAuth && !mockMode) {
      try {
        await signOut(fbAuth);
      } catch {}
    }
    persist(null);
  };

  // Passwordless: in live mode we send a Firebase Email Link.
  // In mock mode we generate a 6-digit code stored in sessionStorage and
  // surface it to the UI (toast) so testing requires no real mail.
  const OTP_KEY = "doozy_otp";
  const requestOtp = async (email: string) => {
    const e = email.toLowerCase().trim();
    if (!/.+@.+\..+/.test(e)) throw new Error("Enter a valid email");

    if (firebaseEnabled && fbAuth && !mockMode) {
      try {
        await sendSignInLinkToEmail(fbAuth, e, emailLinkActionSettings());
        try { window.localStorage.setItem(LS_EMAILLINK_EMAIL, e); } catch {}
        return { viaEmailLink: true };
      } catch (err: any) {
        if (FATAL_FB_CODES.has(err?.code)) {
          setMockMode(true);
        } else {
          throw new Error(friendlyError(err));
        }
      }
    }
    // Mock fallback / development OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    try {
      sessionStorage.setItem(
        OTP_KEY,
        JSON.stringify({ email: e, code, expires: Date.now() + 10 * 60_000 })
      );
    } catch {}
    console.info(`[DOOZY OTP] ${e}: ${code}`);
    return { devCode: code };
  };

  const verifyOtp = async (email: string, code: string, name?: string) => {
    // Firebase live mode: the Email Link itself signs the user in when they
    // click it — so on this path the user is already signed in by the time
    // they call verifyOtp. No-op if firebase has a user.
    if (firebaseEnabled && fbAuth && !mockMode && fbAuth.currentUser) return;

    // Otherwise, mock verify
    const e = email.toLowerCase().trim();
    let raw = "";
    try { raw = sessionStorage.getItem(OTP_KEY) || ""; } catch {}
    const data = raw ? JSON.parse(raw) : null;
    if (!data) throw new Error("Request a new OTP");
    if (data.email !== e) throw new Error("Email mismatch — request a new OTP");
    if (Date.now() > data.expires) throw new Error("OTP expired");
    if (String(code).trim() !== data.code) throw new Error("Invalid OTP");
    seedAdmin();
    const db = readMockDb();
    if (!db[e]) {
      db[e] = { password: "otp-" + Math.random().toString(36).slice(2), name: name || e.split("@")[0] };
      writeMockDb(db);
    }
    try { sessionStorage.removeItem(OTP_KEY); } catch {}
    persist({
      uid: "mock-" + e,
      email: e,
      name: db[e].name,
      role: roleFor(e),
      createdAt: Date.now(),
    });
  };

  const resetPassword = async (email: string) => {
    const e = email.toLowerCase().trim();
    if (!/.+@.+\..+/.test(e)) throw new Error("Enter a valid email");
    if (firebaseEnabled && fbAuth && !mockMode) {
      try {
        await sendPasswordResetEmail(fbAuth, e);
        return;
      } catch (err: any) {
        if (!FATAL_FB_CODES.has(err?.code)) throw new Error(friendlyError(err));
      }
    }
    // Mock fallback: confirm-only
    console.info(`[DOOZY] Password reset for ${e} (mock mode — no email sent)`);
  };

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      signIn,
      signUp,
      signOutUser,
      requestOtp,
      verifyOtp,
      resetPassword,
    }),
    [user, loading]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
