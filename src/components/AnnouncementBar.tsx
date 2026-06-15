"use client";
import { useSettings } from "@/context/SettingsContext";

export default function AnnouncementBar() {
  const { settings } = useSettings();
  const text =
    settings?.announcement ||
    "Complimentary shipping on orders above ₹1499 · Use DOOZY10 for 10% off";
  const items = Array.from({ length: 10 }, () => text);
  return (
    <div className="bg-white text-black overflow-hidden">
      <div className="animate-marquee marquee-track py-2 text-[10px] uppercase tracking-[0.4em] font-semibold">
        {items.map((t, i) => (
          <span key={i} className="px-10 whitespace-nowrap">
            ✦ {t}
          </span>
        ))}
      </div>
    </div>
  );
}
