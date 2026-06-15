"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const TEXT = "DOOZY";

export default function Preloader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem("doozy_preloaded");
    if (seen) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem("doozy_preloaded", "1");
      setShow(false);
    }, 1700);
    return () => clearTimeout(t);
  }, []);

  const letters = TEXT.split("");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] } }}
          className="fixed inset-0 z-[100] bg-black grid place-items-center overflow-hidden"
        >
          {/* Soft radial silver glow */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.15 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute w-[120vmin] h-[120vmin] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,transparent_55%)] pointer-events-none"
          />

          <div className="relative flex flex-col items-center">
            <div className="flex items-center justify-center overflow-hidden">
              {letters.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.07,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-display font-bold inline-block leading-none"
                  style={{
                    fontSize: "clamp(2.4rem, 9vw, 6rem)",
                    letterSpacing: "0.25em",
                    paddingRight: ch === " " ? "0.5em" : 0,
                    backgroundImage:
                      "linear-gradient(135deg,#ffffff 0%,#d4d4d8 30%,#ffffff 50%,#a1a1aa 70%,#ffffff 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-6 text-[10px] tracking-[0.5em] uppercase text-silver-400"
            >
              Luxury Streetwear
            </motion.div>

            <div className="mt-5 w-40 h-px bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
