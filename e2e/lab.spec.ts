import { expect, test, type Page } from "@playwright/test";
import { enterLab, launchButton, seedSettings, teleport, waitActive } from "./helpers";

const BAY_PAD: [number, number] = [-19.7, 8.8];
const PC_PAD: [number, number] = [10.45, -19.7];

async function openBay(page: Page) {
  await teleport(page, ...BAY_PAD);
  await waitActive(page, "baie.patch");
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog", { name: "Baie réseau — RACK-LAB" })).toBeVisible();
}

async function openPc(page: Page) {
  await teleport(page, ...PC_PAD);
  await waitActive(page, "bureau.pc");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /Poste PC-LAB/ })).toBeVisible();
}

async function patch(page: Page, a: string, b: string) {
  await page.locator(".port-btn", { hasText: a }).first().click();
  await page.locator(".port-btn", { hasText: b }).first().click();
}

test.describe("lab 3D", () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await enterLab(page);
  });

  test("déplacement clavier, puis aucune entrée de jeu pendant la saisie", async ({ page }) => {
    const before = await page.evaluate(() => window.__lab!.player());
    await page.keyboard.down("KeyW");
    await page.waitForFunction((b) => {
      const p = window.__lab!.player();
      return Math.hypot(p[0] - b[0]!, p[2] - b[2]!) > 0.4;
    }, before, { timeout: 45_000 });
    await page.keyboard.up("KeyW");

    await openPc(page);
    await page.getByLabel("Statique").check();
    const field = page.getByLabel("Adresse IPv4");
    await field.focus();
    const start = await page.evaluate(() => window.__lab!.player());
    await page.keyboard.type("zqsdwasd");
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(2500);
    await page.keyboard.up("KeyW");
    const end = await page.evaluate(() => window.__lab!.player());
    expect(Math.hypot(end[0] - start[0], end[2] - start[2])).toBeLessThan(0.05);
    expect(await field.inputValue()).toMatch(/^zqsdwasd/);
  });

  test("mission : mauvais branchement et mauvaise config, diagnostic utile, puis correction", async ({ page }) => {
    await openBay(page);
    // Port désactivé : câble posé, mais pas de liaison.
    await patch(page, "PP-02", "Gi0/5");
    await expect(page.locator(".lab-feedback").first()).toContainText("désactivé (shutdown)");
    // Cage SFP : branchement refusé.
    await page.getByRole("button", { name: "Débrancher PP-02" }).click();
    await patch(page, "PP-02", "Gi0/9");
    await expect(page.locator(".lab-feedback").first()).toContainText("cage SFP");
    await patch(page, "PP-02", "Gi0/2");
    await patch(page, "eth0", "Gi0/3");
    await expect(page.locator(".lab-feedback").first()).toContainText("SRV-LAB est relié au port Gi0/3");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await openPc(page);
    await page.getByLabel("Statique").check();
    await page.getByLabel("Adresse IPv4").fill("192.168.10.255");
    await page.getByLabel(/Masque/).fill("/24");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText(/adresse de diffusion \(broadcast\)/)).toBeVisible();
    await page.getByLabel("Adresse IPv4").fill("192.168.10.42");
    await page.getByLabel(/Passerelle/).fill("192.168.10.1");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText("Configuration appliquée : 192.168.10.42/24.")).toBeVisible();

    // Ports encore en VLAN 1 : le serveur répond (même VLAN), pas la passerelle.
    await page.getByRole("tab", { name: "Diagnostic" }).click();
    await page.getByRole("button", { name: "Lancer le diagnostic" }).click();
    const report = page.locator(".lab-report");
    await expect(report).toContainText("Au moins une vérification échoue");
    await expect(report).toContainText("VLAN 1");

    // Terminal du poste : la même logique réseau.
    const cmd = page.getByLabel("C:\\> commande");
    await cmd.fill("ping 192.168.10.1");
    await cmd.press("Enter");
    await expect(page.locator(".mini-console__log")).toContainText("Impossible de joindre l'hôte de destination");

    await page.getByRole("tab", { name: "Switch SW-LAB" }).click();
    await page.getByLabel("VLAN d'accès de Gi0/2").selectOption("10");
    await page.getByLabel("VLAN d'accès de Gi0/3").selectOption("10");
    await page.getByRole("tab", { name: "Diagnostic" }).click();
    await page.getByRole("button", { name: "Lancer le diagnostic" }).click();
    await expect(report).toContainText("Le poste est en ligne");
    await expect(page.locator(".hud-net")).toContainText("en ligne");
    await page.keyboard.press("Escape");

    // L'anomalie révélée par la mission est apparue au-dessus du switch.
    await teleport(page, -19.4, 6.1);
    await waitActive(page, "anomaly:evann.skills.networking");
    await page.keyboard.press("e");
    const dialog = page.getByRole("dialog", { name: "Réseaux" });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog).toContainText("evann.skills.networking");
    await expect(page.locator(".hud-steps li.is-done")).toHaveCount(6);
  });

  test("bascule de mode : progression conservée et fiche ouverte dans le mode sobre", async ({ page }) => {
    await openBay(page);
    await page.keyboard.press("Escape");
    await expect(page.locator(".hud-steps li").first()).toHaveClass(/is-done/);

    // Fiche → section correspondante du mode sobre.
    await teleport(page, 5.9, -19.6);
    await waitActive(page, "stele.efs");
    await page.keyboard.press("e");
    await page.getByRole("button", { name: "Voir dans le parcours (mode sobre)" }).click();
    await expect(page.locator(".lab-root")).toHaveCount(0);
    await expect(page.locator("#experience-efs-2026")).toBeFocused();
    await expect(page.locator("#experience-efs-2026")).toBeInViewport();

    // Retour au lab : l'étape 1 est toujours validée, le joueur est resté au mur du parcours.
    await launchButton(page).click();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await expect(page.locator(".hud-steps li").first()).toHaveClass(/is-done/);
    const p = await page.evaluate(() => window.__lab!.player());
    expect(Math.hypot(p[0] - 5.9, p[2] + 19.6)).toBeLessThan(2);
  });

  test("Échap ferme la fiche et rend le focus, puis ouvre la pause ; l'index ouvre une fiche", async ({ page }) => {
    await page.getByRole("button", { name: /^Index/ }).click();
    const index = page.getByRole("dialog", { name: "Index des contenus" });
    await expect(index).toBeVisible();
    await index.getByRole("button", { name: /EURL Moizan/ }).click();
    await expect(page.getByRole("dialog", { name: "EURL Moizan" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Pause" })).toBeVisible();
    await page.getByRole("button", { name: "Reprendre", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("perte du contexte WebGL : message clair et accès au mode sobre", async ({ page }) => {
    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(".lab-root canvas")!;
      const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext;
      gl.getExtension("WEBGL_lose_context")!.loseContext();
    });
    await expect(page.getByText("Le contexte graphique a été perdu")).toBeVisible();
    await page.locator(".lab-fatal").getByRole("button", { name: "Passer au mode sobre" }).click();
    await expect(page.locator("#experiences")).toBeVisible();
  });

  test("quitter le lab libère la scène", async ({ page }) => {
    await page.locator(".mode-switch").click();
    await expect(page.locator(".lab-root")).toHaveCount(0);
    expect(await page.evaluate(() => typeof window.__lab)).toBe("undefined");
    expect(await page.evaluate(() => document.querySelectorAll("canvas").length)).toBe(0);
  });
});
