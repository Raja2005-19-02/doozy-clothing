"use client";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { applyCoupon, createOrder, getSettings } from "@/lib/db";
import { inr } from "@/lib/format";
import { Address, Order, PaymentInfo, PaymentMethod, SiteSettings } from "@/types";
import { Lock, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { items, subtotal, clear, setQty, remove } = useCart();
  const { user, loading: _authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [addr, setAddr] = useState<Address>({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [pm, setPm] = useState<PaymentMethod>("COD");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [upiTxn, setUpiTxn] = useState("");
  const [upiApp, setUpiApp] = useState("Google Pay");

  const authLoading = _authLoading;
  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      // Auto-select first available payment method
      if (s?.payments?.razorpayEnabled && s.payments.razorpayKey) setPm("Razorpay");
      else if (s?.payments?.upiId) setPm("UPI");
      else if (s?.payments?.codEnabled) setPm("COD");
    });
  }, []);
  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items, router]);
  // Require login to checkout
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, user, router]);
  useEffect(() => {
    if (user) {
      setAddr((a) => ({
        ...a,
        name: a.name || user.name || "",
        email: a.email || user.email || "",
        phone: a.phone || user.phone || "",
      }));
    }
  }, [user]);

  const shipping = !settings
    ? 0
    : subtotal >= settings.shipping.freeThreshold
    ? 0
    : settings.shipping.charge;
  const total = Math.max(0, subtotal + shipping - discount);

  const onApply = async () => {
    if (!coupon.trim()) return;
    const res = await applyCoupon(coupon.trim(), subtotal);
    if (!res.ok) {
      setDiscount(0);
      return toast.error(res.message);
    }
    setDiscount(res.discount);
    toast.success("Coupon applied");
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation (email is OPTIONAL for guests)
    const required: (keyof Address)[] = [
      "name",
      "phone",
      "line1",
      "city",
      "state",
      "postalCode",
    ];
    for (const k of required) {
      if (!String(addr[k] || "").trim())
        return toast.error("Please fill all required fields");
    }
    if (!/^[+\d\s()-]{8,16}$/.test(addr.phone))
      return toast.error("Enter a valid phone number");
    if (addr.email && !/.+@.+\..+/.test(addr.email))
      return toast.error("Enter a valid email or leave it blank");
    if (pm === "Razorpay" && !(settings?.payments?.razorpayEnabled && settings?.payments?.razorpayKey))
      return toast.error("Razorpay is not available yet. Choose UPI or COD.");
    if (pm === "UPI" && !settings?.payments?.upiId)
      return toast.error("UPI is not available. Choose another method.");
    if (pm === "UPI" && !upiTxn.trim())
      return toast.error("Enter your UPI transaction ID after paying");
    if (pm === "COD" && !settings?.payments?.codEnabled)
      return toast.error("Cash on Delivery is not available.");

    setSubmitting(true);
    const id =
      (settings?.business?.invoicePrefix || "DZ") +
      "-" +
      Date.now().toString().slice(-7);
    const createdAt = Date.now();

    // Build payment info (omit any undefined fields so Firestore accepts it)
    const payment: PaymentInfo = {
      method: pm,
      amount: total,
      status:
        pm === "Razorpay" ? "Paid"
        : pm === "UPI" ? "Paid"
        : "Pending",
    };
    if (pm !== "COD") {
      payment.paidAt = createdAt + 60_000;
    }
    if (pm === "Razorpay") {
      payment.razorpayPaymentId = "pay_" + Math.random().toString(36).slice(2, 16);
      payment.razorpayOrderId = "order_" + Math.random().toString(36).slice(2, 16);
      payment.razorpaySignature = Math.random().toString(36).slice(2, 32);
    }
    if (pm === "UPI") {
      payment.upiTransactionId = upiTxn.trim();
      payment.upiApp = upiApp;
    }

    const order: Order = {
      id,
      userId: user?.uid,
      isGuest: !user,
      items,
      subtotal,
      shipping,
      discount,
      total,
      status: pm === "COD" ? "Pending" : "Confirmed",
      address: addr,
      paymentMethod: pm,
      payment,
      couponCode: coupon || undefined,
      createdAt,
    };
    await createOrder(order);
    clear();
    router.push(`/order-success?id=${id}`);
  };

  // While auth resolving or redirecting, show a holding state
  if (authLoading || !user) {
    return (
      <SiteShell>
        <div className="container-x py-32 text-center text-silver-400 text-sm">
          Redirecting to sign-in…
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14">
        <div className="mb-8">
          <div className="eyebrow">Checkout</div>
          <h1 className="h-display text-4xl md:text-5xl silver-text mt-2">
            Complete Order
          </h1>
        </div>

        <form
          onSubmit={placeOrder}
          className="grid lg:grid-cols-[1fr_400px] gap-10"
        >
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">
                  1
                </span>
                <h2 className="text-xs uppercase tracking-[0.25em]">
                  Shipping Address
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-5">
                <Field label="Full Name" required value={addr.name} onChange={(v) => setAddr({ ...addr, name: v })} className="sm:col-span-2" />
                <Field label="Mobile Number" required type="tel" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
                <Field label="Email (optional)" type="email" value={addr.email} onChange={(v) => setAddr({ ...addr, email: v })} />
                <Field label="Address" required value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} className="sm:col-span-2" />
                <Field label="City" required value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
                <Field label="State" required value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} />
                <Field label="Pincode" required value={addr.postalCode} onChange={(v) => setAddr({ ...addr, postalCode: v })} className="sm:col-span-2" />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full border border-white/30 grid place-items-center text-xs">
                  2
                </span>
                <h2 className="text-xs uppercase tracking-[0.25em]">
                  Payment Method
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {(["Razorpay", "UPI", "COD"] as PaymentMethod[]).map((m) => {
                  const razorpayOff =
                    m === "Razorpay" &&
                    !(settings?.payments?.razorpayEnabled && settings?.payments?.razorpayKey);
                  const codOff = m === "COD" && settings && !settings.payments.codEnabled;
                  const upiOff = m === "UPI" && settings && !settings.payments.upiId;
                  const disabled = !!(razorpayOff || codOff || upiOff);
                  return (
                    <button
                      type="button"
                      key={m}
                      disabled={disabled}
                      onClick={() => !disabled && setPm(m)}
                      className={`relative p-5 border text-xs uppercase tracking-[0.25em] transition text-left ${
                        pm === m && !disabled
                          ? "bg-white text-black border-white"
                          : "border-white/15 hover:border-white"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="font-bold">
                        {m === "COD" ? "Cash on Delivery" : m}
                      </div>
                      <div
                        className={`mt-1 text-[10px] ${
                          pm === m && !disabled ? "text-black/60" : "text-silver-500"
                        } normal-case tracking-normal`}
                      >
                        {m === "Razorpay" && (razorpayOff ? "Coming soon" : "Cards, NetBanking, Wallets")}
                        {m === "UPI" && (upiOff ? "Not available" : "Pay via any UPI app")}
                        {m === "COD" && (codOff ? "Not available" : "Pay when you receive")}
                      </div>
                      {disabled && (
                        <span className="absolute top-2 right-2 text-[8px] uppercase tracking-[0.2em] border border-white/15 px-1.5 py-0.5 text-silver-400">
                          {razorpayOff ? "Soon" : "Off"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {pm === "UPI" && settings && (
                <div className="mt-5 border border-white/10 bg-ink-900 p-5 space-y-4">
                  <p className="text-xs text-silver-300">
                    Pay <span className="text-white font-semibold">{inr(total)}</span> to UPI ID:{" "}
                    <span className="text-white">{settings.payments.upiId}</span>
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">UPI App</label>
                      <select
                        className="input-underline"
                        value={upiApp}
                        onChange={(e) => setUpiApp(e.target.value)}
                      >
                        {["Google Pay", "PhonePe", "Paytm", "BHIM", "Other"].map((a) => (
                          <option key={a} className="bg-ink-900" value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Transaction ID</label>
                      <input
                        className="input-underline"
                        value={upiTxn}
                        onChange={(e) => setUpiTxn(e.target.value)}
                        placeholder="UPI Ref ID after payment"
                      />
                    </div>
                  </div>
                </div>
              )}

              {pm === "COD" && (
                <p className="mt-3 text-xs text-silver-400">
                  Pay <span className="text-white">{inr(total)}</span> in cash when your order is delivered.
                </p>
              )}
            </section>
          </div>

          <aside className="border border-white/10 bg-ink-900 p-6 md:p-7 h-fit lg:sticky lg:top-24">
            <h2 className="text-xs uppercase tracking-[0.25em] mb-5">Order Summary</h2>
            <div className="space-y-4 max-h-[22rem] overflow-auto pr-1">
              {items.map((i) => (
                <div key={i.productId + i.size + i.color} className="flex gap-3 text-sm">
                  <div className="relative w-16 h-20 bg-ink-800 shrink-0">
                    {i.image && (
                      <Image
                        src={i.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={i.image.startsWith("data:")}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-medium line-clamp-2">{i.name}</div>
                      <div className="text-[10px] text-silver-500 uppercase tracking-[0.2em] mt-0.5">
                        {i.color} · {i.size}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center border border-white/15">
                        <button
                          type="button"
                          onClick={() => setQty(i.productId, i.size, i.color, i.quantity - 1)}
                          className="p-1.5 hover:bg-white/5"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={11} strokeWidth={1.5} />
                        </button>
                        <span className="w-7 text-center text-[11px]">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQty(i.productId, i.size, i.color, i.quantity + 1)}
                          className="p-1.5 hover:bg-white/5"
                          aria-label="Increase quantity"
                        >
                          <Plus size={11} strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i.productId, i.size, i.color)}
                        className="text-silver-500 hover:text-red-300 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs whitespace-nowrap font-semibold">
                    {inr(i.price * i.quantity)}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-xs text-silver-500 text-center py-6">
                  Your bag is empty
                </div>
              )}
            </div>
            <div className="hairline my-4" />
            <div className="flex border border-white/15">
              <input
                className="flex-1 bg-transparent px-3 py-3 text-sm placeholder-silver-500 focus:outline-none"
                placeholder="Coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button
                type="button"
                onClick={onApply}
                className="bg-white text-black px-4 text-[10px] uppercase tracking-[0.25em] font-bold"
              >
                Apply
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-silver-400">Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-silver-400">Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>−{inr(discount)}</span></div>}
              <div className="hairline" />
              <div className="flex justify-between text-base font-semibold pt-2">
                <span>Total</span>
                <span className="font-display text-xl silver-text">{inr(total)}</span>
              </div>
            </div>
            <button disabled={submitting} className="btn-primary w-full mt-6 disabled:opacity-50">
              {submitting ? "Placing…" : "Place Order"}
            </button>
            <p className="flex items-center justify-center gap-2 text-[10px] text-silver-500 mt-4 uppercase tracking-[0.25em]">
              <Lock size={11} strokeWidth={1.5} /> Secure SSL · 7-Day Returns
            </p>
          </aside>
        </form>
      </div>
    </SiteShell>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label} {required && <span className="text-silver-600">*</span>}
      </label>
      <input
        className="input-underline"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
