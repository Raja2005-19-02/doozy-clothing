// Doozy data layer — Firestore only.
//
// ❌ No mock data, no in-memory store. Every helper either talks to Firestore
//    or returns an empty/default value if Firebase isn't configured (so the
//    project still builds & dev-renders, but never serves fake content).

import { db, firebaseEnabled } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  where,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { defaultSettings } from "@/data/defaults";
import {
  Category,
  Coupon,
  HeroSlide,
  Order,
  OrderStatus,
  PaymentInfo,
  Product,
  Review,
  SiteSettings,
} from "@/types";

const uid = () => Math.random().toString(36).slice(2, 10);
const norm = (d: any) => {
  if (d?.createdAt?.toMillis) d.createdAt = d.createdAt.toMillis();
  return d;
};

/**
 * Recursively strip `undefined` values from an object/array.
 * Firestore rejects any field set to `undefined`. Use this before every
 * setDoc / addDoc / updateDoc call. Null values are preserved.
 */
function clean<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => clean(v)).filter((v) => v !== undefined) as any;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: any = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

async function safeFb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (typeof window === "undefined") {
      console.warn("[Firestore]", e?.code || e?.message || e);
    }
    return fallback;
  }
}

function subscribePolling<T>(load: () => Promise<T>, cb: (v: T) => void): () => void {
  // Used when Firebase isn't configured — cheap no-op poll so listeners don't crash.
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try { cb(await load()); } catch {}
    setTimeout(tick, 2000);
  };
  tick();
  return () => { stopped = true; };
}

// ───────────────────────── PRODUCTS ─────────────────────────
export async function listProducts(): Promise<Product[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(
        query(collection(fdb, "products"), orderBy("createdAt", "desc"))
      );
      return snap.docs.map((d) => norm({ id: d.id, ...(d.data() as any) }));
    }, [] as Product[]);
  }
  return [];
}
export function subscribeProducts(cb: (list: Product[]) => void): () => void {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return onSnapshot(
      query(collection(fdb, "products"), orderBy("createdAt", "desc")),
      (snap) => cb(snap.docs.map((d) => norm({ id: d.id, ...(d.data() as any) }))),
      (err) => console.warn("[products subscribe]", err)
    );
  }
  return subscribePolling(listProducts, cb);
}
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const direct = await getDoc(doc(fdb, "products", idOrSlug));
      if (direct.exists()) return norm({ id: direct.id, ...(direct.data() as any) }) as Product;
      const snap = await getDocs(
        query(collection(fdb, "products"), where("slug", "==", idOrSlug))
      );
      if (!snap.empty) {
        const d = snap.docs[0];
        return norm({ id: d.id, ...(d.data() as any) }) as Product;
      }
      return null;
    }, null);
  }
  return null;
}
export async function upsertProduct(p: Product): Promise<Product> {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const id = p.id || uid();
  const payload = { ...p, id, createdAt: p.createdAt || Date.now() };
  await setDoc(doc(db, "products", id), clean(payload));
  return payload;
}
export async function deleteProduct(id: string) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return deleteDoc(doc(db, "products", id));
}
export async function trackProductView(id: string) {
  if (!(firebaseEnabled && db)) return;
  try {
    await updateDoc(doc(db, "products", id), { views: increment(1) as any });
  } catch {}
}
export async function adjustStock(productId: string, _size: string, delta: number) {
  if (!(firebaseEnabled && db)) return;
  try {
    await updateDoc(doc(db, "products", productId), { stock: increment(delta) as any });
  } catch {}
}

// ───────────────────────── CATEGORIES ─────────────────────────
export async function listCategories(): Promise<Category[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(collection(fdb, "categories"));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }, [] as Category[]);
  }
  return [];
}
export function subscribeCategories(cb: (list: Category[]) => void): () => void {
  if (firebaseEnabled && db) {
    return onSnapshot(collection(db, "categories"), (snap) =>
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }
  return subscribePolling(listCategories, cb);
}
export async function upsertCategory(c: Category) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const id = c.id || uid();
  await setDoc(doc(db, "categories", id), clean({ ...c, id }));
  return { ...c, id };
}
export async function deleteCategory(id: string) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return deleteDoc(doc(db, "categories", id));
}

