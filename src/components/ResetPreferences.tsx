"use client";
import { useState } from "react";
import { useApp } from "@/state/app";
import { useConsent } from "@/state/consent";

/** Efface les préférences et la progression enregistrées dans ce navigateur. */
export function ResetPreferences() {
  const resetAll = useApp((s) => s.resetAll);
  const storageOk = useApp((s) => s.storageOk);
  const consentReady = useConsent((s) => s.ready);
  const allowed = useConsent((s) => s.preferences);
  const [done, setDone] = useState(false);
  const note = !storageOk
    ? " (stockage local indisponible : rien n'est enregistré)"
    : consentReady && !allowed
      ? " (stockage des préférences non autorisé : rien n'est enregistré)"
      : "";
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
        {done ? " — c'est fait." : note}
      </span>
    </p>
  );
}
