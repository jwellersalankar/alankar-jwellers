"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Weight,
  IndianRupee,
  Layers,
  Flame,
  Hash,
  FileText,
  Package,
  ChevronDown,
  X,
  Plus,
  ReceiptText,
  CalendarDays,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { IPRODUCTS } from "@/src/models/Product";
import axios from "axios";

// ── Types ──────────────────────────────────────────────
type ProductType = "Gold" | "Silver" | "Other";
type Purity      = "18k" | "22k" | "24k" | "Other";

type ProductForm = {
  // Purchase / Invoice fields
  supplierGSTIN: string;
  invoiceNumber: string;
  invoiceDate: string;
  isGSTBill: boolean;
  isInterState: boolean;   // true → server computes IGST; false → CGST+SGST
  // Item fields
  name: string;
  description: string;
  weight: string;
  metalValue: string;
  makingCharge: string;
  type: ProductType | "";
  purity: Purity | "";
  huid: string;
  hsn: string;
  quantity: string;
  // GST rates only — server calculates actual tax amounts
  gstRateMetal: string;    // default 3
  gstRateMaking: string;   // default 5
};

type FieldError = Partial<Record<keyof ProductForm, string>>;

const TYPES: ProductType[]  = ["Gold", "Silver", "Other"];
const PURITIES: Purity[]    = ["18k", "22k", "24k", "Other"];

const EMPTY_FORM: ProductForm = {
  supplierGSTIN: "", invoiceNumber: "", invoiceDate: "",
  isGSTBill: true, isInterState: false,
  name: "", description: "", weight: "", metalValue: "", makingCharge: "",
  type: "", purity: "", huid: "", hsn: "", quantity: "",
  gstRateMetal: "3", gstRateMaking: "5",
};

// ── Sub-components ─────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 sm:mb-5">
      <p
        className="text-[#8B6914] tracking-[0.16em] uppercase whitespace-nowrap"
        style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
      >
        {children}
      </p>
      <div className="flex-1 h-px bg-[#DDD0C4]" />
    </div>
  );
}

