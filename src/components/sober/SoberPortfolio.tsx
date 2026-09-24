import { profile } from "@/data";
import { Terminal } from "@/components/terminal/Terminal";
import { ResetPreferences } from "@/components/ResetPreferences";
import { Hero } from "./Hero";
import { About, ExperienceSection } from "./Career";
import { SkillsSection } from "./Skills";
import { HomeLabSection, ProjectsSection } from "./Projects";
import { ContactSection, EducationSection } from "./Credentials";
import { HobbiesSection } from "./Hobbies";
import { SectionHeading } from "./common";

const NAV = [
  { href: "#a-propos", label: "À propos" },
  { href: "#experiences", label: "Expériences" },
  { href: "#competences", label: "Compétences" },
  { href: "#projets", label: "Projets" },
  { href: "#homelab", label: "HomeLab" },
  { href: "#formations", label: "Formations" },
  { href: "#loisirs", label: "Loisirs" },
  { href: "#contact", label: "Contact" },
  { href: "#terminal", label: "Terminal" },
];

export function SoberPortfolio() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="#top" aria-label={`${profile.fullName}, retour en haut`}>
            <span className="brand__mark mono" aria-hidden="true">
              EB
            </span>
            <span className="brand__name">{profile.fullName}</span>
          </a>
          <nav className="site-nav" aria-label="Sections du portfolio">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" className="sober" tabIndex={-1}>
        <div id="top" />
        <Hero />
        <About />
        <ExperienceSection />
        <SkillsSection />
        <ProjectsSection />
        <HomeLabSection />
        <EducationSection />
        <HobbiesSection />
        <ContactSection />
        <section className="section section--terminal" aria-labelledby="terminal">
          <SectionHeading
            id="terminal"
            index="09"
            title="Terminal"
            lead="Un bonus pour les curieux : tout ce qu'il affiche se trouve déjà plus haut. Tapez help pour commencer."
          />
          <Terminal />
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p>
            {profile.fullName} · {profile.location}
          </p>
          <p className="site-footer__credits">
            Conçu avec Next.js, React, Three.js et Rapier. Typographies IBM Plex (licence SIL OFL). Mission du lab : simulation
            locale, sans connexion à une infrastructure réelle.
          </p>
          <ResetPreferences />
        </div>
      </footer>
    </>
  );
}
