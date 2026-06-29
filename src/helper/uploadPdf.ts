import cloudinary from "@/src/lib/cloudinary";

export async function uploadPDF(pdfBuffer: Buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "invoices",
        public_id: `invoice_${Date.now()}`,
        format: "pdf", // ✅ IMPORTANT
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(pdfBuffer);
  });
}