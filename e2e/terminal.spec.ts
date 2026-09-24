import { expect, test } from "@playwright/test";

test.describe("terminal du mode sobre", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#terminal");
  });

  const input = (page: import("@playwright/test").Page) => page.getByLabel("Saisir une commande");

  test("commandes, casse, historique et commande inconnue", async ({ page }) => {
    const box = input(page);
    await box.fill("HELP");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText("Commandes disponibles");
    await box.fill("whoami");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText("Evann Bougoula");
    await box.fill("experience");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText("EURL Moizan");
    await box.fill("<b>xss</b>");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText("Commande introuvable : <b>xss</b>");
    expect(await page.locator(".terminal__log b").count()).toBe(0);
    await box.press("ArrowUp");
    await expect(box).toHaveValue("<b>xss</b>");
    await box.press("ArrowUp");
    await expect(box).toHaveValue("experience");
    await box.press("ArrowDown");
    await box.press("ArrowDown");
    await expect(box).toHaveValue("");
    await box.fill("history");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText("whoami");
    await box.fill("clear");
    await box.press("Enter");
    await expect(page.locator(".terminal__out")).toHaveCount(0);
  });

  test("Tab complète une commande sans piéger le focus", async ({ page }) => {
    const box = input(page);
    await box.fill("net");
    await box.press("Tab");
    await expect(box).toHaveValue("netforge");
    await expect(box).toBeFocused();
    await box.fill("");
    await box.press("Tab");
    await expect(box).not.toBeFocused();
    await box.focus();
    await box.press("Escape");
    await expect(box).not.toBeFocused();
  });

  test("google ouvre un nouvel onglet protégé et propose un lien de secours", async ({ page, context }) => {
    await context.route("https://www.google.com/**", (route) => route.fulfill({ status: 200, body: "ok" }));
    const box = input(page);
    await box.fill("google");
    const [popup] = await Promise.all([context.waitForEvent("page"), box.press("Enter")]);
    await expect.poll(() => popup.url()).toContain("google.com");
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    expect(page.url()).toContain("localhost");
    const fallback = page.locator(".terminal__log a[href='https://www.google.com']");
    await expect(fallback).toHaveAttribute("target", "_blank");
    await expect(fallback).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("easter eggs et variantes avec espaces", async ({ page }) => {
    const box = input(page);
    for (const [cmd, text] of [
      ["valo", "j'adore aussi jouer à Valorant"],
      ["Minecraft", "Minecraft"],
      ["gta v", "GTA V"],
      ["GTA  VI", "GTA VI"],
      ["sudo rm -rf /", "Rien n'a été exécuté"],
    ] as const) {
      await box.fill(cmd);
      await box.press("Enter");
      await expect(page.locator(".terminal__log")).toContainText(text);
    }
  });

  test("cv sans fichier : proposition d'impression", async ({ page }) => {
    const box = input(page);
    await box.fill("cv");
    await box.press("Enter");
    await expect(page.locator(".terminal__action")).toHaveText("imprimer");
  });
});
