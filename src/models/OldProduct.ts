import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IProduct extends Document {
  inVoiceNo: string;
  name: string;
  description: string;
  weight: number;
  price: number;
  quantity: number;
  type: "Gold" | "Silver" | "Other";
  purity: "18k" | "22k" | "24k" | "Other";
  huid: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema<IProduct>(
  {
    inVoiceNo: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number},
    type: { type: String, enum: ["Gold", "Silver", "Other"], required: true },
    purity: {
      type: String,
      enum: ["18k", "22k", "24k", "Other"],
      required: true,
    },
    huid: { type: String },
  },
  { timestamps: true },
);

const OldProductModel =
  (mongoose.models.OldProduct as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("OldProduct", ProductSchema);

export default OldProductModel;
