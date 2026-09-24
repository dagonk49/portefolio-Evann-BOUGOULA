"use client";
/**
 * Véhicules du circuit : kart des stands et stock-car n°49.
 *
 * Physique : contrôleur de véhicule à rayons de Rapier (suspension, adhérence
 * par roue). Propulsion arrière ; le frein à main (Espace) réduit l'adhérence
 * du train arrière pour faire décrocher la voiture (drift) et laisse des
 * traces de pneus. Centre de gravité abaissé pour éviter les tonneaux.
 */
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DynamicRayCastVehicleController } from "@dimforge/rapier3d-compat";
import { useLabUi, type VehicleKind } from "@/state/labUi";
import { vehicleInput } from "../input";
import { player } from "../player/playerState";
import { cachedMaterial, geo, glow, mat } from "../materials";
import { canvasTexture } from "../textures";
import { B, Glow } from "../scene/primitives";
import { CIRCUIT_RESPAWN_Y, surfaceHeight } from "./layout";
import { drive, EXIT_MAX_SPEED, vehicles } from "./vehicleState";
import { exitVehicle } from "../ui/actions";
import { skidMarks } from "./SkidMarks";

interface Spec {
  /** Demi-dimensions du collider du châssis (x = longueur). */
  half: [number, number, number];
  mass: number;
  /** Centre de gravité, relatif au centre du châssis (abaissé). */
  com: [number, number, number];
  /** Roues : avant gauche, avant droite, arrière gauche, arrière droite (avant = +X). */
  wheelX: [number, number];
  wheelZ: number;
  wheelY: number;
  radius: number;
  rest: number;
  stiffness: number;
  compression: number;
  relaxation: number;
  travel: number;
  /** Force moteur par roue motrice (N). */
  engine: number;
  maxSpeed: number;
  maxReverse: number;
  /** Impulsion de freinage par roue et par pas. */
  brake: number;
  /** Frein de roulement, pédales relâchées. */
  roll: number;
  /** Braquage maximal à l'arrêt et à pleine vitesse (radians). */
  steer: [number, number];
  /** Adhérence avant / arrière et arrière en drift. */
  grip: [number, number, number];
  /** Appui aérodynamique (m/s² par (m/s)²). */
  downforce: number;
}

const SPECS: Record<VehicleKind, Spec> = {
  kart: {
    half: [0.85, 0.16, 0.52],
    mass: 90,
    com: [-0.05, -0.34, 0],
    wheelX: [0.62, -0.58],
    wheelZ: 0.56,
    wheelY: -0.06,
    radius: 0.2,
    rest: 0.24,
    stiffness: 46,
    compression: 3.2,
    relaxation: 4.2,
    travel: 0.18,
    engine: 330,
    maxSpeed: 19,
    maxReverse: 5,
    brake: 7,
    roll: 0.5,
    steer: [0.55, 0.2],
    grip: [2.0, 1.9, 0.95],
    downforce: 0.012,
  },
  stockcar: {
    half: [1.85, 0.3, 0.84],
    mass: 170,
    com: [-0.1, -0.62, 0],
    wheelX: [1.22, -1.18],
    wheelZ: 0.8,
    wheelY: -0.18,
    radius: 0.36,
    rest: 0.34,
    stiffness: 34,
    compression: 2.6,
    relaxation: 3.4,
    travel: 0.26,
    engine: 820,
    maxSpeed: 33,
    maxReverse: 7,
    brake: 15,
    roll: 1.1,
    steer: [0.5, 0.17],
    grip: [1.75, 1.65, 0.8],
    downforce: 0.016,
  },
};

const UP = new THREE.Vector3(0, 1, 0);
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const tmpSide = new THREE.Vector3();

function yawFromQuaternion(q: THREE.Quaternion): number {
  tmpV.set(1, 0, 0).applyQuaternion(q);
  return Math.atan2(-tmpV.z, tmpV.x);
}

