import type { Page } from "@playwright/test";

export const STORAGE_KEY = "evann-root-access";
export const CONSENT_KEY = "evann-consent";

/**
 * Consentement déjà donné (ou refusé) : le bandeau ne s'affiche pas.
 * Écrit une seule fois par onglet, pour que les rechargements gardent l'état réel.
 */
export async function seedConsent(page: Page, preferences = true) {
  await page.addInitScript(
    ([key, prefs]) => {
      if (!sessionStorage.getItem("__consentSeeded")) {
        localStorage.setItem(key as string, JSON.stringify({ v: 1, preferences: prefs, decidedAt: new Date().toISOString() }));
        sessionStorage.setItem("__consentSeeded", "1");
      }
    },
    [CONSENT_KEY, preferences] as const,
  );
}

/** Réglages de test : qualité fixe (pas d'ajustement auto sous SwiftShader), aide déjà vue, stockage autorisé. */
export async function seedSettings(page: Page, extra: Record<string, unknown> = {}) {
  await seedConsent(page, true);
  const value = JSON.stringify({
    v: 1,
    savedAt: "",
    data: { modePreference: null, settings: { quality: "low", autoQuality: false, effects: false, tutorial: "done" }, ...extra },
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

/** Bouton « Basculer en 3D » de l'accroche. */
export const launchButton = (page: Page) => page.locator('[data-choice="lab"]');

export async function enterLab(page: Page) {
  await launchButton(page).click();
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

/** Remplace window.print par un enregistreur (l'impression bloquerait le test). */
export async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __prints: { fiche: string | null; openDetails: number; totalDetails: number; target: number }[] };
    w.__prints = [];
    window.print = () => {
      w.__prints.push({
        fiche: document.body.dataset.printFiche ?? null,
        openDetails: document.querySelectorAll("details[open]").length,
        totalDetails: document.querySelectorAll("details").length,
        target: document.querySelectorAll("[data-print-target]").length,
      });
      window.dispatchEvent(new Event("afterprint"));
    };
  });
}
