"use client";
/**
 * En-tête fixe du mode sobre : navigation par sections avec indicateur de
 * position (lien courant souligné + filet de progression de lecture) et
 * actions (3D, CV, export PDF). Sous 1100 px, la navigation passe dans un
 * menu déroulant.
 */
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data";
import { LabLaunchButton } from "@/components/LabLaunchButton";
import { PrintButton } from "@/components/PrintButton";

export const NAV = [
  { id: "parcours", label: "Parcours" },
  { id: "realisations", label: "Réalisations & Fiches E5" },
  { id: "netforge", label: "NetForge" },
  { id: "homelab", label: "HomeLab" },
  { id: "veille", label: "Veille & Compétences" },
  { id: "contact", label: "Contact" },
  { id: "terminal", label: "CLI" },
] as const;

type NavId = (typeof NAV)[number]["id"];

/** Section dont le haut a dépassé la ligne de lecture (35 % de la fenêtre). */
function currentSection(): NavId | null {
  const line = window.innerHeight * 0.35;
  let active: NavId | null = null;
  for (const n of NAV) {
    const el = document.querySelector<HTMLElement>(`[data-nav="${n.id}"]`);
    if (el && el.getBoundingClientRect().top <= line) active = n.id;
  }
  // En bas de page, la dernière section est active même si elle est courte.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = NAV[NAV.length - 1]!.id;
  return active;
}

export function SiteHeader() {
  const [active, setActive] = useState<NavId | null>(null);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(currentSection());
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Menu mobile : Échap le referme et rend le focus au bouton.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header ${open ? "is-open" : ""}`}>
      <div className="site-header__inner">
        <a className="brand" href="#top" aria-label={`${profile.fullName}, retour en haut`}>
          <span className="brand__mark mono" aria-hidden="true">
            EB
          </span>
          <span className="brand__name">{profile.fullName}</span>
        </a>
        <button
          ref={menuBtn}
          type="button"
          className="site-header__menu mono"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Fermer" : "Menu"}
        </button>
        <nav id="site-nav" className="site-nav" aria-label="Sections du portfolio">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? "location" : undefined}
                  className={active === n.id ? "is-active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="site-actions" role="group" aria-label="Actions">
            <LabLaunchButton placement="header" />
            {profile.cvFile ? (
              <a
                className="btn btn--ghost btn--small"
                href={profile.cvFile}
                download="CV_Evann_Bougoula.pdf"
                data-action="cv-header"
                aria-label="Télécharger le CV (PDF)"
              >
                <span className="btn__icon" aria-hidden="true">
                  ↓
                </span>
                <span>
                  <span className="hide-compact">Télécharger le </span>CV<span className="hide-compact"> (PDF)</span>
                </span>
              </a>
            ) : null}
            <PrintButton
              className="btn btn--ghost btn--small"
              ariaLabel="Exporter le Portfolio (PDF)"
              label={
                <span>
                  <span className="hide-compact">Exporter le Portfolio (</span>PDF<span className="hide-compact">)</span>
                </span>
              }
            />
          </div>
        </nav>
      </div>
      <span className="site-header__progress" aria-hidden="true">
        <span ref={bar} />
      </span>
    </header>
  );
}
