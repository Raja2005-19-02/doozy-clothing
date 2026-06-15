// Demo content seeder — DEVELOPMENT MODE ONLY.
//
// Pulls copyright-safe Unsplash fashion photography, routes it through
// Cloudinary's `fetch` URL transformer (so even demo images go through your
// Cloudinary optimization pipeline + auto WebP/AVIF + width transforms), and
// writes:
//   - 5 hero slides → settings/site.heroSlides
//   - 7 categories  → categories collection
//   - 30 products   → products collection (each with 5 unique images)
//
// All admin actions later (upload via /admin/hero, /admin/products) REPLACE
// these URLs with real Cloudinary uploads — no code changes needed.

import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import { CLOUDINARY } from "./cloudinary";
import { listCategories, listHeroSlides, listProducts, updateSettings } from "./db";
import { Category, HeroSlide, Product } from "@/types";

// ── Cloudinary "fetch" URL ──
// https://res.cloudinary.com/<cloud>/image/fetch/<transform>/<source_url>
// Requires "Fetched URL" delivery type to be enabled in Cloudinary (default ON).
function viaCloudinary(unsplashUrl: string, transform = "q_auto,f_auto") {
  const cloud = CLOUDINARY.cloud;
  if (!cloud) return unsplashUrl;
  return `https://res.cloudinary.com/${cloud}/image/fetch/${transform}/${encodeURIComponent(unsplashUrl)}`;
}

const uns = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// ─────────────────── HERO SLIDES (5) ───────────────────
const HERO_SOURCES: Array<{
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  desktop: string; // unsplash id
  mobile: string;
}> = [
  {
    id: "hs-1",
    title: "Luxury Hoodie",
    subtitle: "Heavyweight French terry. Engineered for the bold.",
    buttonText: "Shop Hoodies",
    buttonLink: "/shop?category=hoodies",
    desktop: "photo-1556821840-3a63f95609a7", // dark male model hoodie
    mobile: "photo-1552374196-1ab2a1c593e8",
  },
  {
    id: "hs-2",
    title: "Premium Black T-Shirt",
    subtitle: "Heavyweight 240gsm cotton. Boxy, oversized cut.",
    buttonText: "Shop Tees",
    buttonLink: "/shop?category=t-shirts",
    desktop: "photo-1503341504253-dff4815485f1", // black tee editorial
    mobile: "photo-1503341338985-c0477be52513",
  },
  {
    id: "hs-3",
    title: "Oversized Collection",
    subtitle: "Drop-shoulder silhouettes built to move with you.",
    buttonText: "Explore",
    buttonLink: "/shop?category=oversized",
    desktop: "photo-1490481651871-ab68de25d43d", // dark fashion editorial
    mobile: "photo-1483985988355-763728e1935b",
  },
  {
    id: "hs-4",
    title: "Night Collection",
    subtitle: "Where shadows become style.",
    buttonText: "Shop The Drop",
    buttonLink: "/shop",
    desktop: "photo-1518049362265-d5b2a6467637", // moody dark portrait
    mobile: "photo-1517466787929-bc90951d0974",
  },
  {
    id: "hs-5",
    title: "New Season Drop",
    subtitle: "Limited edition pieces — once they're gone, they're gone.",
    buttonText: "Shop New Arrivals",
    buttonLink: "/shop?filter=new",
    desktop: "photo-1542838132-92c53300491e", // street fashion
    mobile: "photo-1591047139829-d91aecb6caea",
  },
];

const buildHeroSlides = (): HeroSlide[] =>
  HERO_SOURCES.map((h, i) => {
    const desktopUrl = viaCloudinary(uns(h.desktop, 1920), "q_auto,f_auto,w_1920,c_fill,g_auto");
    const mobileUrl = viaCloudinary(uns(h.mobile, 1000), "q_auto,f_auto,w_900,c_fill,g_auto");
    return {
      id: h.id,
      title: h.title,
      subtitle: h.subtitle,
      buttonText: h.buttonText,
      buttonLink: h.buttonLink,
      imageUrlDesktop: desktopUrl,
      imageUrlMobile: mobileUrl,
      image: desktopUrl,
      order: i,
      active: true,
    };
  });

