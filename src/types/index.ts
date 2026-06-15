export type ID = string;

export interface Product {
  id: ID;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  images: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  rating?: number;
  reviewCount?: number;
  views?: number;
  createdAt?: number;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  image?: string;
}

export interface CartItem {
  productId: ID;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export interface Address {
  name: string;
  phone: string;
  email: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type PaymentMethod = "UPI" | "Razorpay" | "COD";
export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded"
  | "Collected"; // for COD

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAt?: number;
  // Razorpay
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  // UPI
  upiTransactionId?: string;
  upiApp?: string;
  // COD
  codCollectedAt?: number;
}

export interface Order {
  id: ID;
  userId?: ID; // empty when guest
  isGuest: boolean;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusHistory?: { status: OrderStatus; at: number }[];
  address: Address;
  paymentMethod: PaymentMethod;
  payment: PaymentInfo;
  couponCode?: string;
  notes?: string;
  createdAt: number;
}

export interface Review {
  id: ID;
  productId: ID;
  userId?: ID;
  userName: string;
  rating: number;
  text: string;
  image?: string;
  approved: boolean;
  createdAt: number;
}

export interface Coupon {
  id: ID;
  code: string;
  type: "flat" | "percent";
  value: number;
  expiresAt?: number;
  active: boolean;
}

export interface HeroSlide {
  id: ID;
  /** Legacy single image (kept for backwards compat) */
  image?: string;
  /** Desktop image (1920×1080) — preferred */
  imageUrlDesktop?: string;
  /** Mobile image (800×1100) — falls back to desktop on big screens */
  imageUrlMobile?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  active?: boolean;
  /** @deprecated use `active` */
  enabled?: boolean;
}

export interface SiteSettings {
  websiteName: string;
  logo: string;
  favicon: string;
  announcement: string;
  hero: { title: string; subtitle: string; cta: string; image: string };
  // New: slider with up to 5 slides
  heroSlides?: HeroSlide[];
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    mapLink: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    telegram: string;
    twitter: string;
  };
  shipping: {
    charge: number;
    freeThreshold: number;
    estimate: string;
  };
  payments: {
    upiId: string;
    razorpayKey: string;
    razorpayKeySecret?: string;
    razorpayEnabled?: boolean;
    codEnabled: boolean;
  };
  policies: {
    privacy: string;
    terms: string;
    refund: string;
  };
  // Invoice / business info
  business?: {
    legalName: string;
    gstin?: string;
    invoicePrefix?: string;
    invoiceFooterNote?: string;
  };
  // Admin notification preferences
  notifications?: {
    enabled: boolean;
    email: string;
    mobile: string;
    notifyOnNewOrder: boolean;
    notifyOnStatusChange: boolean;
    notifyOnPayment: boolean;
  };
  footer: string;
}

export interface AppUser {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: "user" | "admin";
  addresses?: Address[];
  createdAt: number;
}
