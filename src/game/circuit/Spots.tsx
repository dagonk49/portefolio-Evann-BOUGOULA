"use client";
/**
 * Spots « pop culture » de l'infield. Clins d'œil stylisés, dessinés en
 * code : aucun logo, aucune image ni élément graphique officiel des jeux ou
 * des films. Chaque spot porte une anomalie qui ouvre la fiche loisir.
 */
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { cachedMaterial, geo, glow, mat, PALETTE, unitBox } from "../materials";
import { canvasTexture } from "../textures";
import { B, Glow, Label } from "../scene/primitives";
import { SPOTS } from "./layout";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/* ------------------------------------------------------------------ */
/* Valorant : site A, caisses de radianite, dispositif hexagonal          */
/* ------------------------------------------------------------------ */

const RADIANITE = "#ff5a64";

function RadianiteCrate({ p, rot = 0 }: { p: [number, number, number]; rot?: number }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <B p={[0, 0.45, 0]} s={[1.1, 0.9, 0.9]} m="#343941" />
      <B p={[0, 0.92, 0]} s={[1.14, 0.06, 0.94]} m="#23272d" />
      <Glow p={[0, 0.45, 0.455]} s={[0.9, 0.06, 0.01]} color={RADIANITE} />
      <Glow p={[0, 0.45, -0.455]} s={[0.9, 0.06, 0.01]} color={RADIANITE} />
      <Glow p={[0.555, 0.45, 0]} s={[0.01, 0.06, 0.7]} color={RADIANITE} />
      <mesh geometry={geo("radianite:core", () => new THREE.CylinderGeometry(0.16, 0.16, 0.34, 8))} material={glow(RADIANITE, 0.9)} position={[0, 1.13, 0]} />
    </group>
  );
}

function PushCrate({ p }: { p: [number, number, number] }) {
  return (
    <group userData={{ noBatch: true }}>
    <RigidBody position={[p[0], p[1] + 0.46, p[2]]} colliders={false} linearDamping={0.6} angularDamping={0.8}>
      <CuboidCollider args={[0.55, 0.45, 0.45]} density={3} friction={0.7} />
      <group position={[0, -0.45, 0]}>
        <RadianiteCrate p={[0, 0, 0]} />
      </group>
    </RigidBody>
    </group>
  );
}

function SpikeDevice({ p, reducedMotion }: { p: [number, number, number]; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !reducedMotion) ref.current.rotation.y = clock.elapsedTime * 0.5;
  });
  const hex = geo("spike:hex", () => new THREE.CylinderGeometry(0.42, 0.48, 0.5, 6));
  const ring = geo("spike:ring", () => new THREE.TorusGeometry(0.5, 0.04, 6, 6));
  return (
    <group position={p} userData={{ noBatch: true }}>
      <group ref={ref}>
        <mesh geometry={hex} material={mat("#2a2e35", { roughness: 0.4, metalness: 0.4 })} position={[0, 0.25, 0]} castShadow />
        <mesh geometry={ring} material={glow(RADIANITE)} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={geo("spike:top", () => new THREE.CylinderGeometry(0.16, 0.2, 0.2, 6))} material={glow(RADIANITE, 0.9)} position={[0, 0.6, 0]} />
      </group>
    </group>
  );
}