export interface VehicleProps {
  kind: VehicleKind;
  spawn: [number, number, number];
  yaw: number;
  paused: boolean;
  onLap?: (x: number, z: number) => void;
}

/** Châssis + contrôleur de véhicule + rendu des roues. */
export function Vehicle({ kind, spawn, yaw, paused, onLap }: VehicleProps) {
  const spec = SPECS[kind];
  const body = useRef<RapierRigidBody>(null);
  const controller = useRef<DynamicRayCastVehicleController | null>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const steer = useRef(0);
  const tilted = useRef(0);
  const lastMark = useRef<(THREE.Vector3 | null)[]>([null, null]);
  const { world } = useRapier();
  const driving = useLabUi((s) => s.driving === kind);

  const wheelDefs = useMemo(
    () => [
      { x: spec.wheelX[0], z: -spec.wheelZ, front: true },
      { x: spec.wheelX[0], z: spec.wheelZ, front: true },
      { x: spec.wheelX[1], z: -spec.wheelZ, front: false },
      { x: spec.wheelX[1], z: spec.wheelZ, front: false },
    ],
    [spec],
  );

  // Création du contrôleur une fois le châssis prêt ; libéré au démontage.
  useEffect(() => {
    const rb = body.current;
    if (!rb) return;
    const c = world.createVehicleController(rb);
    wheelDefs.forEach((w, i) => {
      c.addWheel({ x: w.x, y: spec.wheelY, z: w.z }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, spec.rest, spec.radius);
      c.setWheelSuspensionStiffness(i, spec.stiffness);
      c.setWheelSuspensionCompression(i, spec.compression);
      c.setWheelSuspensionRelaxation(i, spec.relaxation);
      c.setWheelMaxSuspensionTravel(i, spec.travel);
      c.setWheelMaxSuspensionForce(i, 1e5);
      c.setWheelFrictionSlip(i, w.front ? spec.grip[0] : spec.grip[1]);
      c.setWheelSideFrictionStiffness(i, 1);
    });
    controller.current = c;
    const slot = vehicles[kind];
    slot.present = true;
    slot.position.set(spawn[0], spawn[1], spawn[2]);
    slot.yaw = yaw;
    return () => {
      controller.current = null;
      slot.present = false;
      try {
        world.removeVehicleController(c);
      } catch {
        /* monde déjà détruit (démontage du Canvas) */
      }
    };
    // Le véhicule n'est créé qu'une fois par montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  useBeforePhysicsStep((w) => {
    const c = controller.current;
    const rb = body.current;
    if (!c || !rb || paused) return;
    const dt = w.timestep;
    const ui = useLabUi.getState();
    const slot = vehicles[kind];
    const active = ui.driving === kind && !ui.panel && !ui.stabilizing && !ui.travel && !slot.exitRequest;
    const speed = c.currentVehicleSpeed();
    const cmd = active ? vehicleInput() : { throttle: 0, steer: 0, drift: false };
    let engine = 0;
    let brake = active ? spec.roll : spec.brake * (slot.exitRequest ? 1.2 : 0.6);
    if (cmd.throttle > 0) {
      if (speed < -0.6) brake = spec.brake;
      else {
        engine = speed < spec.maxSpeed ? spec.engine * cmd.throttle : 0;
        brake = 0;
      }
    } else if (cmd.throttle < 0) {
      if (speed > 0.8) brake = spec.brake * -cmd.throttle;
      else {
        engine = speed > -spec.maxReverse ? spec.engine * 0.55 * cmd.throttle : 0;
        brake = 0;
      }
    }
    const speed01 = Math.min(1, Math.abs(speed) / spec.maxSpeed);
    const maxSteer = THREE.MathUtils.lerp(spec.steer[0], spec.steer[1], speed01);
    const target = cmd.steer * maxSteer * (cmd.drift ? 1.12 : 1);
    steer.current += (target - steer.current) * (1 - Math.exp(-10 * dt));
    const drifting = active && cmd.drift && Math.abs(speed) > 4;
    for (let i = 0; i < 4; i++) {
      const front = i < 2;
      c.setWheelSteering(i, front ? steer.current : 0);
      c.setWheelEngineForce(i, front ? 0 : engine);
      c.setWheelBrake(i, brake + (!front && cmd.drift && active ? spec.brake * 0.25 : 0));
      c.setWheelFrictionSlip(i, front ? spec.grip[0] : drifting ? spec.grip[2] : spec.grip[1]);
    }
    c.updateVehicle(dt);

    // Appui aérodynamique le long de l'axe vertical du châssis : colle la voiture aux virages relevés.
    const r = rb.rotation();
    tmpQ.set(r.x, r.y, r.z, r.w);
    tmpUp.copy(UP).applyQuaternion(tmpQ);
    const push = spec.downforce * speed * speed * spec.mass * dt;
    if (push > 0) rb.applyImpulse({ x: -tmpUp.x * push, y: -tmpUp.y * push, z: -tmpUp.z * push }, true);

    drive.drifting = drifting;
    if (active) drive.throttle = cmd.throttle;
  });

  useFrame((_, delta) => {
    const c = controller.current;
    const rb = body.current;
    if (!c || !rb) return;
    const dt = Math.min(delta, 0.05);
    const p = rb.translation();
    const r = rb.rotation();
    tmpQ.set(r.x, r.y, r.z, r.w);
    const heading = yawFromQuaternion(tmpQ);
    const speed = c.currentVehicleSpeed();
    const slot = vehicles[kind];
    slot.position.set(p.x, p.y, p.z);
    slot.yaw = heading;
    slot.speed = speed;
    if (slot.exitRequest && driving && Math.abs(speed) <= EXIT_MAX_SPEED * 0.5) exitVehicle();

    // Remise d'aplomb : touche R, tonneau prolongé ou chute hors du monde.
    tmpUp.copy(UP).applyQuaternion(tmpQ);
    tilted.current = tmpUp.y < 0.35 ? tilted.current + dt : 0;
    if (slot.resetRequest || tilted.current > 2.2 || p.y < CIRCUIT_RESPAWN_Y) {
      slot.resetRequest = false;
      tilted.current = 0;
      const fell = p.y < CIRCUIT_RESPAWN_Y;
      const x = fell ? spawn[0] : p.x;
      const z = fell ? spawn[2] : p.z;
      const h = fell ? yaw : heading;
      rb.setTranslation({ x, y: surfaceHeight(x, z) + spec.half[1] + spec.radius + spec.rest + 0.5, z }, true);
      tmpQ.setFromAxisAngle(UP, h);
      rb.setRotation({ x: tmpQ.x, y: tmpQ.y, z: tmpQ.z, w: tmpQ.w }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Roues : suspension, braquage et rotation.
    for (let i = 0; i < 4; i++) {
      const g = wheels.current[i];
      const spin = spins.current[i];
      if (!g || !spin) continue;
      const len = c.wheelSuspensionLength(i) ?? spec.rest;
      g.position.y = spec.wheelY - len;
      g.rotation.y = c.wheelSteering(i) ?? 0;
      spin.rotation.z = -(c.wheelRotation(i) ?? 0);
    }

    // Traces de pneus quand le train arrière glisse.
    const v = rb.linvel();
    tmpSide.set(0, 0, 1).applyQuaternion(tmpQ);
    const lateral = Math.abs(v.x * tmpSide.x + v.y * tmpSide.y + v.z * tmpSide.z);
    const sliding = lateral > 3.2 || (drive.drifting && driving && Math.abs(speed) > 6);
    for (const [k, i] of [
      [0, 2],
      [1, 3],
    ] as const) {
      if (!sliding || !c.wheelIsInContact(i)) {
        lastMark.current[k] = null;
        continue;
      }
      const cp = c.wheelContactPoint(i);
      const n = c.wheelContactNormal(i);
      if (!cp || !n) continue;
      tmpV.set(cp.x, cp.y, cp.z);
      const last = lastMark.current[k];
      if (!last || last.distanceTo(tmpV) > 0.28) {
        skidMarks.add(tmpV, n, heading);
        lastMark.current[k] = (last ?? new THREE.Vector3()).copy(tmpV);
      }
    }

    if (driving) {
      // Le « joueur » suit le véhicule conduit : caméra, interactions, zones.
      player.position.set(p.x, Math.max(0, p.y - spec.half[1] - spec.radius), p.z);
      player.velocity.set(v.x, v.y, v.z);
      player.yaw = heading + Math.PI / 2;
      player.speed01 = Math.min(1, Math.abs(speed) / SPECS.stockcar.maxSpeed);
      player.grounded = c.wheelIsInContact(0) || c.wheelIsInContact(2);
      drive.kmh = Math.abs(speed) * 3.6;
      drive.speed01 = Math.min(1, Math.abs(speed) / spec.maxSpeed);
      onLap?.(p.x, p.z);
    }
  });

  const start = useMemo(() => new THREE.Quaternion().setFromAxisAngle(UP, yaw), [yaw]);
  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spawn}
      quaternion={[start.x, start.y, start.z, start.w]}
      canSleep={false}
      ccd
      linearDamping={0.06}
      angularDamping={kind === "kart" ? 1.4 : 1.1}
      userData={{ kind: "vehicle", vehicle: kind }}
    >
      <CuboidCollider
        args={spec.half}
        friction={0.4}
        restitution={0.1}
        massProperties={{
          mass: spec.mass,
          centerOfMass: { x: spec.com[0], y: spec.com[1], z: spec.com[2] },
          principalAngularInertia: {
            x: spec.mass * (spec.half[1] ** 2 + spec.half[2] ** 2) * 1.2,
            y: spec.mass * (spec.half[0] ** 2 + spec.half[2] ** 2) * 0.45,
            z: spec.mass * (spec.half[0] ** 2 + spec.half[1] ** 2) * 0.6,
          },
          angularInertiaLocalFrame: { x: 0, y: 0, z: 0, w: 1 },
        }}
      />
      {kind === "kart" ? <KartModel driving={driving} /> : <StockCarModel driving={driving} />}
      {wheelDefs.map((w, i) => (
        <group key={i} ref={(g) => void (wheels.current[i] = g)} position={[w.x, spec.wheelY - spec.rest, w.z]}>
          <group ref={(g) => void (spins.current[i] = g)}>
            <Wheel radius={spec.radius} width={kind === "kart" ? 0.2 : 0.3} />
          </group>
        </group>
      ))}
    </RigidBody>
  );
}

