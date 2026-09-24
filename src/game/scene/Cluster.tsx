"use client";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { homelab } from "@/data";
import { cachedMaterial, mat, PALETTE } from "../materials";
import { PLATFORMS, PROXMOX_HOST, type Vec3 } from "../layout";
import { tileTexture } from "../textures";
import { B, Glow, Label } from "./primitives";

const P = PLATFORMS.cluster;
const RAMP = { fromX: P.maxX, toX: P.maxX + 3.2, z: -9.4, width: 3.4 };

function holoMaterial(color: string) {
  return cachedMaterial(`holo:${color}`, () =>
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.22, emissive: color, emissiveIntensity: 0.55, roughness: 0.3, depthWrite: false }),
  );
}

/** Bloc holographique (VM ou conteneur) avec arêtes lumineuses. */
function Holo({ p, size, color, label, sub, labelSize = 0.13 }: { p: Vec3; size: Vec3; color: string; label: string; sub?: string; labelSize?: number }) {
  const edges = useMemo(() => {
    const box = new THREE.BoxGeometry(...size);
    const e = new THREE.EdgesGeometry(box);
    box.dispose();
    return e;
  }, [size]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group position={p}>
      <mesh material={holoMaterial(color)}>
        <boxGeometry args={size} />
      </mesh>
      <lineSegments geometry={edges} material={cachedMaterial(`holo:edge:${color}`, () => new THREE.LineBasicMaterial({ color, toneMapped: false }))} />
      <Billboard position={[0, size[1] / 2 + 0.2, 0]}>
        <Label fontSize={labelSize} color={PALETTE.offWhite} outlineWidth={0.012} outlineColor="#11161a">
          {label}
        </Label>
        {sub ? (
          <Label mono position={[0, -labelSize * 1.1, 0]} fontSize={labelSize * 0.62} color={PALETTE.alu} outlineWidth={0.008} outlineColor="#11161a" maxWidth={2.6} textAlign="center">
            {sub}
          </Label>
        ) : null}
      </Billboard>
    </group>
  );
}

/** Conteneurs en orbite lente autour de la VM principale. */
function Containers({ center, reducedMotion }: { center: Vec3; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current && !reducedMotion) group.current.rotation.y += dt * 0.25;
  });
  const services = homelab.mainVm.services;
  return (
    <group ref={group} position={center}>
      {services.map((s, i) => {
        const a = (i / services.length) * Math.PI * 2;
        return <Holo key={s.id} p={[Math.cos(a) * 1.6, -0.15 + (i % 2) * 0.3, Math.sin(a) * 1.6]} size={[0.44, 0.44, 0.44]} color={PALETTE.amber} label={s.label} labelSize={0.13} />;
      })}
    </group>
  );
}

function Link({ from, to }: { from: Vec3; to: Vec3 }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]), [from, to]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry} material={cachedMaterial("holo:link", () => new THREE.LineBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.6, toneMapped: false }))} />;
}

