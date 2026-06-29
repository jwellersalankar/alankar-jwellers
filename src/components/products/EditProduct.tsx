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
} from "lucide-react";
import { IPRODUCTS } from "@/src/models/Product";
import axios from "axios";

// ── Types ──────────────────────────────────────────────
type ProductType = "Gold" | "Silver" | "Other";
type Purity = "18k" | "22k" | "24k" | "Other";

type ProductForm = {
  name: string;
  description: string;
  weight: string;
  price: string;
  stock: string;
  type: ProductType | "";
  purity: Purity | "";
  makingCharge: string;
  huid: string;
  hsn: string;
};

type FieldError = Partial<Record<keyof ProductForm, string>>;

const TYPES: ProductType[] = ["Gold", "Silver", "Other"];
const PURITIES: Purity[] = ["18k", "22k", "24k", "Other"];

const EMPTY_FORM: ProductForm = {
  name: "", description: "", weight: "", price: "",
  stock: "", type: "", purity: "", makingCharge: "", huid: "",
  hsn: "",
};

// ── Section Title ──────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
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

// ── Field Wrapper ──────────────────────────────────────
function FieldWrapper({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1 text-[#9E8A7E] tracking-[0.12em] uppercase"
        style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
      >
        {label}
        {required && <span className="text-[#8B2020]">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[#C0392B]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Input Field ────────────────────────────────────────
function InputField({
  icon, placeholder, value, onChange, type = "text", hasError,
}: {
  icon: React.ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; hasError?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-white border rounded-md px-3.5 py-2.5 transition-colors duration-200 ${
      hasError ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
    }`}>
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none"
        style={{ fontFamily: "'Georgia', serif" }}
      />
    </div>
  );
}

// ── Select Field ───────────────────────────────────────
function SelectField({
  icon, value, onChange, options, placeholder, hasError,
}: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; hasError?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-white border rounded-md px-3.5 py-2.5 transition-colors duration-200 ${
      hasError ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
    }`}>
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] text-[13px] focus:outline-none appearance-none cursor-pointer"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} strokeWidth={1.8} className="text-[#9E8A7E] flex-shrink-0 pointer-events-none" />
    </div>
  );
}

// ── Modal Component ────────────────────────────────────
interface CreateProductModalProps {
  onClose?: () => void;
  onSave?: (data: IPRODUCTS) => void;
  product: IPRODUCTS | null;
}

export default function EditProductModal({ onClose, onSave, product }: CreateProductModalProps) {
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(()=>{
    if(product){
        setForm({
            name: product?.name || "",
            description: product?.description || "",
            weight: product?.weight.toString() || "",
            price: product?.price.toString() || "",
            stock: product?.stock.toString() || "",
            type: product?.type || "",
            purity: product?.purity || "",
            makingCharge: product?.makingCharge?.toString() || "",
            huid: product?.huid || "",
            hsn: product?.hsn?.toString() || "",
        })
    }
  },[product])

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (key: keyof ProductForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitted(false);
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0)
      e.weight = "Enter a valid weight.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Enter a valid price.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      e.stock = "Enter valid stock.";
    if (!form.type) e.type = "Select a type.";
    if (!form.purity) e.purity = "Select purity.";
    if (form.makingCharge && (isNaN(Number(form.makingCharge)) || Number(form.makingCharge) < 0))
      e.makingCharge = "Enter a valid charge.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async() => {
    if (validate()) {
      setSubmitted(true);
      
      try {
        const response = await axios.patch(`/api/edit-product/${product?._id}`, {
          name: form.name,
          description: form.description,
          weight: Number(form.weight),
          price: Number(form.price),
          stock: Number(form.stock),
          type: form.type,
          purity: form.purity,
          makingCharge: form.makingCharge ? Number(form.makingCharge) : undefined,
          huid: form.huid,
          hsn: form.hsn,
        });

        if(response.data.success){
          onSave?.(response.data.updatedProduct);
        } else {
          console.error("Failed to edit product:", response.data.message);
        }

      } catch (error: any) {
        console.error("Error saving product:", error);
      } finally {
        setSubmitted(false);
      }
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(false);
  };

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(14, 8, 4, 0.80)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-[680px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#FFFFFF" }}
      >
        {/* Gold-maroon top accent */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        {/* ── Modal Header ── */}
        <div className="flex-shrink-0 bg-[#FDF0F0] px-8 pt-6 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
            aria-label="Close"
          >
            <X size={19} strokeWidth={1.8} />
          </button>

          <p
            className="text-[#8B6914] tracking-[0.18em] uppercase mb-1.5"
            style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
          >
            Inventory Management
          </p>
          <h2
            className="text-[#2C1A0E]"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 400,
            }}
          >
            Edit Product
          </h2>
          <div className="mt-4 w-10 h-[2px] rounded-full bg-[#8B6914]" />
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar  px-8 py-7 flex flex-col gap-7 bg-white">

          {/* Section 1: Basic Information */}
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

              <FieldWrapper label="Description" error={errors.description}>
                <div className="flex items-start gap-2.5 bg-white border border-[#DDD0C4] rounded-md px-3.5 py-2.5 focus-within:border-[#8B6914] transition-colors duration-200">
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

          {/* Section 2: Classification */}
          <div>
            <SectionTitle>Classification</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Section 3: Pricing & Weight */}
          <div>
            <SectionTitle>Pricing & Weight</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              <FieldWrapper label="Weight (g)" required error={errors.weight}>
                <InputField
                  icon={<Weight size={15} strokeWidth={1.6} />}
                  placeholder="42.50"
                  value={form.weight}
                  onChange={(v) => set("weight", v)}
                  type="number"
                  hasError={!!errors.weight}
                />
              </FieldWrapper>

              <FieldWrapper label="Price (₹)" required error={errors.price}>
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="145000"
                  value={form.price}
                  onChange={(v) => set("price", v)}
                  type="number"
                  hasError={!!errors.price}
                />
              </FieldWrapper>

              <FieldWrapper label="Making Charge (₹)" error={errors.makingCharge}>
                <InputField
                  icon={<IndianRupee size={15} strokeWidth={1.6} />}
                  placeholder="14500"
                  value={form.makingCharge}
                  onChange={(v) => set("makingCharge", v)}
                  type="number"
                  hasError={!!errors.makingCharge}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* Section 4: Inventory & Certification */}
          <div>
            <SectionTitle>Inventory & Certification</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Stock Quantity" required error={errors.stock}>
                <InputField
                  icon={<Package size={15} strokeWidth={1.6} />}
                  placeholder="e.g. 5"
                  value={form.stock}
                  onChange={(v) => set("stock", v)}
                  type="number"
                  hasError={!!errors.stock}
                />
              </FieldWrapper>

              <FieldWrapper label="HUID (Hallmark Unique ID)" error={errors.huid}>
                <InputField
                  icon={<Hash size={15} strokeWidth={1.6} />}
                  placeholder="e.g. AB1234CD"
                  value={form.huid}
                  onChange={(v) => set("huid", v)}
                  hasError={!!errors.huid}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* Success Banner */}
          {submitted && (
            <div className="bg-[#F0FBF4] border border-[#4CAF50]/30 rounded-md px-4 py-3">
              <p className="text-[#2E7D32]" style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}>
                ✓ Product added successfully to your inventory.
              </p>
            </div>
          )}
        </div>

        {/* ── Sticky Footer Actions ── */}
        <div className="flex-shrink-0 bg-[#FAF6F1] border-t border-[#E8DDD4] px-8 py-5 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200"
            style={{ fontFamily: "'Georgia', serif", fontSize: "11px", fontWeight: 600 }}
          >
            Reset
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200 px-2"
              style={{ fontFamily: "'Georgia', serif", fontSize: "11px", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-[#6B1A1A] hover:bg-[#521414] text-white px-8 py-3.5 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 700 }}
            >
              Save Product
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}