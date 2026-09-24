import { expect, test } from "@playwright/test";
import { seedSettings } from "./helpers";

test.describe("mobile", () => {
  test("le mode sobre est privilégié, même si le lab était mémorisé", async ({ page }) => {
    await seedSettings(page, { modePreference: "lab" });
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.locator(".lab-root")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Evann Bougoula" })).toBeVisible();
    await expect(page.getByText("Conçu d'abord pour ordinateur")).toBeVisible();
    // Pas de défilement horizontal parasite.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("lancé sur mobile, le lab fournit joystick et boutons", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Explorer mon lab (3D)" }).click();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await expect(page.getByRole("application", { name: "Joystick de déplacement" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Interagir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sauter" })).toBeVisible();
    await expect(page.locator(".mode-switch")).toBeVisible();
  });
});