export function Cluster({ reducedMotion }: { reducedMotion: boolean }) {
  const top = P.top;
  const cx = (P.minX + P.maxX) / 2;
  const cz = (P.minZ + P.maxZ) / 2;
  const w = P.maxX - P.minX;
  const d = P.maxZ - P.minZ;
  const rampLen = Math.hypot(RAMP.toX - RAMP.fromX, top) + 0.2;
  const rampAngle = -Math.atan2(top, RAMP.toX - RAMP.fromX);
  const mainVm: Vec3 = [PROXMOX_HOST[0] + 1.2, 3.25, PROXMOX_HOST[2]];
  const hostTop: Vec3 = [PROXMOX_HOST[0], top + 1.6, PROXMOX_HOST[2]];
  const tests: Vec3[] = [
    [PROXMOX_HOST[0] - 0.2, 1.9, -6.9],
    [PROXMOX_HOST[0] + 1.1, 1.6, -6.2],
    [PROXMOX_HOST[0] + 1.1, 1.6, -12.6],
    [PROXMOX_HOST[0] - 0.2, 1.9, -11.9],
  ];
  const floorTex = tileTexture("dark", [w / 1.2, d / 1.2]);
  const floorMat = cachedMaterial("cluster:floor", () => new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.1 }));
  return (
    <group>
      {/* Estrade surélevée + rampe */}
      <B p={[cx, top / 2, cz]} s={[w, top, d]} m={floorMat} />
      <Glow p={[P.maxX + 0.01, top - 0.03, cz]} s={[0.02, 0.03, d]} color="cyanDeep" />
      <Glow p={[cx, top - 0.03, P.maxZ + 0.01]} s={[w, 0.03, 0.02]} color="cyanDeep" />
      <group position={[(RAMP.fromX + RAMP.toX) / 2, top / 2 - 0.1, RAMP.z]} rotation={[0, 0, rampAngle]}>
        <B s={[rampLen, 0.2, RAMP.width]} m="graphiteSoft" />
        <Glow p={[0, 0.101, RAMP.width / 2 - 0.1]} s={[rampLen, 0.004, 0.04]} color="cyan" />
        <Glow p={[0, 0.101, -RAMP.width / 2 + 0.1]} s={[rampLen, 0.004, 0.04]} color="cyan" />
      </group>

      {/* Hôte Proxmox */}
      <group position={PROXMOX_HOST}>
        <B p={[0, 0.06, 0]} s={[1.2, 0.12, 1.3]} m="graphiteDark" />
        <B p={[0, 0.82, 0]} s={[1.0, 1.4, 1.1]} m="graphite" />
        <B p={[0.51, 1.46, 0]} s={[0.02, 0.1, 1.0]} m="graphiteDark" />
        <Glow p={[0.52, 1.52, 0]} s={[0.004, 0.02, 0.96]} color="cyan" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} position={[0.511, 0.34 + i * 0.13, -0.28]}>
            <B s={[0.01, 0.1, 0.4]} m="graphiteDark" shadow={false} />
            <Glow p={[0.006, -0.03, 0.16]} s={[0.004, 0.018, 0.018]} color={i % 3 ? "green" : "cyan"} />
          </group>
        ))}
        <group position={[0.512, 1.08, 0.26]}>
          <B s={[0.01, 0.3, 0.42]} m={mat("#0e1215")} shadow={false} />
          <Label mono position={[0.007, 0.06, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.07} color={PALETTE.amber}>
            Proxmox VE
          </Label>
          <Label mono position={[0.007, -0.06, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.045} color={PALETTE.alu}>
            hôte du lab
          </Label>
        </group>
      </group>
      {/* Petits équipements : onduleur et baie de disques */}
      <group position={[PROXMOX_HOST[0], top, PROXMOX_HOST[2] + 1.6]}>
        <B p={[0, 0.3, 0]} s={[0.7, 0.6, 0.5]} m="graphiteDark" />
        <Glow p={[0.351, 0.45, 0]} s={[0.004, 0.06, 0.2]} color="cyanDeep" />
      </group>
      <group position={[PROXMOX_HOST[0], top, PROXMOX_HOST[2] - 1.6]}>
        <B p={[0, 0.25, 0]} s={[0.7, 0.5, 0.5]} m="graphite" />
        {[0, 1, 2, 3].map((i) => (
          <Glow key={i} p={[0.351, 0.14 + i * 0.1, 0.12]} s={[0.004, 0.02, 0.02]} color="green" />
        ))}
      </group>
      <pointLight position={[PROXMOX_HOST[0] + 2.2, 3, PROXMOX_HOST[2]]} color="#7fd0ff" intensity={12} distance={10} decay={1.6} />

      {/* Schéma logique : VM principale, conteneurs, environnements de test */}
      <Holo p={mainVm} size={[1.8, 1.1, 1.4]} color={PALETTE.cyan} label="VM principale · Docker" sub={"plus de 50 % des ressources, selon mon organisation"} labelSize={0.17} />
      <Containers center={mainVm} reducedMotion={reducedMotion} />
      <Link from={hostTop} to={[mainVm[0], mainVm[1] - 0.55, mainVm[2]]} />
      {homelab.testEnvironments.map((env, i) => (
        <group key={env.id}>
          <Holo p={tests[i]!} size={[0.78, 0.5, 0.64]} color={PALETTE.alu} label={env.label} labelSize={0.13} />
          <Link from={hostTop} to={[tests[i]![0], tests[i]![1] - 0.25, tests[i]![2]]} />
        </group>
      ))}

      {/* Panneau mural : pratique réseau personnelle */}
      <group position={[-23.96, 1.9, -9.4]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0, -0.01]} s={[3.2, 1.0, 0.03]} m="graphiteDark" shadow={false} />
        <Label mono position={[-1.45, 0.3, 0.01]} anchorX="left" fontSize={0.1} color={PALETTE.cyan} letterSpacing={0.12}>
          HOMELAB · PRATIQUE PERSONNELLE
        </Label>
        <Label position={[-1.45, 0.04, 0.01]} anchorX="left" fontSize={0.12} color={PALETTE.offWhite}>
          {homelab.networkPractice.map((n) => n.label).join("  ·  ")}
        </Label>
        <Label mono position={[-1.45, -0.28, 0.01]} anchorX="left" fontSize={0.065} color={PALETTE.alu} maxWidth={2.9}>
          Schéma illustratif : ni nombre de VM, ni matériel, ni topologie exacts.
        </Label>
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2, top / 2, d / 2]} position={[cx, top / 2, cz]} />
        <CuboidCollider args={[rampLen / 2, 0.1, RAMP.width / 2]} position={[(RAMP.fromX + RAMP.toX) / 2, top / 2 - 0.1, RAMP.z]} rotation={[0, 0, rampAngle]} />
        <CuboidCollider args={[0.6, 0.76, 0.65]} position={[PROXMOX_HOST[0], top + 0.76, PROXMOX_HOST[2]]} />
        <CuboidCollider args={[0.36, 0.3, 0.26]} position={[PROXMOX_HOST[0], top + 0.3, PROXMOX_HOST[2] + 1.6]} />
        <CuboidCollider args={[0.36, 0.26, 0.26]} position={[PROXMOX_HOST[0], top + 0.26, PROXMOX_HOST[2] - 1.6]} />
      </RigidBody>
    </group>
  );
}
