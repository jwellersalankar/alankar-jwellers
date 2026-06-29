"use client";

import Footer from "@/src/components/core/Footer";
import NavBar from "@/src/components/core/NavBar";
import AddCustomerModal from "@/src/components/CRM/AddCustomer";
import EditCustomer from "@/src/components/CRM/EditCustomer";
import WishingPopup from "@/src/components/CRM/WishingPopup";
import UserManagement from "@/src/components/ui/UserManagement";
import type { ICustomer, IPayment } from "@/src/models/Customer";
import {
  MessageSquare,
  Landmark,
  PartyPopper,
  ChevronRight,
  PhoneOutgoing,
  Plus,
  Search,
  SquarePen,
  Loader,
  Eye,
  X,
  IndianRupee,
  Wallet,
  Receipt,
  FileText,
  Trash2,
} from "lucide-react";
import type { User } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CLEAR_PAYMENTS_API = "/api/clear-payments";

type PaymentEntry = Omit<IPayment, "date"> & {
  _id?: string | { toString: () => string };
  date?: Date | string;
};

type LedgerPaymentForm = {
  amount: string;
  type: IPayment["type"];
  reason: IPayment["reason"];
  mode: NonNullable<IPayment["mode"]>;
  note: string;
  billId: string;
};

type PaymentFieldError = Partial<Record<keyof LedgerPaymentForm, string>>;

const EMPTY_PAYMENT: LedgerPaymentForm = {
  amount: "",
  type: "credit",
  reason: "due_payment",
  mode: "cash",
  note: "",
  billId: "",
};

// Helpers
const fmt = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");

