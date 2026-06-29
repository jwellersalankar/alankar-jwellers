// models/Order.ts

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrder extends Document {
  customerId: Types.ObjectId;

  // =========================
  // 🔥 PRODUCTS (GST SPLIT)
  // =========================
  products: {
  productId: Types.ObjectId;

  // Product Snapshot
  name: string;
  description?: string;

  weight: number;
  price: number;

  stock?: number;

  type: "Gold" | "Silver" | "Other";

  purity: "18k" | "22k" | "24k" | "Other";

  makingCharge: number;

  huid?: string;

  isHUID?: boolean;

  hsn: number;

  supplier?: Types.ObjectId;

  stockQuantity?: number;
  stockValue?: number;

  // Invoice Specific
  quantity: number;

  metalPrice: number;

  metalValue: number;
  makingValue: number;

  gstRateMetal: number;
  gstRateMaking: number;

  cgstMetal: number;
  sgstMetal: number;
  igstMetal: number;

  cgstMaking: number;
  sgstMaking: number;
  igstMaking: number;

  totalTaxable: number;
  totalGST: number;
}[];
  // =========================
  // 🔹 OLD FIELDS (BACKWARD)
  // =========================
  totalAmount: number;

  status: "Pending" | "Processing" | "Completed" | "Cancelled";

  grossWeight: number;
  customDuty: number;

  // 🔥 KEEP but now derived
  sgst: number;
  cgst: number;
  igst: number;

  gstOnMakingCharge: number; // only making GST total

  discount: number;
  totalPayableAmmount: number;

  invoiceNumber: string;
  invoiceUrl: string;

  oldProducts: {
    name: string;
    description: string;
    weight: number;
    price: number;
    quantity: number;
    type: "Gold" | "Silver" | "Other";
    purity: "18k" | "22k" | "24k" | "Other";
    huid: string;
  }[];

  // =========================
  // 🔥 GST META
  // =========================
  sellerGSTIN: string;
  placeOfSupply: string;
  isInterState: boolean;

  // 🔥 TOTAL GST SPLIT
  totalTaxableValue: number;

  totalMetalGST: number;
  totalMakingGST: number;

  totalCGST: number;
  totalSGST: number;
  totalIGST: number;

  type: "invoice" | "credit_note" | "debit_note";
  isReverseCharge: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },

    // =========================
    // 🔥 PRODUCTS
    // =========================
   products: [
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },

    // Product Snapshot
    name: String,
    description: String,

    weight: Number,
    price: Number,

    stock: Number,

    type: {
      type: String,
      enum: ["Gold", "Silver", "Other"],
    },

    purity: {
      type: String,
      enum: ["18k", "22k", "24k", "Other"],
    },

    makingCharge: Number,

    huid: String,

    isHUID: Boolean,

    hsn: Number,

    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    stockQuantity: Number,
    stockValue: Number,

    // Invoice Snapshot
    quantity: Number,

    metalPrice: Number,

    metalValue: Number,
    makingValue: Number,

    gstRateMetal: Number,
    gstRateMaking: Number,

    cgstMetal: Number,
    sgstMetal: Number,
    igstMetal: Number,

    cgstMaking: Number,
    sgstMaking: Number,
    igstMaking: Number,

    totalTaxable: Number,
    totalGST: Number,
  },
],

    // =========================
    // 🔹 OLD FIELDS
    // =========================
    totalAmount: Number,

    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },

    grossWeight: Number,
    customDuty: Number,

    cgst: Number,
    sgst: Number,
    igst: Number,

    gstOnMakingCharge: Number,

    discount: Number,
    totalPayableAmmount: Number,

    invoiceNumber: { type: String, required: true },
    invoiceUrl: String,

    oldProducts: [
      {
        name: String,
        description: String,
        weight: Number,
        price: Number,
        quantity: Number,
        type: String,
        purity: String,
        huid: String,
      },
    ],

    // =========================
    // 🔥 GST META
    // =========================
    sellerGSTIN: String,
    placeOfSupply: String,
    isInterState: Boolean,

    totalTaxableValue: Number,

    totalMetalGST: Number,
    totalMakingGST: Number,

    totalCGST: Number,
    totalSGST: Number,
    totalIGST: Number,

    type: {
      type: String,
      enum: ["invoice", "credit_note", "debit_note"],
      default: "invoice",
    },

    isReverseCharge: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

OrderSchema.index({
  invoiceNumber: 1,
});

OrderSchema.index({
  customerId: 1,
});

OrderSchema.index({
  createdAt: -1,
});

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);