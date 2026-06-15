"use client";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?filter=new", label: "New Arrivals" },
  { href: "/shop?filter=best", label: "Best Sellers" },
  { href: "/shop?category=men", label: "Men" },
  { href: "/shop?category=women", label: "Women" },
  { href: "/shop?category=accessories", label: "Accessories" },
  { href: "/contact", label: "Contact" },
];

const desktopLinks = links.slice(0, 5);

export default function Navbar() {
  const { count } = useCart();
  const { ids } = useWishlist();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearch(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = open || search ? "hidden" : "";
  }, [open, search]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "bg-black/85 backdrop-blur-2xl border-b border-white/10"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="container-x h-14 md:h-16 flex items-center justify-between gap-2">
          {/* MOBILE: hamburger LEFT */}
          <button
            className="md:hidden btn-icon -ml-2"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          {/* DESKTOP: logo LEFT */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2.5 group"
          >
            <Image
              src={settings?.logo || "/logo.jpg"}
              alt="DOOZY"
              width={32}
              height={32}
              className="rounded-sm"
              priority
            />
            <span className="font-display text-base tracking-[0.4em] silver-text font-semibold">
              DOOZY
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[11px] uppercase tracking-[0.22em] text-silver-200">
            {desktopLinks.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="relative py-2 hover:text-white transition group"
              >
                {l.label}
                <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
              </Link>
            ))}
          </nav>

          {/* MOBILE: spacer in center (no logo) */}
          <div className="md:hidden flex-1" />

          {/* RIGHT: search + cart on mobile; full set on desktop */}
          <div className="flex items-center text-white">
            <button
              onClick={() => setSearch(true)}
              className="btn-icon"
              aria-label="Search"
            >
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" className="btn-icon relative hidden md:inline-flex">
              <Heart size={19} strokeWidth={1.5} />
              {ids.length > 0 && (
                <span className="absolute top-1 right-1 text-[9px] bg-white text-black w-4 h-4 grid place-items-center rounded-full font-bold">
                  {ids.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="btn-icon relative">
              <ShoppingBag size={19} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute top-1 right-1 text-[9px] bg-white text-black w-4 h-4 grid place-items-center rounded-full font-bold">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="btn-icon hidden md:inline-flex"
            >
              <User size={19} strokeWidth={1.5} />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden lg:inline-flex ml-2 text-[10px] uppercase tracking-[0.25em] border border-white/30 px-3 py-1.5 hover:bg-white hover:text-black transition font-semibold"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-IN MENU */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.45, ease: [0.7, 0, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm bg-ink-950 border-r border-white/10 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Image src={settings?.logo || "/logo.jpg"} alt="" width={28} height={28} className="rounded-sm" />
                  <span className="font-display tracking-[0.4em] silver-text text-sm font-semibold">
                    DOOZY
                  </span>
                </div>
                <button onClick={() => setOpen(false)} className="btn-icon">
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-2 py-3">
                {links.map((l, i) => (
                  <motion.div
                    key={l.label + l.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
                  >
                    <Link
                      href={l.href}
                      className="group flex items-center justify-between px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.03]"
                    >
                      <span className="font-display text-xl tracking-tight">
                        {l.label}
                      </span>
                      <ArrowUpRight
                        size={18}
                        className="text-silver-500 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition"
                      />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="p-5 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/wishlist" className="btn-ghost text-[10px] py-3">
                    Wishlist {ids.length > 0 && `(${ids.length})`}
                  </Link>
                  <Link href={user ? "/account" : "/login"} className="btn-primary text-[10px] py-3">
                    {user ? "Account" : "Sign In"}
                  </Link>
                </div>
                {isAdmin && (
                  <Link href="/admin" className="block text-center text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white py-2">
                    Admin Dashboard →
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-start justify-center pt-24 md:pt-40 px-6"
          >
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <span className="eyebrow">Search the collection</span>
                <button onClick={() => setSearch(false)} className="btn-icon">
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)
                    .value;
                  if (v.trim())
                    window.location.href = `/shop?q=${encodeURIComponent(v)}`;
                }}
              >
                <input
                  name="q"
                  autoFocus
                  placeholder="Hoodies, tees, jackets…"
                  className="w-full bg-transparent border-b border-white/30 text-xl md:text-4xl font-display py-4 placeholder-silver-600 focus:outline-none focus:border-white"
                />
              </motion.form>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Oversized hoodies", "New arrivals", "Best sellers", "Jackets", "Accessories"].map(
                  (q) => (
                    <Link
                      key={q}
                      href={`/shop?q=${encodeURIComponent(q)}`}
                      className="text-[11px] uppercase tracking-[0.2em] border border-white/20 px-3.5 py-2 hover:bg-white hover:text-black transition"
                    >
                      {q}
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
