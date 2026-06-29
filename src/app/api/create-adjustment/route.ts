// app/api/create-adjustment/route.ts

import dbconnect from "@/src/lib/dbconnect";
import OrderModel from "@/src/models/Order";
import AdjustmentModel from "@/src/models/Adjustment";
import Product from "@/src/models/Product";
import mongoose from "mongoose";
import { uploadPDF } from "@/src/helper/uploadPdf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await dbconnect();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const formData = await req.formData();

const bodyString = formData.get("body") as string;
const file = formData.get("file") as File | null;

if (!file || !bodyString) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400 },
      );
    }

const body = JSON.parse(bodyString);

    const {
      orderId,
      type,
      reason,
      reasonDescription,
      products: adjustmentProducts,
      settlementMode,
      noteNumber,
    } = body;

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    if (!noteNumber) {
      throw new Error("Note number is required");
    }

    const order = await OrderModel.findById(orderId).session(
      session
    );

    if (!order) {
      throw new Error("Invoice not found");
    }

     // =========================
        // 🔹 PDF UPLOAD
        // =========================
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
    
        const pdfUrl = (await uploadPDF(buffer)) as { secure_url: string };

    let products: any[] = [];

    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalAmount = 0;

    for (const adjustmentItem of adjustmentProducts) {
      const invoiceProduct = order.products.find(
        (p: any) =>
          p.productId.toString() ===
          adjustmentItem.productId
      );

      if (!invoiceProduct) {
        throw new Error(
          `Product ${adjustmentItem.productId} not found in invoice`
        );
      }

      const quantity = Number(
        adjustmentItem.quantity || 0
      );

      if (quantity <= 0) {
        throw new Error(
          `Invalid quantity for ${invoiceProduct.name}`
        );
      }

      if (
        quantity >
        Number(invoiceProduct.quantity)
      ) {
        throw new Error(
          `Adjustment quantity cannot exceed sold quantity for ${invoiceProduct.name}`
        );
      }

      // ==================================
      // RETURN VALIDATION
      // ==================================

      if (reason === "return") {
        const previousReturns =
          await AdjustmentModel.aggregate([
            {
              $match: {
                orderId: order._id,
                reason: "return",
              },
            },
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.productId":
                  invoiceProduct.productId,
              },
            },
            {
              $group: {
                _id: null,
                qty: {
                  $sum:
                    "$products.quantity",
                },
              },
            },
          ]).session(session);

        const alreadyReturned =
          previousReturns?.[0]?.qty || 0;

        if (
          alreadyReturned + quantity >
          invoiceProduct.quantity
        ) {
          throw new Error(
            `${invoiceProduct.name} return quantity exceeds sold quantity`
          );
        }
      }

      // ==================================
      // ORIGINAL VALUES
      // ==================================

      const originalMetalValue =
        (invoiceProduct.metalValue /
          invoiceProduct.quantity) *
        quantity;

      const originalMakingValue =
        (invoiceProduct.makingValue /
          invoiceProduct.quantity) *
        quantity;

      const originalTaxable =
        originalMetalValue +
        originalMakingValue;

      // ==================================
      // ADJUSTED VALUES
      // ==================================

      const adjustedMetalPrice =
        adjustmentItem.adjustedMetalPrice ??
        invoiceProduct.metalPrice;

      const adjustedMakingCharge =
        adjustmentItem.adjustedMakingCharge ??
        invoiceProduct.makingCharge;

      const adjustedMetalValue =
        adjustedMetalPrice * quantity;

      const adjustedMakingValue =
        adjustedMakingCharge * quantity;

      const adjustedTaxable =
        adjustedMetalValue +
        adjustedMakingValue;

      let taxableDifference = 0;

      switch (reason) {
        case "return":
          taxableDifference =
            -originalTaxable;
          break;

        case "price_decrease":
        case "price_increase":
        case "gst_correction":
        default:
          taxableDifference =
            adjustedTaxable -
            originalTaxable;
      }

      let metalDifference = 0;

        switch (reason) {
          case "return":
            metalDifference =
              -originalMetalValue;
            break;

          case "price_decrease":
          case "price_increase":
          case "gst_correction":
          default:
            metalDifference =
              adjustedMetalValue -
              originalMetalValue;
        }

      let makingDifference = 0;
        switch (reason) {
          case "return":
            makingDifference =
              -originalMakingValue;
            break;

            case "price_decrease":
            case "price_increase":
            case "gst_correction":
            default:
              makingDifference =
                adjustedMakingValue -
                originalMakingValue;
        }

      // ==================================
      // GST DIFFERENCE
      // ==================================

      const metalGSTDifference =
        (metalDifference *
          invoiceProduct.gstRateMetal) /
        100;

      const makingGSTDifference =
        (makingDifference *
          invoiceProduct.gstRateMaking) /
        100;

      const totalGSTDifference =
        metalGSTDifference +
        makingGSTDifference;

    const igstMetalDifference =
        order.isInterState
          ? metalGSTDifference
          : 0;

    const igstMakingDifference =
        order.isInterState
          ? makingGSTDifference
          : 0;

      let cgstDifference = 0;
      let sgstDifference = 0;
      let igstDifference = 0;

      if (order.isInterState) {
        igstDifference =
          totalGSTDifference;
      } else {
        cgstDifference =
          totalGSTDifference / 2;

        sgstDifference =
          totalGSTDifference / 2;
      }

      const lineTotal =
        taxableDifference +
        totalGSTDifference;

      // ==================================
      // INVENTORY UPDATE
      // ==================================

      if (reason === "return") {
        await Product.findByIdAndUpdate(
          invoiceProduct.productId,
          {
            $inc: {
              stockQuantity: quantity,
              stock: quantity,
            },
          },
          { session }
        );
      }

      // ==================================
      // SAVE PRODUCT SNAPSHOT
      // ==================================

      products.push({
        productId:
          invoiceProduct.productId,

        name:
          invoiceProduct.name,

        description:
          invoiceProduct.description,

        weight:
          invoiceProduct.weight,

        price:
          invoiceProduct.price,

        stock:
          invoiceProduct.stock,

        type:
          invoiceProduct.type,

        purity:
          invoiceProduct.purity,

        makingCharge:
          adjustedMakingCharge,

        huid:
          invoiceProduct.huid,

        isHUID:
          invoiceProduct.isHUID,

        supplier:
          invoiceProduct.supplier,

        stockQuantity:
          invoiceProduct.stockQuantity,

        stockValue:
          invoiceProduct.stockValue,

        quantity,

        hsn:
          invoiceProduct.hsn,

        metalPrice:
          adjustedMetalPrice,

        metalValue:
          adjustedMetalValue,

        makingValue:
          adjustedMakingValue,

        gstRateMetal:
          invoiceProduct.gstRateMetal,

        gstRateMaking:
          invoiceProduct.gstRateMaking,

        cgstMetal:
          metalGSTDifference / 2,

        sgstMetal:
          metalGSTDifference / 2,

        igstMetal:
          igstMetalDifference,

        cgstMaking:
          makingGSTDifference / 2,

        sgstMaking:
          makingGSTDifference / 2,

        igstMaking:
          igstMakingDifference,

        totalTaxable:
          taxableDifference,

        totalGST:
          totalGSTDifference,

        originalAmount:
          originalTaxable,

        adjustedAmount:
          adjustedTaxable,

        adjustmentAmount:
          taxableDifference,
      });

      totalTaxableValue +=
        taxableDifference;

      totalCGST +=
        cgstDifference;

      totalSGST +=
        sgstDifference;

      totalIGST +=
        igstDifference;

      totalAmount += lineTotal;
    }

    const adjustment =
      await AdjustmentModel.create(
        [
          {
            orderId: order._id,

            customerId:
              order.customerId,

            noteNumber,

            referenceInvoiceNumber:
              order.invoiceNumber,

            type,

            reason,

            reasonDescription,

            status: "active",
            pdfUrl: pdfUrl?.secure_url,

            products,

            totalTaxableValue,

            totalCGST,

            totalSGST,

            totalIGST,

            totalAmount,

            sellerGSTIN:
              order.sellerGSTIN,

            placeOfSupply:
              order.placeOfSupply,

            isInterState:
              order.isInterState,

            settlement: {
              mode:
                settlementMode ??
                "cash",
            },
          },
        ],
        { session }
      );

    await session.commitTransaction();

    return Response.json(
      {
        success: true,
        message:
          type === "credit_note"
            ? "Credit Note Created Successfully"
            : "Debit Note Created Successfully",

        data: adjustment[0],
        pdf: pdfUrl?.secure_url,
      },
      { status: 201 }
    );
  } catch (error: any) {
    await session.abortTransaction();

    return Response.json(
      {
        success: false,
        message:
          "Failed to create adjustment",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}