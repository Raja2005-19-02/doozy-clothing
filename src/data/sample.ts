// Optional sample content — only inserted when the admin clicks
// "Seed sample data" in /admin/settings. Never loaded at runtime.

import { Category, Coupon, HeroSlide, Order, Product, Review } from "@/types";

export const sampleCategories: Category[] = [
  { id: "men", name: "Men", slug: "men", image: "/collection-men.jpg" },
  { id: "women", name: "Women", slug: "women", image: "/collection-women.jpg" },
  { id: "accessories", name: "Accessories", slug: "accessories", image: "/collection-accessories.jpg" },
];

const SIZES = ["S", "M", "L", "XL"];
const COLORS = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Charcoal", hex: "#3a3a3a" },
  { name: "Silver", hex: "#c0c0c0" },
];

export const sampleProducts: Product[] = [
  {
    id: "p1", slug: "shadow-oversized-hoodie", name: "Shadow Oversized Hoodie",
    description: "Drop-shoulder oversized hoodie crafted from 480gsm heavyweight French terry.",
    price: 2999, salePrice: 2299, category: "men", sizes: SIZES, colors: COLORS,
    stock: 24, images: ["/product-hoodie.jpg", "/product-sweatshirt.jpg"],
    featured: true, newArrival: true, bestSeller: true, rating: 4.8, reviewCount: 142,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "p2", slug: "midnight-essential-tee", name: "Midnight Essential Tee",
    description: "Heavyweight 240gsm cotton tee with a boxy relaxed cut.",
    price: 1299, salePrice: 999, category: "men", sizes: SIZES, colors: COLORS,
    stock: 60, images: ["/product-tshirt.jpg"], newArrival: true, bestSeller: true,
    rating: 4.7, reviewCount: 89, createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: "p3", slug: "obsidian-bomber-jacket", name: "Obsidian Bomber Jacket",
    description: "Vegan leather bomber jacket with satin lining and ribbed cuffs.",
    price: 5999, salePrice: 4799, category: "men", sizes: SIZES, colors: COLORS.slice(0, 2),
    stock: 12, images: ["/product-jacket.jpg"], featured: true, bestSeller: true,
    rating: 4.9, reviewCount: 56, createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: "p4", slug: "noir-slim-denim", name: "Noir Slim Denim",
    description: "Premium stretch denim cut slim through the leg, mid-rise.",
    price: 2499, category: "men", sizes: SIZES, colors: COLORS.slice(0, 2),
    stock: 38, images: ["/product-jeans.jpg"], newArrival: true,
    rating: 4.6, reviewCount: 41, createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: "p5", slug: "signature-snapback", name: "Signature Snapback",
    description: "Structured six-panel snapback with silver-thread DV monogram.",
    price: 899, salePrice: 699, category: "accessories", sizes: ["One Size"], colors: COLORS,
    stock: 80, images: ["/product-cap.jpg"], featured: true,
    rating: 4.5, reviewCount: 73, createdAt: Date.now() - 10 * 86400000,
  },
  {
    id: "p6", slug: "fog-crewneck-sweatshirt", name: "Fog Crewneck Sweatshirt",
    description: "Heavyweight fleece crewneck in fog grey.",
    price: 2499, category: "women", sizes: SIZES, colors: COLORS,
    stock: 22, images: ["/product-sweatshirt.jpg"], newArrival: true, bestSeller: true,
    rating: 4.7, reviewCount: 64, createdAt: Date.now() - 12 * 86400000,
  },
];

export const sampleReviews: Review[] = [
  { id: "r1", productId: "p1", userName: "Aarav S.", rating: 5, text: "Insane quality. Feels like a $200 hoodie.", approved: true, createdAt: Date.now() - 86400000 },
  { id: "r2", productId: "p2", userName: "Riya M.", rating: 5, text: "Best tee I own. Perfect fit.", approved: true, createdAt: Date.now() - 2 * 86400000 },
  { id: "r3", productId: "p3", userName: "Karan V.", rating: 5, text: "Premium feel, looks expensive.", approved: true, createdAt: Date.now() - 3 * 86400000 },
];

export const sampleCoupons: Coupon[] = [
  { id: "c1", code: "DOOZY10", type: "percent", value: 10, active: true },
  { id: "c2", code: "FLAT500", type: "flat", value: 500, active: true },
];

export const sampleHeroSlides: HeroSlide[] = [
  {
    id: "hs1",
    image: "/hero.jpg",
    title: "Wear the Night.",
    subtitle: "Premium streetwear engineered for the bold. New season drop now live.",
    buttonText: "Shop The Collection",
    buttonLink: "/shop",
    order: 0,
  },
  {
    id: "hs2",
    image: "/collection-men.jpg",
    title: "Men's Edit",
    subtitle: "Heavyweight cottons. Vegan leather. Built to move.",
    buttonText: "Shop Men",
    buttonLink: "/shop?category=men",
    order: 1,
  },
  {
    id: "hs3",
    image: "/collection-women.jpg",
    title: "Women's Edit",
    subtitle: "Silhouettes engineered for the night.",
    buttonText: "Shop Women",
    buttonLink: "/shop?category=women",
    order: 2,
  },
];

export const sampleOrders: Order[] = [];
