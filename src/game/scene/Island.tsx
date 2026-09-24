"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { cachedMaterial, geo, glow, mat, PALETTE } from "../materials";
import { tileTexture } from "../textures";
import { ISLAND, PATHS, PLATFORMS } from "../layout";
import { B, Glow, Label } from "./primitives";

const W = ISLAND.maxX - ISLAND.minX;
const D = ISLAND.maxZ - ISLAND.minZ;
const CX = (ISLAND.minX + ISLAND.maxX) / 2;
const CZ = (ISLAND.minZ + ISLAND.maxZ) / 2;
const WALL_H = 3.1;

/** Câble de brassage géant qui borde l'île, avec ses connecteurs RJ45. */
function GiantPatchCable({ from, to, color }: { from: [number, number]; to: [number, number]; color: string }) {
  const geometry = useMemo(() => {
    const a = new THREE.Vector3(from[0], 0.32, from[1]);
    const b = new THREE.Vector3(to[0], 0.32, to[1]);
    const mid = a.clone().lerp(b, 0.5);
    const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5).setY(0.36), mid.setY(0.3), mid.clone().lerp(b, 0.5).setY(0.36), b]);
    return new THREE.TubeGeometry(curve, 48, 0.24, 8, false);
  }, [from, to]);
  const dir = new THREE.Vector2(to[0] - from[0], to[1] - from[1]).normalize();
  const angle = Math.atan2(dir.x, dir.y);
  const plug = (p: [number, number], flip: number) => (
    <group position={[p[0], 0.34, p[1]]} rotation={[0, angle + (flip ? Math.PI : 0), 0]}>
      <B s={[0.5, 0.42, 0.9]} m={mat(color)} />
      <B p={[0, 0, -0.62]} s={[0.46, 0.36, 0.4]} m={mat("#dfe6ea", { roughness: 0.3 })} />
      <B p={[0, 0.2, -0.62]} s={[0.2, 0.06, 0.34]} m="aluDark" />
      <Glow p={[0, -0.05, -0.83]} s={[0.36, 0.05, 0.02]} color="amber" />
    </group>
  );
  return (
    <group>
      <mesh geometry={geometry} material={mat(color, { roughness: 0.55 })} castShadow receiveShadow />
      {plug(from, 1)}
      {plug(to, 0)}
    </group>
  );
}

function PathStrip({ from: start, to }: { from: [number, number]; to: [number, number] }) {
  // Le chemin démarre au bord de l'anneau d'accueil, pas en son centre.
  const len0 = Math.hypot(to[0] - start[0], to[1] - start[1]);
  const from: [number, number] = [start[0] + ((to[0] - start[0]) / len0) * 2.9, start[1] + ((to[1] - start[1]) / len0) * 2.9];
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;
  return (
    <group position={[cx, 0.012, cz]} rotation={[0, angle, 0]}>
      <B s={[1.7, 0.02, len]} m="alu" shadow={false} />
      <Glow p={[0.83, 0.013, 0]} s={[0.04, 0.005, len]} color="cyanDeep" />
      <Glow p={[-0.83, 0.013, 0]} s={[0.04, 0.005, len]} color="cyanDeep" />
      {Array.from({ length: Math.floor(len / 1.4) }, (_, i) => (
        <Glow key={i} p={[0, 0.013, -len / 2 + 0.7 + i * 1.4]} s={[0.16, 0.004, 0.16]} color={i % 4 === 0 ? "amberDeep" : "cyanDeep"} />
      ))}
    </group>
  );
}