// ─────────────────── CATEGORIES (7) ───────────────────
const CATEGORY_SOURCES: Array<{ slug: string; name: string; img: string }> = [
  { slug: "t-shirts", name: "T-Shirts", img: "photo-1503341504253-dff4815485f1" },
  { slug: "oversized", name: "Oversized", img: "photo-1490481651871-ab68de25d43d" },
  { slug: "hoodies", name: "Hoodies", img: "photo-1556821840-3a63f95609a7" },
  { slug: "jackets", name: "Jackets", img: "photo-1551028719-00167b16eac5" },
  { slug: "cargo", name: "Cargo", img: "photo-1473966968600-fa801b869a1a" },
  { slug: "shirts", name: "Shirts", img: "photo-1602810318383-e386cc2a3ccf" },
  { slug: "accessories", name: "Accessories", img: "photo-1591047139829-d91aecb6caea" },
];

const buildCategories = (): Category[] =>
  CATEGORY_SOURCES.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    image: viaCloudinary(uns(c.img, 1200), "q_auto,f_auto,w_1200,c_fill,g_auto"),
  }));

// ─────────────────── PRODUCTS (30) ───────────────────
// Each product gets 5 unique Unsplash IDs (front / back / side / model / detail).
// We deliberately picked photo sets per category so they look consistent.

interface ProductTemplate {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  images: string[]; // 5 unsplash ids
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  description: string;
  newArrival?: boolean;
  bestSeller?: boolean;
  featured?: boolean;
}

const BASE_COLORS = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Charcoal", hex: "#3a3a3a" },
  { name: "Silver", hex: "#c0c0c0" },
];
const APPAREL_SIZES = ["S", "M", "L", "XL"];

// Curated Unsplash photo IDs (dark/luxury menswear)
const POOL = {
  tee: [
    "photo-1521572163474-6864f9cf17ab",
    "photo-1503341504253-dff4815485f1",
    "photo-1622445275576-721325763afe",
    "photo-1503342217505-b0a15ec3261c",
    "photo-1583743814966-8936f5b7be1a",
    "photo-1571945153237-4929e783af4a",
    "photo-1576566588028-4147f3842f27",
    "photo-1618354691373-d851c5c3a990",
    "photo-1554568218-0f1715e72254",
    "photo-1622445275463-afa2ab738c34",
  ],
  oversized: [
    "photo-1490481651871-ab68de25d43d",
    "photo-1483985988355-763728e1935b",
    "photo-1500917293891-ef795e70e1f6",
    "photo-1602810316693-3667c854239a",
    "photo-1518049362265-d5b2a6467637",
    "photo-1517466787929-bc90951d0974",
    "photo-1525507119028-ed4c629a60a3",
    "photo-1552374196-c4e7ffc6e0d6",
  ],
  hoodie: [
    "photo-1556821840-3a63f95609a7",
    "photo-1552374196-1ab2a1c593e8",
    "photo-1565693413579-8a73fcd57bd2",
    "photo-1620799140408-edc6dcb6d633",
    "photo-1591047139829-d91aecb6caea",
    "photo-1614521538036-c4be6dc7c0a3",
    "photo-1542060748-10c28b62716f",
    "photo-1576871337632-b9aef4c17ab9",
  ],
  jacket: [
    "photo-1551028719-00167b16eac5",
    "photo-1591047139756-eb1c12d05c45",
    "photo-1521223890158-f9f7c3d5d504",
    "photo-1606902965551-dce093cda6e7",
    "photo-1520975954732-35dd22299614",
    "photo-1495105787522-5334e3ffa0ef",
    "photo-1591047139689-3a3a4b5a4be8",
    "photo-1576566588028-4147f3842f27",
  ],
  cargo: [
    "photo-1473966968600-fa801b869a1a",
    "photo-1542272604-787c3835535d",
    "photo-1594633312681-425c7b97ccd1",
    "photo-1582552938357-32b906df40cb",
    "photo-1624378439575-d8705ad7ae80",
    "photo-1604176354204-9268737828e4",
    "photo-1604335399105-a0c585fd81a1",
    "photo-1582418702059-97ebafb35d09",
  ],
  shirt: [
    "photo-1602810318383-e386cc2a3ccf",
    "photo-1602810316498-ab67cf68c8e1",
    "photo-1564584217132-2271feaeb3c5",
    "photo-1622519624330-eea4dcfa9b58",
    "photo-1602810320073-1230c46d89d4",
    "photo-1598033129183-c4f50c736f10",
  ],
  acc: [
    "photo-1591047139829-d91aecb6caea",
    "photo-1620799140408-edc6dcb6d633",
    "photo-1611923853683-1ce75d1d39d6",
    "photo-1622445275463-afa2ab738c34",
    "photo-1606328693834-5b1fcb6ec5f3",
    "photo-1622519624330-eea4dcfa9b58",
  ],
};

