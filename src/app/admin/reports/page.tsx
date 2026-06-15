"use client";
import { LineAreaChart } from "@/components/admin/Charts";
import { listOrders } from "@/lib/db";
import {
  bucketDaily,
  bucketMonthly,
  customerInsights,
  metricsFor,
  productPerformance,
} from "@/lib/analytics";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export";
import { inr } from "@/lib/format";
import { Order } from "@/types";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Granularity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setDate(today.getDate() - 30);
  const [from, setFrom] = useState(toInput(lastMonth));
  const [to, setTo] = useState(toInput(today));
  const [granularity, setGranularity] = useState<Granularity>("daily");

  useEffect(() => {
    listOrders().then(setOrders);
  }, []);

  const range = useMemo(() => {
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return { from: f.getTime(), to: t.getTime() };
  }, [from, to]);

  const inRange = useMemo(
    () =>
      orders.filter((o) => {
        const t = typeof o?.createdAt === "number" ? o.createdAt : 0;
        return t >= range.from && t <= range.to;
      }),
    [orders, range]
  );
  const metrics = useMemo(() => metricsFor(orders, range.from, range.to), [orders, range]);

  const series = useMemo(() => {
    const daily = bucketDaily(orders, range.from, range.to);
    if (granularity === "daily") return daily;
    if (granularity === "weekly") return aggregate(daily, 7);
    if (granularity === "monthly")
      return bucketMonthly(orders, monthsBetween(range.from, range.to)).map((b) => ({
        date: b.key,
        label: b.label,
        revenue: b.revenue,
        orders: b.orders,
      }));
    if (granularity === "quarterly") return aggregate(daily, 90);
    if (granularity === "yearly") return aggregate(daily, 365);
    return daily;
  }, [orders, range, granularity]);

  const perf = productPerformance(inRange);
  const customers = customerInsights(inRange);

  // Export rows
  const ordersRows = inRange.map((o) => {
    const a = o?.address || ({} as any);
    const items = Array.isArray(o?.items) ? o!.items! : [];
    const created = typeof o?.createdAt === "number" ? o.createdAt : 0;
    return {
      "Order ID": o?.id || "",
      Date: created ? new Date(created).toLocaleString("en-IN") : "",
      Customer: a.name || "",
      Phone: a.phone || "",
      Email: a.email || "",
      City: a.city || "",
      State: a.state || "",
      Items: items.length,
      Quantity: items.reduce((s, i: any) => s + (typeof i?.quantity === "number" ? i.quantity : 0), 0),
      Subtotal: typeof o?.subtotal === "number" ? o.subtotal : 0,
      Shipping: typeof o?.shipping === "number" ? o.shipping : 0,
      Discount: typeof o?.discount === "number" ? o.discount : 0,
      Total: typeof o?.total === "number" ? o.total : 0,
      "Payment Method": o?.paymentMethod || "",
      "Payment Status": o?.payment?.status || "",
      Status: o?.status || "",
    };
  });
  const customerRows = customers.map((c, i) => ({
    Rank: i + 1,
    Name: c.name,
    Email: c.email,
    Phone: c.phone,
    Orders: c.orders,
    Spend: c.spend,
    "First Order": new Date(c.firstAt).toLocaleDateString("en-IN"),
    "Last Order": new Date(c.lastAt).toLocaleDateString("en-IN"),
    Returning: c.returning ? "Yes" : "No",
  }));
  const revenueRows = series.map((b: any) => ({
    Period: b.label,
    Date: b.date,
    Revenue: b.revenue,
    Orders: b.orders,
  }));
  const productRows = perf.map((p, i) => ({
    Rank: i + 1,
    Product: p.name,
    "Units Sold": p.sold,
    Revenue: p.revenue,
  }));

  // Payment method breakdown
  const pmAgg: Record<string, { orders: number; revenue: number }> = {
    Razorpay: { orders: 0, revenue: 0 },
    UPI: { orders: 0, revenue: 0 },
    COD: { orders: 0, revenue: 0 },
  };
  for (const o of inRange) {
    if (!o) continue;
    if (o.status === "Cancelled" || o.status === "Returned") continue;
    const slot = pmAgg[o.paymentMethod || ""];
    if (slot) {
      slot.orders += 1;
      slot.revenue += typeof o.total === "number" ? o.total : 0;
    }
  }
  const paymentRows = Object.entries(pmAgg).map(([k, v]) => ({
    Method: k,
    Orders: v.orders,
    Revenue: v.revenue,
  }));

  const printSummary = () => {
    exportPDF(
      `DOOZY Sales Report ${from} to ${to}`,
      `<h1>DOOZY · Sales Report</h1>
      <div class="muted" style="font-size:12px;">From ${from} to ${to} · ${granularity}</div>
      <div class="grid">
        <div class="box"><div class="eyebrow">Revenue</div><div style="font-size:24px;font-weight:700;margin-top:4px;">₹${metrics.revenue.toLocaleString("en-IN")}</div></div>
        <div class="box"><div class="eyebrow">Orders</div><div style="font-size:24px;font-weight:700;margin-top:4px;">${metrics.orders}</div></div>
        <div class="box"><div class="eyebrow">Customers</div><div style="font-size:24px;font-weight:700;margin-top:4px;">${metrics.customers}</div></div>
        <div class="box"><div class="eyebrow">Avg Order</div><div style="font-size:24px;font-weight:700;margin-top:4px;">₹${metrics.aov.toLocaleString("en-IN")}</div></div>
      </div>
      <h2>Revenue by Period</h2>
      <table><thead><tr><th>Period</th><th class="right">Orders</th><th class="right">Revenue</th></tr></thead>
      <tbody>${series.map((b: any) => `<tr><td>${b.label}</td><td class="right">${b.orders}</td><td class="right">₹${b.revenue.toLocaleString("en-IN")}</td></tr>`).join("")}</tbody></table>
      <h2>Top Products</h2>
      <table><thead><tr><th>#</th><th>Product</th><th class="right">Units</th><th class="right">Revenue</th></tr></thead>
      <tbody>${perf.slice(0, 15).map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td class="right">${p.sold}</td><td class="right">₹${p.revenue.toLocaleString("en-IN")}</td></tr>`).join("")}</tbody></table>
      <h2>Top Customers</h2>
      <table><thead><tr><th>#</th><th>Customer</th><th class="right">Orders</th><th class="right">Spend</th></tr></thead>
      <tbody>${customers.slice(0, 15).map((c, i) => `<tr><td>${i + 1}</td><td>${c.name} · ${c.email || c.phone}</td><td class="right">${c.orders}</td><td class="right">₹${c.spend.toLocaleString("en-IN")}</td></tr>`).join("")}</tbody></table>
      `
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow text-silver-500">Reports</div>
        <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">Business Reports</h1>
        <p className="text-silver-400 text-sm mt-1">
          Custom date ranges, full exports — built for your accountant.
        </p>
      </div>

      {/* Filters */}
      <div className="border border-white/10 bg-ink-900 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <div className="label">From</div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-ink-950 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
          />
        </div>
        <div>
          <div className="label">To</div>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-ink-950 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
          />
        </div>
        <div>
          <div className="label">Granularity</div>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="w-full bg-ink-950 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
          >
            {(["daily", "weekly", "monthly", "quarterly", "yearly"] as Granularity[]).map((g) => (
              <option key={g} value={g} className="bg-ink-900">
                {g[0].toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          {[
            { l: "7d", days: 7 },
            { l: "30d", days: 30 },
            { l: "90d", days: 90 },
            { l: "1y", days: 365 },
          ].map((p) => (
            <button
              key={p.l}
              onClick={() => {
                const t = new Date();
                const f = new Date();
                f.setDate(t.getDate() - p.days);
                setFrom(toInput(f));
                setTo(toInput(t));
              }}
              className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition"
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Revenue" value={inr(metrics.revenue)} />
        <SummaryCard label="Orders" value={metrics.orders} />
        <SummaryCard label="Customers" value={metrics.customers} />
        <SummaryCard label="Avg Order Value" value={inr(metrics.aov)} />
      </div>

      <div className="border border-white/10 bg-ink-900 p-6">
        <h2 className="text-xs uppercase tracking-[0.25em] mb-4">Revenue Trend</h2>
        <LineAreaChart data={series.map((b: any) => ({ label: b.label, value: b.revenue }))} />
      </div>

      {/* Tables */}
      <ReportTable
        title="Orders Report"
        rows={ordersRows}
        baseName={`orders-${from}-to-${to}`}
        onPrint={printSummary}
      />
      <ReportTable
        title="Revenue by Period"
        rows={revenueRows}
        baseName={`revenue-${from}-to-${to}`}
      />
      <ReportTable
        title="Best Selling Products"
        rows={productRows}
        baseName={`products-${from}-to-${to}`}
      />
      <ReportTable
        title="Payment Methods"
        rows={paymentRows}
        baseName={`payments-${from}-to-${to}`}
      />
      <ReportTable
        title="Customers Report"
        rows={customerRows}
        baseName={`customers-${from}-to-${to}`}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-white/10 bg-ink-900 p-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-silver-400">{label}</div>
      <div className="font-display text-2xl md:text-3xl silver-text mt-2">{value}</div>
    </div>
  );
}

function ReportTable({
  title,
  rows,
  baseName,
  onPrint,
}: {
  title: string;
  rows: Record<string, any>[];
  baseName: string;
  onPrint?: () => void;
}) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const showRows = rows.slice(0, 15);
  return (
    <div className="border border-white/10 bg-ink-900">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em]">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(`${baseName}.csv`, rows)}
            className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition flex items-center gap-1.5"
          >
            <Download size={11} /> CSV
          </button>
          <button
            onClick={() => exportExcel(`${baseName}.xls`, rows)}
            className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition flex items-center gap-1.5"
          >
            <FileSpreadsheet size={11} /> Excel
          </button>
          {onPrint && (
            <button
              onClick={onPrint}
              className="text-[10px] uppercase tracking-[0.22em] border border-white/15 px-3 py-2 hover:bg-white hover:text-black transition flex items-center gap-1.5"
            >
              <Printer size={11} /> PDF
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-silver-500">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showRows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                {headers.map((h) => (
                  <td key={h} className="px-5 py-3 whitespace-nowrap text-silver-200">
                    {typeof r[h] === "number" && /price|revenue|spend|total|subtotal|shipping|discount/i.test(h)
                      ? inr(r[h])
                      : String(r[h] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(1, headers.length)} className="py-8 text-center text-silver-500 text-sm">
                  No data in this range
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {rows.length > 15 && (
          <div className="px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-silver-500 border-t border-white/5">
            Showing first 15 of {rows.length}. Export to see all.
          </div>
        )}
      </div>
    </div>
  );
}

function toInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthsBetween(from: number, to: number) {
  const f = new Date(from);
  const t = new Date(to);
  return Math.max(1, (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth()) + 1);
}
function aggregate(buckets: { date: string; label: string; revenue: number; orders: number }[], windowSize: number) {
  const out: { date: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < buckets.length; i += windowSize) {
    const chunk = buckets.slice(i, i + windowSize);
    if (!chunk.length) continue;
    out.push({
      date: chunk[0].date,
      label: chunk[0].label + (chunk.length > 1 ? "–" + chunk[chunk.length - 1].label : ""),
      revenue: chunk.reduce((s, x) => s + x.revenue, 0),
      orders: chunk.reduce((s, x) => s + x.orders, 0),
    });
  }
  return out;
}
