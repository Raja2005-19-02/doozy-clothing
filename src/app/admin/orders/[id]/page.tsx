"use client";
import Status from "@/components/admin/Status";
import { useSettings } from "@/context/SettingsContext";
import {
  getOrder,
  updateOrderNotes,
  updateOrderPayment,
  updateOrderStatus,
} from "@/lib/db";
import { invoiceToExcel, printInvoice } from "@/lib/invoice";
import { date, inr } from "@/lib/format";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Mail,
  MapPin,
  Phone,
  Printer,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

const PAY_STATUSES: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
  "Collected",
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useSettings();
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState("");

  const refresh = () => {
    if (id) getOrder(id).then((o) => {
      setOrder(o);
      setNotes(o?.notes || "");
    });
  };
  useEffect(() => { refresh(); }, [id]);

  if (!order) {
    return (
      <div className="text-silver-400 text-sm py-20 text-center">Loading order…</div>
    );
  }

  // Defensive accessors — handles any missing fields gracefully
  const addr: any = order.address || {};
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const payment: any = order.payment || {};
  const totals = {
    subtotal: typeof order.subtotal === "number" ? order.subtotal : 0,
    shipping: typeof order.shipping === "number" ? order.shipping : 0,
    discount: typeof order.discount === "number" ? order.discount : 0,
    total: typeof order.total === "number" ? order.total : 0,
  };
  const createdAtMs = typeof order.createdAt === "number" ? order.createdAt : 0;

  const updateStatus = async (s: OrderStatus) => {
    await updateOrderStatus(order.id, s);
    toast.success(`Status → ${s}`);
    refresh();
  };
  const updatePay = async (s: PaymentStatus) => {
    await updateOrderPayment(order.id, { status: s, paidAt: s === "Paid" || s === "Collected" ? Date.now() : order.payment?.paidAt });
    toast.success(`Payment → ${s}`);
    refresh();
  };
  const saveNotes = async () => {
    await updateOrderNotes(order.id, notes);
    toast.success("Notes saved");
  };
  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => toast.success("Copied"));
  };

  const txnId =
    payment.razorpayPaymentId ||
    payment.upiTransactionId ||
    (order.paymentMethod === "COD" ? "N/A" : "—");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white flex items-center gap-2 mb-3"
          >
            <ArrowLeft size={12} /> Back to orders
          </button>
          <div className="flex items-end gap-4 flex-wrap">
            <h1 className="h-display text-3xl md:text-4xl silver-text">{order.id || "—"}</h1>
            <Status s={order.status || "Pending"} />
            {order.isGuest && (
              <span className="text-[9px] uppercase tracking-[0.25em] border border-white/15 px-2 py-1">
                Guest Checkout
              </span>
            )}
          </div>
          <p className="text-silver-400 text-sm mt-2">
            {createdAtMs > 0
              ? `Placed on ${new Date(createdAtMs).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`
              : "Date unavailable"}
          </p>
        </div>

        {/* Invoice actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => printInvoice(order, settings)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <Printer size={12} /> Print
          </button>
          <button
            onClick={() => printInvoice(order, settings)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
            title="Use 'Save as PDF' in the print dialog"
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={() => invoiceToExcel(order)}
            className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
          >
            <FileSpreadsheet size={12} /> Excel
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* CUSTOMER + ADDRESS */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card title="Customer">
              <Row icon={<User size={13} />} value={addr.name || (order.isGuest ? "Guest" : "—")} />
              {addr.phone ? (
                <Row icon={<Phone size={13} />} value={addr.phone} action={() => copy(addr.phone)} />
              ) : null}
              {addr.email ? (
                <Row icon={<Mail size={13} />} value={addr.email} action={() => copy(addr.email)} />
              ) : null}
            </Card>
            <Card title="Shipping Address">
              <div className="flex gap-2">
                <MapPin size={13} strokeWidth={1.5} className="text-silver-500 mt-0.5 shrink-0" />
                <div className="text-sm text-silver-200 leading-relaxed">
                  {addr.line1 || "—"}
                  {(addr.city || addr.state || addr.postalCode) && (
                    <>
                      <br />
                      {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ITEMS */}
          <Card title="Ordered Items">
            <div className="-mx-5">
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.2em] text-silver-500 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit</th>
                    <th className="text-right pr-5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center text-silver-500 text-xs">
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    items.map((i: any, idx: number) => {
                      const price = typeof i?.price === "number" ? i.price : 0;
                      const qty = typeof i?.quantity === "number" ? i.quantity : 0;
                      return (
                        <tr
                          key={`${i?.productId || idx}-${i?.size || ""}-${i?.color || ""}`}
                          className="border-b border-white/5"
                        >
                          <td className="px-5 py-3 flex items-center gap-3">
                            <div className="relative w-10 h-12 bg-ink-800">
                              {i?.image ? (
                                <Image
                                  src={i.image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  unoptimized={String(i.image).startsWith("data:")}
                                />
                              ) : null}
                            </div>
                            <span className="text-sm">{i?.name || "Untitled"}</span>
                          </td>
                          <td className="text-silver-300">{i?.size || "—"}</td>
                          <td className="text-silver-300">{i?.color || "—"}</td>
                          <td className="text-right">{qty}</td>
                          <td className="text-right">{inr(price)}</td>
                          <td className="text-right pr-5 font-semibold">{inr(price * qty)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <table className="text-sm w-[260px]">
                <tbody>
                  <tr>
                    <td className="text-silver-400 py-1">Subtotal</td>
                    <td className="text-right">{inr(totals.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="text-silver-400 py-1">Shipping</td>
                    <td className="text-right">{totals.shipping === 0 ? "Free" : inr(totals.shipping)}</td>
                  </tr>
                  {totals.discount > 0 && (
                    <tr>
                      <td className="text-emerald-400 py-1">
                        Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                      </td>
                      <td className="text-right text-emerald-400">− {inr(totals.discount)}</td>
                    </tr>
                  )}
                  <tr className="border-t border-white/10">
                    <td className="font-semibold pt-2">Total</td>
                    <td className="text-right font-display text-xl silver-text pt-2">{inr(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* PAYMENT */}
          <Card title="Payment Information">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <KV k="Method" v={order.paymentMethod || "—"} />
              <KV k="Status" v={<Status s={payment.status || "—"} />} />
              <KV k="Amount" v={inr(payment.amount || totals.total)} />
              {payment.paidAt && (
                <KV
                  k="Transaction Time"
                  v={new Date(payment.paidAt).toLocaleString("en-IN")}
                />
              )}
              {order.paymentMethod === "Razorpay" && (
                <>
                  <KV
                    k="Razorpay Payment ID"
                    v={
                      <span className="font-mono text-xs flex items-center gap-2">
                        {payment.razorpayPaymentId || "—"}
                        {payment.razorpayPaymentId && (
                          <button onClick={() => copy(payment.razorpayPaymentId)}>
                            <Copy size={11} />
                          </button>
                        )}
                      </span>
                    }
                  />
                  <KV
                    k="Razorpay Order ID"
                    v={
                      <span className="font-mono text-xs flex items-center gap-2">
                        {payment.razorpayOrderId || "—"}
                        {payment.razorpayOrderId && (
                          <button onClick={() => copy(payment.razorpayOrderId)}>
                            <Copy size={11} />
                          </button>
                        )}
                      </span>
                    }
                  />
                </>
              )}
              {order.paymentMethod === "UPI" && (
                <>
                  <KV k="UPI App" v={payment.upiApp || "—"} />
                  <KV
                    k="UPI Transaction ID"
                    v={
                      <span className="font-mono text-xs flex items-center gap-2">
                        {payment.upiTransactionId || "—"}
                        {payment.upiTransactionId && (
                          <button onClick={() => copy(payment.upiTransactionId)}>
                            <Copy size={11} />
                          </button>
                        )}
                      </span>
                    }
                  />
                </>
              )}
              {order.paymentMethod === "COD" && (
                <>
                  <KV k="Mode" v="Cash on Delivery" />
                  <KV
                    k="Collection"
                    v={
                      payment.codCollectedAt
                        ? "Collected on " +
                          new Date(payment.codCollectedAt).toLocaleDateString("en-IN")
                        : "Pending — collect on delivery"
                    }
                  />
                </>
              )}
            </div>

            {/* Update payment status */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="label">Update Payment Status</div>
              <div className="flex flex-wrap gap-2">
                {PAY_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updatePay(s)}
                    className={`text-[10px] uppercase tracking-[0.2em] border px-3 py-2 ${
                      payment.status === s
                        ? "bg-white text-black border-white"
                        : "border-white/15 hover:border-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card title="Internal Notes">
            <textarea
              className="w-full bg-ink-950 border border-white/10 px-3 py-2.5 text-sm placeholder-silver-500 focus:outline-none focus:border-white/40 min-h-[80px] resize-y"
              placeholder="Add internal notes (not visible to customer)…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button onClick={saveNotes} className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2 hover:bg-white hover:text-black transition">
                Save notes
              </button>
            </div>
          </Card>
        </div>

        {/* RIGHT — status timeline + actions */}
        <div className="space-y-6">
          <Card title="Update Status">
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`text-[10px] uppercase tracking-[0.2em] border px-3 py-3 text-left ${
                    (order.status || "") === s
                      ? "bg-white text-black border-white"
                      : "border-white/15 hover:border-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Status Timeline">
            <ol className="relative border-l border-white/10 ml-2 space-y-4">
              {(order.statusHistory || []).map((h, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-white" />
                  <div className="text-xs font-semibold">{h?.status || "—"}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-0.5">
                    {typeof h?.at === "number"
                      ? new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Summary">
            <div className="space-y-2 text-sm">
              <KV
                k="Items"
                v={items.reduce(
                  (acc: number, i: any) =>
                    acc + (typeof i?.quantity === "number" ? i.quantity : 0),
                  0
                )}
              />
              <KV k="Subtotal" v={inr(totals.subtotal)} />
              <KV k="Shipping" v={totals.shipping === 0 ? "Free" : inr(totals.shipping)} />
              <KV k="Discount" v={totals.discount > 0 ? "− " + inr(totals.discount) : "—"} />
              <KV k="Transaction" v={<span className="font-mono text-[11px]">{txnId}</span>} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/10 bg-ink-900">
      <div className="px-5 py-3 border-b border-white/10">
        <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Row({ icon, value, action }: { icon: React.ReactNode; value: string; action?: () => void }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-silver-500">{icon}</span>
      <span className="text-sm flex-1 break-all">{value}</span>
      {action && (
        <button onClick={action} className="text-silver-500 hover:text-white">
          <Copy size={12} />
        </button>
      )}
    </div>
  );
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 items-center">
      <span className="text-silver-400 text-xs uppercase tracking-[0.15em]">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
