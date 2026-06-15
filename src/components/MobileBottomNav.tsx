"use client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const path = usePathname() || "/";
  const { count } = useCart();
  const { ids } = useWishlist();
  const { user } = useAuth();

  // Hide on admin & login pages
  if (path.startsWith("/admin") || path === "/login") return null;

  const items = [
    { id: "home", href: "/", icon: Home, label: "Home" },
    { id: "shop", href: "/shop", icon: Store, label: "Shop" },
    { id: "wish", href: "/wishlist", icon: Heart, label: "Wishlist", badge: ids.length },
    { id: "cart", href: "/cart", icon: ShoppingBag, label: "Cart", badge: count },
    {
      id: "acct",
      href: user ? "/account" : "/login",
      icon: User,
      label: "Account",
    },
  ];

  const activeId =
    path === "/"
      ? "home"
      : path.startsWith("/shop") || path.startsWith("/product")
      ? "shop"
      : path.startsWith("/wishlist")
      ? "wish"
      : path.startsWith("/cart") || path.startsWith("/checkout")
      ? "cart"
      : path.startsWith("/account") || path === "/login"
      ? "acct"
      : "";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="relative grid grid-cols-5">
        {items.map(({ id, href, icon: Icon, label, badge }) => {
          const active = activeId === id;
          return (
            <Link
              key={id}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] active:scale-95 transition-transform"
            >
              {active && (
                <motion.span
                  layoutId="mobnav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white"
                />
              )}
              <div className="relative h-6 flex items-center justify-center">
                <Icon
                  size={21}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? "text-white" : "text-silver-500"}
                />
                {badge && badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 text-[9px] bg-white text-black min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full font-bold leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[9.5px] tracking-[0.18em] uppercase font-medium leading-none ${
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
