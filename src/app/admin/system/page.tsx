"use client";
import { useAuth } from "@/context/AuthContext";
import {
  analytics,
  app,
  auth as fbAuth,
  db,
  firebaseEnabled,
  storage,
} from "@/lib/firebase";
import { CLOUDINARY, cloudinaryEnabled, uploadImage } from "@/lib/cloudinary";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type CheckState = "idle" | "running" | "ok" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  state: CheckState;
  detail?: string;
}

const COLLECTIONS = [
  "products",
  "users",
  "orders",
  "heroSlides",
  "categories",
  "settings",
  "notifications",
  "reviews",
  "analytics",
];

export default function SystemPage() {
  const { user, isAdmin } = useAuth();
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [counts, setCounts] = useState<Record<string, number | string>>({});
  const [running, setRunning] = useState(false);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const realtimeUnsub = useRef<(() => void) | null>(null);

  const set = (id: string, patch: Partial<Check>) =>
    setChecks((prev) => {
      const existing = prev[id] || { id, label: id, state: "idle" as CheckState };
      return { ...prev, [id]: { ...existing, ...patch, id } };
    });

  // Init all checks as idle
  useEffect(() => {
    const init: Record<string, Check> = {};
    [
      ["env", "Environment variables loaded"],
      ["firebase", "Firebase initialized"],
      ["firestore", "Firestore connected"],
      ["auth", "Authentication connected"],
      ["analytics", "Analytics initialized"],
      ["storage", "Storage available"],
      ["cloudinary", "Cloudinary configured"],
      ["cloudinaryUpload", "Cloudinary upload test"],
      ["currentUser", "Current user"],
      ["adminRole", "Admin role check"],
      ["realtime", "Realtime listener"],
      ["fcm", "FCM (Browser notifications)"],
      ...COLLECTIONS.map((c) => [`coll-${c}`, `Collection: ${c}`] as const),
    ].forEach(([id, label]) => (init[id] = { id, label, state: "idle" }));
    setChecks(init);
  }, []);

  // Run a realtime listener on settings/site
  useEffect(() => {
    if (!firebaseEnabled || !db) return;
    set("realtime", { state: "running", detail: "Subscribing to settings/site…" });
    try {
      const unsub = onSnapshot(
        doc(db, "settings", "site"),
        (snap) => {
          setRealtimeTick((n) => n + 1);
          set("realtime", {
            state: "ok",
            detail: `Last update: ${new Date().toLocaleTimeString()} · exists: ${snap.exists()}`,
          });
        },
        (err) =>
          set("realtime", { state: "fail", detail: err.message })
      );
      realtimeUnsub.current = unsub;
      return () => unsub();
    } catch (e: any) {
      set("realtime", { state: "fail", detail: e?.message || "subscribe failed" });
    }
  }, []);

  const runAll = async () => {
    setRunning(true);

    // ENV
    const envVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
    ];
    const missing = envVars.filter(
      (k) => !(process.env as any)[k]
    );
    set("env", {
      state: missing.length === 0 ? "ok" : "warn",
      detail:
        missing.length === 0
          ? `${envVars.length}/${envVars.length} loaded`
          : `Missing: ${missing.join(", ")}`,
    });

    // FIREBASE
    set("firebase", {
      state: firebaseEnabled && app ? "ok" : "fail",
      detail: firebaseEnabled
        ? `App: ${app?.options.projectId} · ${app?.name}`
        : "firebaseEnabled is false",
    });

    // FIRESTORE
    set("firestore", { state: "running" });
    if (firebaseEnabled && db) {
      try {
        await getDoc(doc(db, "settings", "site"));
        set("firestore", {
          state: "ok",
          detail: `Project: ${app?.options.projectId}`,
        });
      } catch (e: any) {
        set("firestore", { state: "fail", detail: e?.code || e?.message });
      }
    } else {
      set("firestore", { state: "fail", detail: "db is null" });
    }

    // AUTH
    set("auth", {
      state: firebaseEnabled && fbAuth ? "ok" : "fail",
      detail: fbAuth ? "Initialized" : "auth is null",
    });

    // ANALYTICS
    set("analytics", {
      state: analytics ? "ok" : "warn",
      detail: analytics
        ? "Initialized"
        : process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        ? "Skipped (browser-only or unsupported environment)"
        : "No measurementId provided",
    });

    // STORAGE
    set("storage", {
      state: storage ? "ok" : "warn",
      detail: storage ? "Available" : "Not initialized",
    });

    // CLOUDINARY
    set("cloudinary", {
      state: cloudinaryEnabled() ? "ok" : "fail",
      detail: cloudinaryEnabled()
        ? `Cloud: ${CLOUDINARY.cloud} · Preset: ${CLOUDINARY.preset}`
        : "CLOUDINARY_CLOUD_NAME or UPLOAD_PRESET missing",
    });

    // CURRENT USER
    set("currentUser", {
      state: user ? "ok" : "warn",
      detail: user
        ? `${user.email} · role: ${user.role} · uid: ${user.uid.slice(0, 8)}…`
        : "Not signed in",
    });

    // ADMIN ROLE
    set("adminRole", {
      state: isAdmin ? "ok" : user ? "warn" : "warn",
      detail: isAdmin
        ? "User has admin role"
        : user
        ? `Signed in as non-admin (${user.role})`
        : "No user signed in",
    });

    // FCM / Browser notifications
    if (typeof Notification === "undefined") {
      set("fcm", { state: "warn", detail: "Notification API not supported" });
    } else {
      const perm = Notification.permission;
      set("fcm", {
        state: perm === "granted" ? "ok" : perm === "denied" ? "fail" : "warn",
        detail: `Permission: ${perm}`,
      });
    }

    // COLLECTION COUNTS
    if (firebaseEnabled && db) {
      const fdb = db;
      await Promise.all(
        COLLECTIONS.map(async (c) => {
          set(`coll-${c}`, { state: "running" });
          try {
            const snap = await getDocs(collection(fdb, c));
            setCounts((p) => ({ ...p, [c]: snap.size }));
            set(`coll-${c}`, {
              state: "ok",
              detail: `${snap.size} document${snap.size === 1 ? "" : "s"}`,
            });
          } catch (e: any) {
            setCounts((p) => ({ ...p, [c]: "error" }));
            const code = e?.code || "";
            set(`coll-${c}`, {
              state: code === "permission-denied" ? "warn" : "fail",
              detail:
                code === "permission-denied"
                  ? "Permission denied (need to sign in as admin or deploy rules)"
                  : e?.message || "Read failed",
            });
          }
        })
      );
    } else {
      COLLECTIONS.forEach((c) =>
        set(`coll-${c}`, { state: "fail", detail: "Firestore not available" })
      );
    }

    setRunning(false);
  };

  // Run on mount
  useEffect(() => {
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cloudinary upload test
  const [uploadingTest, setUploadingTest] = useState(false);
  const cloudinaryTest = async () => {
    if (!cloudinaryEnabled()) {
      set("cloudinaryUpload", { state: "fail", detail: "Cloudinary not configured" });
      return;
    }
    setUploadingTest(true);
    set("cloudinaryUpload", { state: "running", detail: "Generating test image…" });
    try {
      // Generate a 1×1 PNG client-side
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 200, 200);
      grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#a1a1aa");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = "#000";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("DOOZY", 100, 100);
      const blob: Blob = await new Promise((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );
      const file = new File([blob], "doozy-system-test.png", { type: "image/png" });
      set("cloudinaryUpload", { state: "running", detail: "Uploading…" });
      const result = await uploadImage(file, { folder: "doozy/_system_tests" });
      if (result.source === "cloudinary") {
        set("cloudinaryUpload", {
          state: "ok",
          detail: `secure_url: ${result.url.slice(0, 80)}…`,
        });
      } else {
        set("cloudinaryUpload", {
          state: "warn",
          detail: "Fell back to local — preset not configured?",
        });
      }
    } catch (e: any) {
      set("cloudinaryUpload", { state: "fail", detail: e?.message || "Upload failed" });
    } finally {
      setUploadingTest(false);
    }
  };

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    const res = await Notification.requestPermission();
    set("fcm", {
      state: res === "granted" ? "ok" : res === "denied" ? "fail" : "warn",
      detail: `Permission: ${res}`,
    });
    if (res === "granted")
      new Notification("Doozy", { body: "Browser notifications enabled" });
  };

  // Summary
  const all = Object.values(checks);
  const okCount = all.filter((c) => c.state === "ok").length;
  const warnCount = all.filter((c) => c.state === "warn").length;
  const failCount = all.filter((c) => c.state === "fail").length;
  const overall = useMemo(() => {
    if (all.length === 0) return "idle";
    if (failCount > 0) return "fail";
    if (warnCount > 0) return "warn";
    return "ok";
  }, [okCount, warnCount, failCount, all.length]);

  // Sections
  const env = checks["env"];
  const platform = ["firebase", "firestore", "auth", "analytics", "storage", "cloudinary", "cloudinaryUpload"]
    .map((id) => checks[id])
    .filter(Boolean);
  const session = ["currentUser", "adminRole", "realtime", "fcm"]
    .map((id) => checks[id])
    .filter(Boolean);
  const cols = COLLECTIONS.map((c) => checks[`coll-${c}`]).filter(Boolean);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Diagnostics</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
            System Health
          </h1>
          <p className="text-silver-400 text-sm mt-1">
            Live status of Firebase, Firestore, Cloudinary, auth, realtime, and FCM.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runAll}
            disabled={running}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCcw size={12} />
            )}
            Re-run all checks
          </button>
        </div>
      </div>

      {/* Overall */}
      <div
        className={`border p-5 flex items-center justify-between flex-wrap gap-4 ${
          overall === "ok"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : overall === "warn"
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <div className="flex items-center gap-3">
          {overall === "ok" ? (
            <CheckCircle2 className="text-emerald-400" />
          ) : overall === "warn" ? (
            <AlertTriangle className="text-amber-400" />
          ) : (
            <XCircle className="text-red-400" />
          )}
          <div>
            <div className="text-sm font-semibold">
              {overall === "ok"
                ? "All systems operational"
                : overall === "warn"
                ? "Operational with warnings"
                : "One or more systems are down"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-silver-400 mt-1">
              {okCount} OK · {warnCount} warn · {failCount} fail · {all.length} total
            </div>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-500">
          Realtime ticks: <span className="text-white">{realtimeTick}</span>
        </div>
      </div>

      {/* Environment */}
      <Section title="Environment">
        <Row check={env} />
      </Section>

      {/* Platform */}
      <Section title="Platform · Firebase · Cloudinary">
        {platform.map((c) => (
          <Row key={c.id} check={c} />
        ))}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={cloudinaryTest}
            disabled={uploadingTest}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition disabled:opacity-50"
          >
            {uploadingTest ? "Uploading test image…" : "Run Cloudinary upload test"}
          </button>
        </div>
      </Section>

      {/* Session */}
      <Section title="Session & Realtime">
        {session.map((c) => (
          <Row key={c.id} check={c} />
        ))}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={askPermission}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition"
          >
            Request browser notification permission
          </button>
        </div>
      </Section>

      {/* Collections */}
      <Section title="Firestore Collections">
        {cols.map((c) => (
          <Row key={c.id} check={c} />
        ))}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {COLLECTIONS.map((c) => (
            <div
              key={c}
              className="border border-white/10 bg-ink-950 p-2.5 text-center"
            >
              <div className="text-[9px] uppercase tracking-[0.22em] text-silver-500">{c}</div>
              <div className="font-display text-base mt-0.5 silver-text">
                {counts[c] ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-ink-900">
      <div className="px-5 py-3 border-b border-white/10">
        <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold">
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-2">{children}</div>
    </section>
  );
}

function Row({ check }: { check: Check | undefined }) {
  if (!check) return null;
  const Icon =
    check.state === "ok"
      ? CheckCircle2
      : check.state === "fail"
      ? XCircle
      : check.state === "warn"
      ? AlertTriangle
      : check.state === "running"
      ? Loader2
      : CheckCircle2;
  const color =
    check.state === "ok"
      ? "text-emerald-400"
      : check.state === "fail"
      ? "text-red-400"
      : check.state === "warn"
      ? "text-amber-400"
      : check.state === "running"
      ? "text-silver-300"
      : "text-silver-500";
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon
          size={14}
          className={`${color} ${check.state === "running" ? "animate-spin" : ""} shrink-0 mt-0.5`}
        />
        <div className="min-w-0">
          <div className="text-sm">{check.label}</div>
          {check.detail && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-silver-500 mt-0.5 break-all">
              {check.detail}
            </div>
          )}
        </div>
      </div>
      <span
        className={`text-[9px] uppercase tracking-[0.22em] font-semibold ${color}`}
      >
        {check.state}
      </span>
    </div>
  );
}
