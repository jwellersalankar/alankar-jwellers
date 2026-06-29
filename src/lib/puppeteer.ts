import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

let cachedBrowser: any = null;

export async function getBrowser() {
  const isProd = process.env.NODE_ENV === "production";

  if (cachedBrowser) return cachedBrowser;

  try {
    if (isProd) {
      cachedBrowser = await puppeteer.launch({
        args: [
          ...chromium.args,
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
        executablePath: await chromium.executablePath(),
        headless: true,
        defaultViewport: {
          width: 794,
          height: 1123,
          deviceScaleFactor: 2,
        },
        timeout: 30000,
      });
    } else {
      cachedBrowser = await puppeteer.launch({
        headless: true,
        channel: "chrome",
        defaultViewport: {
          width: 794,
          height: 1123,
          deviceScaleFactor: 2,
        },
        timeout: 30000,
      });
    }

    return cachedBrowser;
  } catch (error) {
    console.error("❌ Puppeteer launch failed:", error);
    throw error;
  }
}