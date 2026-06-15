"use client";
import ProductCard from "@/components/ProductCard";
import SiteShell from "@/components/SiteShell";
import { listCategories, listProducts } from "@/lib/db";
import { Category, Product } from "@/types";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Charcoal", hex: "#3a3a3a" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "White", hex: "#ffffff" },
];

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-silver-400">
          Loading…
        </div>
      }
    >
      <ShopInner />
    </Suspense>
  );
}

function ShopInner() {
  const sp = useSearchParams();
  const initialCat = sp.get("category") || "all";
  const initialFilter = sp.get("filter") || "";
  const initialQ = sp.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState(initialCat);
  const [filter, setFilter] = useState(initialFilter);
  const [q, setQ] = useState(initialQ);
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([listProducts(), listCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (filter === "new") list = list.filter((p) => p.newArrival);
    if (filter === "best") list = list.filter((p) => p.bestSeller);
    if (q.trim())
      list = list.filter((p) =>
        (p.name + " " + p.description).toLowerCase().includes(q.toLowerCase())
      );
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (color) list = list.filter((p) => p.colors.some((c) => c.name === color));
    list = list.filter((p) => (p.salePrice ?? p.price) <= maxPrice);

    if (sort === "price_asc")
      list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price_desc")
      list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "newest")
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }, [products, cat, filter, q, size, color, maxPrice, sort]);

  const heading =
    filter === "new"
      ? "New Arrivals"
      : filter === "best"
      ? "Best Sellers"
      : cat !== "all"
      ? categories.find((c) => c.id === cat)?.name || "Shop"
      : "All Products";

  const Filters = (
    <div className="space-y-8 text-sm">
      <div>
        <div className="label">Category</div>
        <div className="space-y-1">
          {[{ id: "all", name: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`block w-full text-left px-3 py-2 text-[13px] uppercase tracking-[0.15em] ${
                cat === c.id
                  ? "bg-white text-black"
                  : "text-silver-300 hover:bg-white/5"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Size</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSize("")}
            className={`py-2 border text-[11px] uppercase tracking-widest ${
              size === ""
                ? "bg-white text-black border-white"
                : "border-white/15"
            }`}
          >
            All
          </button>
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`py-2 border text-[11px] uppercase tracking-widest ${
                size === s
                  ? "bg-white text-black border-white"
                  : "border-white/15"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Color</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setColor("")}
            className={`px-3 py-1.5 border text-[10px] uppercase tracking-widest ${
              color === ""
                ? "bg-white text-black border-white"
                : "border-white/15"
            }`}
          >
            All
          </button>
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              title={c.name}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c.name ? "border-white" : "border-white/20"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="label">
          Max Price: <span className="text-white">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min={500}
          max={10000}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(+e.target.value)}
          className="w-full accent-white"
        />
      </div>
    </div>
  );

  return (
    <SiteShell>
      <div className="border-b border-white/10">
        <div className="container-x py-10 md:py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="eyebrow">Shop</div>
            <h1 className="h-display text-4xl md:text-6xl silver-text mt-2">
              {heading}
            </h1>
            {q && (
              <p className="mt-3 text-silver-400 text-sm">
                Showing results for "<span className="text-white">{q}</span>"
              </p>
            )}
          </div>
          <input
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input md:max-w-xs"
          />
        </div>
      </div>

      <div className="container-x py-8 grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden lg:block sticky top-24 self-start">{Filters}</aside>

        <div>
          <div className="flex items-center justify-between mb-6 gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden btn-ghost text-[10px] py-2.5 px-4"
            >
              <SlidersHorizontal size={12} /> Filters
            </button>
            <div className="text-[11px] text-silver-400 uppercase tracking-[0.2em]">
              {filtered.length} {filtered.length === 1 ? "Piece" : "Pieces"}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border border-white/15 px-3 py-2.5 text-[11px] uppercase tracking-[0.2em] focus:outline-none"
            >
              <option className="bg-ink-900" value="newest">
                Newest
              </option>
              <option className="bg-ink-900" value="price_asc">
                Price ↑
              </option>
              <option className="bg-ink-900" value="price_desc">
                Price ↓
              </option>
              <option className="bg-ink-900" value="rating">
                Top Rated
              </option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-display text-3xl text-silver-300 mb-3">
                {products.length === 0 ? "No Products Available" : "Nothing found"}
              </div>
              <p className="text-silver-500 text-sm">
                {products.length === 0
                  ? "The catalogue is being prepared. Check back soon."
                  : "Try adjusting filters or your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-10 md:gap-x-6">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.7, 0, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 bg-ink-950 border-t border-white/10 max-h-[85vh] overflow-y-auto lg:hidden rounded-t-2xl"
            >
              <div className="sticky top-0 bg-ink-950 border-b border-white/10 flex justify-between items-center p-5">
                <span className="h-display text-xl">Filters</span>
                <button onClick={() => setOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="p-6">{Filters}</div>
              <div className="sticky bottom-0 bg-ink-950 border-t border-white/10 p-4">
                <button
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full"
                >
                  Show {filtered.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SiteShell>
  );
}
