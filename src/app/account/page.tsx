"use client";
import SiteShell from "@/components/SiteShell";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useWishlist } from "@/context/WishlistContext";
import { listUserOrders } from "@/lib/db";
import { date, inr } from "@/lib/format";
import { Order } from "@/types";
import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Account() {
  const { user, signOutUser, loading } = useAuth();
  const router = useRouter();
  const { ids } = useWishlist();
  const { settings } = useSettings();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) listUserOrders(user.uid).then(setOrders);
  }, [user, loading, router]);

  if (!user) return null;

  return (
    <SiteShell>
      <div className="container-x py-8 md:py-14">
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12 pt-2">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-white/15 bg-black grid place-items-center mb-4">
            <Image
              src={settings?.logo || "/logo.jpg"}
              alt={settings?.websiteName || "DOOZY"}
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div className="font-display tracking-[0.4em] silver-text text-sm font-semibold">
            {settings?.websiteName || "DOOZY"}
          </div>
          <div className="eyebrow text-silver-500 mt-4">Member</div>
          <h1 className="h-display text-3xl md:text-5xl silver-text mt-1.5">
            Hello, {user.name || "there"}.
          </h1>
          <p className="text-silver-400 text-xs md:text-sm mt-2 break-all px-4">
            {user.email}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-10">
          <Tile
            href="/account/orders"
            icon={<Package size={18} strokeWidth={1.5} />}
            label="Orders"
            value={orders.length}
          />
          <Tile
            href="/wishlist"
            icon={<Heart size={18} strokeWidth={1.5} />}
            label="Wishlist"
            value={ids.length}
          />
          <Tile
            href="/account/settings"
            icon={<SettingsIcon size={18} strokeWidth={1.5} />}
            label="Settings"
            value=""
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-5">
            <h2 className="h-display text-xl md:text-2xl silver-text">
              Recent Orders
            </h2>
            <Link
              href="/account/orders"
              className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {orders.length === 0 && (
              <div className="border border-white/10 bg-ink-900 p-8 text-center text-silver-400 text-sm">
                No orders yet.{" "}
                <Link
                  href="/shop"
                  className="text-white underline underline-offset-4"
                >
                  Start shopping
                </Link>
              </div>
            )}
            {orders.slice(0, 5).map((o) => (
              <Link
                href="/account/orders"
                key={o.id}
                className="group flex justify-between items-center border border-white/10 bg-ink-900 p-4 md:p-5 hover:border-white/30 transition"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{o.id}</div>
                  <div className="text-[10px] text-silver-500 uppercase tracking-[0.2em] mt-1 truncate">
                    {date(typeof o?.createdAt === "number" ? o.createdAt : 0)} · {(Array.isArray(o?.items) ? o.items.length : 0)} item(s)
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {inr(typeof o?.total === "number" ? o.total : 0)}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-silver-500 group-hover:text-white group-hover:translate-x-1 transition shrink-0"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => signOutUser()}
          className="mt-10 mx-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </SiteShell>
  );
}

function Tile({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group border border-white/10 bg-ink-900 p-3.5 md:p-5 hover:border-white/30 transition relative overflow-hidden flex flex-col items-center text-center"
    >
      <span className="text-silver-400 group-hover:text-white transition">
        {icon}
      </span>
      <div className="mt-2.5 text-[9px] md:text-[10px] uppercase tracking-[0.22em] text-silver-400">
        {label}
      </div>
      {value !== "" && (
        <div className="font-display text-xl md:text-2xl mt-1 silver-text">
          {value}
        </div>
      )}
    </Link>
  );
}
