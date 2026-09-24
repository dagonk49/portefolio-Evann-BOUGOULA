/**
 * Géométrie du rack de la mission : position de chaque port en coordonnées
 * locales du rack (x vers la gauche du rack vu de face, y vers le haut,
 * z vers l'avant), puis conversion en coordonnées monde.
 */
import * as THREE from "three";
import type { EndpointId } from "@/sim/scenario";
import { PLATFORMS, RACK_LAB, RACK_UNITS, type Vec3 } from "../../layout";

export const RACK_WIDTH = 0.92;
export const RACK_DEPTH = 1.04;
export const RACK_HEIGHT = 2.2;
/** Face avant des équipements (z local). */
export const FRONT = RACK_DEPTH / 2 - 0.04;
export const BASE_Y = PLATFORMS.bay.top;

export const PORT_SIZE: Record<"rj45" | "sfp" | "console", [number, number]> = {
  rj45: [0.058, 0.046],
  sfp: [0.07, 0.03],
  console: [0.05, 0.04],
};

export const LOCAL_PORTS: Partial<Record<EndpointId, { x: number; y: number; kind: "rj45" | "sfp" | "console" }>> = {
  "pp-01": { x: -0.33, y: RACK_UNITS.patch, kind: "rj45" },
  "pp-02": { x: -0.23, y: RACK_UNITS.patch, kind: "rj45" },
  "pp-03": { x: -0.13, y: RACK_UNITS.patch, kind: "rj45" },
  "pp-04": { x: -0.03, y: RACK_UNITS.patch, kind: "rj45" },
  "sw-gi0/1": { x: -0.345, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/2": { x: -0.27, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/3": { x: -0.195, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/4": { x: -0.12, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/5": { x: -0.045, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/6": { x: 0.03, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/7": { x: 0.105, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/8": { x: 0.18, y: RACK_UNITS.switch - 0.012, kind: "rj45" },
  "sw-gi0/9": { x: 0.26, y: RACK_UNITS.switch - 0.012, kind: "sfp" },
  "sw-gi0/10": { x: 0.335, y: RACK_UNITS.switch - 0.012, kind: "sfp" },
  "sw-console": { x: 0.335, y: RACK_UNITS.switch + 0.028, kind: "console" },
  "r1-gi0/0": { x: 0.18, y: RACK_UNITS.router, kind: "rj45" },
  "srv-eth0": { x: 0.3, y: RACK_UNITS.server - 0.03, kind: "rj45" },
};

/** Le rack est tourné de +90° autour de Y : sa face avant regarde +X. */
export function rackToWorld(local: THREE.Vector3 | Vec3, out = new THREE.Vector3()): THREE.Vector3 {
  const [lx, ly, lz] = Array.isArray(local) ? local : [local.x, local.y, local.z];
  return out.set(RACK_LAB.x + lz, BASE_Y + ly, RACK_LAB.z - lx);
}

export function portWorldPosition(id: EndpointId, outward = 0): THREE.Vector3 | null {
  const p = LOCAL_PORTS[id];
  if (!p) return null;
  return rackToWorld([p.x, p.y, FRONT + 0.012 + outward]);
}
