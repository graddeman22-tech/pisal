import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useLogo } from "@/hooks/useLogo";

const PHONES = [
  { number: "8953148406", display: "+91 89531 48406" },
  { number: "6391077161", display: "+91 63910 77161" },
];
const EMAIL = "contact.pisal@gmail.com";
const WHATSAPP_NUMBER = "918953148406";
const WHATSAPP_MSG = encodeURIComponent("Hello PISAL, I want to know more about your products.");

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.526 5.847L.057 23.945l6.224-1.497A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.814 9.814 0 01-5.006-1.369l-.358-.214-3.717.894.937-3.621-.236-.372A9.82 9.82 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
  </svg>
);

export function Footer() {
  const logoUrl = useLogo();
  return (
    <footer className="bg-[#0A0A0A] text-white/70 relative overflow-hidden">

      {/* Top gold rule */}
      <div className="h-[2px] w-full"
        style={{ background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #F0C040 50%, #D4AF37 70%, transparent 100%)" }} />

      {/* Subtle red glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,0,0,.14) 0%, transparent 70%)" }} />

      {/* Main grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* ── Brand (takes 2 cols on lg) ────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="PISAL"
                className="h-16 w-16 object-contain"
              />
              <div>
                <p className="font-serif text-2xl font-bold text-white tracking-wide">PISAL</p>
                <p className="text-accent text-xs font-semibold tracking-widest uppercase">Pure Taste of India</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Premium, 100% natural Indian spices and FMCG products — sourced directly from farmers and delivered fresh to your kitchen.
            </p>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366]/12 hover:bg-[#25D366]/22 border border-[#25D366]/25 text-[#25D366] rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group"
            >
              <span className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <WhatsAppIcon />
              </span>
              Chat on WhatsApp
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { href: "https://facebook.com", Icon: Facebook, label: "Facebook" },
                { href: "https://instagram.com", Icon: Instagram, label: "Instagram" },
                { href: "https://youtube.com", Icon: Youtube, label: "YouTube" },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all duration-200 text-white/50"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Shop ─────────────────────────────────── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Shop</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "All Products", href: "/products" },
                { label: "Masala & Spices", href: "/products?category=blended" },
                { label: "Whole Spices", href: "/products?category=whole" },
                { label: "Ground Spices", href: "/products?category=ground" },
                { label: "Combo Packs", href: "/products?category=combo" },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/50 hover:text-primary transition-colors duration-150 flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2.5 h-px bg-primary transition-all duration-200 rounded-full" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company ──────────────────────────────── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
                { label: "Track My Order", href: "/orders" },
                { label: "My Account", href: "/profile" },
                { label: "My Wishlist", href: "/wishlist" },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/50 hover:text-primary transition-colors duration-150 flex items-center gap-1.5 group">
                    <span className="w-0 group-hover:w-2.5 h-px bg-primary transition-all duration-200 rounded-full" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact ──────────────────────────────── */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4 text-sm">
              {PHONES.map(p => (
                <li key={p.number}>
                  <a href={`tel:+91${p.number}`}
                    className="flex items-start gap-3 text-white/50 hover:text-primary transition-colors group"
                  >
                    <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{p.display}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href={`mailto:${EMAIL}`}
                  className="flex items-start gap-3 text-white/50 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="break-all">{EMAIL}</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-white/50">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>New Ashoka Nagar, Delhi - 110096</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────── */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} PISAL. All rights reserved. &nbsp;|&nbsp; Pure Taste of India</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
            <a href="#" className="hover:text-white transition-colors">Shipping Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
