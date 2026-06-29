"use client";

import { Phone } from "lucide-react";

type LocationInfo = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  hours: { days: string; time: string }[];
  services: string[];
};

const location: LocationInfo = {
  name: "SRI LAKKHI JEWELLERS",
  addressLine1: "DARGAH ROAD NEAR GANDHI CHOWK TAJPUR",
  addressLine2: "Samastipur, Bihar 848130",
  phone: "+91 9631028016",
  hours: [
    { days: "Mon – Sat:", time: "10:30 AM – 8:30 PM" },
    { days: "Sunday:", time: "11:00 AM – 6:00 PM" },
  ],
  services: ["Gold Appraisal, Cleaning,", "Custom Design, Exchange"],
};

export default function LocationSection() {
  return (
    <section className="w-full bg-[#FAF6F1] py-20 md:py-28 px-6 md:px-12 lg:px-20">
      <div className="max-w-screen-xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-14">
          <h2
            className="text-[#4A1A1A] mb-4"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            Visit Our Flagship Atelier
          </h2>
          <p
            className="text-[#5C4A3A]/70 max-w-2xl mx-auto leading-[1.7]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(14px, 1.1vw, 16px)",
              fontWeight: 400,
            }}
          >
            Experience the tactile luxury of our collections in person. Our
            advisors are available for private consultations.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">

          {/* ── Left: Location Details ── */}
          <div className="flex-1 min-w-0">

            {/* Name + address block with left border */}
            <div className="border-l-2 border-[#8B6914] pl-5 mb-10">
              <h3
                className="text-[#2C1A0E] mb-5"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "clamp(20px, 2vw, 26px)",
                  fontWeight: 600,
                }}
              >
                {location.name}
              </h3>
              <p
                className="text-[#5C4A3A] leading-[1.9]"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "15px",
                  fontWeight: 400,
                }}
              >
                {location.addressLine1}
                <br />
                {location.addressLine2}
              </p>

              {/* Phone */}
              <a
                href={`tel:${location.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-3 mt-6 text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-200 group"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                <Phone
                  size={17}
                  strokeWidth={1.8}
                  className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                />
                {location.phone}
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-[#DDD0C4] mb-8" />

            {/* Opening Hours + Services */}
            <div className="flex flex-col sm:flex-row gap-10">

              {/* Opening Hours */}
              <div className="flex-1">
                <p
                  className="text-[#8B6914] tracking-[0.16em] mb-3"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Opening Hours
                </p>
                {location.hours.map((h, i) => (
                  <p
                    key={i}
                    className="text-[#3D2B1F] leading-[1.85]"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    {h.days} {h.time}
                  </p>
                ))}
              </div>

              {/* Services */}
              <div className="flex-1">
                <p
                  className="text-[#8B6914] tracking-[0.16em] mb-3"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Services
                </p>
                {location.services.map((s, i) => (
                  <p
                    key={i}
                    className="text-[#3D2B1F] leading-[1.85]"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    {s}
                  </p>
                ))}
              </div>

            </div>
          </div>

          {/* ── Right: Image Placeholder ── */}
          {/* Replace inner div with:
              <Image src="/showroom.jpg" alt="Mansion Road Showroom" fill className="object-cover" />
          */}
          <div className="relative w-full lg:w-[580px] xl:w-[640px] flex-shrink-0 rounded-sm overflow-hidden shadow-md"
            style={{ aspectRatio: "16/10" }}
          >
            <img src="./Shop-Location.jpeg" alt="" className="w-full h-full object-cover" />
          </div>

        </div>
      </div>
    </section>
  );
}