function ValorantSpot({ reducedMotion }: { reducedMotion: boolean }) {
  const { x, z } = SPOTS.valorant;
  const concrete = "#c9c2b5";
  return (
    <group>
      {/* Murs en L du site */}
      <B p={[x - 1, 1.3, z - 4]} s={[8, 2.6, 0.5]} m={concrete} />
      <B p={[x - 5, 1.3, z - 1]} s={[0.5, 2.6, 6]} m={concrete} />
      <B p={[x - 1, 2.64, z - 4]} s={[8.1, 0.08, 0.6]} m="#9e978a" />
      <Label position={[x - 2.4, 1.45, z - 3.73]} fontSize={1.5} color={RADIANITE} letterSpacing={0.02}>
        A
      </Label>
      <Label mono position={[x + 1.4, 1.9, z - 3.73]} fontSize={0.2} color="#3a3f47" letterSpacing={0.18}>
        SITE · A
      </Label>
      {/* Zone de pose au sol */}
      <group position={[x, 0.02, z + 0.2]}>
        {[
          [0, -2, 4, 0.08],
          [0, 2, 4, 0.08],
          [-2, 0, 0.08, 4],
          [2, 0, 0.08, 4],
        ].map(([dx, dz, sx, sz], i) => (
          <Glow key={i} p={[dx!, 0, dz!]} s={[sx!, 0.01, sz!]} color={RADIANITE} />
        ))}
      </group>
      <SpikeDevice p={[x, 0, z + 0.2]} reducedMotion={reducedMotion} />
      {/* Caisses de radianite */}
      <RadianiteCrate p={[x - 3.9, 0, z - 2.9]} />
      <RadianiteCrate p={[x - 3.9, 0, z - 1.7]} rot={0.1} />
      <RadianiteCrate p={[x - 3.9, 0.92, z - 2.3]} rot={-0.08} />
      <PushCrate p={[x - 2.6, 0, z + 3.6]} />
      <PushCrate p={[x - 4.0, 0, z + 2.6]} />
      {/* Rôles */}
      <group position={[x + 3.4, 0, z - 3.2]}>
        <B p={[-0.9, 0.7, 0]} s={[0.07, 1.4, 0.07]} m="graphite" />
        <B p={[0.9, 0.7, 0]} s={[0.07, 1.4, 0.07]} m="graphite" />
        <B p={[0, 1.35, 0]} s={[2.1, 0.62, 0.06]} m="#1b1e23" />
        <Label mono position={[0, 1.45, 0.04]} fontSize={0.15} color={RADIANITE} letterSpacing={0.1}>
          DUELIST · INITIATOR
        </Label>
        <Label mono position={[0, 1.24, 0.04]} fontSize={0.09} color={PALETTE.offWhite}>
          prêt à clutch l&apos;infra
        </Label>
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 1.3, 0.25]} position={[x - 1, 1.3, z - 4]} />
        <CuboidCollider args={[0.25, 1.3, 3]} position={[x - 5, 1.3, z - 1]} />
        <CuboidCollider args={[0.55, 0.9, 1.1]} position={[x - 3.9, 0.9, z - 2.3]} />
        <CylinderCollider args={[0.3, 0.5]} position={[x, 0.3, z + 0.2]} />
      </RigidBody>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Minecraft : blocs en pixels, dont un mur destructible                  */
/* ------------------------------------------------------------------ */

function pixelTexture(key: string, draw: (px: (x: number, y: number, c: string) => void) => void) {
  const t = canvasTexture(`px:${key}`, 16, 16, (ctx) => {
    draw((x, y, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.anisotropy = 1;
  return t;
}

/** Bruit déterministe pour les pixels (même rendu à chaque chargement). */
const noise = (x: number, y: number, k: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

function blockMaterials() {
  const dirt = pixelTexture("dirt", (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, noise(x, y, 1) > 0.78 ? "#6d4527" : noise(x, y, 2) > 0.6 ? "#8a5a36" : "#7b4f2f");
  });
  const grassTop = pixelTexture("grass-top", (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, noise(x, y, 3) > 0.7 ? "#79c24b" : noise(x, y, 4) > 0.5 ? "#5ea83a" : "#68b043");
  });
  const grassSide = pixelTexture("grass-side", (px) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const edge = 3 + Math.floor(noise(x, 0, 5) * 2.5);
        px(x, y, y < edge ? (noise(x, y, 6) > 0.5 ? "#79c24b" : "#5ea83a") : noise(x, y, 1) > 0.78 ? "#6d4527" : "#8a5a36");
      }
  });
  const stone = pixelTexture("stone", (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, noise(x, y, 7) > 0.75 ? "#6f7378" : noise(x, y, 8) > 0.45 ? "#8a8e93" : "#7d8186");
  });
  const redstone = pixelTexture("redstone", (px) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const ore = noise(Math.floor(x / 2), Math.floor(y / 2), 9) > 0.8;
        px(x, y, ore ? (noise(x, y, 10) > 0.5 ? "#ff2a1f" : "#b3110c") : noise(x, y, 7) > 0.6 ? "#6f7378" : "#848890");
      }
  });
  const log = pixelTexture("log", (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, x % 4 === 0 || noise(x, y, 11) > 0.85 ? "#4f3a22" : "#6b5033");
  });
  const leaves = pixelTexture("leaves", (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, noise(x, y, 12) > 0.7 ? "#2f6b22" : noise(x, y, 13) > 0.35 ? "#3f8a2c" : "#4c9c35");
  });
  const lamp = pixelTexture("lamp", (px) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) px(x, y, x === 0 || y === 0 || x === 15 || y === 15 ? "#6b4424" : noise(x, y, 14) > 0.5 ? "#ffd27a" : "#f4a84a");
  });
  const m = (key: string, map: THREE.Texture, emissive = false) =>
    cachedMaterial(`block:${key}`, () =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.95, ...(emissive ? { emissive: "#ffb347", emissiveMap: map, emissiveIntensity: 0.9 } : {}) }),
    );
  const dirtM = m("dirt", dirt);
  const sideM = m("grass-side", grassSide);
  return {
    grass: [sideM, sideM, m("grass-top", grassTop), dirtM, sideM, sideM],
    dirt: dirtM,
    stone: m("stone", stone),
    redstone: m("redstone", redstone, false),
    log: m("log", log),
    leaves: m("leaves", leaves),
    lamp: m("lamp", lamp, true),
  };
}

