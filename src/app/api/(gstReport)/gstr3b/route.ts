// app/api/gstr3b/route.ts
//
// ══════════════════════════════════════════════════════════════════
// COMPLIANCE CHANGELOG (all changes vs previous version)
// ══════════════════════════════════════════════════════════════════
//
// 1. Table 3.1 — Full 5-row outward supply structure:
//      (a) Outward taxable supplies (excl. zero-rated, nil, exempt)
//      (b) Outward taxable supplies — Zero-rated (exports)
//      (c) Other outward supplies — Nil-rated / exempt / non-GST
//      (d) Inward supplies liable to Reverse Charge (RCM)
//      (e) Non-GST outward supplies
//    Previously only (a) was included as a flat "outward" sum.
//
// 2. Table 3.1.1 — Section 9(5) e-commerce supplies (added vide
//    Notification 14/2022-CT dated 05-Jul-2022). Jewellers are
//    unlikely to be ECOs, so the section is emitted with zero values
//    but the key is present in JSON for portal compatibility.
//
// 3. Table 3.2 — Inter-state supplies breakdown (state-wise):
//    Mandatory sub-table for inter-state supplies to:
//      - Unregistered persons (B2C)
//      - Composition taxpayers
//      - UIN holders
//    Non-editable from portal auto-population since Apr 2025; we
//    compute the same values from our own data so the export matches.
//
// 4. Table 4 — ITC: Full Notification 14/2022-CT restructure:
//      4(A) ITC Available — 5 sub-rows (import goods/services,
//           ISD, RCM, all other inward)
//      4(B)(1) — Permanent (non-reclaimable) ITC reversals
//                (Rule 38/42/43 + Section 17(5))
//      4(B)(2) — Temporary (reclaimable) ITC reversals
//                (Rule 37/37A + others)
//      4(C) — Net ITC  [4(A) - 4(B)]
//      4(D)(1) — ITC reclaimed from 4(B)(2) earlier periods
//      4(D)(2) — Ineligible ITC: Section 16(4) + PoS mismatch
//    Previously only a flat ITC sum was reported.
//
// 5. Table 5 — Exempt / Nil-rated / Non-GST inward supplies
//    (separate from Table 3.1(c) which is outward).
//    Reported as inter-state / intra-state breakdown.
//
// 6. Table 6.1 — Interest & Late Fee payable (new section).
//    Populated with zero defaults; connect to your interest
//    calculation logic if needed.
//
// 7. ret_period format fixed: "MMYYYY" zero-padded (was "M YYYY").
//
// 8. Error response now returns HTTP 500.
//
// 9. Excel: separate sheets per major table for auditability.
//
// 10. to date now includes full day (23:59:59.999).
// ══════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import dbconnect from "@/src/lib/dbconnect";
import Order from "@/src/models/Order";
import Purchase from "@/src/models/Purchase";
import * as XLSX from "xlsx";
import JSZip from "jszip";

