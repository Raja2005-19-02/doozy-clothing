"use client";
import SiteShell from "@/components/SiteShell";
import { useSettings } from "@/context/SettingsContext";
import { useParams } from "next/navigation";

const titles: Record<string, string> = {
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  refund: "Refund Policy",
};

export default function Policy() {
  const { type } = useParams<{ type: string }>();
  const { settings } = useSettings();
  if (!settings) return null;
  const t = type as keyof typeof titles;
  const body = (settings.policies as any)[t] || "Policy not available.";
  return (
    <SiteShell>
      <div className="container-x py-12 md:py-20 max-w-3xl">
        <div className="eyebrow">Legal</div>
        <h1 className="h-display text-4xl md:text-6xl silver-text mt-3 mb-10">
          {titles[t] || "Policy"}
        </h1>
        <div className="text-silver-300 leading-[1.9] text-[15px] whitespace-pre-wrap">
          {body}
        </div>
      </div>
    </SiteShell>
  );
}
