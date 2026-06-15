"use client";
import SiteShell from "@/components/SiteShell";
import { useCart } from "@/context/CartContext";
import { applyCoupon, getSettings } from "@/lib/db";
import { inr } from "@/lib/format";
import { SiteSettings } from "@/types";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { items, remove, setQty, subtotal } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const shipping = !settings
    ? 0
    : subtotal === 0
    ? 0
    : subtotal >= settings.shipping.freeThreshold
    ? 0
    : settings.shipping.charge;
  const total = Math.max(0, subtotal + shipping - discount);
  const remaining = settings
    ? Math.max(0, settings.shipping.freeThreshold - subtotal)
    : 0;
  const progress = settings
    ? Math.min(100, (subtotal / settings.shipping.freeThreshold) * 100)
    : 0;

  const onApply = async () => {
    if (!coupon.trim()) return;
    const res = await applyCoupon(coupon.trim(), subtotal);
    if (!res.ok) {
      setDiscount(0);
      return toast.error(res.message);
    }
    setDiscount(res.discount);
    toast.success(`Coupon applied`);
  };

  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="eyebrow">Your Selection</div>
            <h1 className="h-display text-4xl md:text-5xl silver-text mt-2">Bag</h1>
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-silver-400">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingBag size={40} strokeWidth={1} className="mx-auto text-silver-500 mb-6" />
            <h2 className="h-display text-3xl silver-text">Your bag is empty</h2>
            <p className="text-silver-400 mt-3 text-sm">
              Discover pieces that move with you.
            </p>
            <Link href="/shop" className="btn-primary mt-8 inline-flex">
              Explore the Collection <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-10">
            <div>
              {/* Free shipping bar */}
              {settings && remaining > 0 && (
                <div className="mb-5 p-4 border border-white/10 bg-ink-900">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-silver-300 flex justify-between">
                    <span>Add {inr(remaining)} for free shipping</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 h-px bg-white/10">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-white"
                    />
                  </div>
                </div>
              )}

              <ul>
                <AnimatePresence initial={false}>
                  {items.map((i) => (
                    <motion.li
                      key={i.productId + i.size + i.color}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-4 py-5 border-b border-white/10">
                        <Link
                          href={`/product/${i.productId}`}
                          className="relative w-24 md:w-28 aspect-[3/4] bg-ink-800 shrink-0"
                        >
                          <Image
                            src={i.image}
                            alt={i.name}
                            fill
                            sizes="120px"
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="font-medium text-sm">{i.name}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-silver-400">
                                {i.color} · Size {i.size}
                              </div>
                            </div>
                            <div className="text-sm font-semibold whitespace-nowrap">
                              {inr(i.price * i.quantity)}
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-white/15">
                              <button
                                onClick={() =>
                                  setQty(i.productId, i.size, i.color, i.quantity - 1)
                                }
                                className="p-2 hover:bg-white/5"
                              >
                                <Minus size={12} strokeWidth={1.5} />
                              </button>
                              <span className="w-8 text-center text-xs">{i.quantity}</span>
                              <button
                                onClick={() =>
                                  setQty(i.productId, i.size, i.color, i.quantity + 1)
                                }
                                className="p-2 hover:bg-white/5"
                              >
                                <Plus size={12} strokeWidth={1.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => remove(i.productId, i.size, i.color)}
                              className="text-silver-400 hover:text-white flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em]"
                            >
                              <Trash2 size={12} strokeWidth={1.5} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            <aside className="border border-white/10 bg-ink-900 p-6 md:p-7 h-fit lg:sticky lg:top-24">
              <h2 className="text-xs uppercase tracking-[0.25em] mb-5">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-silver-400">Subtotal</span>
                  <span>{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver-400">Shipping</span>
                  <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>−{inr(discount)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex border border-white/15">
                <input
                  className="flex-1 bg-transparent px-3 py-3 text-sm placeholder-silver-500 focus:outline-none"
                  placeholder="Enter coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button
                  onClick={onApply}
                  className="bg-white text-black px-4 text-[10px] uppercase tracking-[0.25em] font-bold"
                >
                  Apply
                </button>
              </div>

              <div className="hairline my-5" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="font-display text-xl silver-text">{inr(total)}</span>
              </div>
              <Link href="/checkout" className="btn-primary w-full mt-6">
                Checkout <ArrowRight size={14} />
              </Link>
              <Link
                href="/shop"
                className="block text-center text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white mt-4"
              >
                Continue shopping
              </Link>

              <div className="mt-6 pt-5 border-t border-white/10 text-[10px] uppercase tracking-[0.25em] text-silver-500 text-center">
                Secure SSL Checkout
              </div>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
