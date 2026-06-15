"use client";
import StatCard from "@/components/admin/StatCard";
import { listOrders } from "@/lib/db";
import { customerInsights, customerStats } from "@/lib/analytics";
import { exportCSV, exportExcel } from "@/lib/export";
import { date, inr } from "@/lib/format";
import { Order } from "@/types";
import { Download, FileSpreadsheet, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    listOrders().then(setOrders);
  }, []);

  const stats = useMemo(() => customerStats(orders), [orders]);
  const all = useMemo(() => customerInsights(orders), [orders]);
  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s)
    );
  }, [all, q]);

  const exportRows = filtered.map((c, i) => ({
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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">CRM</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">Customers</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(`customers-${Date.now()}.csv`, exportRows)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => exportExcel(`customers-${Date.now()}.xls`, exportRows)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <FileSpreadsheet size={12} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Customers" value={stats.total} icon={<Users size={16} strokeWidth={1.5} />} />
        <StatCard label="Returning" value={stats.returning} hint={`${pct(stats.returning, stats.total)}%`} />
        <StatCard label="New this month" value={stats.newCount} />
        <StatCard label="Top Spender" value={stats.top[0] ? inr(stats.top[0].spend) : "—"} hint={stats.top[0]?.name || ""} />
      </div>

      <div className="border border-white/10 bg-ink-900 p-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" strokeWidth={1.5} />
          <input
            placeholder="Search by name, email, or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-ink-950 border border-white/10 text-sm placeholder-silver-500 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      <div className="border border-white/10 bg-ink-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-silver-500 bg-ink-800/50">
            <tr>
              <th className="px-5 py-3">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Last</th>
              <th className="text-right pr-5">Spend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.email + i} className="border-t border-white/5">
                <td className="px-5 py-3 text-silver-500 text-xs">{i + 1}</td>
                <td className="py-3 font-medium flex items-center gap-2">
                  {c.name}
                  {c.returning && (
                    <span className="text-[9px] uppercase tracking-[0.2em] border border-emerald-500/30 text-emerald-300 px-1.5 py-px">
                      Returning
                    </span>
                  )}
                </td>
                <td className="text-silver-300">{c.email || "—"}</td>
                <td className="text-silver-400">{c.phone}</td>
                <td>{c.orders}</td>
                <td className="text-silver-400 text-xs">{date(c.lastAt)}</td>
                <td className="text-right pr-5 font-semibold whitespace-nowrap">{inr(c.spend)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-silver-500">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}
