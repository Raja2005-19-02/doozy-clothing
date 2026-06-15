"use client";
import FileUpload from "@/components/admin/FileUpload";
import { useSettings } from "@/context/SettingsContext";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HomepageAdmin() {
  const { settings, save } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);
  if (!draft) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success("Homepage updated");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <div className="eyebrow text-silver-500">Storefront</div>
        <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
          Homepage
        </h1>
      </div>

      <section className="border border-white/10 bg-ink-900">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold">
            Announcement Bar
          </h2>
        </div>
        <div className="p-5">
          <input
            className="input"
            value={draft.announcement}
            onChange={(e) =>
              setDraft({ ...draft, announcement: e.target.value })
            }
          />
        </div>
      </section>

      <section className="border border-white/10 bg-ink-900">
        <div className="px-5 py-3 border-b border-white/10">
          <h2 className="text-[11px] uppercase tracking-[0.25em] font-semibold">
            Hero Banner
          </h2>
        </div>
        <div className="p-5 grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            <Row label="Title">
              <input
                className="input"
                value={draft.hero.title}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, title: e.target.value } })
                }
              />
            </Row>
            <Row label="Subtitle">
              <input
                className="input"
                value={draft.hero.subtitle}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hero: { ...draft.hero, subtitle: e.target.value },
                  })
                }
              />
            </Row>
            <Row label="CTA Button">
              <input
                className="input"
                value={draft.hero.cta}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...draft.hero, cta: e.target.value } })
                }
              />
            </Row>
          </div>
          <FileUpload
            label="Banner Image"
            value={draft.hero.image}
            onChange={(v) =>
              setDraft({ ...draft, hero: { ...draft.hero, image: v } })
            }
            recommended="1920 × 1080"
            aspect="aspect-video"
          />
        </div>
      </section>

      <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-6 z-40">
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary w-full md:w-auto shadow-2xl shadow-black/50"
        >
          <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
