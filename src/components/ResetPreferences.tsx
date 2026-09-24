"use client";
import { useState } from "react";
import { useApp } from "@/state/app";

/** Efface les préférences et la progression enregistrées dans ce navigateur. */
export function ResetPreferences() {
  const resetAll = useApp((s) => s.resetAll);
  const storageOk = useApp((s) => s.storageOk);
  const [done, setDone] = useState(false);
  return (
    <p className="reset-prefs">
      <button
        type="button"
        className="linklike"
        onClick={() => {
          resetAll();
          setDone(true);
        }}
      >
        Réinitialiser mes préférences et ma progression
      </button>
      <span role="status" className="reset-prefs__status">
        {done ? " — c'est fait." : storageOk ? "" : " (stockage local indisponible : rien n'est enregistré)"}
      </span>
    </p>
  );
}