// ── Helpers ────────────────────────────────────────────────────────────────────
const pad2   = (n: number) => String(n).padStart(2, "0");
const fmt2dp = (n: number) => Math.round(n * 100) / 100;
const zero   = () => ({ igst: 0, cgst: 0, sgst: 0, cess: 0, taxableValue: 0 });

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  await dbconnect();

  try {
    const { searchParams } = new URL(req.url);

    const gstin = searchParams.get("gstin") ?? "";
    const from  = new Date(searchParams.get("from")!);
    const to    = new Date(searchParams.get("to")!);

    // Inclusive upper bound
    to.setHours(23, 59, 59, 999);

    const dateMatch = { createdAt: { $gte: from, $lte: to } };

    // ══════════════════════════════════════════════════════════════
    // TABLE 3.1(a) — Outward taxable supplies (normal)
    // Excludes: zero-rated, nil-rated, exempt, non-GST, RCM
    // ══════════════════════════════════════════════════════════════
    const outwardTaxable = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          // Exclude zero-rated / nil-rated / exempt if you flag them;
          // for a jewellery shop all standard invoices land here.
          isReverseCharge: { $ne: true },
          isZeroRated: { $ne: true },
          isNilRated:  { $ne: true },
          isExempt:    { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: "$totalCGST" },
          sgst:         { $sum: "$totalSGST" },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 3.1(b) — Zero-rated outward (exports / SEZ)
    // ══════════════════════════════════════════════════════════════
    const outwardZeroRated = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          isZeroRated: true,
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: 0 },
          sgst:         { $sum: 0 },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 3.1(c) — Nil-rated / Exempt / Non-GST outward
    // ══════════════════════════════════════════════════════════════
    const outwardNilExempt = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          $or: [{ isNilRated: true }, { isExempt: true }],
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst: { $sum: 0 },
          cgst: { $sum: 0 },
          sgst: { $sum: 0 },
          cess: { $sum: 0 },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 3.1(d) — Inward supplies on Reverse Charge (RCM)
    // Liability is on the recipient; sourced from purchase records.
    // ══════════════════════════════════════════════════════════════
    const rcmInward = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isReverseCharge: true,
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: "$totalCGST" },
          sgst:         { $sum: "$totalSGST" },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 3.2 — Inter-state supplies to unregistered /
    //             composition / UIN holders (state-wise)
    //             Non-editable from portal since Apr 2025.
    //             We compute this to match what portal auto-populates.
    // ══════════════════════════════════════════════════════════════
    const interStateUnregistered = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          type: "invoice",
          isInterState: true,
          $or: [
            { customerGSTIN: { $exists: false } },
            { customerGSTIN: "" },
          ],
        },
      },
      {
        $group: {
          _id: "$placeOfSupply",
          placeOfSupply: { $first: "$placeOfSupply" },
          taxableValue:  { $sum: "$totalTaxableValue" },
          igst:          { $sum: "$totalIGST" },
        },
      },
      {
        $project: {
          _id: 0,
          placeOfSupply: 1,
          taxableValue: { $round: ["$taxableValue", 2] },
          igst:         { $round: ["$igst", 2] },
          supplyType:   { $literal: "unregistered" },
        },
      },
      { $sort: { placeOfSupply: 1 } },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 4(A) — ITC Available (5 sub-rows per Notification 14/2022-CT)
    //
    //  (1) Import of goods
    //  (2) Import of services
    //  (3) Inward supplies liable to RCM (u/s 9(3) / 9(4))
    //  (4) Inward supplies from ISD
    //  (5) All other inward supplies  ← primary row for a jeweller
    // ══════════════════════════════════════════════════════════════
    const itcAllOtherInward = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isGSTBill: true,
          isReverseCharge: { $ne: true },
          isImport:        { $ne: true },
          isISD:           { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: "$totalCGST" },
          sgst:         { $sum: "$totalSGST" },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    const itcRCM = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isGSTBill: true,
          isReverseCharge: true,
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: "$totalCGST" },
          sgst:         { $sum: "$totalSGST" },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    const itcImportGoods = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isImport: true,
          isImportGoods: true,
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: 0 },
          sgst:         { $sum: 0 },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    const itcImportServices = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isImport: true,
          isImportGoods: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: 0 },
          sgst:         { $sum: 0 },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    const itcISD = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isISD: true,
        },
      },
      {
        $group: {
          _id: null,
          taxableValue: { $sum: "$totalTaxableValue" },
          igst:         { $sum: "$totalIGST" },
          cgst:         { $sum: "$totalCGST" },
          sgst:         { $sum: "$totalSGST" },
          cess:         { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 4(B)(1) — Permanent (non-reclaimable) ITC reversals
    // Rule 38/42/43 + Section 17(5)
    // ══════════════════════════════════════════════════════════════
    const itcPermanentReversal = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isGSTBill: true,
          itcReversalType: "permanent",  // flag this on your Purchase model
        },
      },
      {
        $group: {
          _id: null,
          igst: { $sum: "$totalIGST" },
          cgst: { $sum: "$totalCGST" },
          sgst: { $sum: "$totalSGST" },
          cess: { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 4(B)(2) — Temporary (reclaimable) ITC reversals
    // Rule 37 (non-payment within 180 days) + Rule 37A + others
    // ══════════════════════════════════════════════════════════════
    const itcTemporaryReversal = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isGSTBill: true,
          itcReversalType: "temporary",  // flag this on your Purchase model
        },
      },
      {
        $group: {
          _id: null,
          igst: { $sum: "$totalIGST" },
          cgst: { $sum: "$totalCGST" },
          sgst: { $sum: "$totalSGST" },
          cess: { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 4(D)(1) — ITC reclaimed (was reversed as temporary in earlier periods)
    // ══════════════════════════════════════════════════════════════
    const itcReclaimed = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          isGSTBill: true,
          isITCReclaimed: true,
        },
      },
      {
        $group: {
          _id: null,
          igst: { $sum: "$totalIGST" },
          cgst: { $sum: "$totalCGST" },
          sgst: { $sum: "$totalSGST" },
          cess: { $sum: { $ifNull: ["$totalCess", 0] } },
        },
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // TABLE 5 — Exempt / Nil-rated / Non-GST INWARD supplies
    // Reported as inter-state + intra-state
    // ══════════════════════════════════════════════════════════════
    const exemptInward = await Purchase.aggregate([
      {
        $match: {
          ...dateMatch,
          $or: [{ isNilRated: true }, { isExempt: true }, { isNonGST: true }],
        },
      },
      {
        $group: {
          _id: "$isInterState",
          taxableValue: { $sum: "$totalTaxableValue" },
        },
      },
    ]);

    const exemptInwardMap: Record<string, number> = {
      interState:  0,
      intraState:  0,
      compositionDealer: 0,
    };
    for (const row of exemptInward) {
      if (row._id === true)  exemptInwardMap.interState  = row.taxableValue;
      if (row._id === false) exemptInwardMap.intraState  = row.taxableValue;
    }

    // ── Assemble raw values ────────────────────────────────────────────────────

    const t3a  = outwardTaxable[0]    ?? zero();
    const t3b  = outwardZeroRated[0]  ?? zero();
    const t3c  = outwardNilExempt[0]  ?? zero();
    const t3d  = rcmInward[0]         ?? zero();

    const itc4a1 = itcImportGoods[0]    ?? zero();
    const itc4a2 = itcImportServices[0] ?? zero();
    const itc4a3 = itcRCM[0]           ?? zero();
    const itc4a4 = itcISD[0]           ?? zero();
    const itc4a5 = itcAllOtherInward[0] ?? zero();

    const itc4b1 = itcPermanentReversal[0] ?? { igst: 0, cgst: 0, sgst: 0, cess: 0 };
    const itc4b2 = itcTemporaryReversal[0] ?? { igst: 0, cgst: 0, sgst: 0, cess: 0 };
    const itc4d1 = itcReclaimed[0]         ?? { igst: 0, cgst: 0, sgst: 0, cess: 0 };

    // 4(A) total
    const itcTotalAvailable = {
      igst: itc4a1.igst + itc4a2.igst + itc4a3.igst + itc4a4.igst + itc4a5.igst,
      cgst: itc4a1.cgst + itc4a2.cgst + itc4a3.cgst + itc4a4.cgst + itc4a5.cgst,
      sgst: itc4a1.sgst + itc4a2.sgst + itc4a3.sgst + itc4a4.sgst + itc4a5.sgst,
      cess: itc4a1.cess + itc4a2.cess + itc4a3.cess + itc4a4.cess + itc4a5.cess,
    };

    // 4(B) total
    const itcTotalReversals = {
      igst: itc4b1.igst + itc4b2.igst,
      cgst: itc4b1.cgst + itc4b2.cgst,
      sgst: itc4b1.sgst + itc4b2.sgst,
      cess: itc4b1.cess + itc4b2.cess,
    };

    // 4(C) = 4(A) - 4(B)  [Net ITC available]
    const netITC = {
      igst: fmt2dp(itcTotalAvailable.igst - itcTotalReversals.igst),
      cgst: fmt2dp(itcTotalAvailable.cgst - itcTotalReversals.cgst),
      sgst: fmt2dp(itcTotalAvailable.sgst - itcTotalReversals.sgst),
      cess: fmt2dp(itcTotalAvailable.cess - itcTotalReversals.cess),
    };

    // Net tax liability = outward total tax - net ITC
    const totalOutwardIGST = fmt2dp(t3a.igst + t3b.igst + t3c.igst + t3d.igst);
    const totalOutwardCGST = fmt2dp(t3a.cgst + t3b.cgst + t3c.cgst + t3d.cgst);
    const totalOutwardSGST = fmt2dp(t3a.sgst + t3b.sgst + t3c.sgst + t3d.sgst);

    const netTaxPayable = {
      igst: fmt2dp(totalOutwardIGST - netITC.igst),
      cgst: fmt2dp(totalOutwardCGST - netITC.cgst),
      sgst: fmt2dp(totalOutwardSGST - netITC.sgst),
      cess: fmt2dp(0 - netITC.cess),  // cess: outward cess - ITC cess
    };

    // ══════════════════════════════════════════════════════════════
    // GSTR-3B JSON — portal-compatible structure
    // ══════════════════════════════════════════════════════════════
    const gstr3bJSON = {
      gstin,

      // "MMYYYY" format — zero-padded  e.g. "052025"
      // Previously this was `${from.getMonth() + 1}${from.getFullYear()}`
      // which produced "52025" for May 2025 (invalid for portal).
      ret_period: `${pad2(from.getMonth() + 1)}${from.getFullYear()}`,

      returnPeriod: {
        from: from.toISOString().split("T")[0],
        to:   to.toISOString().split("T")[0],
      },

      // ── TABLE 3.1 — Outward & RCM inward ──────────────────────
      "3_1": {
        // (a) Normal taxable outward (excl. zero-rated, nil, exempt)
        a_outwardTaxable: {
          taxableValue: fmt2dp(t3a.taxableValue),
          igst:         fmt2dp(t3a.igst),
          cgst:         fmt2dp(t3a.cgst),
          sgst:         fmt2dp(t3a.sgst),
          cess:         fmt2dp(t3a.cess),
        },
        // (b) Zero-rated outward (exports / SEZ)
        b_outwardZeroRated: {
          taxableValue: fmt2dp(t3b.taxableValue),
          igst:         fmt2dp(t3b.igst),
          cgst:         0,
          sgst:         0,
          cess:         fmt2dp(t3b.cess),
        },
        // (c) Nil-rated / exempt / non-GST outward
        c_nilExemptOutward: {
          taxableValue: fmt2dp(t3c.taxableValue),
          igst: 0, cgst: 0, sgst: 0, cess: 0,
        },
        // (d) Inward liable to RCM
        d_rcmInward: {
          taxableValue: fmt2dp(t3d.taxableValue),
          igst:         fmt2dp(t3d.igst),
          cgst:         fmt2dp(t3d.cgst),
          sgst:         fmt2dp(t3d.sgst),
          cess:         fmt2dp(t3d.cess),
        },
        // (e) Non-GST outward (petrol, alcohol etc.) — jewellers: 0
        e_nonGSTOutward: {
          taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0,
        },
      },

      // ── TABLE 3.1.1 — Section 9(5) e-commerce (added Jul 2022) ─
      // Jewellers acting as direct sellers: leave zeroed.
      "3_1_1": {
        i_ecomTaxable: {
          taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0,
        },
        ii_ecomLiability: {
          taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0,
        },
      },

      // ── TABLE 3.2 — Inter-state breakdown (non-editable Apr 2025+) ─
      // Values auto-populated from GSTR-1 on portal; our export mirrors them.
      "3_2": {
        unregisteredPersons:    interStateUnregistered,
        compositionTaxpayers:   [],   // extend if you have composition buyers
        uinHolders:             [],   // extend if you supply to UN/embassy bodies
      },

      // ── TABLE 4 — ITC (Notification 14/2022-CT restructure) ────
      "4": {
        // 4(A) ITC Available
        A: {
          "1_importGoods": {
            igst: fmt2dp(itc4a1.igst),
            cgst: 0,
            sgst: 0,
            cess: fmt2dp(itc4a1.cess),
          },
          "2_importServices": {
            igst: fmt2dp(itc4a2.igst),
            cgst: 0,
            sgst: 0,
            cess: fmt2dp(itc4a2.cess),
          },
          "3_rcmInward": {
            igst: fmt2dp(itc4a3.igst),
            cgst: fmt2dp(itc4a3.cgst),
            sgst: fmt2dp(itc4a3.sgst),
            cess: fmt2dp(itc4a3.cess),
          },
          "4_isd": {
            igst: fmt2dp(itc4a4.igst),
            cgst: fmt2dp(itc4a4.cgst),
            sgst: fmt2dp(itc4a4.sgst),
            cess: fmt2dp(itc4a4.cess),
          },
          "5_allOtherInward": {
            igst: fmt2dp(itc4a5.igst),
            cgst: fmt2dp(itc4a5.cgst),
            sgst: fmt2dp(itc4a5.sgst),
            cess: fmt2dp(itc4a5.cess),
          },
          total: {
            igst: fmt2dp(itcTotalAvailable.igst),
            cgst: fmt2dp(itcTotalAvailable.cgst),
            sgst: fmt2dp(itcTotalAvailable.sgst),
            cess: fmt2dp(itcTotalAvailable.cess),
          },
        },

        // 4(B)(1) Permanent / non-reclaimable reversals
        // Rule 38 (banking), Rule 42 (exempt/non-business), Rule 43 (capex),
        // Section 17(5) (blocked credit)
        B1_permanentReversal: {
          igst: fmt2dp(itc4b1.igst),
          cgst: fmt2dp(itc4b1.cgst),
          sgst: fmt2dp(itc4b1.sgst),
          cess: fmt2dp(itc4b1.cess),
        },

        // 4(B)(2) Temporary / reclaimable reversals
        // Rule 37 (payment not made in 180 days), Rule 37A, others
        B2_temporaryReversal: {
          igst: fmt2dp(itc4b2.igst),
          cgst: fmt2dp(itc4b2.cgst),
          sgst: fmt2dp(itc4b2.sgst),
          cess: fmt2dp(itc4b2.cess),
        },

        // 4(C) Net ITC  =  4(A) total  −  4(B)(1)  −  4(B)(2)
        C_netITC: netITC,

        // 4(D)(1) ITC reclaimed (previously reversed as temporary)
        D1_itcReclaimed: {
          igst: fmt2dp(itc4d1.igst),
          cgst: fmt2dp(itc4d1.cgst),
          sgst: fmt2dp(itc4d1.sgst),
          cess: fmt2dp(itc4d1.cess),
        },

        // 4(D)(2) Ineligible ITC: Section 16(4) time bar + PoS mismatch
        // Populate from your reconciliation logic; defaults to 0.
        D2_ineligibleITC: {
          igst: 0, cgst: 0, sgst: 0, cess: 0,
        },
      },

      // ── TABLE 5 — Exempt / Nil / Non-GST INWARD supplies ───────
      "5": {
        interState:        fmt2dp(exemptInwardMap.interState),
        intraState:        fmt2dp(exemptInwardMap.intraState),
        compositionDealer: fmt2dp(exemptInwardMap.compositionDealer),
      },

      // ── TABLE 6.1 — Interest & Late Fee ────────────────────────
      // Populate from your interest calculation logic.
      // The portal auto-computes interest; we emit zeros as defaults.
      "6_1": {
        interest: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
        lateFee:  { cgst: 0, sgst: 0 },
      },

      // ── Summary: net tax payable (for quick reference) ─────────
      netTaxPayable,
    };

    // ══════════════════════════════════════════════════════════════
    // EXCEL — one sheet per major table
    // ══════════════════════════════════════════════════════════════
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, rows: any[][]) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // 3.1 outward supplies
    addSheet("3.1 Outward Supplies", [
      ["Row", "Description", "Taxable Value", "IGST", "CGST", "SGST", "CESS"],
      ["3.1(a)", "Taxable outward supplies",  t3a.taxableValue, t3a.igst, t3a.cgst, t3a.sgst, t3a.cess],
      ["3.1(b)", "Zero-rated outward",        t3b.taxableValue, t3b.igst, 0, 0, t3b.cess],
      ["3.1(c)", "Nil / Exempt outward",      t3c.taxableValue, 0, 0, 0, 0],
      ["3.1(d)", "RCM inward",                t3d.taxableValue, t3d.igst, t3d.cgst, t3d.sgst, t3d.cess],
      ["3.1(e)", "Non-GST outward",           0, 0, 0, 0, 0],
    ]);

    // 3.2 inter-state breakdown
    const t32rows: any[][] = [
      ["Place of Supply", "Supply Type", "Taxable Value", "IGST"],
      ...interStateUnregistered.map((r: any) => [
        r.placeOfSupply, "Unregistered", r.taxableValue, r.igst,
      ]),
    ];
    addSheet("3.2 Inter-State Supplies", t32rows);

    // 4 ITC
    addSheet("4 ITC", [
      ["Sub-row", "Description", "IGST", "CGST", "SGST", "CESS"],
      ["4A(1)", "Import of Goods",        itc4a1.igst, 0, 0, itc4a1.cess],
      ["4A(2)", "Import of Services",     itc4a2.igst, 0, 0, itc4a2.cess],
      ["4A(3)", "RCM inward ITC",         itc4a3.igst, itc4a3.cgst, itc4a3.sgst, itc4a3.cess],
      ["4A(4)", "ISD credit",             itc4a4.igst, itc4a4.cgst, itc4a4.sgst, itc4a4.cess],
      ["4A(5)", "All other inward",       itc4a5.igst, itc4a5.cgst, itc4a5.sgst, itc4a5.cess],
      ["4A Total", "Total ITC Available", itcTotalAvailable.igst, itcTotalAvailable.cgst, itcTotalAvailable.sgst, itcTotalAvailable.cess],
      ["4B(1)", "Permanent reversal (Rule 38/42/43 + S17(5))", itc4b1.igst, itc4b1.cgst, itc4b1.sgst, itc4b1.cess],
      ["4B(2)", "Temporary reversal (Rule 37/37A + others)",   itc4b2.igst, itc4b2.cgst, itc4b2.sgst, itc4b2.cess],
      ["4C", "Net ITC [4A - 4B]",         netITC.igst, netITC.cgst, netITC.sgst, netITC.cess],
      ["4D(1)", "ITC Reclaimed",           itc4d1.igst, itc4d1.cgst, itc4d1.sgst, itc4d1.cess],
      ["4D(2)", "Ineligible ITC (S16(4) + PoS)", 0, 0, 0, 0],
    ]);

    // 5 exempt inward
    addSheet("5 Exempt Inward", [
      ["Category", "Value"],
      ["Inter-State",        exemptInwardMap.interState],
      ["Intra-State",        exemptInwardMap.intraState],
      ["Composition Dealer", exemptInwardMap.compositionDealer],
    ]);

    // Net tax summary
    addSheet("Net Tax Payable", [
      ["Description", "IGST", "CGST", "SGST", "CESS"],
      ["Total Outward Tax",  totalOutwardIGST, totalOutwardCGST, totalOutwardSGST, 0],
      ["Net ITC",            netITC.igst, netITC.cgst, netITC.sgst, netITC.cess],
      ["Net Tax Payable",    netTaxPayable.igst, netTaxPayable.cgst, netTaxPayable.sgst, netTaxPayable.cess],
    ]);

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // ══════════════════════════════════════════════════════════════
    // ZIP
    // ══════════════════════════════════════════════════════════════
    const zip = new JSZip();
    zip.file("gstr3b.json", JSON.stringify(gstr3bJSON, null, 2));
    zip.file("gstr3b.xlsx", excelBuffer);

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    const retPeriod = `${pad2(from.getMonth() + 1)}${from.getFullYear()}`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=gstr3b_${retPeriod}.zip`,
      },
    });
  } catch (error: any) {
    console.error("[GSTR-3B]", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}