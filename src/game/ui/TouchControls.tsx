"use client";
import { useRef, useState } from "react";
import type { WorldId } from "@/data/types";
import { useLabUi } from "@/state/labUi";
import { input } from "../input";
import { exitVehicle, interactWith } from "./actions";

const RADIUS = 52;

/** Joystick virtuel et boutons d'action pour écran tactile. */
export function TouchControls({ world = "lab" }: { world?: WorldId }) {
  const panel = useLabUi((s) => s.panel);
  const active = useLabUi((s) => s.active);
  const driving = useLabUi((s) => s.driving);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [run, setRun] = useState(false);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);

  if (panel) return null;

  const release = () => {
    origin.current = null;
    input.touch.x = 0;
    input.touch.y = 0;
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div className="touch">
      <div
        className="touch-stick"
        role="application"
        aria-label="Joystick de déplacement"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const o = origin.current;
          if (!o || e.pointerId !== o.id) return;
          let dx = e.clientX - o.x;
          let dy = e.clientY - o.y;
          const len = Math.hypot(dx, dy);
          if (len > RADIUS) {
            dx = (dx / len) * RADIUS;
            dy = (dy / len) * RADIUS;
          }
          setKnob({ x: dx, y: dy });
          input.touch.x = dx / RADIUS;
          input.touch.y = -dy / RADIUS;
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span className="touch-stick__knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="touch-actions">
        <button
          type="button"
          className={`touch-btn touch-btn--main ${active ? "is-ready" : ""}`}
          onClick={() => active && interactWith(active)}
          disabled={!active}
        >
          Interagir
        </button>
        {world === "circuit" && driving ? (
          <>
            <button
              type="button"
              className="touch-btn"
              onPointerDown={() => (input.touchDrift = true)}
              onPointerUp={() => (input.touchDrift = false)}
              onPointerCancel={() => (input.touchDrift = false)}
              onPointerLeave={() => (input.touchDrift = false)}
            >
              Drift
            </button>
            <button type="button" className="touch-btn" onClick={() => exitVehicle()}>
              Descendre
            </button>
          </>
        ) : (
          <>
            <button type="button" className="touch-btn" onPointerDown={() => (input.jumpAt = performance.now())}>
              Sauter
            </button>
            <button
              type="button"
              className="touch-btn"
              aria-pressed={run}
              onClick={() => {
                input.touchRun = !run;
                setRun(!run);
              }}
            >
              Courir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