const formatDate = (date?: Date | string) => {
  if (!date) return "Today";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Today";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const titleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

// Status Badge
function StatusBadge({ status }: { status: "OVERDUE" | "ADVANCE" }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] ${
        status === "OVERDUE"
          ? "bg-[#FADADD] text-[#8B1A1A]"
          : "bg-[#FDF3DC] text-[#8B6914]"
      }`}
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {status}
    </span>
  );
}

// Section Label
function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-[#8B6914]">{icon}</span>
      <p
        className="text-[#8B6914] tracking-[0.18em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
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

function LedgerInput({
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
        min={min}
        className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[13px] focus:outline-none min-w-0"
        style={{ fontFamily: "'Georgia', serif" }}
      />
    </div>
  );
}

function LedgerTextArea({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-white border border-[#DDD0C4] focus-within:border-[#8B6914] rounded-md px-3.5 py-2.5 transition-colors duration-200">
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

function LedgerSelect({
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
        className="flex-1 bg-transparent text-[#3D2B1F] text-[13px] focus:outline-none min-w-0"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {children}
      </select>
    </div>
  );
}

function PaymentsHistoryPopup({
  customer,
  onClose,
  onCustomerUpdated,
}: {
  customer: ICustomer | null;
  onClose: () => void;
  onCustomerUpdated: (data: ICustomer) => void;
}) {
  const [addEntry, setAddEntry] = useState(false);
  const [payment, setPayment] = useState<LedgerPaymentForm>(EMPTY_PAYMENT);
  const [errors, setErrors] = useState<PaymentFieldError>({});
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!customer) return null;

  const payments = ([...(customer.payments || [])] as PaymentEntry[]).sort(
    (a, b) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const dueAmount = Number(customer.dueAmount ?? 0);
  const advanceAmount = Number(customer.advanceAmount ?? 0);
  const balance = dueAmount - advanceAmount;

  const setPaymentField = (key: keyof LedgerPaymentForm, val: string) => {
    setPayment((prev) => ({ ...prev, [key]: val }) as LedgerPaymentForm);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setMessage("");
    setMessageType("success");
  };

  const validatePayment = () => {
    const nextErrors: PaymentFieldError = {};

    if (!payment.amount.trim()) {
      nextErrors.amount = "Payment amount is required.";
    } else if (isNaN(Number(payment.amount)) || Number(payment.amount) <= 0) {
      nextErrors.amount = "Enter a valid payment amount.";
    }

    if (!payment.type) nextErrors.type = "Select payment type.";
    if (!payment.reason) nextErrors.reason = "Select payment reason.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddEntry = async () => {
    if (!validatePayment()) return;

    setSaving(true);
    setMessage("");
    setMessageType("success");

    try {
      const response = await fetch("/api/edit-customer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: (customer as any)._id?.toString(),
          name: customer.name,
          phone: customer.phone,
          address: customer.adress,
          dob: customer.dob,
          anniversary: customer.anniversary,
          payment: {
            amount: Number(payment.amount),
            type: payment.type,
            reason: payment.reason,
            mode: payment.mode,
            note: payment.note.trim(),
            billId: payment.billId.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add payment entry");
      }

      onCustomerUpdated(data.data);
      setPayment(EMPTY_PAYMENT);
      setAddEntry(false);
      setMessageType("success");
      setMessage("Payment entry added successfully.");
    } catch (error: any) {
      setMessageType("error");
      setMessage(error.message || "Failed to add payment entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearPayments = async () => {
  if (payments.length === 0) return;

  setClearing(true);
  setMessage("");
  setMessageType("success");

  try {
    const response = await fetch(
      `${CLEAR_PAYMENTS_API}?phone=${encodeURIComponent(customer.phone)}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to clear payment history");
    }

    onCustomerUpdated({
      ...(customer as any),
      payments: [],
      dueAmount: 0,
      advanceAmount: 0,
    } as ICustomer);

    setAddEntry(false);
    setShowClearConfirm(false);
    setPayment(EMPTY_PAYMENT);
    setMessageType("success");
    setMessage("All payment history cleared successfully.");
  } catch (error: any) {
    setMessageType("error");
    setMessage(error.message || "Failed to clear payment history.");
  } finally {
    setClearing(false);
  }
};


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{
        background: "rgba(14, 8, 4, 0.82)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[820px] max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white">
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

        <div className="flex-shrink-0 bg-[#FDF0F0] px-5 sm:px-8 pt-6 pb-5 relative">
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
            Payment Ledger
          </p>

          <h2
            className="text-[#2C1A0E] pr-8"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 400,
            }}
          >
            {customer.name}
          </h2>

          <p
            className="mt-1 text-[#9E8A7E]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "12px" }}
          >
            {customer.phone}
          </p>

          <div className="mt-4 w-10 h-[2px] rounded-full bg-[#8B6914]" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 flex flex-col gap-6 bg-white">
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)",
              border: "1px solid #E8D080",
            }}
          >
            <div>
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
                className={balance > 0 ? "text-[#8B2020]" : "text-[#1A6B3A]"}
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {fmt(Math.abs(balance))}
              </p>
            </div>

            <div className="flex flex-wrap gap-5 sm:justify-end">
              <div>
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
                  {fmt(dueAmount)}
                </p>
              </div>
              <div>
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
                  {fmt(advanceAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p
              className="text-[#8B6914] tracking-[0.16em] uppercase whitespace-nowrap"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              Payment History
            </p>
            <div className="flex-1 h-px bg-[#DDD0C4]" />
            <button
              type="button"
              onClick={() => setAddEntry((prev) => !prev)}
              className="flex items-center gap-2 bg-[#FDF3DC] hover:bg-[#F5E8B0] border border-[#E8D080] text-[#7A5C00] px-3 py-2 rounded-md tracking-[0.12em] uppercase transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              <Plus size={13} strokeWidth={1.8} />
              {addEntry ? "Close Entry" : "Add Entry"}
            </button>
          </div>

          {addEntry && (
            <div
              className="flex flex-col gap-4 rounded-lg p-4"
              style={{ background: "#FAF6F1", border: "1px solid #E8DDD4" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Amount (₹)" required error={errors.amount}>
                  <LedgerInput
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
                  <LedgerSelect
                    icon={<Wallet size={15} strokeWidth={1.6} />}
                    value={payment.type}
                    onChange={(v) => setPaymentField("type", v)}
                    hasError={!!errors.type}
                  >
                    <option value="credit">Credit - customer pays</option>
                    <option value="debit">Debit - customer owes</option>
                  </LedgerSelect>
                </FieldWrapper>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Reason" required error={errors.reason}>
                  <LedgerSelect
                    icon={<Receipt size={15} strokeWidth={1.6} />}
                    value={payment.reason}
                    onChange={(v) => setPaymentField("reason", v)}
                    hasError={!!errors.reason}
                  >
                    <option value="advance">Advance</option>
                    <option value="purchase">Purchase</option>
                    <option value="due_payment">Due Payment</option>
                    <option value="adjustment">Adjustment</option>
                  </LedgerSelect>
                </FieldWrapper>

                <FieldWrapper label="Mode">
                  <LedgerSelect
                    icon={<Wallet size={15} strokeWidth={1.6} />}
                    value={payment.mode}
                    onChange={(v) => setPaymentField("mode", v)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                  </LedgerSelect>
                </FieldWrapper>
              </div>

              <FieldWrapper label="Bill ID">
                <LedgerInput
                  icon={<FileText size={15} strokeWidth={1.6} />}
                  placeholder="Invoice or bill reference"
                  value={payment.billId}
                  onChange={(v) => setPaymentField("billId", v)}
                />
              </FieldWrapper>

              <FieldWrapper label="Note">
                <LedgerTextArea
                  icon={<FileText size={15} strokeWidth={1.6} />}
                  placeholder="Optional note for this ledger entry"
                  value={payment.note}
                  onChange={(v) => setPaymentField("note", v)}
                />
              </FieldWrapper>

              <div className="flex justify-end">
                <button
                  onClick={handleAddEntry}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#6B1A1A] hover:bg-[#521414] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          )}

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

          <div className="flex flex-col gap-3">
            {payments.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-[#9E8A7E] border border-[#E8DDD4] rounded-lg bg-[#FAF6F1]">
                No payment history found
              </div>
            ) : (
              payments.map((entry, index) => {
                const id = entry._id?.toString() || `${entry.date}-${index}`;
                const isCredit = entry.type === "credit";

                return (
                  <div
                    key={id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 rounded-lg border border-[#E8DDD4] bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.12em] ${
                            isCredit
                              ? "bg-[#E9F8EF] text-[#1A6B3A]"
                              : "bg-[#FADADD] text-[#8B1A1A]"
                          }`}
                          style={{ fontFamily: "'Georgia', serif" }}
                        >
                          {entry.type.toUpperCase()}
                        </span>
                        <span
                          className="text-[#8B6914] tracking-[0.1em] uppercase"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          {titleCase(entry.reason)}
                        </span>
                      </div>

                      <p
                        className="text-[#3D2B1F]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {formatDate(entry.date)}
                        {entry.mode ? ` - ${titleCase(entry.mode)}` : ""}
                        {entry.billId ? ` - Bill ${entry.billId}` : ""}
                      </p>

                      {entry.note && (
                        <p
                          className="text-[#9E8A7E] mt-1 break-words"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontSize: "12px",
                            lineHeight: "1.6",
                          }}
                        >
                          {entry.note}
                        </p>
                      )}
                    </div>

                    <p
                      className={`sm:text-right ${
                        isCredit ? "text-[#1A6B3A]" : "text-[#8B2020]"
                      }`}
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "15px",
                        fontWeight: 700,
                      }}
                    >
                      {isCredit ? "+" : "-"}
                      {fmt(entry.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-[#FAF6F1] border-t border-[#E8DDD4] px-5 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={payments.length === 0 || clearing}
            className="flex items-center justify-center gap-2 text-[#8B2020] hover:text-[#5C1414] disabled:opacity-50 disabled:cursor-not-allowed tracking-[0.12em] uppercase transition-colors duration-200 px-2 py-2"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
            {clearing ? "Clearing..." : "Clear All Payments"}
          </button>

          <button
            onClick={onClose}
            className="bg-[#6B1A1A] hover:bg-[#521414] text-white px-8 py-3 rounded-md tracking-[0.16em] uppercase transition-colors duration-200"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
      </div>
      {showClearConfirm && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
    style={{ background: "rgba(14, 8, 4, 0.55)", backdropFilter: "blur(2px)" }}
    onClick={(e) =>
      e.target === e.currentTarget && !clearing && setShowClearConfirm(false)
    }
  >
    <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl bg-white">
      <div className="h-1 bg-gradient-to-r from-[#8B2020] via-[#C9A84C] to-[#8B2020]" />

      <div className="bg-[#FDF0F0] px-6 pt-5 pb-4 relative">
        <button
          onClick={() => setShowClearConfirm(false)}
          disabled={clearing}
          className="absolute top-4 right-4 text-[#9E8A7E] hover:text-[#5C3D2E] disabled:opacity-50"
        >
          <X size={18} strokeWidth={1.8} />
        </button>

        <p className="text-[#8B6914] tracking-[0.18em] uppercase mb-1.5"
          style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}>
          Confirm Action
        </p>

        <h3 className="text-[#2C1A0E] pr-8"
          style={{ fontFamily: "'Georgia', serif", fontSize: "20px", fontWeight: 400 }}>
          Clear Payment History
        </h3>
      </div>

      <div className="px-6 py-5 bg-white text-[#5C3D2E]"
        style={{ fontFamily: "'Georgia', serif", fontSize: "13px", lineHeight: "1.7" }}>
        This will clear all payment entries for {customer.name} and reset due and advance amounts to zero.
      </div>

      <div className="bg-[#FAF6F1] border-t border-[#E8DDD4] px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
        <button onClick={() => setShowClearConfirm(false)} disabled={clearing}
          className="text-[#9E8A7E] hover:text-[#5C3D2E] disabled:opacity-50 tracking-[0.12em] uppercase">
          Cancel
        </button>

        <button onClick={handleClearPayments} disabled={clearing}
          className="flex items-center justify-center gap-2 bg-[#6B1A1A] hover:bg-[#521414] disabled:opacity-60 text-white px-6 py-3 rounded-md tracking-[0.16em] uppercase">
          <Trash2 size={14} strokeWidth={1.8} />
          {clearing ? "Clearing..." : "Clear Payments"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

// Main Component
function CRMMainSection() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [isPaymentsModelOpen, setIsPaymentsModelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<ICustomer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<ICustomer | null>(
    null
  );
  const [openWishing, setOpenWishing] = useState(false);
  const [isExitModelOpen, setIsExitModelOpen] = useState(false);
  const [allExistingCustomers, setAllExistingCustomers] = useState<ICustomer[]>(
    []
  );
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [searchExisting, setSearchExisting] = useState("");

  // Swipe
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();

  const { data: session, status } = useSession();

  useEffect(() => {
    console.log(session);

    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/sign-in");
      return;
    }

    if (status === "authenticated") {
      setUser(session.user as User);
    }

    if (status === "authenticated" && session.user?.verified === false) {
      router.replace("/");
    }

    if (
      status === "authenticated" &&
      session.user?.verified === true &&
      session.user?.role != "owner"
    ) {
      router.back();
    }
  }, [status, session]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/get-customers?search=${search}`)
      .then((res) => res.json())
      .then((data) => setCustomers(data.data || []))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    setLoadingExisting(true);

    const fetchExistingCustomers = async () => {
      try {
        const res = await fetch(`/api/get-all-customer?search=${searchExisting}`);
        const data = await res.json();

        setAllExistingCustomers(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error(err);
        setAllExistingCustomers([]);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingCustomers();
  }, [searchExisting]);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    (e.currentTarget as any).startX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    const startX = (e.currentTarget as any).startX;
    if (!startX) return;

    const diff = startX - e.touches[0].clientX;
    if (diff > 50) setSwipedId(id);
    if (diff < -50) setSwipedId(null);
  };

  const openPayments = (customer: ICustomer) => {
    setPaymentCustomer(customer);
    setIsPaymentsModelOpen(true);
  };

  const handleAddCustomer = (data: ICustomer) => {
    setCustomers((prev) => [data, ...prev]);
    setIsAddModelOpen(false);
  };

  const handleEditCustomer = (data: ICustomer) => {
    handleCustomerUpdated(data);
    setIsEditModelOpen(false);
  };

  const handleCustomerUpdated = (data: ICustomer) => {
    setCustomers((prev) =>
      prev.map((c) => (c._id?.toString() === data._id?.toString() ? data : c))
    );
    setAllExistingCustomers((prev) =>
      prev.map((c) => (c._id?.toString() === data._id?.toString() ? data : c))
    );
    setSelectedCustomer((prev) =>
      prev?._id?.toString() === data._id?.toString() ? data : prev
    );
    setPaymentCustomer((prev) =>
      prev?._id?.toString() === data._id?.toString() ? data : prev
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF8F7] px-6 md:px-12 lg:px-16 pt-12 pb-24">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-[#8B2020] mb-2"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(26px, 3.5vw, 40px)",
            fontWeight: 700,
          }}
        >
          Customer Relations
        </h1>
      </div>

      {/* WhatsApp Section */}
      <SectionLabel
        icon={<MessageSquare size={15} />}
        label="WhatsApp Marketing"
      />

      <div
        onClick={() => setOpenWishing(true)}
        className="bg-[#FFF0F1] rounded-xl px-5 py-5 flex items-center gap-4 cursor-pointer hover:bg-[#F5EDE4] transition"
      >
        <PartyPopper className="text-[#8B6914]" />
        <div className="flex-1">
          <p className="text-[#2C1A0E] font-bold">Automated Greetings</p>
          <p className="text-[#9E8A7E] text-xs uppercase">
            Anniversaries & Birthdays
          </p>
        </div>
        <ChevronRight className="text-[#9E8A7E]" />
      </div>

      {/* Dues & Payments Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-4 mb-5">
        <SectionLabel
          icon={<Landmark size={15} strokeWidth={2} />}
          label="Dues & Payments"
        />

        <div className="flex flex-wrap items-center gap-3 lg:gap-5">
          <span
            className="bg-[#F5CC5A] text-[#5C3D00] px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.08em]"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {customers.length} PENDING
          </span>

          <button
            onClick={() => setIsAddModelOpen(true)}
            className="flex items-center gap-2 bg-[#8B2020] hover:bg-[#6E1A1A] text-white px-4 py-2.5 rounded-md transition"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            <Plus size={14} />
            Add New
          </button>

          <button
            onClick={() => setIsExitModelOpen(!isExitModelOpen)}
            className="flex items-center gap-2 bg-[#8B2020] hover:bg-[#6E1A1A] text-white px-4 py-2.5 rounded-md transition"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            <Plus size={14} />
            Add Existing
          </button>
        </div>
      </div>

      {/* Existing Customer Dropdown */}
      {isExitModelOpen && (
        <div className="mb-5 bg-[#FAF6F1] border border-[#EADFCF] rounded-md shadow-sm p-3">
          <div className="flex items-center gap-2 border-b border-[#EADFCF] pb-2 mb-2">
            <Search size={14} className="text-[#b8a898]" />
            <input
              value={searchExisting}
              onChange={(e) => setSearchExisting(e.target.value)}
              placeholder="Search existing customers..."
              className="w-full outline-none text-sm bg-transparent text-[#3D2B1F] placeholder:text-[#b8a898]"
              style={{ fontFamily: "'Georgia', serif" }}
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loadingExisting ? (
              <div className="flex justify-center py-4">
                <Loader className="animate-spin text-[#9E8A7E]" size={18} />
              </div>
            ) : allExistingCustomers.length === 0 ? (
              <p className="text-sm text-[#9E8A7E] text-center py-3">
                No customers found
              </p>
            ) : (
              allExistingCustomers.map((p: ICustomer) => (
                <div
                  key={p._id.toString()}
                  onClick={() => {
                    setCustomers((prev) => [p, ...prev]);
                    setIsExitModelOpen(false);
                  }}
                  className="px-3 py-2 hover:bg-[#FFF0F1] rounded cursor-pointer transition"
                >
                  <p
                    className="text-[#2C1A0E]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {p.name}
                  </p>
                  <p className="text-xs text-[#9E8A7E]">{p.phone}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-[#F9EAEB] rounded-lg px-5 py-4 flex items-center gap-3 mt-6 mb-5 border border-[#E8DDD4]">
        <Search size={16} className="text-[#9E8A7E]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="flex-1 bg-transparent outline-none text-[#3D2B1F]"
        />
      </div>

      {/* Table/Card */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-5 px-7 bg-[#F9EAEB] py-4 border-b sticky top-0 z-10">
          {["Client Name", "Balance", "Status", "Communicate", "Actions"].map(
            (h) => (
              <p
                key={h}
                className="text-[#9E8A7E] text-center text-[10px] uppercase tracking-wider font-bold"
              >
                {h}
              </p>
            )
          )}
        </div>

        {loading ? (
          <div className="h-52 flex items-center justify-center">
            <Loader className="animate-spin text-[#9E8A7E]" />
          </div>
        ) : customers.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-[#9E8A7E]">
            No customers found
          </div>
        ) : (
          customers.map((entry) => {
            const balance = Math.abs(
              (entry.dueAmount ?? 0) - (entry.advanceAmount ?? 0)
            );
            const status =
              (entry.dueAmount ?? 0) - (entry.advanceAmount ?? 0) > 0
                ? "OVERDUE"
                : "ADVANCE";

            return (
              <div key={entry._id.toString()}>
                {/* Mobile Card */}
                <div
                  className="lg:hidden bg-white border-b px-5 py-4 relative overflow-hidden"
                  onTouchStart={(e) =>
                    handleTouchStart(e, entry._id.toString())
                  }
                  onTouchMove={(e) => handleTouchMove(e, entry._id.toString())}
                >
                  <p className="text-[#4A1A1A] font-bold">{entry.name}</p>
                  <p className="text-xs text-[#9E8A7E]">{entry.phone}</p>

                  <div className="flex justify-between mt-3">
                    <p className="text-[#3D2B1F] font-semibold">
                      {fmt(balance)}
                    </p>
                    <StatusBadge status={status} />
                  </div>

                  <button
                    onClick={() => openPayments(entry)}
                    className="mt-4 flex w-full items-center justify-center gap-2 bg-[#FDF3DC] hover:bg-[#F5E8B0] border border-[#E8D080] text-[#7A5C00] px-4 py-2.5 rounded-md tracking-[0.12em] uppercase transition"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    <Eye size={14} />
                    View Payments
                  </button>

                  {/* Swipe Actions */}
                  <div
                    className={`absolute inset-y-0 right-0 flex items-center gap-4 pr-4 bg-white transition-transform ${
                      swipedId === entry._id.toString()
                        ? "translate-x-0"
                        : "translate-x-full"
                    }`}
                  >
                    <a href={`tel:${entry.phone}`}>
                      <PhoneOutgoing className="text-[#8B6914]" />
                    </a>
                    <a href={`https://wa.me/${entry.phone}`}>
                      <img
                        src="https://cdn.simpleicons.org/WhatsApp/25D366"
                        width={20}
                        alt="WhatsApp"
                      />
                    </a>
                    <button onClick={() => openPayments(entry)}>
                      <Eye className="text-[#8B6914]" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(entry);
                        setIsEditModelOpen(true);
                      }}
                    >
                      <SquarePen className="text-[#5BB8D4]" />
                    </button>
                  </div>
                </div>

                {/* Desktop Row */}
                <div className="hidden lg:grid grid-cols-5 px-7 py-5 border-b hover:bg-[#F5EDE4]">
                  <p className="text-center text-[#4A1A1A] font-bold">
                    {entry.name}
                  </p>
                  <p className="text-center text-[#3D2B1F]">{fmt(balance)}</p>
                  <div className="flex justify-center">
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex justify-center gap-4 text-[#8B6914]">
                    <a href={`tel:${entry.phone}`}>
                      <PhoneOutgoing />
                    </a>
                    <a href={`https://wa.me/${entry.phone}`}>
                      <img
                        src="https://cdn.simpleicons.org/WhatsApp/25D366"
                        width={20}
                        alt="WhatsApp"
                      />
                    </a>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => openPayments(entry)}
                      className="flex items-center gap-2 bg-[#FDF3DC] hover:bg-[#F5E8B0] border border-[#E8D080] text-[#7A5C00] px-3 py-2 rounded-md tracking-[0.1em] uppercase transition"
                      style={{
                        fontFamily: "'Georgia', serif",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      <Eye size={14} />
                      View Payments
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(entry);
                        setIsEditModelOpen(true);
                      }}
                    >
                      <SquarePen className="text-[#5BB8D4]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {isAddModelOpen && (
        <AddCustomerModal
          onClose={() => setIsAddModelOpen(false)}
          onSave={handleAddCustomer}
        />
      )}

      {isEditModelOpen && (
        <EditCustomer
          onClose={() => setIsEditModelOpen(false)}
          onSave={handleEditCustomer}
          customer={selectedCustomer}
        />
      )}

      {isPaymentsModelOpen && (
        <PaymentsHistoryPopup
          onClose={() => setIsPaymentsModelOpen(false)}
          onCustomerUpdated={handleCustomerUpdated}
          customer={paymentCustomer}
        />
      )}

      {openWishing && <WishingPopup onClose={() => setOpenWishing(false)} />}
    </div>
  );
}

export default function CRMSection() {
  return (
    <main>
      <NavBar />
      <CRMMainSection />
      <UserManagement />
      <Footer />
    </main>
  );
}
