// GSTInvoicePDF.tsx
// Pixel-perfect react-pdf conversion of GSTInvoice.tsx
// Install: npm install @react-pdf/renderer to-words

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { toCurrency } from "to-words";
import { InvoiceData } from "@/src/app/billing/page";
import { hallmarkLogo, Logo } from "@/src/constants/constants";
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf" },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: "bold" },
    { src: "/fonts/NotoSans-Italic.ttf", fontStyle: "italic" },
  ],
});

// ── Fonts (built-in, no registration needed) ───────────
const SERIF = "NotoSans";
const SERIF_BOLD = "NotoSans";
const SERIF_ITALIC = "NotoSans";

// ── Brand palette (exact match to GSTInvoice.tsx) ──────
const C = {
  maroon: "#4A1A1A",
  gold: "#8B6914",
  goldLight: "#C9A84C",
  goldBg: "#FDF3DC",
  goldBg2: "#F5E8B0",
  border: "#8B6914",
  borderLight: "#C8B8A8",
  borderFaint: "#DDD0C4",
  textDark: "#2C1A0E",
  textMid: "#3D2B1F",
  textMuted: "#5C4A3A",
  bg: "#FAF6F1",
  white: "#FFFFFF",
};

// ── Table column widths (must sum to 100) ─────────────
const COL_W = {
  sno: 5,
  desc: 22,
  hsn: 9,
  purity: 10,
  gross: 8,
  huid: 13,
  rate: 10,
  making: 12,
  taxable: 11,
} as const;
const COL = Object.fromEntries(
  Object.entries(COL_W).map(([k, v]) => [k, `${v}%`]),
) as Record<keyof typeof COL_W, string>;

// GST breakdown table col widths
const GSTCOL = { desc: "34%", taxable: "22%", rate: "22%", amt: "22%" };

// Old gold exchange col widths
const OGCOL = { item: "28%", purity: "22%", weight: "22%", price: "28%" };

// ── Helpers ────────────────────────────────────────────
const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtN = (n: number) => n.toFixed(2);

