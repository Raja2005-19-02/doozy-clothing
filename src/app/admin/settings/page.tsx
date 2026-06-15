"use client";
import FileUpload from "@/components/admin/FileUpload";
import { useSettings } from "@/context/SettingsContext";
import {
  clearDemoContent,
  demoSeedSummary,
  seedDemoContent,
} from "@/lib/demoSeed";
import { SiteSettings } from "@/types";
import { Database, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { settings, save } = useSettings();
  const [d, setD] = useState<SiteSettings | null>(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (settings) setD(settings);
  }, [settings]);
  if (!d) return null;

  const upd = (path: string[], val: any) => {
    setD((prev) => {
      const next: any = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (cur[path[i]] == null) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = val;
      return next;
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await save(d);
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="eyebrow text-silver-500">Configuration</div>
        <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">Settings</h1>
      </div>

      {/* Brand identity — file uploads */}
      <Section title="Brand Identity">
        <div className="grid sm:grid-cols-3 gap-5">
          <FileUpload
            label="Logo"
            value={d.logo}
            onChange={(v) => upd(["logo"], v)}
            recommended="512 × 512"
            aspect="aspect-square"
          />
          <FileUpload
            label="Favicon"
            value={d.favicon}
            onChange={(v) => upd(["favicon"], v)}
            recommended="512 × 512"
            aspect="aspect-square"
          />
          <FileUpload
            label="Hero Banner"
            value={d.hero.image}
            onChange={(v) => upd(["hero", "image"], v)}
            recommended="1920 × 1080"
            aspect="aspect-video"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Row label="Website Name">
            <input
              className="input"
              value={d.websiteName}
              onChange={(e) => upd(["websiteName"], e.target.value)}
            />
          </Row>
          <Row label="Footer Text">
            <input
              className="input"
              value={d.footer}
              onChange={(e) => upd(["footer"], e.target.value)}
            />
          </Row>
        </div>
      </Section>

      <Section title="Hero Banner">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Title">
            <input
              className="input"
              value={d.hero.title}
              onChange={(e) => upd(["hero", "title"], e.target.value)}
            />
          </Row>
          <Row label="Subtitle">
            <input
              className="input"
              value={d.hero.subtitle}
              onChange={(e) => upd(["hero", "subtitle"], e.target.value)}
            />
          </Row>
          <Row label="CTA Text">
            <input
              className="input"
              value={d.hero.cta}
              onChange={(e) => upd(["hero", "cta"], e.target.value)}
            />
          </Row>
          <Row label="Announcement Bar">
            <input
              className="input"
              value={d.announcement}
              onChange={(e) => upd(["announcement"], e.target.value)}
            />
          </Row>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Phone">
            <input className="input" value={d.contact.phone} onChange={(e) => upd(["contact", "phone"], e.target.value)} />
          </Row>
          <Row label="WhatsApp">
            <input className="input" value={d.contact.whatsapp} onChange={(e) => upd(["contact", "whatsapp"], e.target.value)} />
          </Row>
          <Row label="Email">
            <input className="input" value={d.contact.email} onChange={(e) => upd(["contact", "email"], e.target.value)} />
          </Row>
          <Row label="Address">
            <input className="input" value={d.contact.address} onChange={(e) => upd(["contact", "address"], e.target.value)} />
          </Row>
          <Row label="Google Maps Link" col2>
            <input className="input" value={d.contact.mapLink} onChange={(e) => upd(["contact", "mapLink"], e.target.value)} />
          </Row>
        </div>
      </Section>

      <Section title="Admin Notifications">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Notification Email">
            <input
              className="input"
              type="email"
              placeholder="alerts@yourdomain.com"
              value={d.notifications?.email || ""}
              onChange={(e) => upd(["notifications", "email"], e.target.value)}
            />
          </Row>
          <Row label="Notification Mobile">
            <input
              className="input"
              placeholder="+91…"
              value={d.notifications?.mobile || ""}
              onChange={(e) => upd(["notifications", "mobile"], e.target.value)}
            />
          </Row>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Toggle
            label="Enable Notifications"
            checked={!!d.notifications?.enabled}
            onChange={(v) => upd(["notifications", "enabled"], v)}
          />
          <Toggle
            label="New Order Alerts"
            checked={!!d.notifications?.notifyOnNewOrder}
            onChange={(v) => upd(["notifications", "notifyOnNewOrder"], v)}
          />
          <Toggle
            label="Payment Alerts"
            checked={!!d.notifications?.notifyOnPayment}
            onChange={(v) => upd(["notifications", "notifyOnPayment"], v)}
          />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-silver-500 leading-relaxed">
          Email + SMS dispatch is handled by your backend (e.g. Cloud Function + SendGrid + Twilio).
          The dashboard already shows real-time in-app alerts when a new order arrives.
        </p>
      </Section>

      <Section title="Social Media">
        <div className="grid sm:grid-cols-2 gap-4">
          {(["instagram", "facebook", "youtube", "telegram", "twitter"] as const).map((k) => (
            <Row key={k} label={k}>
              <input
                className="input"
                value={(d.social as any)[k]}
                onChange={(e) => upd(["social", k], e.target.value)}
              />
            </Row>
          ))}
        </div>
      </Section>

      <Section title="Shipping">
        <div className="grid sm:grid-cols-3 gap-4">
          <Row label="Shipping Charge (₹)">
            <input type="number" className="input" value={d.shipping.charge} onChange={(e) => upd(["shipping", "charge"], +e.target.value)} />
          </Row>
          <Row label="Free Shipping Above (₹)">
            <input type="number" className="input" value={d.shipping.freeThreshold} onChange={(e) => upd(["shipping", "freeThreshold"], +e.target.value)} />
          </Row>
          <Row label="Delivery Estimate">
            <input className="input" value={d.shipping.estimate} onChange={(e) => upd(["shipping", "estimate"], e.target.value)} />
          </Row>
        </div>
      </Section>

      <Section title="Payments">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="UPI ID">
            <input
              className="input"
              placeholder="yourbusiness@upi"
              value={d.payments.upiId}
              onChange={(e) => upd(["payments", "upiId"], e.target.value)}
            />
          </Row>
          <div /> {/* spacer */}
          <Row label="Razorpay Key ID">
            <input
              className="input"
              placeholder="rzp_live_xxxxxxxxxxxx"
              value={d.payments.razorpayKey}
              onChange={(e) => upd(["payments", "razorpayKey"], e.target.value)}
            />
          </Row>
          <Row label="Razorpay Key Secret">
            <input
              className="input"
              type="password"
              placeholder="••••••••••••"
              value={d.payments.razorpayKeySecret || ""}
              onChange={(e) => upd(["payments", "razorpayKeySecret"], e.target.value)}
            />
          </Row>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <Toggle
            label="Razorpay enabled"
            checked={!!d.payments.razorpayEnabled}
            onChange={(v) => {
              if (v && !d.payments.razorpayKey) {
                toast.error("Add Razorpay Key ID first");
                return;
              }
              upd(["payments", "razorpayEnabled"], v);
            }}
          />
          <Toggle
            label="Cash on Delivery enabled"
            checked={d.payments.codEnabled}
            onChange={(v) => upd(["payments", "codEnabled"], v)}
          />
        </div>

        <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-silver-500 leading-relaxed">
          Razorpay is currently disabled by default. To accept card / netbanking / wallet payments:
          create a Razorpay account → copy <b>Key ID</b> &amp; <b>Key Secret</b> here → toggle
          <b> Razorpay enabled</b> ON → Save. Customers will then see Razorpay at checkout.
        </p>
      </Section>

      <Section title="Business · Invoice">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Legal Name">
            <input className="input" value={d.business?.legalName || ""} onChange={(e) => upd(["business", "legalName"], e.target.value)} />
          </Row>
          <Row label="GSTIN (optional)">
            <input className="input" value={d.business?.gstin || ""} onChange={(e) => upd(["business", "gstin"], e.target.value)} />
          </Row>
          <Row label="Invoice Prefix">
            <input className="input" value={d.business?.invoicePrefix || ""} onChange={(e) => upd(["business", "invoicePrefix"], e.target.value)} />
          </Row>
          <Row label="Invoice Footer Note">
            <input className="input" value={d.business?.invoiceFooterNote || ""} onChange={(e) => upd(["business", "invoiceFooterNote"], e.target.value)} />
          </Row>
        </div>
      </Section>

      <DemoContentSection />

      <Section title="Policies">
        <div className="grid sm:grid-cols-2 gap-4">
          <Row label="Privacy Policy" col2>
            <textarea className="input min-h-[100px]" value={d.policies.privacy} onChange={(e) => upd(["policies", "privacy"], e.target.value)} />
          </Row>
          <Row label="Terms & Conditions" col2>
            <textarea className="input min-h-[100px]" value={d.policies.terms} onChange={(e) => upd(["policies", "terms"], e.target.value)} />
          </Row>
          <Row label="Refund Policy" col2>
            <textarea className="input min-h-[100px]" value={d.policies.refund} onChange={(e) => upd(["policies", "refund"], e.target.value)} />
          </Row>
        </div>
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-6 z-40">
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary w-full md:w-auto shadow-2xl shadow-black/50"
        >
          <Save size={14} />
          {saving ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}

function DemoContentSection() {
  const [summary, setSummary] = useState<{ hero: number; categories: number; products: number } | null>(null);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);

  const refresh = async () => {
    try { setSummary(await demoSeedSummary()); } catch {}
  };
  useEffect(() => { refresh(); }, []);

  const onSeed = async () => {
    if (!confirm(
      "Populate Firestore with 5 hero slides, 7 categories and 30 demo products using royalty-safe Unsplash images (served via your Cloudinary fetch CDN)?\n\nUse this only in DEVELOPMENT MODE. When real images are uploaded later they'll replace these — no code changes required."
    )) return;
    setBusy("seed");
    const id = toast.loading("Seeding demo content…");
    try {
      const r = await seedDemoContent();
      toast.success(`Added ${r.hero} hero slides, ${r.categories} categories, ${r.products} products`, { id });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Seed failed", { id });
    } finally {
      setBusy(null);
    }
  };

  const onClear = async () => {
    if (!confirm("Remove demo content (all docs marked `demo:true` + demo hero slides + demo categories). Real admin-uploaded products are kept.")) return;
    setBusy("clear");
    const id = toast.loading("Clearing demo content…");
    try {
      const r = await clearDemoContent();
      toast.success(`Removed ${r.products} products & ${r.categories} categories`, { id });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Clear failed", { id });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section title="Demo Content (Development Mode)">
      <p className="text-[12px] text-silver-400 leading-relaxed mb-4">
        Populate the store with luxury menswear demo content (Unsplash images
        served through your Cloudinary fetch CDN). Use this to preview the
        complete experience before real product photography is shot. When the
        client uploads real images later, those replace these automatically —
        no code changes needed.
      </p>

      {summary && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Hero Slides", n: summary.hero },
            { label: "Categories", n: summary.categories },
            { label: "Products", n: summary.products },
          ].map((x) => (
            <div key={x.label} className="border border-white/10 bg-ink-950 p-3 text-center">
              <div className="text-[9px] uppercase tracking-[0.22em] text-silver-500">{x.label}</div>
              <div className="font-display text-2xl silver-text mt-1">{x.n}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSeed}
          disabled={!!busy}
          className="border border-white/15 hover:bg-white hover:text-black transition p-4 text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-semibold">
            {busy === "seed" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Seed Demo Content
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1">
            5 hero slides · 7 categories · 30 products
          </div>
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!!busy}
          className="border border-red-500/30 text-red-300 hover:bg-red-500/15 transition p-4 text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-semibold">
            {busy === "clear" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Clear Demo Content
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-red-300/60 mt-1">
            Removes seeded products / categories / slides
          </div>
        </button>
      </div>

      <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-silver-600 flex items-center gap-2">
        <Database size={11} /> Images route through Cloudinary fetch ({process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "—"})
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-ink-900">
      <div className="px-5 py-3 border-b border-white/10">
        <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
  col2,
}: {
  label: string;
  children: React.ReactNode;
  col2?: boolean;
}) {
  return (
    <div className={col2 ? "sm:col-span-2" : ""}>
      <div className="label capitalize">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between border px-4 py-3 text-sm transition ${
        checked
          ? "border-white bg-white/5"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <span className="text-[11px] uppercase tracking-[0.22em] text-silver-200">
        {label}
      </span>
      <span
        className={`relative w-9 h-5 rounded-full transition ${
          checked ? "bg-white" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-4 bg-black" : "bg-white"
          }`}
        />
      </span>
    </button>
  );
}
