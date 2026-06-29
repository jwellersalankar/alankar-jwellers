"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";

// ── Types ──────────────────────────────────────────────
type StaffRole =
  | "Store Associate"
  | "Senior Jeweller"
  | "Store Manager"
  | "Accountant"
  | "Security";

type StaffForm = {
  fullName: string;
  role: StaffRole;
  email: string;
  phone: string;
};

const ROLES: StaffRole[] = [
  "Store Associate",
  "Senior Jeweller",
  "Store Manager",
  "Accountant",
  "Security",
];

// ── Sub-components ─────────────────────────────────────
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent border-b border-[#C8B8A8] text-[#3D2B1F] placeholder-[#C8B8A8] pb-2 focus:outline-none focus:border-[#8B6914] transition-colors duration-200";
const inputStyle = { fontFamily: "'Georgia', serif", fontSize: "15px" };

// ── Main Modal Component ───────────────────────────────
interface AddStaffModalProps {
  onClose?: () => void;
  onSave?: (data: StaffForm) => void;
}

export default function AddStaffModal({
  onClose,
  onSave,
}: AddStaffModalProps) {
  const [form, setForm] = useState<StaffForm>({
    fullName: "",
    role: "Store Associate",
    email: "",
    phone: "",
  });

  const set = <K extends keyof StaffForm>(key: K, val: StaffForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onSave?.(form);
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(20, 10, 5, 0.72)" }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-[620px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#FFFFFF" }}
      >
        {/* ── Header band ── */}
        <div className="bg-[#FDF0F0] px-8 pt-8 pb-6 relative">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.8} />
          </button>

          {/* Eyebrow */}
          <p
            className="text-[#8B6914] tracking-[0.18em] uppercase mb-2"
            style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
          >
            Personnel Registration
          </p>

          {/* Title */}
          <h2
            className="text-[#2C1A0E]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(24px, 3vw, 30px)",
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            Add New Staff
          </h2>

          {/* Gold rule */}
          <div className="mt-5 w-12 h-[2.5px] rounded-full bg-[#8B6914]" />
        </div>

        {/* ── Form Body ── */}
        <div className="bg-white px-8 pt-8 pb-8 flex flex-col gap-8">

          {/* Row 1: Full Name + Role */}
          <div className="grid grid-cols-2 gap-8">
            <FormField label="Full Name">
              <input
                type="text"
                placeholder="e.g. Rahul Varma"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Role">
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value as StaffRole)}
                  className="w-full appearance-none bg-transparent border-b border-[#C8B8A8] text-[#3D2B1F] pb-2 pr-6 focus:outline-none focus:border-[#8B6914] transition-colors duration-200 cursor-pointer"
                  style={inputStyle}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={1.8}
                  className="absolute right-0 bottom-3 text-[#9E8A7E] pointer-events-none"
                />
              </div>
            </FormField>
          </div>

          {/* Row 2: Email + Phone */}
          <div className="grid grid-cols-2 gap-8">
            <FormField label="Email Address">
              <input
                type="email"
                placeholder="rahul@lakhhi.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </FormField>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-6 pt-2">
            <button
              onClick={onClose}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-[#6B1A1A] hover:bg-[#521414] text-white px-10 py-4 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 700 }}
            >
              Save Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}