/**
 * Actions déclenchées par le joueur (touche E, bouton tactile, manette, index).
 * Elles modifient l'état ; le rendu ne fait que le refléter.
 */
import { anomalyById } from "@/data/anomalies";
import type { AnomalyId, ContentRef } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { playCue } from "@/lib/sound";
import { prefersReducedMotion } from "@/lib/device";
import { ANOMALY_PLACEMENTS } from "../layout";
import { availableInteractables } from "../interaction";

const STABILIZE_MS = 1100;
let stabilizeTimer: number | undefined;

export function interactWith(id: string): void {
  const app = useApp.getState();
  const ui = useLabUi.getState();
  if (ui.panel || ui.stabilizing) return;
  const item = availableInteractables(app.progress.mission).find((i) => i.id === id);
  if (!item) return;
  const sound = app.settings.sound;
  switch (item.action.type) {
    case "panel": {
      const panel = item.action.panel;
      if (panel.kind === "bay") app.markMission("bayInspected");
      if (panel.kind === "pc") app.markMission("pcOpened");
      playCue("open", sound);
      ui.openPanel(panel, item.focus);
      break;
    }
    case "content":
      playCue("open", sound);
      ui.openPanel({ kind: "content", ref: item.action.ref }, item.focus);
      break;
    case "anomaly":
      stabilize(item.action.id);
      break;
  }
}

/** Stabilise une anomalie : courte animation, puis la fiche s'ouvre et reste consultable. */
export function stabilize(id: AnomalyId): void {
  const app = useApp.getState();
  const ui = useLabUi.getState();
  const def = anomalyById[id];
  if (!def) return;
  const focus = { target: ANOMALY_PLACEMENTS[id].float, distance: 0.34 };
  const open = () => ui.openPanel({ kind: "content", ref: def.target, anomalyId: id }, focus);
  if (app.progress.anomalies[id] === "viewed") {
    playCue("open", app.settings.sound);
    open();
    return;
  }
  const duration = prefersReducedMotion() ? 0 : STABILIZE_MS;
  ui.setStabilizing(id);
  useLabUi.setState({ focus });
  playCue("stabilize", app.settings.sound);
  window.clearTimeout(stabilizeTimer);
  stabilizeTimer = window.setTimeout(() => {
    useApp.getState().viewAnomaly(id);
    useLabUi.getState().setStabilizing(null);
    useLabUi.getState().announce(`Anomalie ${id} stabilisée.`);
    open();
  }, duration);
}

/** Ouvre une fiche directement (index, liens entre fiches), sans déplacer le joueur. */
export function openContent(ref: ContentRef, anomalyId?: AnomalyId): void {
  useLabUi.getState().openPanel({ kind: "content", ref, anomalyId }, null);
}

export function cancelPendingActions(): void {
  window.clearTimeout(stabilizeTimer);
}
