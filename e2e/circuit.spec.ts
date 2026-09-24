import { expect, test } from "@playwright/test";
import { enterLab, seedSettings, STORAGE_KEY, teleport, waitActive, waitIdle } from "./helpers";

const LAB_SAS: [number, number] = [-18.6, -21.3];
const CIRCUIT_SAS: [number, number] = [0, 9.5];
const KART: [number, number] = [-7.2, 10.6];

test.describe("circuit extérieur", () => {
  test("sas du lab → écran de chargement → circuit à pied, kart, puis retour au lab", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await enterLab(page);
    await teleport(page, ...LAB_SAS);
    await waitActive(page, "lab.sas");
    const before = await page.evaluate(() => window.__lab!.stats()!.geometries);
    await page.keyboard.press("e");

    // Transition réelle : journal de déchargement puis de montage.
    const loading = page.locator(".lt");
    await expect(loading).toContainText("Déchargement des modules salle serveur...");
    await expect(loading).toContainText("Allocation mémoire du circuit...");
    await expect(loading).toContainText("Initialisation du moteur physique...");
    await expect(loading).toContainText("Root access granted.");
    await waitIdle(page, "circuit");
    const state = await page.evaluate(() => window.__lab!.state());
    expect(state.driving).toBeNull();
    // Son coupé par défaut, aucune lecture automatique.
    expect(state.audio).toMatchObject({ muted: true, phase: "idle", introPlayed: false });
    await expect(page.locator(".hud")).toHaveAttribute("data-world", "circuit");
    // Nouveau Canvas : le compteur de géométries repart du monde extérieur, pas du lab.
    const after = await page.evaluate(() => window.__lab!.stats()!.geometries);
    expect(after).not.toBe(before);
    await page.locator(".hud-welcome").getByRole("button", { name: "En piste" }).click();

    // Kart des stands : E pour monter, accélérer, F pour descendre.
    await teleport(page, ...KART);
    await waitActive(page, "vehicle:kart");
    await page.keyboard.press("e");
    await page.waitForFunction(() => window.__lab!.state().driving === "kart");
    await expect(page.locator(".hud-drive")).toContainText("km/h");
    const x0 = await page.evaluate(() => window.__lab!.vehicle()!.x);
    await page.keyboard.down("ArrowUp");
    await page.waitForFunction((x) => window.__lab!.vehicle()!.x > x + 3, x0, { timeout: 60_000 });
    await page.keyboard.up("ArrowUp");
    await page.keyboard.press("f");
    await page.waitForFunction(() => window.__lab!.state().driving === null, null, { timeout: 60_000 });

    // Retour par le sas du paddock.
    await teleport(page, ...CIRCUIT_SAS);
    await waitActive(page, "circuit.sas");
    await page.keyboard.press("e");
    await expect(page.locator(".lt")).toContainText("Déchargement du circuit extérieur...");
    await waitIdle(page, "lab");
    const p = await page.evaluate(() => window.__lab!.player());
    expect(Math.hypot(p[0] - -18.2, p[2] - -18.4)).toBeLessThan(2);
  });

  test("cars : mode course mémorisé, arrivée en stock-car et intro sonore", async ({ page }) => {
    await page.goto("/#terminal");
    const box = page.getByLabel("Saisir une commande");
    await box.fill("cars");
    await box.press("Enter");
    await expect(page.locator(".terminal__log")).toContainText(
      "[RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit extérieur pour prendre la piste.",
    );
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? "{}").data?.isNascarUnlocked === true, STORAGE_KEY);
    await page.locator(".terminal__action", { hasText: "aller au circuit" }).click();
    await page.locator(".hud").waitFor({ timeout: 90_000 });
    await waitIdle(page, "circuit");
    const state = await page.evaluate(() => window.__lab!.state());
    expect(state.driving).toBe("stockcar");
    expect(state.audio.muted).toBe(false);
    // Intro lancée (ou bloquée par le navigateur, avec un bouton pour l'activer).
    expect(["intro", "music", "blocked"]).toContain(state.audio.phase);
    const mute = page.locator(".hud-audio__mute");
    await expect(mute).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
    await mute.click();
    await expect(mute).toHaveAttribute("aria-pressed", "false");
    await page.waitForFunction(() => window.__lab!.state().audio.muted === true);
  });

  test("anomalie du circuit : fiche loisir Valorant", async ({ page }) => {
    await seedSettings(page, { world: "circuit" });
    await page.goto("/");
    await enterLab(page);
    await page.locator(".hud-welcome").getByRole("button", { name: "En piste" }).click();
    await teleport(page, -28.2, 3.4);
    await waitActive(page, "anomaly:evann.hobbies.valorant");
    await page.keyboard.press("e");
    const dialog = page.getByRole("dialog", { name: "Valorant" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Duelist ou Initiator, prêt à clutch l'infra.");
    await expect(page.locator(".hud-progress")).toContainText("1/4");
  });
});
