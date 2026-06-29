// models/Purchase.ts

import mongoose, { Schema, Document, Types } from "mongoose";

interface IPurchaseItem {
  productId: Types.ObjectId;

  // 🔹 BASIC
  name: string;
  quantity: number;
  hsn: number;

  // 🔹 VALUE SPLIT (VERY IMPORTANT)
  metalValue: number;       // taxable @ 3%
  makingCharge: number;     // taxable @ 5%

  // 🔹 GST RATES
  gstRateMetal: number;     // usually 3
  gstRateMaking: number;    // usually 5

  // 🔹 GST AMOUNTS (SEPARATE TRACKING)
  metalGST: number;
  makingGST: number;

  // 🔹 FINAL TAX SPLIT
  cgst: number;
  sgst: number;
  igst: number;

  // 🔹 TOTAL TAXABLE
  totalTaxableValue: number;
}

export interface IPurchase extends Document {
  supplierGSTIN?: string;

  invoiceNumber: string;
  invoiceDate: Date;

  isGSTBill: boolean;

  // 🔥 GST META (IMPORTANT)
  placeOfSupply: string;
  isInterState: boolean;

  items: IPurchaseItem[];

  // 🔥 TOTALS (FOR RETURNS)
  totalTaxableValue: number;

  totalMetalGST: number;
  totalMakingGST: number;

  totalCGST: number;
  totalSGST: number;
  totalIGST: number;

  totalAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    supplierGSTIN: String,

    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },

    isGSTBill: { type: Boolean, default: true },

    // 🔥 GST META
    placeOfSupply: String,
    isInterState: Boolean,

    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },

        name: String,
        quantity: Number,
        hsn: Number,

        metalValue: Number,
        makingCharge: Number,

        gstRateMetal: Number,
        gstRateMaking: Number,

        metalGST: Number,
        makingGST: Number,

        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },

        totalTaxableValue: Number,
      },
    ],

    // 🔥 TOTALS
    totalTaxableValue: { type: Number, default: 0 },

    totalMetalGST: { type: Number, default: 0 },
    totalMakingGST: { type: Number, default: 0 },

    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },

    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔥 UNIQUE INVOICE (IMPORTANT FOR GST)
PurchaseSchema.index(
  { supplierGSTIN: 1, invoiceNumber: 1 },
  { unique: true }
);

export default mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);