function Wheel({ radius, width }: { radius: number; width: number }) {
  const tire = geo(`wheel:${radius}:${width}`, () => new THREE.CylinderGeometry(radius, radius, width, 14).rotateX(Math.PI / 2));
  const rim = geo(`rim:${radius}:${width}`, () => new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.01, 8).rotateX(Math.PI / 2));
  return (
    <>
      <mesh geometry={tire} material={mat("#1b1d20", { roughness: 0.9 })} castShadow />
      <mesh geometry={rim} material={mat("#c9ced3", { roughness: 0.35, metalness: 0.6 })} />
      {/* Repère sur la jante : la rotation des roues se voit. */}
      <mesh geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} material={mat("#6a7077")} scale={[radius * 0.9, radius * 0.18, width + 0.02]} />
    </>
  );
}

/** Pilote assis (casque, épaules), visible seulement à bord. */
function Driver({ y, scale = 1, visible }: { y: number; scale?: number; visible: boolean }) {
  const helmet = geo("driver:helmet", () => new THREE.SphereGeometry(0.2, 12, 10));
  if (!visible) return null;
  return (
    <group position={[-0.05, y, 0]} scale={scale}>
      <B p={[0, 0, 0]} s={[0.34, 0.34, 0.46]} m="#2d6f8a" />
      <mesh geometry={helmet} material={mat("#f2f0ea", { roughness: 0.4 })} position={[0.02, 0.36, 0]} castShadow />
      <mesh geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} material={glow("#3cc7da", 0.9)} position={[0.17, 0.37, 0]} scale={[0.06, 0.08, 0.28]} />
    </group>
  );
}

