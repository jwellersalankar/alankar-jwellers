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
  Wallet,
  Receipt,
  FileText,
} from "lucide-react";
import type { ICustomer, IPayment } from "@/src/models/Customer";
import axios from "axios";

type CustomerForm = {
  name: string;
  phone: string;
  adress: string;
  dob: string;
  anniversary: string;
};

type PaymentForm = {
  amount: string;
  type: IPayment["type"];
  reason: IPayment["reason"];
  mode: NonNullable<IPayment["mode"]>;
  note: string;
  billId: string;
};

type FieldError = Partial<Record<keyof CustomerForm | keyof PaymentForm, string>>;

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  adress: "",
  dob: "",
  anniversary: "",
};

const EMPTY_PAYMENT: PaymentForm = {
  amount: "",
  type: "credit",
  reason: "due_payment",
  mode: "cash",
  note: "",
  billId: "",
};

const toInputDate = (date?: Date | string) => {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

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
  readOnly,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hasError?: boolean;
  min?: string;
  readOnly?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-white border rounded-md px-3.5 py-2.5 transition-colors duration-200 ${
        hasError
          ? "border-[#C0392B]"
          : "border-[#DDD0C4] focus-within:border-[#8B6914]"
      } ${readOnly ? "opacity-75" : ""}`}
    >
      <span className="text-[#B8A898] flex-shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        readOnly={readOnly}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none"
        style={{ fontFamily: "'Georgia', serif" }}
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
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none resize-none"
        style={{ fontFamily: "'Georgia', serif", lineHeight: "1.65" }}
      />
    </div>
  );
}

function SelectField({
  icon,
  value,
  onChange,
  children,
  hasError,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  hasError?: boolean;
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[#3D2B1F] text-[13px] focus:outline-none"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {children}
      </select>
    </div>
  );
}

interface EditCustomerModalProps {
  onClose?: () => void;
  onSave?: (data: ICustomer) => void;
  customer: ICustomer | null;
}

export default function EditCustomerModal({
  onClose,
  onSave,
  customer,
}: EditCustomerModalProps) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [payment, setPayment] = useState<PaymentForm>(EMPTY_PAYMENT);
  const [addPayment, setAddPayment] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!customer) {
      setForm(EMPTY_FORM);
      setPayment(EMPTY_PAYMENT);
      setAddPayment(false);
      return;
    }

    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      adress: customer.adress ?? "",
      dob: toInputDate(customer.dob),
      anniversary: toInputDate(customer.anniversary),
    });
  }, [customer]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const setCustomerField = (key: keyof CustomerForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  };

  const setPaymentField = (key: keyof PaymentForm, val: string) => {
    setPayment((prev) => ({ ...prev, [key]: val }) as PaymentForm);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
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

    if (addPayment) {
      if (!payment.amount.trim()) {
        e.amount = "Payment amount is required.";
      } else if (isNaN(Number(payment.amount)) || Number(payment.amount) <= 0) {
        e.amount = "Enter a valid payment amount.";
      }

      if (!payment.type) e.type = "Select payment type.";
      if (!payment.reason) e.reason = "Select payment reason.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        customerId: (customer as any)?._id?.toString(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.adress.trim(),
        dob: form.dob || undefined,
        anniversary: form.anniversary || undefined,
        ...(addPayment && {
          payment: {
            amount: Number(payment.amount),
            type: payment.type,
            reason: payment.reason,
            mode: payment.mode,
            note: payment.note.trim(),
            billId: payment.billId.trim(),
          },
        }),
      };

      const response = await axios.patch("/api/edit-customer", payload);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setSaved(true);
      setPayment(EMPTY_PAYMENT);
      setAddPayment(false);
      onSave?.(response.data.data);
    } catch (error: any) {
      console.error("Error Editing Customer:", error.message);
    } finally {
      setSaving(false);
    }
  };

  const dueAmount = Number(customer?.dueAmount ?? 0);
  const advanceAmount = Number(customer?.advanceAmount ?? 0);
  const currentBalance = advanceAmount - dueAmount;
  const paymentAmount = Number(payment.amount) || 0;
  const projectedBalance = addPayment
    ? currentBalance + (payment.type === "credit" ? paymentAmount : -paymentAmount)
    : currentBalance;
  const projectedDue = projectedBalance < 0 ? Math.abs(projectedBalance) : 0;
  const projectedAdvance = projectedBalance > 0 ? projectedBalance : 0;

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
            Edit Existing Customer
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
                  onChange={(v) => setCustomerField("name", v)}
                  hasError={!!errors.name}
                />
              </FieldWrapper>

              <FieldWrapper label="Phone Number" required error={errors.phone}>
                <InputField
                  icon={<Phone size={15} strokeWidth={1.6} />}
                  placeholder="+91 98300 12345"
                  value={form.phone}
                  onChange={(v) => setCustomerField("phone", v)}
                  type="tel"
                  hasError={!!errors.phone}
                />
              </FieldWrapper>

              <FieldWrapper label="Address" required error={errors.adress}>
                <TextAreaField
                  icon={<MapPin size={15} strokeWidth={1.6} />}
                  placeholder="W-45, Vaishali Nagar, Jaipur - 302021"
                  value={form.adress}
                  onChange={(v) => setCustomerField("adress", v)}
                  hasError={!!errors.adress}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <SectionTitle>Important Dates</SectionTitle>
            <div className="flex flex-wrap gap-4">
              <FieldWrapper label="Date of Birth" error={errors.dob}>
                <InputField
                  icon={<Calendar size={15} strokeWidth={1.6} />}
                  placeholder="DD / MM / YYYY"
                  value={form.dob}
                  onChange={(v) => setCustomerField("dob", v)}
                  type="date"
                  hasError={!!errors.dob}
                />
              </FieldWrapper>

              <FieldWrapper label="Anniversary" error={errors.anniversary}>
                <InputField
                  icon={<Heart size={15} strokeWidth={1.6} />}
                  placeholder="DD / MM / YYYY"
                  value={form.anniversary}
                  onChange={(v) => setCustomerField("anniversary", v)}
                  type="date"
                  hasError={!!errors.anniversary}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <p
                className="text-[#8B6914] tracking-[0.16em] uppercase whitespace-nowrap"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                Financial Details
              </p>
              <div className="flex-1 h-px bg-[#DDD0C4]" />
              <button
                type="button"
                onClick={() => setAddPayment((prev) => !prev)}
                className="flex items-center gap-2 bg-[#FDF3DC] hover:bg-[#F5E8B0] border border-[#E8D080] text-[#7A5C00] px-3 py-2 rounded-md tracking-[0.12em] uppercase transition-colors duration-200"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                <Plus size={13} strokeWidth={1.8} />
                {addPayment ? "Remove Entry" : "Add Entry"}
              </button>
            </div>

            <div
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)",
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
                  Current Balance
                </p>
                <p
                  className="text-[#4A3000]"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  ₹{(dueAmount - advanceAmount).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex gap-6">
                <div className="text-right">
                  <p
                    className="text-[#9E8A7E] tracking-[0.08em] uppercase"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "9px" }}
                  >
                    Due
                  </p>
                  <p
                    className="text-[#8B2020]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    ₹{dueAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[#9E8A7E] tracking-[0.08em] uppercase"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "9px" }}
                  >
                    Advance
                  </p>
                  <p
                    className="text-[#1A6B3A]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    ₹{advanceAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {addPayment && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap gap-4">
                  <FieldWrapper label="Amount (₹)" required error={errors.amount}>
                    <InputField
                      icon={<IndianRupee size={15} strokeWidth={1.6} />}
                      placeholder="e.g. 25000"
                      value={payment.amount}
                      onChange={(v) => setPaymentField("amount", v)}
                      type="number"
                      min="1"
                      hasError={!!errors.amount}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Type" required error={errors.type}>
                    <SelectField
                      icon={<Wallet size={15} strokeWidth={1.6} />}
                      value={payment.type}
                      onChange={(v) => setPaymentField("type", v)}
                      hasError={!!errors.type}
                    >
                      <option value="credit">Credit - customer pays</option>
                      <option value="debit">Debit - customer owes</option>
                    </SelectField>
                  </FieldWrapper>
                </div>

                <div className="flex flex-wrap gap-4">
                  <FieldWrapper label="Reason" required error={errors.reason}>
                    <SelectField
                      icon={<Receipt size={15} strokeWidth={1.6} />}
                      value={payment.reason}
                      onChange={(v) => setPaymentField("reason", v)}
                      hasError={!!errors.reason}
                    >
                      <option value="advance">Advance</option>
                      <option value="purchase">Purchase</option>
                      <option value="due_payment">Due Payment</option>
                      <option value="adjustment">Adjustment</option>
                    </SelectField>
                  </FieldWrapper>

                  <FieldWrapper label="Mode">
                    <SelectField
                      icon={<Wallet size={15} strokeWidth={1.6} />}
                      value={payment.mode}
                      onChange={(v) => setPaymentField("mode", v)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank</option>
                    </SelectField>
                  </FieldWrapper>
                </div>

                <FieldWrapper label="Bill ID">
                  <InputField
                    icon={<FileText size={15} strokeWidth={1.6} />}
                    placeholder="Invoice or bill reference"
                    value={payment.billId}
                    onChange={(v) => setPaymentField("billId", v)}
                  />
                </FieldWrapper>

                <FieldWrapper label="Note">
                  <TextAreaField
                    icon={<FileText size={15} strokeWidth={1.6} />}
                    placeholder="Optional note for this ledger entry"
                    value={payment.note}
                    onChange={(v) => setPaymentField("note", v)}
                  />
                </FieldWrapper>

                <div
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{
                    background: "#F9F5EF",
                    border: "1px solid #E8DDD4",
                  }}
                >
                  <p
                    className="text-[#7A5C00] tracking-[0.1em] uppercase"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    Projected Balance
                  </p>
                  <div className="flex gap-6">
                    <p
                      className="text-[#8B2020]"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Due ₹{projectedDue.toLocaleString("en-IN")}
                    </p>
                    <p
                      className="text-[#1A6B3A]"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Advance ₹{projectedAdvance.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {saved && (
            <div className="bg-[#F0FBF4] border border-[#4CAF50]/30 rounded-md px-4 py-3">
              <p
                className="text-[#2E7D32]"
                style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
              >
                Customer edited successfully to your records.
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-[#FAF6F1] border-t border-[#E8DDD4] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center justify-between w-full gap-4">
            <button
              onClick={onClose}
              className="text-[#9E8A7E] hover:text-[#5C3D2E] tracking-[0.12em] uppercase transition-colors duration-200 px-2"
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
              {saving ? "Saving..." : "Edit Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
