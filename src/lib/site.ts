/**
 * Référencement : adresse publique du site, métadonnées communes (canonique,
 * Open Graph, Twitter) et données structurées JSON-LD.
 *
 * Utilisé uniquement au build (métadonnées, robots.txt, sitemap.xml) : les
 * variables d'environnement ci-dessous sont lues par `next build`.
 * - SITE_URL : adresse publique (défaut : https://evann-bougoula.dagz.fr) ;
 * - GOOGLE_SITE_VERIFICATION : code de la balise Search Console, si cette
 *   méthode de validation est choisie (sinon aucune balise n'est ajoutée).
 */
import type { Metadata } from "next";
import { certifications, CONTACT_EMAIL, education, GITHUB_URL, LINKEDIN_URL, organizations, profile, projects } from "@/data";

export const SITE_URL = (process.env.SITE_URL || "https://evann-bougoula.dagz.fr").replace(/\/+$/, "");
export const SITE_NAME = `${profile.fullName} — Portfolio`;
export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/** Image des aperçus de lien (1200 × 630), générée par `npm run og`. */
export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${profile.fullName} — alternant technicien informatique (EFS), BTS SIO SISR`,
  type: "image/png",
} as const;

/** Pages publiques indexables (servies sans extension, `trailingSlash: false`). */
export const PUBLIC_PAGES = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
] as const;

/** URL absolue d'une page, écrite comme la balise canonique (racine sans barre finale). */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** Métadonnées d'une page : titre, description, URL canonique, Open Graph et carte Twitter. */
export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: path === "/" ? "profile" : "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [OG_IMAGE],
      ...(path === "/" ? { firstName: profile.firstName, lastName: profile.lastName } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** Données structurées de l'accueil : le site et la personne (schema.org). */
export function homeJsonLd() {
  const efs = organizations.efs!;
  const bac = education.find((e) => e.id === "bac-pro-ciel");
  const bts = education.find((e) => e.id === "bts-sio-sisr");
  const netforge = projects.find((p) => p.id === "netforge");
  const personId = `${SITE_URL}/#person`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: absoluteUrl("/"),
        name: SITE_NAME,
        inLanguage: "fr-FR",
        about: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: absoluteUrl("/"),
        name: SITE_NAME,
        inLanguage: "fr-FR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: profile.fullName,
        givenName: profile.firstName,
        familyName: profile.lastName,
        url: absoluteUrl("/"),
        email: `mailto:${CONTACT_EMAIL}`,
        jobTitle: "Alternant technicien informatique",
        description: profile.status.join(". ") + ".",
        worksFor: { "@type": "Organization", name: efs.name, alternateName: efs.shortName },
        address: { "@type": "PostalAddress", addressLocality: "Angers", addressRegion: "Pays de la Loire", addressCountry: "FR" },
        ...(bts ? { affiliation: { "@type": "EducationalOrganization", name: bts.school } } : {}),
        ...(bac ? { alumniOf: { "@type": "EducationalOrganization", name: bac.school } } : {}),
        hasCredential: certifications.map((c) => ({ "@type": "EducationalOccupationalCredential", name: c.name })),
        knowsAbout: ["Active Directory", "Support informatique", "Proxmox VE", "Docker", "Debian", "Windows Server", "VLAN", "Cisco IOS", "Ubiquiti UniFi", "WireGuard"],
        sameAs: [LINKEDIN_URL, GITHUB_URL],
        ...(netforge?.liveUrl
          ? { owns: { "@type": "SoftwareApplication", name: netforge.name, url: netforge.liveUrl, applicationCategory: "DeveloperApplication" } }
          : {}),
      },
    ],
  };
}

/** Sérialisation sûre pour une balise <script type="application/ld+json">. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
