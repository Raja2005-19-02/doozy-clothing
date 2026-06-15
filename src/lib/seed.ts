// Admin-only sample data seeder. Called from /admin/settings → Danger Zone.
// Writes sample products, categories, reviews, coupons, hero slides to the
// current data layer (Firestore in live mode, in-memory in dev).

import {
  _mockStore,
  deleteCategory,
  deleteCoupon,
  deleteProduct,
  deleteReview,
  listCategories,
  listCoupons,
  listProducts,
  listReviews,
  updateSettings,
  upsertCategory,
  upsertCoupon,
  upsertProduct,
} from "./db";
import { firebaseEnabled } from "./firebase";
import {
  sampleCategories,
  sampleCoupons,
  sampleHeroSlides,
  sampleProducts,
  sampleReviews,
} from "@/data/sample";

export async function seedSampleData() {
  // Categories
  for (const c of sampleCategories) {
    await upsertCategory(c);
  }
  // Products
  for (const p of sampleProducts) {
    await upsertProduct(p);
  }
  // Coupons
  for (const c of sampleCoupons) {
    await upsertCoupon(c);
  }
  // Reviews — mock store direct push (db.createReview always adds new IDs)
  if (firebaseEnabled) {
    const { collection, addDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    for (const r of sampleReviews) {
      try {
        await addDoc(collection(db!, "reviews"), r);
      } catch {}
    }
  } else {
    for (const r of sampleReviews) _mockStore.reviews.unshift(r);
  }
  // Hero slides → store inside settings
  await updateSettings({ heroSlides: sampleHeroSlides });
}

export async function clearAllData() {
  // Products
  for (const p of await listProducts()) await deleteProduct(p.id);
  // Categories
  for (const c of await listCategories()) await deleteCategory(c.id);
  // Reviews
  for (const r of await listReviews()) await deleteReview(r.id);
  // Coupons
  for (const c of await listCoupons()) await deleteCoupon(c.id);
  // Hero slides
  await updateSettings({ heroSlides: [] });
}
