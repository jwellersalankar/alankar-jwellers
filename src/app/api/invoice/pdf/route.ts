import { getBrowser } from "@/src/lib/puppeteer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { html } = await req.json();

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await page.close();

  return new Response(new Uint8Array(pdfBuffer), {  // ✅ FIX
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=invoice.pdf",
    },
  });
}