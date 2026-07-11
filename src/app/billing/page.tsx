"use client";

import {
  RefObject,
  use,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Trash2,
  Plus,
  Printer,
  Save,
  Download,
  Search,
  Form,
  Camera,
  CheckCircle2,
} from "lucide-react";
import NavBar from "@/src/components/core/NavBar";
import Footer from "@/src/components/core/Footer";
import html2pdf from "html2pdf.js";
import { renderToStaticMarkup } from "react-dom/server";
import InvoiceTemplate from "@/src/components/ui/InvoiceTemplate";
import GSTInvoice from "@/src/components/ui/GSTInvoice";
import { ICustomer } from "@/src/models/Customer";
import { IPRODUCTS } from "@/src/models/Product";
import axios from "axios";
import { useDebounceCallback } from "usehooks-ts";
import CreateProductModal from "@/src/components/products/CreateProduct";
import { IProduct } from "@/src/models/OldProduct";
import CreateOldProductModal from "@/src/components/products/CreateOldProduct";
import { ISHOP } from "@/src/models/Shop";
import html2canvaspro from "html2canvas-pro";
import dynamic from "next/dynamic";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { GSTInvoicePDF } from "@/src/components/ui/GSTInvoicePDF";
import { EstimateInvoice } from "@/src/components/ui/EstimateInvoice";
import { useRouter } from "next/navigation";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import debounce from "lodash/debounce";
import { useDevice } from "@/src/hooks/useDevice";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import BarcodeScannerModal from "@/src/components/products/BarcodeScannerModal";

// ── Types ──────────────────────────────────────────────
type LineItem = {
  id: string;
  name: string;
  subtitle: string;
  weightG: number;
  rate: number;
};

type ClientInfo = {
  name: string;
  adress: string;
  phone: string;
  email: string;
  contact: string;
  dueAmount: number;
  dob: Date;
  anniversary: Date;
};

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  customer: ICustomer | null;
  items: IPRODUCTS[];
  oldItems?: IProduct[];
  shopDetails?: ISHOP | null;
  discount?: number;
  documentType?: string;
  customerGSTIN?: string;
}

// ── Helpers ────────────────────────────────────────────
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

const TAX_RATE = 0.02; // 2% insurance & tax

// ── Input Field ────────────────────────────────────────
function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        className="text-[#9E8A7E] tracking-[0.08em] uppercase"
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: "10px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-[#3D2B1F]/30 text-[#3D2B1F] placeholder-[#6B5040]/50 pb-2 focus:outline-none focus:border-[#8B6914] transition-colors duration-200 w-full"
        style={{ fontFamily: "'Georgia', serif", fontSize: "15px" }}
      />
    </div>
  );
}
export function generateHTML(data: InvoiceData) {
  return `
    <html>
    <link rel="stylesheet" href="http://localhost:3000/invoice.min.css" />
      <head>
        <style>
          @page { size: A4; }
          body { margin: 0; }
        </style>
      </head>
      <body>
        ${renderToStaticMarkup(<GSTInvoice data={data} />)}
      </body>
    </html>
  `;
}

