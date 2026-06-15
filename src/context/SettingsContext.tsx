"use client";
import {
  getSettings,
  subscribeSettings,
  updateSettings,
} from "@/lib/db";
import { SiteSettings } from "@/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface Ctx {
  settings: SiteSettings | null;
  refresh: () => Promise<void>;
  save: (patch: Partial<SiteSettings>) => Promise<void>;
}
const C = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const refresh = async () => setSettings(await getSettings());

  useEffect(() => {
    refresh();
    const unsub = subscribeSettings((s) => setSettings(s));
    return unsub;
  }, []);

  const save = async (patch: Partial<SiteSettings>) => {
    const next = await updateSettings(patch);
    setSettings(next);
  };
  return (
    <C.Provider value={useMemo(() => ({ settings, refresh, save }), [settings])}>
      {children}
    </C.Provider>
  );
}
export const useSettings = () => {
  const c = useContext(C);
  if (!c) throw new Error("useSettings outside provider");
  return c;
};
