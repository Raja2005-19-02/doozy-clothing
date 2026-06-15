"use client";
import SiteShell from "@/components/SiteShell";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Inner() {
  const id = useSearchParams().get("id");
  return (
    <div className="container-x py-24 md:py-32 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-20 h-20 mx-auto rounded-full border border-white/20 grid place-items-center mb-8 relative"
      >
        <div className="absolute inset-0 rounded-full border border-emerald-400/30 pulse-glow" />
        <Check size={32} strokeWidth={1.5} className="text-emerald-400" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="eyebrow">Confirmation</div>
        <h1 className="h-display text-5xl md:text-6xl silver-text mt-3">
          Order Placed.
        </h1>
        <p className="text-silver-300 mt-5 max-w-md mx-auto text-sm leading-relaxed">
          Thank you. Your order{" "}
          <span className="text-white font-semibold">{id}</span> has been
          received. A confirmation has been sent to your email.
        </p>
        <div className="mt-10 flex gap-3 justify-center flex-wrap">
          <Link href="/account/orders" className="btn-ghost">
            View Orders
          </Link>
          <Link href="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function Success() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <div className="py-32 text-center text-silver-400">Loading…</div>
        }
      >
        <Inner />
      </Suspense>
    </SiteShell>
  );
}