// ── Main Component ─────────────────────────────────────
function BillingMainSection() {
  const [client, setClient] = useState<ICustomer | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<IPRODUCTS[]>([]);
  const [selectedItems, setSelectedItems] = useState<IPRODUCTS[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounceCallback(setSearch, 300);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [oldProducts, setOldProducts] = useState<IProduct[]>([]);
  const [openOldProduct, setOpenOldProduct] = useState(false);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [shopDetails, setShopDetails] = useState<ISHOP | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [documentType, setDocumentType] = useState<
    "invoice" | "credit_note" | "debit_note"
  >("invoice");

  const [referenceInvoice, setReferenceInvoice] = useState<any>(null);

  const [adjustmentReason, setAdjustmentReason] = useState<
    "return" | "price_increase" | "price_decrease" | "gst_correction"
  >("return");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");

  const router = useRouter();

  const { data: session, status } = useSession();
  const [scanSuccess, setScanSuccess] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<NodeJS.Timeout | null>(null);

  const { isMobile } = useDevice();

  const {
    videoRef,
    isOpen,
    loading: scannerLoading,
    error: scannerError,
    startScanner,
    stopScanner,
    switchCamera,
    devices,
  } = useBarcodeScanner((barcode) => {
    setSearch(barcode);

    setScanSuccess(true);

    if (successTimer.current) {
      clearTimeout(successTimer.current);
    }

    successTimer.current = setTimeout(() => {
      setScanSuccess(false);
    }, 1500);
  });

  useEffect(() => {
    if (isMobile) return;

    let buffer = "";

    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length >= 4) {
          setSearch(buffer);

          barcodeInputRef.current?.focus();
        }

        buffer = "";

        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
      }

      clearTimeout(timeout);

      timeout = setTimeout(() => {
        buffer = "";
      }, 100);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile]);

  const handleBarcodeClick = () => {
    if (isMobile) {
      startScanner();

      return;
    }

    barcodeInputRef.current?.focus();
  };

  useEffect(() => {
    if (status === "loading") return; // ⛔ wait

    if (status === "unauthenticated") {
      router.replace("/sign-in");
      return;
    }

    if (status === "authenticated") {
      setUser(session.user as User);
    }

    if (status === "authenticated" && session.user?.verified === false) {
      router.replace("/");
    }
  }, [status, session]);

  const grossWeight = selectedItems.reduce((s, i) => s + i.weight, 0);
  const subTotal = selectedItems.reduce(
    (s, i) =>
      s +
      (i.type === "Gold"
        ? ((shopDetails?.goldRatePer10g ?? 0) * i.weight) / 10
        : ((shopDetails?.silverRatePerKg ?? 0) * i.weight) / 1000),
    0,
  );
  const cgst =
    Math.round(
      ((subTotal * (shopDetails?.gstOnMetal ?? shopDetails?.gstOnMetal ?? 0)) /
        100) *
        100,
    ) /
    100 /
    2;
  const sgst = cgst;
  const igst =
    Math.round(
      ((subTotal * (shopDetails?.gstOnMetal ?? shopDetails?.gstOnMetal ?? 0)) /
        100) *
        100,
    ) / 100;
  const totalTax = cgst + sgst;
  const invoiceValue = subTotal - (subTotal * discount) / 100 + totalTax;
  const grandTotal =
    invoiceValue - (oldProducts?.reduce((s, i) => s + i.price, 0) ?? 0);
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const updateMakingCharge = (id: string, value: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item._id.toString() === id
          ? ({ ...item, makingCharge: value } as IPRODUCTS)
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i._id.toString() !== id));
    setProducts((prev) =>
      prev.map((i) =>
        i?._id?.toString() === id
          ? ({ ...i, stock: (i.stock || 0) + 1 } as IPRODUCTS)
          : i,
      ),
    );
  };

  const removeOldItem = (idx: number) => {
    setOldProducts((prev) => prev.filter((_, i) => i !== i));
  };

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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `/api/get-product?limit=${5}&search=${search}`,
        );

        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          console.error("Failed to fetch products:", response.data.message);
        }
      } catch (error: any) {
        console.error("Error fetching products:", error?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search]);

  const handleSaveNewProduct = (data: IPRODUCTS) => {
    setProducts((prevProducts) => [data, ...(prevProducts || [])]);
    setOpenCreateModal(false);
  };

  const generateInvoiceNumber = (type: string) => {
    const now = new Date();

    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");

    const time = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");

    const prefix =
      type === "credit_note" ? "CN" : type === "debit_note" ? "DN" : "INV";

    return `${prefix}/${timestamp}/${time}`;
  };

  useEffect(() => {
    setInvoiceNo(generateInvoiceNumber(documentType));
  }, [documentType]);

  useEffect(() => {
    setData({
      invoiceNo: invoiceNo,
      date: invoiceDate,
      customer: client,
      items: selectedItems,
      oldItems: oldProducts,
      shopDetails: shopDetails,
      discount: discount,
      documentType: documentType,
    });
  }, [
    client,
    selectedItems,
    oldProducts,
    shopDetails,
    documentType,
    referenceInvoice,
  ]);

  const deferredData = useDeferredValue(data);

  const generatePDFBlob = async (data: any) => {
    const blob = await pdf(<GSTInvoicePDF data={data} />).toBlob();
    return blob;
  };

  const generateEstimateBlob = async (data: any) => {
    const blob = await pdf(<EstimateInvoice data={data} />).toBlob();
    return blob;
  };

  const handleDownload = async () => {
    if (!data) return;
    const pdfBlob = await generatePDFBlob(data);
    const blob = new Blob([pdfBlob], { type: "application/pdf" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    a.click();
  };

  const handlePrint = async () => {
    if (!data) return;

    try {
      const blob = await generatePDFBlob(data);
      const url = URL.createObjectURL(blob);

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile browsers don't reliably support auto-printing PDFs.
        // Open the PDF so the user can use the browser's Print option.
        window.open(url, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);

        return;
      }

      // Desktop
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        return;
      }

      printWindow.document.write(`
      <iframe
              src="${url}"
              style="width:100%;height:100%;border:none"
            />
    `);

      printWindow.document.close();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000);
    } catch (error) {
      console.error("Print failed:", error);
    }
  };

  const searchInvoices = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value.trim()) {
          setInvoiceResults([]);
          return;
        }

        const res = await axios.get(`/api/invoices/search?q=${value}`);

        console.log("res: ", res);

        setInvoiceResults(res.data.data || []);
      }, 300),
    [],
  );

  const handleFinalize = async () => {
    if (!data) return;

    setFinalizing(true);

    try {
      const pdfBlob = await generatePDFBlob(data);

      const placeOfSupply = shopDetails?.gstin?.slice(0, 2) || "10";

      // =========================
      // INVOICE
      // =========================
      if (documentType === "invoice") {
        const formattedItems = selectedItems.map((item) => ({
          productId: item._id,
          quantity: 1,
          makingCharge: item.makingCharge || 0,
        }));

        const body = {
          customerDetails: client,

          items: formattedItems,

          oldProducts,

          billingDetails: {
            invoiceNumber: invoiceNo,
            invoiceDate,

            sellerGSTIN: shopDetails?.gstin,

            placeOfSupply,

            isInterState: false,

            goldRatePer10g: shopDetails?.goldRatePer10g,

            silverRatePerKg: shopDetails?.silverRatePerKg,

            metalGSTRate: shopDetails?.gstOnMetal,

            makingGSTRate: shopDetails?.gstOnMakingCharge,

            grossWeight,

            customDuty: 0,

            discount,
          },
        };

        const formData = new FormData();

        formData.append(
          "file",
          new File([pdfBlob], `${invoiceNo}.pdf`, {
            type: "application/pdf",
          }),
        );

        formData.append("body", JSON.stringify(body));

        const res = await axios.post("/api/create-bill", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data.success) {
          const url = res.data.pdf;

           const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile browsers don't reliably support auto-printing PDFs.
        // Open the PDF so the user can use the browser's Print option.
        window.open(url, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);

        return;
      }

      // Desktop
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        return;
      }

      printWindow.document.write(`
      <iframe
              src="${url}"
              style="width:100%;height:100%;border:none"
            />
    `);

      printWindow.document.close();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000);
        }
      }

      // =========================
      // CREDIT / DEBIT NOTE
      // =========================
      else {
        if (!referenceInvoice) {
          throw new Error("Reference invoice is required");
        }

        const formData = new FormData();

        formData.append(
          "file",
          new File([pdfBlob], `${invoiceNo}.pdf`, {
            type: "application/pdf",
          }),
        );

        const body = {
          orderId: referenceInvoice._id,

          noteNumber: invoiceNo,

          type: documentType,

          reason: adjustmentReason,

          reasonDescription: "",

          settlementMode: "pending",

          products: selectedItems.map((item: any) => ({
            productId: item.productId,

            quantity: item.adjustmentQuantity || 1,

            adjustedMetalPrice: item.adjustedMetalPrice,

            adjustedMakingCharge: item.adjustedMakingCharge,
          })),
        };

        formData.append("body", JSON.stringify(body));

        const res = await axios.post("/api/create-adjustment", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data.success) {
  const url = res.data.pdf || res.data.noteUrl;

  if (!url) return;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // Open the PDF directly in a new tab (or PDF viewer)
    window.open(url, "_blank");
  } else {
    // Desktop: open in a print-friendly window
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <iframe
              src="${url}"
              style="width:100%;height:100%;border:none"
            />
      `);

      printWindow.document.close();
    }
  }
}
      }
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleEstimatePrint = async () => {
    if (!data) return;
    const estimateBlob = await generateEstimateBlob(data);

    const url = URL.createObjectURL(estimateBlob);

     const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile browsers don't reliably support auto-printing PDFs.
        // Open the PDF so the user can use the browser's Print option.
        window.open(url, "_blank");

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000);

        return;
      }

      // Desktop
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        return;
      }

      printWindow.document.write(`
      <iframe
              src="${url}"
              style="width:100%;height:100%;border:none"
            />
    `);

      printWindow.document.close();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000);
  };

  function setCustomer(customer: any) {
    throw new Error("Function not implemented.");
  }

  // function setCustomerDetails(arg0: {
  //   name: any;
  //   phone: any;
  //   email: any;
  //   address: any;
  //   gstin: any;
  // }) {
  //   throw new Error("Function not implemented.");
  // }

  const addProductForAdjustment = (product: IPRODUCTS) => {
    console.log("Adding:", product);

    setSelectedItems((prev) => {
      console.log("Prev:", prev);

      const exists = prev.some((p) => p._id === product._id);

      if (exists) {
        console.log("Already exists");
        return prev;
      }

      const updated = [...prev, product];

      console.log("Updated:", updated);

      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F7] px-6 md:px-12 lg:px-16 pt-12 pb-20 flex flex-col lg:flex-row gap-10">
      {/* ══════════════════════════════════════════
          LEFT PANEL — Form
      ══════════════════════════════════════════ */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1
            className="text-[#8B2020] mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(26px, 3vw, 38px)",
              fontWeight: 700,
            }}
          >
            {documentType === "invoice"
              ? "Create New Invoice"
              : documentType === "credit_note"
                ? "Create Credit Note"
                : "Create Debit Note"}
          </h1>
          <p
            className="text-[#9E8A7E] leading-[1.6]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "14px" }}
          >
            Enter client details and curate the item list for this heirloom
            transaction.
          </p>
        </div>

        {/* Client Information */}
        <div>
          <p
            className="text-[#8B6914] tracking-[0.15em] uppercase mb-5"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Customer Information
          </p>

          <div className="flex flex-col gap-6">
            <FormInput
              label="Full Name"
              placeholder="Full Name"
              value={client?.name || ""}
              onChange={(v) =>
                setClient((c) => ({ ...c, name: v }) as ICustomer | null)
              }
            />
            <div className="flex gap-4">
              <FormInput
                label="Address"
                placeholder="Enter Address"
                value={client?.adress || ""}
                onChange={(v) =>
                  setClient((c) => ({ ...c, adress: v }) as ICustomer | null)
                }
                className="flex-1"
              />
              <FormInput
                label="Contact Number"
                placeholder="+91 00000 00000"
                value={client?.phone || ""}
                onChange={(v) =>
                  setClient((c) => ({ ...c, phone: v }) as ICustomer | null)
                }
                className="flex-1"
              />
            </div>
            <div className="flex gap-4">
              <FormInput
                label="Birth Date"
                placeholder="Enter your birthday"
                value={
                  client?.dob ? client.dob.toISOString().split("T")[0] : ""
                }
                onChange={(v) =>
                  setClient(
                    (c) => ({ ...c, dob: new Date(v) }) as ICustomer | null,
                  )
                }
                type="Date"
                className="flex-1"
              />
              <FormInput
                label="Marriage Date"
                placeholder="Enter your marriage date"
                value={
                  client?.anniversary
                    ? client.anniversary.toISOString().split("T")[0]
                    : ""
                }
                onChange={(v) =>
                  setClient(
                    (c) =>
                      ({ ...c, anniversary: new Date(v) }) as ICustomer | null,
                  )
                }
                type="Date"
                className="flex-1"
              />
            </div>
            <FormInput
              label="Customer GSTIN"
              placeholder="Enter Customer GSTIN"
              value={client?.customerGSTIN || ""}
              onChange={(v) =>
                setClient(
                  (c) => ({ ...c, customerGSTIN: v }) as ICustomer | null,
                )
              }
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <p
            className="text-[#8B6914] tracking-[0.15em] uppercase mb-4"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Document Type
          </p>

          <select
            value={documentType}
            onChange={(e) => {
              setDocumentType(
                e.target.value as "invoice" | "credit_note" | "debit_note",
              );
              setInvoiceNo(generateInvoiceNumber(e.target.value));
            }}
            className="w-full bg-transparent border-b border-[#3D2B1F]/30 pb-2 text-[#3D2B1F] focus:outline-none"
          >
            <option value="invoice">Tax Invoice</option>

            <option value="credit_note">Credit Note</option>

            <option value="debit_note">Debit Note</option>
          </select>
        </div>

        {documentType !== "invoice" && (
          <div className="mt-6 relative">
            <label
              className="block mb-2 text-[#9E8A7E] tracking-[0.08em] uppercase"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Reference Invoice
            </label>

            <input
              type="text"
              placeholder="Search Invoice Number"
              value={
                referenceInvoice
                  ? referenceInvoice.invoiceNumber
                  : invoiceSearch
              }
              onChange={(e) => {
                setReferenceInvoice(null);

                setInvoiceSearch(e.target.value);

                setShowInvoiceDropdown(true);

                searchInvoices(e.target.value);
              }}
              className="w-full bg-transparent border-b border-[#3D2B1F]/30 pb-2 text-[#3D2B1F] placeholder:text-[#9E8A7E]/70 focus:outline-none"
            />

            {showInvoiceDropdown && invoiceResults.length > 0 && (
              <div className="absolute z-50 mt-2 w-full bg-[#FFFDF8] border border-[#D8CBB8] rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {invoiceResults.map((invoice) => (
                  <button
                    key={invoice._id}
                    type="button"
                    onClick={() => {
                      setReferenceInvoice(invoice);

                      setInvoiceSearch(invoice.invoiceNumber);

                      setShowInvoiceDropdown(false);

                      // Autofill Customer
                      setClient({
                        name: invoice.customer?.name || "",
                        phone: invoice.customer?.phone || "",
                        adress: invoice.customer?.adress || "",
                        dob: invoice.customer?.dob || undefined,
                        anniversary: invoice.customer?.anniversary || undefined,
                      } as ICustomer);

                      // Reset adjustment products
                      setSelectedItems([]); // for now just 1 product, can make dynamic later
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#F8F1E7] transition border-b border-[#EFE4D5] last:border-0"
                  >
                    <div className="font-medium text-[#3D2B1F]">
                      {invoice.invoiceNumber}
                    </div>

                    <div className="text-sm text-[#8A7867]">
                      {invoice.customer?.name}
                    </div>

                    <div className="text-xs text-[#A69380]">
                      {invoice.customer?.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {referenceInvoice && (
              <div className="mt-4 rounded-xl border border-[#D8CBB8] bg-[#FCF8F1] p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#3D2B1F]">
                      {referenceInvoice.invoiceNumber}
                    </p>

                    <p className="text-sm text-[#8A7867]">
                      {referenceInvoice.customer?.name}
                    </p>

                    <p className="text-xs text-[#A69380]">
                      {referenceInvoice.customer?.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#A69380]">Invoice Amount</p>

                    <p className="font-semibold text-[#3D2B1F]">
                      ₹{referenceInvoice.totalPayableAmmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {referenceInvoice && documentType !== "invoice" && (
          <div className="mt-8">
            <h3
              className="mb-4 text-[#8B6914]"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "12px",
                letterSpacing: "0.15em",
              }}
            >
              ORIGINAL INVOICE PRODUCTS
            </h3>

            <div className="space-y-3">
              {referenceInvoice.products.map((product: any) => (
                <div
                  key={product.productId}
                  className="rounded-xl border border-[#E7DCCB] p-4 bg-[#FFFDF8]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#3D2B1F]">
                        {product.name}
                      </p>

                      <p className="text-xs text-[#8A7867]">
                        Sold Qty: {product.quantity}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addProductForAdjustment(product)}
                      className="px-4 py-2 rounded-lg border border-[#8B6914] text-[#8B6914] hover:bg-[#8B6914] hover:text-white transition"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {documentType !== "invoice" && (
          <div className="mt-4">
            <label
              className="text-[#9E8A7E] tracking-[0.08em] uppercase"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Adjustment Reason
            </label>

            <select
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value as any)}
              className="w-full mt-2 bg-transparent border-b text-[#3D2B1F] border-[#3D2B1F]/30 pb-2"
            >
              <option
                className={`${
                  documentType != "credit_note" ? "hidden" : "block"
                }`}
                value="return"
              >
                Product Return
              </option>

              <option
                className={`${
                  documentType != "credit_note" ? "hidden" : "block"
                }`}
                value="price_decrease"
              >
                Price Decrease
              </option>

              <option
                className={`${
                  documentType === "credit_note" ? "hidden" : "block"
                }`}
                value="price_increase"
              >
                Price Increase
              </option>

              <option value="gst_correction">GST Correction</option>
            </select>
          </div>
        )}

        {/* Inventory Selection */}
        <div>
          {/* HEADER */}
          {documentType === "invoice" && (
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-[#8B6914] tracking-[0.15em] uppercase"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Inventory Selection
              </p>

              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-[#3C000D] hover:text-[#C9A84C] transition-colors duration-200"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Add New Item
              </button>
            </div>
          )}

          {/* 🔽 DROPDOWN */}
          {open && (
            <div className="mb-4 bg-[#FAF6F1] border border-[#EADFCF] rounded-md shadow-md p-3">
              {/* SEARCH */}
              <div className="flex items-center gap-2 border-b pb-2 mb-2">
                <Search size={14} className="text-[#b8a898]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full outline-none text-sm placeholder:text-[#b8a898] text-[#3D2B1F]"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
                <button
                  onClick={handleBarcodeClick}
                  className="hover:text-[#6B1A1A] transition-all duration-200 hover:scale-110"
                >
                  <Camera size={18} strokeWidth={2} color="#b8a898" />
                </button>
              </div>
              {scanSuccess && (
                <div
                  className="mt-2 flex items-center gap-2 text-[#2E7D32]"
                  style={{
                    fontFamily: "Georgia",
                    fontSize: 12,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Barcode scanned successfully
                </div>
              )}

              {/* RESULTS */}
              <div className="max-h-48 overflow-y-auto">
                {products?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-3">
                    No products found
                  </p>
                ) : (
                  products?.map((p: IPRODUCTS) => (
                    <div
                      key={p._id.toString()}
                      onClick={() => {
                        // when adding item
                        setSelectedItems((prevSelectedItems) => {
                          const updatedItems = [
                            ...prevSelectedItems,
                            {
                              ...p,
                              makingCharge: p.makingCharge ?? 0,
                            } as IPRODUCTS,
                          ];
                          return updatedItems;
                        });
                        if (p?.stock >= 1) {
                          setProducts((prev) =>
                            prev.map((i) =>
                              i?._id?.toString() === p?._id?.toString()
                                ? ({ ...i, stock: i?.stock - 1 } as IPRODUCTS)
                                : i,
                            ),
                          );
                        }
                        if (p?.stock <= 1) {
                          setProducts((prev) =>
                            prev.filter(
                              (i) => i?._id?.toString() !== p?._id?.toString(),
                            ),
                          );
                        }

                        setOpen(false);
                      }}
                      className="px-3 py-2 hover:bg-[#FFF0F1] rounded cursor-pointer transition"
                    >
                      <p
                        className="text-[#2C1A0E]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {p.name}
                      </p>
                      <p className="text-xs text-[#9E8A7E]">ID: {p?.huid}</p>
                    </div>
                  ))
                )}
              </div>

              {/* FOOTER */}
              <div className="border-t mt-2 pt-2">
                <button
                  onClick={() => {
                    setOpenCreateModal(true);
                  }}
                  className="w-full text-center text-[#3C000D] hover:text-[#C9A84C] text-sm"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontWeight: 600,
                  }}
                >
                  + Create New Product
                </button>
              </div>
            </div>
          )}

          {/* EXISTING ITEMS */}
          <div className="flex flex-col gap-3">
            {selectedItems?.map((item: IPRODUCTS) => (
              <div
                key={item?._id.toString()}
                className="bg-[#FFF0F1] rounded-md px-5 py-4 flex items-start justify-between"
              >
                <div>
                  <p
                    className="text-[#2C1A0E] mb-1"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    {item?.name}
                  </p>
                  <p
                    className="text-[#9E8A7E]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "12px",
                    }}
                  >
                    {`${item?.purity} ${item?.type} · ${item?.weight}g`}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className="text-[#2C1A0E]"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    {fmt(
                      item?.type === "Gold"
                        ? (item?.purity === "18k"
                            ? ((shopDetails?.goldRatePer10g ?? 0) / 10) * 0.75
                            : item?.purity === "22k"
                              ? ((shopDetails?.goldRatePer10g ?? 0) / 10) *
                                0.916
                              : (shopDetails?.goldRatePer10g ?? 0) / 10) *
                            item.weight
                        : item?.type === "Silver"
                          ? (item?.purity === "18k"
                              ? ((shopDetails?.silverRatePerKg ?? 0) / 1000) *
                                0.75
                              : item?.purity === "22k"
                                ? ((shopDetails?.silverRatePerKg ?? 0) / 1000) *
                                  0.916
                                : (shopDetails?.silverRatePerKg ?? 0) / 1000) *
                            item.weight
                          : item.price,
                    )}
                  </span>

                  {/* Making Charge (editable, inline, theme-safe) */}
                  <div>
                    <label htmlFor="making charge" className="text-[#9E8A7E]">
                      Making Charge:
                    </label>
                    <input
                      type="number"
                      value={item.makingCharge ?? ""}
                      onChange={(e) =>
                        updateMakingCharge(
                          item._id.toString(),
                          Number(e.target.value),
                        )
                      }
                      className="bg-transparent border-none outline-none text-center"
                      style={{
                        fontFamily: "'Georgia', serif",
                        color: "#9E8A7E", // same muted tone already used
                        width: "90px",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      removeItem(item?._id.toString());
                      if (item?.stock === 1) {
                        setProducts(
                          (prev) => [...(prev || []), item] as IPRODUCTS[],
                        );
                      }
                    }}
                    className="text-[#C0392B] hover:text-[#96281B]"
                  >
                    <Trash2 size={16} strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {documentType === "invoice" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-[#8B6914] tracking-[0.15em] uppercase"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  OLD PRODUCTS
                </p>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setOpenOldProduct(!open)}
                    className="flex items-center gap-1 text-[#3C000D] hover:text-[#C9A84C] transition-colors duration-200"
                    style={{
                      fontFamily: "'Georgia', serif",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    Add old Item
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {oldProducts?.map((item: IProduct, idx) => (
                  <div
                    key={item?._id?.toString() ?? idx}
                    className="bg-[#FFF0F1] rounded-md px-5 py-4 flex items-start justify-between"
                  >
                    <div>
                      <p
                        className="text-[#2C1A0E] mb-1"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        {item?.name}
                      </p>
                      <p
                        className="text-[#9E8A7E]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "12px",
                        }}
                      >
                        {`${item?.purity} ${item?.type} · ${item?.weight}g`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className="text-[#2C1A0E]"
                        style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        {fmt(item?.price)}
                      </span>

                      <button
                        onClick={() => {
                          removeOldItem(idx);
                        }}
                        className="text-[#C0392B] hover:text-[#96281B]"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between mb-4">
          <p
            className="text-[#8B6914] tracking-[0.15em] uppercase"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Discounts Section
          </p>
          <div className="flex mt-3 gap-3 w-30">
            <FormInput
              label="Discounts In %"
              placeholder="10%"
              type="number"
              value={discount.toString() || ""}
              onChange={(v) => {
                setDiscount(
                  Number(v) > 100 ? 100 : Number(v) < 0 ? 0 : Number(v),
                );
                setData((prev) => {
                  return {
                    ...prev,
                    discount:
                      Number(v) > 100 ? 100 : Number(v) < 0 ? 0 : Number(v),
                  } as InvoiceData;
                });
              }}
              className="flex-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex-1 bg-[#6B1A1A] hover:bg-[#521414] text-white py-4 rounded-md tracking-[0.06em] transition-colors duration-200"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {finalizing ? "Finalizing..." : "Finalize Bill"}
          </button>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#B8943C] text-[#3D2000] mx-auto w-full justify-center py-4 rounded-md tracking-[0.06em] transition-colors duration-200"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 600,
            }}
            onClick={handleEstimatePrint}
          >
            <Printer size={16} strokeWidth={2} />
            Print Estimate Bill
          </button>
        </div>
      </div>
      {openCreateModal && (
        <CreateProductModal
          onClose={() => setOpenCreateModal(false)}
          onSave={(data: IPRODUCTS) => {
            handleSaveNewProduct(data);
          }}
        />
      )}

      {openOldProduct && (
        <CreateOldProductModal
          onClose={() => setOpenOldProduct(false)}
          onSave={(data: IProduct) => {
            setOldProducts((prev) => [data, ...prev]);
            setOpenOldProduct(false);
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Live Preview
      ══════════════════════════════════════════ */}
      <div className="hidden flex-1 lg:flex flex-col gap-4">
        {/* Preview top bar */}
        <div className="flex items-center justify-between px-1">
          <p
            className="text-[#9E8A7E] tracking-[0.15em] uppercase"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Live Preview
          </p>
          <div className="flex gap-5">
            {/* <button
              className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#B8943C] text-[#3D2000] px-5 py-2.5 rounded-md tracking-[0.06em] transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
              onClick={handleDownload}
            >
              <Download size={15} strokeWidth={2} />
              Download PDF
            </button> */}
            {/* <button
              className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#B8943C] text-[#3D2000] px-5 py-2.5 rounded-md tracking-[0.06em] transition-colors duration-200"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
              onClick={handlePrint}
            >
              <Printer size={15} strokeWidth={2} />
              Print PDF
            </button> */}
          </div>
        </div>

        {/* Invoice Card */}
        {/* <InvoiceTemplate data={data} /> */}
        <div ref={contentRef} className=" w-full min:h-screen">
          {data && <GSTInvoice data={data} />}
        </div>
        {/* <PDFViewer width="100%" height={900}><GSTInvoicePDF data={data!} /></PDFViewer> */}
      </div>
      <BarcodeScannerModal
        open={isOpen}
        loading={scannerLoading}
        error={scannerError}
        videoRef={videoRef as RefObject<HTMLVideoElement>}
        onClose={stopScanner}
        switchCamera={switchCamera}
        cameraCount={devices?.length}
      />
    </div>
  );
}

export default function BillingPage() {
  return (
    <div>
      <NavBar />
      <BillingMainSection />
      <Footer />
    </div>
  );
}
function setScanSuccess(arg0: boolean) {
  throw new Error("Function not implemented.");
}
