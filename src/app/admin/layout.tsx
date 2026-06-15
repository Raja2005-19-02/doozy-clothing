"use client";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { useAuth } from "@/context/AuthContext";
import { listNotifications, markAllNotificationsRead } from "@/lib/db";
import { isSoundEnabled, setSoundEnabled } from "@/lib/notify";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LineChart,
  Loader2,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/analytics", icon: LineChart, label: "Analytics" },
  { href: "/admin/reports", icon: FileText, label: "Reports" },
  { href: "/admin/products", icon: Boxes, label: "Products" },
  { href: "/admin/categories", icon: FolderTree, label: "Categories" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/hero", icon: ImageIcon, label: "Hero Slider" },
  { href: "/admin/homepage", icon: ImageIcon, label: "Homepage" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/system", icon: Activity, label: "System Health" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin, signOutUser } = useAuth();
  const router = useRouter();
  const path = usePathname() || "/admin";

  const isLoginRoute = path === "/admin/login";
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [notifTick, setNotifTick] = useState(0);
  const [sound, setSound] = useState(true);
  // Close mobile sidebar on route change
  useEffect(() => { setSideOpen(false); }, [path]);
  useEffect(() => {
    setSound(isSoundEnabled());
  }, []);

  useEffect(() => {
    if (isLoginRoute) return;
    if (loading) return;
    if (!user || !isAdmin) {
      router.replace(`/admin/login?next=${encodeURIComponent(path)}`);
    }
  }, [loading, user, isAdmin, isLoginRoute, path, router]);

  // Live notifications poll
  useEffect(() => {
    const t = setInterval(() => setNotifTick((x) => x + 1), 2000);
    return () => clearInterval(t);
  }, []);

  if (isLoginRoute) return <>{children}</>;

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-silver-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.3em]">
            Authenticating
          </span>
        </div>
      </div>
    );
  }

  const notifs = listNotifications();
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[240px_1fr] bg-black overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-white/10 bg-ink-900 lg:sticky lg:top-0 lg:h-[100dvh]">
        <Link
          href="/"
          className="p-6 font-display tracking-[0.4em] silver-text font-semibold"
        >
          DOOZY · Admin
        </Link>
        <nav className="px-3 space-y-1 flex-1 overflow-auto">
          {NAV.map((n) => {
            const active =
              path === n.href ||
              (n.href !== "/admin" && path.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] uppercase tracking-[0.15em] transition ${
                  active
                    ? "bg-white text-black"
                    : "text-silver-300 hover:bg-white/5"
                }`}
              >
                <Icon size={15} strokeWidth={1.5} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOutUser().then(() => router.push("/"))}
          className="m-3 flex items-center gap-3 px-4 py-2.5 text-[12px] uppercase tracking-[0.15em] text-silver-300 hover:bg-white/5"
        >
          <LogOut size={15} strokeWidth={1.5} /> Sign Out
        </button>
      </aside>

      <div className="min-w-0 flex flex-col min-h-[100dvh]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-ink-900/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-8 h-14">
            <button
              onClick={() => setSideOpen(true)}
              className="lg:hidden w-10 h-10 grid place-items-center hover:bg-white/5"
              aria-label="Menu"
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
            <div className="lg:hidden font-display tracking-[0.4em] silver-text font-semibold text-sm">
              DOOZY
            </div>
            <div className="hidden lg:block text-[10px] uppercase tracking-[0.25em] text-silver-500">
              {path.replace("/admin", "Admin") || "Admin"}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  const next = !sound;
                  setSound(next);
                  setSoundEnabled(next);
                }}
                className="w-10 h-10 grid place-items-center hover:bg-white/5"
                aria-label={sound ? "Mute notifications" : "Unmute notifications"}
                title={sound ? "Mute notifications" : "Unmute notifications"}
              >
                {sound ? <Volume2 size={17} strokeWidth={1.5} /> : <VolumeX size={17} strokeWidth={1.5} className="text-silver-500" />}
              </button>
              <button
                onClick={() => {
                  setNotifsOpen(true);
                  markAllNotificationsRead();
                }}
                className="relative w-10 h-10 grid place-items-center hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.5} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] bg-white text-black min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full font-bold leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 flex-1">{children}</main>
      </div>

      <AdminMobileNav />

      {/* Mobile collapsible sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideOpen(false)}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.7, 0, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-[60] w-[80vw] max-w-xs bg-ink-950 border-r border-white/10 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <span className="font-display tracking-[0.4em] silver-text text-sm font-semibold">
                  DOOZY · Admin
                </span>
                <button onClick={() => setSideOpen(false)} className="w-9 h-9 grid place-items-center">
                  <X size={18} />
                </button>
              </div>
              <nav className="px-2 py-3 flex-1 overflow-auto">
                {NAV.map((n) => {
                  const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={`flex items-center gap-3 px-4 py-3 text-[12px] uppercase tracking-[0.18em] transition ${
                        active ? "bg-white text-black" : "text-silver-300 hover:bg-white/5"
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.5} /> {n.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => signOutUser().then(() => router.push("/"))}
                className="m-3 flex items-center gap-3 px-4 py-3 text-[12px] uppercase tracking-[0.18em] text-silver-300 hover:bg-white/5 border border-white/10"
              >
                <LogOut size={15} strokeWidth={1.5} /> Sign Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Notifications drawer */}
      <AnimatePresence>
        {notifsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifsOpen(false)}
              className="fixed inset-0 bg-black/80 z-[60]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.7, 0, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[420px] bg-ink-950 border-l border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="font-display tracking-[0.3em] silver-text font-semibold">
                  NOTIFICATIONS
                </h2>
                <button
                  onClick={() => setNotifsOpen(false)}
                  className="w-9 h-9 grid place-items-center hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="p-12 text-center text-silver-500 text-sm">
                    No notifications yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {notifs.map((n) => (
                      <li key={n.id} className="p-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                            New Order
                          </span>
                          <span className="text-[10px] text-silver-500">
                            {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Link
                          href={`/admin/orders/${n.orderId}`}
                          onClick={() => setNotifsOpen(false)}
                          className="block mt-2 text-sm font-semibold hover:underline"
                        >
                          {n.orderId}
                        </Link>
                        <div className="text-[12px] text-silver-300 mt-0.5">
                          {n.customer} · ₹{n.amount.toLocaleString("en-IN")}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
