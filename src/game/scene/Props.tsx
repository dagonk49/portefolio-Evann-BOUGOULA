"use client";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { cachedMaterial, geo, glow, mat, PALETTE } from "../materials";
import { cardboardLabel, codeFaceTexture } from "../textures";
import { fromScreen, type Vec3 } from "../layout";
import { B, Glow } from "./primitives";

/** Carton d'équipement poussable. */
export function Carton({ p, size = [0.7, 0.5, 0.55], label, rotY = 0 }: { p: Vec3; size?: Vec3; label: string; rotY?: number }) {
  const materials = useMemo(() => {
    const side = mat("cardboard");
    const labeled = cachedMaterial(`carton:${label}`, () => new THREE.MeshStandardMaterial({ map: cardboardLabel(label), roughness: 0.95 }));
    return [labeled, side, mat("cardboardDark"), side, labeled, side];
  }, [label]);
  return (
    <RigidBody position={[p[0], p[1] + size[1] / 2 + 0.01, p[2]]} rotation={[0, rotY, 0]} colliders={false} linearDamping={0.4} angularDamping={0.5}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} density={0.35} friction={0.8} />
      <mesh geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} material={materials} scale={size} castShadow receiveShadow />
    </RigidBody>
  );
}

/** Cône de chantier réseau. */
export function Cone({ p }: { p: Vec3 }) {
  const coneGeo = geo("cone", () => new THREE.ConeGeometry(0.2, 0.62, 10));
  const bandGeo = geo("cone:band", () => new THREE.CylinderGeometry(0.115, 0.15, 0.1, 10));
  return (
    <RigidBody position={[p[0], p[1] + 0.02, p[2]]} colliders={false} linearDamping={0.3} angularDamping={0.4}>
      <CuboidCollider args={[0.24, 0.03, 0.24]} position={[0, 0.03, 0]} density={1.2} />
      <CylinderCollider args={[0.3, 0.13]} position={[0, 0.36, 0]} density={0.3} />
      <B p={[0, 0.03, 0]} s={[0.48, 0.06, 0.48]} m="amberDeep" />
      <mesh geometry={coneGeo} material={mat("amber")} position={[0, 0.36, 0]} castShadow />
      <mesh geometry={bandGeo} material={mat("offWhite")} position={[0, 0.4, 0]} />
    </RigidBody>
  );
}

const CODE_GLYPHS: [string, string, string][] = [
  ["{ }", PALETTE.graphite, PALETTE.cyan],
  ["</>", PALETTE.graphite, PALETTE.amber],
  ["#!", "#e9e5dc", PALETTE.graphite],
  ["0x", PALETTE.cyanDeep, "#e9e5dc"],
  ["::1", "#e9e5dc", PALETTE.cyanDeep],
];

/** Bloc de code (cube à glyphes) à shooter. */
export function CodeBlock({ p, variant = 0, size = 0.62 }: { p: Vec3; variant?: number; size?: number }) {
  const [glyph, bg, fg] = CODE_GLYPHS[variant % CODE_GLYPHS.length]!;
  const material = cachedMaterial(`codeblock:${variant}`, () => new THREE.MeshStandardMaterial({ map: codeFaceTexture(glyph, bg, fg), roughness: 0.7 }));
  return (
    <RigidBody position={[p[0], p[1] + size / 2 + 0.02, p[2]]} rotation={[0, variant * 0.7, 0]} colliders={false} linearDamping={0.2} angularDamping={0.3}>
      <CuboidCollider args={[size / 2, size / 2, size / 2]} density={0.4} friction={0.6} restitution={0.2} />
      <mesh geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} material={material} scale={size} castShadow receiveShadow />
    </RigidBody>
  );
}

