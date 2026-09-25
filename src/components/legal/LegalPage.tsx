import type { ReactNode } from "react";
import { profile } from "@/data";
import { ManageConsentButton } from "@/components/consent/ConsentBanner";

/** Gabarit des pages légales : en-tête simple, sommaire, pied de page commun. */
export function LegalPage({
  title,
  updated,
  toc,
  children,
}: {
  title: string;
  updated: string;
  toc: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="site-header legal-header">
        <div className="site-header__inner">
          <a className="brand" href="/" aria-label={`${profile.fullName}, retour au portfolio`}>
            <span className="brand__mark mono" aria-hidden="true">
              EB
            </span>
            <span className="brand__name">{profile.fullName}</span>
          </a>
          <a className="btn btn--ghost btn--small" href="/">
            <span className="btn__icon" aria-hidden="true">
              ←
            </span>
            Retour au portfolio
          </a>
        </div>
      </header>
      <main id="contenu" className="legal" tabIndex={-1}>
        <h1>{title}</h1>
        <p className="legal__updated mono">Dernière mise à jour : {updated}</p>
        <nav className="legal__toc" aria-label="Sommaire">
          <p className="mono">Sommaire</p>
          <ol>
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>{t.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__id">
            <p className="site-footer__name">{profile.fullName}</p>
            <p className="mono">Portfolio · BTS SIO SISR</p>
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
        </div>
      </footer>
    </>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
}
