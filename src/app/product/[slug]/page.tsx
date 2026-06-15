"use client";
import SiteShell from "@/components/SiteShell";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  createReview,
  getProduct,
  listReviews,
  listProducts,
  trackProductView,
} from "@/lib/db";
import { inr } from "@/lib/format";
import { Product, Review } from "@/types";
import {
  ChevronDown,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [imageIdx, setImageIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>("details");

  useEffect(() => {
    if (!slug) return;
    getProduct(slug).then((p) => {
      setProduct(p);
      if (p) {
        setSize(p.sizes[0]);
        setColor(p.colors[0]?.name || "");
        trackProductView(p.id);
        listReviews(p.id).then(setReviews);
        listProducts().then((all) =>
          setRelated(
            all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)
          )
        );
      }
    });
  }, [slug]);

  if (!product) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto py-32 text-center text-silver-400">
          Loading…
        </div>
      </SiteShell>
    );
  }

  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const productName = product.name || "Untitled product";
  const productCategory = product.category || "";
  const basePrice = typeof product.price === "number" ? product.price : 0;
  const sale =
    typeof product.salePrice === "number" &&
    product.salePrice > 0 &&
    product.salePrice < basePrice;
  const price = sale ? (product.salePrice as number) : basePrice;
  const stock = typeof product.stock === "number" ? product.stock : 0;
  const safeImageIdx = Math.min(imageIdx, Math.max(0, images.length - 1));
  const currentImage = images[safeImageIdx] || images[0] || "";

  const onAdd = () => {
    if (!size || !color) return toast.error("Select size & color");
    if (stock === 0) return toast.error("Out of stock");
    add({
      productId: product.id,
      name: productName,
      image: images[0] || "",
      price,
      size,
      color,
      quantity: qty,
    });
    toast.success("Added to bag");
  };
  const onBuyNow = () => {
    onAdd();
    setTimeout(() => router.push("/checkout"), 200);
  };

  const wished = has(product.id);
  const approvedReviews = (Array.isArray(reviews) ? reviews : []).filter(
    (r) => r?.approved
  );
  const avg =
    approvedReviews.length > 0
      ? approvedReviews.reduce((s, r) => s + (typeof r?.rating === "number" ? r.rating : 0), 0) /
        approvedReviews.length
      : typeof product.rating === "number" ? product.rating : 0;

  return (
    <SiteShell>
      {/* Breadcrumb */}
      <div className="container-x pt-6">
        <nav className="text-[10px] uppercase tracking-[0.25em] text-silver-500 flex items-center gap-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href={`/shop?category=${productCategory}`} className="hover:text-white capitalize">
            {productCategory || "Shop"}
          </Link>
          <span>/</span>
          <span className="text-silver-300 truncate">{productName}</span>
        </nav>
      </div>

      <div className="container-x py-8 md:py-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16">
        {/* GALLERY */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-3">
            {images.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 order-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    className={`relative aspect-square bg-ink-800 border ${
                      safeImageIdx === i ? "border-white" : "border-white/10"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={src.startsWith("data:")}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="order-2">
              <motion.div
                key={safeImageIdx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-[3/4] bg-ink-800 overflow-hidden group cursor-zoom-in"
                onClick={() => currentImage && setZoom(true)}
              >
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={productName}
                    fill
                    priority
                    sizes="(min-width:1024px) 50vw, 100vw"
                    className="object-cover"
                    unoptimized={currentImage.startsWith("data:")}
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-silver-600 text-[10px] uppercase tracking-widest">
                    No image
                  </div>
                )}
                {currentImage && (
                  <div className="absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn size={16} strokeWidth={1.5} />
                  </div>
                )}
              </motion.div>

              {images.length > 1 && (
                <div className="md:hidden flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      className={`relative w-16 aspect-square shrink-0 bg-ink-800 border ${
                        safeImageIdx === i ? "border-white" : "border-white/10"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized={src.startsWith("data:")}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INFO */}
        <div>
          <div className="eyebrow text-silver-400">{productCategory}</div>
          <h1 className="h-display text-3xl md:text-5xl mt-2 silver-text">
            {productName}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill={i < Math.round(avg) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="text-[11px] text-silver-400 uppercase tracking-[0.2em]">
              {avg.toFixed(1)} ·{" "}
              {approvedReviews.length || product.reviewCount || 0} reviews
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl md:text-3xl font-semibold">{inr(price)}</span>
            {sale && (
              <>
                <span className="text-silver-500 line-through">
                  {inr(basePrice)}
                </span>
                <span className="pill bg-white text-black border-white">
                  Save {inr(basePrice - (product.salePrice as number))}
                </span>
              </>
            )}
          </div>

          <div
            className={`mt-4 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 ${
              stock > 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current pulse-glow" />
            {stock > 0 ? `In Stock · ${stock} Available` : "Out of Stock"}
          </div>

          {/* Color */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="label !mb-0">Color</span>
              <span className="text-[11px] text-silver-300 uppercase tracking-[0.2em]">{color}</span>
            </div>
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <button
                  key={c?.name || i}
                  onClick={() => c?.name && setColor(c.name)}
                  className={`relative w-10 h-10 rounded-full ring-1 ring-white/20 hover:ring-white/60 transition ${
                    color === c?.name ? "ring-2 ring-white ring-offset-2 ring-offset-ink-950" : ""
                  }`}
                  style={{ background: c?.hex || "#000" }}
                  title={c?.name || ""}
                />
              ))}
              {colors.length === 0 && (
                <span className="text-[11px] text-silver-500">No colors set</span>
              )}
            </div>
          </div>

          {/* Size */}
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <span className="label !mb-0">Size</span>
              <button className="text-[10px] text-silver-400 hover:text-white uppercase tracking-[0.25em]">
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-xs uppercase tracking-widest border transition ${
                    size === s
                      ? "bg-white text-black border-white"
                      : "border-white/15 hover:border-white text-silver-200"
                  }`}
                >
                  {s}
                </button>
              ))}
              {sizes.length === 0 && (
                <span className="col-span-6 text-[11px] text-silver-500">No sizes set</span>
              )}
            </div>
          </div>

          {/* Qty + Actions */}
          <div className="mt-8 flex items-stretch gap-3">
            <div className="flex items-center border border-white/15">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:bg-white/5">
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:bg-white/5">
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <button
              onClick={() => toggle(product.id)}
              className="px-4 border border-white/15 hover:bg-white hover:text-black transition"
              aria-label="Wishlist"
            >
              <Heart size={16} fill={wished ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
            <button onClick={onAdd} className="btn-ghost flex-1">Add to Bag</button>
          </div>

          <button onClick={onBuyNow} className="btn-primary w-full mt-3">
            Buy Now
          </button>

          {/* Service strip */}
          <div className="mt-8 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.2em] text-silver-400">
            {[
              { Icon: Truck, t: "Free Ship 1499+" },
              { Icon: RotateCcw, t: "7-Day Returns" },
              { Icon: ShieldCheck, t: "Secure Pay" },
            ].map(({ Icon, t }) => (
              <div
                key={t}
                className="border border-white/10 p-3 flex flex-col items-center text-center gap-2"
              >
                <Icon size={18} strokeWidth={1.4} />
                <span>{t}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div className="mt-10 border-t border-white/10">
            {[
              { id: "details", title: "Product Details", body: product.description || "—" },
              {
                id: "shipping",
                title: "Shipping & Returns",
                body: "Complimentary shipping on orders above ₹1499. Standard delivery within 3–6 business days. Easy 7-day returns on unworn items in original packaging.",
              },
              {
                id: "care",
                title: "Care Instructions",
                body: "Machine wash cold with similar colors. Do not bleach. Tumble dry low. Iron on reverse only.",
              },
            ].map((sec) => (
              <div key={sec.id} className="border-b border-white/10">
                <button
                  onClick={() =>
                    setOpenSection(openSection === sec.id ? null : sec.id)
                  }
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="text-[12px] uppercase tracking-[0.25em] font-semibold">
                    {sec.title}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      openSection === sec.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openSection === sec.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm text-silver-300 leading-relaxed">
                        {sec.body}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="container-x py-16 border-t border-white/10 mt-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="eyebrow">Voices</div>
              <h2 className="h-display text-3xl md:text-5xl silver-text mt-2">
                Customer Reviews
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(avg) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-sm text-silver-300">
                {avg.toFixed(1)} · {approvedReviews.length || 0} reviews
              </span>
            </div>
          </div>
        </Reveal>

        {user ? (
          <ReviewForm
            productId={product.id}
            userName={user.name || user.email.split("@")[0]}
            onCreated={(r) => setReviews((p) => [r, ...p])}
          />
        ) : (
          <div className="glass p-6 md:p-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="eyebrow text-silver-500 mb-1">Members only</div>
              <p className="text-silver-200 text-sm">
                Sign in to share your review.
              </p>
            </div>
            <Link
              href={`/login?next=/product/${product.slug || product.id}`}
              className="btn-primary"
            >
              Sign in to review
            </Link>
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-2 gap-x-10 gap-y-6">
          {approvedReviews.length === 0 && (
            <div className="text-silver-400 text-sm md:col-span-2 text-center py-10">
              Be the first to review this piece.
            </div>
          )}
          {approvedReviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.05}>
              <div className="border-b border-white/10 pb-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{r.userName}</div>
                  <div className="flex text-amber-300">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-silver-300 text-sm leading-relaxed">{r.text}</p>
                {r.image && (
                  <div className="mt-3 relative w-28 h-28 overflow-hidden bg-ink-800">
                    <Image
                      src={r.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={r.image.startsWith("data:")}
                    />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="container-x py-16">
          <Reveal>
            <div className="flex items-end justify-between mb-8">
              <h2 className="h-display text-3xl md:text-4xl silver-text">
                You May Also Like
              </h2>
              <Link href="/shop" className="text-[10px] uppercase tracking-[0.3em] text-silver-400 hover:text-white">
                View All →
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ZOOM */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setZoom(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-5xl aspect-[3/4]"
            >
              {currentImage && (
                <Image
                  src={currentImage}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized={currentImage.startsWith("data:")}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SiteShell>
  );
}

function ReviewForm({
  productId,
  userName,
  onCreated,
}: {
  productId: string;
  userName: string;
  onCreated: (r: Review) => void;
}) {
  const [name, setName] = useState(userName || "");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return toast.error("Fill all fields");
    setSubmitting(true);
    try {
      const r = await createReview({
        id: "",
        productId,
        userName: name,
        rating,
        text,
        image: image || undefined,
        approved: false,
        createdAt: Date.now(),
      });
      onCreated(r);
      setName(""); setText(""); setImage(""); setRating(5);
      toast.success("Review submitted");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass p-6 md:p-8 grid gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Your Name</label>
          <input
            className="input-underline"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Rating</label>
          <div className="flex items-center gap-1 pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
              >
                <Star
                  size={22}
                  className="text-amber-300"
                  fill={n <= (hover || rating) ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="label">Your Review</label>
        <textarea
          className="input-underline min-h-[100px] resize-y"
          placeholder="Share your experience…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <ReviewImagePicker value={image} onChange={setImage} />
      <button disabled={submitting} className="btn-primary justify-self-start disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

function ReviewImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = async (file: File) => {
    const { uploadImage, validateImage } = await import("@/lib/cloudinary");
    const v = validateImage(file);
    if (!v.ok) return toast.error(v.message);
    setBusy(true); setProgress(0);
    try {
      const res = await uploadImage(file, {
        folder: "doozy/reviews",
        onProgress: (p) => setProgress(p),
      });
      onChange(res.url);
      toast.success("Photo added");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false); setProgress(0);
    }
  };

  return (
    <div>
      <label className="label">Add a photo (optional)</label>
      <div className="flex gap-3 items-start">
        <label
          className={`relative w-24 h-24 border-2 border-dashed bg-ink-950 grid place-items-center cursor-pointer transition ${
            busy ? "border-white/30 cursor-wait" : "border-white/15 hover:border-white/40"
          } ${value ? "overflow-hidden" : ""}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] uppercase tracking-[0.22em] text-silver-400 text-center px-2">
              {busy ? `${progress}%` : "Choose"}
            </span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
          {busy && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          )}
        </label>
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] uppercase tracking-[0.25em] text-silver-400 hover:text-white"
          >
            Remove
          </button>
        )}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.22em] text-silver-500">
        PNG · JPG · WEBP · 10 MB max
      </div>
    </div>
  );
}