function KartModel({ driving }: { driving: boolean }) {
  return (
    <group>
      <B p={[0, -0.02, 0]} s={[1.7, 0.08, 0.84]} m="#1e2226" />
      <B p={[0.86, 0.04, 0]} s={[0.22, 0.14, 1.02]} m="#f0a13a" />
      <B p={[-0.84, 0.06, 0]} s={[0.16, 0.2, 1.14]} m="#f0a13a" />
      <B p={[0.42, 0.12, 0]} s={[0.46, 0.14, 0.62]} m="#f0a13a" />
      <B p={[-0.3, 0.16, 0]} s={[0.42, 0.26, 0.5]} m="#2b2f35" />
      <B p={[-0.52, 0.34, 0]} s={[0.08, 0.34, 0.46]} m="#2b2f35" />
      <B p={[0.12, 0.3, 0]} s={[0.05, 0.3, 0.05]} r={[0, 0, -0.5]} m="#7d858d" />
      <B p={[0.2, 0.44, 0]} s={[0.04, 0.04, 0.3]} m="#1c1f23" />
      <Glow p={[0.975, 0.06, 0]} s={[0.01, 0.05, 0.6]} color="#fff2c9" />
      <Driver y={0.36} scale={0.8} visible={driving} />
    </group>
  );
}

