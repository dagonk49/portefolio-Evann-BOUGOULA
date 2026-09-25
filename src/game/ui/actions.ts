/**
 * Actions déclenchées par le joueur (touche E, bouton tactile, manette, index).
 * Elles modifient l'état ; le rendu ne fait que le refléter.
 */
import { anomalyById } from "@/data/anomalies";
import type { AnomalyId, ContentRef } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { audioEngine } from "@/audio/AudioEngine";
import { prefersReducedMotion } from "@/lib/device";
import type { VehicleKind } from "@/state/labUi";
import { ANOMALY_PLACEMENTS } from "../layout";
import { availableInteractables, distanceXZ } from "../interaction";
import { player } from "../player/playerState";
import { BOARD_DISTANCE, EXIT_MAX_SPEED, VEHICLE_LABEL, vehicleInteractables, vehicles } from "../circuit/vehicleState";

const STABILIZE_MS = 1100;
let stabilizeTimer: number | undefined;
let stabilizeStartedAt = 0;

/** Garde-fou : une stabilisation dont le minuteur aurait été perdu ne bloque jamais les interactions. */
function releaseStaleStabilizing(): void {
  const ui = useLabUi.getState();
  if (ui.stabilizing && performance.now() - stabilizeStartedAt > STABILIZE_MS + 1500) ui.setStabilizing(null);
}

/** Points d'intérêt du monde courant, véhicules garés compris. */
export function currentInteractables() {
  const app = useApp.getState();
  const ui = useLabUi.getState();
  const extra = app.world === "circuit" ? vehicleInteractables(ui.driving) : [];
  return availableInteractables(app.progress.mission, app.world, extra);
}

export function interactWith(id: string): void {
  releaseStaleStabilizing();
  const app = useApp.getState();
  const ui = useLabUi.getState();
  if (ui.panel || ui.stabilizing || ui.travel || ui.travelRequest) return;
  const item = currentInteractables().find((i) => i.id === id);
  if (!item) return;
  // Première interaction réussie dans le lab : le tutoriel d'accueil a rempli son rôle.
  if (app.world === "lab" && app.settings.tutorial === "pending") app.updateSettings({ tutorial: "done" });
  switch (item.action.type) {
    case "travel":
      // Geste du visiteur : bon moment pour déverrouiller l'audio du circuit.
      audioEngine.unlock(app.isNascarUnlocked);
      audioEngine.cue("open");
      useLabUi.setState({ focus: item.focus });
      ui.requestTravel(item.action.to);
      break;
    case "vehicle":
      enterVehicle(item.action.kind);
      break;
    case "panel": {
      const panel = item.action.panel;
      if (panel.kind === "bay") app.markMission("bayInspected");
      if (panel.kind === "pc") app.markMission("pcOpened");
      audioEngine.cue("open");
      ui.openPanel(panel, item.focus);
      break;
    }
    case "content":
      audioEngine.cue("open");
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
    audioEngine.cue("open");
    open();
    return;
  }
  const duration = prefersReducedMotion() ? 0 : STABILIZE_MS;
  ui.setStabilizing(id);
  stabilizeStartedAt = performance.now();
  useLabUi.setState({ focus });
  audioEngine.cue("stabilize");
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

/* ------------------------------------------------------------------ */
/* Véhicules du circuit                                                  */
/* ------------------------------------------------------------------ */

export function enterVehicle(kind: VehicleKind): void {
  const ui = useLabUi.getState();
  if (!vehicles[kind].present || ui.driving === kind) return;
  audioEngine.unlock();
  audioEngine.cue("open");
  ui.setDriving(kind);
  ui.setActive(null);
  ui.announce(`${VEHICLE_LABEL[kind]} : Z/W ou flèche haut pour accélérer, Espace pour drifter, F pour descendre.`);
}

/**
 * Descendre du véhicule. En roulant, le véhicule freine d'abord jusqu'à
 * l'arrêt, puis la descente se fait d'elle-même.
 */
export function exitVehicle(): boolean {
  const ui = useLabUi.getState();
  const kind = ui.driving;
  if (!kind) return false;
  const v = vehicles[kind];
  if (Math.abs(v.speed) > EXIT_MAX_SPEED) {
    if (!v.exitRequest) ui.announce("Freinage : descente du véhicule à l'arrêt.");
    v.exitRequest = true;
    return false;
  }
  v.exitRequest = false;
  // Descente côté gauche (vers l'intérieur du circuit en sens de course).
  const left = { x: -Math.sin(v.yaw), z: -Math.cos(v.yaw) };
  const side = kind === "kart" ? 1.6 : 2.1;
  ui.setDriving(null, [v.position.x + left.x * side, Math.max(0.4, v.position.y) + 0.6, v.position.z + left.z * side]);
  audioEngine.setEngine(false, 0, 0);
  return true;
}

/** Touche F : descendre, ou monter dans le véhicule le plus proche. */
export function toggleVehicle(): void {
  const app = useApp.getState();
  const ui = useLabUi.getState();
  if (app.world !== "circuit" || ui.panel || ui.travel) return;
  if (ui.driving) {
    exitVehicle();
    return;
  }
  let best: VehicleKind | null = null;
  let bestD = BOARD_DISTANCE;
  for (const kind of Object.keys(vehicles) as VehicleKind[]) {
    const v = vehicles[kind];
    if (!v.present) continue;
    const d = distanceXZ([player.position.x, 0, player.position.z], [v.position.x, 0, v.position.z]);
    if (d < bestD) {
      best = kind;
      bestD = d;
    }
  }
  if (best) enterVehicle(best);
}

/** Touche R : remet le véhicule conduit sur ses roues. */
export function resetVehicle(): void {
  const kind = useLabUi.getState().driving;
  if (kind) vehicles[kind].resetRequest = true;
}

/** Changement de monde depuis un menu : la caméra rejoint le sas, puis la transition démarre. */
export function travelTo(to: "lab" | "circuit"): void {
  const ui = useLabUi.getState();
  if (useApp.getState().world === to || ui.travel || ui.travelRequest) return;
  const sas = currentInteractables().find((i) => i.action.type === "travel" && i.action.to === to);
  audioEngine.unlock(useApp.getState().isNascarUnlocked);
  ui.closePanel();
  if (sas) useLabUi.setState({ focus: sas.focus });
  ui.requestTravel(to);
}
