"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Heart,
  IndianRupee,
  Plus,
} from "lucide-react";
import axios from "axios";
import type { ICustomer, IPayment } from "@/src/models/Customer";

type CustomerForm = {
  name: string;
  phone: string;
  adress: string;
  dob: string;
  anniversary: string;
  dueAmount: string;
  advanceAmount: string;
};

type OpeningPayment = Omit<IPayment, "date">;
type FieldError = Partial<Record<keyof CustomerForm, string>>;

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  adress: "",
  dob: "",
  anniversary: "",
  dueAmount: "",
  advanceAmount: "",
};

function getOpeningLedger(form: CustomerForm) {
  const dueAmount = Number(form.dueAmount) || 0;
  const advanceAmount = Number(form.advanceAmount) || 0;
  const payments: OpeningPayment[] = [];

  if (dueAmount > 0) {
    payments.push({
      amount: dueAmount,
      type: "debit",
      reason: "purchase",
      mode: "cash",
      note: "Opening due",
      billId: "",
    });
  }

  if (advanceAmount > 0) {
    payments.push({
      amount: advanceAmount,
      type: "credit",
      reason: "advance",
      mode: "cash",
      note: "Opening advance",
      billId: "",
    });
  }

  const balance = advanceAmount - dueAmount;

  return {
    payments,
    dueAmount: balance < 0 ? Math.abs(balance) : 0,
    advanceAmount: balance > 0 ? balance : 0,
    netBalance: dueAmount - advanceAmount,
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <p
        className="text-[#8B6914] tracking-[0.16em] uppercase whitespace-nowrap"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {children}
      </p>
      <div className="flex-1 h-px bg-[#DDD0C4]" />
    </div>
  );
}

function FieldWrapper({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1 text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 600,
        }}
      >
        {label}
        {required && <span className="text-[#8B2020]">*</span>}
      </label>
      {children}
      {error && (
        <p
          className="text-[#C0392B]"
          style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  hasError,
  min,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hasError?: boolean;
  min?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-white border rounded-md px-3.5 py-2.5 transition-colors duration-200 ${
        hasError
          ? "border-[#C0392B]"
          : "border-[#DDD0C4] focus-within:border-[#8B6914]"
      }`}
    >
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none min-w-0"
        style={{ fontFamily: "'Georgia', serif" }}
        min={min}
      />
    </div>
  );
}

function TextAreaField({
  icon,
  placeholder,
  value,
  onChange,
  hasError,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 bg-white border rounded-md px-3.5 py-2.5 transition-colors duration-200 ${
        hasError
          ? "border-[#C0392B]"
          : "border-[#DDD0C4] focus-within:border-[#8B6914]"
      }`}
    >
      <span className="text-[#B8A898] flex-shrink-0 mt-0.5">{icon}</span>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none resize-none min-w-0"
        style={{ fontFamily: "'Georgia', serif", lineHeight: "1.65" }}
      />
    </div>
  );
}

interface AddCustomerModalProps {
  onClose?: () => void;
  onSave?: (data: ICustomer) => void;
}

