// app/api/add-product/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbconnect from "@/src/lib/dbconnect";
import Product from "@/src/models/Product";
import Purchase from "@/src/models/Purchase";

function validateBody(body: any) {
  if (!body.invoiceNumber) throw new Error("invoiceNumber required");
  if (!body.invoiceDate) throw new Error("invoiceDate required");
  if (body.isGSTBill === undefined) throw new Error("isGSTBill required");
  if (!body.item) throw new Error("item required");

  const i = body.item;

  if (!i.name) throw new Error("item.name required");
  if (i.weight === undefined) throw new Error("item.weight required");
  if (i.metalValue === undefined) throw new Error("item.metalValue required");
  if (i.makingCharge === undefined) throw new Error("item.makingCharge required");

  if (!i.type) throw new Error("item.type required");
  if (!i.purity) throw new Error("item.purity required");
  if (!i.hsn) throw new Error("item.hsn required");

  if (i.huid) {
    if (i.quantity && i.quantity !== 1)
      throw new Error("HUID quantity must be 1");
  } else {
    if (!i.quantity) throw new Error("quantity required");
  }
}

export async function POST(req: Request) {
  await dbconnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await req.json();
    validateBody(body);

    const {
      supplierGSTIN,
      invoiceNumber,
      invoiceDate,
      isGSTBill,
      item,
      placeOfSupply,
      isInterState,
      isReverseCharge = false,
    } = body;

    let product;

    // =========================
    // 🔹 HUID PRODUCT
    // =========================
    if (item.huid) {
      const exists = await Product.findOne({ huid: item.huid }).session(session);
      if (exists) throw new Error("Duplicate HUID");

      const created = await Product.create(
        [{
          name: item.name,
          description: item.description || "",
          weight: item.weight,
          price: item.metalValue,
          stock: 1,
          stockQuantity: 1,
          stockValue: item.metalValue + item.makingCharge,
          type: item.type,
          purity: item.purity,
          makingCharge: item.makingCharge,
          huid: item.huid,
          isHUID: true,
          hsn: item.hsn,
        }],
        { session }
      );

      product = created[0];
      item.quantity = 1;
    }

    // =========================
    // 🔹 NON-HUID PRODUCT
    // =========================
    else {
      // product = await Product.findOne({
      //   name: item.name,
      //   purity: item.purity,
      //   type: item.type,
      //   isHUID: false,
      // }).session(session);

      const created = await Product.create(
          [{
            name: item.name,
            description: item.description || "",
            weight: item.weight,
            price: item.metalValue,
            stock: item.quantity,
            stockQuantity: item.quantity,
            stockValue: (item.metalValue + item.makingCharge) * item.quantity,
            type: item.type,
            purity: item.purity,
            makingCharge: item.makingCharge,
            isHUID: false,
            hsn: item.hsn,
          }],
          { session }
        );
        product = created[0];

      const value = (item.metalValue + item.makingCharge) * item.quantity;

      // await Product.findByIdAndUpdate(
      //   product._id,
      //   {
      //     $inc: {
      //       stock: item.quantity,
      //       stockQuantity: item.quantity,
      //       stockValue: value,
      //     },
      //   },
      //   { session }
      // );
    }

    // =========================
    // 🔥 GST CALCULATION (CORRECT)
    // =========================
    const gstRateMetal = item.gstRateMetal ?? 0;
    const gstRateMaking = item.gstRateMaking ?? 0;

    const taxableMetal = item.metalValue * item.quantity;
    const taxableMaking = item.makingCharge * item.quantity;

    const metalGST = (taxableMetal * gstRateMetal) / 100;
    const makingGST = (taxableMaking * gstRateMaking) / 100;

    let igst = 0, cgst = 0, sgst = 0;

    if (isInterState) {
      igst = metalGST + makingGST;
    } else {
      cgst = (metalGST + makingGST) / 2;
      sgst = (metalGST + makingGST) / 2;
    }

    const totalTaxableValue = taxableMetal + taxableMaking;

    const purchaseItem = {
      productId: product._id,
      name: item.name,
      quantity: item.quantity,
      hsn: item.hsn,

      metalValue: item.metalValue,
      makingCharge: item.makingCharge,

      gstRateMetal,
      gstRateMaking,

      metalGST,
      makingGST,

      cgst,
      sgst,
      igst,

      totalTaxableValue,
    };

    // =========================
    // 🔹 UPSERT PURCHASE
    // =========================
    const purchase = await Purchase.findOneAndUpdate(
      {
        supplierGSTIN: supplierGSTIN || null,
        invoiceNumber,
      },
      {
        $setOnInsert: {
          invoiceDate: new Date(invoiceDate),
          isGSTBill,
          placeOfSupply,
          isInterState,
          isReverseCharge,
        },
        $push: { items: purchaseItem },
      },
      { upsert: true, new: true, session }
    );

    // =========================
    // 🔥 UPDATE TOTALS (IMPORTANT)
    // =========================
    purchase.totalTaxableValue += totalTaxableValue;

    purchase.totalMetalGST += metalGST;
    purchase.totalMakingGST += makingGST;

    purchase.totalCGST += cgst;
    purchase.totalSGST += sgst;
    purchase.totalIGST += igst;

    purchase.totalAmount =
      purchase.totalTaxableValue +
      purchase.totalCGST +
      purchase.totalSGST +
      purchase.totalIGST;

    await purchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      product,
      purchase,
    });

  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}