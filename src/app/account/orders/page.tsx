"use client";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { listUserOrders } from "@/lib/db";
import { date, inr } from "@/lib/format";
import { Order, OrderStatus } from "@/types";
import { ArrowRight, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_FLOW: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

function statusColor(status: string) {
  if (status === "Delivered") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (status === "Cancelled" || status === "Returned") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (status === "Shipped" || status === "Out For Delivery") return "text-blue-400 bg-blue-400/10 border-blue-400/30";
  return "text-amber-400 bg-amber-400/10 border-amber-400/30";
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) {
      listUserOrders(user.uid)
        .then(setOrders)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14">
        <div className="eyebrow">Account</div>
        <h1 className="h-display text-4xl md:text-5xl silver-text mt-2 mb-10">
          Order History
        </h1>

        {fetching && (
          <div className="text-silver-400 text-sm text-center py-20">
            Loading orders…
          </div>
        )}

        {!fetching && orders.length === 0 && (
          <div className="text-center py-20 border border-white/10 bg-ink-900">
            <ShoppingBag size={36} className="text-silver-600 mx-auto mb-4" />
            <p className="text-silver-400 text-sm">No orders yet.</p>
            <Link
              href="/"
              className="mt-5 inline-block text-[10px] uppercase tracking-[0.25em] border border-white/20 px-5 py-2.5 hover:bg-white hover:text-black transition"
            >
              Start Shopping
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((o) => {
            const status = (o?.status || "Pending") as OrderStatus;
            const step = STATUS_FLOW.indexOf(status);
            const isCancelled = status === "Cancelled" || status === "Returned";
            const items: any[] = Array.isArray(o?.items) ? o.items : [];

            return (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="block border border-white/10 bg-ink-900 p-6 md:p-7 hover:border-white/25 transition group"
              >
                {/* Top row */}
                <div className="flex justify-between flex-wrap gap-3 items-start">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="font-semibold text-sm">#{o.id}</div>
                      <span
                        className={`text-[9px] uppercase tracking-[0.2em] border px-2 py-0.5 ${statusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1.5">
                      {date(o.createdAt)} · {o.paymentMethod}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-display text-xl silver-text">
                      {inr(typeof o?.total === "number" ? o.total : 0)}
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-silver-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div className="mt-6">
                    <div className="flex justify-between text-[8px] uppercase tracking-[0.2em] text-silver-500 mb-2.5">
                      {STATUS_FLOW.map((s, i) => (
                        <span
                          key={s}
                          className={`hidden sm:block ${i <= step ? "text-white" : ""}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="h-px bg-white/10 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-white transition-all duration-700"
                        style={{
                          width:
                            step >= 0
                              ? `${(step / (STATUS_FLOW.length - 1)) * 100}%`
                              : "0%",
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 w-full flex justify-between">
                        {STATUS_FLOW.map((_, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full -translate-y-1/2 top-1/2 relative ${
                              i <= step ? "bg-white" : "bg-white/15"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Mobile: show current step label */}
                    <div className="sm:hidden mt-2 text-[9px] uppercase tracking-[0.2em] text-silver-400">
                      Status:{" "}
                      <span className="text-white font-semibold">{status}</span>
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <div className="mt-3 text-[10px] uppercase tracking-[0.25em] text-red-400">
                    Order {status}
                  </div>
                )}

                {/* Items preview */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                  <Package size={11} className="text-silver-600" />
                  <div className="text-[10px] uppercase tracking-[0.15em] text-silver-400 truncate">
                    {items.slice(0, 3).map((item: any, idx: number, arr) => (
                      <span key={`${item?.productId || idx}`}>
                        {item?.name || "Item"} × {item?.quantity || 1}
                        {idx < Math.min(arr.length, 3) - 1 ? " · " : ""}
                      </span>
                    ))}
                    {items.length > 3 && (
                      <span className="text-silver-600">
                        {" "}
                        +{items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}