"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/state/app";
import { detectWebGL, isSmallTouchDevice } from "@/lib/device";

/**
 * Bouton « Basculer en 3D », avec les cas WebGL absent et mobile.
 * `placement="header"` : version compacte de l'en-tête, sans note sous le bouton.
 */
export function LabLaunchButton({ placement = "hero" }: { placement?: "hero" | "header" }) {
  const setMode = useApp((s) => s.setMode);
  const [env, setEnv] = useState<{ webgl: boolean; mobile: boolean } | null>(null);

  useEffect(() => {
    setEnv({ webgl: detectWebGL(), mobile: isSmallTouchDevice() });
  }, []);

  const unavailable = env !== null && !env.webgl;
  const noteId = `lab-launch-note-${placement}`;
  const showNote = placement === "hero" && (unavailable || env?.mobile);
  return (
    <span className={`lab-launch lab-launch--${placement}`}>
      <button
        type="button"
        className={placement === "hero" ? "btn" : "btn btn--small"}
        data-choice={placement === "hero" ? "lab" : "lab-header"}
        onClick={() => !unavailable && setMode("lab")}
        aria-disabled={unavailable || undefined}
        aria-describedby={showNote ? noteId : undefined}
        title={unavailable ? "WebGL indisponible sur ce navigateur" : undefined}
        aria-label={placement === "header" ? "Basculer en 3D" : undefined}
      >
        <span className="btn__icon" aria-hidden="true">
          ◇
        </span>
        {placement === "header" ? (
          <span>
            <span className="hide-compact">Basculer en </span>3D
          </span>
        ) : (
          "Basculer en 3D"
        )}
      </button>
      {showNote ? (
        <span id={noteId} className="lab-launch__note">
          {unavailable
            ? "WebGL n'est pas disponible sur ce navigateur : le lab 3D ne peut pas s'ouvrir. Tout le parcours reste ici."
            : "Conçu d'abord pour ordinateur ; sur mobile, un joystick tactile est fourni."}
        </span>
      ) : null}
    </span>
  );
}
