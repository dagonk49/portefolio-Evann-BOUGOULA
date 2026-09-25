/**
 * Export PDF par l'impression du navigateur.
 *
 * - Avant l'impression, toutes les fiches repliées (<details>) sont ouvertes,
 *   puis refermées ensuite : le PDF contient les fiches complètes.
 * - `printFiche(id)` n'imprime qu'une fiche E5 (le reste de la page est masqué
 *   par la feuille d'impression via `body[data-print-fiche]`).
 */

const OPENED = "printOpened";

function openAll(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLDetailsElement>("details:not([open])").forEach((d) => {
    d.dataset[OPENED] = "1";
    d.open = true;
  });
}

function restore() {
  document.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => {
    if (d.dataset[OPENED]) {
      d.open = false;
      delete d.dataset[OPENED];
    }
  });
  delete document.body.dataset.printFiche;
  document.querySelectorAll("[data-print-target]").forEach((el) => el.removeAttribute("data-print-target"));
}

/** Branche les écouteurs d'impression ; renvoie la fonction de nettoyage. */
export function installPrintHooks(): () => void {
  const before = () => openAll();
  const after = () => restore();
  window.addEventListener("beforeprint", before);
  window.addEventListener("afterprint", after);
  return () => {
    window.removeEventListener("beforeprint", before);
    window.removeEventListener("afterprint", after);
  };
}

export function printPortfolio(): void {
  openAll();
  window.print();
}

export function printFiche(id: string): void {
  document.body.dataset.printFiche = id;
  const fiche = document.getElementById(`realisation-${id}`);
  if (fiche) {
    fiche.closest("li")?.setAttribute("data-print-target", "");
    openAll(fiche);
  }
  window.print();
}
