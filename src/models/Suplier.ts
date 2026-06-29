import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface ISuplier extends Document {
    name: string;
    contactNumber: string;
    email: string;
    address: string;
    productsSupplied: ObjectId[];
    totalAmountOwed: number;
    advancePayment: number;
    balanceAmount: number;
    payments: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ISuplierPayment extends Document {
    suplier: ObjectId;
    amount: number;
    paymentDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SuplierPaymentSchema: Schema = new Schema<ISuplierPayment>(
    {
        suplier: { type: Schema.Types.ObjectId, ref: "Suplier", required: true },
        amount: { type: Number, required: true },
        paymentDate: { type: Date, required: true },
    },
    { timestamps: true }
);
const SuplierPaymentModel = (mongoose.models.SuplierPayment as mongoose.Model<ISuplierPayment>) || mongoose.model<ISuplierPayment>("SuplierPayment", SuplierPaymentSchema);

export { SuplierPaymentModel };

const SuplierSchema: Schema = new Schema<ISuplier>(
    {
        name: { type: String, required: true },
        contactNumber: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
        productsSupplied: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        totalAmountOwed: { type: Number, default: 0 },
        advancePayment: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },
        payments: [{ type: Schema.Types.ObjectId, ref: "SuplierPayment" }],
    },
    { timestamps: true }
);

const SuplierModel = (mongoose.models.Suplier as mongoose.Model<ISuplier>) || mongoose.model<ISuplier>("Suplier", SuplierSchema);

export default SuplierModel;