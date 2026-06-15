// Default settings document.
//
// This is the ONLY place in the app that defines initial content. It's used:
//  1. As the schema/shape of the settings/site document
//  2. As a one-time bootstrap when the document doesn't exist in Firestore yet
//  3. As an SSR safe-fallback if Firestore is unreachable during a render
//
// All other content (products, orders, reviews, hero slides, categories,
// coupons, notifications, analytics) is read live from Firestore — the app
// ships ZERO seed/demo data.

import { SiteSettings } from "@/types";

export const defaultSettings: SiteSettings = {
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
  payments: {
    upiId: "",
    razorpayKey: "",
    razorpayKeySecret: "",
    razorpayEnabled: false,
    codEnabled: true,
  },
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
