import HeroSlider from "@/components/HeroSlider";
import NewsletterForm from "@/components/NewsletterForm";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SiteShell from "@/components/SiteShell";
import {
  getSettings,
  listCategories,
  listProducts,
  listReviews,
} from "@/lib/db";
import {
  ArrowRight,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, categories, reviews, settings] = await Promise.all([
    listProducts(),
    listCategories(),
    listReviews(),
    getSettings(),
  ]);

  const newArrivals = products.filter((p) => p.newArrival).slice(0, 8);
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 8);
  const featured = products.filter((p) => p.featured).slice(0, 3);
  const approvedReviews = reviews.filter((r) => r.approved).slice(0, 3);

  return (
    <SiteShell>
      {/* HERO SLIDER */}
      <HeroSlider
        slides={settings.heroSlides || []}
        fallbackImage={settings.hero?.image}
        fallbackTitle={settings.hero?.title}
        fallbackSubtitle={settings.hero?.subtitle}
        fallbackCta={settings.hero?.cta}
      />

      {/* TRUST BAR */}
      <section className="border-y border-white/10 bg-ink-900">
        <div className="container-x py-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-[10px] uppercase tracking-[0.25em] text-silver-300">
          {[
            { icon: Truck, t: `Free Ship ₹${settings.shipping.freeThreshold}+` },
            { icon: ShieldCheck, t: "Secure Checkout" },
            { icon: RefreshCcw, t: "7-Day Returns" },
            { icon: Star, t: "Luxury Streetwear" },
          ].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon size={16} strokeWidth={1.5} className="text-silver-300" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container-x py-16 md:py-24">
          <div className="flex items-end justify-between mb-10 md:mb-14">
            <Reveal>
              <div>
                <div className="eyebrow">Shop By</div>
                <h2 className="h-display text-4xl md:text-6xl silver-text mt-2">
                  Collections
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Link
                href="/shop"
                className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] hover:text-white text-silver-400"
              >
                View All <ArrowUpRight size={14} />
              </Link>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.1}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden bg-ink-800 block"
                >
                  {c.image && (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                      unoptimized={c.image.startsWith("data:")}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8">
                    <div className="eyebrow text-silver-300">Collection</div>
                    <div className="h-display text-3xl md:text-4xl mt-1">
                      {c.name}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border-b border-white/40 pb-1 group-hover:border-white">
                      Shop Now <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY STATE — no products yet */}
      {products.length === 0 && (
        <section className="container-x py-24 text-center">
          <Reveal>
            <SectionHeading
              eyebrow="Coming Soon"
              title="The collection drops here"
              subtitle="New arrivals coming soon. Subscribe to the newsletter to be the first to know."
              align="center"
            />
          </Reveal>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="container-x pb-16 md:pb-24">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <Reveal>
              <div>
                <div className="eyebrow">Fresh Drops</div>
                <h2 className="h-display text-4xl md:text-6xl silver-text mt-2">
                  New Arrivals
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Link
                href="/shop?filter=new"
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] hover:text-white text-silver-400"
              >
                View All <ArrowUpRight size={14} />
              </Link>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* EDITORIAL SPLIT */}
      {featured[0] && (
        <section className="relative my-12 md:my-20">
          <div className="grid lg:grid-cols-2 min-h-[60vh] lg:min-h-[640px]">
            <Reveal>
              <div className="relative h-[60vh] lg:h-full">
                {featured[0].images[0] && (
                  <Image
                    src={featured[0].images[0]}
                    alt={featured[0].name}
                    fill
                    sizes="50vw"
                    className="object-cover"
                    unoptimized={featured[0].images[0].startsWith("data:")}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="bg-ink-900 flex items-center px-6 lg:px-16 py-16 lg:py-12 relative">
                <div className="absolute top-8 left-6 lg:left-16 eyebrow">
                  Editor's Pick
                </div>
                <div className="max-w-md">
                  <div className="eyebrow text-silver-400 mb-2">
                    Featured Drop
                  </div>
                  <h3 className="h-display text-4xl md:text-5xl lg:text-6xl silver-text">
                    {featured[0].name}
                  </h3>
                  <p className="mt-6 text-silver-300 leading-relaxed text-sm md:text-base">
                    {featured[0].description}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3 items-center">
                    <Link
                      href={`/product/${featured[0].slug}`}
                      className="btn-primary"
                    >
                      Shop Now <ArrowRight size={14} />
                    </Link>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-400">
                      Limited Stock
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="container-x py-16 md:py-24">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <Reveal>
              <div>
                <div className="eyebrow">Customer Favourites</div>
                <h2 className="h-display text-4xl md:text-6xl silver-text mt-2">
                  Best Sellers
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Link
                href="/shop?filter=best"
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] hover:text-white text-silver-400"
              >
                View All <ArrowUpRight size={14} />
              </Link>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-6">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {approvedReviews.length > 0 && (
        <section className="container-x py-16 md:py-24 border-t border-white/10">
          <Reveal>
            <div className="text-center mb-12">
              <div className="eyebrow">Loved By Thousands</div>
              <h2 className="h-display text-4xl md:text-6xl silver-text mt-2">
                The Community
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4">
            {approvedReviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.1}>
                <div className="glass p-8 h-full flex flex-col">
                  <div className="flex gap-1 text-amber-300 mb-5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-silver-100 leading-relaxed font-display text-lg italic flex-1">
                    "{r.text}"
                  </p>
                  <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.25em] text-silver-300">
                      {r.userName}
                    </span>
                    <span className="text-[10px] text-silver-500 uppercase tracking-widest">
                      Verified Buyer
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="bg-ink-900 border-y border-white/10 mt-8 md:mt-12 relative overflow-hidden">
        <div className="container-x py-20 md:py-28 text-center relative">
          <Reveal>
            <div className="eyebrow">Join The List</div>
            <h2 className="h-display text-4xl md:text-6xl silver-text mt-3 max-w-2xl mx-auto">
              First Drops. First Discounts.
            </h2>
            <p className="mt-5 text-silver-400 max-w-md mx-auto text-sm">
              Subscribe and unlock 10% off your first order, plus early access
              to every new collection.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
