import type { Metadata } from "next";
import { ModeRoot } from "@/components/ModeRoot";
import { SoberPortfolio } from "@/components/sober/SoberPortfolio";
import { profile } from "@/data";
import { homeJsonLd, jsonLdScript, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: `${profile.fullName} — Portfolio BTS SIO SISR · ${profile.shortRole}`,
  description: `${profile.headline}, étudiant en BTS SIO SISR à MyDigitalSchool Angers. Réalisations professionnelles et fiches E5, HomeLab Proxmox/Docker, projet NetForge. Consultable en mode sobre ou en lab 3D.`,
});

/**
 * Le mode sobre est rendu en HTML statique (lisible sans JavaScript ni WebGL).
 * `ModeRoot` ajoute la bascule de mode et charge le lab 3D uniquement à la demande.
 */
export default function Home() {
  return (
    <>
      {/* Données structurées (schema.org) : site, page de profil et personne. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(homeJsonLd()) }} />
      <ModeRoot>
        <SoberPortfolio />
      </ModeRoot>
    </>
  );
}
