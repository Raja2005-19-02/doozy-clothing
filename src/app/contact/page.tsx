"use client";
import SiteShell from "@/components/SiteShell";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/context/SettingsContext";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  const { settings } = useSettings();
  if (!settings) return null;
  const s = settings;
  return (
    <SiteShell>
      <div className="container-x py-12 md:py-20 grid lg:grid-cols-2 gap-12 lg:gap-20">
        <Reveal>
          <div>
            <div className="eyebrow">Get In Touch</div>
            <h1 className="h-display text-5xl md:text-6xl silver-text mt-3">
              Let's talk.
            </h1>
            <p className="mt-5 text-silver-300 max-w-md text-sm md:text-base leading-relaxed">
              For orders, returns, collaborations, or anything in between —
              we're here. Our team replies within 24 hours.
            </p>
            <div className="mt-10 space-y-1 divide-y divide-white/10 border-y border-white/10">
              {[
                { Icon: Phone, label: "Phone", value: s.contact.phone, href: `tel:${s.contact.phone}` },
                { Icon: MessageCircle, label: "WhatsApp", value: s.contact.whatsapp, href: `https://wa.me/${s.contact.whatsapp.replace(/\D/g, "")}` },
                { Icon: Mail, label: "Email", value: s.contact.email, href: `mailto:${s.contact.email}` },
                { Icon: MapPin, label: "Studio", value: s.contact.address, href: s.contact.mapLink },
              ].map(({ Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-5 py-5 hover:bg-white/[0.02] -mx-2 px-2 transition"
                >
                  <Icon size={18} strokeWidth={1.5} className="text-silver-400 shrink-0" />
                  <div className="flex-1">
                    <div className="eyebrow text-silver-500">{label}</div>
                    <div className="text-sm mt-1 text-silver-100">{value}</div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-silver-500 group-hover:text-white group-hover:translate-x-1 transition"
                  />
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent");
              (e.target as HTMLFormElement).reset();
            }}
            className="border border-white/10 bg-ink-900 p-8 md:p-10 space-y-6"
          >
            <div className="eyebrow">Send a message</div>
            <div>
              <label className="label">Name</label>
              <input className="input-underline" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-underline" type="email" required />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input-underline" required />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input-underline min-h-[120px] resize-y" required />
            </div>
            <button className="btn-primary w-full">
              Send Message <ArrowRight size={14} />
            </button>
          </form>
        </Reveal>
      </div>
    </SiteShell>
  );
}
