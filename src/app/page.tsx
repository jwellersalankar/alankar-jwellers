"use client";

import React, { useState } from "react";
import {
  Diamond,
  ArrowRight,
  Star,
  Scissors,
  Phone,
  Clock,
  MapPin,
  ChevronRight,
  Menu,
  X,
  Gem,
  WandSparkles,
} from "lucide-react";


import Image from "next/image";
import NavBar from "../components/core/NavBar";
import Footer from "../components/core/Footer";
import LocationSection from "../components/home/Location";

// ─── Colour & type tokens (from the design) ───────────────────────────────────
// Crimson:  #8B1A1A   Deep red accent
// Gold:     #C9A84C   Warm gold accent
// Cream:    #F8F4EE   Off-white background
// Charcoal: #1C1C1C   Near-black text
// Stone:    #6B6158   Warm grey body text

// ─── NAV ─────────────────────────────────────────────────────────────────────
const Nav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const links = ["Collections", "Heritage", "Bespoke", "Wedding", "Contact"];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#F8F4EE]/90 backdrop-blur border-b border-[#C9A84C]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
        {/* Brand */}
        <div className="flex flex-col leading-none">
          <span className="font-serif text-[10px] tracking-[0.3em] text-[#6B6158] uppercase">
            Established 20XX
          </span>
          <span className="font-serif text-xl lg:text-2xl text-[#1C1C1C] tracking-tight">
            Alankar Jewellers
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="text-[13px] tracking-widest uppercase text-[#6B6158] hover:text-[#8B1A1A] transition-colors font-medium"
            >
              {l}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#1C1C1C]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-[#F8F4EE] border-t border-[#C9A84C]/20 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="text-[13px] tracking-widest uppercase text-[#6B6158] hover:text-[#8B1A1A] transition-colors font-medium"
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};

// ─── HERO ────────────────────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section className="relative min-h-screen flex items-center bg-[#EDE5D8] overflow-hidden pt-16 lg:pt-20">
    {/* Decorative background shape */}
    {/* <div className="absolute inset-0 pointer-events-none">
      <div className="absolute right-0 top-0 w-1/2 h-full bg-[#D9CDBF]/40" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#C9A84C]/30" />
    </div> */}

    <Image src="/HomeHero.png" alt="Hero" fill className="h-full w-full object-cover" priority />

    <div className="relative z-10 max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-0 items-center py-20 lg:py-28">
      {/* Text */}
      <div className="max-w-3xl pl-5">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#775A19] font-medium mb-5">
          Established 20XX
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-[#7D0005] leading-[1.08] mb-6">
          Crowning Moments of{" "}
          <em className="italic text-[#7D0005] not-italic font-serif">
            Timeless Grace
          </em>
        </h1>
        <p className="text-[#5B403D] text-base lg:text-lg leading-relaxed mb-10 max-w-md">
          Discover a legacy of pure gold and rare gemstones, meticulously
          handcrafted for generations of royalty and refinement.
        </p>
        {/* <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-[#8B1A1A] text-white text-[11px] tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:bg-[#6E1414] transition-colors"
          >
            Explore Collections <ArrowRight size={14} />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 border border-[#1C1C1C]/30 text-[#1C1C1C] text-[11px] tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:border-[#8B1A1A] hover:text-[#8B1A1A] transition-colors"
          >
            Our Story
          </a>
        </div> */}
      </div>
    </div>
  </section>
);

