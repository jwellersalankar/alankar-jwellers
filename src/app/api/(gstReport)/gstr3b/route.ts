// app/api/gstr3b/route.ts

import { NextResponse } from "next/server";
import dbconnect from "@/src/lib/dbconnect";
import Order from "@/src/models/Order";
import Purchase from "@/src/models/Purchase";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);
    const gstin = searchParams.get("gstin");
    const from = new Date(searchParams.get("from")!);
    const to = new Date(searchParams.get("to")!);

    // =========================
    // 🔹 SALES (OUTWARD)
    // =========================
    const sales = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, type: "invoice" } },
      {
        $group: {
          _id: null,
          taxable: { $sum: "$totalTaxableValue" },
          igst: { $sum: "$totalIGST" },
          cgst: { $sum: "$totalCGST" },
          sgst: { $sum: "$totalSGST" },
        },
      },
    ]);

    // =========================
    // 🔹 PURCHASE (ITC)
    // =========================
    const purchase = await Purchase.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, isGSTBill: true } },
      {
        $group: {
          _id: null,
          taxable: { $sum: "$totalTaxableValue" },
          igst: { $sum: "$totalIGST" },
          cgst: { $sum: "$totalCGST" },
          sgst: { $sum: "$totalSGST" },
        },
      },
    ]);

    const outward = sales[0] || { taxable: 0, igst: 0, cgst: 0, sgst: 0 };
    const inward = purchase[0] || { taxable: 0, igst: 0, cgst: 0, sgst: 0 };

    // =========================
    // 🔹 NET TAX
    // =========================
    const netIGST = outward.igst - inward.igst;
    const netCGST = outward.cgst - inward.cgst;
    const netSGST = outward.sgst - inward.sgst;

    // =========================
    // 🔥 GST PORTAL JSON FORMAT
    // =========================
    const gstr3bJSON = {
      gstin: gstin ?? "",
      ret_period: `${from.getMonth() + 1}${from.getFullYear()}`,

      outward_supplies: {
        taxable_value: outward.taxable,
        igst: outward.igst,
        cgst: outward.cgst,
        sgst: outward.sgst,
      },

      inward_supplies: {
        taxable_value: inward.taxable,
        igst: inward.igst,
        cgst: inward.cgst,
        sgst: inward.sgst,
      },

      itc: {
        igst: inward.igst,
        cgst: inward.cgst,
        sgst: inward.sgst,
      },

      net_tax: {
        igst: netIGST,
        cgst: netCGST,
        sgst: netSGST,
      },
    };

    // =========================
    // 📊 EXCEL GENERATION
    // =========================
    const data = [
      ["Type", "Taxable", "IGST", "CGST", "SGST"],
      ["Outward", outward.taxable, outward.igst, outward.cgst, outward.sgst],
      ["Inward", inward.taxable, inward.igst, inward.cgst, inward.sgst],
      ["Net", "", netIGST, netCGST, netSGST],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "GSTR-3B");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // =========================
    // 📦 ZIP FILE
    // =========================
    const zip = new JSZip();

    zip.file("gstr3b.json", JSON.stringify(gstr3bJSON, null, 2));
    zip.file("gstr3b.xlsx", excelBuffer);

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // const arrayBuffer = Buffer.from(zipBuffer);

    // const zipBlob = new Blob([arrayBuffer], { type: "application/zip" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=gstr3b.zip",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}
