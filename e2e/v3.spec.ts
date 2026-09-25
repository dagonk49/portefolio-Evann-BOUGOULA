import { expect, test } from "@playwright/test";
import { seedConsent, stubPrint } from "./helpers";

test.describe("fiches E5 et export PDF", () => {
  test.beforeEach(async ({ page }) => {
    await seedConsent(page);
  });

  test("tableau de synthèse et six fiches dépliables en sept parties", async ({ page }) => {
    await page.goto("/#realisations");
    const table = page.locator("table.synth");
    await expect(table.locator("tbody tr")).toHaveCount(6);
    await expect(table.locator("thead th")).toHaveCount(8);
    await expect(table.locator("tbody tr").first()).toContainText("Administration Active Directory");
    await expect(page.locator(".fiche")).toHaveCount(6);

    const fiche = page.locator("#realisation-netforge");
    const details = fiche.locator("details");
    await expect(details).not.toHaveAttribute("open", "");
    await fiche.getByText("Consulter la fiche complète").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(fiche.locator(".fiche__part h4")).toHaveText([
      /En-tête/,
      /Compétences E5 mobilisées/,
      /Description technique/,
      /Schéma technique/,
      /Captures et preuves/,
      /Documentation/,
      /Cahier de recette/,
    ]);
    await expect(fiche.getByRole("img", { name: /Chaîne fonctionnelle de NetForge/ })).toBeVisible();
    await expect(fiche.locator(".comp-list li.is-on")).toHaveCount(5);
    await expect(fiche.locator(".docs li")).toHaveCount(3);
    // Aucun résultat de recette inventé : obtenu et statut restent « non consignés ».
    const rows = fiche.locator("table.recette tbody tr");
    await expect(rows).toHaveCount(5);
    for (const row of await rows.all()) {
      await expect(row.locator("td").nth(1)).toHaveText("Non consigné");
      await expect(row.locator("td").nth(2)).toContainText("Statut non consigné");
    }
    await expect(fiche.getByRole("link", { name: /Ouvrir NetForge/ })).toHaveAttribute("href", "https://netforge.dagz.fr");
  });

  test("« Exporter cette fiche en PDF » n'imprime que la fiche, dépliée", async ({ page }) => {
    await stubPrint(page);
    await page.goto("/#realisations");
    const fiche = page.locator("#realisation-proxmox-debian");
    await fiche.getByText("Consulter la fiche complète").click();
    await fiche.getByRole("button", { name: /Exporter cette fiche en PDF/ }).click();
    const prints = await page.evaluate(() => (window as unknown as { __prints: unknown[] }).__prints);
    expect(prints).toEqual([expect.objectContaining({ fiche: "proxmox-debian", target: 1 })]);
    // Après impression, l'état de la page est restauré.
    await expect(page.locator("body")).not.toHaveAttribute("data-print-fiche", /.+/);
    await expect(page.locator("[data-print-target]")).toHaveCount(0);
  });

  test("« Exporter le Portfolio (PDF) » ouvre toutes les fiches avant d'imprimer, puis les referme", async ({ page }) => {
    await stubPrint(page);
    await page.goto("/");
    await page.getByRole("group", { name: "Actions principales" }).getByRole("button", { name: "Exporter le Portfolio (PDF)" }).click();
    const prints = await page.evaluate(() => (window as unknown as { __prints: { openDetails: number; totalDetails: number; fiche: string | null }[] }).__prints);
    expect(prints).toHaveLength(1);
    expect(prints[0]!.fiche).toBeNull();
    expect(prints[0]!.openDetails).toBe(prints[0]!.totalDetails);
    await expect(page.locator("details[open]")).toHaveCount(0);
  });

  test("feuille d'impression : fond blanc, interface masquée, en-tête et tableaux dédiés", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".site-header")).toBeHidden();
    await expect(page.locator(".hero")).toBeHidden();
    await expect(page.locator(".section--terminal")).toBeHidden();
    await expect(page.locator(".contact-form")).toBeHidden();
    await expect(page.locator(".nf-launch")).toBeHidden();
    await expect(page.locator('[data-choice="lab"]')).toBeHidden();
    const summary = page.locator(".print-summary");
    await expect(summary).toBeVisible();
    await expect(summary.locator(".print-head")).toContainText("evann.bougoula@dagz.fr");
    await expect(summary.getByRole("heading", { name: "Chronologie des expériences" })).toBeVisible();
    await expect(summary.locator("table").first().locator("tbody tr")).toHaveCount(5);
    await expect(summary.getByRole("heading", { name: "Compétences" })).toBeVisible();
    await expect(page.locator("table.synth")).toBeVisible();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(255, 255, 255)");
    // À l'écran, l'en-tête d'impression reste masqué.
    await page.emulateMedia({ media: "screen" });
    await expect(summary).toBeHidden();
  });

  test("CV : lien de téléchargement et commande cv du terminal", async ({ page }) => {
    await page.goto("/#terminal");
    const box = page.getByLabel("Saisir une commande");
    await box.fill("cv");
    const [download] = await Promise.all([page.waitForEvent("download"), box.press("Enter")]);
    expect(download.suggestedFilename()).toBe("CV_Evann_Bougoula.pdf");
    await expect(page.locator(".terminal__log a[href='/CV_Evann_Bougoula.pdf']")).toBeVisible();
  });
});