function pickFive(pool: string[], offset: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) out.push(pool[(offset + i) % pool.length]);
  return out;
}

const PRODUCT_NAMES: Record<string, string[]> = {
  "t-shirts": [
    "Midnight Essential Tee",
    "Shadow Crew Tee",
    "Obsidian Box Tee",
    "Onyx Heavyweight Tee",
    "Ash Logo Tee",
  ],
  oversized: [
    "Drop-Shoulder Oversized Tee",
    "Boxy Cut Oversized Crew",
    "Wide-Cut Oversized Pullover",
    "Slate Oversized Long Tee",
  ],
  hoodies: [
    "Shadow Oversized Hoodie",
    "Fog Crewneck Sweatshirt",
    "Ink Heavyweight Hoodie",
    "Silver Embroidered Hoodie",
    "Night Pullover Hoodie",
  ],
  jackets: [
    "Obsidian Bomber Jacket",
    "Eclipse Leather Jacket",
    "Phantom Puffer",
    "Carbon Track Jacket",
  ],
  cargo: [
    "Noir Cargo Pant",
    "Asphalt Wide-Leg Cargo",
    "Shadow Tactical Cargo",
    "Smoke Pleated Cargo",
  ],
  shirts: [
    "Onyx Linen Shirt",
    "Pearl Snap Western Shirt",
    "Steel Overshirt",
  ],
  accessories: [
    "Signature Snapback",
    "Silver Chain Wallet",
    "Doozy Leather Belt",
    "Monogram Tote",
    "Carbon Beanie",
  ],
};

const DESCRIPTIONS: Record<string, string> = {
  "t-shirts":
    "Heavyweight 240gsm cotton. Boxy relaxed cut. Pre-washed for an instant lived-in feel.",
  oversized:
    "Engineered drop-shoulder silhouette with 480gsm French terry. Wear it loud, wear it loose.",
  hoodies:
    "Heavyweight French terry hoodie with silver-thread monogram. Pre-washed.",
  jackets:
    "Premium structured outerwear with satin lining and ribbed cuffs. Sculpted to fit.",
  cargo:
    "Premium stretch cotton-twill cargo pant with bellowed pockets. Wide leg.",
  shirts:
    "Tailored streetwear shirt cut from breathable linen-cotton blend.",
  accessories:
    "Finishing pieces engineered with the same obsession as our apparel.",
};

const POOL_FOR: Record<string, string[]> = {
  "t-shirts": POOL.tee,
  oversized: POOL.oversized,
  hoodies: POOL.hoodie,
  jackets: POOL.jacket,
  cargo: POOL.cargo,
  shirts: POOL.shirt,
  accessories: POOL.acc,
};

