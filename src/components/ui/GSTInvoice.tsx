import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Logo } from "@/src/constants/constants";
import { ISHOP } from "@/src/models/Shop";
import axios from "axios";
import { log } from "node:console";
import { InvoiceData } from "@/src/app/billing/page";
import { toCurrency } from "to-words";

// ── Types ──────────────────────────────────────────────
type LineItem = {
  sno: number;
  description: string;
  hsnCode: string;
  purity: string;
  grossWtG: number;
  netWtG: number;
  ratePerG: number;
  makingCharges: number;
  taxableAmt: number;
};

type OldGoldExchange = {
  item: string;
  purity: string;
  weightG: number;
  taxableAmt: number;
};

// type InvoiceData = {
//   shopName: string;
//   shopTagline: string;
//   shopAddress: string;
//   gstin: string;
//   mobile: string;
//   recipient: {
//     name: string;
//     address: string;
//     state: string;
//     code: string;
//     mobile: string;
//     placeOfSupply: string;
//   };
//   items: LineItem[];
//   oldGoldExchange?: OldGoldExchange;
//   cgstRate: number;
//   sgstRate: number;
//   igstRate: number;
//   roundOff: number;
//   amountInWords: string;
//   termsAndConditions: string[];
// };

// ── Mock Invoice Data ──────────────────────────────────
// const invoice: InvoiceData = {
//   shopName: "SRI LAKHHI JEWELLERS",
//   shopTagline: "Jewellers since 1955",
//   shopAddress: "123, Main Bazaar, Jaipur, Rajasthan - 302001",
//   gstin: "09AAACNT2349121AN: ACR CAXXAK",
//   mobile: "+91 9876245210",
//   recipient: {
//     name: "Anjali Sharma",
//     address: "W-45, Vaishali Nagar, Jaipur - 302021",
//     state: "Rajasthan",
//     code: "09",
//     mobile: "9125456799",
//     placeOfSupply: "Jaipur, Rajasthan",
//   },
//   items: [
//     {
//       sno: 1,
//       description: "Gold Chain (Mens)",
//       hsnCode: "7118",
//       purity: "22K (916)",
//       grossWtG: 18.50,
//       netWtG: 18.50,
//       ratePerG: 6400,
//       makingCharges: 7500,
//       taxableAmt: 125600,
//     },
//     {
//       sno: 2,
//       description: "Silver Anklets (Pair)",
//       hsnCode: "7118",
//       purity: "22K",
//       grossWtG: 25.00,
//       netWtG: 24.50,
//       ratePerG: 95,
//       makingCharges: 1800,
//       taxableAmt: 3850,
//     },
//     {
//       sno: 3,
//       description: "Diamond Earrings",
//       hsnCode: "7113",
//       purity: "18K/Diamonds",
//       grossWtG: 3.16,
//       netWtG: 2.10,
//       ratePerG: 0,
//       makingCharges: 18000,
//       taxableAmt: 58000,
//     },
//   ],
//   oldGoldExchange: {
//     item: "Ring",
//     purity: "22K",
//     weightG: 5.2,
//     taxableAmt: 31200,
//   },
//   cgstRate: 1.5,
//   sgstRate: 1.5,
//   igstRate: 0.3,
//   roundOff: 0,
//   amountInWords: "One Lakh Ninety Three Thousand Three Hundred Eighty Eight Only",
//   termsAndConditions: [
//     "The purchaser is confirmed has required as certified by Hallmark Specification - 916bit.",
//     "Diamonds are certified by recognized and accredited independent gemological laboratory.",
//     "Tax amount does not add a tax extra certification unless otherwise specified for old and new.",
//     "Secondary checking of all damaged or worn-out items requires certification before a return/replacement.",
//   ],
// };

// ── Helpers ────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtN = (n: number) => n.toFixed(2);

// ── Table header cell ──────────────────────────────────
const TH = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`border border-[#8B6914]/40 px-2 py-2 text-center font-bold ${className}`}
    style={{
      fontFamily: "'Georgia', serif",
      fontSize: "9px",
      color: "#3D2B1F",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </th>
);

// ── Table data cell ────────────────────────────────────
const TD = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td
    className={`border border-[#C8B8A8]/60 px-2 py-1.5 ${className}`}
    style={{
      fontFamily: "'Georgia', serif",
      fontSize: "10px",
      color: "#3D2B1F",
    }}
  >
    {children}
  </td>
);

