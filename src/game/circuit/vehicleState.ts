/**
 * État partagé des véhicules du circuit, mis à jour à chaque image hors de
 * React (position, vitesse) et lu par l'interface, la caméra et le HUD.
 */
import * as THREE from "three";
import type { VehicleKind } from "@/state/labUi";
import type { Interactable } from "../layout";
import { initialLap, type LapState } from "./layout";

export interface VehicleSlot {
  /** Le véhicule existe-t-il dans la scène ? */
  present: boolean;
  position: THREE.Vector3;
  /** Cap : rotation Y de l'axe avant (+X) du châssis. */
  yaw: number;
  /** Vitesse avant signée (m/s). */
  speed: number;
  /** Demande de remise d'aplomb (touche R). */
  resetRequest: boolean;
  /** Descente demandée en roulant : le véhicule freine d'abord jusqu'à l'arrêt. */
  exitRequest: boolean;
}

const slot = (): VehicleSlot => ({ present: false, position: new THREE.Vector3(), yaw: 0, speed: 0, resetRequest: false, exitRequest: false });

export const vehicles: Record<VehicleKind, VehicleSlot> = { kart: slot(), stockcar: slot() };

/** Télémétrie du véhicule conduit (HUD, son moteur). */
export const drive = {
  kmh: 0,
  speed01: 0,
  throttle: 0,
  drifting: false,
};

/** Chronométrage de la session en cours (le meilleur tour est persisté dans le store). */
export const lapClock: { state: LapState; last: number | null } = { state: initialLap(), last: null };

export const VEHICLE_LABEL: Record<VehicleKind, string> = {
  kart: "Kart des stands",
  stockcar: "Stock-car n°49",
};

/** Distance maximale pour monter dans un véhicule. */
export const BOARD_DISTANCE = 3.2;
/** Vitesse au-delà de laquelle on ne descend pas du véhicule. */
export const EXIT_MAX_SPEED = 3;

/** Véhicules garés : ils deviennent des points d'intérêt (monter à bord). */
export function vehicleInteractables(driving: VehicleKind | null): Interactable[] {
  const list: Interactable[] = [];
  for (const kind of Object.keys(vehicles) as VehicleKind[]) {
    const v = vehicles[kind];
    if (!v.present || driving === kind) continue;
    list.push({
      id: `vehicle:${kind}`,
      label: VEHICLE_LABEL[kind],
      zone: "piste",
      position: [v.position.x, 0, v.position.z],
      radius: BOARD_DISTANCE,
      action: { type: "vehicle", kind },
      focus: { target: [v.position.x, v.position.y + 0.6, v.position.z], distance: 0.3 },
      pad: false,
    });
  }
  return list;
}

export function resetVehicleState(): void {
  for (const v of Object.values(vehicles)) {
    v.present = false;
    v.speed = 0;
    v.resetRequest = false;
    v.exitRequest = false;
  }
  drive.kmh = 0;
  drive.speed01 = 0;
  drive.throttle = 0;
  drive.drifting = false;
  lapClock.state = initialLap();
  lapClock.last = null;
}