// ───────────────────────── ORDERS ─────────────────────────
export async function listOrders(): Promise<Order[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(
        query(collection(fdb, "orders"), orderBy("createdAt", "desc"))
      );
      return snap.docs.map((d) => norm({ id: d.id, ...(d.data() as any) }));
    }, [] as Order[]);
  }
  return [];
}
export async function listUserOrders(userId: string): Promise<Order[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(
        query(
          collection(fdb, "orders"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
      );
      return snap.docs.map((d) => norm({ id: d.id, ...(d.data() as any) }));
    }, [] as Order[]);
  }
  return [];
}
export async function getOrder(id: string): Promise<Order | null> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const s = await getDoc(doc(fdb, "orders", id));
      return s.exists() ? (norm({ id: s.id, ...(s.data() as any) }) as Order) : null;
    }, null);
  }
  return null;
}
export async function createOrder(o: Order): Promise<Order> {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  o.statusHistory = o.statusHistory || [{ status: o.status, at: o.createdAt }];
  await setDoc(doc(db, "orders", o.id), clean(o));
  // Admin notification doc
  try {
    await addDoc(collection(db, "notifications"), clean({
      type: "new_order",
      orderId: o.id,
      customer: o?.address?.name || "Customer",
      amount: typeof o?.total === "number" ? o.total : 0,
      createdAt: Date.now(),
      read: false,
    }));
  } catch {}
  // Local in-app log (admin browser)
  try {
    pushNotification({
      type: "new_order",
      orderId: o.id,
      customer: o?.address?.name || "Customer",
      amount: typeof o?.total === "number" ? o.total : 0,
    });
  } catch {}
  return o;
}
export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const cur = await getOrder(id);
  const history = cur?.statusHistory || [];
  return updateDoc(doc(db, "orders", id), clean({
    status,
    statusHistory: [...history, { status, at: Date.now() }],
  }));
}
export async function updateOrderPayment(id: string, payment: Partial<PaymentInfo>) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const cur = await getOrder(id);
  return updateDoc(doc(db, "orders", id), clean({
    payment: { ...(cur?.payment || {}), ...payment },
  }));
}
export async function updateOrderNotes(id: string, notes: string) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return updateDoc(doc(db, "orders", id), clean({ notes }));
}
export function subscribeOrders(cb: (orders: Order[]) => void): () => void {
  if (firebaseEnabled && db) {
    return onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => cb(snap.docs.map((d) => norm({ id: d.id, ...(d.data() as any) }))),
      (err) => console.warn("[orders subscribe]", err)
    );
  }
  return subscribePolling(listOrders, cb);
}

// ───────────────────────── REVIEWS ─────────────────────────
export async function listReviews(productId?: string): Promise<Review[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(collection(fdb, "reviews"));
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return productId ? all.filter((r: Review) => r.productId === productId) : all;
    }, [] as Review[]);
  }
  return [];
}
export function subscribeReviews(cb: (list: Review[]) => void): () => void {
  if (firebaseEnabled && db) {
    return onSnapshot(
      collection(db, "reviews"),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
      (err) => console.warn("[reviews subscribe]", err)
    );
  }
  return subscribePolling(listReviews, cb);
}
export async function createReview(r: Review): Promise<Review> {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const ref = await addDoc(collection(db, "reviews"), clean(r));
  return { ...r, id: ref.id };
}
export async function approveReview(id: string, approved: boolean) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return updateDoc(doc(db, "reviews", id), clean({ approved }));
}
export async function deleteReview(id: string) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return deleteDoc(doc(db, "reviews", id));
}

// ───────────────────────── COUPONS ─────────────────────────
export async function listCoupons(): Promise<Coupon[]> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const snap = await getDocs(collection(fdb, "coupons"));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }, [] as Coupon[]);
  }
  return [];
}
export async function upsertCoupon(c: Coupon) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  const id = c.id || uid();
  await setDoc(doc(db, "coupons", id), clean({ ...c, id }));
  return { ...c, id };
}
export async function deleteCoupon(id: string) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  return deleteDoc(doc(db, "coupons", id));
}
export async function applyCoupon(code: string, subtotal: number) {
  const coupons = await listCoupons();
  const c = coupons.find(
    (x) => x.code.toLowerCase() === code.toLowerCase() && x.active
  );
  if (!c) return { ok: false as const, message: "Invalid coupon" };
  if (c.expiresAt && c.expiresAt < Date.now())
    return { ok: false as const, message: "Coupon expired" };
  const discount =
    c.type === "flat" ? c.value : Math.round((subtotal * c.value) / 100);
  return { ok: true as const, discount, coupon: c };
}

