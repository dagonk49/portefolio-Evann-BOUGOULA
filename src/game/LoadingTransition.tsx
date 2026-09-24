"use client";
import type { Travel } from "@/state/labUi";

const TITLES = {
  circuit: "Transfert vers le circuit extérieur",
  lab: "Retour à la salle serveur",
} as const;

/**
 * Écran de chargement entre les deux mondes, façon terminal : jauges néon et
 * journal des étapes réellement exécutées (démontage de la scène, libération
 * de la mémoire graphique, montage du nouveau monde, moteur physique prêt).
 */
export function LoadingTransition({ travel }: { travel: Travel }) {
  // L'approche caméra se joue dans la scène : l'écran n'apparaît qu'ensuite.
  const approach = travel.steps.find((s) => s.id === "approach");
  if (approach && approach.status !== "done") return null;
  const current = travel.steps.find((s) => s.status === "active") ?? travel.steps[travel.steps.length - 1];
  const pct = Math.round(travel.progress * 100);
  return (
    <div className={`lt ${travel.done ? "is-done" : ""}`} data-world={travel.to}>
      <div className="lt__frame">
        <p className="lt__head">
          <span className="lt__brand">EVANN // ROOT ACCESS</span>
          <span className="lt__title">{TITLES[travel.to]}</span>
        </p>
        <div
          className="lt__gauge"
          role="progressbar"
          aria-label="Chargement du monde"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <ol className="lt__log">
          {travel.steps
            .filter((s) => s.id !== "approach")
            .map((s) => (
              <li key={s.id} className={`is-${s.status}`}>
                <span className="lt__mark" aria-hidden="true">
                  {s.status === "done" ? "[ OK ]" : s.status === "active" ? "[ .. ]" : "[    ]"}
                </span>
                <span className="lt__label">
                  {s.label}
                  {s.detail ? <span className="lt__detail"> {s.detail}</span> : null}
                </span>
                <span className="lt__bar" aria-hidden="true">
                  <i />
                </span>
              </li>
            ))}
        </ol>
        <p className="lt__pct" aria-hidden="true">
          {pct} %
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {travel.done ? "Root access granted. Monde chargé." : current?.label}
      </p>
    </div>
  );
}
