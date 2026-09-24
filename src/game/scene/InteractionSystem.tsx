"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { anomalies } from "@/data/anomalies";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { ANOMALY_PLACEMENTS, SPOT_DISTANCE } from "../layout";
import { anomalyVisible, availableInteractables, distanceXZ, pickActive, zoneNameAt } from "../interaction";
import { pollGamepad } from "../input";
import { player } from "../player/playerState";
import { interactWith } from "../ui/actions";

/**
 * Détecte le point d'intérêt actif (10 fois par seconde), repère les
 * anomalies proches et interroge la manette. Aucune mise à jour React
 * à chaque image : l'état n'est écrit que lorsqu'il change.
 */
export function InteractionSystem() {
  const mission = useApp((s) => s.progress.mission);
  const list = useMemo(() => availableInteractables(mission), [mission]);
  const last = useRef(0);

  useFrame(({ clock }) => {
    const ui = useLabUi.getState();
    pollGamepad({
      canPlay: () => !useLabUi.getState().panel && !useLabUi.getState().stabilizing,
      onInteract: () => {
        const active = useLabUi.getState().active;
        if (active) interactWith(active);
      },
      onPause: () => {
        const s = useLabUi.getState();
        if (s.panel?.kind === "pause") s.closePanel();
        else if (!s.panel) s.openPanel({ kind: "pause" });
      },
      onBack: () => {
        if (useLabUi.getState().panel) useLabUi.getState().closePanel();
      },
    });

    if (clock.elapsedTime - last.current < 0.1) return;
    last.current = clock.elapsedTime;
    const { x, z } = player.position;
    if (!ui.panel && !ui.stabilizing) ui.setActive(pickActive(x, z, list, ui.active));
    ui.setZone(zoneNameAt(x, z));

    const app = useApp.getState();
    for (const a of anomalies) {
      if (app.progress.anomalies[a.id] || !anomalyVisible(a.id, app.progress.mission)) continue;
      if (distanceXZ([x, 0, z], ANOMALY_PLACEMENTS[a.id].float) < SPOT_DISTANCE) {
        app.spotAnomaly(a.id);
        ui.announce(`Anomalie repérée : ${a.id}`);
      }
    }
  });
  return null;
}