// ───────────────────────── HERO SLIDES ─────────────────────────
// Stored inside settings/site.heroSlides[] (admin can keep up to 5).
export async function listHeroSlides(): Promise<HeroSlide[]> {
  const s = await getSettings();
  return (s.heroSlides || []).slice().sort((a, b) => a.order - b.order);
}
export function subscribeHeroSlides(cb: (slides: HeroSlide[]) => void): () => void {
  return subscribeSettings((s) => {
    cb(((s?.heroSlides || []) as HeroSlide[]).slice().sort((a, b) => a.order - b.order));
  });
}
export async function upsertHeroSlide(slide: HeroSlide): Promise<HeroSlide[]> {
  const s = await getSettings();
  let slides = (s.heroSlides || []).slice();
  const idx = slides.findIndex((x) => x.id === slide.id);
  if (idx >= 0) slides[idx] = slide;
  else {
    if (slides.length >= 5) throw new Error("Maximum 5 hero slides");
    slides.push({ ...slide, id: slide.id || uid() });
  }
  slides = slides.sort((a, b) => a.order - b.order);
  await updateSettings({ heroSlides: slides });
  return slides;
}
export async function removeHeroSlide(id: string) {
  const s = await getSettings();
  const slides = (s.heroSlides || []).filter((x) => x.id !== id);
  await updateSettings({ heroSlides: slides });
  return slides;
}
export async function reorderHeroSlides(orderedIds: string[]) {
  const s = await getSettings();
  const map = new Map((s.heroSlides || []).map((x) => [x.id, x]));
  const slides = orderedIds
    .map((id, i) => (map.get(id) ? { ...map.get(id)!, order: i } : null))
    .filter(Boolean) as HeroSlide[];
  await updateSettings({ heroSlides: slides });
  return slides;
}

// ───────────────────────── NOTIFICATIONS (in-app log) ─────────────────────────
export interface NotificationLogEntry {
  id: string;
  type: "new_order" | "status_change" | "payment";
  orderId: string;
  customer: string;
  amount: number;
  createdAt: number;
  read: boolean;
}
const NOTIF_KEY = "doozy_notifications";
const readNotifs = (): NotificationLogEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeNotifs = (list: NotificationLogEntry[]) => {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
};
export function listNotifications(): NotificationLogEntry[] {
  return readNotifs();
}
export function pushNotification(n: Omit<NotificationLogEntry, "id" | "createdAt" | "read">) {
  const list = readNotifs();
  list.unshift({
    id: Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    read: false,
    ...n,
  });
  writeNotifs(list);
}
export function markAllNotificationsRead() {
  writeNotifs(readNotifs().map((n) => ({ ...n, read: true })));
}

// ───────────────────────── SETTINGS ─────────────────────────
export async function getSettings(): Promise<SiteSettings> {
  if (firebaseEnabled && db) {
    const fdb = db!;
    return safeFb(async () => {
      const s = await getDoc(doc(fdb, "settings", "site"));
      if (s.exists()) return s.data() as SiteSettings;
      try { await setDoc(doc(fdb, "settings", "site"), clean(defaultSettings)); } catch {}
      return defaultSettings;
    }, defaultSettings);
  }
  return defaultSettings;
}
export function subscribeSettings(cb: (s: SiteSettings) => void): () => void {
  if (firebaseEnabled && db) {
    return onSnapshot(doc(db, "settings", "site"), (snap) => {
      if (snap.exists()) cb(snap.data() as SiteSettings);
      else cb(defaultSettings);
    });
  }
  return subscribePolling(getSettings, cb);
}
export async function updateSettings(patch: Partial<SiteSettings>) {
  if (!(firebaseEnabled && db)) throw new Error("Firebase not configured");
  await setDoc(doc(db, "settings", "site"), clean(patch), { merge: true });
  return getSettings();
}
