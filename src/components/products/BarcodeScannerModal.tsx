"use client";

import { X, Camera, Loader2 } from "lucide-react";
import { RefObject, useEffect, useState } from "react";

interface BarcodeScannerModalProps {
  open: boolean;
  loading: boolean;
  error: string;
  videoRef: RefObject<HTMLVideoElement>;
  onClose: () => void;
  switchCamera: () => void;

  cameraCount: number;
}

export default function BarcodeScannerModal({
  open,
  loading,
  error,
  videoRef,
  onClose,
  switchCamera,
  cameraCount,
}: BarcodeScannerModalProps) {
  if (!open) return null;

  const [torch, setTorch] = useState(false);

  useEffect(() => {
    console.log("Scanner Open:", open);
}, [open]);

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;

      if (!stream) return;

      const track = stream.getVideoTracks()[0];

      if (!track) return;

      const capabilities = track.getCapabilities();

      if (!("torch" in capabilities)) {
        alert("Torch not supported.");
        return;
      }

      await track.applyConstraints({
        advanced: [
          {
            torch: !torch,
          } as any,
        ],
      });

      setTorch(!torch);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{
        background: "rgba(14,8,4,0.82)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white animate-in fade-in zoom-in duration-300">
        {/* Top Accent */}
        <div className="h-1 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-[#FDF0F0]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#8D8177] hover:text-[#5C3D2E] transition"
          >
            <X size={18} />
          </button>

          <p
            className="uppercase tracking-[0.18em] text-[#8B6914]"
            style={{
              fontFamily: "Georgia",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            Inventory Management
          </p>

          <h2
            className="text-[#2C1A0E] mt-1"
            style={{
              fontFamily: "Georgia",
              fontSize: 24,
              fontWeight: 400,
            }}
          >
            Scan Barcode
          </h2>

          <div className="w-10 h-[2px] rounded-full bg-[#8B6914] mt-4" />
        </div>

        {/* Body */}

        <div className="p-6">
          <div
            className="relative overflow-hidden rounded-xl border-2"
            style={{
              borderColor: "#DDD0C4",
              background: "#000",
              aspectRatio: "1",
            }}
          >
            {/* Video */}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scanner Border */}

            <div className="absolute inset-6 rounded-xl border-[3px] border-[#C9A84C]" />

            {/* Animated Scan Line */}

            <div className="absolute left-8 right-8 top-10 h-[2px] bg-[#C9A84C] animate-[scanline_2.2s_linear_infinite]" />

            {/* Corner Decorations */}

            <div className="absolute left-6 top-6 w-6 h-6 border-l-4 border-t-4 border-[#8B2020]" />

            <div className="absolute right-6 top-6 w-6 h-6 border-r-4 border-t-4 border-[#8B2020]" />

            <div className="absolute left-6 bottom-6 w-6 h-6 border-l-4 border-b-4 border-[#8B2020]" />

            <div className="absolute right-6 bottom-6 w-6 h-6 border-r-4 border-b-4 border-[#8B2020]" />

            {loading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={36} />
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Camera className="mx-auto text-[#8B6914]" size={26} />

            <p
              className="mt-3 text-[#5C4A3A]"
              style={{
                fontFamily: "Georgia",
                fontSize: 14,
              }}
            >
              Align the barcode inside the golden frame.
            </p>

            <p
              className="mt-1 text-[#A28D7E]"
              style={{
                fontFamily: "Georgia",
                fontSize: 12,
              }}
            >
              Scanning starts automatically.
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p
                  className="text-red-700"
                  style={{
                    fontFamily: "Georgia",
                    fontSize: 13,
                  }}
                >
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}

        <div
  className="px-6 py-5 border-t"
  style={{
    borderColor: "#E8DDD4",
    background: "#FAF6F1",
  }}
>
  <div className="flex items-center justify-between">
    {/* Left Side */}
    <button
      onClick={toggleTorch}
      className="px-5 py-3 rounded-md bg-[#C9A84C] text-white hover:bg-[#B58F36] transition"
      style={{
        fontFamily: "Georgia",
        fontWeight: 600,
        letterSpacing: ".12em",
        fontSize: 12,
      }}
    >
      {torch ? "Torch Off" : "Torch On"}
    </button>

    {/* Right Side */}
    <div className="flex items-center gap-3">
      {cameraCount > 1 && (
        <button
          onClick={switchCamera}
          className="px-5 py-3 rounded-md bg-[#8B6914] text-white hover:bg-[#6F5510] transition"
          style={{
            fontFamily: "Georgia",
            fontWeight: 600,
            letterSpacing: ".12em",
            fontSize: 12,
          }}
        >
          Switch Camera
        </button>
      )}

      <button
        onClick={onClose}
        className="px-6 py-3 rounded-md text-white hover:bg-[#521414] transition"
        style={{
          background: "#6B1A1A",
          fontFamily: "Georgia",
          fontWeight: 600,
          letterSpacing: ".12em",
          fontSize: 12,
        }}
      >
        Cancel
      </button>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}
