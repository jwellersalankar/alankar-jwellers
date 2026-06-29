import mongoose, { Schema, Document } from "mongoose";

export interface ISHOP extends Document {
  name: string;
  gstin: string;
  address: string;
  contactNumber: string;
  email: string;
  accountNumber: string;
  ifscCode: string;
  termsAndConditions: string;
  goldRatePer10g: number;
  silverRatePerKg: number;
  stateCode?: string;
  customDuty: number;
  gstOnMetal: number;
  gstOnMakingCharge: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema: Schema = new Schema<ISHOP>(
  {
    name: { type: String, required: true },
    gstin: { type: String, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    accountNumber: { type: String },
    ifscCode: { type: String },
    termsAndConditions: { type: String },
    goldRatePer10g: { type: Number, required: true },
    silverRatePerKg: { type: Number, required: true },
    customDuty: { type: Number, required: true },
    gstOnMetal: { type: Number, required: true },
    gstOnMakingCharge: { type: Number, required: true },
  },
  { timestamps: true },
);

const ShopModel =
  (mongoose.models.SHOP as mongoose.Model<ISHOP>) ||
  mongoose.model<ISHOP>("SHOP", ShopSchema);

export default ShopModel;
