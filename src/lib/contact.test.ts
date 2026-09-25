import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { buildMail, isSpam, normalizeContact, validateContact } from "../../server/contact-core.mjs";
import { createContactHandler, createRateLimiter } from "../../server/handler.mjs";
import type { ContactMail } from "../../server/contact-core.mjs";

const valid = {
  name: "Camille Martin",
  organization: "Exemple SAS",
  email: "Camille.Martin@Example.com",
  subject: "Proposition d'alternance",
  message: "Bonjour, je souhaite échanger avec vous.",
};

describe("validation du formulaire de contact", () => {
  it("accepte une saisie complète et normalise l'email", () => {
    const r = validateContact(valid);
    expect(r.ok).toBe(true);
    expect(r.data.email).toBe("camille.martin@example.com");
  });

  it("signale chaque champ obligatoire manquant ; l'organisation reste facultative", () => {
    const r = validateContact({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name", "subject"]);
    expect(validateContact({ ...valid, organization: "" }).ok).toBe(true);
  });

  it("refuse les emails invalides et les messages trop courts ou trop longs", () => {
    for (const email of ["x", "a@b", "a b@c.fr", "<a@b.fr>", "a@b..fr"]) expect(validateContact({ ...valid, email }).ok, email).toBe(false);
    expect(validateContact({ ...valid, message: "court" }).ok).toBe(false);
    expect(validateContact({ ...valid, message: "x".repeat(5001) }).ok).toBe(false);
  });

  it("retire les retours à la ligne des champs d'une ligne (pas d'injection d'en-têtes)", () => {
    const n = normalizeContact({ ...valid, subject: "Bonjour\r\nBcc: victime@example.com", name: "A\nB" });
    expect(n.subject).toBe("Bonjour Bcc: victime@example.com");
    expect(n.name).toBe("A B");
    const mail = buildMail(n, { to: "evann.bougoula@dagz.fr", from: "portfolio@dagz.fr" });
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.replyTo).not.toMatch(/[\r\n]/);
  });

  it("garde les sauts de ligne du message et ignore les types inattendus", () => {
    expect(normalizeContact({ message: "a\r\nb\rc" }).message).toBe("a\nb\nc");
    expect(normalizeContact({ name: 42, email: ["x"] })).toMatchObject({ name: "", email: "" });
    expect(normalizeContact(null).name).toBe("");
  });

  it("construit un email adressé à Evann, avec réponse directe à l'expéditeur", () => {
    const r = validateContact(valid);
    const mail = buildMail(r.data, { to: "evann.bougoula@dagz.fr", from: "portfolio@dagz.fr" });
    expect(mail).toMatchObject({
      to: "evann.bougoula@dagz.fr",
      from: "portfolio@dagz.fr",
      replyTo: "Camille Martin <camille.martin@example.com>",
      subject: "[Portfolio] Proposition d'alternance",
    });
    expect(mail.text).toContain("Exemple SAS");
    expect(isSpam(r.data)).toBe(false);
    expect(isSpam(normalizeContact({ ...valid, website: "http://spam" }))).toBe(true);
  });
});

describe("service POST /api/contact", () => {
  let server: Server | null = null;
  afterEach(() => new Promise<void>((done) => (server ? server.close(() => done()) : done())));

  async function start(options: Partial<Parameters<typeof createContactHandler>[0]> = {}) {
    const sent: ContactMail[] = [];
    const handler = createContactHandler({
      to: "evann.bougoula@dagz.fr",
      from: "portfolio@dagz.fr",
      allowedOrigins: ["https://dagz.fr"],
      send: async (m) => {
        sent.push(m);
      },
      ...options,
    });
    server = createServer((req, res) => void handler(req, res));
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", () => r()));
    const url = `http://127.0.0.1:${(server!.address() as AddressInfo).port}/api/contact`;
    return { url, sent };
  }

  const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://dagz.fr", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
      redirect: "manual",
    });

  it("envoie un message valide", async () => {
    const { url, sent } = await start();
    const res = await post(url, valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("evann.bougoula@dagz.fr");
  });

  it("refuse méthode, type, origine, corps invalide et saisie invalide", async () => {
    const { url, sent } = await start();
    expect((await fetch(url)).status).toBe(405);
    expect((await post(url, "x", { "Content-Type": "text/plain" })).status).toBe(415);
    expect((await post(url, valid, { Origin: "https://evil.example" })).status).toBe(403);
    expect((await post(url, "{pas du json")).status).toBe(400);
    const invalid = await post(url, { ...valid, email: "x" });
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).errors).toHaveProperty("email");
    expect((await post(url, { ...valid, message: "x".repeat(40_000) })).status).toBe(413);
    expect(sent).toHaveLength(0);
  });

  it("champ piège rempli : réponse neutre, aucun envoi", async () => {
    const { url, sent } = await start();
    const res = await post(url, { ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it("limite le nombre d'envois par adresse IP", async () => {
    let t = 0;
    const { url } = await start({ limiter: createRateLimiter({ max: 2, windowMs: 1000, now: () => t }) });
    expect((await post(url, valid)).status).toBe(200);
    expect((await post(url, valid)).status).toBe(200);
    expect((await post(url, valid)).status).toBe(429);
    t = 1500;
    expect((await post(url, valid)).status).toBe(200);
  });

  it("échec SMTP : 502 sans exposer l'erreur", async () => {
    const { url } = await start({
      send: async () => {
        throw new Error("535 authentication failed for secret-user");
      },
    });
    const res = await post(url, valid);
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toMatch(/secret|535/);
  });

  it("formulaire envoyé sans JavaScript : redirection vers la page avec le résultat", async () => {
    const { url, sent } = await start();
    const res = await post(url, new URLSearchParams(valid).toString(), { "Content-Type": "application/x-www-form-urlencoded" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?contact=envoye#contact");
    expect(sent).toHaveLength(1);
  });
});
