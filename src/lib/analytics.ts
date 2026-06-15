// Analytics — DEFENSIVE BY DEFAULT.
// Every helper assumes orders/products can be partial, malformed, or missing
// fields. Never throws. Returns sensible zero values when data is absent.

import { Order, OrderStatus, Product } from "@/types";

// ─── helpers ───
const safe = <T,>(v: T | undefined | null, fb: T): T =>
  v === undefined || v === null ? fb : v;
const n = (v: any): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const s = (v: any): string =>
  typeof v === "string" ? v : "";

/** Stable identity for a customer derived from an order (handles guests). */
export const customerKey = (o?: Partial<Order>): string => {
  const email = s(o?.address?.email).toLowerCase().trim();
  if (email) return email;
  const phone = s(o?.address?.phone).replace(/\D/g, "");
  if (phone) return `phone:${phone}`;
  const userId = s((o as any)?.userId);
  if (userId) return `uid:${userId}`;
  return `guest:${s(o?.id) || Math.random().toString(36).slice(2)}`;
};

/** Total amount for an order — prefers `total`, falls back to summing items. */
export const orderTotal = (o?: Partial<Order>): number => {
  if (!o) return 0;
  const t = n((o as any).total);
  if (t > 0) return t;
  const items = Array.isArray(o.items) ? o.items : [];
  return items.reduce(
    (acc, i) => acc + n((i as any)?.price) * n((i as any)?.quantity),
    0
  );
};

/** Item count for an order. */
export const orderItemCount = (o?: Partial<Order>): number => {
  const items = Array.isArray(o?.items) ? o!.items! : [];
  return items.reduce((a, i) => a + n((i as any)?.quantity), 0);
};

/** A "successful" order = anything that wasn't cancelled/returned. */
export const isRevenueOrder = (o?: Partial<Order>): boolean => {
  const status = s(o?.status) as OrderStatus | "";
  return !!o && status !== "Cancelled" && status !== "Returned";
};

const createdAt = (o?: Partial<Order>): number => n((o as any)?.createdAt);

// ─── time ranges ───
export type Range =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all";

const startOfDay = (d = new Date()) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime();
};
const startOfWeek = (d = new Date()) => {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};
const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1).getTime();
const startOfYear = (d = new Date()) =>
  new Date(d.getFullYear(), 0, 1).getTime();
const day = 86_400_000;

export function rangeBounds(r: Range): { from: number; to: number; label: string } {
  const now = Date.now();
  switch (r) {
    case "today":
      return { from: startOfDay(), to: now, label: "Today" };
    case "yesterday":
      return { from: startOfDay() - day, to: startOfDay() - 1, label: "Yesterday" };
    case "this_week":
      return { from: startOfWeek(), to: now, label: "This Week" };
    case "last_week":
      return { from: startOfWeek() - 7 * day, to: startOfWeek() - 1, label: "Last Week" };
    case "this_month":
      return { from: startOfMonth(), to: now, label: "This Month" };
    case "last_month": {
      const d = new Date();
      const lm = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const cur = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return { from: lm.getTime(), to: cur - 1, label: "Last Month" };
    }
    case "last_3_months":
      return { from: now - 90 * day, to: now, label: "Last 3 Months" };
    case "last_6_months":
      return { from: now - 180 * day, to: now, label: "Last 6 Months" };
    case "this_year":
      return { from: startOfYear(), to: now, label: "This Year" };
    default:
      return { from: 0, to: now, label: "All Time" };
  }
}

// ─── core metrics ───
export interface Metrics {
  revenue: number;
  orders: number;
  customers: number;
  aov: number;
  items: number;
}
export const ZERO_METRICS: Metrics = {
  revenue: 0,
  orders: 0,
  customers: 0,
  aov: 0,
  items: 0,
};

export function metricsFor(
  orders: Order[] | undefined | null,
  from: number,
  to: number
): Metrics {
  const list = Array.isArray(orders) ? orders : [];
  const slice = list.filter((o) => {
    if (!o) return false;
    const t = createdAt(o);
    return t >= from && t <= to && isRevenueOrder(o);
  });
  if (slice.length === 0) return ZERO_METRICS;

  const revenue = slice.reduce((acc, o) => acc + orderTotal(o), 0);
  const customers = new Set(slice.map(customerKey)).size;
  const items = slice.reduce((acc, o) => acc + orderItemCount(o), 0);
  return {
    revenue,
    orders: slice.length,
    customers,
    items,
    aov: slice.length ? Math.round(revenue / slice.length) : 0,
  };
}

