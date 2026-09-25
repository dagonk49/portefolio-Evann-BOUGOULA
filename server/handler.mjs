/**
 * Point d'entrée HTTP POST /api/contact, sans dépendance : utilisé par le
 * service d'envoi (server/index.mjs, Nodemailer) et par le serveur de
 * prévisualisation (scripts/serve.mjs, envoi simulé).
 *
 * Protections : JSON ou formulaire uniquement, taille limitée, contrôle de
 * l'origine, champ piège, limitation de débit par adresse IP, validation
 * complète côté serveur, en-têtes d'email nettoyés (Reply-To).
 */
import { buildMail, isSpam, validateContact } from "./contact-core.mjs";

const MAX_BODY = 32 * 1024;

/** Limiteur en mémoire : `max` requêtes par fenêtre de `windowMs` et par clé. */
export function createRateLimiter({ max = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const hits = new Map();
  return {
    take(key) {
      const t = now();
      const list = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
      if (list.length >= max) {
        hits.set(key, list);
        return false;
      }
      list.push(t);
      hits.set(key, list);
      if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((at) => t - at < windowMs)) hits.delete(k);
      return true;
    },
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (c) => {
      if (tooLarge) return; // le reste est lu puis ignoré : la réponse 413 part proprement
      size += c.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        chunks.length = 0;
        reject(Object.assign(new Error("too_large"), { status: 413 }));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function clientIp(req, trustProxy) {
  if (trustProxy) {
    const real = req.headers["x-real-ip"];
    if (typeof real === "string" && real) return real.trim();
    const fwd = req.headers["x-forwarded-for"];
    if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "inconnue";
}

/**
 * @param {{
 *   send: (mail: import("./contact-core.mjs").ContactMail) => Promise<unknown>,
 *   to: string, from: string,
 *   allowedOrigins?: string[], trustProxy?: boolean,
 *   limiter?: { take: (key: string) => boolean },
 *   log?: (event: string, detail?: Record<string, unknown>) => void,
 * }} options
 */
export function createContactHandler(options) {
  const { send, to, from, allowedOrigins = [], trustProxy = false, log = () => {} } = options;
  const limiter = options.limiter ?? createRateLimiter();

  return async function handleContact(req, res) {
    const isForm = (req.headers["content-type"] ?? "").startsWith("application/x-www-form-urlencoded");
    const reply = (status, body) => {
      if (isForm) {
        // Formulaire envoyé sans JavaScript : retour sur la page avec le résultat.
        res.writeHead(303, { Location: `/?contact=${body.ok ? "envoye" : "erreur"}#contact`, "Cache-Control": "no-store" });
        res.end();
        return;
      }
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(status === 413 ? { Connection: "close" } : {}),
      });
      res.end(JSON.stringify(body));
    };

    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST", "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
      return;
    }
    const type = req.headers["content-type"] ?? "";
    if (!type.startsWith("application/json") && !isForm) return reply(415, { ok: false, error: "unsupported_media_type" });

    const origin = req.headers.origin;
    if (origin && allowedOrigins.length && !allowedOrigins.includes(origin)) {
      log("origin_refused", { origin });
      return reply(403, { ok: false, error: "forbidden_origin" });
    }

    const ip = clientIp(req, trustProxy);
    if (!limiter.take(ip)) return reply(429, { ok: false, error: "rate_limited" });

    let raw;
    try {
      raw = await readBody(req);
    } catch (e) {
      return reply(e.status ?? 400, { ok: false, error: e.status === 413 ? "too_large" : "bad_request" });
    }
    let input;
    try {
      input = isForm ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw);
    } catch {
      return reply(400, { ok: false, error: "bad_request" });
    }

    const result = validateContact(input);
    if (isSpam(result.data)) {
      log("honeypot");
      return reply(200, { ok: true });
    }
    if (!result.ok) return reply(422, { ok: false, error: "invalid", errors: result.errors });

    try {
      await send(buildMail(result.data, { to, from }));
      log("sent");
      return reply(200, { ok: true });
    } catch (e) {
      log("send_failed", { message: e instanceof Error ? e.message : String(e) });
      return reply(502, { ok: false, error: "send_failed" });
    }
  };
}