const PRICE_RANGES: Record<string, [number, number]> = {
  "t-shirts": [999, 1799],
  oversized: [1499, 2499],
  hoodies: [2299, 3999],
  jackets: [4499, 7999],
  cargo: [2499, 3999],
  shirts: [1999, 3499],
  accessories: [599, 1999],
};

function buildProducts(): Product[] {
  const now = Date.now();
  const out: Product[] = [];
  let n = 0;
  // Distribute 30 across categories proportional to PRODUCT_NAMES
  for (const cat of Object.keys(PRODUCT_NAMES)) {
    const names = PRODUCT_NAMES[cat];
    const range = PRICE_RANGES[cat];
    for (let i = 0; i < names.length && out.length < 30; i++) {
      const name = names[i];
      const imageIds = pickFive(POOL_FOR[cat], i * 2 + n);
      const price = Math.round(
        (range[0] + Math.random() * (range[1] - range[0])) / 100
      ) * 100;
      const onSale = Math.random() > 0.5;
      out.push({
        id: `demo-${cat}-${i + 1}`,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name,
        description: DESCRIPTIONS[cat],
        price,
        salePrice: onSale ? Math.round((price * 0.8) / 50) * 50 : undefined,
        category: cat,
        sizes: cat === "accessories" ? ["One Size"] : APPAREL_SIZES,
        colors: BASE_COLORS,
        stock: 8 + Math.floor(Math.random() * 40),
        images: imageIds.map((id, k) =>
          viaCloudinary(uns(id, 1400), `q_auto,f_auto,w_1200,c_fill,g_auto,ar_4:5`)
        ),
        featured: i === 0,
        newArrival: Math.random() > 0.5,
        bestSeller: Math.random() > 0.6,
        rating: 4.3 + Math.random() * 0.6,
        reviewCount: 20 + Math.floor(Math.random() * 200),
        createdAt: now - n * 86_400_000,
      });
      n++;
    }
  }
  // Top up to 30 if we have fewer
  return out.slice(0, 30);
}

// ─────────────────── PUBLIC API ───────────────────
export interface SeedReport {
  hero: number;
  categories: number;
  products: number;
}

export async function seedDemoContent(): Promise<SeedReport> {
  if (!firebaseEnabled || !db) {
    throw new Error("Firebase is not configured");
  }

  const slides = buildHeroSlides();
  const categories = buildCategories();
  const products = buildProducts();

  // Write hero slides (inside settings/site.heroSlides)
  await updateSettings({ heroSlides: slides });

  // Write categories
  for (const c of categories) {
    await setDoc(doc(db, "categories", c.id), c, { merge: true });
  }

  // Write products
  for (const p of products) {
    await setDoc(doc(db, "products", p.id), { ...p, demo: true }, { merge: true });
  }

  return {
    hero: slides.length,
    categories: categories.length,
    products: products.length,
  };
}

export async function clearDemoContent(): Promise<SeedReport> {
  if (!firebaseEnabled || !db) {
    throw new Error("Firebase is not configured");
  }
  // Hero slides — wipe by writing empty array
  await updateSettings({ heroSlides: [] });

  // Delete demo-only docs
  const cats = await listCategories();
  let catCount = 0;
  for (const c of cats) {
    if (CATEGORY_SOURCES.find((x) => x.slug === c.slug)) {
      try { await deleteDoc(doc(db, "categories", c.id)); catCount++; } catch {}
    }
  }
  const prods = await listProducts();
  let prodCount = 0;
  for (const p of prods) {
    if (p.id.startsWith("demo-") || (p as any).demo === true) {
      try { await deleteDoc(doc(db, "products", p.id)); prodCount++; } catch {}
    }
  }
  return { hero: 0, categories: catCount, products: prodCount };
}

export async function demoSeedSummary() {
  return {
    hero: (await listHeroSlides()).length,
    categories: (await listCategories()).length,
    products: (await listProducts()).length,
  };
}