// ── StyleSheet ─────────────────────────────────────────
const s = StyleSheet.create({
  // Page
  page: {
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical: 24,
    fontFamily: "NotoSans", // 👈 updated
    fontSize: 9,
    color: C.textMid,
  },

  // Gold divider — single solid line simulating the gradient
  goldRule: {
    height: 1.5,
    backgroundColor: C.goldLight,
    marginVertical: 5,
  },

  // ── HEADER ────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  headerLeft: {
    flexDirection: "row",
    flex: 1,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 56, height: 56, resizeMode: "cover", borderRadius: 28, borderWidth: 2,
    borderColor: C.gold, },
  hallMarkLogo: {
    width: 36,
    height: 36,
    resizeMode: "cover",
  },
  hallMarkLogoImg: {
  width: 60,
  height: 40,
  marginTop: 4,
  objectFit: "contain",
},
  shopName: {
    fontFamily: SERIF_BOLD,
    fontSize: 30,
    color: C.maroon,
    letterSpacing: 0.8,
  },
  shopTagline: {
    fontFamily: SERIF_ITALIC,
    fontSize:10,
    color: C.maroon,
    letterSpacing:0.8
  },
  headerRight: { alignItems: "flex-end", maxWidth: 210 },
  taxLabel: {
    fontFamily: SERIF_BOLD,
    fontSize: 14,
    color: C.maroon,
    letterSpacing: 1,
    marginTop: 2,
  },
  gstLabel: {
    fontFamily: SERIF_BOLD,
    fontSize: 10,
    color: C.gold,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaLine: {
    fontSize: 8,
    color: C.textMuted,
    textAlign: "right",
    lineHeight: 1.55,
  },
  metaBold: { fontFamily: SERIF_BOLD, color: C.textDark },

  // ── CUSTOMER BOX ──────────────────────────────────────
  customerBox: {
    borderWidth: 1,
    borderColor: C.border,
    padding: 7,
    marginBottom: 5,
  },
  sectionTitle: {
    fontFamily: SERIF_BOLD,
    fontSize: 8.5,
    color: C.maroon,
    letterSpacing: 0.6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderFaint,
    paddingBottom: 3,
    marginBottom: 4,
  },
  customerGrid: { flexDirection: "row", flexWrap: "wrap" },
  custField: { flexDirection: "row", marginBottom: 2 },
  custFieldFull: { width: "100%", flexDirection: "row", marginBottom: 2 },
  custHalf: { width: "50%", flexDirection: "row", marginBottom: 2 },
  fLabel: { fontSize: 8, color: C.textMuted, marginRight: 3 },
  fValue: { fontFamily: SERIF_BOLD, fontSize: 8, color: C.textDark, flex: 1 },

  // ── TABLE SHELL ────────────────────────────────────────
  tableWrap: {
    borderWidth: 0.75,
    borderColor: C.borderLight,
    marginBottom: 5,
  },
  tHeadRow: {
    flexDirection: "row",
    backgroundColor: C.goldBg,
    borderBottomWidth: 0.75,
    borderBottomColor: C.border,
  },
  tBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  tBodyRowAlt: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  tGrossRow: { flexDirection: "row", backgroundColor: C.bg },

  // Cell base — right-border only (outer wrap handles the rest)
  thBase: {
    fontFamily: SERIF_BOLD,
    fontSize: 7.5,
    color: C.textDark,
    textAlign: "center",
    letterSpacing: 0.2,
    paddingHorizontal: 3,
    paddingVertical: 4,
    borderRightWidth: 0.5,
    borderRightColor: C.border,
  },
  tdBase: {
    fontSize: 8,
    color: C.textMid,
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRightWidth: 0.5,
    borderRightColor: C.borderLight,
  },
  cellLast: { borderRightWidth: 0 },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  cellBold: { fontFamily: SERIF_BOLD },

  // ── GST BREAKDOWN TABLE ────────────────────────────────
  gstTableWrap: {
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 5,
  },
  gstHeadRow: {
    flexDirection: "row",
    backgroundColor: C.goldBg2,
    borderBottomWidth: 0.75,
    borderBottomColor: C.border,
  },
  gstBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  gstBodyRowAlt: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },

  // ── TOTALS SECTION ─────────────────────────────────────
  totalsRow: { flexDirection: "row", marginBottom: 5 },
  totalsLeft: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRightWidth: 0,
    padding: 7,
    justifyContent: "space-between", // 👈 IMPORTANT
  },
  grandFig: {
    fontFamily: SERIF_BOLD,
    fontSize: 8.5,
    color: C.maroon,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderFaint,
    paddingBottom: 3,
    marginBottom: 4,
  },
  grandFigVal: { color: C.gold },
  grandWords: { fontSize: 8, color: C.textMuted, lineHeight: 1.55 },
  grandWordsBold: { fontFamily: SERIF_BOLD, color: C.maroon },

  oldGoldTitle: {
    fontFamily: SERIF_BOLD,
    fontSize: 8.5,
    color: C.maroon,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderFaint,
    paddingBottom: 3,
    marginBottom: 4,
    marginTop: 8,
  },
  ogHeadRow: { flexDirection: "row", backgroundColor: C.goldBg2 },
  ogBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },

  // Right tax panel
  totalsRight: { width: 185, borderWidth: 1, borderColor: C.border },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  txAlt: { backgroundColor: C.bg },
  txHighlight: { backgroundColor: C.goldBg },
  txLabel: { fontSize: 8, color: C.textMuted },
  txLabelBold: { fontFamily: SERIF_BOLD, fontSize: 8, color: C.textMid },
  txVal: { fontSize: 8, color: C.textMid },
  txValBold: { fontFamily: SERIF_BOLD, fontSize: 8, color: C.textDark },
  txValHL: { fontFamily: SERIF_BOLD, fontSize: 11, color: C.maroon },
  netPayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: C.goldBg,
    borderTopWidth: 0.5,
    borderTopColor: C.borderFaint,
  },
  netPayTxt: { fontFamily: SERIF_BOLD, fontSize: 8.5, color: C.maroon },

  // ── TERMS + SIGNATURES ─────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 0.5,
    borderTopColor: C.borderLight,
    paddingTop: 7,
    marginTop: 4,
    gap: 16,
  },
  termsBlock: { flex: 1 },
  termsTitle: {
    fontFamily: SERIF_BOLD,
    fontSize: 8.5,
    color: C.maroon,
    marginBottom: 4,
  },
  termItem: {
    fontSize: 7.5,
    color: "#6B5040",
    lineHeight: 1.5,
    marginBottom: 2,
  },
  sigRow: { flexDirection: "row", gap: 20, alignItems: "flex-end" },
  sigBlock: { width: 95, alignItems: "center" },
  sigSpacer: { height: 26 },
  sigLine: {
    width: 95,
    borderBottomWidth: 0.75,
    borderBottomColor: C.borderLight,
    marginBottom: 3,
  },
  sigLabel: {
    fontFamily: SERIF_BOLD,
    fontSize: 7.5,
    color: C.textMuted,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  sigFor: {
    fontFamily: SERIF_ITALIC,
    fontSize: 7.5,
    color: C.borderLight,
    textAlign: "center",
    marginBottom: 2,
  },
});

