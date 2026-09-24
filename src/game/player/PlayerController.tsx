"use client";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useLabUi } from "@/state/labUi";
import { useApp } from "@/state/app";
import { CAMERA_YAW, RESPAWN_Y, SPAWN, type Vec3 } from "../layout";
import { input, moveVector } from "../input";
import { Avatar } from "./Avatar";
import { player } from "./playerState";

/** Capsule : demi-hauteur du cylindre + rayon = 0,8 m (avatar de 1,75 m). */
const HALF = 0.45;
const RADIUS = 0.35;
const FOOT_OFFSET = HALF + RADIUS;

export const WALK_SPEED = 4.3;
export const RUN_SPEED = 7.6;
const JUMP_SPEED = 7.2;
const GROUND_ACCEL = 14;
const AIR_ACCEL = 3.5;
const COYOTE_MS = 120;
const JUMP_BUFFER_MS = 140;

// Directions « écran » projetées au sol (caméra en lacet de 45°).
const RIGHT = new THREE.Vector2(Math.cos(CAMERA_YAW), -Math.sin(CAMERA_YAW));
const UP = new THREE.Vector2(-Math.sin(CAMERA_YAW), -Math.cos(CAMERA_YAW));

export interface PlayerControllerProps {
  reducedMotion: boolean;
  paused: boolean;
  /** Position de départ (par défaut : dernière position enregistrée dans le lab). */
  start?: Vec3;
  /** Réapparition après une chute. */
  spawn?: Vec3;
  respawnY?: number;
  /** Enregistrer la position au démontage (lab uniquement). */
  persist?: boolean;
}

export function PlayerController({ reducedMotion, paused, start: startAt, spawn = SPAWN, respawnY = RESPAWN_Y, persist = true }: PlayerControllerProps) {
  const body = useRef<RapierRigidBody>(null);
  const { world, rapier } = useRapier();
  const lastGrounded = useRef(0);
  const ccdOff = useRef(0);
  const ray = useRef<InstanceType<typeof rapier.Ray> | null>(null);
  const start = useRef<Vec3>(startAt ?? useApp.getState().progress.player ?? SPAWN);

  // Position immédiate pour la caméra et les interactions, avant la première image.
  useState(() => player.position.set(start.current[0], start.current[1], start.current[2]));

  // Sauvegarde de la position en quittant le lab : le retour reprend au même endroit.
  useEffect(() => {
    if (!persist) return;
    return () => {
      const p = player.position;
      if (Number.isFinite(p.x)) useApp.getState().savePlayer([p.x, Math.max(p.y, 0.9), p.z]);
    };
  }, [persist]);

  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb || paused) return;
    const dt = Math.min(delta, 1 / 20);
    const now = performance.now();
    const ui = useLabUi.getState();
    const blocked = ui.panel !== null || ui.stabilizing !== null;

    // Téléportation (réapparition, tests) : le CCD bloquerait ce saut de position.
    if (ccdOff.current > 0 && --ccdOff.current === 0) rb.enableCcd(true);
    if (player.teleport) {
      rb.enableCcd(false);
      rb.setTranslation({ x: player.teleport.x, y: player.teleport.y, z: player.teleport.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      player.teleport = null;
      ccdOff.current = 3;
      return;
    }

    const pos = rb.translation();
    const vel = rb.linvel();

    // Sol : rayon vertical depuis le centre de la capsule.
    ray.current ??= new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    ray.current.origin = { x: pos.x, y: pos.y, z: pos.z };
    const hit = world.castRay(ray.current, FOOT_OFFSET + 0.14, true, undefined, undefined, undefined, rb);
    const grounded = hit !== null && vel.y < 2.5;
    if (grounded) lastGrounded.current = now;

    const mv = blocked ? { x: 0, y: 0, run: false } : moveVector();
    const dirX = mv.x * RIGHT.x + mv.y * UP.x;
    const dirZ = mv.x * RIGHT.y + mv.y * UP.y;
    const magnitude = Math.min(1, Math.hypot(dirX, dirZ));
    const speed = mv.run ? RUN_SPEED : WALK_SPEED;
    const tvx = magnitude > 0.001 ? (dirX / Math.hypot(dirX, dirZ)) * speed * magnitude : 0;
    const tvz = magnitude > 0.001 ? (dirZ / Math.hypot(dirX, dirZ)) * speed * magnitude : 0;

    // Accélération exponentielle indépendante du nombre d'images par seconde.
    const k = 1 - Math.exp(-(grounded ? GROUND_ACCEL : AIR_ACCEL) * dt);
    const nvx = vel.x + (tvx - vel.x) * k;
    const nvz = vel.z + (tvz - vel.z) * k;
    let nvy = vel.y;

    const wantsJump = now - input.jumpAt < JUMP_BUFFER_MS;
    if (!blocked && wantsJump && now - lastGrounded.current < COYOTE_MS) {
      nvy = JUMP_SPEED;
      input.jumpAt = -Infinity;
      lastGrounded.current = -Infinity;
    }
    rb.setLinvel({ x: nvx, y: nvy, z: nvz }, true);

    if (pos.y < respawnY) player.teleport = new THREE.Vector3(spawn[0], spawn[1] + 1, spawn[2]);

    player.position.set(pos.x, pos.y - FOOT_OFFSET, pos.z);
    player.velocity.set(nvx, nvy, nvz);
    player.grounded = grounded;
    const horizontal = Math.hypot(nvx, nvz);
    player.speed01 = Math.min(1, horizontal / RUN_SPEED);
    if (horizontal > 0.4 && magnitude > 0.05) player.yaw = Math.atan2(nvx, nvz);
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[start.current[0], start.current[1] + 0.2, start.current[2]]}
      enabledRotations={[false, false, false]}
      linearDamping={0}
      angularDamping={4}
      ccd
      canSleep={false}
      userData={{ kind: "player" }}
    >
      <CapsuleCollider args={[HALF, RADIUS]} density={2.4} friction={0} restitution={0} />
      <group position={[0, -FOOT_OFFSET, 0]}>
        <Avatar reducedMotion={reducedMotion} />
      </group>
    </RigidBody>
  );
}