const BLOCK = 0.9;

/** Mur de blocs dynamiques : on peut le renverser à pied ou en véhicule. */
function BlockWall({ origin, kind, cells }: { origin: [number, number, number]; kind: "grass" | "stone" | "redstone"; cells: [number, number][] }) {
  const mats = blockMaterials();
  const material = mats[kind];
  const geometry = geo("block", () => new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK));
  return (
    <group userData={{ noBatch: true }}>
      {cells.map(([i, j]) => (
        <RigidBody
          key={`${i}-${j}`}
          position={[origin[0] + i * BLOCK, origin[1] + BLOCK / 2 + j * BLOCK + 0.01, origin[2]]}
          colliders={false}
          linearDamping={0.3}
          angularDamping={0.4}
        >
          <CuboidCollider args={[BLOCK / 2, BLOCK / 2, BLOCK / 2]} density={2} friction={0.8} />
          <mesh geometry={geometry} material={material} castShadow receiveShadow />
        </RigidBody>
      ))}
    </group>
  );
}

function MinecraftSpot() {
  const { x, z } = SPOTS.minecraft;
  const mats = blockMaterials();
  const trunk: [number, number, number][] = [0, 1, 2, 3].map((j) => [x - 2.4, BLOCK / 2 + j * BLOCK, z - 3]);
  const leaves: [number, number, number][] = [];
  for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) for (let j = 0; j < 2; j++) if (!(j === 1 && Math.abs(i) + Math.abs(k) === 2)) leaves.push([x - 2.4 + i * BLOCK, 3.5 * BLOCK + j * BLOCK + BLOCK / 2, z - 3 + k * BLOCK]);
  const grassCells: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [1, 1],
  ];
  const stoneCells: [number, number][] = [
    [2, 1],
    [3, 1],
    [1, 2],
  ];
  const redCells: [number, number][] = [[2, 2]];
  const wallOrigin: [number, number, number] = [x + 0.2, 0, z - 1.2];
  return (
    <group>
      {trunk.map((p, i) => (
        <mesh key={`t${i}`} geometry={unitBox()} material={mats.log} position={p} scale={BLOCK} castShadow receiveShadow />
      ))}
      {leaves.map((p, i) => (
        <mesh key={`l${i}`} geometry={unitBox()} material={mats.leaves} position={p} scale={BLOCK} castShadow />
      ))}
      <BlockWall origin={wallOrigin} kind="grass" cells={grassCells} />
      <BlockWall origin={wallOrigin} kind="stone" cells={stoneCells} />
      <BlockWall origin={wallOrigin} kind="redstone" cells={redCells} />
      {/* Petit circuit de redstone : levier, fil lumineux, lampe */}
      <mesh geometry={unitBox()} material={mats.stone} position={[x - 4.4, BLOCK / 2, z + 1.2]} scale={BLOCK} castShadow />
      <B p={[x - 4.4, BLOCK + 0.18, z + 1.2]} s={[0.1, 0.36, 0.1]} r={[0, 0, 0.5]} m="#6b5033" />
      <Glow p={[x - 2.9, 0.03, z + 1.2]} s={[2.2, 0.02, 0.16]} color="#ff2a1f" />
      <Glow p={[x - 1.8, 0.03, z + 2.1]} s={[0.16, 0.02, 1.9]} color="#ff2a1f" />
      <mesh geometry={unitBox()} material={mats.lamp} position={[x - 1.8, BLOCK / 2, z + 3.2]} scale={BLOCK} castShadow />
      <pointLight position={[x - 1.8, 1.3, z + 3.2]} color="#ffb347" intensity={6} distance={5} />
      <Label mono position={[x - 1.8, 1.25, z + 3.66]} fontSize={0.12} color={PALETTE.offWhite}>
        redstone : ON
      </Label>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[BLOCK / 2, 2 * BLOCK, BLOCK / 2]} position={[x - 2.4, 2 * BLOCK, z - 3]} />
        <CuboidCollider args={[BLOCK * 1.5, BLOCK, BLOCK * 1.5]} position={[x - 2.4, 4.5 * BLOCK, z - 3]} />
        <CuboidCollider args={[BLOCK / 2, BLOCK / 2, BLOCK / 2]} position={[x - 4.4, BLOCK / 2, z + 1.2]} />
        <CuboidCollider args={[BLOCK / 2, BLOCK / 2, BLOCK / 2]} position={[x - 1.8, BLOCK / 2, z + 3.2]} />
      </RigidBody>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* GTA V et VI : panneau d'autoroute néon, kiosque d'attente               */
