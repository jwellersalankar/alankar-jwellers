// app/api/gstr1/route.ts

import { NextResponse } from "next/server";
import dbconnect from "@/src/lib/dbconnect";
import Order from "@/src/models/Order";
import Adjustment from "@/src/models/Adjustment";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const gstin = searchParams.get("gstin");
    const from = new Date(searchParams.get("from")!);
    const to = new Date(searchParams.get("to")!);

    const match = {
      createdAt: { $gte: from, $lte: to },
    };

    // =========================
    // 🔹 B2B
    // =========================
    // const b2b = await Order.aggregate([
    //   { $match: { ...match, type: "invoice", sellerGSTIN: { $exists: true } } },
    //   { $unwind: "$products" },
    //   {
    //     $group: {
    //       _id: "$invoiceNumber",
    //       taxableValue: { $sum: "$products.totalTaxable" },
    //       igst: {
    //         $sum: { $add: ["$products.igstMetal", "$products.igstMaking"] },
    //       },
    //       cgst: {
    //         $sum: { $add: ["$products.cgstMetal", "$products.cgstMaking"] },
    //       },
    //       sgst: {
    //         $sum: { $add: ["$products.sgstMetal", "$products.sgstMaking"] },
    //       },
    //     },
    //   },
    // ]);

    // =========================
    // 🔹 B2CS
    // =========================
    const b2cs = await Order.aggregate([
      { $match: { ...match, type: "invoice", totalAmount: { $lt: 250000 } } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$placeOfSupply",
          taxableValue: { $sum: "$products.totalTaxable" },
          igst: {
            $sum: { $add: ["$products.igstMetal", "$products.igstMaking"] },
          },
          cgst: {
            $sum: { $add: ["$products.cgstMetal", "$products.cgstMaking"] },
          },
          sgst: {
            $sum: { $add: ["$products.sgstMetal", "$products.sgstMaking"] },
          },
        },
      },
    ]);

    // =========================
    // 🔹 B2CL
    // =========================
    const b2cl = await Order.aggregate([
      {
        $match: {
          ...match,
          type: "invoice",
          totalAmount: { $gte: 250000 },
          isInterState: true,
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$invoiceNumber",
          taxableValue: { $sum: "$products.totalTaxable" },
          igst: {
            $sum: { $add: ["$products.igstMetal", "$products.igstMaking"] },
          },
        },
      },
    ]);

    // =========================
    // 🔹 CDN
    // =========================
    // const cdnr = await Adjustment.aggregate([
    //   {
    //     $match: {
    //       createdAt: {
    //         $gte: from,
    //         $lte: to,
    //       },
    //     },
    //   },

    //   {
    //     $unwind: "$products",
    //   },

    //   {
    //     $group: {
    //       _id: {
    //         noteNumber: "$noteNumber",
    //         type: "$type",
    //       },

    //       noteNumber: {
    //         $first: "$noteNumber",
    //       },

    //       referenceInvoiceNumber: {
    //         $first: "$referenceInvoiceNumber",
    //       },

    //       noteType: {
    //         $first: "$type",
    //       },

    //       taxableValue: {
    //         $sum: "$products.totalTaxable",
    //       },

    //       igst: {
    //         $sum: {
    //           $add: ["$products.igstMetal", "$products.igstMaking"],
    //         },
    //       },

    //       cgst: {
    //         $sum: {
    //           $add: ["$products.cgstMetal", "$products.cgstMaking"],
    //         },
    //       },

    //       sgst: {
    //         $sum: {
    //           $add: ["$products.sgstMetal", "$products.sgstMaking"],
    //         },
    //       },
    //     },
    //   },
    // ]);

    const cdnur = await Adjustment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: from,
            $lte: to,
          },
        },
      },

      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },

      {
        $unwind: "$customer",
      },

      {
        $match: {
          $or: [
            {
              "customer.gstin": {
                $exists: false,
              },
            },
            {
              "customer.gstin": "",
            },
          ],
        },
      },

      {
        $unwind: "$products",
      },

      {
        $group: {
          _id: "$noteNumber",

          noteNumber: {
            $first: "$noteNumber",
          },

          taxableValue: {
            $sum: "$products.totalTaxable",
          },

          igst: {
            $sum: {
              $add: ["$products.igstMetal", "$products.igstMaking"],
            },
          },

          cgst: {
            $sum: {
              $add: ["$products.cgstMetal", "$products.cgstMaking"],
            },
          },

          sgst: {
            $sum: {
              $add: ["$products.sgstMetal", "$products.sgstMaking"],
            },
          },
        },
      },
    ]);

    // =========================
    // 🔹 HSN
    // =========================
    const invoiceHSN = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.hsn",

          description: {
            $first: "$products.name",
          },

          quantity: {
            "$sum": "1",
          },

          taxableValue: {
            $sum: "$products.totalTaxable",
          },

          igst: {
            $sum: {
              $add: ["$products.igstMetal", "$products.igstMaking"],
            },
          },

          cgst: {
            $sum: {
              $add: ["$products.cgstMetal", "$products.cgstMaking"],
            },
          },

          sgst: {
            $sum: {
              $add: ["$products.sgstMetal", "$products.sgstMaking"],
            },
          },
        },
      },
    ]);

    const adjustmentHSN = await Adjustment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: from,
            $lte: to,
          },
        },
      },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.hsn",

          quantity: {
            $sum: "$products.quantity",
          },

          taxableValue: {
            $sum: "$products.totalTaxable",
          },

          igst: {
            $sum: {
              $add: ["$products.igstMetal", "$products.igstMaking"],
            },
          },

          cgst: {
            $sum: {
              $add: ["$products.cgstMetal", "$products.cgstMaking"],
            },
          },

          sgst: {
            $sum: {
              $add: ["$products.sgstMetal", "$products.sgstMaking"],
            },
          },
        },
      },
    ]);

    const hsnMap = new Map();

    [...invoiceHSN, ...adjustmentHSN].forEach((row) => {
      const key = row._id;

      if (!hsnMap.has(key)) {
        hsnMap.set(key, {
          ...row,
        });
      } else {
        const existing = hsnMap.get(key);

        existing.quantity += row.quantity || 0;

        existing.taxableValue += row.taxableValue || 0;

        existing.igst += row.igst || 0;

        existing.cgst += row.cgst || 0;

        existing.sgst += row.sgst || 0;
      }
    });

    const hsn = Array.from(hsnMap.values());

    const docsIssued = {
      invoices: await Order.countDocuments({
        createdAt: {
          $gte: from,
          $lte: to,
        },
      }),

      creditNotes: await Adjustment.countDocuments({
        type: "credit_note",

        createdAt: {
          $gte: from,
          $lte: to,
        },
      }),

      debitNotes: await Adjustment.countDocuments({
        type: "debit_note",

        createdAt: {
          $gte: from,
          $lte: to,
        },
      }),
    };

    // =========================
    // 🔥 GST PORTAL JSON
    // =========================
    const gstr1JSON = {
      gstin: gstin ?? "",

      fp: `${from.getMonth() + 1}${from.getFullYear()}`,

     // b2b,

      b2cs,

      b2cl,

     // cdnr,

      cdnur,

      hsn,

      docsIssued,
    };

    // =========================
    // 📊 EXCEL GENERATION
    // =========================
    const wb = XLSX.utils.book_new();

    const createSheet = (name: string, data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    //createSheet("B2B", b2b);
   // createSheet("B2B", b2b);
    createSheet("B2CS", b2cs);
    createSheet("B2CL", b2cl);

  //  createSheet("CDNR", cdnr);
    createSheet("CDNUR", cdnur);

    createSheet("HSN", hsn);

    createSheet("DOCS_ISSUED", [docsIssued]);

    const excelBuffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx",
    });

    // =========================
    // 📦 ZIP
    // =========================
    const zip = new JSZip();

    zip.file("gstr1.json", JSON.stringify(gstr1JSON, null, 2));
    zip.file("gstr1.xlsx", excelBuffer);

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // const arrayBuffer = Buffer.from(zipBuffer);

    // const zipBlob = new Blob([arrayBuffer], { type: "application/zip" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=gstr1.zip",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
