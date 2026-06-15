"use client";
import ProductCard from "@/components/ProductCard";
import SiteShell from "@/components/SiteShell";
import { useWishlist } from "@/context/WishlistContext";
import { listProducts } from "@/lib/db";
import { Product } from "@/types";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    listProducts().then(setProducts);
  }, []);
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <SiteShell>
      <div className="container-x py-10 md:py-14">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="eyebrow">Saved For Later</div>
            <h1 className="h-display text-4xl md:text-5xl silver-text mt-2">
              Wishlist
            </h1>
          </div>
          {items.length > 0 && (
            <span className="text-[11px] uppercase tracking-[0.25em] text-silver-400">
              {items.length} {items.length === 1 ? "Piece" : "Pieces"}
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={40} strokeWidth={1} className="mx-auto text-silver-500 mb-6" />
            <h2 className="h-display text-3xl silver-text">No saved pieces</h2>
            <p className="text-silver-400 mt-3 text-sm">
              Mark your favourites and never lose track.
            </p>
            <Link href="/shop" className="btn-primary mt-8 inline-flex">
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