/* ------------------------------------------------------------------ */

const drawHighwaySign: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#0f6b3c";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#f4f1ea";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(w / 2 - 2, 26, 4, h - 52);
  ctx.font = "700 46px 'IBM Plex Sans', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Los Santos", 40, h * 0.42);
  ctx.fillText("Vice City", w / 2 + 40, h * 0.42);
  ctx.font = "700 40px 'IBM Plex Sans', sans-serif";
  ctx.fillText("↑", 40, h * 0.74);
  ctx.fillText("→", w / 2 + 40, h * 0.74);
  ctx.font = "600 26px 'IBM Plex Mono', monospace";
  ctx.fillText("sortie 5", 100, h * 0.75);
  ctx.fillText("sortie 6", w / 2 + 100, h * 0.75);
};

const drawKioskScreen: Draw = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#ff6fb1");
  g.addColorStop(1, "#ffa45c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(22, 16, 40, 0.82)";
  ctx.fillRect(14, 14, w - 28, h - 28);
  ctx.fillStyle = "#3fd0c9";
  ctx.font = "700 30px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GTA VI · SALLE D'ATTENTE", w / 2, 60);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "500 19px 'IBM Plex Sans', sans-serif";
  const quote = ["« Le seul braquage toléré", "est celui d'une baie", "mal brassée. »"];
  quote.forEach((l, i) => ctx.fillText(l, w / 2, 112 + i * 28));
  ctx.fillStyle = "#ffcf7a";
  ctx.font = "600 17px 'IBM Plex Mono', monospace";
  ctx.fillText("statut : en attente…", w / 2, h - 34);
};

function PalmTree({ p }: { p: [number, number, number] }) {
  const leaf = geo("palm:leaf", () => new THREE.BoxGeometry(1.8, 0.05, 0.36).translate(0.9, 0, 0));
  return (
    <group position={p}>
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} p={[i * 0.05, 0.4 + i * 0.8, 0]} s={[0.26 - i * 0.02, 0.8, 0.26 - i * 0.02]} r={[0, i * 0.4, 0.04]} m="#8a6a47" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} geometry={leaf} material={mat("#3f8a4a")} position={[0.25, 4.1, 0]} rotation={[0, (i / 6) * Math.PI * 2, -0.35]} castShadow />
      ))}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[2, 0.18]} position={[0.1, 2, 0]} />
      </RigidBody>
    </group>
  );
}

