"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { WorldId } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { ANOMALY_PLACEMENTS, SPOT_DISTANCE } from "../layout";
import { anomaliesOf, anomalyVisible, distanceXZ, pickActive, zoneNameAt } from "../interaction";
import { pollGamepad } from "../input";
import { player } from "../player/playerState";
import { currentInteractables, interactWith, toggleVehicle } from "../ui/actions";

/**
 * Détecte le point d'intérêt actif (10 fois par seconde), repère les
 * anomalies proches et interroge la manette. Aucune mise à jour React
 * à chaque image : l'état n'est écrit que lorsqu'il change.
 */
export function InteractionSystem({ world = "lab" }: { world?: WorldId }) {
  const last = useRef(0);
  const seenClose = useRef(0);

  useFrame(({ clock }) => {
    const ui = useLabUi.getState();
    pollGamepad({
      canPlay: () => {
        const s = useLabUi.getState();
        return !s.panel && !s.stabilizing && !s.travel;
      },
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
      onVehicle: world === "circuit" ? toggleVehicle : undefined,
    });

    // Une fenêtre vient de se fermer : recalcul immédiat, sans hystérésis sur l'ancien point actif.
    const justClosed = ui.closedAt !== seenClose.current;
    if (!justClosed && clock.elapsedTime - last.current < 0.1) return;
    seenClose.current = ui.closedAt;
    last.current = clock.elapsedTime;
    const { x, z } = player.position;
    // Proximité calculée à la distance réelle joueur ↔ borne (pas d'événements d'entrée/sortie de collider,
    // qui peuvent se perdre quand la physique est en pause) : l'état ne peut pas rester figé.
    if (!ui.panel && !ui.stabilizing && !ui.travel) ui.setActive(pickActive(x, z, currentInteractables(), justClosed ? null : ui.active));
    ui.setZone(zoneNameAt(x, z, world));

    const app = useApp.getState();
    for (const a of anomaliesOf(world)) {
      if (app.progress.anomalies[a.id] || !anomalyVisible(a.id, app.progress.mission)) continue;
      if (distanceXZ([x, 0, z], ANOMALY_PLACEMENTS[a.id].float) < SPOT_DISTANCE) {
        app.spotAnomaly(a.id);
        ui.announce(`Anomalie repérée : ${a.id}`);
      }
    }
  });
  return null;
}
