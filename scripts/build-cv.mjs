/**
 * Génère public/CV_Evann_Bougoula.pdf à partir de la page /cv de l'export
 * statique (même données que le portfolio).
 *
 * Usage : npm run build && node scripts/build-cv.mjs
 * CHROMIUM_PATH : chemin optionnel vers un Chromium déjà installé.
 */
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { chromium } from "@playwright/test";

const port = 4399;
const target = new URL("../public/CV_Evann_Bougoula.pdf", import.meta.url);
const server = spawn(process.execPath, ["scripts/serve.mjs", String(port), "out"], { stdio: "ignore" });

try {
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/cv`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: target.pathname, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  const { size } = await stat(target);
  console.log(`CV généré : public/CV_Evann_Bougoula.pdf (${Math.round(size / 1024)} Ko)`);
} finally {
  server.kill();
}
