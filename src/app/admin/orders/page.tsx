"use client";
import Status from "@/components/admin/Status";
import { subscribeOrders } from "@/lib/db";
import { exportCSV, exportExcel } from "@/lib/export";
import { date, inr } from "@/lib/format";
import {
  orderAddressLine,
  orderCity,
  orderCreatedAt,
  orderCustomer,
  orderEmail,
  orderItemCount,
  orderItems,
  orderLine1,
  orderPaymentMethod,
  orderPaymentStatus,
  orderPhone,
  orderPostal,
  orderState as orderStateField,
  orderStatus,
  orderSubtotal,
  orderShipping,
  orderDiscount,
  orderTotal,
  orderTxnId,
} from "@/lib/order-utils";
import { Order, OrderStatus } from "@/types";
import {
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [pm, setPm] = useState<string>("All");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("all");

  useEffect(() => {
    const unsub = subscribeOrders(setOrders);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const cutoff =
      dateRange === "7d"
        ? now - 7 * day
        : dateRange === "30d"
        ? now - 30 * day
        : dateRange === "90d"
        ? now - 90 * day
        : 0;
    let list = orders.filter((o) => orderCreatedAt(o) >= cutoff);
    if (status !== "All") list = list.filter((o) => orderStatus(o) === status);
    if (pm !== "All") list = list.filter((o) => orderPaymentMethod(o) === pm);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((o) => {
        const id = (o?.id || "").toLowerCase();
        const name = orderCustomer(o).toLowerCase();
        const email = orderEmail(o).toLowerCase();
        const phone = orderPhone(o);
        return id.includes(s) || name.includes(s) || email.includes(s) || phone.includes(s);
      });
    }
    return list;
  }, [orders, q, status, pm, dateRange]);

  const exportRows = filtered.map((o) => {
    const created = orderCreatedAt(o);
    return {
      "Order ID": o?.id || "",
      Date: created ? new Date(created).toLocaleString("en-IN") : "",
      Customer: orderCustomer(o),
      Guest: o?.isGuest ? "Yes" : "No",
      Phone: orderPhone(o),
      Email: orderEmail(o),
      Address: orderAddressLine(o),
      Items: orderItems(o).length,
      Quantity: orderItemCount(o),
      Subtotal: orderSubtotal(o),
      Shipping: orderShipping(o),
      Discount: orderDiscount(o),
      Total: orderTotal(o),
      "Payment Method": orderPaymentMethod(o),
      "Payment Status": orderPaymentStatus(o),
      "Transaction ID": orderTxnId(o) || "—",
      Status: orderStatus(o),
      Coupon: o?.couponCode || "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Operations</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">Orders</h1>
          <p className="text-silver-400 text-sm mt-1">
            {filtered.length} of {orders.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(`orders-${Date.now()}.csv`, exportRows)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={() => exportExcel(`orders-${Date.now()}.xls`, exportRows)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <FileSpreadsheet size={12} /> Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-white/10 bg-ink-900 p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-500" strokeWidth={1.5} />
          <input
            placeholder="Order ID, customer, email, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-ink-950 border border-white/10 text-sm placeholder-silver-500 focus:outline-none focus:border-white/40"
          />
        </div>
        <Selector value={status} onChange={setStatus} options={["All", ...STATUSES]} label="Status" />
        <Selector value={pm} onChange={setPm} options={["All", "Razorpay", "UPI", "COD"]} label="Payment" />
        <Selector
          value={dateRange}
          onChange={(v) => setDateRange(v as any)}
          options={[
            { v: "all", l: "All Time" },
            { v: "7d", l: "Last 7 days" },
            { v: "30d", l: "Last 30 days" },
            { v: "90d", l: "Last 90 days" },
          ]}
          label="Date"
        />
      </div>

      {/* Table */}
      <div className="border border-white/10 bg-ink-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-silver-500 bg-ink-800/50">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Status</th>
              <th className="text-right pr-5">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const created = orderCreatedAt(o);
              return (
              <tr key={o?.id || Math.random()} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/orders/${o?.id || ""}`} className="font-medium hover:underline">
                    {o?.id || "—"}
                  </Link>
                </td>
                <td>
                  <div className="truncate max-w-[200px]">{orderCustomer(o)}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5 flex items-center gap-2">
                    {orderPhone(o) || "—"}
                    {o?.isGuest && <span className="border border-white/15 px-1.5 py-px text-[9px]">Guest</span>}
                  </div>
                </td>
                <td className="text-silver-400">{orderItems(o).length}</td>
                <td className="text-silver-400 text-xs whitespace-nowrap">
                  {created ? date(created) : "—"}
                  {created > 0 && (
                    <div className="text-[10px] text-silver-500">
                      {new Date(created).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </td>
                <td>
                  <div className="text-xs">{orderPaymentMethod(o)}</div>
                  <div className="mt-0.5">
                    <Status s={orderPaymentStatus(o)} />
                  </div>
                </td>
                <td>
                  <Status s={orderStatus(o)} />
                </td>
                <td className="text-right pr-5 font-semibold whitespace-nowrap">{inr(orderTotal(o))}</td>
                <td className="pr-5">
                  <Link
                    href={`/admin/orders/${o?.id || ""}`}
                    className="inline-flex items-center justify-center w-8 h-8 hover:bg-white/5 text-silver-300 hover:text-white"
                  >
                    <Eye size={14} strokeWidth={1.5} />
                  </Link>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-silver-500">
                  <Filter size={20} strokeWidth={1} className="mx-auto mb-3" />
                  No orders match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Selector({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[] | { v: string; l: string }[];
  label: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.25em] text-silver-500 mb-1.5">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-950 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-white/40"
      >
        {options.map((o: any) =>
          typeof o === "string" ? (
            <option key={o} className="bg-ink-900" value={o}>
              {o}
            </option>
          ) : (
            <option key={o.v} className="bg-ink-900" value={o.v}>
              {o.l}
            </option>
          )
        )}
      </select>
    </div>
  );
}
