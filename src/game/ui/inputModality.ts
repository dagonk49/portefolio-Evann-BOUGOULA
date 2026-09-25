/**
 * Dernière modalité d'entrée du visiteur (pointeur ou clavier).
 *
 * Sert à rendre le focus au bon endroit en fermant une fenêtre : ouverte à
 * la souris ou au doigt, la fenêtre rend le focus au jeu (sinon Entrée et
 * Espace réactiveraient le bouton du HUD cliqué plus tôt et rouvriraient
 * l'ancienne interface) ; ouverte au clavier, elle le rend à son déclencheur.
 */
let last: "pointer" | "keyboard" = "keyboard";
let attached = false;

export function trackInputModality(): () => void {
  if (attached || typeof window === "undefined") return () => undefined;
  attached = true;
  const onPointer = () => {
    last = "pointer";
  };
  const onKey = (e: KeyboardEvent) => {
    // Seules les touches de navigation et d'activation comptent (pas les touches de jeu isolées).
    if (e.key === "Tab" || e.key === "Enter" || e.key === " " || e.key.startsWith("Arrow")) last = "keyboard";
  };
  window.addEventListener("pointerdown", onPointer, true);
  window.addEventListener("keydown", onKey, true);
  return () => {
    attached = false;
    window.removeEventListener("pointerdown", onPointer, true);
    window.removeEventListener("keydown", onKey, true);
  };
}

export function lastInputWasPointer(): boolean {
  return last === "pointer";
}