/** Plaque de sponsor sur la carrosserie (texte seul, aucun logo). */
function Sticker({ text, p, r, w, h, bg, fg }: { text: string; p: [number, number, number]; r: [number, number, number]; w: number; h: number; bg: string; fg: string }) {
  const tex = canvasTexture(`sticker:${text}:${bg}`, 256, Math.round(256 * (h / w)), (ctx, cw, ch) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = fg;
    ctx.font = `700 ${Math.round(ch * 0.62)}px 'IBM Plex Sans', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cw / 2, ch / 2 + 2);
  });
  const material = cachedMaterial(`sticker:${text}:${bg}`, () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  return (
    <mesh position={p} rotation={r} material={material}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

function StockCarModel({ driving }: { driving: boolean }) {
  const red = mat("#d3272e", { roughness: 0.38, metalness: 0.2 });
  const dark = mat("#1b1e22", { roughness: 0.5 });
  const glass = cachedMaterial("stockcar:glass", () => new THREE.MeshStandardMaterial({ color: "#1d2a33", roughness: 0.15, metalness: 0.4 }));
  const number = canvasTexture("stockcar:49", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#f4f1ea";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16181b";
    ctx.font = "700 150px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("49", w / 2, h / 2 + 8);
  });
  const numberMat = cachedMaterial("stockcar:49", () => new THREE.MeshStandardMaterial({ map: number, roughness: 0.5, transparent: true }));
  const half = Math.PI / 2;
  return (
    <group>
      {/* Carrosserie basse et large, capot long */}
      <B p={[0, 0, 0]} s={[3.7, 0.5, 1.72]} m={red} />
      <B p={[0.3, 0.3, 0]} s={[3.0, 0.14, 1.66]} m={red} />
      <B p={[1.55, 0.02, 0]} s={[0.72, 0.4, 1.74]} m={red} />
      <B p={[1.88, -0.12, 0]} s={[0.1, 0.24, 1.6]} m={dark} />
      <B p={[-1.86, -0.08, 0]} s={[0.08, 0.3, 1.62]} m={dark} />
      {/* Habitacle et vitres */}
      <B p={[-0.25, 0.62, 0]} s={[1.5, 0.5, 1.46]} m={red} />
      <B p={[0.52, 0.6, 0]} s={[0.08, 0.42, 1.36]} r={[0, 0, -0.6]} m={glass} />
      <B p={[-1.02, 0.6, 0]} s={[0.08, 0.4, 1.36]} r={[0, 0, 0.55]} m={glass} />
      <B p={[-0.25, 0.64, 0.735]} s={[1.2, 0.3, 0.02]} m={glass} />
      <B p={[-0.25, 0.64, -0.735]} s={[1.2, 0.3, 0.02]} m={glass} />
      {/* Aileron arrière */}
      <B p={[-1.72, 0.52, 0]} s={[0.3, 0.05, 1.7]} r={[0, 0, 0.12]} m={dark} />
      <B p={[-1.7, 0.38, 0.62]} s={[0.2, 0.26, 0.05]} m={dark} />
      <B p={[-1.7, 0.38, -0.62]} s={[0.2, 0.26, 0.05]} m={dark} />
      {/* Bandes et phares */}
      <B p={[0.3, 0.375, 0]} s={[3.0, 0.012, 0.3]} m="#f4f1ea" />
      <Glow p={[1.915, 0.02, 0.56]} s={[0.01, 0.1, 0.3]} color="#fff2c9" />
      <Glow p={[1.915, 0.02, -0.56]} s={[0.01, 0.1, 0.3]} color="#fff2c9" />
      <Glow p={[-1.905, 0.04, 0.6]} s={[0.01, 0.08, 0.26]} color="#ff3b3b" />
      <Glow p={[-1.905, 0.04, -0.6]} s={[0.01, 0.08, 0.26]} color="#ff3b3b" />
      {/* Numéro sur le toit et les portières */}
      <mesh position={[-0.25, 0.875, 0]} rotation={[-half, 0, 0]} material={numberMat}>
        <planeGeometry args={[0.9, 0.9]} />
      </mesh>
      <mesh position={[-0.35, 0, 0.865]} material={numberMat}>
        <planeGeometry args={[0.46, 0.46]} />
      </mesh>
      <mesh position={[-0.35, 0, -0.865]} rotation={[0, Math.PI, 0]} material={numberMat}>
        <planeGeometry args={[0.46, 0.46]} />
      </mesh>
      {/* Stickers sponsors (texte seul) */}
      <Sticker text="PROXMOX" p={[0.72, 0.06, 0.865]} r={[0, 0, 0]} w={0.74} h={0.18} bg="#16181b" fg="#f2a948" />
      <Sticker text="DOCKER" p={[0.72, -0.14, 0.865]} r={[0, 0, 0]} w={0.6} h={0.15} bg="#f4f1ea" fg="#1d63c4" />
      <Sticker text="CISCO" p={[-1.2, 0.06, 0.865]} r={[0, 0, 0]} w={0.5} h={0.16} bg="#16181b" fg="#5fd0e0" />
      <Sticker text="PROXMOX" p={[0.72, 0.06, -0.865]} r={[0, Math.PI, 0]} w={0.74} h={0.18} bg="#16181b" fg="#f2a948" />
      <Sticker text="DOCKER" p={[0.72, -0.14, -0.865]} r={[0, Math.PI, 0]} w={0.6} h={0.15} bg="#f4f1ea" fg="#1d63c4" />
      <Sticker text="CISCO" p={[-1.2, 0.06, -0.865]} r={[0, Math.PI, 0]} w={0.5} h={0.16} bg="#16181b" fg="#5fd0e0" />
      <Sticker text="NETFORGE" p={[1.3, 0.386, 0]} r={[-half, 0, -half]} w={0.9} h={0.2} bg="#16181b" fg="#f2a948" />
      <Driver y={0.42} visible={driving} />
    </group>
  );
}
