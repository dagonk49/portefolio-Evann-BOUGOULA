/**
 * Règles d'interaction des mondes 3D, indépendantes du rendu : quels points
 * d'intérêt existent, lequel est actif selon la position du joueur, dans
 * quelle zone il se trouve.
 */
import { anomalies } from "@/data/anomalies";
import type { AnomalyId, WorldId } from "@/data/types";
import type { MissionFlags } from "@/sim/mission";
import { anomalyInteractable, INTERACTABLES, ZONES, type Interactable } from "./layout";
import { CIRCUIT_INTERACTABLES, circuitZoneAt } from "./circuit/layout";

/** Une anomalie « révélée par une interaction » n'existe qu'après celle-ci. */
export function anomalyVisible(id: AnomalyId, mission: MissionFlags): boolean {
  const a = anomalies.find((x) => x.id === id);
  if (!a) return false;
  if (a.revealedBy === "mission:lab-online") return mission.diagnosticPassed;
  return true;
}

/** Anomalies d'un monde, dans l'ordre des données. */
export function anomaliesOf(world: WorldId) {
  return anomalies.filter((a) => a.world === world);
}

/**
 * Points d'intérêt d'un monde. `extra` accueille les interactables mobiles
 * (véhicules garés), dont la position change pendant la partie.
 */
export function availableInteractables(mission: MissionFlags, world: WorldId = "lab", extra: Interactable[] = []): Interactable[] {
  const list = world === "lab" ? [...INTERACTABLES] : [...CIRCUIT_INTERACTABLES];
  for (const a of anomaliesOf(world)) {
    if (anomalyVisible(a.id, mission)) list.push(anomalyInteractable(a.id, `Anomalie ${a.id}`, a.zone));
  }
  list.push(...extra);
  return list;
}

/**
 * Choisit l'interactable actif : le plus proche dans son rayon. Une légère
 * hystérésis évite qu'il change sans cesse entre deux points voisins.
 */
export function pickActive(
  x: number,
  z: number,
  list: Interactable[],
  current: string | null,
  hysteresis = 0.35,
): string | null {
  let best: Interactable | null = null;
  let bestD = Infinity;
  let currentD = Infinity;
  for (const it of list) {
    const d = Math.hypot(x - it.position[0], z - it.position[2]);
    if (it.id === current) currentD = d;
    if (d <= it.radius && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  if (current) {
    const cur = list.find((i) => i.id === current);
    if (cur && currentD <= cur.radius + hysteresis && (!best || best.id === current || currentD <= bestD + hysteresis)) {
      return current;
    }
  }
  return best?.id ?? null;
}

export function zoneNameAt(x: number, z: number, world: WorldId = "lab"): string {
  if (world === "circuit") return circuitZoneAt(x, z);
  let best = "Lab";
  let bestScore = Infinity;
  for (const zone of ZONES) {
    const d = Math.hypot(x - zone.center[0], z - zone.center[1]);
    const score = d / zone.radius;
    if (score < 1 && score < bestScore) {
      best = zone.name;
      bestScore = score;
    }
  }
  return best;
}

export function distanceXZ(a: readonly number[], b: readonly number[]): number {
  return Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[2] ?? 0) - (b[2] ?? 0));
}
