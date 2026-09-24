/**
 * Serveur statique minimal (sans dépendance) pour prévisualiser l'export
 * Next.js (`out/`) et exécuter les tests de bout en bout.
 * En production, l'image Docker utilise nginx avec les mêmes en-têtes.
 *
 * Usage : node scripts/serve.mjs [port] [dossier]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);
const root = resolve(process.argv[3] ?? "out");
const headers = JSON.parse(await readFile(new URL("../deploy/security-headers.json", import.meta.url), "utf8"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".webmanifest": "application/manifest+json",
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const candidates = [clean, `${clean}.html`, join(clean, "index.html")];
  for (const c of candidates) {
    const full = join(root, c);
    if (!full.startsWith(root)) continue;
    try {
      if ((await stat(full)).isFile()) return full;
    } catch {
      /* suivant */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? "/");
  const target = file ?? join(root, "404.html");
  try {
    const body = await readFile(target);
    const type = TYPES[extname(target)] ?? "application/octet-stream";
    const immutable = target.includes(`${join("_next", "static")}`);
    res.writeHead(file ? 200 : 404, {
      ...headers,
      "Content-Type": type,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(500).end("Erreur serveur");
  }
}).listen(port, () => {
  console.log(`Portfolio servi sur http://localhost:${port} (dossier ${root})`);
});