// ─── HERITAGE ────────────────────────────────────────────────────────────────
const Heritage: React.FC = () => (
  <section className="bg-[#FFF8F7] py-20 lg:py-28">
    <div className=" mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="text-center mb-14">
        <h2 className="font-serif text-3xl lg:text-4xl text-[#7D0005] mb-3">
          Our Heritage
        </h2>
        <div className="mx-auto w-12 h-[2px] bg-[#775A19]" />
      </div>

      {/* Grid: craftsman image + card */}
      <div className="grid md:grid-cols-3 gap-2">
        {/* Craftsman image */}
        <div className="relative aspect-4/3 md:aspect-video bg-[#1C1C1C] flex items-center justify-center overflow-hidden md:col-span-2">
          <Image src="/Heritage.png" alt="Heritage" fill className="h-full w-full object-cover" />
        </div>

        {/* Crafting excellence card */}
        <div className="border border-[#775A19] p-10 lg:p-14 flex flex-col justify-center">
          <Gem size={28} className="text-[#7D0005] mb-6" />
          <h3 className="font-serif text-2xl lg:text-3xl text-[#7D0005] mb-4">
            Crafting Excellence
          </h3>
          <p className="text-[#5B403D] leading-relaxed text-sm lg:text-base mb-8">
            Every piece at Alankar Jewellers is a testament to our commitment
            to purity and perfection. We source only the finest ethically mined
            diamonds and 24-karat gold.
          </p>
          {/* <a
            href="#"
            className="inline-flex items-center gap-2 text-[#8B1A1A] text-[11px] tracking-[0.2em] uppercase font-semibold hover:gap-3 transition-all"
          >
            Read Our Story <ArrowRight size={13} />
          </a> */}
        </div>
      </div>
    </div>
  </section>
);

