"use client";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { getOrder } from "@/lib/db";
import { date, inr } from "@/lib/format";
import { Order, OrderStatus } from "@/types";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Full status flow shown to user (no internal "Cancelled"/"Returned" in the progress bar)
const STATUS_FLOW: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

function statusIcon(status: string) {
  switch (status) {
    case "Delivered":
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    case "Cancelled":
    case "Returned":
      return <XCircle size={14} className="text-red-400" />;
    case "Shipped":
    case "Out For Delivery":
      return <Truck size={14} className="text-blue-400" />;
    default:
      return <Clock size={14} className="text-silver-400" />;
  }
}

function statusColor(status: string) {
  if (status === "Delivered") return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (status === "Cancelled" || status === "Returned") return "text-red-400 border-red-400/40 bg-red-400/10";
  if (status === "Shipped" || status === "Out For Delivery") return "text-blue-400 border-blue-400/40 bg-blue-400/10";
  return "text-amber-400 border-amber-400/40 bg-amber-400/10";
}

export default function UserOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!id) return;
    setFetching(true);
    getOrder(id as string)
      .then((o) => {
        // Security: only show order if it belongs to the current user
        setOrder(o);
      })
      .finally(() => setFetching(false));
  }, [id]);

  if (fetching) {
    return (
      <SiteShell>
        <div className="container-x py-20 text-center text-silver-400 text-sm">
          Loading order…
        </div>
      </SiteShell>
    );
  }

  if (!order || (order.userId && user && order.userId !== user.uid)) {
    return (
      <SiteShell>
        <div className="container-x py-20 text-center">
          <p className="text-silver-400 text-sm">Order not found.</p>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-[10px] uppercase tracking-[0.25em] border border-white/20 px-5 py-2.5 hover:bg-white hover:text-black transition"
          >
            Back to Orders
          </Link>
        </div>
      </SiteShell>
    );
  }

  const status = (order.status || "Pending") as OrderStatus;
  const isCancelled = status === "Cancelled" || status === "Returned";
  const currentStep = STATUS_FLOW.indexOf(status);
  const addr: any = order.address || {};
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const payment: any = order.payment || {};
  const totals = {
    subtotal: typeof order.subtotal === "number" ? order.subtotal : 0,
    shipping: typeof order.shipping === "number" ? order.shipping : 0,
    discount: typeof order.discount === "number" ? order.discount : 0,
    total: typeof order.total === "number" ? order.total : 0,
  };
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14 max-w-3xl">
        {/* Back link */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={12} /> Orders
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="eyebrow">Order Details</div>
            <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
              #{order.id}
            </h1>
            <p className="text-silver-500 text-xs mt-2 uppercase tracking-[0.15em]">
              Placed on {date(order.createdAt)} · {order.paymentMethod}
            </p>
          </div>
          <span
            className={`text-[10px] uppercase tracking-[0.25em] border px-3 py-1.5 ${statusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        {/* Progress bar (only for non-cancelled) */}
        {!isCancelled && (
          <div className="border border-white/10 bg-ink-900 p-6 mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-silver-400 mb-6">
              Order Progress
            </h2>
            {/* Steps */}
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-4 left-4 right-4 h-px bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 bg-white transition-all duration-700"
                  style={{
                    width:
                      currentStep >= 0
                        ? `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between relative">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          active
                            ? "bg-white border-white text-black"
                            : done
                            ? "bg-white/20 border-white/60 text-white"
                            : "bg-ink-900 border-white/15 text-silver-600"
                        }`}
                      >
                        {done && !active ? (
                          <CheckCircle2 size={14} />
                        ) : active ? (
                          <Circle size={14} fill="currentColor" />
                        ) : (
                          <Circle size={14} />
                        )}
                      </div>
                      <span
                        className={`text-[8px] uppercase tracking-[0.15em] text-center max-w-[48px] leading-tight hidden sm:block ${
                          done ? "text-white" : "text-silver-600"
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Mobile current status */}
            <p className="mt-4 text-center text-xs text-silver-400 sm:hidden">
              Current:{" "}
              <span className="text-white font-semibold">{status}</span>
            </p>
          </div>
        )}

        {/* Cancelled / Returned banner */}
        {isCancelled && (
          <div className="border border-red-400/30 bg-red-400/5 p-4 mb-6 flex items-center gap-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              This order has been{" "}
              <span className="font-semibold">{status.toLowerCase()}</span>.
              {status === "Returned"
                ? " Refund will be processed within 5–7 business days."
                : " If you have questions, please contact support."}
            </p>
          </div>
        )}

        {/* Status Timeline */}
        {history.length > 0 && (
          <div className="border border-white/10 bg-ink-900 p-6 mb-6">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-silver-400 mb-5">
              Status History
            </h2>
            <ol className="relative border-l border-white/10 ml-2 space-y-5">
              {[...history].reverse().map((h, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-white" />
                  <div className="flex items-center gap-2">
                    {statusIcon(h?.status || "")}
                    <span className="text-sm font-semibold">
                      {h?.status || "—"}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1">
                    {typeof h?.at === "number"
                      ? new Date(h.at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Items */}
        <div className="border border-white/10 bg-ink-900 p-6 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-silver-400 mb-5 flex items-center gap-2">
            <Package size={13} /> Items Ordered
          </h2>
          <div className="space-y-4">
            {items.map((item: any, idx: number) => {
              const price = typeof item?.price === "number" ? item.price : 0;
              const qty = typeof item?.quantity === "number" ? item.quantity : 0;
              return (
                <div
                  key={`${item?.productId || idx}-${item?.size || ""}-${item?.color || ""}`}
                  className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="relative w-14 h-18 bg-ink-800 shrink-0">
                    {item?.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized={String(item.image).startsWith("data:")}
                      />
                    ) : (
                      <div className="w-14 h-16 bg-ink-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {item?.name || "Item"}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-silver-500 mt-1 space-x-2">
                      {item?.size && <span>Size: {item.size}</span>}
                      {item?.color && <span>· Color: {item.color}</span>}
                      <span>· Qty: {qty}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">{inr(price * qty)}</div>
                    {qty > 1 && (
                      <div className="text-[10px] text-silver-500 mt-0.5">
                        {inr(price)} each
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
            <table className="text-sm w-[220px]">
              <tbody>
                <tr>
                  <td className="text-silver-400 py-1 text-xs uppercase tracking-[0.1em]">
                    Subtotal
                  </td>
                  <td className="text-right">{inr(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td className="text-silver-400 py-1 text-xs uppercase tracking-[0.1em]">
                    Shipping
                  </td>
                  <td className="text-right">
                    {totals.shipping === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      inr(totals.shipping)
                    )}
                  </td>
                </tr>
                {totals.discount > 0 && (
                  <tr>
                    <td className="text-emerald-400 py-1 text-xs uppercase tracking-[0.1em]">
                      Discount
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </td>
                    <td className="text-right text-emerald-400">
                      − {inr(totals.discount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-white/10">
                  <td className="font-semibold pt-2 text-xs uppercase tracking-[0.1em]">
                    Total
                  </td>
                  <td className="text-right font-display text-xl silver-text pt-2">
                    {inr(totals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-white/10 bg-ink-900 p-6 mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-silver-400 mb-4 flex items-center gap-2">
            <Truck size={13} /> Delivery Address
          </h2>
          <div className="flex gap-3">
            <MapPin size={14} className="text-silver-500 mt-0.5 shrink-0" />
            <div className="text-sm text-silver-200 leading-relaxed">
              <div className="font-semibold text-white">{addr.name || "—"}</div>
              {addr.phone && (
                <div className="text-silver-400 text-xs mt-0.5">{addr.phone}</div>
              )}
              <div className="mt-1">
                {addr.line1 || "—"}
                {(addr.city || addr.state || addr.postalCode) && (
                  <>
                    <br />
                    {[addr.city, addr.state, addr.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="border border-white/10 bg-ink-900 p-6 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-silver-400 mb-4">
            Payment
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                Method
              </div>
              <div className="mt-1">{order.paymentMethod || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                Status
              </div>
              <div
                className={`mt-1 text-[11px] uppercase tracking-[0.1em] ${
                  payment.status === "Paid" || payment.status === "Collected"
                    ? "text-emerald-400"
                    : payment.status === "Failed" || payment.status === "Refunded"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {payment.status || "Pending"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                Amount
              </div>
              <div className="mt-1 font-semibold">{inr(totals.total)}</div>
            </div>
            {payment.paidAt && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-silver-500">
                  Paid On
                </div>
                <div className="mt-1">
                  {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                    dateStyle: "medium",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border border-white/20 px-5 py-3 hover:bg-white hover:text-black transition"
        >
          <ArrowLeft size={12} /> Back to Order History
        </Link>
      </div>
    </SiteShell>
  );
}