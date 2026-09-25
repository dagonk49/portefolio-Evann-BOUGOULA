import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { absoluteUrl, homeJsonLd, jsonLdScript, pageMetadata, SITE_URL } from "./site";

describe("référencement", () => {
  it("adresse publique par défaut : evann-bougoula.dagz.fr", () => {
    expect(SITE_URL).toBe("https://evann-bougoula.dagz.fr");
    expect(absoluteUrl("/")).toBe("https://evann-bougoula.dagz.fr");
    expect(absoluteUrl("/mentions-legales")).toBe("https://evann-bougoula.dagz.fr/mentions-legales");
  });

  it("robots.txt : règles explicites et lien vers le sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
    expect(r.sitemap).toBe("https://evann-bougoula.dagz.fr/sitemap.xml");
  });

  it("sitemap.xml : accueil et pages légales, sans la page /cv", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual([
      "https://evann-bougoula.dagz.fr",
      "https://evann-bougoula.dagz.fr/mentions-legales",
      "https://evann-bougoula.dagz.fr/confidentialite",
    ]);
  });

  it("métadonnées de page : canonique, Open Graph avec image, carte Twitter large", () => {
    const m = pageMetadata({ path: "/", title: "T", description: "D" });
    expect(m.alternates?.canonical).toBe("/");
    expect(m.openGraph).toMatchObject({ url: "/", locale: "fr_FR", type: "profile" });
    expect(JSON.stringify(m.openGraph)).toContain("/og-image.png");
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("JSON-LD : une personne réelle, avec uniquement des données documentées", () => {
    const data = homeJsonLd();
    const person = data["@graph"].find((g) => g["@type"] === "Person") as Record<string, unknown>;
    expect(person).toMatchObject({
      name: "Evann Bougoula",
      email: "mailto:evann.bougoula@dagz.fr",
      jobTitle: "Alternant technicien informatique",
      sameAs: ["https://www.linkedin.com/in/evann-bougoula", "https://github.com/dagonk49"],
    });
    expect(person).not.toHaveProperty("telephone");
    expect(person).not.toHaveProperty("image");
    expect(jsonLdScript({ a: "</script><script>" })).not.toContain("</script>");
  });
});
