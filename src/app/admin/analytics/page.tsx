"use client";
import { BarChart, DonutChart, LineAreaChart } from "@/components/admin/Charts";
import StatCard from "@/components/admin/StatCard";
import { listOrders, listProducts } from "@/lib/db";
import {
  bucketDaily,
  bucketMonthly,
  customerStats,
  metricsFor,
  productPerformance,
  Range,
  rangeBounds,
} from "@/lib/analytics";
import { inr } from "@/lib/format";
import { Order, Product } from "@/types";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const RANGES: { v: Range; l: string }[] = [
  { v: "today", l: "Today" },
  { v: "yesterday", l: "Yesterday" },
  { v: "this_week", l: "This Week" },
  { v: "last_week", l: "Last Week" },
  { v: "this_month", l: "This Month" },
  { v: "last_month", l: "Last Month" },
  { v: "last_3_months", l: "Last 3M" },
  { v: "last_6_months", l: "Last 6M" },
  { v: "this_year", l: "This Year" },
  { v: "all", l: "All Time" },
];

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [range, setRange] = useState<Range>("this_month");

  useEffect(() => {
    listOrders().then(setOrders);
    listProducts().then(setProducts);
  }, []);

  const bounds = useMemo(() => rangeBounds(range), [range]);
  const metrics = useMemo(() => metricsFor(orders, bounds.from, bounds.to), [orders, bounds]);

  // Compare with previous equivalent period
  const prevRange = previousBounds(range);
  const prevMetrics = metricsFor(orders, prevRange.from, prevRange.to);

  // Daily chart for current range (fallback to monthly if range is yearly/all)
  const useMonthly =
    range === "this_year" ||
    range === "all" ||
    range === "last_6_months";
  const daily = useMemo(
    () =>
      useMonthly
        ? bucketMonthly(orders, 12).map((b) => ({ label: b.label, value: b.revenue }))
        : bucketDaily(orders, bounds.from, bounds.to).map((b) => ({
            label: b.label,
            value: b.revenue,
          })),
    [orders, bounds, useMonthly]
  );
  const ordersBar = useMemo(
    () =>
      useMonthly
        ? bucketMonthly(orders, 12).map((b) => ({ label: b.label, value: b.orders }))
        : bucketDaily(orders, bounds.from, bounds.to).map((b) => ({
            label: b.label,
            value: b.orders,
          })),
    [orders, bounds, useMonthly]
  );

  // Product perf within range
  const ordersInRange = orders.filter(
    (o) => o.createdAt >= bounds.from && o.createdAt <= bounds.to
  );
  const perf = productPerformance(ordersInRange);
  const top = perf.slice(0, 6);
  const least = [...perf].reverse().slice(0, 6);

  // Most viewed (all time, from product.views)
  const mostViewed = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);

  // Low stock
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);

  // Customer stats
  const cstats = customerStats(orders);

  // Payment method donut (within range)
  const pmCounts = { Razorpay: 0, UPI: 0, COD: 0 };
  ordersInRange.forEach((o) => {
    pmCounts[o.paymentMethod] = (pmCounts[o.paymentMethod] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Insights</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">Analytics</h1>
          <p className="text-silver-400 text-sm mt-1">{bounds.label}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.v}
              onClick={() => setRange(r.v)}
              className={`text-[10px] uppercase tracking-[0.22em] px-3 py-2 border ${
                range === r.v
                  ? "bg-white text-black border-white"
                  : "border-white/15 hover:border-white text-silver-200"
              }`}
            >
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Revenue"
          value={inr(metrics.revenue)}
          hint={`Prev: ${inr(prevMetrics.revenue)}`}
          icon={<IndianRupee size={16} strokeWidth={1.5} />}
          delta={pct(metrics.revenue, prevMetrics.revenue)}
          accent
        />
        <StatCard
          label="Orders"
          value={metrics.orders}
          hint={`Prev: ${prevMetrics.orders}`}
          icon={<ShoppingBag size={16} strokeWidth={1.5} />}
          delta={pct(metrics.orders, prevMetrics.orders)}
        />
        <StatCard
          label="Customers"
          value={metrics.customers}
          hint={`Prev: ${prevMetrics.customers}`}
          icon={<Users size={16} strokeWidth={1.5} />}
          delta={pct(metrics.customers, prevMetrics.customers)}
        />
        <StatCard
          label="Avg Order Value"
          value={inr(metrics.aov)}
          hint={`Prev: ${inr(prevMetrics.aov)}`}
          icon={<TrendingUp size={16} strokeWidth={1.5} />}
          delta={pct(metrics.aov, prevMetrics.aov)}
        />
      </div>

      {/* Revenue Chart */}
      <div className="border border-white/10 bg-ink-900 p-6">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xs uppercase tracking-[0.25em]">Revenue Trend</h2>
          <div className="text-[10px] uppercase tracking-[0.25em] text-silver-500">
            {useMonthly ? "Monthly" : "Daily"}
          </div>
        </div>
        <LineAreaChart data={daily} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="border border-white/10 bg-ink-900 p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] mb-4">Orders</h2>
          <BarChart data={ordersBar} format={(v) => `${v} orders`} />
        </div>

        {/* Payment mix */}
        <div className="border border-white/10 bg-ink-900 p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] mb-4">Payment Method Mix</h2>
          <DonutChart
            segments={[
              { label: "Razorpay", value: pmCounts.Razorpay, color: "#ffffff" },
              { label: "UPI", value: pmCounts.UPI, color: "#a1a1aa" },
              { label: "COD", value: pmCounts.COD, color: "#52525b" },
            ]}
          />
        </div>
      </div>

      {/* Product performance */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ProductPerfCard title="Top Selling" icon={<TrendingUp size={14} />} items={top} />
        <ProductPerfCard
          title="Least Selling"
          icon={<TrendingDown size={14} />}
          items={least}
        />
        <ProductPerfCard
          title="Most Viewed"
          icon={<Package size={14} />}
          items={mostViewed.map((p) => ({
            productId: p.id,
            name: p.name,
            sold: p.views || 0,
            revenue: 0,
            image: p.images[0],
          }))}
          metricLabel="views"
          showRevenue={false}
        />
      </div>

      {/* Customers */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="border border-white/10 bg-ink-900 p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] mb-4">Customers</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCardMini label="Total" value={cstats.total} />
            <StatCardMini label="Returning" value={cstats.returning} />
            <StatCardMini label="New" value={cstats.newCount} />
          </div>
        </div>

        <div className="lg:col-span-2 border border-white/10 bg-ink-900">
          <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.25em]">Top Customers</h2>
            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-500">By spend</span>
          </div>
          <ul className="divide-y divide-white/5">
            {cstats.top.length === 0 && (
              <li className="px-6 py-6 text-silver-500 text-sm">No customers yet</li>
            )}
            {cstats.top.map((c, i) => (
              <li key={c.email + i} className="px-6 py-3 flex items-center justify-between">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px] font-semibold text-silver-200">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5 truncate">
                      {c.orders} orders · {c.email || c.phone}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">{inr(c.spend)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <div className="border border-white/10 bg-ink-900">
          <div className="px-6 py-3 border-b border-white/10">
            <h2 className="text-xs uppercase tracking-[0.25em]">Low Stock</h2>
          </div>
          <ul className="divide-y divide-white/5">
            {lowStock.map((p) => (
              <li key={p.id} className="px-6 py-3 flex items-center justify-between">
                <span className="text-sm">{p.name}</span>
                <span className="text-amber-400 text-xs font-semibold">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCardMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-ink-950 p-3">
      <div className="text-[9px] uppercase tracking-[0.25em] text-silver-500">{label}</div>
      <div className="font-display text-2xl silver-text mt-1">{value}</div>
    </div>
  );
}

function ProductPerfCard({
  title,
  icon,
  items,
  metricLabel = "sold",
  showRevenue = true,
}: {
  title: string;
  icon: React.ReactNode;
  items: { productId: string; name: string; sold: number; revenue: number; image: string }[];
  metricLabel?: string;
  showRevenue?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-ink-900">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
        <span className="text-silver-400">{icon}</span>
        <h2 className="text-xs uppercase tracking-[0.25em]">{title}</h2>
      </div>
      <ul className="divide-y divide-white/5">
        {items.length === 0 && (
          <li className="px-5 py-6 text-silver-500 text-sm">No data</li>
        )}
        {items.map((p) => (
          <li key={p.productId} className="px-5 py-3 flex items-center gap-3">
            <div className="relative w-10 h-12 bg-ink-800 shrink-0">
              {p.image && <Image src={p.image} alt="" fill className="object-cover" sizes="40px" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{p.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5">
                {p.sold} {metricLabel}
              </div>
            </div>
            {showRevenue && (
              <div className="text-xs font-semibold whitespace-nowrap">{inr(p.revenue)}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function pct(cur: number, prev: number) {
  if (prev === 0 && cur === 0) return { value: 0, positive: true };
  if (prev === 0) return { value: 100, positive: true };
  const v = ((cur - prev) / prev) * 100;
  return { value: v, positive: v >= 0 };
}

function previousBounds(r: Range) {
  const b = rangeBounds(r);
  const dur = b.to - b.from;
  return { from: b.from - dur - 1, to: b.from - 1 };
}