/** Mini-rack à roulettes, poussable. */
export function MiniRack({ p, rotY = 0 }: { p: Vec3; rotY?: number }) {
  return (
    <RigidBody position={[p[0], p[1] + 0.55, p[2]]} rotation={[0, rotY, 0]} colliders={false} linearDamping={1.2} angularDamping={1.5}>
      <CuboidCollider args={[0.3, 0.5, 0.3]} density={0.9} friction={0.4} />
      <B s={[0.6, 0.98, 0.6]} m="graphite" />
      <B p={[0, 0, 0.301]} s={[0.5, 0.86, 0.01]} m="graphiteDark" shadow={false} />
      {[0.28, 0.1, -0.08, -0.26].map((y, i) => (
        <group key={i}>
          <B p={[0, y, 0.305]} s={[0.46, 0.12, 0.01]} m="graphiteSoft" shadow={false} />
          <Glow p={[-0.17, y, 0.312]} s={[0.025, 0.025, 0.005]} color={i % 2 ? "green" : "cyan"} />
          <Glow p={[-0.12, y, 0.312]} s={[0.025, 0.025, 0.005]} color="green" />
        </group>
      ))}
      {[-0.22, 0.22].map((x) =>
        [-0.22, 0.22].map((z) => <B key={`${x}${z}`} p={[x, -0.52, z]} s={[0.07, 0.07, 0.07]} m="graphiteDark" shadow={false} />),
      )}
    </RigidBody>
  );
}

/** Tous les objets physiques libres, répartis dans les zones. */
export function PhysicsProps() {
  const s = fromScreen;
  return (
    <group>
      {/* Accueil : chantier réseau, cartons, blocs de code */}
      <Cone p={s(-12.2, -8.4)} />
      <Cone p={s(-13.6, -7.4)} />
      <Cone p={s(-11.0, -6.9)} />
      <Carton p={s(9.4, -2.6)} label="SWITCH 24P" />
      <Carton p={s(10.4, -2.0)} size={[0.55, 0.42, 0.5]} label="CÂBLES CAT6" rotY={0.4} />
      <Carton p={s(9.8, -2.3, 0.51)} size={[0.5, 0.36, 0.45]} label="PATCH 1 M" rotY={-0.3} />
      <CodeBlock p={s(-9.2, 2.2)} variant={0} />
      <CodeBlock p={s(9.6, 3.2)} variant={1} />
      <CodeBlock p={s(-4.8, 7.4)} variant={2} size={0.5} />
      <CodeBlock p={s(5.2, 7.8)} variant={3} size={0.5} />
      <CodeBlock p={s(-1.2, -3.2)} variant={4} size={0.45} />
      {/* Baie réseau */}
      <MiniRack p={[-17.0, 0.08, 3.3]} rotY={0.3} />
      <MiniRack p={[-16.6, 0.08, 14.6]} rotY={-0.2} />
      <Carton p={[-15.8, 0.08, 5.0]} size={[0.5, 0.3, 0.4]} label="SFP" />
      <Carton p={[-15.9, 0.08, 12.9]} size={[0.6, 0.45, 0.5]} label="AP Wi-Fi" rotY={0.6} />
      {/* HomeLab */}
      <Carton p={[-11.6, 0, -4.2]} size={[0.5, 0.34, 0.42]} label="SSD" rotY={0.2} />
      {/* Bureau et atelier */}
      <Carton p={[15.0, 0, -19.4]} size={[0.6, 0.4, 0.5]} label="LAPTOP" rotY={-0.3} />
      <Cone p={[6.9, 0, -11.6]} />
    </group>
  );
}

/** Chaise de bureau (dynamique). */
export function DeskChair({ p }: { p: Vec3 }) {
  const seat = mat("graphiteSoft");
  return (
    <RigidBody position={[p[0], p[1] + 0.5, p[2]]} rotation={[0, Math.PI, 0]} colliders={false} linearDamping={2} angularDamping={3}>
      <CuboidCollider args={[0.26, 0.05, 0.26]} position={[0, 0, 0]} density={1.4} />
      <CuboidCollider args={[0.25, 0.28, 0.04]} position={[0, 0.34, 0.24]} density={0.4} />
      <CylinderCollider args={[0.22, 0.05]} position={[0, -0.25, 0]} density={1} />
      <CuboidCollider args={[0.3, 0.02, 0.3]} position={[0, -0.47, 0]} density={2} />
      <B s={[0.52, 0.09, 0.52]} m={seat} />
      <B p={[0, 0.36, 0.25]} s={[0.5, 0.56, 0.07]} m={seat} />
      <B p={[0, -0.24, 0]} s={[0.07, 0.42, 0.07]} m="aluDark" />
      <B p={[0, -0.46, 0]} s={[0.6, 0.04, 0.08]} m="graphiteDark" />
      <B p={[0, -0.46, 0]} s={[0.08, 0.04, 0.6]} m="graphiteDark" />
      <mesh material={glow("amberDeep")} position={[0, 0.05, -0.262]} scale={[0.4, 0.015, 0.01]} geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} />
    </RigidBody>
  );
}
