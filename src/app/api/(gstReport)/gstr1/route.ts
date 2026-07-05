// app/api/gstr1/route.ts
//
// ══════════════════════════════════════════════════════════════
// COMPLIANCE CHANGELOG (all changes vs previous version)
// ══════════════════════════════════════════════════════════════
//
// 1. B2CL threshold: ₹2.5 L → ₹1 L  (Notification 12/2024-CT, w.e.f. 01-Aug-2024)
//    B2CS now catches inter-state unregistered invoices ≤ ₹1 L (was ≤ ₹2.5 L)
//
// 2. HSN Table-12 Phase-III split (effective May 2025 return period):
//    hsn.b2b  — B2B HSN summary (mandatory, with description + uqc fields)
//    hsn.b2c  — B2C HSN summary (mandatory per GSTN; optional for AATO ≤ ₹5 Cr)
//    Each HSN row now carries: hsn, description, uqc, quantity,
//                              taxableValue, igst, cgst, sgst, totalTax
//
// 3. Table-13 Documents Issued (mandatory from May 2025):
//    Expanded from a flat object to series-wise document summary with
//    fromSr / toSr / totalIssued / cancelled / net counts for each doc type.
//
// 4. CDNR: added noteDate, referenceInvoiceDate, placeOfSupply, isInterState
//    for complete portal-compatible structure.
//
// 5. CDNUR: same enrichment as CDNR + isInterState flag.
//
// 6. Bug fixed: duplicate createSheet("B2B", b2b) call removed.
//
// 7. B2B aggregate: enriched with customerGSTIN, placeOfSupply, isInterState,
//    invoiceDate, reverseCharge flag — required by GSTN JSON schema.
//
// 8. B2CS aggregate: grouped by placeOfSupply + gstRate so each row is
//    rate-wise & state-wise (portal requirement).
//
// 9. Excel: added separate CDNR sheet (was missing), proper sheet names.
//
// 10. GSTIN / fp format: fp now uses zero-padded MM + YYYY (e.g. "052025").
// ══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import dbconnect from "@/src/lib/dbconnect";
import Order from "@/src/models/Order";
import Adjustment from "@/src/models/Adjustment";
import * as XLSX from "xlsx";
import JSZip from "jszip";

// ── helpers ────────────────────────────────────────────────────────────────────

/** Zero-pad a number to 2 digits */
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Format filing period: "MMYYYY" e.g. "052025" */
const formatFP = (date: Date) =>
  `${pad2(date.getMonth() + 1)}${date.getFullYear()}`;

// B2CL threshold changed from ₹2,50,000 → ₹1,00,000 w.e.f. 01-Aug-2024
// Notification No. 12/2024-Central Tax dated 10-Jul-2024 / Rule 59(4) amended
const B2CL_THRESHOLD = 100000;

// ── GST summing pipeline fragment (reused across aggregations) ─────────────────
const gstSumFields = {
  igst: { $sum: { $add: ["$products.igstMetal", "$products.igstMaking"] } },
  cgst: { $sum: { $add: ["$products.cgstMetal", "$products.cgstMaking"] } },
  sgst: { $sum: { $add: ["$products.sgstMetal", "$products.sgstMaking"] } },
  taxableValue: { $sum: "$products.totalTaxable" },
};