export function Island() {
  const floorTex = tileTexture("floor", [W / 2, D / 2]);
  const floorMat = cachedMaterial("floor", () => new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92, color: "#ffffff" }));
  const raisedTex = tileTexture("raised", [(PLATFORMS.bay.maxX - PLATFORMS.bay.minX) / 1.2, (PLATFORMS.bay.maxZ - PLATFORMS.bay.minZ) / 1.2]);
  const raisedMat = cachedMaterial("raised", () => new THREE.MeshStandardMaterial({ map: raisedTex, roughness: 0.7, metalness: 0.15 }));
  const warmTex = tileTexture("warm", [5, 4]);
  const warmMat = cachedMaterial("warm", () => new THREE.MeshStandardMaterial({ map: warmTex, roughness: 0.9 }));
  const baseGeo = geo("island:base", () => {
    const g = new THREE.CylinderGeometry(W * 0.7, W * 0.12, 9, 4, 1);
    g.rotateY(Math.PI / 4);
    return g;
  });

  return (
    <group>
      {/* Sol et socle */}
      <mesh position={[CX, -0.01, CZ]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <B p={[CX, -0.62, CZ]} s={[W, 1.2, D]} m="graphite" shadow={false} />
      <B p={[CX, -0.06, ISLAND.maxZ + 0.05]} s={[W + 0.1, 0.12, 0.1]} m="alu" shadow={false} />
      <B p={[ISLAND.maxX + 0.05, -0.06, CZ]} s={[0.1, 0.12, D + 0.1]} m="alu" shadow={false} />
      <mesh geometry={baseGeo} material={mat("graphiteDark")} position={[CX, -5.7, CZ]} scale={[1, 1, 1]} />

      {/* Murs du fond : atelier ouvert vers la caméra */}
      <B p={[ISLAND.minX - 0.2, WALL_H / 2, CZ]} s={[0.4, WALL_H, D + 0.4]} m="graphite" />
      <B p={[CX, WALL_H / 2, ISLAND.minZ - 0.2]} s={[W + 0.4, WALL_H, 0.4]} m="graphite" />
      <B p={[ISLAND.minX + 0.02, WALL_H - 0.05, CZ]} s={[0.1, 0.1, D]} m="alu" />
      <B p={[CX, WALL_H - 0.05, ISLAND.minZ + 0.02]} s={[W, 0.1, 0.1]} m="alu" />
      {/* Plinthes lumineuses : froides côté serveurs, chaudes côté bureau */}
      <Glow p={[ISLAND.minX + 0.03, 0.12, CZ]} s={[0.03, 0.04, D - 1]} color="cyanDeep" />
      <Glow p={[-8, 0.12, ISLAND.minZ + 0.03]} s={[30, 0.04, 0.03]} color="cyanDeep" />
      <Glow p={[12, 0.12, ISLAND.minZ + 0.03]} s={[8, 0.04, 0.03]} color="amberDeep" />
      {/* Chemins de câbles muraux */}
      <B p={[ISLAND.minX + 0.3, 2.62, CZ]} s={[0.5, 0.06, D - 1]} m="aluDark" />
      <B p={[ISLAND.minX + 0.54, 2.7, CZ]} s={[0.03, 0.14, D - 1]} m="aluDark" />
      <B p={[-6, 2.62, ISLAND.minZ + 0.3]} s={[34, 0.06, 0.5]} m="aluDark" />
      <B p={[-6, 2.7, ISLAND.minZ + 0.54]} s={[34, 0.14, 0.03]} m="aluDark" />
      <mesh position={[ISLAND.minX + 0.3, 2.7, CZ]} rotation={[Math.PI / 2, 0, 0]} material={mat("cyanDeep", { roughness: 0.5 })}>
        <cylinderGeometry args={[0.06, 0.06, D - 1.2, 6]} />
      </mesh>
      <mesh position={[-6, 2.7, ISLAND.minZ + 0.28]} rotation={[0, 0, Math.PI / 2]} material={mat("amberDeep", { roughness: 0.5 })}>
        <cylinderGeometry args={[0.05, 0.05, 33.6, 6]} />
      </mesh>

      {/* Bordures : câbles de brassage géants sur les bords avant */}
      <GiantPatchCable from={[ISLAND.maxX - 0.5, ISLAND.minZ + 1.4]} to={[ISLAND.maxX - 0.5, ISLAND.maxZ - 1.6]} color={PALETTE.cyanDeep} />
      <GiantPatchCable from={[ISLAND.maxX - 1.6, ISLAND.maxZ - 0.5]} to={[ISLAND.minX + 1.4, ISLAND.maxZ - 0.5]} color={PALETTE.amberDeep} />

      {/* Sols des zones */}
      <mesh position={[(PLATFORMS.bay.minX + PLATFORMS.bay.maxX) / 2, PLATFORMS.bay.top / 2, (PLATFORMS.bay.minZ + PLATFORMS.bay.maxZ) / 2]} material={raisedMat} receiveShadow castShadow>
        <boxGeometry args={[PLATFORMS.bay.maxX - PLATFORMS.bay.minX, PLATFORMS.bay.top, PLATFORMS.bay.maxZ - PLATFORMS.bay.minZ]} />
      </mesh>
      <mesh position={[11.8, 0.012, -18.3]} rotation={[-Math.PI / 2, 0, 0]} material={warmMat} receiveShadow>
        <planeGeometry args={[9, 10]} />
      </mesh>

      {/* Chemins lumineux depuis l'accueil */}
      {PATHS.map((p, i) => (
        <PathStrip key={i} from={p.from} to={p.to} />
      ))}
      <group position={[4, 0.03, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh material={glow("amber", 0.85)}>
          <ringGeometry args={[2.3, 2.42, 48]} />
        </mesh>
        <mesh material={glow("cyanDeep", 0.9)}>
          <ringGeometry args={[2.62, 2.66, 48]} />
        </mesh>
      </group>
      <Label mono position={[4.9, 0.035, 6.7]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} fontSize={0.34} color={PALETTE.graphiteSoft} letterSpacing={0.12}>
        EVANN // ROOT ACCESS
      </Label>

      {/* Colliders statiques : sol, murs, bords invisibles, estrade de la baie */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[W / 2, 0.5, D / 2]} position={[CX, -0.5, CZ]} friction={0.9} />
        <CuboidCollider args={[0.2, WALL_H / 2, D / 2 + 0.2]} position={[ISLAND.minX - 0.2, WALL_H / 2, CZ]} />
        <CuboidCollider args={[W / 2 + 0.2, WALL_H / 2, 0.2]} position={[CX, WALL_H / 2, ISLAND.minZ - 0.2]} />
        <CuboidCollider args={[0.25, 1.5, D / 2]} position={[ISLAND.maxX + 0.25, 1.5, CZ]} />
        <CuboidCollider args={[W / 2, 1.5, 0.25]} position={[CX, 1.5, ISLAND.maxZ + 0.25]} />
        <CuboidCollider args={[0.25, 0.3, D / 2 - 1.4]} position={[ISLAND.maxX - 0.5, 0.3, CZ - 0.1]} />
        <CuboidCollider args={[W / 2 - 1.4, 0.3, 0.25]} position={[CX - 0.1, 0.3, ISLAND.maxZ - 0.5]} />
        <CuboidCollider
          args={[(PLATFORMS.bay.maxX - PLATFORMS.bay.minX) / 2, PLATFORMS.bay.top / 2, (PLATFORMS.bay.maxZ - PLATFORMS.bay.minZ) / 2]}
          position={[(PLATFORMS.bay.minX + PLATFORMS.bay.maxX) / 2, PLATFORMS.bay.top / 2, (PLATFORMS.bay.minZ + PLATFORMS.bay.maxZ) / 2]}
        />
      </RigidBody>
    </group>
  );
}
