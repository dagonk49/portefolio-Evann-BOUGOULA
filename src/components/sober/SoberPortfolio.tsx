import { profile } from "@/data";
import { Terminal } from "@/components/terminal/Terminal";
import { ResetPreferences } from "@/components/ResetPreferences";
import { PrintHooks } from "@/components/PrintButton";
import { ManageConsentButton } from "@/components/consent/ConsentBanner";
import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { ParcoursSection } from "./Parcours";
import { RealisationsSection } from "./Realisations";
import { HomeLabSection, NetForgeSection } from "./Projects";
import { SkillsSection } from "./Skills";
import { ContactSection } from "./Contact";
import { PrintSummary } from "./PrintSummary";
import { SectionHeading } from "./common";

export function SoberPortfolio() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <SiteHeader />
      <PrintHooks />

      <main id="contenu" className="sober" tabIndex={-1}>
        <div id="top" />
        <PrintSummary />
        <Hero />
        <ParcoursSection />
        <RealisationsSection />
        <NetForgeSection />
        <HomeLabSection />
        <SkillsSection />
        <ContactSection />
        <section className="section section--terminal" data-nav="terminal" aria-labelledby="terminal">
          <SectionHeading
            id="terminal"
            index="07"
            title="CLI"
            lead={
              <>
                Pour les curieux : le portfolio en ligne de commande. Tapez <kbd>help</kbd> pour commencer ; tout ce qu&apos;il
                affiche se trouve aussi plus haut.
              </>
            }
          />
          <Terminal />
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__id">
            <p className="site-footer__name">{profile.fullName}</p>
            <p className="mono">
              {profile.shortRole} · BTS SIO SISR · {profile.location}
            </p>
          </div>
          <nav className="site-footer__legal" aria-label="Informations légales">
            <ul>
              <li>
                <a href="/mentions-legales">Mentions légales</a>
              </li>
              <li>
                <a href="/confidentialite">Confidentialité &amp; CGU</a>
              </li>
              <li>
                <ManageConsentButton />
              </li>
            </ul>
          </nav>
          <ResetPreferences />
          <p className="site-footer__credits">
            Site statique conçu et hébergé par mes soins : Next.js, React, Three.js et Rapier. Typographies Inter et IBM Plex Mono
            (licence SIL OFL). Aucun cookie publicitaire, aucune mesure d&apos;audience. Mission du lab : simulation locale, sans
            connexion à une infrastructure réelle.
          </p>
        </div>
      </footer>
    </>
  );
}