// ── Reusable cell components ───────────────────────────
function TH({
  children,
  width,
  last = false,
}: {
  children: React.ReactNode;
  width: string;
  last?: boolean;
}) {
  return (
    <Text style={[s.thBase, { width }, last ? s.cellLast : {}]}>
      {children}
    </Text>
  );
}

function TD({
  children,
  width,
  align = "left",
  bold = false,
  last = false,
}: {
  children: React.ReactNode;
  width: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <Text
      style={[
        s.tdBase,
        { width },
        align === "center"
          ? s.cellCenter
          : align === "right"
            ? s.cellRight
            : {},
        bold ? s.cellBold : {},
        last ? s.cellLast : {},
      ]}
    >
      {children}
    </Text>
  );
}

function TaxRow({
  label,
  value,
  bold = false,
  highlight = false,
  alt = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  alt?: boolean;
}) {
  return (
    <View style={[s.txRow, highlight ? s.txHighlight : alt ? s.txAlt : {}]}>
      <Text style={bold ? s.txLabelBold : s.txLabel}>{label}</Text>
      <Text style={highlight ? s.txValHL : bold ? s.txValBold : s.txVal}>
        {value}
      </Text>
    </View>
  );
}

// ── Main PDF Document ──────────────────────────────────
export function EstimateInvoice({ data }: { data: InvoiceData }) {
  const shop = data.shopDetails;

  // ── Mirror GSTInvoice.tsx GST calculation exactly ──
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
        : item.type === "Silver" ? (item?.purity === "18k"
          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
          : item?.purity === "22k"
          ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
          : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)
        )
        : (item.price ?? 0) / item.weight;
    metalValue += rate * item.weight;
    makingValue += item.makingCharge ?? 0;
  });
  const gstOnMetal = shop?.gstOnMetal ?? 0;
  const gstOnMaking = shop?.gstOnMakingCharge ?? 0;

  const metalGST = (metalValue * gstOnMetal) / 100;
  const makingGST = (makingValue * gstOnMaking) / 100;

  // isInterState: GSTInvoice currently hardcodes `if (false)` → always CGST+SGST
  // Keep the same logic; we pass isInterState through InvoiceData if available
  

  const subTotal = metalValue + makingValue;
  const totalDiscount = ((subTotal * (data?.discount ?? 0)) / 100);
  //const totalTax = cgst + sgst + igst;
  const invoiceValue = subTotal - totalDiscount;
  const oldDeduction = data.oldItems?.reduce((s, i) => s + i.price, 0) ?? 0;
  const grandTotal = invoiceValue - oldDeduction;
  const grossWeight = data.items.reduce((s, i) => s + i.weight, 0);

  // Span widths for gross weight row
  const grossLabelSpan = `${COL_W.sno + COL_W.desc + COL_W.hsn + COL_W.purity}%`;
  const grossRemainSpan = `${COL_W.huid + COL_W.rate + COL_W.making + COL_W.taxable}%`;

  const termsLines = (shop?.termsAndConditions ?? "")
    .split(".")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ══════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════ */}
        <View style={s.headerRow}>
          {/* Left — logo + shop name */}
          <View style={s.headerLeft}>
            <View>
                         <View style={s.logoCircle}>
                          <Image src={Logo.image} style={s.logoImg} />
                        </View>
                        <Image src={hallmarkLogo.image} style={s.hallMarkLogoImg} />
                       </View>
            <View>
              <Text style={s.shopName}>
              {shop?.name ?? "SRI LAKKHI JEWELLERS"}
            </Text>
            <Text style={s.shopTagline}>
              Since 2000
            </Text>
            </View>
          </View>

          {/* Right — invoice meta + TAX INVOICE + shop info */}
          <View style={s.headerRight}>
            <Text style={s.metaLine}>
              Invoice No.: <Text style={s.metaBold}>{data.invoiceNo}</Text>
            </Text>
            <Text style={s.metaLine}>
              Date: <Text style={s.metaBold}>{data.date}</Text>
            </Text>
            <Text style={s.taxLabel}>ESTIMATE INVOICE</Text>
            <Text style={s.metaLine}>{shop?.address}</Text>
            <Text style={s.metaLine}>AC/NO: {shop?.accountNumber}</Text>
            <Text style={s.metaLine}>IFSC Code: {shop?.ifscCode}</Text>
            <Text style={s.metaLine}>Mobile: {shop?.contactNumber}</Text>
          </View>
        </View>

        {/* Gold divider */}
        <View style={s.goldRule} />

        {/* ══════════════════════════════════════════
            CUSTOMER DETAILS
        ══════════════════════════════════════════ */}
        <View style={s.customerBox}>
          <Text style={s.sectionTitle}>Customer Details</Text>
          <View style={s.custHalf}>
            <Text style={s.fLabel}>Name:</Text>
            <Text style={s.fValue}>{data.customer?.name}</Text>
          </View>
          <View style={s.custHalf}>
            <Text style={s.fLabel}>Mobile:</Text>
            <Text style={s.fValue}>{data.customer?.phone}</Text>
          </View>
          <View style={s.custFieldFull}>
            <Text style={s.fLabel}>Address:</Text>
            <Text style={s.fValue}>{data.customer?.adress}</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════
            ITEMS TABLE
        ══════════════════════════════════════════ */}
        <View style={s.tableWrap}>
          {/* Head */}
          <View style={s.tHeadRow}>
            <TH width={COL.sno}>S.No</TH>
            <TH width={COL.desc}>Description</TH>
            <TH width={COL.hsn}>HSN Code</TH>
            <TH width={COL.purity}>Purity</TH>
            <TH width={COL.gross}>Gross Wt{"\n"}(g)</TH>
            <TH width={COL.huid}>HUID</TH>
            <TH width={COL.rate}>Rate{"\n"}(₹/g)</TH>
            <TH width={COL.making}>Making{"\n"}Chg (₹)</TH>
            <TH width={COL.taxable} last>
             Amt (₹)
            </TH>
          </View>

          {/* Item rows */}
          {data.items.map((item, idx) => {
            const rate =
              item.type === "Gold"
                    ? (item?.purity === "18k"
                        ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) * 0.75
                        : item?.purity === "22k"
                          ? ((data.shopDetails?.goldRatePer10g ?? 0) / 10) *
                            0.916
                          : (data.shopDetails?.goldRatePer10g ?? 0) / 10
                      )
                : item.type === "Silver" ? (item?.purity === "18k"
                  ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.75
                  : item?.purity === "22k"
                  ? ((data.shopDetails?.silverRatePerKg ?? 0) / 1000) * 0.916
                  : ((data.shopDetails?.silverRatePerKg ?? 0) / 1000)
                ) : (item.price ?? 0) / item.weight;
            const taxable = rate * item.weight + (item.makingCharge ?? 0) ;

            return (
              <View
                key={idx}
                style={idx % 2 === 0 ? s.tBodyRow : s.tBodyRowAlt}
              >
                <TD width={COL.sno} align="center">
                  {String(idx + 1)}
                </TD>
                <TD width={COL.desc} bold>
                  {item.name}
                </TD>
                <TD width={COL.hsn} align="center">
                  {item.hsn}
                </TD>
                <TD width={COL.purity} align="center">
                  {item.purity}
                </TD>
                <TD width={COL.gross} align="right">
                  {fmtN(item.weight)}
                </TD>
                <TD width={COL.huid} align="center">
                  {item.huid ?? "—"}
                </TD>
                <TD width={COL.rate} align="right">
                  {rate.toLocaleString("en-IN")}
                </TD>
                <TD width={COL.making} align="right">
                  {(item.makingCharge ?? 0).toLocaleString("en-IN")}
                </TD>
                <TD width={COL.taxable} align="right" bold last>
                  {taxable.toLocaleString("en-IN")}
                </TD>
              </View>
            );
          })}

          {/* Gross weight row */}
          <View style={s.tGrossRow}>
            <Text
              style={[
                s.tdBase,
                s.cellBold,
                s.cellRight,
                {
                  width: grossLabelSpan,
                  borderRightWidth: 0.5,
                  borderRightColor: C.borderLight,
                },
              ]}
            >
              Gross Weight
            </Text>
            <Text
              style={[
                s.tdBase,
                s.cellBold,
                s.cellRight,
                {
                  width: COL.gross,
                  borderRightWidth: 0.5,
                  borderRightColor: C.borderLight,
                },
              ]}
            >
              {fmtN(grossWeight)}g
            </Text>
            <Text
              style={[
                s.tdBase,
                s.cellLast,
                { width: grossRemainSpan, borderRightWidth: 0 },
              ]}
            >
              {" "}
            </Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════
            GST BREAKDOWN TABLE
            Matches the new HTML section exactly
        ══════════════════════════════════════════ */}
        
        {/* ══════════════════════════════════════════
            TOTALS SECTION
        ══════════════════════════════════════════ */}
        <View style={s.totalsRow}>
          {/* Left — grand total words + old gold exchange */}
          <View style={s.totalsLeft}>
            {/* TOP CONTENT */}
            <View>
              <Text style={s.grandFig}>
                Grand Total (In Figures):{" "}
                <Text style={s.grandFigVal}>{fmtINR(grandTotal)}</Text>
              </Text>

              <Text style={s.grandWords}>
                <Text style={s.grandWordsBold}>Grand Total (In Words): </Text>
                {toCurrency(grandTotal, { localeCode: "en-IN" })}
              </Text>
            </View>

            {/* BOTTOM CONTENT (Old Gold) */}
            {data.oldItems && data.oldItems.length > 0 && (
              <View>
                <Text style={s.oldGoldTitle}>Old Gold Exchange</Text>

                <View
                  style={[
                    s.ogHeadRow,
                    { borderWidth: 0.5, borderColor: C.border },
                  ]}
                >
                  {["Item", "Purity", "Weight (g)", "Price (₹)"].map(
                    (h, i, arr) => (
                      <Text
                        key={h}
                        style={[
                          s.thBase,
                          { width: Object.values(OGCOL)[i] },
                          i === arr.length - 1 ? s.cellLast : {},
                        ]}
                      >
                        {h}
                      </Text>
                    ),
                  )}
                </View>

                {data.oldItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      s.ogBodyRow,
                      {
                        borderWidth: 0.5,
                        borderColor: C.borderLight,
                        borderTopWidth: 0,
                      },
                    ]}
                  >
                    <TD width={OGCOL.item} align="center">
                      {item.name}
                    </TD>
                    <TD width={OGCOL.purity} align="center">
                      {item.purity}
                    </TD>
                    <TD width={OGCOL.weight} align="right">
                      {String(item.weight)}
                    </TD>
                    <TD width={OGCOL.price} align="right" bold last>
                      {item.price.toLocaleString("en-IN")}
                    </TD>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right — tax breakdown panel */}
          <View style={s.totalsRight}>
            <TaxRow label="Sub-Total" value={fmtINR(subTotal)} alt />
            {/* <TaxRow label="CGST (Split GST)" value={fmtINR(cgst)} />
            <TaxRow label="SGST (Split GST)" value={fmtINR(sgst)} alt />
            <TaxRow label="IGST (If Applicable)" value={fmtINR(igst)} />
            <TaxRow label="Total Tax Amt" value={fmtINR(totalTax)} bold alt /> */}
            <TaxRow label="Total Discounts" value={`${fmtINR(totalDiscount)}(${(data?.discount)}%)`} />
            <TaxRow label="Invoice Value" value={fmtINR(invoiceValue)} />
            <TaxRow
              label="Grand Total"
              value={fmtINR(grandTotal)}
              bold
              highlight
            />

            {/* Net payment (only shown when old gold exchange present) */}
            {data.oldItems && data.oldItems.length > 0 && (
              <View style={s.netPayRow}>
                <Text style={s.netPayTxt}>Net Payment</Text>
                <Text style={s.netPayTxt}>{fmtINR(grandTotal)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════
            TERMS + SIGNATURES
        ══════════════════════════════════════════ */}
        <View style={s.bottomRow}>
          {/* Terms */}
          <View style={s.termsBlock}>
            <Text style={s.termsTitle}>Terms &amp; Conditions</Text>
            {termsLines.map((t, i) => (
              <Text key={i} style={s.termItem}>
                {i + 1}. {t}.
              </Text>
            ))}
          </View>

          {/* Signatures */}
          <View style={s.sigRow}>
            {/* Customer */}
            <View style={s.sigBlock}>
              <View style={s.sigSpacer} />
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Customer Signature</Text>
            </View>

            {/* Authorised */}
            <View style={s.sigBlock}>
              <Text style={s.sigFor}>
                For {shop?.name ?? "Sri Lakhhi Jewellers"}
              </Text>
              <View style={s.sigSpacer} />
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        {/* Bottom gold rule */}
        <View style={[s.goldRule, { marginTop: 8 }]} />
      </Page>
    </Document>
  );
}

// ── Usage ──────────────────────────────────────────────
//
// Browser preview:
//   import { PDFViewer } from "@react-pdf/renderer";
//   <PDFViewer width="100%" height={900}><GSTInvoicePDF data={data} /></PDFViewer>
//
// Download:
//   import { PDFDownloadLink } from "@react-pdf/renderer";
//   <PDFDownloadLink document={<GSTInvoicePDF data={data} />} fileName="invoice.pdf">
//     {({ loading }) => loading ? "Generating…" : "Download PDF"}
//   </PDFDownloadLink>
//
// Blob (for API upload):
//   import { pdf } from "@react-pdf/renderer";
//   const blob = await pdf(<GSTInvoicePDF data={data} />).toBlob();
