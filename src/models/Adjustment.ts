// models/Adjustment.ts

import mongoose, {
  Schema,
  Document,
  Types,
} from "mongoose";

export interface IAdjustment
  extends Document {
  // =========================
  // REFERENCES
  // =========================

  orderId: Types.ObjectId;

  customerId: Types.ObjectId;

  // =========================
  // DOCUMENT DETAILS
  // =========================

  noteNumber: string;

  referenceInvoiceNumber: string;

  type:
    | "credit_note"
    | "debit_note";

  reason:
    | "return"
    | "price_increase"
    | "price_decrease"
    | "gst_correction";

  reasonDescription?: string;

  status:
    | "active"
    | "cancelled";

  pdfUrl?: string;

  // =========================
  // PRODUCTS
  // =========================

  products: {
    productId: Types.ObjectId;

    // Product Snapshot
    name: string;

    description?: string;

    weight: number;

    price: number;

    stock?: number;

    type:
      | "Gold"
      | "Silver"
      | "Other";

    purity:
      | "18k"
      | "22k"
      | "24k"
      | "Other";

    makingCharge: number;

    huid?: string;

    isHUID?: boolean;

    supplier?: Types.ObjectId;

    stockQuantity?: number;

    stockValue?: number;

    // Invoice Snapshot
    quantity: number;

    hsn: number;

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

    // Adjustment Audit
    originalAmount: number;

    adjustedAmount: number;

    adjustmentAmount: number;
  }[];

  // =========================
  // GST TOTALS
  // =========================

  totalTaxableValue: number;

  totalCGST: number;

  totalSGST: number;

  totalIGST: number;

  totalAmount: number;

  // =========================
  // GST SNAPSHOT
  // =========================

  sellerGSTIN: string;

  placeOfSupply: string;

  isInterState: boolean;

  // =========================
  // SETTLEMENT
  // =========================

  settlement: {
    mode:
      | "cash"
      | "upi"
      | "bank"
      | "adjusted"
      | "pending";

    settlementDate?: Date;

    reference?: string;
  };

  createdAt: Date;

  updatedAt: Date;
}

const AdjustmentSchema =
  new Schema<IAdjustment>(
    {
      // =========================
      // REFERENCES
      // =========================

      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
      },

      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true,
      },

      // =========================
      // DOCUMENT DETAILS
      // =========================

      noteNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      referenceInvoiceNumber: {
        type: String,
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "credit_note",
          "debit_note",
        ],
        required: true,
      },

      reason: {
        type: String,
        enum: [
          "return",
          "price_increase",
          "price_decrease",
          "gst_correction",
        ],
        required: true,
      },

      reasonDescription: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "active",
          "cancelled",
        ],
        default: "active",
      },

      pdfUrl: {
        type: String,
        default: "",
      },

      // =========================
      // PRODUCTS
      // =========================

      products: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
          },

          // Product Snapshot

          name: {
            type: String,
            required: true,
          },

          description: String,

          weight: Number,

          price: Number,

          stock: Number,

          type: {
            type: String,
            enum: [
              "Gold",
              "Silver",
              "Other",
            ],
          },

          purity: {
            type: String,
            enum: [
              "18k",
              "22k",
              "24k",
              "Other",
            ],
          },

          makingCharge: Number,

          huid: String,

          isHUID: Boolean,

          supplier: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
          },

          stockQuantity: Number,

          stockValue: Number,

          // Invoice Snapshot

          quantity: {
            type: Number,
            required: true,
          },

          hsn: Number,

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

          // Adjustment Audit

          originalAmount: {
            type: Number,
            default: 0,
          },

          adjustedAmount: {
            type: Number,
            default: 0,
          },

          adjustmentAmount: {
            type: Number,
            default: 0,
          },
        },
      ],

      // =========================
      // GST TOTALS
      // =========================

      totalTaxableValue: {
        type: Number,
        required: true,
        default: 0,
      },

      totalCGST: {
        type: Number,
        required: true,
        default: 0,
      },

      totalSGST: {
        type: Number,
        required: true,
        default: 0,
      },

      totalIGST: {
        type: Number,
        required: true,
        default: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
        default: 0,
      },

      // =========================
      // GST SNAPSHOT
      // =========================

      sellerGSTIN: {
        type: String,
        required: true,
      },

      placeOfSupply: {
        type: String,
        required: true,
      },

      isInterState: {
        type: Boolean,
        default: false,
      },

      // =========================
      // SETTLEMENT
      // =========================

      settlement: {
        mode: {
          type: String,
          enum: [
            "cash",
            "upi",
            "bank",
            "adjusted",
            "pending",
          ],
          default: "cash",
        },

        settlementDate: Date,

        reference: String,
      },
    },
    {
      timestamps: true,
    }
  );

// =========================
// INDEXES
// =========================

// =========================
// MODEL
// =========================

const AdjustmentModel =
  (mongoose.models
    .Adjustment as mongoose.Model<IAdjustment>) ||
  mongoose.model<IAdjustment>(
    "Adjustment",
    AdjustmentSchema
  );

export default AdjustmentModel;
