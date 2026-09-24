"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/state/app";
import { detectWebGL, isSmallTouchDevice } from "@/lib/device";
import { ModeSwitch } from "./ModeSwitch";

function LabLoading() {
  const setMode = useApp((s) => s.setMode);
  return (
    <div className="lab-loading" role="status">
      <p className="mono">Chargement du lab…</p>
      <p className="lab-loading__hint">Moteur 3D et physique en cours de téléchargement.</p>
      <button type="button" className="btn btn--ghost btn--small lab-loading__back" onClick={() => setMode("sober")}>
        Voir le parcours en mode sobre
      </button>
    </div>
  );
}

/** Le lab 3D (Three.js, R3F, Rapier) n'est téléchargé qu'à la première ouverture. */
const LabExperience = dynamic(() => import("@/game/LabExperience"), {
  ssr: false,
  loading: () => <LabLoading />,
});

class LabBoundary extends Component<{ onError: (e: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ModeRoot({ children }: { children: ReactNode }) {
  const hydrate = useApp((s) => s.hydrate);
  const hydrated = useApp((s) => s.hydrated);
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  const consumeAnchor = useApp((s) => s.consumeAnchor);
  const [labError, setLabError] = useState<string | null>(null);
  const scrollY = useRef(0);
  const previous = useRef(mode);

  // Hydratation + restauration du mode mémorisé (jamais sur petit écran tactile).
  useEffect(() => {
    hydrate();
    const pref = useApp.getState().modePreference;
    if (pref === "lab" && detectWebGL() && !isSmallTouchDevice()) setMode("lab");
  }, [hydrate, setMode]);

  useEffect(() => {
    const body = document.body;
    if (mode === "lab") {
      if (previous.current !== "lab") scrollY.current = window.scrollY;
      body.classList.add("is-lab");
      setLabError(null);
    } else {
      body.classList.remove("is-lab");
      if (previous.current === "lab") {
        const anchor = consumeAnchor();
        requestAnimationFrame(() => {
          const target = anchor ? document.getElementById(anchor) : null;
          if (target) {
            target.scrollIntoView({ block: "start" });
            target.focus({ preventScroll: true });
          } else {
            window.scrollTo(0, scrollY.current);
            document.querySelector<HTMLElement>(".mode-switch")?.focus();
          }
        });
      }
    }
    previous.current = mode;
  }, [mode, consumeAnchor]);

  const inLab = mode === "lab";
  return (
    <>
      <div id="sober-root" hidden={inLab} inert={inLab} data-hydrated={hydrated ? "true" : undefined}>
        {labError ? (
          <div className="lab-error" role="alert">
            <p>
              Le lab 3D n&apos;a pas pu démarrer sur cet appareil ({labError}). Tout le parcours reste disponible ci-dessous.
            </p>
          </div>
        ) : null}
        {children}
      </div>
      {inLab ? (
        <LabBoundary
          onError={(e) => {
            setLabError(e.message || "erreur de chargement");
            setMode("sober", { remember: false });
          }}
        >
          <LabExperience />
        </LabBoundary>
      ) : null}
      <ModeSwitch />
    </>
  );
}
