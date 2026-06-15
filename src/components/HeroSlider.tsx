"use client";
import { cldOptim } from "@/lib/cloudinary";
import { HeroSlide } from "@/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  slides: HeroSlide[];
  fallbackImage?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackCta?: string;
}

const AUTOPLAY_MS = 5000;

export default function HeroSlider({
  slides,
  fallbackImage,
  fallbackTitle,
  fallbackSubtitle,
  fallbackCta = "Shop The Collection",
}: Props) {
  const reduce = useReducedMotion();
  const isActive = (s: HeroSlide) => s.active !== false && s.enabled !== false;
  const visible = (slides || []).filter(isActive);
  const list = visible.length > 0
    ? visible
    : fallbackImage || fallbackTitle
    ? [{
        id: "fallback",
        image: fallbackImage || "",
        imageUrlDesktop: fallbackImage || "",
        title: fallbackTitle || "Wear the Night.",
        subtitle: fallbackSubtitle || "",
        buttonText: fallbackCta,
        buttonLink: "/shop",
        order: 0,
        active: true,
      } as HeroSlide]
    : [];

  const pickDesktopImage = (s: HeroSlide) =>
    s.imageUrlDesktop || s.image || s.imageUrlMobile || "";
  const pickMobileImage = (s: HeroSlide) =>
    s.imageUrlMobile || s.imageUrlDesktop || s.image || "";

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Autoplay
  useEffect(() => {
    if (list.length <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [list.length, paused]);

  // Empty state
  if (list.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-[80vh] w-full grid place-items-center bg-ink-900 border-b border-white/10">
        <div className="text-center px-6 max-w-md">
          <div className="eyebrow text-silver-500 mb-3">No Hero Images</div>
          <h1 className="h-display text-4xl md:text-6xl silver-text">DOOZY</h1>
          <p className="text-silver-400 text-sm mt-4 leading-relaxed">
            Admin: open <span className="text-white">/admin/hero</span> to upload up to
            5 hero slides. They'll appear here automatically.
          </p>
        </div>
      </section>
    );
  }

  const slide = list[idx];

  const go = (i: number) => setIdx(((i % list.length) + list.length) % list.length);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  return (
    <section
      className="relative h-[70vh] md:h-[88vh] w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => (touchStartX.current = null)}
    >
      {/* Background images with zoom + fade */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={slide.id + idx}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1.0 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 7, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          {(() => {
            const desktopSrc = pickDesktopImage(slide);
            const mobileSrc = pickMobileImage(slide);
            const data = desktopSrc.startsWith("data:") || mobileSrc.startsWith("data:");
            return (
              <picture>
                {mobileSrc && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={cldOptim(mobileSrc, "q_auto,f_auto,w_800,c_fill")}
                  />
                )}
                {desktopSrc && (
                  <img
                    src={cldOptim(desktopSrc, "q_auto,f_auto,w_1920,c_fill")}
                    alt={slide.title}
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                )}
                {!desktopSrc && !mobileSrc && (
                  <div className="absolute inset-0 bg-gradient-to-br from-ink-900 to-black grain" />
                )}
                {data && <span className="hidden">{data}</span>}
              </picture>
            );
          })()}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Side label */}
      <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-left items-center gap-3 text-[10px] uppercase tracking-[0.5em] text-silver-400">
        <span className="w-12 h-px bg-silver-500" />
        Collection 01 / 26
      </div>

      {/* Content */}
      <div className="relative h-full container-x flex items-end md:items-center pt-20 pb-24 md:py-0">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + "-content-" + idx}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="eyebrow mb-5 flex items-center gap-3">
                <span className="w-8 h-px bg-white/40" /> New Season · 2026
              </div>
              <h1 className="h-display text-[clamp(2.4rem,8vw,6.5rem)] silver-text">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-4 md:mt-5 text-silver-300 text-[13px] md:text-base max-w-md leading-relaxed line-clamp-3 md:line-clamp-none">
                  {slide.subtitle}
                </p>
              )}
              {slide.buttonText && (
                <div className="mt-6 md:mt-8 flex flex-wrap gap-3">
                  <Link href={slide.buttonLink || "/shop"} className="btn-primary">
                    {slide.buttonText} <ArrowRight size={14} />
                  </Link>
                  <Link href="/shop?filter=new" className="btn-ghost">
                    New Arrivals
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls — desktop arrows */}
      {list.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="grid absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 place-items-center border border-white/20 bg-black/40 backdrop-blur hover:bg-white hover:text-black transition z-10"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="grid absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 place-items-center border border-white/20 bg-black/40 backdrop-blur hover:bg-white hover:text-black transition z-10"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>

          {/* Dots + progress */}
          <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-2 z-10">
            {list.map((s, i) => {
              const active = i === idx;
              return (
                <button
                  key={s.id + i}
                  onClick={() => go(i)}
                  className="group h-1.5 relative rounded-none overflow-hidden bg-white/15 transition-all"
                  style={{ width: active ? 36 : 14 }}
                  aria-label={`Go to slide ${i + 1}`}
                >
                  {active && !paused && (
                    <motion.span
                      key={"p-" + idx}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                      className="absolute inset-y-0 left-0 bg-white"
                    />
                  )}
                  {active && paused && (
                    <span className="absolute inset-0 bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
