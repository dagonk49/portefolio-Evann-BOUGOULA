"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { WorldId } from "@/data/types";
import { useLabUi } from "@/state/labUi";
import { CAMERA_YAW } from "../layout";
import { moveVector } from "../input";
import { player } from "../player/playerState";

export const BASE_DISTANCE = 26;

/** Cadrage par monde : le circuit est plus vaste, la caméra un peu plus basse et plus loin. */
const FRAMING: Record<WorldId, { pitch: number; distance: number }> = {
  lab: { pitch: THREE.MathUtils.degToRad(41), distance: BASE_DISTANCE },
  circuit: { pitch: THREE.MathUtils.degToRad(37), distance: 29 },
};

function offsetFor(pitch: number): THREE.Vector3 {
  return new THREE.Vector3(Math.sin(CAMERA_YAW) * Math.cos(pitch), Math.sin(pitch), Math.cos(CAMERA_YAW) * Math.cos(pitch));
}
const RIGHT = new THREE.Vector3(Math.cos(CAMERA_YAW), 0, -Math.sin(CAMERA_YAW));
const UP = new THREE.Vector3(-Math.sin(CAMERA_YAW), 0, -Math.cos(CAMERA_YAW));

/** Réglages de caméra modifiables par l'interface (recentrage, zoom). */
export const cameraControl = {
  zoom: 1,
  pan: new THREE.Vector3(),
  recenter() {
    this.zoom = 1;
    this.pan.set(0, 0, 0);
  },
};

/**
 * Caméra en plongée à 45° qui suit le joueur avec un amorti exponentiel.
 * À l'ouverture d'une fiche, elle cadre l'objet concerné (travelling),
 * décalé pour rester visible à côté du panneau.
 */
export function CameraRig({ reducedMotion, world = "lab" }: { reducedMotion: boolean; world?: WorldId }) {
  const { camera, gl, size } = useThree();
  const framing = FRAMING[world];
  const OFFSET = useMemo(() => offsetFor(framing.pitch), [framing.pitch]);
  const base = framing.distance;
  const target = useRef(new THREE.Vector3().copy(player.position));
  const distance = useRef(base);
  const tmp = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    // Placement initial immédiat (pas de cinématique d'arrivée).
    target.current.copy(player.position).add(new THREE.Vector3(0, 1, 0));
    distance.current = base;
    camera.position.copy(target.current).addScaledVector(OFFSET, base);
    camera.lookAt(target.current);
    cameraControl.recenter();
  }, [camera, OFFSET, base]);

  // Glisser pour décaler légèrement la vue ; molette pour zoomer.
  useEffect(() => {
    const el = gl.domElement;
    let drag: { x: number; y: number; id: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || useLabUi.getState().panel) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      const k = (0.03 * distance.current) / base;
      cameraControl.pan.addScaledVector(RIGHT, -dx * k).addScaledVector(UP, dy * k);
      if (cameraControl.pan.length() > 8) cameraControl.pan.setLength(8);
    };
    const up = () => {
      drag = null;
    };
    const wheel = (e: WheelEvent) => {
      if (useLabUi.getState().panel) return;
      e.preventDefault();
      cameraControl.zoom = THREE.MathUtils.clamp(cameraControl.zoom * (e.deltaY > 0 ? 1.08 : 0.93), 0.62, 1.6);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const focus = useLabUi.getState().focus;
    const desired = tmp.current;
    let desiredDistance: number;
    if (focus) {
      desired.set(focus.target[0], focus.target[1], focus.target[2]);
      desiredDistance = base * focus.distance;
      // Le panneau occupe la droite (bureau) ou le bas (mobile) : on décale le cadrage.
      if (size.width >= 900) desired.addScaledVector(RIGHT, desiredDistance * 0.2);
      else desired.y -= desiredDistance * 0.16;
    } else {
      // Le décalage manuel se résorbe dès que le joueur se déplace.
      const mv = moveVector();
      if (Math.hypot(mv.x, mv.y) > 0.1) cameraControl.pan.multiplyScalar(Math.exp(-2.5 * dt));
      desired.copy(player.position);
      desired.y += 1;
      look.current.set(player.velocity.x, 0, player.velocity.z);
      desired.addScaledVector(look.current, world === "circuit" ? 0.3 : 0.22);
      desired.add(cameraControl.pan);
      // En véhicule, la caméra recule avec la vitesse.
      const driving = world === "circuit" && useLabUi.getState().driving !== null;
      desiredDistance = base * cameraControl.zoom * (1 + (driving ? 0.38 * player.speed01 : 0));
    }
    const lambda = reducedMotion ? 60 : focus ? 3.2 : 5;
    target.current.x = THREE.MathUtils.damp(target.current.x, desired.x, lambda, dt);
    target.current.y = THREE.MathUtils.damp(target.current.y, desired.y, lambda, dt);
    target.current.z = THREE.MathUtils.damp(target.current.z, desired.z, lambda, dt);
    distance.current = THREE.MathUtils.damp(distance.current, desiredDistance, lambda, dt);
    camera.position.copy(target.current).addScaledVector(OFFSET, distance.current);
    camera.lookAt(target.current);
  });

  return null;
}
