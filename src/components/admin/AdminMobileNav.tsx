"use client";
import { motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { id: "dash", href: "/admin", icon: BarChart3, label: "Dashboard" },
  { id: "orders", href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { id: "products", href: "/admin/products", icon: Boxes, label: "Products" },
  { id: "customers", href: "/admin/customers", icon: Users, label: "Customers" },
  { id: "settings", href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminMobileNav() {
  const path = usePathname() || "/admin";
  const activeId =
    path === "/admin"
      ? "dash"
      : path.startsWith("/admin/orders")
      ? "orders"
      : path.startsWith("/admin/products")
      ? "products"
      : path.startsWith("/admin/customers")
      ? "customers"
      : path.startsWith("/admin/settings")
      ? "settings"
      : "";

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 relative">
        {ITEMS.map(({ id, href, icon: Icon, label }) => {
          const active = activeId === id;
          return (
            <Link
              key={id}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] active:scale-95 transition-transform"
            >
              {active && (
                <motion.span
                  layoutId="admnav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white"
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "text-white" : "text-silver-500"}
              />
              <span
                className={`text-[9px] tracking-[0.18em] uppercase font-medium leading-none ${
                  active ? "text-white" : "text-silver-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