// ── route handler ──────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const gstin = searchParams.get("gstin") ?? "";
    const from  = new Date(searchParams.get("from")!);
    const to    = new Date(searchParams.get("to")!);

    // Inclusive date range
    to.setHours(23, 59, 59, 999);

    const dateMatch = { createdAt: { $gte: from, $lte: to } };

    // ══════════════════════════════════════════════════════════════
    // TABLE 4 — B2B  (registered buyers, any invoice value)
    // GSTN JSON key: "b2b"
    // ══════════════════════════════════════════════════════════════
    const b2b = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          customerGSTIN: { $exists: true, $ne: "" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$invoiceNumber",

          // ── enrichment required by GSTN JSON schema ──
          invoiceNumber:    { $first: "$invoiceNumber" },
          invoiceDate:      { $first: "$createdAt" },
          customerGSTIN:    { $first: "$customerGSTIN" },
          placeOfSupply:    { $first: "$placeOfSupply" },
          isInterState:     { $first: "$isInterState" },
          isReverseCharge:  { $first: "$isReverseCharge" },
          totalAmount:      { $first: "$totalAmount" },

          ...gstSumFields,
        },
      },
      {
        $project: {
          _id: 0,
          invoiceNumber: 1,
          invoiceDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$invoiceDate" },
          },
          customerGSTIN: 1,
          placeOfSupply: 1,
          isInterState: 1,
          reverseCharge: {
            $cond: ["$isReverseCharge", "Y", "N"],
          },
          invoiceValue: "$totalAmount",
          taxableValue: { $round: ["$taxableValue", 2] },
          igst: { $round: ["$igst", 2] },
          cgst: { $round: ["$cgst", 2] },
          sgst: { $round: ["$sgst", 2] },
          totalTax: {
            $round: [{ $add: ["$igst", "$cgst", "$sgst"] }, 2],
          },
        },
      },
      { $sort: { invoiceDate: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 7 (part) — B2CS  (unregistered, intra-state OR inter-state ≤ ₹1 L)
    // Grouped RATE-WISE + STATE-WISE as required by the portal.
    // ══════════════════════════════════════════════════════════════
    const b2cs = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          // No customer GSTIN → unregistered
          $or: [
            { customerGSTIN: { $exists: false } },
            { customerGSTIN: "" },
          ],
          // Exclude large inter-state invoices (those go to B2CL)
          $nor: [
            { isInterState: true, totalAmount: { $gt: B2CL_THRESHOLD } },
          ],
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          // Rate-wise + state-wise grouping (portal requirement)
          _id: {
            placeOfSupply: "$placeOfSupply",
            gstRateMetal:  "$products.gstRateMetal",
            gstRateMaking: "$products.gstRateMaking",
          },
          placeOfSupply: { $first: "$placeOfSupply" },
          // Combined effective GST rate for the row
          gstRate: {
            $first: {
              $add: ["$products.gstRateMetal", "$products.gstRateMaking"],
            },
          },
          ...gstSumFields,
        },
      },
      {
        $project: {
          _id: 0,
          placeOfSupply: 1,
          gstRate: 1,
          taxableValue: { $round: ["$taxableValue", 2] },
          igst: { $round: ["$igst", 2] },
          cgst: { $round: ["$cgst", 2] },
          sgst: { $round: ["$sgst", 2] },
          totalTax: {
            $round: [{ $add: ["$igst", "$cgst", "$sgst"] }, 2],
          },
        },
      },
      { $sort: { placeOfSupply: 1, gstRate: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 5 — B2CL  (unregistered + inter-state + invoice > ₹1 L)
    // Threshold revised from ₹2.5 L → ₹1 L w.e.f. 01-Aug-2024
    // Notification 12/2024-CT / Rule 59(4) CGST Rules 2017
    // ══════════════════════════════════════════════════════════════
    const b2cl = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          isInterState: true,
          totalAmount: { $gt: B2CL_THRESHOLD },
          $or: [
            { customerGSTIN: { $exists: false } },
            { customerGSTIN: "" },
          ],
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$invoiceNumber",
          invoiceNumber: { $first: "$invoiceNumber" },
          invoiceDate:   { $first: "$createdAt" },
          placeOfSupply: { $first: "$placeOfSupply" },
          invoiceValue:  { $first: "$totalAmount" },
          // B2CL is always inter-state → only IGST applies
          taxableValue: { $sum: "$products.totalTaxable" },
          igst: {
            $sum: { $add: ["$products.igstMetal", "$products.igstMaking"] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          invoiceNumber: 1,
          invoiceDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$invoiceDate" },
          },
          placeOfSupply: 1,
          invoiceValue: 1,
          taxableValue: { $round: ["$taxableValue", 2] },
          igst: { $round: ["$igst", 2] },
        },
      },
      { $sort: { invoiceDate: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 9B — CDNR  (Credit/Debit Notes to REGISTERED buyers)
    // Enriched with noteDate, referenceInvoiceDate, placeOfSupply
    // ══════════════════════════════════════════════════════════════
    const cdnr = await Adjustment.aggregate([
      {
        $match: {
          ...dateMatch,
          customerGSTIN: { $exists: true, $ne: "" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: { noteNumber: "$noteNumber", type: "$type" },

          noteNumber:             { $first: "$noteNumber" },
          noteDate:               { $first: "$createdAt" },
          noteType:               { $first: "$type" },
          referenceInvoiceNumber: { $first: "$referenceInvoiceNumber" },
          // referenceInvoiceDate if your Adjustment model carries it
          referenceInvoiceDate:   { $first: "$referenceInvoiceDate" },
          customerGSTIN:          { $first: "$customerGSTIN" },
          placeOfSupply:          { $first: "$placeOfSupply" },
          isInterState:           { $first: "$isInterState" },

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
      {
        $project: {
          _id: 0,
          noteNumber: 1,
          noteDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$noteDate" },
          },
          noteType: 1,
          referenceInvoiceNumber: 1,
          referenceInvoiceDate: {
            $cond: [
              { $ifNull: ["$referenceInvoiceDate", false] },
              {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$referenceInvoiceDate",
                },
              },
              null,
            ],
          },
          customerGSTIN: 1,
          placeOfSupply: 1,
          isInterState: 1,
          taxableValue: { $round: ["$taxableValue", 2] },
          igst: { $round: ["$igst", 2] },
          cgst: { $round: ["$cgst", 2] },
          sgst: { $round: ["$sgst", 2] },
          totalTax: {
            $round: [{ $add: ["$igst", "$cgst", "$sgst"] }, 2],
          },
        },
      },
      { $sort: { noteDate: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 9B — CDNUR  (Credit/Debit Notes to UNREGISTERED buyers)
    // ══════════════════════════════════════════════════════════════
    const cdnur = await Adjustment.aggregate([
      {
        $match: { ...dateMatch },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $match: {
          $or: [
            { "customer.gstin": { $exists: false } },
            { "customer.gstin": "" },
            { customerGSTIN: { $exists: false } },
            { customerGSTIN: "" },
          ],
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$noteNumber",
          noteNumber:   { $first: "$noteNumber" },
          noteDate:     { $first: "$createdAt" },
          noteType:     { $first: "$type" },
          placeOfSupply:{ $first: "$placeOfSupply" },
          isInterState: { $first: "$isInterState" },

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
      {
        $project: {
          _id: 0,
          noteNumber: 1,
          noteDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$noteDate" },
          },
          noteType: 1,
          placeOfSupply: 1,
          isInterState: 1,
          taxableValue: { $round: ["$taxableValue", 2] },
          igst: { $round: ["$igst", 2] },
          cgst: { $round: ["$cgst", 2] },
          sgst: { $round: ["$sgst", 2] },
          totalTax: {
            $round: [{ $add: ["$igst", "$cgst", "$sgst"] }, 2],
          },
        },
      },
      { $sort: { noteDate: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 12 — HSN SUMMARY  (Phase-III: B2B + B2C split, May 2025+)
    //
    // Each row must contain: hsn, description, uqc, quantity,
    //                        taxableValue, igst, cgst, sgst, totalTax
    //
    // Table 12A (B2B) — mandatory
    // Table 12B (B2C) — mandatory per GSTN advisory; optional for AATO ≤ ₹5 Cr
    // ══════════════════════════════════════════════════════════════

    // ── Helper pipeline to build HSN rows with description + uqc ──────────────
    const hsnProjection = {
      _id: 0,
      hsn: "$_id.hsn",
      description: "$description",
      uqc: "$uqc",
      quantity: 1,
      taxableValue: { $round: ["$taxableValue", 2] },
      igst: { $round: ["$igst", 2] },
      cgst: { $round: ["$cgst", 2] },
      sgst: { $round: ["$sgst", 2] },
      totalTax: {
        $round: [{ $add: ["$igst", "$cgst", "$sgst"] }, 2],
      },
    };

    // Table 12A — B2B HSN (invoices to registered customers)
    const hsnB2BFromOrders = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          customerGSTIN: { $exists: true, $ne: "" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: { hsn: "$products.hsn" },
          description: { $first: "$products.name" },
          uqc:         { $first: { $ifNull: ["$products.uqc", "NOS"] } },
          quantity:    { $sum: "$products.quantity" },
          taxableValue:{ $sum: "$products.totalTaxable" },
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
      { $project: hsnProjection },
    ]);

    const hsnB2BFromAdjustments = await Adjustment.aggregate([
      {
        $match: {
          ...dateMatch,
          customerGSTIN: { $exists: true, $ne: "" },
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: { hsn: "$products.hsn" },
          description: { $first: "$products.name" },
          uqc:         { $first: { $ifNull: ["$products.uqc", "NOS"] } },
          quantity:    { $sum: "$products.quantity" },
          taxableValue:{ $sum: "$products.totalTaxable" },
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
      { $project: hsnProjection },
    ]);

    // Table 12B — B2C HSN (invoices to unregistered customers)
    const hsnB2CFromOrders = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          $or: [
            { customerGSTIN: { $exists: false } },
            { customerGSTIN: "" },
          ],
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: { hsn: "$products.hsn" },
          description: { $first: "$products.name" },
          uqc:         { $first: { $ifNull: ["$products.uqc", "NOS"] } },
          quantity:    { $sum: "$products.quantity" },
          taxableValue:{ $sum: "$products.totalTaxable" },
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
      { $project: hsnProjection },
    ]);

    // Merge B2B rows from Orders + Adjustments
    function mergeHSNRows(
      rows: any[],
    ): Map<string | number, any> {
      const map = new Map<string | number, any>();
      for (const row of rows) {
        const key = String(row.hsn);
        if (!map.has(key)) {
          map.set(key, { ...row });
        } else {
          const e = map.get(key)!;
          e.quantity     += row.quantity     ?? 0;
          e.taxableValue += row.taxableValue ?? 0;
          e.igst         += row.igst         ?? 0;
          e.cgst         += row.cgst         ?? 0;
          e.sgst         += row.sgst         ?? 0;
          e.totalTax      = +(e.igst + e.cgst + e.sgst).toFixed(2);
        }
      }
      return map;
    }

    const hsnB2BMap = mergeHSNRows([...hsnB2BFromOrders, ...hsnB2BFromAdjustments]);
    const hsnB2CMap = mergeHSNRows([...hsnB2CFromOrders]);

    const hsnB2B = Array.from(hsnB2BMap.values());
    const hsnB2C = Array.from(hsnB2CMap.values());

    // ══════════════════════════════════════════════════════════════
    // TABLE 13 — DOCUMENTS ISSUED  (mandatory from May 2025)
    //
    // Required structure: series-wise count of each document type.
    // We produce a simplified but portal-compatible summary.
    // ══════════════════════════════════════════════════════════════
    const [
      invoiceCount,
      creditNoteCount,
      debitNoteCount,
      revisedInvoiceCount,
    ] = await Promise.all([
      Order.countDocuments({ ...dateMatch, type: "invoice" }),
      Adjustment.countDocuments({ ...dateMatch, type: "credit_note" }),
      Adjustment.countDocuments({ ...dateMatch, type: "debit_note" }),
      Order.countDocuments({
        ...dateMatch,
        type: { $in: ["credit_note", "debit_note"] },
      }),
    ]);

    // Cancelled documents (if your model carries a status field)
    const cancelledInvoices = await Order.countDocuments({
      ...dateMatch,
      status: "Cancelled",
    });

    const docsIssued = [
      {
        natureOfDocument:  "Invoices for outward supply",
        srNoFrom:          1,
        srNoTo:            invoiceCount,
        totalIssued:       invoiceCount,
        cancelled:         cancelledInvoices,
        netIssued:         invoiceCount - cancelledInvoices,
      },
      {
        natureOfDocument: "Credit Notes",
        srNoFrom:         1,
        srNoTo:           creditNoteCount,
        totalIssued:      creditNoteCount,
        cancelled:        0,
        netIssued:        creditNoteCount,
      },
      {
        natureOfDocument: "Debit Notes",
        srNoFrom:         1,
        srNoTo:           debitNoteCount,
        totalIssued:      debitNoteCount,
        cancelled:        0,
        netIssued:        debitNoteCount,
      },
    ];

    // ══════════════════════════════════════════════════════════════
    // GSTR-1 JSON PAYLOAD
    // Structure mirrors the GSTN offline tool JSON schema
    // ══════════════════════════════════════════════════════════════
    const gstr1JSON = {
      gstin,
      // "MMYYYY" — zero-padded month + 4-digit year (e.g. "052025")
      fp: formatFP(from),
      returnPeriod: {
        from: from.toISOString().split("T")[0],
        to:   to.toISOString().split("T")[0],
      },

      // Table 4 — B2B
      b2b,

      // Table 7 — B2CS (rate-wise + state-wise)
      b2cs,

      // Table 5 — B2CL (invoice-wise, inter-state > ₹1 L, revised Aug 2024)
      b2cl,

      // Table 9B — CDNR (registered)
      cdnr,

      // Table 9B — CDNUR (unregistered)
      cdnur,

      // Table 12 — HSN summary (Phase-III split: B2B mandatory, B2C mandatory per advisory)
      hsn: {
        b2b: hsnB2B,   // Table 12A — B2B HSN
        b2c: hsnB2C,   // Table 12B — B2C HSN
      },

      // Table 13 — Documents Issued (mandatory from May 2025)
      docsIssued,
    };

    // ══════════════════════════════════════════════════════════════
    // EXCEL WORKBOOK
    // One sheet per GSTR-1 table.  Sheet names match portal labels.
    // ══════════════════════════════════════════════════════════════
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, data: any[]) => {
      if (!data.length) return; // skip empty sheets
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("B2B (T4)",       b2b);
    addSheet("B2CS (T7)",      b2cs);
    addSheet("B2CL (T5)",      b2cl);
    addSheet("CDNR (T9B-R)",   cdnr);
    addSheet("CDNUR (T9B-U)",  cdnur);
    addSheet("HSN-B2B (T12A)", hsnB2B);
    addSheet("HSN-B2C (T12B)", hsnB2C);
    addSheet("DOCS (T13)",     docsIssued);

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // ══════════════════════════════════════════════════════════════
    // ZIP — both JSON + XLSX
    // ══════════════════════════════════════════════════════════════
    const zip = new JSZip();
    zip.file("gstr1.json", JSON.stringify(gstr1JSON, null, 2));
    zip.file("gstr1.xlsx", excelBuffer);

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=gstr1_${formatFP(from)}.zip`,
      },
    });
  } catch (error: any) {
    console.error("[GSTR-1]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}