"use client";
import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  hint,
  icon,
  delta,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  delta?: { value: number; positive?: boolean };
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative border ${
        accent ? "border-white/30 bg-white text-black" : "border-white/10 bg-ink-900"
      } p-5 overflow-hidden group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`text-[10px] uppercase tracking-[0.25em] ${accent ? "text-black/60" : "text-silver-400"}`}>
          {label}
        </div>
        {icon && (
          <span className={accent ? "text-black/60" : "text-silver-500"}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-3xl md:text-[34px] leading-none">
        {typeof value === "string" || typeof value === "number" ? (
          <span className={accent ? "text-black" : "silver-text"}>{value}</span>
        ) : (
          value
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {hint && (
          <div className={`text-[10px] uppercase tracking-[0.2em] ${accent ? "text-black/60" : "text-silver-500"}`}>
            {hint}
          </div>
        )}
        {delta && (
          <span
            className={`text-[10px] font-semibold ${
              delta.positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {delta.positive ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
