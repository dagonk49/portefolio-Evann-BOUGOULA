import * as THREE from "three";

/** État du joueur partagé entre systèmes, mis à jour à chaque image (hors React). */
export const player = {
  position: new THREE.Vector3(4, 1, 4),
  velocity: new THREE.Vector3(),
  grounded: true,
  /** Orientation visuelle de l'avatar (radians). */
  yaw: Math.PI / 4,
  /** Vitesse horizontale normalisée (0 = arrêt, 1 = course). */
  speed01: 0,
  teleport: null as THREE.Vector3 | null,
};
