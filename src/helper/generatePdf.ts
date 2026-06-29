import { log } from "console";
import { getBrowser } from "../lib/puppeteer";

export async function generatePDF(html: string) {
    const browser = await getBrowser(); // ✅ reused
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  console.log(pdf);
  

  await page.close(); // 🔥 important
  console.log("PDF generated successfully");
  return pdf;
}