test.describe("formulaire de contact", () => {
  test.beforeEach(async ({ page }) => {
    await seedConsent(page);
    await page.goto("/#contact");
  });

  const form = (page: import("@playwright/test").Page) => page.getByRole("form", { name: "Écrire un message" });

  test("validation côté navigateur : erreurs annoncées et focus sur le premier champ", async ({ page }) => {
    const f = form(page);
    await f.getByRole("button", { name: "Envoyer le message" }).click();
    await expect(f.getByRole("alert")).toHaveText("4 champs sont à corriger.");
    await expect(f.getByLabel("Nom et prénom")).toBeFocused();
    await expect(f.getByLabel("Nom et prénom")).toHaveAttribute("aria-invalid", "true");
    await f.getByLabel("Email professionnel").fill("pas-une-adresse");
    await f.getByRole("button", { name: "Envoyer le message" }).click();
    await expect(f.locator("#contact-email-error")).toContainText("Adresse email invalide");
    // Le champ piège n'est ni visible ni atteignable au clavier.
    await expect(page.locator("#contact-website")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator(".hp")).toHaveAttribute("aria-hidden", "true");
    await expect(f).toContainText("conservées 3 ans au maximum");
  });

  test("envoi réussi sans rechargement (service simulé)", async ({ page }) => {
    const f = form(page);
    await f.getByLabel("Nom et prénom").fill("Camille Martin");
    await f.getByLabel("Entreprise ou organisation").fill("Exemple SAS");
    await f.getByLabel("Email professionnel").fill("camille.martin@example.com");
    await f.getByLabel("Sujet").fill("Proposition d'alternance");
    await f.getByLabel("Message").fill("Bonjour Evann, je souhaiterais échanger avec vous au sujet d'une alternance.");
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/contact")),
      f.getByRole("button", { name: "Envoyer le message" }).click(),
    ]);
    expect(response.status()).toBe(200);
    await expect(f.getByRole("status")).toContainText("Message envoyé.");
    await expect(f.getByLabel("Nom et prénom")).toHaveValue("");
    expect(page.url()).toContain("#contact");
  });

  test("erreur du service : saisie conservée et adresse email proposée", async ({ page }) => {
    await page.route("**/api/contact", (route) => route.fulfill({ status: 502, contentType: "application/json", body: '{"ok":false}' }));
    const f = form(page);
    await f.getByLabel("Nom et prénom").fill("Camille Martin");
    await f.getByLabel("Email professionnel").fill("camille.martin@example.com");
    await f.getByLabel("Sujet").fill("Stage");
    await f.getByLabel("Message").fill("Un message suffisamment long pour être valide.");
    await f.getByRole("button", { name: "Envoyer le message" }).click();
    await expect(f.getByRole("status")).toContainText("Le service d'envoi ne répond pas");
    await expect(f.getByLabel("Nom et prénom")).toHaveValue("Camille Martin");
    await expect(f.getByRole("status").getByRole("link")).toHaveAttribute("href", /^mailto:evann\.bougoula@dagz\.fr\?subject=Stage/);
  });

  test("le service refuse une saisie invalide envoyée directement", async ({ request }) => {
    const res = await request.post("/api/contact", { data: { name: "", email: "x", subject: "", message: "court" } });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.errors).sort()).toEqual(["email", "message", "name", "subject"]);
    const wrongType = await request.post("/api/contact", { headers: { "Content-Type": "text/plain" }, data: "bonjour" });
    expect(wrongType.status()).toBe(415);
    const get = await request.get("/api/contact");
    expect(get.status()).toBe(405);
  });
});
