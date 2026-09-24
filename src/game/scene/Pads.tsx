"use client";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLabUi } from "@/state/labUi";
import { useApp } from "@/state/app";
import { anomalyById } from "@/data/anomalies";
import { hasCoarsePointer } from "@/lib/device";
import { ANOMALY_PLACEMENTS, type Interactable } from "../layout";
import { currentInteractables } from "../ui/actions";
import { padMaterial } from "../shaders";
import { PALETTE } from "../materials";

/** Dalle lumineuse au sol (losange néon + cercles qui pulsent). */
function Pad({ item, reducedMotion }: { item: Interactable; reducedMotion: boolean }) {
  const material = useMemo(() => padMaterial(PALETTE.amber), []);
  useEffect(() => () => material.dispose(), [material]);
  const active = useRef(0);
  useFrame(({ clock }, dt) => {
    const isActive = useLabUi.getState().active === item.id ? 1 : 0;
    active.current += (isActive - active.current) * (1 - Math.exp(-8 * Math.min(dt, 0.05)));
    material.uniforms.uTime!.value = clock.elapsedTime;
    material.uniforms.uActive!.value = active.current;
    material.uniforms.uMotion!.value = reducedMotion ? 0 : 1;
  });
  const r = item.radius;
  return (
    <mesh position={[item.position[0], item.position[1] + 0.025, item.position[2]]} rotation={[-Math.PI / 2, 0, 0]} material={material} renderOrder={2}>
      <planeGeometry args={[r * 2, r * 2]} />
    </mesh>
  );
}

export function Pads({ reducedMotion, items }: { reducedMotion: boolean; items: Interactable[] }) {
  return (
    <group>
      {items.filter((i) => i.pad).map((item) => (
        <Pad key={item.id} item={item} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}

/** Balise flottante au-dessus du point d'intérêt actif : « [E] INTERAGIR ». */
export function ActivePrompt() {
  const activeId = useLabUi((s) => s.active);
  const panel = useLabUi((s) => s.panel);
  const stabilizing = useLabUi((s) => s.stabilizing);
  const mission = useApp((s) => s.progress.mission);
  const anomalyStates = useApp((s) => s.progress.anomalies);
  const coarse = useMemo(() => hasCoarsePointer(), []);
  const travel = useLabUi((s) => s.travel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const item = useMemo(() => currentInteractables().find((i) => i.id === activeId) ?? null, [activeId, mission]);
  if (!item || panel || stabilizing || travel) return null;
  const isAnomaly = item.action.type === "anomaly";
  const anomalyId = item.action.type === "anomaly" ? item.action.id : null;
  const viewed = anomalyId ? anomalyStates[anomalyId] === "viewed" : false;
  const pos: [number, number, number] = anomalyId
    ? [ANOMALY_PLACEMENTS[anomalyId].float[0], ANOMALY_PLACEMENTS[anomalyId].float[1] + 0.75, ANOMALY_PLACEMENTS[anomalyId].float[2]]
    : [item.position[0], item.position[1] + 2.35, item.position[2]];
  const verb = isAnomaly
    ? viewed
      ? "Consulter"
      : "Stabiliser"
    : item.action.type === "travel"
      ? item.action.to === "circuit"
        ? "Sortir vers le circuit"
        : "Rentrer au lab"
      : item.action.type === "vehicle"
        ? "Monter à bord"
        : "Interagir";
  const title = anomalyId ? anomalyById[anomalyId]?.source ?? item.label : item.label;
  return (
    <Html position={pos} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
      <div className="pad-prompt" aria-hidden="true">
        <span className="pad-prompt__key">{coarse ? "Interagir" : item.action.type === "vehicle" ? "E · F" : "E · Entrée"}</span>
        <span className="pad-prompt__verb">{verb}</span>
        <span className="pad-prompt__title">{title}</span>
      </div>
    </Html>
  );
}
