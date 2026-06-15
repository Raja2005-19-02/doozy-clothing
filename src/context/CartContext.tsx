"use client";
import { CartItem } from "@/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface CartCtx {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, size: string, color: string) => void;
  setQty: (
    productId: string,
    size: string,
    color: string,
    qty: number
  ) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("doozy_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("doozy_cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (item: CartItem) =>
    setItems((prev) => {
      const i = prev.findIndex(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          p.color === item.color
      );
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: copy[i].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });

  const remove = (productId: string, size: string, color: string) =>
    setItems((p) =>
      p.filter(
        (x) =>
          !(x.productId === productId && x.size === size && x.color === color)
      )
    );

  const setQty = (
    productId: string,
    size: string,
    color: string,
    qty: number
  ) =>
    setItems((p) =>
      p
        .map((x) =>
          x.productId === productId && x.size === size && x.color === color
            ? { ...x, quantity: Math.max(1, qty) }
            : x
        )
        .filter((x) => x.quantity > 0)
    );

  const clear = () => setItems([]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      add,
      remove,
      setQty,
      clear,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    [items]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
