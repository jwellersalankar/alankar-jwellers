import fs from "fs";
import path from "path";

export function getLogoBase64() {
  const logoPath = path.join(process.cwd(), "public/logo.png");
  const logoBase64 = fs.readFileSync(logoPath, "base64");

  return `data:image/png;base64,${logoBase64}`;
}