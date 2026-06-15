"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-black">
          <Loader2 className="animate-spin text-silver-400" />
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  // If already an authenticated admin, go straight in
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.replace(next);
    }
  }, [authLoading, user, isAdmin, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, pass);
      // role check happens via context; if not admin, send back to user area
      // We rely on the layout's redirect to keep things clean.
      toast.success("Welcome back");
      router.replace(next);
    } catch (err: any) {
      toast.error(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-black px-6 relative overflow-hidden">
      {/* Subtle silver glow */}
      <div className="absolute w-[60vmin] h-[60vmin] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-10"
        >
          <span className="font-display text-2xl tracking-[0.4em] silver-text font-semibold">
            DOOZY
          </span>
        </Link>

        <div className="border border-white/10 bg-ink-900/60 backdrop-blur-xl p-8 md:p-10">
          <div className="flex items-center gap-2 eyebrow text-silver-400 mb-4">
            <Shield size={11} strokeWidth={1.5} /> Admin Access
          </div>
          <h1 className="h-display text-3xl md:text-4xl silver-text">
            Restricted area.
          </h1>
          <p className="text-silver-400 mt-3 text-sm leading-relaxed">
            Authorized personnel only. Sign in to manage products, orders, and
            store operations.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <div>
              <label className="label">Email</label>
              <input
                className="input-underline"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-underline"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
                minLength={6}
              />
            </div>

            <button
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="block text-center mt-6 text-[10px] uppercase tracking-[0.3em] text-silver-500 hover:text-white"
        >
          ← Back to store
        </Link>
      </motion.div>
    </div>
  );
}
