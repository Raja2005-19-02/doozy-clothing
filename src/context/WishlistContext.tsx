"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface WishCtx {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}
const Ctx = createContext<WishCtx | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("doozy_wish");
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("doozy_wish", JSON.stringify(ids));
    } catch {}
  }, [ids]);
  const toggle = (id: string) =>
    setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const has = (id: string) => ids.includes(id);
  const clear = () => setIds([]);
  return <Ctx.Provider value={{ ids, toggle, has, clear }}>{children}</Ctx.Provider>;
}
export const useWishlist = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist outside provider");
  return c;
};
