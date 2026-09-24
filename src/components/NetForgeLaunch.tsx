"use client";
import { useState } from "react";
import { getProject } from "@/data";

/**
 * Carte d'accès à la plateforme NetForge en production.
 *
 * - Le lien est le vrai site (nouvel onglet, sans référent ni accès à la page).
 * - L'aperçu est une maquette stylisée des quatre piliers, pas une capture.
 * - L'aperçu en direct (iframe) ne se charge qu'à la demande : aucune requête
 *   vers le site tant que le visiteur ne l'a pas demandé.
 */
export function NetForgeLaunch({ variant }: { variant: "sober" | "lab" }) {
  const p = getProject("netforge")!;
  const url = p.liveUrl ?? p.links[0]?.href;
  const [live, setLive] = useState(false);
  if (!url) return null;
  const host = new URL(url).host;
  return (
    <div className={`nf-launch nf-launch--${variant}`}>
      <div className="nf-launch__head">
        <p className="nf-launch__status mono">
          <span className="nf-launch__dot" aria-hidden="true" /> Plateforme en ligne
        </p>
        <ul className="nf-launch__badges" aria-label="Caractéristiques de NetForge">
          {(p.badges ?? []).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      {live ? (
        <figure className="nf-launch__frame">
          <iframe
            src={url}
            title={`Aperçu en direct de NetForge (${host})`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          <figcaption className="nf-launch__note">
            Aperçu en direct du site. S&apos;il reste vide, le site n&apos;autorise pas son intégration dans une autre page : utilisez le
            bouton d&apos;accès.{" "}
            <button type="button" className="nf-launch__text-btn" onClick={() => setLive(false)}>
              Revenir à la maquette
            </button>
          </figcaption>
        </figure>
      ) : (
        <figure className="nf-launch__preview" aria-label="Maquette stylisée de l'interface NetForge">
          <div className="nf-mock" aria-hidden="true">
            <div className="nf-mock__bar">
              <span className="nf-mock__dots">
                <i />
                <i />
                <i />
              </span>
              <span className="nf-mock__url mono">{host}</span>
            </div>
            <div className="nf-mock__body">
              <p className="nf-mock__brand">NetForge</p>
              <ol className="nf-mock__tiles">
                {p.pillars.map((pl, i) => (
                  <li key={pl.id}>
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                    {pl.title}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <figcaption className="nf-launch__note">Maquette illustrative des quatre piliers, pas une capture de l&apos;application.</figcaption>
        </figure>
      )}

      <div className="nf-launch__actions">
        <a className="nf-cta" href={url} target="_blank" rel="noopener noreferrer">
          Accéder à la plateforme NetForge ({host}) <span aria-hidden="true">↗</span>
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
        {!live ? (
          <button type="button" className="nf-launch__text-btn" onClick={() => setLive(true)}>
            Charger un aperçu en direct ici
          </button>
        ) : null}
      </div>
    </div>
  );
}
