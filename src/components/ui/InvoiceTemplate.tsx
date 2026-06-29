// components/InvoiceTemplate.tsx

export default function InvoiceTemplate({ data }: any) {
  return (
    <div id="invoice" className="bg-white text-black font-serif">

      {/* A4 Container */}
      <div className="w-[794px] mx-auto p-6">

        {/* 🔷 HEADER */}
        <div className="border border-black p-3">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <div className="w-14 h-14 border flex items-center justify-center text-xs">
                LOGO
              </div>

              <div>
                <h1 className="text-[16px] font-bold">
                  SRI LAKKHI JEWELLERS
                </h1>
                <p>GSTIN: 09ABCDE1234F1Z5</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold">TAX INVOICE</p>
              <p>{data.invoiceNo}</p>
              <p>{data.date}</p>
            </div>
          </div>
        </div>

        {/* 🔷 CUSTOMER */}
        <div className="border border-t-0 border-black p-2">
          <p className="font-bold">Recipient Details</p>
          <p>{data.customer.name}</p>
          <p>{data.customer.address}</p>
        </div>

        {/* 🔷 TABLE */}
        <table className="w-full border border-t-0 border-black text-[11px]">
          <thead className="bg-gray-100 print:bg-white">
            <tr>
              <th className="border p-1">S.No</th>
              <th className="border p-1">Description</th>
              <th className="border p-1">HSN</th>
              <th className="border p-1">Qty</th>
              <th className="border p-1">Rate</th>
              <th className="border p-1">Amount</th>
            </tr>
          </thead>

          <tbody>
            {data.items.map((item: any, i: number) => (
              <tr key={i} className="break-inside-avoid">
                <td className="border p-1 text-center">{i + 1}</td>
                <td className="border p-1">{item.name}</td>
                <td className="border p-1 text-center">{item.hsn}</td>
                <td className="border p-1 text-center">{item.qty}</td>
                <td className="border p-1 text-right">₹{item.rate}</td>
                <td className="border p-1 text-right">
                  ₹{item.qty * item.rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 🔷 TOTAL */}
        <div className="border border-t-0 border-black p-2 text-right">
          <p>Subtotal: ₹{data.subtotal}</p>
          <p>CGST: ₹{data.cgst}</p>
          <p>SGST: ₹{data.sgst}</p>
          <p className="font-bold">Total: ₹{data.total}</p>
        </div>

        {/* 🔷 FOOTER */}
        <div className="border border-t-0 border-black p-2 flex justify-between">
          <div>
            <p className="text-xs">Terms & Conditions</p>
          </div>

          <div className="text-right">
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}