export default function AddCustomerModal({
  onClose,
  onSave,
}: AddCustomerModalProps) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const openingLedger = getOpeningLedger(form);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const set = (key: keyof CustomerForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setMessage("");
  };

  const validate = (): boolean => {
    const e: FieldError = {};

    if (!form.name.trim()) e.name = "Customer name is required.";

    if (!form.phone.trim()) {
      e.phone = "Phone number is required.";
    } else if (!/^[+]?[\d\s\-()]{7,15}$/.test(form.phone.trim())) {
      e.phone = "Enter a valid phone number.";
    }

    if (!form.adress.trim()) e.adress = "Address is required.";

    if (
      form.dueAmount &&
      (isNaN(Number(form.dueAmount)) || Number(form.dueAmount) < 0)
    ) {
      e.dueAmount = "Enter a valid due amount.";
    }

    if (
      form.advanceAmount &&
      (isNaN(Number(form.advanceAmount)) || Number(form.advanceAmount) < 0)
    ) {
      e.advanceAmount = "Enter a valid advance amount.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setMessage("");
    setMessageType("success");

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        adress: form.adress.trim(),
        dob: form.dob || undefined,
        anniversary: form.anniversary || undefined,
        payments: openingLedger.payments,
        dueAmount: openingLedger.dueAmount,
        advanceAmount: openingLedger.advanceAmount,
      };

      const response = await axios.post("/api/add-customer", payload);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setMessageType("success");
      setMessage(response.data.message || "Customer added successfully.");
      onSave?.(response.data.data);
    } catch (error: any) {
      setMessageType("error");
      setMessage(error.message || "Failed to add customer.");
      console.error("Error saving customer:", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setMessage("");
    setMessageType("success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{
        background: "rgba(14, 8, 4, 0.82)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="relative w-full max-w-[620px] max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#FFFFFF" }}
      >
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        <div className="flex-shrink-0 bg-[#FDF0F0] px-8 pt-6 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={19} strokeWidth={1.8} />
          </button>

          <p
            className="text-[#8B6914] tracking-[0.18em] uppercase mb-1.5"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            Customer Management
          </p>

          <h2
            className="text-[#2C1A0E]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 400,
            }}
          >
            Add New Customer
          </h2>

          <div className="mt-4 w-10 h-[2px] rounded-full bg-[#8B6914]" />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7 flex flex-col gap-7 bg-white">
          <div>
            <SectionTitle>Personal Information</SectionTitle>
            <div className="flex flex-col gap-4">
              <FieldWrapper label="Full Name" required error={errors.name}>
                <InputField
                  icon={<User size={15} strokeWidth={1.6} />}
                  placeholder="e.g. Anjali Sharma"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  hasError={!!errors.name}
                />
              </FieldWrapper>

              <FieldWrapper label="Phone Number" required error={errors.phone}>
                <InputField
                  icon={<Phone size={15} strokeWidth={1.6} />}
                  placeholder="+91 98300 12345"
                  value={form.phone}
                  onChange={(v) => set("phone", v)}
                  type="tel"
                  hasError={!!errors.phone}
                />
              </FieldWrapper>

              <FieldWrapper label="Address" required error={errors.adress}>
                <TextAreaField
                  icon={<MapPin size={15} strokeWidth={1.6} />}
                  placeholder="W-45, Vaishali Nagar, Jaipur - 302021"
                  value={form.adress}
                  onChange={(v) => set("adress", v)}
                  hasError={!!errors.adress}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <SectionTitle>Important Dates</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="Date of Birth">
                <InputField
                  icon={<Calendar size={15} strokeWidth={1.6} />}
                  placeholder="DD / MM / YYYY"
                  value={form.dob}
                  onChange={(v) => set("dob", v)}
                  type="date"
                  hasError={!!errors.dob}
                />
              </FieldWrapper>

              <FieldWrapper label="Anniversary" error={errors.anniversary}>
                <InputField
                  icon={<Heart size={15} strokeWidth={1.6} />}
                  placeholder="DD / MM / YYYY"
                  value={form.anniversary}
                  onChange={(v) => set("anniversary", v)}
                  type="date"
                  hasError={!!errors.anniversary}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <SectionTitle>Opening Balance</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="Due Amount (₹)" error={errors.dueAmount}>
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 25000"
                  value={form.dueAmount}
                  onChange={(v) => set("dueAmount", v)}
                  type="number"
                  min="0"
                  hasError={!!errors.dueAmount}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Advance Amount (₹)"
                error={errors.advanceAmount}
              >
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 10000"
                  value={form.advanceAmount}
                  onChange={(v) => set("advanceAmount", v)}
                  type="number"
                  min="0"
                  hasError={!!errors.advanceAmount}
                />
              </FieldWrapper>
            </div>

            {(form.dueAmount || form.advanceAmount) && (
              <div
                className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)",
                  border: "1px solid #E8D080",
                }}
              >
                <div className="flex flex-col">
                  <p
                    className="text-[#7A5C00] tracking-[0.1em] uppercase"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    Net Balance
                  </p>
                  <p
                    className={
                      openingLedger.netBalance > 0
                        ? "text-[#8B2020]"
                        : "text-[#1A6B3A]"
                    }
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    ₹{Math.abs(openingLedger.netBalance).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p
                      className="text-[#9E8A7E] tracking-[0.08em] uppercase"
                      style={{ fontFamily: "'Georgia', serif", fontSize: "9px" }}
                    >
                      Final Due
                    </p>
                    <p
                      className="text-[#8B2020]"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      ₹{openingLedger.dueAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[#9E8A7E] tracking-[0.08em] uppercase"
                      style={{ fontFamily: "'Georgia', serif", fontSize: "9px" }}
                    >
                      Final Advance
                    </p>
                    <p
                      className="text-[#1A6B3A]"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      ₹{openingLedger.advanceAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {message && (
            <div
              className="rounded-md px-4 py-3"
              style={{
                background: messageType === "success" ? "#F0FBF4" : "#FFF0F1",
                border:
                  messageType === "success"
                    ? "1px solid #4CAF504D"
                    : "1px solid #C0392B4D",
              }}
            >
              <p
                className={
                  messageType === "success" ? "text-[#2E7D32]" : "text-[#8B2020]"
                }
                style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
              >
                {message}
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-[#FAF6F1] border-t border-[#E8DDD4] px-8 py-5 flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={saving}
            className="text-[#9E8A7E] hover:text-[#5C3D2E] disabled:opacity-50 tracking-[0.12em] uppercase transition-colors duration-200"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Reset
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] disabled:opacity-50 tracking-[0.12em] uppercase transition-colors duration-200 px-2"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#6B1A1A] hover:bg-[#521414] disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              {saving ? "Saving..." : "Add Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
