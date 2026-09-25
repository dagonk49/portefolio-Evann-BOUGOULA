/**
 * Service d'envoi du formulaire de contact (conteneur séparé du site statique).
 *
 * nginx relaie POST /api/contact vers ce service, qui valide la saisie et
 * transmet le message par SMTP (Nodemailer) à CONTACT_TO. Aucune donnée n'est
 * stockée : le message est envoyé puis oublié (journal sans contenu).
 *
 * Variables : voir server/.env.example.
 */
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { createContactHandler, createRateLimiter } from "./handler.mjs";

const env = process.env;
const port = Number(env.PORT ?? 3001);
const dryRun = env.CONTACT_DRY_RUN === "1";

function required(name) {
  const v = env[name];
  if (!v) {
    console.error(`[contact] variable ${name} manquante`);
    process.exit(1);
  }
  return v;
}

const to = env.CONTACT_TO ?? "evann.bougoula@dagz.fr";
const from = dryRun ? (env.CONTACT_FROM ?? "portfolio@localhost") : required("CONTACT_FROM");

const transport = dryRun
  ? null
  : nodemailer.createTransport({
      host: required("SMTP_HOST"),
      port: Number(env.SMTP_PORT ?? 587),
      secure: env.SMTP_SECURE === "1",
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: required("SMTP_PASS") } : undefined,
      requireTLS: env.SMTP_SECURE !== "1",
    });

const handler = createContactHandler({
  to,
  from,
  allowedOrigins: (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  trustProxy: env.TRUST_PROXY !== "0",
  limiter: createRateLimiter({ max: Number(env.RATE_LIMIT_MAX ?? 5), windowMs: Number(env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000) }),
  send: async (mail) => {
    if (dryRun) {
      console.log(`[contact] envoi simulé : « ${mail.subject} » → ${mail.to}`);
      return;
    }
    await transport.sendMail(mail);
  },
  // Journal minimal : jamais le contenu du message ni l'adresse de l'expéditeur.
  log: (event, detail) => console.log(`[contact] ${event}`, detail ? JSON.stringify(detail) : ""),
});

createServer((req, res) => {
  const path = (req.url ?? "/").split("?")[0];
  if (path === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    return;
  }
  if (path !== "/api/contact") {
    res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: "not_found" }));
    return;
  }
  handler(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "server_error" }));
  });
}).listen(port, () => console.log(`[contact] service à l'écoute sur :${port}${dryRun ? " (envoi simulé)" : ""}`));
