"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative flex items-center w-full h-full min-h-[1300px]">
      
      {/* Background Image Placeholder */}
          <Image src="/HomeHero.png" alt="Hero" fill className="h-full w-full object-cover" priority />
     
      

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-10 md:px-16 lg:px-20 max-w-4xl">
        
        {/* Headline */}
        <h1
          className="text-white leading-[1.05] tracking-[-0.01em] mb-8"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(52px, 7vw, 88px)",
            fontWeight: 300,
          }}
        >
          Artistry In Every
          <br />
          Millimeter.
        </h1>

        {/* Subtext */}
        <p
          className="text-white/80 leading-[1.7] max-w-[460px]"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(14px, 1.2vw, 17px)",
            fontWeight: 300,
          }}
        >
          Discover a legacy of gold craftsmanship that transcends generations.
          Each piece at Lakhhi Jewellers is a testament to timeless elegance and
          bespoke luxury.
        </p>
      </div>
    </section>
  );
}