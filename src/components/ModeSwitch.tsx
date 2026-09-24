"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/state/app";
import { detectWebGL } from "@/lib/device";

/** Bouton permanent de changement de mode (sobre ⇄ lab 3D). */
export function ModeSwitch() {
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => setWebgl(detectWebGL()), []);

  if (mode === "lab") {
    return (
      <button type="button" className="mode-switch mode-switch--lab" onClick={() => setMode("sober")}>
        <span className="mode-switch__dot" aria-hidden="true" />
        <span className="mode-switch__long">Passer au mode sobre</span>
        <span className="mode-switch__short" aria-hidden="true">
          Mode sobre
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="mode-switch"
      onClick={() => webgl && setMode("lab")}
      disabled={!webgl}
      title={webgl ? undefined : "WebGL indisponible sur ce navigateur"}
    >
      <span className="mode-switch__dot" aria-hidden="true" />
      <span className="mode-switch__long">{webgl ? "Explorer le lab (3D)" : "Lab 3D indisponible"}</span>
      <span className="mode-switch__short" aria-hidden="true">
        {webgl ? "Lab 3D" : "3D indisponible"}
      </span>
    </button>
  );
}
