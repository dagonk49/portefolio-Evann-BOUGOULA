import { expect, test } from "@playwright/test";
import { launchButton, seedSettings } from "./helpers";

test.describe("mobile", () => {
  test("le mode sobre est privilégié, même si le lab était mémorisé", async ({ page }) => {
    await seedSettings(page, { modePreference: "lab" });
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.locator(".lab-root")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Evann Bougoula" })).toBeVisible();
    await expect(page.getByText("Conçu d'abord pour ordinateur")).toBeVisible();
    // Pas de défilement horizontal parasite, même fiches E5 dépliées.
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("menu de navigation repliable, fermé par Échap", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    const nav = page.getByRole("navigation", { name: "Sections du portfolio" });
    await expect(nav).toBeHidden();
    await menu.click();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("button", { name: "Basculer en 3D" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Télécharger le CV (PDF)" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
    await page.getByRole("button", { name: "Menu" }).click();
    await nav.getByRole("link", { name: "Contact" }).click();
    await expect(nav).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
  });

  test("bandeau de consentement utilisable sur petit écran", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Vos préférences, votre choix" });
    await expect(banner).toBeVisible();
    const box = await banner.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await banner.getByRole("button", { name: "Tout refuser" }).click();
    await expect(banner).toHaveCount(0);
  });

  test("lancé sur mobile, le lab fournit joystick et boutons", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await launchButton(page).click();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await expect(page.getByRole("application", { name: "Joystick de déplacement" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Interagir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sauter" })).toBeVisible();
    await expect(page.locator(".mode-switch")).toBeVisible();
  });
});
