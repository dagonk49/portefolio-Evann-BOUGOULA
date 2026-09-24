"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { AVATAR } from "../avatar.config";
import { geo, mat } from "../materials";
import { B } from "../scene/primitives";
import { player } from "./playerState";

const damp = THREE.MathUtils.damp;

/**
 * Personnage low-poly construit à partir de primitives. Animation
 * procédurale (marche, course, saut, respiration) calculée à chaque image
 * à partir de la vitesse réelle du corps physique.
 */
export function Avatar({ reducedMotion }: { reducedMotion: boolean }) {
  const c = AVATAR.colors;
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const hipL = useRef<THREE.Group>(null);
  const hipR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const shL = useRef<THREE.Group>(null);
  const shR = useRef<THREE.Group>(null);
  const elL = useRef<THREE.Group>(null);
  const elR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const phase = useRef(0);

  const m = useMemo(
    () => ({
      hoodie: mat(c.hoodie),
      hoodieShade: mat(c.hoodieShade),
      pants: mat(c.pants),
      shoes: mat(c.shoes),
      soles: mat(c.soles),
      skin: mat(c.skin, { roughness: 0.7 }),
      hair: mat(c.hair, { roughness: 0.9 }),
      bag: mat(c.bag),
      bagFlap: mat(c.bagFlap),
      strap: mat(c.strap),
      badge: mat(c.badge),
      string: mat(c.drawstring),
      cable: mat(c.cable, { roughness: 0.5 }),
      eye: mat("#1b1d20", { roughness: 0.4 }),
    }),
    [c],
  );
  const headGeo = geo("avatar:head", () => new THREE.IcosahedronGeometry(0.155, 1));
  const hairGeo = geo("avatar:hair", () => new THREE.SphereGeometry(0.168, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52));
  const capGeo = geo("avatar:cap", () => new THREE.CylinderGeometry(0.17, 0.17, 0.09, 10));
  const coilGeo = geo("avatar:coil", () => new THREE.TorusGeometry(0.055, 0.014, 5, 12));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;
    const s = player.speed01;
    const airborne = !player.grounded;
    const g = root.current;
    if (!g) return;

    // Orientation vers la direction de marche (plus court chemin angulaire).
    let diff = player.yaw - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * (1 - Math.exp(-12 * dt));

    const running = s > 0.62;
    phase.current += dt * (4.2 + s * 6.5) * (s > 0.04 ? 1 : 0);
    const p = phase.current;
    const amp = reducedMotion ? 0.5 : 1;
    const legAmp = (running ? 0.85 : 0.55) * Math.min(1, s * 1.8) * amp;
    const k = 1 - Math.exp(-14 * dt);

    const set = (ref: React.RefObject<THREE.Group | null>, x: number, z = 0) => {
      const o = ref.current;
      if (!o) return;
      o.rotation.x += (x - o.rotation.x) * k;
      o.rotation.z += (z - o.rotation.z) * k;
    };

    if (airborne) {
      const rising = player.velocity.y > 0;
      set(hipL, -0.7);
      set(hipR, 0.25);
      set(kneeL, 0.9);
      set(kneeR, 0.5);
      set(shL, rising ? -2.3 : -1.2, 0.25);
      set(shR, rising ? -2.3 : -1.2, -0.25);
      set(elL, -0.3);
      set(elR, -0.3);
    } else {
      const sl = Math.sin(p);
      set(hipL, sl * legAmp);
      set(hipR, -sl * legAmp);
      set(kneeL, Math.max(0, -Math.sin(p - 0.6)) * legAmp * 1.25);
      set(kneeR, Math.max(0, Math.sin(p - 0.6)) * legAmp * 1.25);
      const armAmp = (running ? 0.9 : 0.5) * Math.min(1, s * 1.8) * amp;
      set(shL, -sl * armAmp, 0.06);
      set(shR, sl * armAmp, -0.06);
      set(elL, running ? -1.25 : -0.25 - s * 0.3);
      set(elR, running ? -1.25 : -0.25 - s * 0.3);
    }

    const b = body.current;
    if (b) {
      const bob = airborne ? 0 : Math.abs(Math.sin(p)) * 0.045 * Math.min(1, s * 2) * amp;
      const breathe = reducedMotion ? 0 : Math.sin(t * 1.8) * 0.006 * (1 - s);
      b.position.y = damp(b.position.y, bob, 18, dt);
      b.rotation.x = damp(b.rotation.x, (running ? 0.2 : 0.06) * s, 8, dt);
      b.scale.y = 1 + breathe;
    }
    const h = head.current;
    if (h && !reducedMotion) h.rotation.y = damp(h.rotation.y, Math.sin(t * 0.35) * 0.18 * (1 - s), 3, dt);
  });

  const skin = m.skin;
  return (
    <group ref={root} rotation={[0, player.yaw, 0]}>
      <group ref={body}>
        {/* Jambes */}
        {([
          [hipL, kneeL, 0.1],
          [hipR, kneeR, -0.1],
        ] as const).map(([hip, knee, x], i) => (
          <group key={i} ref={hip} position={[x, 0.86, 0]}>
            <B p={[0, -0.21, 0]} s={[0.15, 0.44, 0.17]} m={m.pants} />
            <group ref={knee} position={[0, -0.42, 0]}>
              <B p={[0, -0.18, 0]} s={[0.135, 0.38, 0.15]} m={m.pants} />
              <B p={[0, -0.39, 0.035]} s={[0.15, 0.075, 0.27]} m={m.shoes} />
              <B p={[0, -0.43, 0.035]} s={[0.155, 0.025, 0.28]} m={m.soles} />
            </group>
          </group>
        ))}
        {/* Bassin */}
        <B p={[0, 0.88, 0]} s={[0.36, 0.14, 0.21]} m={m.pants} />
        {/* Hoodie */}
        <B p={[0, 1.17, 0]} s={[0.42, 0.5, 0.25]} m={m.hoodie} />
        <B p={[0, 0.94, 0]} s={[0.44, 0.07, 0.27]} m={m.hoodieShade} />
        <B p={[0, 1.03, 0.126]} s={[0.26, 0.13, 0.02]} m={m.hoodieShade} />
        <B p={[0, 1.4, -0.09]} s={[0.32, 0.12, 0.12]} m={m.hoodieShade} />
        <B p={[0.05, 1.3, 0.128]} s={[0.014, 0.12, 0.012]} m={m.string} />
        <B p={[-0.05, 1.3, 0.128]} s={[0.014, 0.12, 0.012]} m={m.string} />
        <B p={[0.12, 1.2, 0.128]} s={[0.07, 0.09, 0.01]} m={m.badge} />
        {/* Bras */}
        {([
          [shL, elL, 0.27],
          [shR, elR, -0.27],
        ] as const).map(([sh, el, x], i) => (
          <group key={i} ref={sh} position={[x, 1.37, 0]}>
            <B p={[0, -0.14, 0]} s={[0.125, 0.3, 0.135]} m={m.hoodie} />
            <group ref={el} position={[0, -0.28, 0]}>
              <B p={[0, -0.12, 0]} s={[0.115, 0.25, 0.125]} m={m.hoodie} />
              <B p={[0, -0.29, 0.005]} s={[0.09, 0.1, 0.1]} m={skin} />
            </group>
          </group>
        ))}
        {/* Sacoche en bandoulière */}
        {AVATAR.toolBag ? (
          <group>
            <B p={[0.02, 1.16, 0.13]} s={[0.035, 0.62, 0.012]} r={[0, 0, -0.72]} m={m.strap} shadow={false} />
            <B p={[0.02, 1.16, -0.13]} s={[0.035, 0.62, 0.012]} r={[0, 0, -0.72]} m={m.strap} shadow={false} />
            <group position={[-0.25, 0.93, 0.02]}>
              <B s={[0.1, 0.2, 0.26]} m={m.bag} />
              <B p={[-0.052, 0.05, 0]} s={[0.012, 0.11, 0.26]} m={m.bagFlap} />
              <mesh geometry={coilGeo} material={m.cable} position={[-0.065, -0.04, 0.05]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          </group>
        ) : null}
        {/* Tête */}
        <B p={[0, 1.46, 0]} s={[0.11, 0.07, 0.11]} m={skin} />
        <group ref={head} position={[0, 1.62, 0]}>
          <mesh geometry={headGeo} material={skin} scale={[1, 1.08, 1]} castShadow />
          <B p={[0.052, 0.01, 0.138]} s={[0.03, 0.036, 0.02]} m={m.eye} shadow={false} />
          <B p={[-0.052, 0.01, 0.138]} s={[0.03, 0.036, 0.02]} m={m.eye} shadow={false} />
          <B p={[0.158, -0.005, 0]} s={[0.03, 0.06, 0.05]} m={skin} shadow={false} />
          <B p={[-0.158, -0.005, 0]} s={[0.03, 0.06, 0.05]} m={skin} shadow={false} />
          {AVATAR.hair === "short" ? (
            <>
              <mesh geometry={hairGeo} material={m.hair} position={[0, 0.02, -0.01]} castShadow />
              <B p={[0, 0.1, 0.1]} s={[0.26, 0.06, 0.1]} r={[0.35, 0, 0]} m={m.hair} shadow={false} />
            </>
          ) : AVATAR.hair === "cap" ? (
            <>
              <mesh geometry={capGeo} material={m.hoodieShade} position={[0, 0.12, 0]} castShadow />
              <B p={[0, 0.09, 0.2]} s={[0.24, 0.02, 0.14]} m={m.hoodieShade} />
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
}
