"use client";
import { useApp } from "@/state/app";

/**
 * Bouton permanent de retour au mode sobre, affiché dans le lab 3D.
 * En mode sobre, la bascule vers la 3D se trouve dans l'en-tête et l'accroche.
 */
export function ModeSwitch() {
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  if (mode !== "lab") return null;
  return (
    <button type="button" className="mode-switch mode-switch--lab" onClick={() => setMode("sober")}>
      <span className="mode-switch__dot" aria-hidden="true" />
      <span className="mode-switch__long">Passer au mode sobre</span>
      <span className="mode-switch__short" aria-hidden="true">
        Mode sobre
      </span>
    </button>
  );
}
