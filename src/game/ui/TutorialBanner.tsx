"use client";
/**
 * Bandeau d'accueil pour les débutants : discret, en bas de l'écran, jamais
 * bloquant (on peut marcher et interagir pendant qu'il est affiché).
 *
 * - « Compris » : masqué pour la session (sessionStorage) ;
 * - « Ignorer le tutoriel » : masqué définitivement (réglage persisté) ;
 * - la première interaction réussie avec une borne le termine d'elle-même.
 */
import { useState } from "react";
import type { WorldId } from "@/data/types";
import { useApp } from "@/state/app";
import { hasCoarsePointer } from "@/lib/device";

const SESSION_KEY = "evann-tutorial-hidden";

function hiddenForSession(world: WorldId): boolean {
  try {
    return (sessionStorage.getItem(SESSION_KEY) ?? "").split(",").includes(world);
  } catch {
    return false;
  }
}

function hideForSession(world: WorldId): void {
  try {
    const list = new Set((sessionStorage.getItem(SESSION_KEY) ?? "").split(",").filter(Boolean));
    list.add(world);
    sessionStorage.setItem(SESSION_KEY, [...list].join(","));
  } catch {
    /* stockage indisponible : masqué jusqu'au prochain chargement seulement */
  }
}

const TEXTS: Record<WorldId, { keyboard: React.ReactNode; touch: React.ReactNode; title: string }> = {
  lab: {
    title: "Première visite dans le Lab",
    keyboard: (
      <>
        Première visite dans le Lab ? Déplace-toi avec <strong>ZQSD</strong> et approche-toi d&apos;une borne lumineuse pour
        interagir (<strong>E</strong>).
      </>
    ),
    touch: (
      <>
        Première visite dans le Lab ? Déplace-toi avec le <strong>joystick</strong> et approche-toi d&apos;une borne lumineuse,
        puis touche <strong>Interagir</strong>.
      </>
    ),
  },
  circuit: {
    title: "Bienvenue sur le circuit",
    keyboard: (
      <>
        Bienvenue sur le circuit ! Quatre spots de l&apos;infield cachent une anomalie. Le kart des stands se prend avec{" "}
        <strong>E</strong>, le sas du paddock ramène au lab.
      </>
    ),
    touch: (
      <>
        Bienvenue sur le circuit ! Quatre spots de l&apos;infield cachent une anomalie. Approche-toi du kart des stands puis touche{" "}
        <strong>Interagir</strong>.
      </>
    ),
  },
};

/** Mode course (commande `cars`) : on arrive au volant du stock-car. */
const RACER = {
  title: "Racer mode",
  keyboard: (
    <>
      Racer mode : stock-car n°49 en piste. <strong>Z</strong>/<strong>↑</strong> accélérer, <strong>S</strong> freiner puis reculer,{" "}
      <strong>Q</strong>/<strong>D</strong> braquer, <strong>Espace</strong> déraper, <strong>F</strong> descendre.
    </>
  ),
  touch: (
    <>
      Racer mode : stock-car n°49 en piste. Joystick vers le haut pour accélérer, sur les côtés pour braquer ; maintiens{" "}
      <strong>Drift</strong> pour déraper.
    </>
  ),
};

export function TutorialBanner({ world, extra }: { world: WorldId; extra?: React.ReactNode }) {
  const tutorial = useApp((s) => s.settings.tutorial);
  const updateSettings = useApp((s) => s.updateSettings);
  const [hidden, setHidden] = useState(() => hiddenForSession(world));
  const [coarse] = useState(() => hasCoarsePointer());
  const racer = useApp((s) => s.isNascarUnlocked) && world === "circuit";
  // Le circuit n'a pas d'étape « terminée » : seul « ignorer » le fait disparaître d'une session à l'autre.
  const off = tutorial === "skipped" || (world === "lab" && tutorial === "done");
  if (off || hidden) return null;
  const text = racer ? RACER : TEXTS[world];
  return (
    <aside className="hud-guide" aria-label={text.title}>
      <p className="hud-guide__text">
        {coarse ? text.touch : text.keyboard}
        {extra ? <span className="hud-guide__extra"> {extra}</span> : null}
      </p>
      <div className="hud-guide__actions">
        <button
          type="button"
          className="lab-btn lab-btn--primary"
          onClick={() => {
            hideForSession(world);
            setHidden(true);
          }}
        >
          Compris
        </button>
        <button type="button" className="lab-btn" onClick={() => updateSettings({ tutorial: "skipped" })}>
          Ignorer le tutoriel
        </button>
      </div>
    </aside>
  );
}
