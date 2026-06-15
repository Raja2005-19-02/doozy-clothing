"use client";
import {
  listNotifications,
  markAllNotificationsRead,
  NotificationLogEntry,
} from "@/lib/db";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const [list, setList] = useState<NotificationLogEntry[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setList(listNotifications());
    const t = setInterval(() => {
      setList(listNotifications());
      setTick((x) => x + 1);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Activity</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
            Notifications
          </h1>
          <p className="text-silver-400 text-sm mt-1">
            {list.length} total · {unread} unread
          </p>
        </div>
        <button
          onClick={() => {
            markAllNotificationsRead();
            setList(listNotifications());
          }}
          className="text-[10px] uppercase tracking-[0.25em] border border-white/15 px-4 py-2.5 hover:bg-white hover:text-black transition flex items-center gap-2"
        >
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-white/15 bg-ink-900/40 p-16 text-center">
          <Bell size={28} strokeWidth={1} className="mx-auto text-silver-500 mb-4" />
          <h2 className="h-display text-2xl silver-text">No notifications yet</h2>
          <p className="text-silver-400 text-sm mt-2">
            New orders will appear here in real-time.
          </p>
        </div>
      ) : (
        <ul className="border border-white/10 bg-ink-900 divide-y divide-white/5">
          {list.map((n) => (
            <li key={n.id} className={`p-5 flex items-center justify-between gap-4 ${!n.read ? "bg-white/[0.02]" : ""}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-300 border border-emerald-500/30 px-2 py-0.5">
                    New Order
                  </span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-silver-500">
                    {new Date(n.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <Link
                  href={`/admin/orders/${n.orderId}`}
                  className="block mt-2 text-sm font-semibold hover:underline truncate"
                >
                  {n.orderId} — {n.customer}
                </Link>
              </div>
              <div className="text-sm font-semibold whitespace-nowrap">
                ₹{n.amount.toLocaleString("en-IN")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
