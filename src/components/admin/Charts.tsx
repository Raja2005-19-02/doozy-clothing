"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

export interface SeriesPoint {
  label: string;
  value: number;
}

/* ── Line / area chart ────────────────────────────── */
export function LineAreaChart({
  data,
  height = 220,
  format = (v) => `₹${inr(v)}`,
}: {
  data: SeriesPoint[];
  height?: number;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = height;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (W - pad.l - pad.r) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: pad.l + i * stepX,
    y: pad.t + (1 - d.value / max) * (H - pad.t - pad.b),
    ...d,
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    path +
    ` L${(W - pad.r).toFixed(1)},${(H - pad.b).toFixed(1)} L${pad.l.toFixed(1)},${(H - pad.b).toFixed(1)} Z`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad.l}
            x2={W - pad.r}
            y1={pad.t + g * (H - pad.t - pad.b)}
            y2={pad.t + g * (H - pad.t - pad.b)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 4"
          />
        ))}
        <motion.path
          d={areaPath}
          fill="url(#lineGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="white"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 4 : 2.5}
              fill={hover === i ? "white" : "rgba(255,255,255,0.6)"}
            />
            {/* hover region */}
            <rect
              x={p.x - stepX / 2}
              y={0}
              width={stepX || 24}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {/* x-axis labels */}
        {points.map((p, i) => {
          const total = points.length;
          const showEvery = total > 14 ? Math.ceil(total / 7) : 1;
          if (i % showEvery !== 0 && i !== total - 1) return null;
          return (
            <text
              key={"x" + i}
              x={p.x}
              y={H - 8}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,0.45)"
              fontFamily="Inter"
              letterSpacing="0.15em"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute bg-black border border-white/15 px-3 py-2 text-[11px] -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hover].x / W) * 100}%`,
            top: `${(points[hover].y / H) * 100}%`,
          }}
        >
          <div className="text-silver-400 uppercase tracking-[0.2em] text-[9px]">
            {points[hover].label}
          </div>
          <div className="text-white font-semibold mt-0.5">{format(points[hover].value)}</div>
        </div>
      )}
    </div>
  );
}

/* ── Bar chart ────────────────────────────── */
export function BarChart({
  data,
  height = 220,
  format = (v) => `${v}`,
}: {
  data: SeriesPoint[];
  height?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 md:gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 group"
          >
            <div className="relative w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-gradient-to-t from-white/20 to-white relative group-hover:from-white/40"
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] text-silver-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {format(d.value)}
                </div>
              </motion.div>
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-silver-400">
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Donut ────────────────────────────── */
export function DonutChart({
  segments,
  size = 180,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  let acc = 0;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => {
          const frac = s.value / total;
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += s.value;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const large = frac > 0.5 ? 1 : 0;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
          return (
            <motion.path
              key={i}
              d={d}
              fill={s.color}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.62} fill="#0a0a0a" />
      </svg>
      <ul className="space-y-2 text-[11px]">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5" style={{ background: s.color }} />
            <span className="text-silver-300">{s.label}</span>
            <span className="text-silver-500 ml-2">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
