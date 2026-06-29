import mongoose, { Schema, Document, Model } from "mongoose";

/* ── Payment Subdocument ───────────────────────────── */

export interface IPayment {
  amount: number;

  // 🔥 Nature of entry
  type: "credit" | "debit";

  // 🔥 Why this entry happened
  reason: "advance" | "purchase" | "due_payment" | "adjustment";

  mode?: "cash" | "upi" | "card" | "bank";

  note?: string;

  billId?: string; // link to invoice (VERY important)

  date: Date;
}

const PaymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🔥 Transaction nature
    type: {
      type: String,
      enum: ["credit", "debit"], // credit = customer pays, debit = customer owes
      required: true,
    },

    // 🔥 Reason for transaction
    reason: {
      type: String,
      enum: ["advance", "purchase", "due_payment", "adjustment"],
      required: true,
    },

    mode: {
      type: String,
      enum: ["cash", "upi", "card", "bank"],
      default: "cash",
    },

    note: {
      type: String,
      default: "",
    },

    billId: {
      type: String, // link invoice if needed
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // keep _id so we can delete specific payment if needed
);

/* ── Customer Schema ───────────────────────────────── */

export interface ICustomer extends Document {
  name: string;
  phone: string;
  adress: string;
  dob: Date;
  anniversary: Date;
  dueAmount?: number;
  advanceAmount?: number;
  payments: IPayment[];
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    adress: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
    },
    anniversary: {
      type: Date,
    },

    // ✅ Fast-access balances
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ✅ Payment history
    payments: {
      type: [PaymentSchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

CustomerSchema.index({
  name: "text",
});

CustomerSchema.index({
  phone: 1,
});

CustomerSchema.index({
  email: 1,
});

/* ── Model Export (safe for Next.js hot reload) ────── */

const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

export default CustomerModel;