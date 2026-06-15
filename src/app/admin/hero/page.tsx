"use client";
import FileUpload from "@/components/admin/FileUpload";
import Modal from "@/components/admin/Modal";
import { useSettings } from "@/context/SettingsContext";
import {
  removeHeroSlide,
  reorderHeroSlides,
  upsertHeroSlide,
} from "@/lib/db";
import { HeroSlide } from "@/types";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const MAX = 5;

export default function HeroAdminPage() {
  const { settings, refresh } = useSettings();
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [preview, setPreview] = useState<HeroSlide | null>(null);

  const slides = useMemo(
    () => (settings?.heroSlides || []).slice().sort((a, b) => a.order - b.order),
    [settings]
  );

  const onNew = () => {
    if (slides.length >= MAX) {
      toast.error(`Maximum ${MAX} hero slides`);
      return;
    }
    setEditing({
      id: "",
      imageUrlDesktop: "",
      imageUrlMobile: "",
      title: "",
      subtitle: "",
      buttonText: "Shop Now",
      buttonLink: "/shop",
      order: slides.length,
      active: true,
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await removeHeroSlide(id);
    await refresh();
    toast.success("Deleted");
  };

  const isActive = (s: HeroSlide) => s.active !== false && s.enabled !== false;
  const toggleEnabled = async (slide: HeroSlide) => {
    const next = !isActive(slide);
    await upsertHeroSlide({ ...slide, active: next, enabled: next });
    await refresh();
    toast.success(next ? "Slide enabled" : "Slide disabled");
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const next = slides.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    await reorderHeroSlides(next.map((s) => s.id));
    await refresh();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow text-silver-500">Content Management</div>
          <h1 className="h-display text-3xl md:text-4xl silver-text mt-1">
            Hero Slider
          </h1>
          <p className="text-silver-400 text-sm mt-1">
            {slides.length} / {MAX} slides · displayed on the homepage in order.
          </p>
        </div>
        <button onClick={onNew} className="btn-primary">
          <Plus size={14} /> Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="border border-dashed border-white/15 bg-ink-900/40 p-12 text-center">
          <div className="eyebrow text-silver-500 mb-2">Empty</div>
          <h2 className="h-display text-2xl silver-text">
            No hero slides yet
          </h2>
          <p className="text-silver-400 text-sm mt-2">
            Add up to {MAX} slides to power the homepage carousel.
          </p>
          <button onClick={onNew} className="btn-primary mt-6">
            <Plus size={14} /> Add Your First Slide
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {slides.map((s, i) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-white/10 bg-ink-900 p-3 sm:p-4 grid grid-cols-[88px_1fr_auto] sm:grid-cols-[120px_1fr_auto] gap-3 sm:gap-4 items-center"
            >
              <div className="relative aspect-[16/10] bg-ink-800 overflow-hidden">
                {(() => {
                  const thumb = s.imageUrlDesktop || s.image || s.imageUrlMobile;
                  if (!thumb) return (
                    <div className="absolute inset-0 grid place-items-center text-silver-600 text-[10px] uppercase tracking-widest">
                      No image
                    </div>
                  );
                  return (
                    <Image
                      src={thumb}
                      alt={s.title}
                      fill
                      sizes="120px"
                      className="object-cover"
                      unoptimized={thumb.startsWith("data:")}
                    />
                  );
                })()}
                <span className="absolute top-1 left-1 text-[9px] uppercase tracking-[0.25em] bg-black/70 px-1.5 py-0.5">
                  {i + 1}
                </span>
              </div>
              <div className={`min-w-0 ${!isActive(s) ? "opacity-50" : ""}`}>
                <div className="font-semibold text-sm truncate flex items-center gap-2">
                  {s.title || <span className="text-silver-500">Untitled slide</span>}
                  {!isActive(s) && (
                    <span className="text-[9px] uppercase tracking-[0.2em] border border-white/20 px-1.5 py-0.5 text-silver-400">
                      Disabled
                    </span>
                  )}
                </div>
                {s.subtitle && (
                  <div className="text-[12px] text-silver-400 mt-0.5 line-clamp-2">
                    {s.subtitle}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-[0.2em] text-silver-500 mt-1.5 truncate">
                  {s.buttonText || "—"} → {s.buttonLink || "/"}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <IconButton onClick={() => move(s.id, -1)} disabled={i === 0} title="Move up">
                    <ArrowUp size={13} />
                  </IconButton>
                  <IconButton onClick={() => move(s.id, 1)} disabled={i === slides.length - 1} title="Move down">
                    <ArrowDown size={13} />
                  </IconButton>
                </div>
                <div className="flex gap-1.5">
                  <IconButton
                    onClick={() => toggleEnabled(s)}
                    title={isActive(s) ? "Disable slide" : "Enable slide"}
                  >
                    {isActive(s) ? <Eye size={13} /> : <EyeOff size={13} />}
                  </IconButton>
                  <IconButton onClick={() => setPreview(s)} title="Preview">
                    <Eye size={13} />
                  </IconButton>
                  <IconButton onClick={() => setEditing(s)} title="Edit">
                    <Edit2 size={13} />
                  </IconButton>
                  <IconButton onClick={() => onDelete(s.id)} title="Delete" danger>
                    <Trash2 size={13} />
                  </IconButton>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {editing && (
        <SlideEditor
          slide={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setEditing(null);
          }}
        />
      )}

      {preview && (
        <PreviewModal slide={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

function IconButton({
  onClick,
  children,
  disabled,
  title,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 grid place-items-center border transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "border-white/10 hover:bg-red-500/15 text-red-400"
          : "border-white/10 hover:bg-white hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function SlideEditor({
  slide,
  onClose,
  onSaved,
}: {
  slide: HeroSlide;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [s, setS] = useState<HeroSlide>(slide);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const desktop = s.imageUrlDesktop || s.image;
    if (!desktop) return toast.error("Upload a desktop hero image");
    if (!s.title) return toast.error("Title is required");
    setSaving(true);
    try {
      // Promote `image` → `imageUrlDesktop` for clean storage; keep both for legacy
      await upsertHeroSlide({
        ...s,
        imageUrlDesktop: desktop,
        image: desktop,
        active: s.active !== false,
      });
      toast.success("Saved");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} size="xl">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-ink-900 z-10 -mx-5 px-5 sm:-mx-6 sm:px-6 pb-3 border-b border-white/5">
        <h2 className="font-display text-2xl silver-text">
          {s.id ? "Edit Slide" : "New Slide"}
        </h2>
        <button onClick={onClose} className="btn-icon" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <FileUpload
          label="Desktop Image"
          value={s.imageUrlDesktop || s.image || ""}
          onChange={(v) => setS({ ...s, imageUrlDesktop: v, image: v })}
          recommended="1920 × 1080"
          aspect="aspect-video"
          folder="doozy/hero"
        />
        <FileUpload
          label="Mobile Image (optional)"
          value={s.imageUrlMobile || ""}
          onChange={(v) => setS({ ...s, imageUrlMobile: v })}
          recommended="800 × 1100"
          aspect="aspect-[4/5]"
          folder="doozy/hero"
        />
        <Row label="Title">
          <input
            className="input"
            value={s.title}
            onChange={(e) => setS({ ...s, title: e.target.value })}
          />
        </Row>
        <Row label="Subtitle">
          <input
            className="input"
            value={s.subtitle}
            onChange={(e) => setS({ ...s, subtitle: e.target.value })}
          />
        </Row>
        <Row label="Button Text">
          <input
            className="input"
            value={s.buttonText}
            onChange={(e) => setS({ ...s, buttonText: e.target.value })}
          />
        </Row>
        <Row label="Button Link">
          <input
            className="input"
            placeholder="/shop or /shop?category=men"
            value={s.buttonLink}
            onChange={(e) => setS({ ...s, buttonLink: e.target.value })}
          />
        </Row>
      </div>

      {/* Live mini preview */}
      <div className="mt-6">
        <div className="label">Preview</div>
        <MiniPreview slide={s} />
      </div>

      <div className="mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 pt-4 pb-1 border-t border-white/10 sticky bottom-0 bg-ink-900 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 z-10">
        <div className="flex gap-2">
          {s.id && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this slide?")) return;
                try {
                  await removeHeroSlide(s.id);
                  toast.success("Slide deleted");
                  onSaved();
                } catch (e: any) {
                  toast.error(e?.message || "Delete failed");
                }
              }}
              className="text-[10px] uppercase tracking-[0.22em] border border-red-500/30 text-red-300 hover:bg-red-500/15 px-4 py-3 transition flex items-center gap-2"
            >
              <Trash2 size={12} /> Delete Slide
            </button>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : s.id ? "Update Slide" : "Save Slide"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewModal({ slide, onClose }: { slide: HeroSlide; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/90 grid place-items-center p-4 cursor-zoom-out"
    >
      <div className="relative w-full max-w-5xl aspect-video bg-ink-900" onClick={(e) => e.stopPropagation()}>
        <MiniPreview slide={slide} large />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 grid place-items-center bg-black/60 border border-white/15"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function MiniPreview({ slide, large }: { slide: HeroSlide; large?: boolean }) {
  return (
    <div
      className={`relative w-full ${
        large ? "h-full" : "aspect-video"
      } overflow-hidden bg-ink-800`}
    >
      {(() => {
        const src = slide.imageUrlDesktop || slide.image || slide.imageUrlMobile;
        if (!src) return null;
        return (
          <Image
            src={src}
            alt={slide.title}
            fill
            className="object-cover"
            unoptimized={src.startsWith("data:")}
          />
        );
      })()}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 p-6 sm:p-10 flex items-end sm:items-center">
        <div className="max-w-md">
          <div className="eyebrow text-silver-300 mb-2">New Season · 2026</div>
          <h3 className={`font-display silver-text leading-[0.95] ${large ? "text-5xl" : "text-2xl sm:text-3xl"}`}>
            {slide.title || "Title…"}
          </h3>
          {slide.subtitle && (
            <p className="text-silver-300 text-xs sm:text-sm mt-3 line-clamp-2">{slide.subtitle}</p>
          )}
          {slide.buttonText && (
            <span className="mt-4 inline-block text-[10px] uppercase tracking-[0.25em] bg-white text-black px-3 py-2">
              {slide.buttonText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
