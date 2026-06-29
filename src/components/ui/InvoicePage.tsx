"use client";

import html2pdf from "html2pdf.js";
import InvoiceTemplate from "@/src/components/ui/InvoiceTemplate";

export default function InvoicePage({ data }: any) {

  const handlePrint = () => {
    window.print(); // 🔥 native print
  };

  const handleDownload = () => {
    const element = document.getElementById("invoice");

    if (!element) return;

    html2pdf()
      .set({
        margin: 0,
        filename: `invoice-${data.invoiceNo}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <div className="bg-gray-200 p-6">

      {/* 🔥 ACTION BAR */}
      <div className="flex gap-3 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Print
        </button>

        <button
          onClick={handleDownload}
          className="bg-[#6B2020] text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>
      </div>

      {/* 🔥 INVOICE */}
      <InvoiceTemplate data={data} />
    </div>
  );
}