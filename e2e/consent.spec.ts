import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CONSENT_KEY, seedConsent, STORAGE_KEY } from "./helpers";

const stored = (page: import("@playwright/test").Page) =>
  page.evaluate(([c, s]) => ({ consent: localStorage.getItem(c!), data: localStorage.getItem(s!) }), [CONSENT_KEY, STORAGE_KEY]);

test.describe("consentement (CNIL)", () => {
  test("premier passage : bandeau à trois boutons de même poids, rien d'enregistré", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Vos préférences, votre choix" });
    await expect(banner).toBeVisible();
    const buttons = banner.getByRole("button");
    await expect(buttons).toHaveText(["Tout accepter", "Tout refuser", "Personnaliser"]);
    const boxes = await Promise.all((await buttons.all()).map((b) => b.boundingBox()));
    const [a, r, p] = boxes.map((b) => b!);
    expect(Math.abs(a!.width - r!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(a!.width - p!.width)).toBeLessThanOrEqual(1);
    expect(a!.height).toBe(r!.height);
    const classes = await buttons.evaluateAll((bs) => bs.map((b) => b.className));
    expect(new Set(classes).size).toBe(1);
    await expect(banner.getByRole("link", { name: "En savoir plus" })).toHaveAttribute("href", "/confidentialite#stockage-local");
    // Le site fonctionne sans choix : le mode, les réglages… restent en mémoire.
    await page.waitForTimeout(500);
    expect(await stored(page)).toEqual({ consent: null, data: null });
  });

  test("« Tout refuser » : choix mémorisé, aucune préférence écrite, bandeau masqué au rechargement", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tout refuser" }).click();
    await expect(page.getByRole("region", { name: "Vos préférences, votre choix" })).toHaveCount(0);
    const s = await stored(page);
    expect(JSON.parse(s.consent!)).toMatchObject({ v: 1, preferences: false });
    expect(s.data).toBeNull();
    await expect(page.locator(".reset-prefs__status")).toContainText("stockage des préférences non autorisé");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Vos préférences, votre choix" })).toHaveCount(0);
  });

  test("« Tout accepter » : préférences enregistrées immédiatement", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Tout accepter" }).click();
    await expect.poll(async () => (await stored(page)).data).not.toBeNull();
    expect(JSON.parse((await stored(page)).consent!)).toMatchObject({ preferences: true });
  });

  test("« Personnaliser » : rien de précoché, choix enregistrés, panneau rouvrable depuis le pied de page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Personnaliser" }).click();
    const dialog = page.getByRole("dialog", { name: "Personnaliser le stockage" });
    await expect(dialog).toBeVisible();
    const toggle = dialog.getByRole("switch");
    await expect(toggle).not.toBeChecked();
    await expect(dialog).toContainText("Toujours actif");
    const axe = await new AxeBuilder({ page }).include(".consent-panel").withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    await toggle.check();
    await dialog.getByRole("button", { name: "Enregistrer mes choix" }).click();
    await expect(dialog).toBeHidden();
    expect(JSON.parse((await stored(page)).consent!)).toMatchObject({ preferences: true });

    // Retrait du consentement : aussi simple que l'accord, et les données sont effacées.
    await page.getByRole("contentinfo").getByRole("button", { name: "Gérer les cookies" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("switch")).toBeChecked();
    await dialog.getByRole("button", { name: "Tout refuser" }).click();
    await expect(dialog).toBeHidden();
    const s = await stored(page);
    expect(JSON.parse(s.consent!)).toMatchObject({ preferences: false });
    expect(s.data).toBeNull();
  });

  test("Échap ferme le panneau sans rien changer", async ({ page }) => {
    await seedConsent(page, false);
    await page.goto("/");
    const manage = page.getByRole("contentinfo").getByRole("button", { name: "Gérer les cookies" });
    await manage.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(manage).toBeFocused();
    expect(JSON.parse((await stored(page)).consent!)).toMatchObject({ preferences: false });
  });

  test("un choix de plus de 6 mois est redemandé", async ({ page }) => {
    await page.addInitScript((key) => {
      const old = new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString();
      localStorage.setItem(key, JSON.stringify({ v: 1, preferences: true, decidedAt: old }));
    }, CONSENT_KEY);
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Vos préférences, votre choix" })).toBeVisible();
  });
});

test.describe("pages légales", () => {
  test.beforeEach(async ({ page }) => {
    await seedConsent(page);
  });

  test("mentions légales : éditeur, publication, hébergement, propriété intellectuelle", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Mentions légales" }).click();
    await expect(page).toHaveURL(/\/mentions-legales$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mentions légales" })).toBeVisible();
    for (const h of ["Éditeur du site", "Directeur de la publication", "Hébergement", "Propriété intellectuelle"]) {
      await expect(page.getByRole("heading", { level: 2, name: h })).toBeVisible();
    }
    await expect(page.locator("#hebergement").locator("..")).toContainText("dagz.fr");
    await expect(page.getByRole("main")).toContainText("evann.bougoula@dagz.fr");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    await page.getByRole("link", { name: "Retour au portfolio", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Evann Bougoula" })).toBeVisible();
  });

  test("confidentialité et CGU : finalité, 3 ans, pas de tiers, droits RGPD", async ({ page }) => {
    await page.goto("/confidentialite");
    const main = page.getByRole("main");
    await expect(page.getByRole("heading", { level: 1, name: "Politique de confidentialité et CGU" })).toBeVisible();
    await expect(main).toContainText("Exclusivement répondre à votre demande");
    await expect(main).toContainText("3 ans au maximum");
    await expect(main).toContainText("ni cédé, ni vendu, ni communiqué à des tiers");
    await expect(main).toContainText("droit d'accès, de rectification, d'effacement");
    await expect(main.locator("#stockage-local").locator("..").locator("table tbody tr")).toHaveCount(3);
    await expect(page.getByRole("heading", { level: 2, name: "Conditions générales d'utilisation" })).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });
});
