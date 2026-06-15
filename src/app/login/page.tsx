"use client";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-black text-silver-400">Loading…</div>}>
      <Inner />
    </Suspense>
  );
}

type Mode = "signin" | "signup" | "otp" | "forgot";

function Inner() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [viaEmailLink, setViaEmailLink] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, requestOtp, verifyOtp, resetPassword, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, pass);
        toast.success("Welcome back");
        router.push(next);
      } else if (mode === "signup") {
        await signUp(email, pass, name);
        toast.success("Account created");
        router.push(next);
      } else if (mode === "forgot") {
        await resetPassword(email);
        toast.success("Password reset link sent to your email");
        setMode("signin");
      } else {
        // OTP
        if (!otpSent) {
          const res = await requestOtp(email);
          setOtpSent(true);
          setViaEmailLink(!!res.viaEmailLink);
          setResendIn(45);
          if (res.viaEmailLink) {
            toast.success("Sign-in link sent. Open your email to continue.", { duration: 6000 });
          } else {
            toast.success("OTP sent to " + email);
            if (res.devCode) {
              toast(
                () => (<span>Dev OTP: <b className="ml-1">{res.devCode}</b></span>),
                { duration: 8000 }
              );
            }
          }
        } else if (viaEmailLink) {
          toast("Check your email and click the sign-in link", { duration: 6000 });
        } else {
          await verifyOtp(email, otp, name || email.split("@")[0]);
          toast.success("Signed in");
          router.push(next);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      const res = await requestOtp(email);
      setResendIn(45);
      setViaEmailLink(!!res.viaEmailLink);
      toast.success(res.viaEmailLink ? "Sign-in link re-sent" : "OTP resent");
      if (res.devCode) toast(() => (<span>Dev OTP: <b className="ml-1">{res.devCode}</b></span>), { duration: 8000 });
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const tab = (v: Mode, l: string) => (
    <button
      key={v}
      type="button"
      onClick={() => {
        setMode(v);
        setOtpSent(false);
        setOtp("");
      }}
      className={`text-[10px] uppercase tracking-[0.22em] py-2.5 transition ${
        mode === v ? "bg-white text-black" : "text-silver-300 hover:bg-white/5"
      }`}
    >
      {l}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <AnnouncementBar />
      <Navbar />

      <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">
        <div className="relative hidden lg:block bg-ink-900">
          <Image src="/login-model.jpg" alt="" fill sizes="50vw" priority className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-10 left-10 max-w-sm">
            <div className="eyebrow text-silver-300 mb-3">Members Circle</div>
            <h2 className="h-display text-4xl xl:text-5xl silver-text leading-[1.05]">
              Where the night begins.
            </h2>
            <p className="text-silver-300 mt-4 text-[13px] leading-relaxed">
              Early drops. Member pricing. Private fittings.
            </p>
          </div>
          <div className="absolute top-10 right-10 eyebrow text-silver-400">DOOZY · 01 / 26</div>
        </div>

        <div className="flex items-center justify-center px-6 sm:px-10 lg:px-16 py-6 lg:py-0 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <div className="eyebrow mb-3">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "otp" && "Email OTP"}
              {mode === "forgot" && "Reset Password"}
            </div>
            <h1 className="h-display text-3xl md:text-4xl silver-text">
              {mode === "signin" && "Sign in."}
              {mode === "signup" && "Join DOOZY."}
              {mode === "otp" && "One-time code."}
              {mode === "forgot" && "Forgot password?"}
            </h1>
            <p className="text-silver-400 mt-3 text-[13px] leading-relaxed">
              {mode === "signin" && "Access your wardrobe, orders, and saved pieces."}
              {mode === "signup" && "Early drops, member pricing, private fittings."}
              {mode === "otp" && "Sign in passwordless — we'll email you a secure link."}
              {mode === "forgot" && "Enter your email and we'll send a reset link."}
            </p>

            {mode !== "forgot" && (
              <div className="mt-6 grid grid-cols-3 gap-1 border border-white/10 p-1">
                {tab("signin", "Sign In")}
                {tab("otp", "OTP")}
                {tab("signup", "Sign Up")}
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
              <AnimatePresence mode="wait" initial={false}>
                {mode === "signup" && (
                  <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <label className="label">Full Name</label>
                    <input className="input-underline" value={name} onChange={(e) => setName(e.target.value)} required />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="label">Email</label>
                <input
                  className="input-underline"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (mode === "otp") setOtpSent(false); }}
                  required
                  disabled={mode === "otp" && otpSent}
                />
              </div>

              {(mode === "signin" || mode === "signup") && (
                <div>
                  <label className="label">Password</label>
                  <input
                    className="input-underline"
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <AnimatePresence>
                {mode === "otp" && otpSent && !viaEmailLink && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="label">6-digit code</label>
                    <input
                      className="input-underline tracking-[0.5em] text-center text-lg"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      autoFocus
                    />
                    <div className="flex justify-between items-center mt-2">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white">
                        Change email
                      </button>
                      <button type="button" disabled={resendIn > 0 || loading} onClick={resend} className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white disabled:opacity-50">
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {mode === "otp" && otpSent && viaEmailLink && (
                  <motion.div key="emaillink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-white/10 bg-white/[0.03] p-4 text-[12px] leading-relaxed text-silver-200">
                    📩 We sent a sign-in link to <b className="text-white">{email}</b>.
                    Open the link on this device to complete sign-in. It expires in 1 hour.
                    <div className="mt-2">
                      <button type="button" disabled={resendIn > 0 || loading} onClick={resend} className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white disabled:opacity-50">
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button disabled={loading} className="btn-primary w-full !py-3 mt-3 disabled:opacity-50">
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Please wait…</>
                ) : mode === "forgot" ? (
                  <>Send reset link <ArrowRight size={14} /></>
                ) : mode === "otp" ? (
                  otpSent ? (
                    viaEmailLink ? <>Open your email to continue</> : <><KeyRound size={14} /> Verify &amp; Continue</>
                  ) : (
                    <><Mail size={14} /> Send OTP</>
                  )
                ) : (
                  <>{mode === "signin" ? "Sign In" : "Create Account"} <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            {mode === "signin" && (
              <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[0.25em] text-silver-400">
                <button type="button" onClick={() => setMode("forgot")} className="hover:text-white">
                  Forgot password?
                </button>
                <button type="button" onClick={() => setMode("otp")} className="hover:text-white">
                  Use email OTP →
                </button>
              </div>
            )}

            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("signin")} className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white">
                <ArrowLeft size={11} /> Back to sign in
              </button>
            )}

            <p className="mt-8 text-[9px] text-silver-600 uppercase tracking-[0.25em] leading-relaxed">
              By continuing you agree to our{" "}
              <Link href="/policies/terms" className="text-silver-400 hover:text-white">Terms</Link>{" "}
              &amp;{" "}
              <Link href="/policies/privacy" className="text-silver-400 hover:text-white">Privacy</Link>.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