function GtaSpot() {
  const { x, z } = SPOTS.gta;
  const sign = canvasTexture("gta:sign", 1024, 256, drawHighwaySign);
  const signMat = cachedMaterial("gta:sign", () => new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6, emissive: "#ffffff", emissiveMap: sign, emissiveIntensity: 0.22 }));
  const screen = canvasTexture("gta:kiosk", 512, 320, drawKioskScreen);
  const screenMat = cachedMaterial("gta:kiosk", () => new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
  const sx = x;
  const sz = z - 2.8;
  return (
    <group>
      {/* Portique d'autoroute */}
      <B p={[sx - 3.6, 2.6, sz]} s={[0.26, 5.2, 0.26]} m="#8d949c" />
      <B p={[sx + 3.6, 2.6, sz]} s={[0.26, 5.2, 0.26]} m="#8d949c" />
      <B p={[sx, 5.0, sz]} s={[7.6, 0.2, 0.3]} m="#8d949c" />
      <mesh position={[sx, 4.05, sz + 0.12]} material={signMat}>
        <planeGeometry args={[6.4, 1.6]} />
      </mesh>
      <Glow p={[sx, 4.9, sz + 0.14]} s={[6.5, 0.05, 0.03]} color="#ff6fb1" />
      <Glow p={[sx, 3.2, sz + 0.14]} s={[6.5, 0.05, 0.03]} color="#3fd0c9" />
      {/* Marqueur de mission au sol */}
      <mesh position={[x - 2.6, 0.6, z + 2.2]} material={glow("#ffd23f", 0.28)} userData={{ noBatch: true }}>
        <cylinderGeometry args={[0.7, 0.7, 1.2, 20, 1, true]} />
      </mesh>
      <Glow p={[x - 2.6, 0.02, z + 2.2]} s={[1.3, 0.01, 1.3]} color="#ffd23f" />
      {/* Kiosque GTA VI */}
      <group position={[x + 3.4, 0, z + 1.6]} rotation={[0, -0.35, 0]}>
        <B p={[0, 1.2, 0]} s={[2.2, 2.4, 1.4]} m="#ff8cc0" />
        <B p={[0, 2.5, 0.2]} s={[2.8, 0.14, 2.0]} m="#3fd0c9" />
        <mesh position={[0, 1.45, 0.71]} material={screenMat}>
          <planeGeometry args={[1.9, 1.2]} />
        </mesh>
        <B p={[0, 0.25, 1.5]} s={[1.8, 0.1, 0.5]} m="#f4f1ea" />
        <B p={[-0.8, 0.12, 1.5]} s={[0.08, 0.24, 0.4]} m="#8d949c" />
        <B p={[0.8, 0.12, 1.5]} s={[0.08, 0.24, 0.4]} m="#8d949c" />
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.1, 1.2, 0.7]} position={[0, 1.2, 0]} />
        </RigidBody>
      </group>
      <PalmTree p={[x + 5.8, 0, z - 0.4]} />
      <PalmTree p={[x - 4.8, 0, z + 0.2]} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.13, 2.6, 0.13]} position={[sx - 3.6, 2.6, sz]} />
        <CuboidCollider args={[0.13, 2.6, 0.13]} position={[sx + 3.6, 2.6, sz]} />
      </RigidBody>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cinéma et mécanique : écran de drive-in, établi                         */
/* ------------------------------------------------------------------ */

