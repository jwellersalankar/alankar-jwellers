// models/Product.ts

import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IPRODUCTS extends Document {
  name: string;
  description?: string;
  weight: number;
  price: number;
  stock: number; // existing (we’ll keep it)
  type: "Gold" | "Silver" | "Other";
  purity: "18k" | "22k" | "24k" | "Other";
  makingCharge?: number;
  huid?: string;
  isHUID: boolean;
  hsn: number;
  supplier?: ObjectId;

  // 🔥 NEW FIELDS
  stockQuantity: number;
  stockValue: number;

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema<IPRODUCTS>(
  {
    name: { type: String, required: true },
    description: { type: String },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },

    // ⚠️ OLD FIELD (keep for compatibility)
    stock: { type: Number, required: true, default: 0 },

    type: {
      type: String,
      enum: ["Gold", "Silver", "Other"],
      required: true,
    },
    purity: {
      type: String,
      enum: ["18k", "22k", "24k", "Other"],
      required: true,
    },
    makingCharge: { type: Number },
    huid: {
      type: String,
      required: false,
      sparse: true, // 🔥 allows multiple null values
      unique: true, // 🔥 enforces uniqueness only when present
    },

    isHUID: {
      type: Boolean,
      default: false,
    },
    hsn: { type: Number, required: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },

    // ✅ NEW STOCK FIELDS
    stockQuantity: {
      type: Number,
      default: 0,
    },
    stockValue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const ProductModel =
  (mongoose.models.Product as mongoose.Model<IPRODUCTS>) ||
  mongoose.model<IPRODUCTS>("Product", ProductSchema);

export default ProductModel;
