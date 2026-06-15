export default function Status({ s }: { s: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Confirmed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    Processing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Packed: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    Shipped: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    "Out For Delivery": "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    Delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
    Returned: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    Paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Failed: "bg-red-500/15 text-red-300 border-red-500/30",
    Refunded: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    Collected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span
      className={`inline-flex text-[9px] uppercase tracking-[0.18em] border px-2 py-1 font-semibold whitespace-nowrap ${
        map[s] || "border-white/20 text-silver-300"
      }`}
    >
      {s}
    </span>
  );
}
