import { expect, test } from "@playwright/test";
import { enterLab, seedSettings, STORAGE_KEY, teleport, waitActive } from "./helpers";

const PC_PAD: [number, number] = [10.45, -19.7];
const BAY_PAD: [number, number] = [-19.7, 8.8];

test.describe("interfaces du mode 3D (v2.1)", () => {
  test("une interface fermée ne se rouvre plus à la place de la suivante", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await enterLab(page);
    // Ouverture à la souris depuis le HUD, puis fermeture : le focus revient au jeu, pas au bouton.
    await page.getByRole("button", { name: /^Index/ }).click();
    await expect(page.getByRole("dialog", { name: "Index des contenus" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.classList.contains("lab-root"))).toBe(true);

    // Entrée sur la dalle du poste ouvre bien le poste (avant le correctif : l'index se rouvrait).
    await teleport(page, ...PC_PAD);
    await waitActive(page, "bureau.pc");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: /Poste PC-LAB/ })).toBeVisible();
    await page.getByRole("button", { name: /^Fermer/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Espace sert à sauter, pas à réactiver un bouton : aucune fenêtre ne s'ouvre.
    await page.keyboard.press("Space");
    await page.waitForTimeout(400);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Puis une autre dalle : c'est sa propre interface qui s'ouvre.
    await teleport(page, ...BAY_PAD);
    await waitActive(page, "baie.patch");
    await page.keyboard.press("e");
    await expect(page.getByRole("dialog", { name: "Baie réseau — RACK-LAB" })).toBeVisible();
    await page.keyboard.press("Escape");
    // La fermeture purge l'état de proximité, recalculé aussitôt à la distance réelle.
    await waitActive(page, "baie.patch");
  });

  test("Options : engrenage du HUD et touche O, son, volumes, qualité", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await enterLab(page);
    // Plus de bouton de son flottant : tout passe par les options.
    await expect(page.locator(".hud-audio")).toHaveCount(0);
    await page.getByRole("button", { name: "Options" }).click();
    const options = page.getByRole("dialog", { name: "Options" });
    await expect(options).toBeVisible();
    await expect(options).toContainText("Contrôles et raccourcis");
    await expect(options).toContainText("Dérapage (frein à main)");
    const toggle = options.getByRole("switch");
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await options.getByRole("slider", { name: "Musique d'ambiance" }).fill("40");
    await options.getByRole("slider", { name: "Effets sonores et voix de l'intro" }).fill("25");
    await page.waitForFunction(
      (key) => {
        const a = JSON.parse(localStorage.getItem(key) ?? "{}").data?.audio;
        return a && a.muted === false && a.music === 0.4 && a.sfx === 0.25;
      },
      STORAGE_KEY,
    );
    await options.getByRole("radio", { name: /Élevée/ }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.keyboard.press("o");
    await expect(page.getByRole("dialog", { name: "Options" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Options" }).getByRole("radio", { name: /Élevée/ })).toBeChecked();
  });

  test("tutoriel d'accueil : non bloquant, « Ignorer » le masque définitivement", async ({ page }) => {
    await seedSettings(page, { settings: { quality: "low", autoQuality: false, effects: false, tutorial: "pending" } });
    await page.goto("/");
    await enterLab(page);
    const banner = page.locator(".hud-guide");
    await expect(banner).toContainText(
      "Première visite dans le Lab ? Déplace-toi avec ZQSD et approche-toi d'une borne lumineuse pour interagir (E).",
    );
    // On peut marcher pendant que le bandeau est affiché.
    const before = await page.evaluate(() => window.__lab!.player());
    await page.keyboard.down("KeyW");
    await page.waitForFunction((b) => {
      const p = window.__lab!.player();
      return Math.hypot(p[0] - b[0]!, p[2] - b[2]!) > 0.8;
    }, before);
    await page.keyboard.up("KeyW");
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Ignorer le tutoriel" }).click();
    await expect(banner).toHaveCount(0);
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? "{}").data?.settings?.tutorial === "skipped", STORAGE_KEY);
    // Rechargement : le mode 3D est mémorisé, le lab se relance directement.
    await page.reload();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await expect(page.locator(".hud-guide")).toHaveCount(0);
  });

  test("tutoriel : « Compris » le masque pour la session", async ({ page }) => {
    await seedSettings(page, { settings: { quality: "low", autoQuality: false, effects: false, tutorial: "pending" } });
    await page.goto("/");
    await enterLab(page);
    await page.locator(".hud-guide").getByRole("button", { name: "Compris" }).click();
    await expect(page.locator(".hud-guide")).toHaveCount(0);
    // Sortie puis retour dans le lab pendant la même session : toujours masqué.
    await page.locator(".mode-switch").click();
    await expect(page.locator(".lab-root")).toHaveCount(0);
    await page.locator(".mode-switch").click();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await expect(page.locator(".hud-guide")).toHaveCount(0);
  });
});
