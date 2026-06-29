"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  CalendarDays,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { ISHOP } from "@/src/models/Shop";
import axios from "axios";

// ── Types ──────────────────────────────────────────────
type ReportType = "gstr1" | "gstr3b";

const REPORT_OPTIONS: { value: ReportType; label: string; description: string }[] = [
  {
    value: "gstr1",
    label: "GSTR-1",
    description: "Outward supplies — sales register",
  },
  {
    value: "gstr3b",
    label: "GSTR-3B",
    description: "Monthly summary return",
  },
];

// ── Field wrapper ───────────────────────────────────────
function FieldWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function ExportGSTReport() {
  const [open, setOpen]             = useState(false);
  const [reportType, setReportType] = useState<ReportType>("gstr1");
  const [from, setFrom]             = useState("2026-04-01");
  const [to, setTo]                 = useState("2026-04-30");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const [shop, setShop]             = useState<ISHOP | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await axios.get("/api/get-shop");
        if (response.data.success) {
          setShop(response.data.shop);
          console.log("Fetched shop details: ", response.data.shop);
        }
      } catch (error) {
        console.error("Failed to fetch shop details:", error);
      }
    };
    fetchShop();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDownload = async () => {
    if (!from || !to) {
      setError("Please select both From and To dates.");
      return;
    }
    if (new Date(from) > new Date(to)) {
      setError("From date must be before To date.");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    const body = {
      gstin: shop?.gstin ?? ""
    };

    try {
      const res = await fetch(`/api/${reportType}?from=${from}&to=${to}&gstin=${shop?.gstin ?? ""}`);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);

      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${reportType}_${from}_to_${to}.zip`;
      a.click();

      URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.message ?? "Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedReport = REPORT_OPTIONS.find((r) => r.value === reportType)!;

  return (
    <div className="relative inline-block" ref={dropdownRef}>

      {/* ── Trigger Button ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
          setSuccess(false);
        }}
        className="flex items-center gap-2 transition-colors duration-200"
        style={{
          background: "linear-gradient(135deg, #C9A84C 0%, #B8943C 100%)",
          color: "#3D2000",
          fontFamily: "'Georgia', serif",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "10px 18px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background =
            "linear-gradient(135deg, #B8943C 0%, #A07830 100%)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background =
            "linear-gradient(135deg, #C9A84C 0%, #B8943C 100%)")
        }
      >
        <FileSpreadsheet size={15} strokeWidth={2} />
        Export GST
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute lg:right-0 -left-20 mt-2 z-50 flex flex-col gap-0 overflow-hidden"
          style={{
            width: "clamp(280px, 90vw, 340px)",
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E8DDD4",
            boxShadow:
              "0 16px 48px rgba(44,26,14,0.16), 0 4px 12px rgba(44,26,14,0.08)",
          }}
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020] flex-shrink-0" />

          {/* Header */}
          <div className="flex items-start justify-between bg-[#FDF0F0] px-5 pt-5 pb-4 relative flex-shrink-0">
            <div>
              <p
                className="text-[#8B6914] tracking-[0.18em] uppercase mb-1"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                GST Compliance
              </p>
              <h3
                className="text-[#2C1A0E]"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "18px",
                  fontWeight: 400,
                }}
              >
                Export GST Report
              </h3>
              <div className="mt-3 w-8 h-[2px] rounded-full bg-[#8B6914]" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200 flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>

          {/* Form body */}
          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Report type selector */}
            <FieldWrapper label="Select Report">
              <div className="flex flex-col gap-2">
                {REPORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReportType(opt.value)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all duration-150"
                    style={{
                      border:
                        reportType === opt.value
                          ? "1.5px solid #8B6914"
                          : "1px solid #DDD0C4",
                      background:
                        reportType === opt.value ? "#FDF3DC" : "#FAF6F1",
                    }}
                  >
                    {/* Radio dot */}
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border:
                          reportType === opt.value
                            ? "4px solid #8B6914"
                            : "1.5px solid #C8B8A8",
                        background:
                          reportType === opt.value ? "#FDF3DC" : "white",
                      }}
                    />
                    <div className="min-w-0">
                      <p
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "13px",
                          fontWeight: 700,
                          color:
                            reportType === opt.value ? "#5C3D00" : "#3D2B1F",
                        }}
                      >
                        {opt.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "11px",
                          color: "#9E8A7E",
                        }}
                      >
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </FieldWrapper>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="From Date">
                <div
                  className="flex items-center gap-2 bg-white border border-[#DDD0C4] rounded-md px-3 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200"
                >
                  <CalendarDays
                    size={14}
                    strokeWidth={1.8}
                    className="text-[#B8A898] flex-shrink-0"
                  />
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setError(null);
                    }}
                    className="flex-1 bg-transparent text-[#3D2B1F] text-[12px] focus:outline-none min-w-0 cursor-pointer"
                    style={{ fontFamily: "'Georgia', serif" }}
                  />
                </div>
              </FieldWrapper>

              <FieldWrapper label="To Date">
                <div
                  className="flex items-center gap-2 bg-white border border-[#DDD0C4] rounded-md px-3 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200"
                >
                  <CalendarDays
                    size={14}
                    strokeWidth={1.8}
                    className="text-[#B8A898] flex-shrink-0"
                  />
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setError(null);
                    }}
                    className="flex-1 bg-transparent text-[#3D2B1F] text-[12px] focus:outline-none min-w-0 cursor-pointer"
                    style={{ fontFamily: "'Georgia', serif" }}
                  />
                </div>
              </FieldWrapper>
            </div>

            {/* Selected summary pill */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)",
                border: "1px solid #E8D080",
              }}
            >
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "11px",
                  color: "#7A5C00",
                  fontWeight: 700,
                }}
              >
                {selectedReport.label}
              </p>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  color: "#9E8A7E",
                }}
              >
                {from} → {to}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 bg-[#FDF0F0] border border-[#E8A0A8] rounded-md px-3 py-2.5">
                <AlertCircle
                  size={14}
                  strokeWidth={2}
                  className="text-[#8B2020] flex-shrink-0 mt-0.5"
                />
                <p
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "12px",
                    color: "#8B2020",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="flex items-center gap-2 bg-[#F0FBF4] border border-[#A0D4B0] rounded-md px-3 py-2.5">
                <CheckCircle2
                  size={14}
                  strokeWidth={2}
                  className="text-[#1A6B3A] flex-shrink-0"
                />
                <p
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "12px",
                    color: "#1A6B3A",
                  }}
                >
                  Report downloaded successfully.
                </p>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div
            className="flex items-center justify-between px-5 py-4 border-t border-[#E8DDD4] flex-shrink-0"
            style={{ background: "#FAF6F1" }}
          >
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.1em] uppercase transition-colors duration-200 disabled:opacity-40"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={loading || success}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-md tracking-[0.1em] uppercase transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "12px",
                fontWeight: 700,
                background:
                  loading || success ? "#8B2020" : "#6B1A1A",
              }}
              onMouseEnter={(e) => {
                if (!loading && !success)
                  e.currentTarget.style.background = "#521414";
              }}
              onMouseLeave={(e) => {
                if (!loading && !success)
                  e.currentTarget.style.background = "#6B1A1A";
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                  Downloading…
                </>
              ) : (
                <>
                  <Download size={14} strokeWidth={2.5} />
                  Download
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}