// ─── BESPOKE ─────────────────────────────────────────────────────────────────
const Bespoke: React.FC = () => (
  <section className="bg-[#FFF8F7] py-0">
    <div className=" mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-3 gap-2 items-stretch">
        {/* Ring image */}
        <div className="relative aspect-[4/3] md:aspect-auto bg-[#111] flex items-center justify-center overflow-hidden order-2 md:order-1">
          <Image src="/Ring.png" alt="Heritage" fill className="h-full w-full object-cover" />
        </div>

        {/* Text panel */}
        <div className="relative bg-[#7D0005] p-10 lg:p-14 flex flex-col justify-center overflow-hidden order-1 md:order-2 md:col-span-2">
          {/* Background star motif */}
          <div className="absolute right-6 top-6 opacity-10">
            <Star size={120} className="text-white" fill="white" />
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl xl:text-4xl text-white mb-5 relative z-10">
            Bespoke Design Studio
          </h2>
          <p className="text-white/75 text-sm lg:text-base leading-relaxed mb-8 relative z-10 max-w-sm">
            Transform your vision into a wearable masterpiece. Our master
            designers work with you to create one-of-a-kind heirlooms that tell
            your unique story.
          </p>
          <a
            href="#"
            className="relative z-10 self-start inline-flex items-center gap-2 border border-white text-white text-[11px] tracking-[0.2em] uppercase font-semibold px-6 py-3 hover:bg-white hover:text-[#8B1A1A] transition-colors"
          >
            Start Bespoke Journey
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ─── WEDDING ─────────────────────────────────────────────────────────────────
const Wedding: React.FC = () => (
  <section className="bg-[#FFF8F7] py-20 lg:py-28">
    <div className=" mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-20 justify-between items-stretch">
        {/* Bride image */}
        <div className="relative aspect-square rounded-3xl bg-[#1C1C1C] flex items-center justify-center overflow-hidden">
          <Image src="/Bridal.png" alt="Heritage" fill className="h-full w-full object-cover" />
        </div>

        {/* Text */}
        <div className="place-items-center mt-2">
          <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#C9A84C] font-semibold mb-4">
            Wedding Store
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl text-[#8B1A1A] leading-snug mb-6">
            Eternal Vows,
            <br />
            Infinite Radiance
          </h2>
          <p className="text-[#5B403D] max-w-sm text-sm lg:text-base leading-relaxed mb-10">
            For the most significant day of your life, we craft heirlooms that
            bridge tradition and modernity. Each bridal set is a masterpiece of
            storytelling.
          </p>

          <ul className="space-y-6">
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center">
                <Star size={16} className="text-[#775A19]" fill="#775A19" />
              </span>
              <div>
                <p className="font-semibold text-[#1C1C1C] text-sm mb-0.5">
                  Authentic Craftsmanship
                </p>
                <p className="text-[#6B6158] text-sm">
                  Certified Hallmark gold and IGI certified diamonds.
                </p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center">
                <WandSparkles size={16} className="text-[#775A19]" />
              </span>
              <div>
                <p className="font-semibold text-[#1C1C1C] text-sm mb-0.5">
                  Customization Available
                </p>
                <p className="text-[#6B6158] text-sm">
                  Tailor your bridal set to match your unique ensemble.
                </p>
              </div>
            </li>
          </ul>

          {/* <a
            href="#"
            className="mt-10 inline-flex items-center gap-2 bg-[#8B1A1A] text-white text-[11px] tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:bg-[#6E1414] transition-colors"
          >
            Explore Bridal <ArrowRight size={14} />
          </a> */}
        </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── FLAGSHIP STORE ──────────────────────────────────────────────────────────
const Store: React.FC = () => (
  <section className="bg-[#FFF8F7] py-20 lg:py-28">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-4">
        <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C]">
          Visit Our Flagship Store
        </h2>
      </div>
      <p className="text-center text-[#6B6158] text-sm lg:text-base mb-14 max-w-xl mx-auto">
        Experience the tactile luxury of our collections in person. Our advisors
        are available for private consultations.
      </p>

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Address block */}
        <div>
          {/* Gold accent line */}
          <div className="flex gap-4 items-start mb-8">
            <div className="w-1 self-stretch bg-[#C9A84C] shrink-0" />
            <div>
              <h3 className="font-serif text-xl lg:text-2xl text-[#1C1C1C] mb-1">
                Mansion Road Showroom
              </h3>
              <p className="text-[#6B6158] text-sm leading-relaxed">
                124 Heritage Plaza, Suite 400
                <br />
                Calcutta, WB 700001
              </p>
            </div>
          </div>

          <a
            href="tel:+919830012345"
            className="inline-flex items-center gap-3 text-[#8B1A1A] font-semibold text-sm hover:underline mb-10"
          >
            <Phone size={16} /> +91 98300 12345
          </a>

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-[#C9A84C]/30">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B6158] font-semibold mb-3 flex items-center gap-2">
                <Clock size={12} /> Opening Hours
              </p>
              <p className="text-[#1C1C1C] text-sm leading-relaxed">
                Mon – Sat: 10:30 AM – 8:30 PM
                <br />
                Sunday: 11:00 AM – 6:00 PM
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B6158] font-semibold mb-3 flex items-center gap-2">
                <ChevronRight size={12} /> Services
              </p>
              <p className="text-[#1C1C1C] text-sm leading-relaxed">
                Gold Appraisal, Cleaning
                <br />
                Custom Design, Exchange
              </p>
            </div>
          </div>
        </div>

        {/* Store image placeholder */}
        <div className="relative aspect-video bg-[#1C1C1C] flex items-center justify-center overflow-hidden">
          <Image src="/Shop-Location.png" alt="Heritage" fill className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  </section>
);

// ─── FOOTER ──────────────────────────────────────────────────────────────────
// const Footer: React.FC = () => (
//   <footer className="bg-[#1C1C1C] py-10">
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
//       <span className="font-serif text-[#C9A84C] text-lg">
//         Alankar Jewellers
//       </span>
//       <p className="text-[#6B6158] text-xs tracking-wider">
//         © {new Date().getFullYear()} Alankar Jewellers. All rights reserved.
//       </p>
//       <div className="flex gap-6">
//         {["Privacy", "Terms", "Sitemap"].map((l) => (
//           <a
//             key={l}
//             href="#"
//             className="text-[#6B6158] text-xs hover:text-[#C9A84C] transition-colors"
//           >
//             {l}
//           </a>
//         ))}
//       </div>
//     </div>
//   </footer>
// );

// ─── PAGE ────────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => (
  <main className="font-sans bg-[#F8F4EE]" style={{ fontFamily: "'Georgia', serif" }}>
    <NavBar />
    <Hero />
    <Heritage />
    <Bespoke />
    <Wedding />
    <LocationSection />
    <Footer />
  </main>
);

export default HomePage;