// ─── time bucketing ───
export interface DailyBucket {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export function bucketDaily(
  orders: Order[] | undefined | null,
  from: number,
  to: number
): DailyBucket[] {
  const buckets: Record<string, DailyBucket> = {};
  const fromD = new Date(from); fromD.setHours(0, 0, 0, 0);
  const toD = new Date(to); toD.setHours(0, 0, 0, 0);
  for (let t = fromD.getTime(); t <= toD.getTime(); t += day) {
    const d = new Date(t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    buckets[key] = {
      date: key,
      label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      revenue: 0,
      orders: 0,
    };
  }
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o) continue;
    const t = createdAt(o);
    if (t < from || t > to) continue;
    if (!isRevenueOrder(o)) continue;
    const d = new Date(t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (buckets[key]) {
      buckets[key].revenue += orderTotal(o);
      buckets[key].orders += 1;
    }
  }
  return Object.values(buckets);
}

export interface MonthlyBucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}
export function bucketMonthly(
  orders: Order[] | undefined | null,
  months = 12
): MonthlyBucket[] {
  const now = new Date();
  const buckets: MonthlyBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en", { month: "short" }),
      revenue: 0,
      orders: 0,
    });
  }
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o || !isRevenueOrder(o)) continue;
    const t = createdAt(o);
    if (!t) continue;
    const d = new Date(t);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (b) {
      b.revenue += orderTotal(o);
      b.orders += 1;
    }
  }
  return buckets;
}

// ─── product performance ───
export interface ProductPerformance {
  productId: string;
  name: string;
  sold: number;
  revenue: number;
  image: string;
}
export function productPerformance(
  orders: Order[] | undefined | null
): ProductPerformance[] {
  const map = new Map<string, ProductPerformance>();
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o || !isRevenueOrder(o)) continue;
    const items = Array.isArray(o.items) ? o.items : [];
    for (const i of items) {
      if (!i) continue;
      const id = s((i as any)?.productId);
      if (!id) continue;
      const qty = n((i as any)?.quantity);
      const price = n((i as any)?.price);
      const ex = map.get(id);
      if (ex) {
        ex.sold += qty;
        ex.revenue += price * qty;
      } else {
        map.set(id, {
          productId: id,
          name: s((i as any)?.name) || "Untitled product",
          sold: qty,
          revenue: price * qty,
          image: s((i as any)?.image),
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.sold - a.sold);
}

// ─── customer insights ───
export interface CustomerInsight {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spend: number;
  lastAt: number;
  firstAt: number;
  returning: boolean;
}
export function customerInsights(
  orders: Order[] | undefined | null
): CustomerInsight[] {
  const map = new Map<string, CustomerInsight>();
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o || !isRevenueOrder(o)) continue;
    const key = customerKey(o);
    if (!key) continue;
    const total = orderTotal(o);
    const at = createdAt(o) || Date.now();
    const ex = map.get(key);
    if (ex) {
      ex.orders += 1;
      ex.spend += total;
      ex.lastAt = Math.max(ex.lastAt, at);
      ex.firstAt = Math.min(ex.firstAt, at);
      ex.returning = ex.orders > 1;
    } else {
      map.set(key, {
        email: s(o.address?.email),
        name: s(o.address?.name) || "Guest",
        phone: s(o.address?.phone),
        orders: 1,
        spend: total,
        lastAt: at,
        firstAt: at,
        returning: false,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
}

export interface CustomerStats {
  total: number;
  returning: number;
  newCount: number;
  top: CustomerInsight[];
}
export function customerStats(
  orders: Order[] | undefined | null
): CustomerStats {
  const insights = customerInsights(orders);
  const monthStart = startOfMonth();
  return {
    total: insights.length,
    returning: insights.filter((c) => c.returning).length,
    newCount: insights.filter((c) => c.firstAt >= monthStart).length,
    top: insights.slice(0, 8),
  };
}
