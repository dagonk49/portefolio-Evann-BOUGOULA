import { expect, test } from "@playwright/test";
import { seedConsent } from "./helpers";

const SITE = "https://evann-bougoula.dagz.fr";

test.describe("référencement", () => {
  test("robots.txt, sitemap.xml et image d'aperçu sont servis", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(robots.headers()["content-type"]).toContain("text/plain");
    const txt = await robots.text();
    expect(txt).toContain("User-Agent: *");
    expect(txt).toContain("Allow: /");
    expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(sitemap.headers()["content-type"]).toContain("xml");
    const xml = await sitemap.text();
    expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])).toEqual([SITE, `${SITE}/mentions-legales`, `${SITE}/confidentialite`]);

    const og = await request.get("/og-image.png");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toBe("image/png");
    const png = await og.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  test("accueil : canonique, Open Graph complet et JSON-LD Person", async ({ page }) => {
    await seedConsent(page);
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", SITE);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", SITE);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${SITE}/og-image.png`);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    // Pas de faux code de vérification : la balise n'apparaît que si GOOGLE_SITE_VERIFICATION est fourni au build.
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const graph = JSON.parse(raw!)["@graph"] as { "@type": string; name?: string; sameAs?: string[] }[];
    const person = graph.find((g) => g["@type"] === "Person");
    expect(person?.name).toBe("Evann Bougoula");
    expect(person?.sameAs).toContain("https://github.com/dagonk49");
  });

  test("pages légales : canonique propre à chaque page ; /cv non indexée", async ({ page }) => {
    await seedConsent(page);
    await page.goto("/mentions-legales");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/mentions-legales`);
    await page.goto("/confidentialite");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/confidentialite`);
    await page.goto("/cv");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});
