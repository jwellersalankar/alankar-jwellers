import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const filePath = path.join(process.cwd(), "public", "gst.css");
  const cssContent = fs.readFileSync(filePath, "utf-8");

  return new Response(cssContent, {
    headers: {
      "Content-Type": "text/css",
    },
  });
}