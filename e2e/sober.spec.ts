import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { seedSettings } from "./helpers";

test.describe("mode sobre", () => {
  test("le parcours complet est lisible sans jouer ni charger la 3D", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Evann Bougoula" })).toBeVisible();
    await expect(page.getByText("Alternant technicien informatique chez Établissement Français du Sang").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Explorer mon lab (3D)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir mon parcours (Sobre)" })).toBeVisible();

    const xp = page.locator(".timeline > li");
    await expect(xp).toHaveCount(5);
    await expect(page.locator(".xp__badge")).toHaveText(["stage 3/3", "stage 2/3", "stage 1/3"]);
    await expect(page.locator("#experience-moizan-2024")).toContainText("EURL Moizan");
    await expect(page.locator("#formation-bts-sio-sisr")).toContainText("fin prévue en juillet 2028");
    await expect(page.locator("#formation-bac-pro-ciel")).toContainText("17,14/20");
    await expect(page.locator(".cert")).toHaveCount(3);
    await expect(page.locator("#projet-netforge")).toContainText("Adressage IP et VLSM");
    await expect(page.locator("#homelab")).toBeAttached();

    // Aucun chargement du moteur 3D tant que le lab n'est pas lancé.
    await page.waitForLoadState("networkidle");
    expect(requests.some((u) => /rapier|three/i.test(u))).toBe(false);
    const html = await page.content();
    expect(html).not.toMatch(/lorem|à compléter|TODO/i);
  });

  test("les ancres internes existent et les liens externes sont réels", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const h of hrefs.filter((x) => x.startsWith("#"))) {
      if (h === "#") continue;
      expect(await page.locator(h).count(), `ancre ${h}`).toBeGreaterThan(0);
    }
    const external = [...new Set(hrefs.filter((x) => /^https?:/.test(x)))].sort();
    expect(external).toEqual(["https://netforge.dagz.fr", "https://www.linkedin.com/in/evann-bougoula"]);
  });

  test("NetForge : carte d'accès à la plateforme réelle, sans démo locale", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto("/");
    const card = page.locator("#projet-netforge .nf-launch");
    await expect(card.locator(".nf-launch__badges li")).toHaveText(["Outil en ligne", "IPAM", "Cisco CLI", "VLSM"]);
    const cta = card.getByRole("link", { name: /Accéder à la plateforme NetForge \(netforge\.dagz\.fr\)/ });
    await expect(cta).toHaveAttribute("href", "https://netforge.dagz.fr");
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    await expect(cta).toContainText("↗");
    await expect(card).toContainText("Maquette illustrative");
    // L'ancienne démonstration VLSM a disparu.
    await expect(page.locator(".demo")).toHaveCount(0);
    await expect(page.getByText("Calcul VLSM")).toHaveCount(0);
    // Aucune requête vers le site tant que l'aperçu en direct n'est pas demandé.
    await page.waitForLoadState("networkidle");
    expect(requests.some((u) => u.includes("netforge.dagz.fr"))).toBe(false);
    await card.getByRole("button", { name: "Charger un aperçu en direct ici" }).click();
    const frame = card.locator("iframe");
    await expect(frame).toHaveAttribute("src", "https://netforge.dagz.fr");
    await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
    await expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  test("section « Hors de l'infra » : les quatre loisirs fournis", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Sections du portfolio" }).getByRole("link", { name: "Loisirs" })).toHaveAttribute("href", "#loisirs");
    const cards = page.locator(".hobby");
    await expect(cards).toHaveCount(4);
    await expect(page.locator("#loisir-valorant")).toContainText("Duelist ou Initiator, prêt à clutch l'infra");
    await expect(page.locator("#loisir-gta")).toContainText("Le seul braquage toléré est celui d'une baie mal brassée.");
  });

  test("audit d'accessibilité automatique (axe)", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("navigation clavier : lien d'évitement et focus visible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenu$/);
  });

  test("sans WebGL, le lab est signalé indisponible et le parcours reste accessible", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error — simulation d'un navigateur sans WebGL
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
      };
    });
    await page.goto("/");
    const launch = page.getByRole("button", { name: "Explorer mon lab (3D)" });
    await expect(launch).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText("WebGL n'est pas disponible sur ce navigateur")).toBeVisible();
    await expect(page.locator(".mode-switch")).toBeDisabled();
    await launch.click({ force: true });
    await expect(page.locator(".lab-root")).toHaveCount(0);
    await expect(page.locator("#experiences")).toBeVisible();
  });

  test("le choix de mode est mémorisé et le stockage indisponible ne casse rien", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("stockage bloqué");
        },
      });
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".reset-prefs__status")).toContainText("stockage local indisponible");
  });

  test("réglages seedés : aucune préférence n'ouvre le lab d'office", async ({ page }) => {
    await seedSettings(page);
    await page.goto("/");
    await expect(page.locator(".lab-root")).toHaveCount(0);
  });
});
