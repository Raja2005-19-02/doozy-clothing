"use client";
import { useSettings } from "@/context/SettingsContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const { settings } = useSettings();
  if (!settings) return null;
  const s = settings;

  const socials = [
    { Icon: Instagram, href: s.social.instagram },
    { Icon: Facebook, href: s.social.facebook },
    { Icon: Youtube, href: s.social.youtube },
    { Icon: Twitter, href: s.social.twitter },
    { Icon: Send, href: s.social.telegram },
  ].filter((x) => x.href);

  const shopLinks = [
    { href: "/shop", label: "All Products" },
    { href: "/shop?filter=new", label: "New Arrivals" },
    { href: "/shop?filter=best", label: "Best Sellers" },
    { href: "/shop?category=men", label: "Men" },
    { href: "/shop?category=women", label: "Women" },
  ];
  const helpLinks = [
    { href: "/contact", label: "Contact Us" },
    { href: "/policies/refund", label: "Refund Policy" },
    { href: "/policies/privacy", label: "Privacy Policy" },
    { href: "/policies/terms", label: "Terms & Conditions" },
  ];
  const contactRows = [
    s.contact.phone && {
      Icon: Phone,
      label: s.contact.phone,
      href: `tel:${s.contact.phone}`,
    },
    s.contact.email && {
      Icon: Mail,
      label: s.contact.email,
      href: `mailto:${s.contact.email}`,
    },
    s.contact.address && {
      Icon: MapPin,
      label: s.contact.address,
      href: s.contact.mapLink || "#",
    },
  ].filter(Boolean) as { Icon: any; label: string; href: string }[];

  return (
    <footer className="bg-black border-t border-white/10 mt-12 md:mt-20">
      {/* Desktop */}
      <div className="hidden md:grid container-x py-12 lg:py-14 grid-cols-12 gap-10">
        <div className="col-span-4">
          <div className="flex items-center gap-2.5 mb-4">
            <Image
              src={s.logo || "/logo.jpg"}
              alt=""
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="font-display text-base tracking-[0.4em] silver-text font-semibold">
              DOOZY
            </span>
          </div>
          <p className="text-[13px] text-silver-400 leading-relaxed max-w-xs">
            Luxury streetwear engineered for the bold. Designed obsessively,
            stitched precisely.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-2 mt-5">
              {socials.map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 grid place-items-center border border-white/10 hover:bg-white hover:text-black hover:border-white transition"
                >
                  <Icon size={13} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <div className="label">Shop</div>
          <ul className="space-y-2 text-[13px] text-silver-300">
            {shopLinks.map((l) => (
              <li key={l.href + l.label}>
                <Link className="hover:text-white" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2">
          <div className="label">Help</div>
          <ul className="space-y-2 text-[13px] text-silver-300">
            {helpLinks.map((l) => (
              <li key={l.href}>
                <Link className="hover:text-white" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-4">
          <div className="label">Stay in the loop</div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex border-b border-white/15"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 bg-transparent py-2.5 text-sm placeholder-silver-500 focus:outline-none"
            />
            <button className="text-[10px] uppercase tracking-[0.3em] font-semibold px-3 hover:text-silver-300">
              Join →
            </button>
          </form>
          {contactRows.length > 0 && (
            <ul className="mt-5 space-y-2 text-[13px] text-silver-400">
              {contactRows.map(({ Icon, label, href }, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <Icon size={13} strokeWidth={1.5} className="mt-1 shrink-0" />
                  <a href={href} className="hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile - accordions */}
      <div className="md:hidden container-x py-10">
        <div className="flex items-center gap-2.5 mb-5">
          <Image
            src={s.logo || "/logo.jpg"}
            alt=""
            width={28}
            height={28}
            className="rounded-sm"
          />
          <span className="font-display text-base tracking-[0.4em] silver-text font-semibold">
            DOOZY
          </span>
        </div>

        <FooterAccordion title="Shop" items={shopLinks} />
        <FooterAccordion title="Help" items={helpLinks} />
        {contactRows.length > 0 && (
          <FooterAccordion
            title="Contact"
            items={contactRows.map((c) => ({ href: c.href, label: c.label }))}
          />
        )}

        {socials.length > 0 && (
          <div className="flex gap-2 mt-6">
            {socials.map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 grid place-items-center border border-white/10 hover:bg-white hover:text-black hover:border-white transition"
              >
                <Icon size={13} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex border-b border-white/15 mt-6"
        >
          <input
            type="email"
            required
            placeholder="your@email.com"
            className="flex-1 bg-transparent py-2.5 text-sm placeholder-silver-500 focus:outline-none"
          />
          <button className="text-[10px] uppercase tracking-[0.3em] font-semibold px-3 hover:text-silver-300">
            Join →
          </button>
        </form>
      </div>

      <div className="hairline">
        <div className="container-x py-5 text-[10px] uppercase tracking-[0.3em] text-silver-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>{s.footer || "© DOOZY. All rights reserved."}</span>
          <span>Made with obsession · India</span>
        </div>
      </div>
    </footer>
  );
}

function FooterAccordion({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-[11px] uppercase tracking-[0.25em] font-semibold">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-2">
              {items.map((l) => (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-silver-300 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
