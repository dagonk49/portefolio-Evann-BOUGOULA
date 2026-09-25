/**
 * Génère public/og-image.png (1200 × 630), l'image des aperçus de lien
 * (Open Graph, LinkedIn, messageries), à partir des données du profil.
 * Polices embarquées (Inter, IBM Plex Mono, licence SIL OFL) : aucun accès réseau.
 *
 * Usage : node scripts/build-og.mjs   (CHROMIUM_PATH optionnel)
 */
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const font = async (path) => (await readFile(new URL(`../node_modules/${path}`, import.meta.url))).toString("base64");
const inter = await font("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const mono = await font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2");

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Plex; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 400; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; background: #0a0a0c; color: #f4f4f5; font-family: Inter, sans-serif; }
.card { position: absolute; inset: 40px; border: 1px solid #27272a; border-radius: 10px; padding: 56px 64px; display: flex; flex-direction: column; }
.kicker { font-family: Plex, monospace; font-size: 22px; letter-spacing: .12em; text-transform: uppercase; color: #a1a1aa; }
h1 { margin-top: 28px; font-size: 104px; font-weight: 650; letter-spacing: -.045em; line-height: .95; }
.status { margin-top: 30px; font-size: 27px; line-height: 1.35; color: #d4d4d8; }
.foot { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding-top: 26px; border-top: 1px solid #27272a; }
.tags { display: flex; flex-wrap: nowrap; gap: 8px; }
.tags span { white-space: nowrap; font-family: Plex, monospace; font-size: 17px; color: #d4d4d8; border: 1px solid #3a3a41; border-radius: 4px; padding: 5px 10px; }
.url { font-family: Plex, monospace; font-size: 19px; color: #a1a1aa; white-space: nowrap; }
.mark { position: absolute; top: 56px; right: 64px; width: 64px; height: 64px; border: 1px solid #3a3a41; border-radius: 6px; display: grid; place-items: center; font-family: Plex, monospace; font-size: 22px; letter-spacing: .06em; }
</style></head><body><div class="card">
  <div class="mark">EB</div>
  <p class="kicker">Portfolio · BTS SIO option SISR</p>
  <h1>Evann Bougoula</h1>
  <p class="status">Alternant technicien informatique chez Établissement Français du Sang (EFS)<br>Étudiant en BTS SIO SISR à MyDigitalSchool Angers</p>
  <div class="foot">
    <div class="tags"><span>Support N1</span><span>Active Directory</span><span>Proxmox</span><span>Docker</span><span>Fiches E5</span></div>
    <p class="url">evann-bougoula.dagz.fr</p>
  </div>
</div></body></html>`;

const target = new URL("../public/og-image.png", import.meta.url);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: target.pathname, type: "png" });
await browser.close();
console.log("Image générée : public/og-image.png (1200 × 630)");
