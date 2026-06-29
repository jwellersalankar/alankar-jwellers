"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface DeleteProductAlertProps {
  productName?: string;
  productId?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// ── Alert Dialog ───────────────────────────────────────
function DeleteAlertDialog({
  productName,
  productId,
  onConfirm,
  onCancel,
}: DeleteProductAlertProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(14, 8, 4, 0.82)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div
        className="relative w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#FFFFFF" }}
      >
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#8B2020] via-[#C0392B] to-[#8B2020]" />

        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#9E8A7E] hover:text-[#5C3D2E] transition-colors duration-200"
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.8} />
        </button>

        {/* ── Header band ── */}
        <div className="bg-[#FDF0F0] px-8 pt-7 pb-6">
          {/* Warning icon circle */}
          <div className="w-14 h-14 rounded-full bg-[#FADADD] flex items-center justify-center mb-5">
            <AlertTriangle size={26} strokeWidth={1.6} className="text-[#8B2020]" />
          </div>

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
              fontSize: "22px",
              fontWeight: 400,
            }}
          >
            Delete Product
          </h2>
          <div className="mt-4 w-10 h-[2px] rounded-full bg-[#8B2020]" />
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-7 flex flex-col gap-5">

          {/* Message */}
          <p
            className="text-[#5C4A3A] leading-[1.75]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "14px" }}
          >
            Are you sure you want to permanently remove this product from your
            inventory? This action{" "}
            <span className="text-[#8B2020] font-semibold">cannot be undone</span>.
          </p>

          {/* Product info card */}
          {(productName || productId) && (
            <div className="bg-[#FAF6F1] border border-[#E8DDD4] rounded-lg px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-[#FADADD] flex items-center justify-center flex-shrink-0">
                <Trash2 size={17} strokeWidth={1.6} className="text-[#8B2020]" />
              </div>
              <div>
                {productName && (
                  <p
                    className="text-[#2C1A0E]"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "14px", fontWeight: 600 }}
                  >
                    {productName}
                  </p>
                )}
                {productId && (
                  <p
                    className="text-[#9E8A7E]"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "12px" }}
                  >
                    {productId}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning note */}
          <div className="flex items-start gap-2.5 bg-[#FFF8E7] border border-[#F5CC5A]/40 rounded-md px-4 py-3">
            <AlertTriangle size={14} strokeWidth={1.8} className="text-[#8B6914] flex-shrink-0 mt-0.5" />
            <p
              className="text-[#7A5C00] leading-[1.6]"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px" }}
            >
              All associated billing records and inventory logs will be
              permanently affected.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 bg-[#FAF6F1] hover:bg-[#F0E8E0] border border-[#DDD0C4] text-[#5C4A3A] py-3.5 rounded-md tracking-[0.12em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 bg-[#8B2020] hover:bg-[#6B1A1A] text-white py-3.5 rounded-md tracking-[0.12em] uppercase transition-colors duration-200"
              style={{ fontFamily: "'Georgia', serif", fontSize: "12px", fontWeight: 700 }}
            >
              <Trash2 size={14} strokeWidth={2} />
              Delete Product
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Demo Trigger Component ─────────────────────────────
export default function DeleteProductAlert({
  productName = "Maharaja Filigree Necklace",
  productId = "#GN-1131",
  onConfirm,
  onCancel,
}: DeleteProductAlertProps) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    setDeleted(true);
    onConfirm?.();
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        onClick={() => { setOpen(true); setDeleted(false); }}
        aria-label="Delete product"
        className="text-[#C0392B] hover:text-[#96281B] transition-colors duration-150"
      >
        <Trash2 size={20} strokeWidth={1.6} />
      </button>

      {/* Deleted confirmation inline */}
      {deleted && (
        <p
          className="mt-3 text-[#2E7D32]"
          style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
        >
          ✓ Product removed from inventory.
        </p>
      )}

      {/* ── Modal ── */}
      {open && (
        <DeleteAlertDialog
          productName={productName}
          productId={productId}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}