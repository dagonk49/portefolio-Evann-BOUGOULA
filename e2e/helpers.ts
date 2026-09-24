import type { Page } from "@playwright/test";

export const STORAGE_KEY = "evann-root-access";

/** Réglages de test : qualité fixe (pas d'ajustement auto sous SwiftShader), aide déjà vue. */
export async function seedSettings(page: Page, extra: Record<string, unknown> = {}) {
  const value = JSON.stringify({
    v: 1,
    savedAt: "",
    data: { modePreference: null, settings: { quality: "low", autoQuality: false, effects: false, helpSeen: true }, ...extra },
  });
  await page.addInitScript(
    ([key, v]) => {
      if (!sessionStorage.getItem("__seeded")) {
        localStorage.setItem(key!, v!);
        sessionStorage.setItem("__seeded", "1");
      }
    },
    [STORAGE_KEY, value],
  );
}

export async function enterLab(page: Page) {
  await page.getByRole("button", { name: "Explorer mon lab (3D)" }).click();
  await page.locator(".hud").waitFor({ timeout: 90_000 });
  // Laisse quelques images au moteur physique (rendu logiciel lent).
  await page.waitForFunction(() => !!window.__lab, null, { timeout: 30_000 });
  await waitIdle(page);
}

/** Attend la fin de l'écran de démarrage ou de transition entre mondes. */
export async function waitIdle(page: Page, world?: "lab" | "circuit") {
  await page.waitForFunction(
    (w) => !!window.__lab && window.__lab.state().travel === null && (!w || window.__lab.state().world === w),
    world,
    { timeout: 120_000 },
  );
}

export async function teleport(page: Page, x: number, z: number) {
  await page.evaluate(([px, pz]) => window.__lab!.teleport(px!, pz!), [x, z]);
  await page.waitForFunction(
    ([px, pz]) => {
      const p = window.__lab!.player();
      return Math.hypot(p[0] - px!, p[2] - pz!) < 0.6;
    },
    [x, z],
    { timeout: 30_000 },
  );
}

export async function waitActive(page: Page, id: string) {
  await page.waitForFunction((target) => window.__lab!.state().active === target, id, { timeout: 30_000 });
}
