// app/api/create-bill/route.ts

import dbconnect from "@/src/lib/dbconnect";
import Product from "@/src/models/Product";
import OrderModel from "@/src/models/Order";
import { uploadPDF } from "@/src/helper/uploadPdf";
import { addCustomer } from "@/src/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await dbconnect();

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const bodyString = formData.get("body") as string;

    if (!file || !bodyString) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400 },
      );
    }

    const body = JSON.parse(bodyString);

    const { customerDetails, items, billingDetails } = body;

    const {
      goldRatePer10g,
      silverRatePerKg,
      sellerGSTIN,
      placeOfSupply,
      isInterState,
      discount = 0,
      customDuty = 0,
      invoiceNumber,
      invoiceDate,
      metalGSTRate,
      makingGSTRate,
    } = billingDetails;

    // =========================
    // 🔹 CUSTOMER
    // =========================
    const customer = await addCustomer(customerDetails);

    if (!customer.success || !customer.data) {
      return new Response(JSON.stringify(customer), {
        status: customer.status,
      });
    }

    // customer gstin is optional, so we can use it if provided
    const customerGSTIN = customerDetails.customerGSTIN || undefined;

    // =========================
    // 🔹 PDF UPLOAD
    // =========================
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfUrl = (await uploadPDF(buffer)) as { secure_url: string };

    // =========================
    // 🔥 CALCULATION START
    // =========================
    let products: any[] = [];

    let totalTaxableValue = 0;

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    let totalMetalGST = 0;
    let totalMakingGST = 0;

    let grossWeight = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error("Product not found");

      const quantity = item.quantity;

      if (!quantity || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (item.makingCharge === undefined || item.makingCharge === null) {
        throw new Error("Making charge is required");
      }

      // =========================
      // 🔥 DYNAMIC METAL PRICE
      // =========================
      let metalPrice = 0;

      if (product.type === "Gold") {
        metalPrice =
          (product.purity === "18k"
            ? goldRatePer10g * 0.75
            : product.purity === "22k"
              ? goldRatePer10g * (22 / 24)
              : goldRatePer10g) *
          (product.weight / 10);
      } else if (product.type === "Silver") {
        metalPrice =
          (product.purity === "22k"
            ? silverRatePerKg * (22 / 24)
            : product.purity === "18k"
              ? silverRatePerKg * 0.75
              : silverRatePerKg) *
          (product.weight / 1000);
      } else {
        metalPrice = product.price || 0;
      }

      const makingCharge = item.makingCharge;

      const metalValue = metalPrice * quantity;
      const makingValue = makingCharge * quantity;

      const totalTaxable = metalValue + makingValue;

      // =========================
      // 🔥 GST CALCULATION
      // =========================
      const gstRateMetal = metalGSTRate ?? 0;
      const gstRateMaking = makingGSTRate ?? 0;

      const metalGST = (metalValue * gstRateMetal) / 100;
      const makingGST = (makingValue * gstRateMaking) / 100;

      let cgstMetal = 0,
        sgstMetal = 0,
        igstMetal = 0;

      let cgstMaking = 0,
        sgstMaking = 0,
        igstMaking = 0;

      if (isInterState) {
        igstMetal = metalGST;
        igstMaking = makingGST;
      } else {
        cgstMetal = metalGST / 2;
        sgstMetal = metalGST / 2;

        cgstMaking = makingGST / 2;
        sgstMaking = makingGST / 2;
      }

      const totalGST =
        cgstMetal +
        sgstMetal +
        igstMetal +
        cgstMaking +
        sgstMaking +
        igstMaking;

      // =========================
      // 🔹 PUSH PRODUCT
      // =========================
      products.push({
        productId: product._id,

        // Snapshot
        name: product.name,
        description: product.description,

        weight: product.weight,
        price: product.price,

        stock: product.stock,

        type: product.type,
        purity: product.purity,

        makingCharge,

        huid: product.huid,

        isHUID: product.isHUID,

        hsn: product.hsn,

        supplier: product.supplier,

        stockQuantity: product.stockQuantity,

        stockValue: product.stockValue,

        // Invoice Fields
        quantity,

        metalPrice,

        metalValue,
        makingValue,

        gstRateMetal,
        gstRateMaking,

        cgstMetal,
        sgstMetal,
        igstMetal,

        cgstMaking,
        sgstMaking,
        igstMaking,

        totalTaxable,
        totalGST,
      });
      // =========================
      // 🔹 TOTALS
      // =========================
      totalTaxableValue += totalTaxable;

      totalCGST += cgstMetal + cgstMaking;
      totalSGST += sgstMetal + sgstMaking;
      totalIGST += igstMetal + igstMaking;

      totalMetalGST += metalGST;
      totalMakingGST += makingGST;

      grossWeight += product.weight * quantity;
    }

    // =========================
    // 🔹 FINAL AMOUNT
    // =========================
    const totalAmount = totalTaxableValue + totalCGST + totalSGST + totalIGST;

    const totalPayableAmmount = totalAmount - discount;

    // =========================
    // 🔹 CREATE ORDER
    // =========================
    const order = await OrderModel.create({
      customerId: customer.data._id,

      products,

      totalTaxableValue,

      totalCGST,
      totalSGST,
      totalIGST,

      totalMetalGST,
      totalMakingGST,

      totalAmount,
      totalPayableAmmount,

      grossWeight,
      customDuty,

      // 🔹 backward compatibility
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
      gstOnMakingCharge: totalMakingGST,

      discount,

      sellerGSTIN,
      placeOfSupply: placeOfSupply ?? "10",
      isInterState,
      customerGSTIN: customerGSTIN ?? undefined,

      invoiceNumber,
      invoiceUrl: pdfUrl?.secure_url,

      status: "Completed",
    });

    if (!order) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to create order" }),
        { status: 500 },
      );
    }

    // decrease products stock quantity

    const operations = products.map((p) => ({
      updateOne: {
        filter: { _id: p.productId },
        update: {
          $inc: {
            stock: -p.quantity,
            stockQuantity: -p.quantity,
            stockValue: -p.metalValue,
          },
        },
      },
    }));

    await Product.bulkWrite(operations);
    return new Response(
      JSON.stringify({
        success: true,
        data: order,
        pdf: pdfUrl?.secure_url,
      }),
      { status: 201 },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to create bill",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}
