"use client";
/**
 * Bandeau de consentement (recommandations CNIL) : trois boutons de même
 * poids visuel — « Tout accepter », « Tout refuser », « Personnaliser » —,
 * aucune case précochée, refus aussi simple que l'accord. Le site reste
 * entièrement utilisable tant que le visiteur n'a pas choisi.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useConsent } from "@/state/consent";

function Panel() {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const current = useConsent((s) => s.preferences);
  const decided = useConsent((s) => s.decided);
  const save = useConsent((s) => s.save);
  const closePanel = useConsent((s) => s.closePanel);
  const [prefs, setPrefs] = useState(decided ? current : false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!d.open) d.showModal();
    const onClose = () => {
      closePanel();
      const back = opener.current;
      if (back && document.contains(back) && back !== document.body) back.focus({ preventScroll: true });
      else document.getElementById("contenu")?.focus({ preventScroll: true });
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, [closePanel]);

  return (
    <dialog ref={ref} className="consent-panel" aria-labelledby={titleId}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          save(prefs);
          ref.current?.close();
        }}
      >
        <header className="consent-panel__head">
          <h2 id={titleId}>Personnaliser le stockage</h2>
          <button type="button" className="consent-panel__x" aria-label="Fermer sans modifier" onClick={() => ref.current?.close()}>
            ×
          </button>
        </header>
        <p className="consent-panel__intro">
          Aucun cookie publicitaire, aucune mesure d&apos;audience, aucun traceur tiers. Vous choisissez seulement ce que ce site
          garde dans votre navigateur.
        </p>
        <fieldset className="consent-cat">
          <legend>Strictement nécessaire</legend>
          <p>
            Mémorisation de votre choix de consentement (accord ou refus) pendant 6 mois, pour ne pas vous le redemander à chaque
            visite. <span className="consent-cat__always mono">Toujours actif</span>
          </p>
        </fieldset>
        <fieldset className="consent-cat">
          <legend>Préférences et progression</legend>
          <label className="consent-switch">
            <input type="checkbox" role="switch" checked={prefs} onChange={(e) => setPrefs(e.target.checked)} />
            <span className="consent-switch__track" aria-hidden="true" />
            <span>{prefs ? "Autorisé" : "Refusé"}</span>
          </label>
          <ul>
            <li>Mode de visite préféré (sobre ou lab 3D)</li>
            <li>Réglages du son, de l&apos;accessibilité (animations réduites) et de la qualité graphique</li>
            <li>État du tutoriel du lab</li>
            <li>Progression de la mission 3D, anomalies trouvées, meilleur tour du circuit et véhicule débloqué</li>
          </ul>
          <p className="consent-cat__note">
            Stocké uniquement dans votre navigateur (stockage local), jamais transmis. Sans accord, ces réglages restent en
            mémoire le temps de la visite.
          </p>
        </fieldset>
        <div className="consent-actions">
          <button type="button" className="btn btn--ghost" onClick={() => (save(true), ref.current?.close())}>
            Tout accepter
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => (save(false), ref.current?.close())}>
            Tout refuser
          </button>
          <button type="submit" className="btn">
            Enregistrer mes choix
          </button>
        </div>
        <p className="consent-panel__more">
          <a href="/confidentialite#stockage-local">Politique de confidentialité</a>
        </p>
      </form>
    </dialog>
  );
}

export function ConsentBanner() {
  const ready = useConsent((s) => s.ready);
  const decided = useConsent((s) => s.decided);
  const panelOpen = useConsent((s) => s.panelOpen);
  const init = useConsent((s) => s.init);
  const acceptAll = useConsent((s) => s.acceptAll);
  const refuseAll = useConsent((s) => s.refuseAll);
  const openPanel = useConsent((s) => s.openPanel);
  const titleId = useId();

  useEffect(() => init(), [init]);

  if (!ready) return null;
  return (
    <>
      {!decided ? (
        <section className="consent" aria-labelledby={titleId} data-consent-banner="">
          <div className="consent__text">
            <h2 id={titleId} className="consent__title">
              Vos préférences, votre choix
            </h2>
            <p>
              Ce site n&apos;utilise ni cookie publicitaire ni mesure d&apos;audience. Avec votre accord, il garde dans votre
              navigateur vos préférences (mode sobre ou 3D, son, accessibilité, graphismes) et votre progression dans le lab 3D,
              pour les retrouver à votre prochaine visite. Sans accord, tout fonctionne : rien n&apos;est conservé après la visite.{" "}
              <a href="/confidentialite#stockage-local">En savoir plus</a>
            </p>
          </div>
          <div className="consent-actions">
            <button type="button" className="btn btn--ghost" onClick={acceptAll}>
              Tout accepter
            </button>
            <button type="button" className="btn btn--ghost" onClick={refuseAll}>
              Tout refuser
            </button>
            <button type="button" className="btn btn--ghost" onClick={openPanel}>
              Personnaliser
            </button>
          </div>
        </section>
      ) : null}
      {panelOpen ? <Panel /> : null}
    </>
  );
}

/** Lien « Gérer les cookies » du pied de page : rouvre le panneau à tout moment. */
export function ManageConsentButton({ className = "linklike" }: { className?: string }) {
  const openPanel = useConsent((s) => s.openPanel);
  const init = useConsent((s) => s.init);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        init();
        openPanel();
      }}
    >
      Gérer les cookies
    </button>
  );
}
