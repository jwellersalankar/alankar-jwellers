"use client";

export default function HeritageSection() {
  return (
    <section className="w-full bg-[#FAF6F1] py-20 md:py-28 px-6 md:px-12 lg:px-20">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-16 lg:gap-24">

        {/* ── Left Column: Image + Badge ── */}
        <div className="relative flex-shrink-0 w-full md:w-[420px] lg:w-[480px]">

          {/* Image placeholder */}
          {/* Replace with:
              <Image src="/heritage.jpg" alt="Craftsman" fill className="object-cover" />
          */}
          <div
            className="w-full rounded-sm overflow-hidden bg-[#3A2A1E]"
            style={{ aspectRatio: "460 / 560" }}
          >
            {/* Placeholder gradient simulating the dark craftsman photo */}
            <img src="./Heritage.png" alt="" className="w-full h-full object-cover" />
          </div>

          {/* 22k Gold Badge — overlapping bottom-right of image */}
          <div
            className="absolute bottom-[-32px] right-[-8px] md:right-[-28px] w-[190px] h-[180px] bg-[#F5CC5A] flex flex-col justify-center px-7 py-6"
            style={{ boxShadow: "4px 4px 24px rgba(0,0,0,0.10)" }}
          >
            <span
              className="text-[#3D2B00] leading-none mb-3"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "52px",
                fontWeight: 400,
              }}
            >
              22k
            </span>
            <span
              className="text-[#7A5C00] tracking-[0.13em] leading-snug"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              PURITY CERTIFIED
              <br />
              GOLD STANDARD
            </span>
          </div>
        </div>

        {/* ── Right Column: Text Content ── */}
        <div className="flex-1 pt-0 md:pt-20 lg:pt-28">

          {/* Eyebrow */}
          <p
            className="text-[#8B6914] tracking-[0.18em] mb-5"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "12px",
              fontWeight: 400,
              textTransform: "uppercase",
            }}
          >
            OUR HERITAGE
          </p>

          {/* Headline */}
          <h2
            className="text-[#4A1A1A] leading-[1.1] tracking-[-0.01em] mb-8 max-w-[540px]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(36px, 4.5vw, 58px)",
              fontWeight: 400,
            }}
          >
            Preserving the Soul of
            <br />
            Traditional Craft.
          </h2>

          {/* Body */}
          <p
            className="text-[#3D2B1F]/80 leading-[1.75] max-w-[560px]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(14px, 1.1vw, 16px)",
              fontWeight: 400,
            }}
          >
            Founded on the principles of trust and impeccable artistry, Lakhhi
            Jewellers has been the destination for connoisseurs of fine jewelry
            for decades. We believe that jewelry is not just an accessory, but
            an heirloom that carries stories of love, celebration, and triumph.
          </p>
        </div>

      </div>
    </section>
  );
}