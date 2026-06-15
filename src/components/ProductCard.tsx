"use client";
import { Product } from "@/types";
import { inr } from "@/lib/format";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ProductCard({
  product,
  index = 0,
}: {
  product?: Product;
  index?: number;
}) {
  const { toggle, has } = useWishlist();
  const { add } = useCart();

  if (!product || !product.id) return null;

  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const name = product.name || "Untitled product";
  const slug = product.slug || product.id;
  const category = product.category || "";
  const price = typeof product.price === "number" ? product.price : 0;
  const sale =
    typeof product.salePrice === "number" &&
    product.salePrice > 0 &&
    product.salePrice < price;
  const displayPrice = sale ? (product.salePrice as number) : price;
  const off = sale && price > 0
    ? Math.round((1 - (product.salePrice as number) / price) * 100)
    : 0;
  const stock = typeof product.stock === "number" ? product.stock : 0;
  const wished = has(product.id);
  const firstImg = images[0];
  const secondImg = images[1];

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0) {
      toast.error("Out of stock");
      return;
    }
    add({
      productId: product.id,
      name,
      image: firstImg || "",
      price: displayPrice,
      size: sizes[0] || "One Size",
      color: colors[0]?.name || "Default",
      quantity: 1,
    });
    toast.success("Added to bag");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link href={`/product/${slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink-800">
          {firstImg ? (
            <Image
              src={firstImg}
              alt={name}
              fill
              sizes="(min-width:1280px) 22vw, (min-width:768px) 33vw, 50vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              unoptimized={firstImg.startsWith("data:")}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-silver-600 text-[10px] uppercase tracking-widest">
              No image
            </div>
          )}
          {secondImg && (
            <Image
              src={secondImg}
              alt={name}
              fill
              sizes="(min-width:1280px) 22vw, (min-width:768px) 33vw, 50vw"
              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              unoptimized={secondImg.startsWith("data:")}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.newArrival && (
              <span className="pill bg-white text-black border-white">New</span>
            )}
            {sale && (
              <span className="pill bg-black/80 backdrop-blur text-white border-white/30">
                −{off}%
              </span>
            )}
            {stock > 0 && stock <= 5 && (
              <span className="pill bg-amber-400/95 text-black border-amber-400">
                Low Stock
              </span>
            )}
            {stock === 0 && (
              <span className="pill bg-red-600 text-white border-red-600">
                Sold Out
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
              toast.success(wished ? "Removed from wishlist" : "Saved");
            }}
            className="absolute top-2.5 right-2.5 w-9 h-9 grid place-items-center bg-black/40 backdrop-blur-md border border-white/15 hover:bg-white hover:text-black transition"
            aria-label="Toggle wishlist"
          >
            <Heart size={14} fill={wished ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>

          <div className="absolute inset-x-2.5 bottom-2.5 md:bottom-3 translate-y-0 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-500">
            <button
              onClick={quickAdd}
              disabled={stock === 0}
              className="w-full bg-white text-black text-[10px] uppercase tracking-[0.25em] font-bold py-3 flex items-center justify-center gap-2 hover:bg-silver-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={13} strokeWidth={2} />
              Quick Add
            </button>
          </div>
        </div>
      </Link>

      <div className="pt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/product/${slug}`}
            className="text-[13px] font-medium leading-tight line-clamp-1 hover:underline underline-offset-4"
          >
            {name}
          </Link>
          {category && (
            <div className="mt-1 text-[10px] text-silver-500 uppercase tracking-[0.2em]">
              {category}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {sale ? (
            <>
              <div className="text-[13px] font-semibold">{inr(displayPrice)}</div>
              <div className="text-[11px] text-silver-500 line-through">
                {inr(price)}
              </div>
            </>
          ) : (
            <div className="text-[13px] font-semibold">{inr(displayPrice)}</div>
          )}
        </div>
      </div>

      {colors.length > 1 && (
        <div className="mt-2 flex gap-1">
          {colors.slice(0, 4).map((c) => (
            <span
              key={c?.name || Math.random()}
              title={c?.name || ""}
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ background: c?.hex || "#000" }}
            />
          ))}
          {colors.length > 4 && (
            <span className="text-[10px] text-silver-500">+{colors.length - 4}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
