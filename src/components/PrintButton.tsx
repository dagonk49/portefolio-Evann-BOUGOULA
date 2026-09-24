"use client";

export function PrintButton({ className = "btn btn--ghost" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      Imprimer mon parcours
    </button>
  );
}
