"use client";
import { LineAreaChart } from "@/components/admin/Charts";
import StatCard from "@/components/admin/StatCard";
import Status from "@/components/admin/Status";
import { subscribeOrders, subscribeProducts } from "@/lib/db";
import {
  ensureBrowserNotificationPermission,
  fireBrowserNotification,
  playNotificationSound,
} from "@/lib/notify";
import { date, inr } from "@/lib/format";
import { bucketDaily, customerKey, metricsFor, rangeBounds } from "@/lib/analytics";
import {
  orderCustomer,
  orderCreatedAt,
  orderPaymentAmount,
  orderPaymentMethod,
  orderPaymentPaidAt,
  orderStatus,
  orderTotal,
} from "@/lib/order-utils";
import { Order, Product } from "@/types";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function AdminHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    // Ask once for browser notification permission
    ensureBrowserNotificationPermission();
    const unsubProducts = subscribeProducts(setProducts);
    const unsub = subscribeOrders((list) => {
      const safeList = Array.isArray(list) ? list : [];
      if (initialized.current) {
        for (const o of safeList) {
          if (!o?.id) continue;
          if (!knownIds.current.has(o.id)) {
            const customerName = o?.address?.name || (o?.isGuest ? "Guest" : "Customer");
            const total = orderTotal(o);
            toast.success(
              <span>
                <b>New order</b> · {o.id} · {customerName}
              </span>,
              { duration: 5000 }
            );
            playNotificationSound();
            fireBrowserNotification(
              "New DOOZY order",
              `${customerName} · ₹${total.toLocaleString("en-IN")}`
            );
          }
        }
      }
      safeList.forEach((o) => o?.id && knownIds.current.add(o.id));
      initialized.current = true;
      setOrders(safeList);
    });
    return () => {
      unsub();
      unsubProducts();
    };
  }, []);

  const today = useMemo(() => rangeBounds("today"), []);
  const yesterday = useMemo(() => rangeBounds("yesterday"), []);
  const thisMonth = useMemo(() => rangeBounds("this_month"), []);
  const lastMonth = useMemo(() => rangeBounds("last_month"), []);

  const todayM = metricsFor(orders, today.from, today.to);
  const ydayM = metricsFor(orders, yesterday.from, yesterday.to);
  const tmM = metricsFor(orders, thisMonth.from, thisMonth.to);
  const lmM = metricsFor(orders, lastMonth.from, lastMonth.to);

  const pending = orders.filter((o) =>
    ["Pending", "Confirmed", "Processing", "Packed"].includes(orderStatus(o))
  );
  const delivered = orders.filter((o) => orderStatus(o) === "Delivered");
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);

  const chartData = useMemo(() => {
    const from = Date.now() - 29 * 86400000;
    return bucketDaily(orders, from, Date.now()).map((b) => ({
      label: b.label,
      value: b.revenue,
    }));
  }, [orders]);

  const recentPayments = useMemo(
    () =>
      orders
        .filter((o) => orderPaymentPaidAt(o) > 0)
        .sort((a, b) => orderPaymentPaidAt(b) - orderPaymentPaidAt(a))
        .slice(0, 5),
    [orders]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow text-silver-500">Overview</div>
          <h1 className="h-display text-2xl md:text-4xl silver-text mt-1">
            Dashboard
          </h1>
          <p className="text-silver-400 text-xs md:text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-emerald-300 border border-emerald-500/20 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
          Live
        </span>
      </div>

      {/* KPI grid — mobile-first */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        <StatCard
          label="Today's Revenue"
          value={inr(todayM.revenue)}
          hint="vs yesterday"
          icon={<IndianRupee size={15} strokeWidth={1.5} />}
          delta={pct(todayM.revenue, ydayM.revenue)}
          accent
        />
        <StatCard
          label="Today's Orders"
          value={todayM.orders}
          hint="vs yesterday"
          icon={<ShoppingBag size={15} strokeWidth={1.5} />}
          delta={pct(todayM.orders, ydayM.orders)}
        />
        <StatCard
          label="Monthly Revenue"
          value={inr(tmM.revenue)}
          hint="vs last month"
          icon={<IndianRupee size={15} strokeWidth={1.5} />}
          delta={pct(tmM.revenue, lmM.revenue)}
        />
        <StatCard
          label="Monthly Orders"
          value={tmM.orders}
          hint="vs last month"
          icon={<ShoppingBag size={15} strokeWidth={1.5} />}
          delta={pct(tmM.orders, lmM.orders)}
        />
        <StatCard
          label="Pending Orders"
          value={pending.length}
          hint="Need action"
          icon={<Clock size={15} strokeWidth={1.5} />}
        />
        <StatCard
          label="Customers"
          value={new Set(orders.map(customerKey)).size}
          hint="Unique"
          icon={<Users size={15} strokeWidth={1.5} />}
        />
        <StatCard
          label="Products"
          value={products.length}
          hint={`${lowStock.length} low stock`}
          icon={<AlertTriangle size={15} strokeWidth={1.5} />}
        />
      </div>

      {/* Revenue chart */}
      <div className="border border-white/10 bg-ink-900 p-5 sm:p-6">
        <div className="flex items-end justify-between mb-2 gap-3 flex-wrap">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.25em]">
              Revenue · Last 30 Days
            </h2>
            <div className="font-display text-2xl md:text-3xl silver-text mt-2">
              {inr(chartData.reduce((s, x) => s + x.value, 0))}
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white inline-flex items-center gap-1"
          >
            <TrendingUp size={11} /> Analytics →
          </Link>
        </div>
        <LineAreaChart data={chartData} height={180} />
      </div>

      {/* Recent orders + payments */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-white/10 bg-ink-900">
          <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/10">
            <h2 className="text-[11px] uppercase tracking-[0.25em] flex items-center gap-2">
              <Package size={13} strokeWidth={1.5} /> Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-[10px] uppercase tracking-[0.25em] flex items-center gap-1 hover:text-white text-silver-400"
            >
              All <ArrowUpRight size={11} />
            </Link>
          </div>
          <ul className="divide-y divide-white/5">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {o.id}
                    </Link>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5 truncate">
                      {orderCustomer(o)} · {date(orderCreatedAt(o))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-sm font-semibold">
                      {inr(orderTotal(o))}
                    </span>
                    <Status s={orderStatus(o)} />
                  </div>
                </div>
              </li>
            ))}
            {orders.length === 0 && (
              <li className="p-8 text-center text-silver-500 text-sm">
                No orders yet
              </li>
            )}
          </ul>
        </div>

        <div className="border border-white/10 bg-ink-900">
          <div className="px-5 py-3.5 border-b border-white/10">
            <h2 className="text-[11px] uppercase tracking-[0.25em] flex items-center gap-2">
              <CreditCard size={13} strokeWidth={1.5} /> Recent Payments
            </h2>
          </div>
          <ul className="divide-y divide-white/5">
            {recentPayments.length === 0 && (
              <li className="px-5 py-6 text-silver-500 text-sm">
                No payments yet
              </li>
            )}
            {recentPayments.map((o) => (
              <li
                key={o.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {o.id}
                  </Link>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5">
                    {orderPaymentMethod(o)}
                  </div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  {inr(orderPaymentAmount(o))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="border border-white/10 bg-ink-900">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/10">
          <h2 className="text-[11px] uppercase tracking-[0.25em]">
            Low Stock Alerts
          </h2>
          <Link
            href="/admin/products"
            className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white"
          >
            Manage →
          </Link>
        </div>
        {lowStock.length === 0 ? (
          <div className="p-6 text-silver-500 text-sm flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            All products are well-stocked
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <span className="text-sm">{p.name}</span>
                <span className="text-amber-400 text-xs font-semibold">
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function pct(cur: number, prev: number) {
  if (prev === 0 && cur === 0) return { value: 0, positive: true };
  if (prev === 0) return { value: 100, positive: true };
  const v = ((cur - prev) / prev) * 100;
  return { value: v, positive: v >= 0 };
}
