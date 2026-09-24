"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/state/app";
import { detectWebGL, isSmallTouchDevice } from "@/lib/device";

/** Bouton « Explorer mon lab (3D) », avec les cas WebGL absent et mobile. */
export function LabLaunchButton() {
  const setMode = useApp((s) => s.setMode);
  const [env, setEnv] = useState<{ webgl: boolean; mobile: boolean } | null>(null);

  useEffect(() => {
    setEnv({ webgl: detectWebGL(), mobile: isSmallTouchDevice() });
  }, []);

  const unavailable = env !== null && !env.webgl;
  return (
    <span className="lab-launch">
      <button
        type="button"
        className="btn"
        data-choice="lab"
        onClick={() => !unavailable && setMode("lab")}
        aria-disabled={unavailable || undefined}
        aria-describedby={unavailable || env?.mobile ? "lab-launch-note" : undefined}
      >
        Explorer mon lab (3D)
      </button>
      {unavailable ? (
        <span id="lab-launch-note" className="lab-launch__note">
          WebGL n&apos;est pas disponible sur ce navigateur : le lab 3D ne peut pas s&apos;ouvrir. Tout le parcours reste ici.
        </span>
      ) : env?.mobile ? (
        <span id="lab-launch-note" className="lab-launch__note">
          Conçu d&apos;abord pour ordinateur ; sur mobile, un joystick tactile est fourni.
        </span>
      ) : null}
    </span>
  );
}