// ── Main Component ─────────────────────────────────────
export default function GSTInvoice({ data }: { data?: InvoiceData }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [shopDetails, setShopDetails] = useState<ISHOP | null>(null);

  const title =
  data?.documentType === "invoice"
    ? "TAX INVOICE"
    : data?.documentType ===
        "credit_note"
      ? "CREDIT NOTE"
      : "DEBIT NOTE";

      console.log("Document type: ",data?.documentType);
      

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await axios.get("/api/get-shop");
        if (response.data.success) {
          setShopDetails(response.data.shop);
          console.log("Fetched shop details: ", response.data.shop);
        }
      } catch (error) {
        console.error("Failed to fetch shop details:", error);
      }
    };
    fetchShop();
  }, []);

  if (!data) {
    return null;
  }

  const grossWeight = data.items.reduce((s, i) => s + i.weight, 0);
  let metalValue = 0;
  let makingValue = 0;

  data.items.forEach((item) => {
    const rate =
      item.type === "Gold"
        ? (item?.purity === "18k"
                        ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) * 0.75
                        : item?.purity === "22k"
                          ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                            0.916
                          : (data.shopDetails?.goldRatePer10g ?? 0) / 10
                      )
        : item?.type === "Silver" ? (item?.purity === "18k"
          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
          : item?.purity === "22k"
            ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
            : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)
        ) : (item.price || 0) / item.weight;

    metalValue += rate * item.weight;
    makingValue += item.makingCharge ?? 0;
  });

  // 🔥 GST RULES
  const metalGST = (metalValue * (data?.shopDetails?.gstOnMetal ?? 0)) / 100;
  const makingGST =
    (makingValue * (data?.shopDetails?.gstOnMakingCharge ?? 0)) / 100;

  let cgst = 0,
    sgst = 0,
    igst = 0;

  if (false) {
    igst = metalGST + makingGST;
  } else {
    cgst = (metalGST + makingGST) / 2;
    sgst = (metalGST + makingGST) / 2;
  }

  const subTotal = metalValue + makingValue;
  const totalDiscount = ((subTotal * (data?.discount ?? 0)) / 100);
  const totalTax = cgst + sgst + igst;
  const invoiceValue = subTotal - totalDiscount + totalTax;

  const grandTotal =
    invoiceValue - (data?.oldItems?.reduce((s, i) => s + i.price, 0) ?? 0);
  const handlePrint = () => window.print();

  const LogoUri =
    "https://res.cloudinary.com/dorvotkgw/image/upload/q_auto/f_auto/v1776316298/Logo_nexmij.jpg";
  const base64Logo = Logo;

  return (
    <div className="min-h-screen  flex flex-col items-center gap-6">
      {/* Print button */}
      {/* <div className="w-full max-w-[860px] flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#B8943C] text-[#3D2000] px-6 py-3 rounded-md transition-colors duration-200"
          style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em" }}
        >
          <Printer size={16} strokeWidth={2} />
          Print / Save PDF
        </button>
      </div> */}

      {/* ── Invoice Card ── */}
      <div
        ref={printRef}
        id="invoice-print"
        className="w-[794px] mx-auto p-6"
        style={{ padding: "32px 36px", border: "1px solid #DDD0C4" }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between mb-3">
          {/* Left: Logo + Shop Name */}
          <div className="flex items-start gap-4">
            {/* Emblem */}
            <div>
              <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6B1A1A 0%, #3A0F0F 100%)",
                border: "2px solid #8B6914",
              }}
            >
              <img
                src={Logo.image}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <img src="./Hallmark-Logo.png" alt="" className="h-15 w-20 mt-4 object-cover" />
            </div>
            <div>
              <p
                className="whitespace-nowrap"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "30px",
                  fontWeight: 800,
                  color: "#4A1A1A",
                  letterSpacing: "0.04em",
                }}
              >
                {data?.shopDetails?.name || "SRI LAKKHI JEWELLERS"}
              </p>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "16px",
                  color: "#8B6914",
                  letterSpacing: "0.1em",
                }}
              >
                {"since 2000"}
              </p>
            </div>
          </div>

          {/* Right: TAX INVOICE label + shop info */}
          <div className="text-right">
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#5C4A3A",
              }}
            >
              Invoice No.:{" "}
              <span className="font-semibold text-[#2C1A0E]">
                {data.invoiceNo}
              </span>
            </p>
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#5C4A3A",
              }}
            >
              Date:{" "}
              <span className="font-semibold text-[#2C1A0E]">{data.date}</span>
            </p>
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "20px",
                fontWeight: 800,
                color: "#4A1A1A",
                letterSpacing: "0.06em",
              }}
            >
             {title || "INVOICE"}
            </p>
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#8B6914",
                letterSpacing: "0.08em",
              }}
            >
              GST INVOICE
            </p>
            <div
              className="mt-2"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#5C4A3A",
                lineHeight: "1.7",
              }}
            >
              <p>{data.shopDetails?.address}</p>
              <p>GSTIN: {data.shopDetails?.gstin}</p>
              <p>AC/NO: {data.shopDetails?.accountNumber}</p>
              <p>IFSC Code: {data.shopDetails?.ifscCode}</p>
              <p>Mobile: {data.shopDetails?.contactNumber}</p>
              {/* <p>Web: {data.web}</p> */}
            </div>
          </div>
        </div>

        {/* Gold divider */}
        <div className="w-full h-[1.5px] bg-gradient-to-r from-[#8B6914] via-[#C9A84C] to-[#8B6914] mb-3" />

        {/* TAX INVOICE centered label */}
        {/* <p className="text-center font-bold mb-3"
          style={{ fontFamily: "'Georgia', serif", fontSize: "13px", color: "#4A1A1A", letterSpacing: "0.12em" }}>
          TAX INVOICE
        </p> */}

        {/* ── SUPPLIER + RECIPIENT + INVOICE META ── */}
        <div className=" gap-0 border border-[#8B6914]/40 mb-3">
          {/* Supplier */}
          {/* <div className="border-r border-[#8B6914]/40 p-3">
            <p className="font-bold mb-2" style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#4A1A1A", letterSpacing: "0.08em", borderBottom: "1px solid #DDD0C4", paddingBottom: "4px" }}>
              Supplier Details
            </p>
            <p style={{ fontFamily: "'Georgia', serif", fontSize: "11px", color: "#3D2B1F", fontWeight: 600 }}>{data.supplierName}</p>
            <div className="mt-3 pt-2 border-t border-[#DDD0C4]">
              <p style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#5C4A3A" }}>
                Invoice No.: <span className="font-semibold text-[#2C1A0E]">{data.invoiceNo}</span>
              </p>
              <p style={{ fontFamily: "'Georgia', serif", fontSize: "10px", color: "#5C4A3A" }}>
                Date: <span className="font-semibold text-[#2C1A0E]">{data.invoiceDate}</span>
              </p>
            </div>
          </div> */}

          {/* Recipient */}
          <div className=" p-3">
            <p
              className="font-bold mb-2"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#4A1A1A",
                letterSpacing: "0.08em",
                borderBottom: "1px solid #DDD0C4",
                paddingBottom: "4px",
              }}
            >
              Customer Details
            </p>
            <div
              className="grid grid-cols-2 gap-x-4 gap-y-0.5"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                color: "#5C4A3A",
              }}
            >
              <p>
                Name:{" "}
                <span className="font-semibold text-[#2C1A0E]">
                  {data.customer?.name}
                </span>
              </p>
              <p className="col-span-2">
                Address:{" "}
                <span className="font-semibold text-[#2C1A0E]">
                  {data.customer?.adress}
                </span>
              </p>
              <p>
                Mobile:{" "}
                <span className="font-semibold text-[#2C1A0E]">
                  {data.customer?.phone}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <table className="w-full border-collapse mb-1">
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #FDF3DC 0%, #F5E8B0 100%)",
              }}
            >
              <TH>S.No</TH>
              <TH>Description</TH>
              <TH>HSN Code</TH>
              <TH>Purity</TH>
              <TH>Gross Wt (g)</TH>
              <TH>HUID</TH>
              <TH>Rate (₹/g)</TH>
              <TH>Making Charges (₹)</TH>
              <TH>Taxable Amt (₹)</TH>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="hover:bg-[#FAF6F1]/60">
                <TD className="text-center">{index + 1}</TD>
                <TD className="font-semibold">{item.name}</TD>
                <TD className="text-center">{item.hsn}</TD>
                <TD className="text-center">{item.purity}</TD>
                <TD className="text-right">{fmtN(item.weight)}</TD>
                <TD className="text-right">{item.huid}</TD>
                <TD className="text-right">
                  {item.type === "Gold"
                    ? (item?.purity === "18k"
                        ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) * 0.75
                        : item?.purity === "22k"
                          ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                            0.916
                          : (data.shopDetails?.goldRatePer10g ?? 0) / 10
                      ).toLocaleString("en-IN")
                    : item.type === "Silver" ? (
                        (item?.purity === "18k"
                          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
                          : item?.purity === "22k"
                            ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
                            : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)
                        )
                      ).toLocaleString("en-IN")
                    : ((item.price ?? 0) / item.weight).toLocaleString("en-IN")}
                </TD>
                <TD className="text-right">
                  {item?.makingCharge?.toLocaleString("en-IN")} (
                  {(
                    ((item?.makingCharge ?? 0) * 100) /
                    (item.type === "Gold"
                      ? (item?.purity === "18k"
                          ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                            0.75
                          : item?.purity === "22k"
                            ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                              0.916
                            : (data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                        item.weight
                      : item.type === "Silver" ? (item?.purity === "18k"
                          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
                          : item?.purity === "22k"
                            ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
                            : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)) *
                        item.weight
                        : (item.price ?? 0) * item.weight)
                  ).toFixed(1)}
                  %)
                </TD>
                <TD className="text-right font-semibold">
                  {(
                    (item.type === "Gold"
                      ? (item?.purity === "18k"
                          ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                            0.75
                          : item?.purity === "22k"
                            ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                              0.916
                            : (data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                        item.weight
                      : item.type === "Silver" ? (item?.purity === "18k"
                          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
                          : item?.purity === "22k"
                            ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
                            : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)) *
                        item.weight
                        : (item.price ?? 0)) + (item.makingCharge ?? 0)
                  ).toLocaleString("en-IN")}
                </TD>
              </tr>
            ))}
            {/* Gross weight row */}
            <tr style={{ background: "#FAF6F1" }}>
              <td
                colSpan={4}
                className="border border-[#C8B8A8]/60 px-2 py-1.5 text-right"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  color: "#5C4A3A",
                  fontWeight: 700,
                }}
              >
                Gross Weight
              </td>
              <td
                className="border border-[#C8B8A8]/60 px-2 py-1.5 text-right"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#3D2B1F",
                }}
              >
                {fmtN(grossWeight)}g
              </td>
              <td colSpan={5} className="border border-[#C8B8A8]/60" />
            </tr>
          </tbody>
        </table>

        {/* ── GST BREAKDOWN ── */}
        <div className="border border-[#8B6914]/40 mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "#F5E8B0" }}>
                <TH>Description</TH>
                <TH>Taxable Value</TH>
                <TH>GST Rate</TH>
                <TH>GST Amount</TH>
              </tr>
            </thead>
            <tbody>
              <tr>
                <TD>Gold/Silver Value</TD>
                <TD className="text-right">{fmt(metalValue)}</TD>
                <TD className="text-center">
                  {data?.shopDetails?.gstOnMetal}%
                </TD>
                <TD className="text-right">{fmt(metalGST)}</TD>
              </tr>
              <tr>
                <TD>Making Charges</TD>
                <TD className="text-right">{fmt(makingValue)}</TD>
                <TD className="text-center">
                  {data?.shopDetails?.gstOnMakingCharge}%
                </TD>
                <TD className="text-right">{fmt(makingGST)}</TD>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── TOTALS SECTION ── */}
        <div className="flex gap-0 mb-3">
          {/* Left: Amount in words + Old Gold Exchange */}
          <div className="flex-1 border border-[#8B6914]/40 border-r-0 p-3 flex flex-col justify-between">
            <div>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#4A1A1A",
                  borderBottom: "1px solid #DDD0C4",
                  paddingBottom: "4px",
                  marginBottom: "6px",
                }}
              >
                Grand Total (In Figures):{" "}
                <span style={{ color: "#8B6914" }}>{fmt(grandTotal)}</span>
              </p>
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "10px",
                  color: "#5C4A3A",
                  lineHeight: "1.6",
                }}
              >
                <span style={{ fontWeight: 700, color: "#4A1A1A" }}>
                  Grand Total (In Words):
                </span>
                {toCurrency(grandTotal, { localeCode: "en-IN" })}
              </p>
            </div>

            {/* Old Gold Exchange */}
            {data.oldItems && (
              <div className="mt-4">
                <p
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#4A1A1A",
                    borderBottom: "1px solid #DDD0C4",
                    paddingBottom: "4px",
                    marginBottom: "6px",
                  }}
                >
                  Old Gold Exchange
                </p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: "#F5E8B0" }}>
                      {["Item", "Purity", "Weight (g)", "Taxable Amt (₹)"].map(
                        (h) => (
                          <th
                            key={h}
                            className="border border-[#8B6914]/40 px-2 py-1 text-center"
                            style={{
                              fontFamily: "'Georgia', serif",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "#3D2B1F",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  {data.oldItems && (
                    <tbody>
                      {data.oldItems.map((item, idx) => (
                        <tr key={idx}>
                          <TD className="text-center">{item.name}</TD>
                          <TD className="text-center">{item.purity}</TD>
                          <TD className="text-right">{item.weight}</TD>
                          <TD className="text-right font-semibold">
                            {item.price.toLocaleString("en-IN")}
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Right: Tax breakdown */}
          <div className="w-[240px] flex-shrink-0 border border-[#8B6914]/40">
            {[
              { label: "Sub-Total", value: fmt(subTotal), bold: false },
              { label: "CGST (Split GST)", value: fmt(cgst) },
              { label: "SGST (Split GST)", value: fmt(sgst) },
              { label: "IGST (If Applicable)", value: fmt(igst) },
              { label: "Total Tax Amt", value: fmt(totalTax), bold: true },
              {
                label: "Total Discounts", value: `${fmt(totalDiscount)}(${(data?.discount)}%)`,
              },
              { label: "Invoice Value", value: fmt(invoiceValue), bold: false },
              {
                label: "Grand Total",
                value: fmt(grandTotal),
                bold: true,
                highlight: true,
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-1.5 border-b border-[#C8B8A8]/50 ${row.highlight ? "bg-gradient-to-r from-[#FDF3DC] to-[#F5E8B0]" : i % 2 === 0 ? "bg-white" : "bg-[#FAF6F1]"}`}
              >
                <span
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "10px",
                    color: "#5C4A3A",
                    fontWeight: row.bold ? 700 : 400,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: row.highlight ? "13px" : "10px",
                    color: row.highlight ? "#4A1A1A" : "#3D2B1F",
                    fontWeight: row.bold ? 700 : 400,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}

            {/* Right side: Old gold summary */}
            {data.oldItems && (
              <div className="px-3 py-2 border-t border-[#8B6914]/40 bg-[#FDF3DC]/60">
                <div className="flex justify-between mt-1 pt-1 border-t border-[#DDD0C4]">
                  <span
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "10px",
                      color: "#4A1A1A",
                      fontWeight: 700,
                    }}
                  >
                    Net Payment
                  </span>
                  <span
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "10px",
                      color: "#4A1A1A",
                      fontWeight: 700,
                    }}
                  >
                    {fmt(grandTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TERMS + SIGNATURES ── */}
        <div className="flex items-start justify-between gap-6 border-t border-[#C8B8A8]/60 pt-3">
          {/* Terms */}
          <div className="flex-1">
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 700,
                color: "#4A1A1A",
                marginBottom: "4px",
              }}
            >
              Terms &amp; Conditions
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              {data.shopDetails?.termsAndConditions.split(".").map((t, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "9px",
                    color: "#6B5040",
                    lineHeight: "1.5",
                  }}
                  className={`${t.trim() ? "" : "hidden"}`}
                >
                  {t}
                </li>
              ))}
            </ol>
          </div>

          {/* Signatures */}
          <div className="flex gap-10 flex-shrink-0">
            <div className="text-center">
              <div className="w-28 h-10 border-b border-[#C8B8A8] mb-1" />
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#5C4A3A",
                  letterSpacing: "0.06em",
                }}
              >
                Customer Signature
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-right mb-1"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "11px",
                  fontStyle: "italic",
                  color: "#C8B8A8",
                }}
              >
                Authorised
              </p>
              <div className="w-28 h-6 border-b border-[#C8B8A8] mb-1" />
              <p
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#5C4A3A",
                  letterSpacing: "0.06em",
                }}
              >
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>

        {/* Bottom gold rule */}
        <div className="w-full h-[1.5px] bg-gradient-to-r from-[#8B6914] via-[#C9A84C] to-[#8B6914] mt-4" />
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}
