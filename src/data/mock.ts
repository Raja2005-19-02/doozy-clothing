// Production: this file ships ZERO seed data. The app reads only from
// Firestore (or the empty in-memory store when Firebase is disabled).
//
// `defaultSettings` is the *initial* settings document — only used as a
// fallback when no settings doc exists yet in Firestore. The admin is expected
// to fill these in via /admin/settings.
//
// If you want to populate sample data for testing, use the "Seed sample data"
// button in /admin/settings.

import {
  Category,
  Coupon,
  Order,
  Product,
  Review,
  SiteSettings,
} from "@/types";

export const mockCategories: Category[] = [];
export const mockProducts: Product[] = [];
export const mockReviews: Review[] = [];
export const mockCoupons: Coupon[] = [];
export const mockOrders: Order[] = [];

export const mockSettings: SiteSettings = {
  websiteName: "DOOZY",
  logo: "",
  favicon: "",
  announcement: "",
  hero: { title: "", subtitle: "", cta: "Shop The Collection", image: "" },
  heroSlides: [],
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    mapLink: "",
  },
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
    telegram: "",
    twitter: "",
  },
  shipping: { charge: 99, freeThreshold: 1499, estimate: "3–6 business days" },
  payments: { upiId: "", razorpayKey: "", codEnabled: true },
  policies: { privacy: "", terms: "", refund: "" },
  business: {
    legalName: "DOOZY CLOTHING",
    gstin: "",
    invoicePrefix: "DZ-INV",
    invoiceFooterNote: "Thank you for shopping with Doozy.",
  },
  notifications: {
    enabled: true,
    email: "",
    mobile: "",
    notifyOnNewOrder: true,
    notifyOnStatusChange: false,
    notifyOnPayment: true,
  },
  footer: "© DOOZY. All rights reserved.",
};
