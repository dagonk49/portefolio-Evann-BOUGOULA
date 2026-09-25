"use client";
import { useEffect, type ReactNode } from "react";
import { installPrintHooks, printFiche, printPortfolio } from "@/lib/print";

/** « Exporter le Portfolio (PDF) » : impression du navigateur, fiches E5 dépliées. */
export function PrintButton({
  className = "btn btn--ghost",
  label = "Exporter le Portfolio (PDF)",
  ariaLabel,
}: {
  className?: string;
  label?: ReactNode;
  /** Nom accessible complet quand le libellé visible est abrégé. */
  ariaLabel?: string;
}) {
  return (
    <button type="button" className={className} onClick={printPortfolio} data-action="export-pdf" aria-label={ariaLabel}>
      <span className="btn__icon" aria-hidden="true">
        ⎙
      </span>
      {label}
    </button>
  );
}

/** « Exporter cette fiche en PDF » : n'imprime que la fiche E5 concernée. */
export function PrintFicheButton({ id, title }: { id: string; title: string }) {
  return (
    <button type="button" className="btn btn--ghost btn--small" onClick={() => printFiche(id)} aria-label={`Exporter cette fiche en PDF : ${title}`}>
      <span className="btn__icon" aria-hidden="true">
        ⎙
      </span>
      Exporter cette fiche en PDF
    </button>
  );
}

/** Écouteurs globaux : ouvre les fiches repliées avant toute impression (Ctrl+P compris). */
export function PrintHooks() {
  useEffect(() => installPrintHooks(), []);
  return null;
}