const drawDriveIn: Draw = (ctx, w, h) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, "#402a5c");
  sky.addColorStop(1, "#f6a35c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2a1f2e";
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  // Route qui file vers l'horizon
  ctx.fillStyle = "#3d3f45";
  ctx.beginPath();
  ctx.moveTo(w * 0.47, h * 0.62);
  ctx.lineTo(w * 0.53, h * 0.62);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.fill();
  ctx.fillStyle = "#f2c14a";
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    ctx.fillRect(w * 0.497, h * (0.64 + t * t * 0.36), w * 0.006 * (1 + t * 3), h * 0.02 * (1 + t * 2));
  }
  // Lignes de vitesse
  ctx.strokeStyle = "rgba(255, 240, 210, 0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const y = h * (0.2 + (i % 7) * 0.06);
    const x0 = i < 7 ? w * 0.04 : w * 0.62;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + w * 0.3, y);
    ctx.stroke();
  }
  // Silhouette de voiture
  ctx.fillStyle = "#16181b";
  ctx.fillRect(w * 0.36, h * 0.74, w * 0.28, h * 0.1);
  ctx.fillRect(w * 0.42, h * 0.68, w * 0.14, h * 0.07);
  ctx.fillStyle = "#ff3b3b";
  ctx.fillRect(w * 0.37, h * 0.76, w * 0.03, h * 0.025);
  ctx.fillRect(w * 0.6, h * 0.76, w * 0.03, h * 0.025);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = `700 ${Math.round(h * 0.09)}px 'IBM Plex Sans', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("FILMS CULTES DE VITESSE", w / 2, h * 0.14);
  ctx.font = `500 ${Math.round(h * 0.05)}px 'IBM Plex Mono', monospace`;
  ctx.fillText("séance au coucher du soleil", w / 2, h * 0.22);
};

function CinemaSpot() {
  const { x, z } = SPOTS.cinema;
  const screen = canvasTexture("cinema:screen", 1024, 576, drawDriveIn);
  const screenMat = cachedMaterial("cinema:screen", () => new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }));
  const tireGeo = geo("cinema:tire", () => new THREE.TorusGeometry(0.32, 0.14, 8, 14));
  return (
    <group>
      {/* Écran de drive-in, tourné vers la caméra */}
      <group position={[x + 2.2, 0, z - 2.4]} rotation={[0, Math.PI / 4, 0]}>
        <B p={[-3.4, 2.4, -0.1]} s={[0.3, 4.8, 0.3]} m="graphite" />
        <B p={[3.4, 2.4, -0.1]} s={[0.3, 4.8, 0.3]} m="graphite" />
        <B p={[0, 3.7, -0.12]} s={[7.4, 4.4, 0.12]} m="graphiteDark" />
        <mesh position={[0, 3.7, -0.05]} material={screenMat}>
          <planeGeometry args={[7, 3.94]} />
        </mesh>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.15, 2.4, 0.15]} position={[-3.4, 2.4, -0.1]} />
          <CuboidCollider args={[0.15, 2.4, 0.15]} position={[3.4, 2.4, -0.1]} />
        </RigidBody>
      </group>
      {/* Poteaux haut-parleurs du drive-in */}
      {[
        [x - 1.6, z + 1.4],
        [x + 1.4, z + 3.2],
      ].map(([px, pz], i) => (
        <group key={i} position={[px!, 0, pz!]}>
          <B p={[0, 0.6, 0]} s={[0.08, 1.2, 0.08]} m="aluDark" />
          <B p={[0, 1.2, 0.08]} s={[0.3, 0.22, 0.14]} m="graphiteSoft" />
        </group>
      ))}
      {/* Établi de mécanique */}
      <group position={[x - 3.2, 0, z + 3.6]} rotation={[0, -0.3, 0]}>
        <B p={[0, 0.88, 0]} s={[2.4, 0.08, 0.9]} m="wood" />
        <B p={[-1.1, 0.44, 0]} s={[0.08, 0.88, 0.8]} m="graphite" />
        <B p={[1.1, 0.44, 0]} s={[0.08, 0.88, 0.8]} m="graphite" />
        <B p={[-0.6, 1.08, 0]} s={[0.6, 0.32, 0.36]} m="#b8322c" />
        <B p={[0.5, 1.02, -0.1]} s={[0.7, 0.2, 0.5]} m="#5b6168" />
        <B p={[0.45, 1.18, -0.1]} s={[0.16, 0.12, 0.44]} m="#7d858d" />
        <B p={[0.2, 0.935, 0.28]} s={[0.5, 0.03, 0.06]} r={[0, 0.4, 0]} m="#c9ced3" />
        <B p={[0, 1.8, -0.42]} s={[2.4, 1.3, 0.05]} m="#3c424a" />
        <Label mono position={[0, 2.28, -0.39]} fontSize={0.15} color={PALETTE.amber} letterSpacing={0.1}>
          ATELIER MÉCANIQUE
        </Label>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((dx, i) => (
          <B key={i} p={[dx, 1.7, -0.38]} s={[0.05, 0.36, 0.03]} r={[0, 0, (i - 2) * 0.12]} m="#c9ced3" />
        ))}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[1.2, 0.5, 0.45]} position={[0, 0.5, 0]} />
        </RigidBody>
      </group>
      {/* Pneu et cric devant l'établi */}
      <mesh geometry={tireGeo} material={mat("#1b1d20", { roughness: 0.9 })} position={[x - 1.2, 0.14, z + 4.6]} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <B p={[x - 4.6, 0.12, z + 2.2]} s={[0.9, 0.12, 0.3]} m="#b8322c" />
      <B p={[x - 4.3, 0.3, z + 2.2]} s={[0.1, 0.3, 0.1]} m="#7d858d" />
    </group>
  );
}

export function Spots({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <ValorantSpot reducedMotion={reducedMotion} />
      <MinecraftSpot />
      <GtaSpot />
      <CinemaSpot />
    </group>
  );
}