function FieldWrapper({
  label, error, required, children, hint,
}: {
  label: string; error?: string; required?: boolean;
  children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1 text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
      >
        {label}
        {required && <span className="text-[#8B2020]">*</span>}
        {hint && (
          <span className="normal-case tracking-normal text-[#C8B8A8] ml-1" style={{ fontSize: "9px" }}>
            ({hint})
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-[#C0392B] flex items-center gap-1" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
          <AlertCircle size={10} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}

function InputField({
  icon, placeholder, value, onChange, type = "text", hasError, readOnly,
}: {
  icon: React.ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; hasError?: boolean; readOnly?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-white border rounded-md px-3 sm:px-3.5 py-2.5 transition-colors duration-200 ${
      readOnly ? "bg-[#FAF6F1] cursor-not-allowed" :
      hasError ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
    }`}>
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none min-w-0"
        style={{ fontFamily: "'Georgia', serif" }}
      />
    </div>
  );
}

function SelectField({
  icon, value, onChange, options, placeholder, hasError,
}: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; hasError?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-white border rounded-md px-3 sm:px-3.5 py-2.5 transition-colors duration-200 ${
      hasError ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
    }`}>
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] text-[13px] focus:outline-none appearance-none cursor-pointer min-w-0"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} strokeWidth={1.8} className="text-[#9E8A7E] flex-shrink-0 pointer-events-none" />
    </div>
  );
}

// Toggle switch for GST bill
function ToggleField({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label
        className="text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-[#6B1A1A]" : "bg-[#DDD0C4]"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-0.5" : "-translate-x-4.5"}`}
        />
      </button>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────
interface CreateProductModalProps {
  onClose?: () => void;
  onSave?: (data: IPRODUCTS) => void;
}

export default function CreateProductModal({ onClose, onSave }: CreateProductModalProps) {
  const [form, setForm]       = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors]   = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Derive: if HUID is filled, quantity must be 1
  const isHUID = form.huid.trim().length > 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Auto-lock quantity to 1 when HUID is entered
  useEffect(() => {
    if (isHUID) setForm((prev) => ({ ...prev, quantity: "1" }));
  }, [isHUID]);

  const set = (key: keyof ProductForm, val: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess(false);
    setApiError(null);
  };

  // ── Validation ─────────────────────────────────────
  const validate = (): boolean => {
    const e: FieldError = {};

    // Invoice fields
    if (!form.invoiceNumber.trim()) e.invoiceNumber = "Invoice number is required.";
    if (!form.invoiceDate)          e.invoiceDate   = "Invoice date is required.";

    // Item fields
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.hsn.trim())  e.hsn  = "HSN code is required.";
    if (!form.type)        e.type = "Select a product type.";
    if (!form.purity)      e.purity = "Select a purity grade.";

    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0)
      e.weight = "Enter a valid weight.";
    if (!form.metalValue || isNaN(Number(form.metalValue)) || Number(form.metalValue) <= 0)
      e.metalValue = "Enter a valid metal value.";
    if (!form.makingCharge || isNaN(Number(form.makingCharge)) || Number(form.makingCharge) < 0)
      e.makingCharge = "Enter a valid making charge.";

    // Quantity required only when no HUID
    if (!isHUID) {
      if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
        e.quantity = "Quantity is required for non-HUID products.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);

    try {
      const payload = {
        supplierGSTIN:  form.supplierGSTIN.trim() || undefined,
        invoiceNumber:  form.invoiceNumber.trim(),
        invoiceDate:    form.invoiceDate,
        isGSTBill:      form.isGSTBill,
        isInterState:   form.isInterState,   // drives server GST split
        item: {
          name:          form.name.trim(),
          description:   form.description.trim() || undefined,
          weight:        Number(form.weight),
          metalValue:    Number(form.metalValue),
          makingCharge:  Number(form.makingCharge),
          type:          form.type,
          purity:        form.purity,
          hsn:           form.hsn.trim(),
          huid:          form.huid.trim() || undefined,
          quantity:      isHUID ? 1 : Number(form.quantity),
          gstRateMetal:  Number(form.gstRateMetal) || 3,   // server uses this
          gstRateMaking: Number(form.gstRateMaking) || 5,  // server uses this
        },
      };

      const response = await axios.post("/api/add-product", payload);

      if (response.data.success) {
        setSuccess(true);
        onSave?.(response.data.product);
        // Auto-close after 1.5 s on success
        setTimeout(() => onClose?.(), 1500);
      } else {
        setApiError(response.data.error || "Failed to add product.");
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.error || err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSuccess(false);
    setApiError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6"
      style={{ background: "rgba(14, 8, 4, 0.80)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose?.()}
    >
      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-[680px] max-h-[94vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#FFFFFF" }}
      >
        {/* Top accent */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        {/* ── Modal Header ── */}
        <div className="flex-shrink-0 bg-[#FDF0F0] px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 relative">
          <button
            onClick={() => !loading && onClose?.()}
            className="absolute top-4 right-4 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.8} />
          </button>

          <p
            className="text-[#8B6914] tracking-[0.18em] uppercase mb-1.5"
            style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
          >
            Inventory Management
          </p>
          <h2
            className="text-[#2C1A0E]"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 400 }}
          >
            Add New Product
          </h2>
          <div className="mt-3 sm:mt-4 w-10 h-[2px] rounded-full bg-[#8B6914]" />
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-7 flex flex-col gap-6 sm:gap-7 bg-white">

          {/* ── Section 1: Purchase / Invoice ── */}
          <div>
            <SectionTitle>Purchase / Invoice Details</SectionTitle>
            <div className="flex flex-col gap-4">

              {/* Invoice No + Date — 2 cols on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Invoice Number" required error={errors.invoiceNumber}>
                  <InputField
                    icon={<ReceiptText size={15} strokeWidth={1.6} />}
                    placeholder="e.g. INV-2024-001"
                    value={form.invoiceNumber}
                    onChange={(v) => set("invoiceNumber", v)}
                    hasError={!!errors.invoiceNumber}
                  />
                </FieldWrapper>

                <FieldWrapper label="Invoice Date" required error={errors.invoiceDate}>
                  <InputField
                    icon={<CalendarDays size={15} strokeWidth={1.6} />}
                    placeholder="DD/MM/YYYY"
                    value={form.invoiceDate}
                    onChange={(v) => set("invoiceDate", v)}
                    type="date"
                    hasError={!!errors.invoiceDate}
                  />
                </FieldWrapper>
              </div>

              {/* Supplier GSTIN + GST Bill toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Supplier GSTIN" hint="optional" error={errors.supplierGSTIN}>
                  <InputField
                    icon={<Building2 size={15} strokeWidth={1.6} />}
                    placeholder="e.g. 27AAPFU0939F1ZV"
                    value={form.supplierGSTIN}
                    onChange={(v) => set("supplierGSTIN", v)}
                  />
                </FieldWrapper>

                {/* GST Bill toggle — when off, Section 6 hides */}
                <div className="flex flex-col justify-center gap-3 pt-1 sm:pt-5">
                  <ToggleField
                    label="GST Bill"
                    value={form.isGSTBill}
                    onChange={(v) => set("isGSTBill", v)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Basic Information ── */}
          <div>
            <SectionTitle>Basic Information</SectionTitle>
            <div className="flex flex-col gap-4">
              <FieldWrapper label="Product Name" required error={errors.name}>
                <InputField
                  icon={<Tag size={15} strokeWidth={1.6} />}
                  placeholder="e.g. Maharaja Filigree Necklace"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  hasError={!!errors.name}
                />
              </FieldWrapper>

              <FieldWrapper label="Description" hint="optional">
                <div className="flex items-start gap-2.5 bg-white border border-[#DDD0C4] rounded-md px-3 sm:px-3.5 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200">
                  <FileText size={15} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0 mt-0.5" />
                  <textarea
                    placeholder="Describe the craftsmanship, design, and heritage..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={2}
                    className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none resize-none"
                    style={{ fontFamily: "'Georgia', serif", lineHeight: "1.7" }}
                  />
                </div>
              </FieldWrapper>
            </div>
          </div>

          {/* ── Section 3: Classification ── */}
          <div>
            <SectionTitle>Classification</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldWrapper label="Product Type" required error={errors.type}>
                <SelectField
                  icon={<Layers size={15} strokeWidth={1.6} />}
                  value={form.type}
                  onChange={(v) => set("type", v)}
                  options={TYPES}
                  placeholder="Select type..."
                  hasError={!!errors.type}
                />
              </FieldWrapper>

              <FieldWrapper label="Purity Grade" required error={errors.purity}>
                <SelectField
                  icon={<Flame size={15} strokeWidth={1.6} />}
                  value={form.purity}
                  onChange={(v) => set("purity", v)}
                  options={PURITIES}
                  placeholder="Select purity..."
                  hasError={!!errors.purity}
                />
              </FieldWrapper>

              <FieldWrapper label="HSN Code" required error={errors.hsn}>
                <InputField
                  icon={<Hash size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 71131910"
                  value={form.hsn}
                  onChange={(v) => set("hsn", v)}
                  hasError={!!errors.hsn}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* ── Section 4: Pricing & Weight ── */}
          <div>
            <SectionTitle>Pricing & Weight</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldWrapper label="Weight (g)" required error={errors.weight}>
                <InputField
                  icon={<Weight size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 42.50"
                  value={form.weight}
                  onChange={(v) => set("weight", v)}
                  type="number"
                  hasError={!!errors.weight}
                />
              </FieldWrapper>

              <FieldWrapper label="Metal Value (₹)" required error={errors.metalValue} hint="excl. making">
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 120000"
                  value={form.metalValue}
                  onChange={(v) => set("metalValue", v)}
                  type="number"
                  hasError={!!errors.metalValue}
                />
              </FieldWrapper>

              <FieldWrapper label="Making Charge (₹)" required error={errors.makingCharge}>
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 14500"
                  value={form.makingCharge}
                  onChange={(v) => set("makingCharge", v)}
                  type="number"
                  hasError={!!errors.makingCharge}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* ── Section 5: Inventory & Certification ── */}
          <div>
            <SectionTitle>Inventory & Certification</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="HUID (Hallmark Unique ID)" hint="leave empty for bulk" error={errors.huid}>
                <InputField
                  icon={<Hash size={15} strokeWidth={1.6} />}
                  placeholder="e.g. AB1234CD"
                  value={form.huid}
                  onChange={(v) => set("huid", v)}
                  hasError={!!errors.huid}
                />
              </FieldWrapper>

              <FieldWrapper
                label="Quantity"
                required={!isHUID}
                hint={isHUID ? "locked to 1 (HUID)" : "required for bulk"}
                error={errors.quantity}
              >
                <InputField
                  icon={<Package size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 10"
                  value={isHUID ? "1" : form.quantity}
                  onChange={(v) => set("quantity", v)}
                  type="number"
                  hasError={!!errors.quantity}
                  readOnly={isHUID}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* ── Section 6: GST Rates ── */}
          {form.isGSTBill && (
            <div>
              <SectionTitle>GST Rates</SectionTitle>

              {/* Intra-state / Inter-state toggle */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg mb-4"
                style={{ background: "#FAF6F1", border: "1px solid #E8DDD4" }}
              >
                <div>
                  <p
                    className="text-[#5C4A3A]"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 600 }}
                  >
                    {form.isInterState ? "Inter-State Supply" : "Intra-State Supply"}
                  </p>
                  <p
                    className="text-[#9E8A7E]"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}
                  >
                    {form.isInterState
                      ? "Server will compute IGST"
                      : "Server will split into CGST + SGST"}
                  </p>
                </div>
                <ToggleField
                  label="Inter-State"
                  value={form.isInterState}
                  onChange={(v) => set("isInterState", v)}
                />
              </div>

              {/* GST rate inputs — only metal & making rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Metal GST Rate %" hint="default 3">
                  <div className="flex items-center gap-2 bg-white border border-[#DDD0C4] rounded-md px-3 sm:px-3.5 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200">
                    <IndianRupee size={14} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                    <input
                      type="number"
                      placeholder="3"
                      value={form.gstRateMetal}
                      onChange={(e) => set("gstRateMetal", e.target.value)}
                      className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none min-w-0"
                      style={{ fontFamily: "'Georgia', serif" }}
                    />
                    <span className="text-[#9E8A7E] flex-shrink-0" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>%</span>
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Making Charge GST Rate %" hint="default 5">
                  <div className="flex items-center gap-2 bg-white border border-[#DDD0C4] rounded-md px-3 sm:px-3.5 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200">
                    <IndianRupee size={14} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                    <input
                      type="number"
                      placeholder="5"
                      value={form.gstRateMaking}
                      onChange={(e) => set("gstRateMaking", e.target.value)}
                      className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none min-w-0"
                      style={{ fontFamily: "'Georgia', serif" }}
                    />
                    <span className="text-[#9E8A7E] flex-shrink-0" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>%</span>
                  </div>
                </FieldWrapper>
              </div>

              {/* Live GST preview — server mirrors this calculation */}
              {(form.metalValue || form.makingCharge) && (
                <div
                  className="mt-4 rounded-lg overflow-hidden"
                  style={{ border: "1px solid #E8DDD4" }}
                >
                  {(() => {
                    const qty         = isHUID ? 1 : (Number(form.quantity) || 1);
                    const metal       = (Number(form.metalValue) || 0) * qty;
                    const making      = (Number(form.makingCharge) || 0) * qty;
                    const rMetal      = Number(form.gstRateMetal) || 3;
                    const rMaking     = Number(form.gstRateMaking) || 5;
                    const totalTax    = (metal * rMetal / 100) + (making * rMaking / 100);
                    const igst        = form.isInterState ? totalTax : 0;
                    const cgst        = form.isInterState ? 0 : totalTax / 2;
                    const sgst        = cgst;
                    return (
                      <div className="grid grid-cols-3 divide-x divide-[#E8DDD4]">
                        {[
                          { label: form.isInterState ? "IGST" : "CGST", value: form.isInterState ? igst : cgst, color: "#8B2020" },
                          { label: form.isInterState ? "—"   : "SGST",  value: form.isInterState ? 0    : sgst, color: "#8B6914" },
                          { label: "Total GST",                          value: totalTax,                        color: "#2C1A0E" },
                        ].map((r) => (
                          <div key={r.label} className="flex flex-col items-center py-3 px-2 bg-[#FAF6F1]">
                            <p style={{ fontFamily: "'Georgia', serif", fontSize: "9px", color: "#9E8A7E", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                              {r.label}
                            </p>
                            <p style={{ fontFamily: "'Georgia', serif", fontSize: "14px", fontWeight: 700, color: r.color }}>
                              ₹{r.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── Live cost preview ── */}
          {(form.metalValue || form.makingCharge) && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg"
              style={{ background: "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)", border: "1px solid #E8D080" }}
            >
              <p
                className="text-[#7A5C00] tracking-[0.1em] uppercase"
                style={{ fontFamily: "'Georgia', serif", fontSize: "9px", fontWeight: 700 }}
              >
                Total Item Value{isHUID ? "" : form.quantity ? ` × ${form.quantity}` : ""}
              </p>
              <p
                className="text-[#4A3000]"
                style={{ fontFamily: "'Georgia', serif", fontSize: "16px", fontWeight: 700 }}
              >
                ₹{(
                  ((Number(form.metalValue) || 0) + (Number(form.makingCharge) || 0)) *
                  (isHUID ? 1 : (Number(form.quantity) || 1))
                ).toLocaleString("en-IN")}
              </p>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="bg-[#F0FBF4] border border-[#4CAF50]/30 rounded-md px-4 py-3 flex items-center gap-2">
              <CheckCircle2 size={15} strokeWidth={2} className="text-[#2E7D32] flex-shrink-0" />
              <p className="text-[#2E7D32]" style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}>
                Product added successfully. Closing…
              </p>
            </div>
          )}

          {/* API error banner */}
          {apiError && (
            <div className="bg-[#FDF0F0] border border-[#E8A0A8] rounded-md px-4 py-3 flex items-center gap-2">
              <AlertCircle size={15} strokeWidth={2} className="text-[#8B2020] flex-shrink-0" />
              <p className="text-[#8B2020]" style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}>
                {apiError}
              </p>
            </div>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="flex-shrink-0 bg-[#FAF6F1] border-t border-[#E8DDD4] px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            disabled={loading}
            className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200 disabled:opacity-40"
            style={{ fontFamily: "'Georgia', serif", fontSize: "11px", fontWeight: 600 }}
          >
            Reset
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => !loading && onClose?.()}
              disabled={loading}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200 disabled:opacity-40 hidden sm:block"
              style={{ fontFamily: "'Georgia', serif", fontSize: "11px", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="flex items-center gap-2 bg-[#6B1A1A] hover:bg-[#521414] disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 sm:px-8 py-3 sm:py-3.5 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 700 }}
            >
              {loading
                ? <><Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> Saving…</>
                : <><Plus size={14} strokeWidth={2.5} /> Add Product</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}