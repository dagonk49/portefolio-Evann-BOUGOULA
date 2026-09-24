"use client";
import { CuboidCollider, RigidBody, TrimeshCollider } from "@react-three/rapier";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cachedMaterial, mat, unitBox } from "../materials";
import { canvasTexture } from "../textures";
import { B, Label } from "../scene/primitives";
import { bankHeight, headingAt, TRACK, TRACK_LENGTH, trackFrame, trackPoint } from "./layout";

const HALF_W = TRACK.width / 2;
const WALL_T = 0.4;
const WALL_H = 1.2;

/** Repère local de la surface relevée : X tangent, Y normal au revêtement, Z vers l'extérieur. */
export function surfaceBasis(s: number, d: number, out = new THREE.Matrix4()): THREE.Matrix4 {
  const f = trackFrame(s);
  const T = new THREE.Vector3(f.tx, 0, f.tz);
  const N = new THREE.Vector3(f.nx * Math.cos(f.bank), Math.sin(f.bank), f.nz * Math.cos(f.bank));
  const U = new THREE.Vector3().crossVectors(N, T);
  const p = trackPoint(s, d);
  out.makeBasis(T, U, N);
  out.setPosition(p[0], p[1], p[2]);
  return out;
}

function asphalt() {
  return canvasTexture(
    "circuit:asphalt",
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#3d3f45";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        const v = 50 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // Lignes de rive blanches
      ctx.fillStyle = "#e9e5dc";
      ctx.fillRect(w * 0.035, 0, w * 0.018, h);
      ctx.fillRect(w * 0.947, 0, w * 0.018, h);
      // Trajectoire gommée, légèrement plus sombre
      ctx.fillStyle = "rgba(20, 20, 24, 0.18)";
      ctx.fillRect(w * 0.3, 0, w * 0.16, h);
    },
    { repeat: [1, 1] },
  );
}

function grass() {
  return canvasTexture(
    "circuit:grass",
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#6f9a45";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#77a44b";
      ctx.fillRect(0, 0, w, h / 2);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(40,70,20,0.18)" : "rgba(190,220,120,0.14)";
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
      }
    },
    { repeat: [36, 26] },
  );
}

/** Revêtement relevé : un ruban continu, maillage de collision compris. */
function TrackSurface() {
  const { geometry, vertices, indices } = useMemo(() => {
    const steps = Math.ceil(TRACK_LENGTH / 0.8);
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = (i / steps) * TRACK_LENGTH;
      const f = trackFrame(s);
      for (const [k, d] of [
        [0, -HALF_W],
        [1, HALF_W],
      ] as const) {
        pos.push(f.x + f.nx * d, bankHeight(d, f.bank) + TRACK.lift, f.z + f.nz * d);
        uv.push(k, s / 10);
      }
      if (i < steps) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return { geometry: g, vertices: new Float32Array(pos), indices: new Uint32Array(idx) };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const tex = asphalt();
  tex.wrapT = THREE.RepeatWrapping;
  const material = cachedMaterial("circuit:asphalt", () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0.02 }));
  return (
    <>
      <mesh geometry={geometry} material={material} receiveShadow />
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider args={[vertices, indices]} friction={1.1} />
      </RigidBody>
    </>
  );
}

/** Vibreurs rouge et blanc lumineux, au bord intérieur et extérieur des virages. */
function Kerbs() {
  const red = useRef<THREE.InstancedMesh>(null);
  const white = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const list: { s: number; d: number; red: boolean }[] = [];
    const piece = 1.3;
    const turn = Math.PI * TRACK.R;
    for (const start of [TRACK.a, 3 * TRACK.a + turn]) {
      const from = start - 6;
      const to = start + turn + 6;
      let n = 0;
      for (let s = from; s < to; s += piece, n++) {
        list.push({ s, d: -HALF_W + 0.35, red: n % 2 === 0 });
        list.push({ s, d: HALF_W - 0.35, red: n % 2 === 1 });
      }
    }
    return list;
  }, []);
  const reds = items.filter((k) => k.red);
  const whites = items.filter((k) => !k.red);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const scale = new THREE.Matrix4().makeScale(1.25, 0.07, 0.7);
    [
      [red.current, reds],
      [white.current, whites],
    ].forEach(([mesh, list]) => {
      const im = mesh as THREE.InstancedMesh | null;
      if (!im) return;
      (list as typeof items).forEach((k, i) => {
        surfaceBasis(k.s, k.d, m);
        m.multiply(scale);
        im.setMatrixAt(i, m);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    });
  }, [reds, whites]);
  const redMat = cachedMaterial("kerb:red", () => new THREE.MeshStandardMaterial({ color: "#e0342f", emissive: "#ff2a1f", emissiveIntensity: 0.55, roughness: 0.6 }));
  const whiteMat = cachedMaterial("kerb:white", () => new THREE.MeshStandardMaterial({ color: "#f4f1ea", emissive: "#fff6e0", emissiveIntensity: 0.35, roughness: 0.6 }));
  return (
    <>
      <instancedMesh ref={red} args={[unitBox(), redMat, reds.length]} receiveShadow />
      <instancedMesh ref={white} args={[unitBox(), whiteMat, whites.length]} receiveShadow />
    </>
  );
}

/** Ligne de départ en damier et portique. */
function StartLine() {
  const checker = canvasTexture("circuit:checker", 128, 16, (ctx, w, h) => {
    const n = 16;
    const cell = w / n;
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#15171a" : "#f4f1ea";
        ctx.fillRect(x * cell, y * (h / 2), cell, h / 2);
      }
  });
  const checkerMat = cachedMaterial("circuit:checker", () => new THREE.MeshStandardMaterial({ map: checker, roughness: 0.7 }));
  const banner = canvasTexture("circuit:banner", 512, 64, (ctx, w, h) => {
    ctx.fillStyle = "#16181b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f2a948";
    ctx.font = "700 34px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("START · EVANN // ROOT ACCESS · FINISH", w / 2, h / 2 + 2);
  });
  const bannerMat = cachedMaterial("circuit:banner", () => new THREE.MeshBasicMaterial({ map: banner, toneMapped: false }));
  const z0 = TRACK.R - HALF_W - 1.2;
  const z1 = TRACK.R + HALF_W + 1.2;
  const zc = (z0 + z1) / 2;
  return (
    <group>
      <mesh position={[0, TRACK.lift + 0.012, TRACK.R]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={checkerMat} receiveShadow>
        <planeGeometry args={[TRACK.width, 1.4]} />
      </mesh>
      <B p={[0.6, 2.6, z0]} s={[0.3, 5.2, 0.3]} m="graphite" />
      <B p={[0.6, 2.6, z1]} s={[0.3, 5.2, 0.3]} m="graphite" />
      <B p={[0.6, 5.35, zc]} s={[0.26, 0.5, z1 - z0 + 0.3]} m="graphiteDark" />
      <mesh position={[0.735, 5.35, zc]} rotation={[0, Math.PI / 2, 0]} material={bannerMat}>
        <planeGeometry args={[z1 - z0 - 0.2, 0.42]} />
      </mesh>
      <mesh position={[0.465, 5.35, zc]} rotation={[0, -Math.PI / 2, 0]} material={bannerMat}>
        <planeGeometry args={[z1 - z0 - 0.2, 0.42]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.15, 2.6, 0.15]} position={[0.6, 2.6, z0]} />
        <CuboidCollider args={[0.15, 2.6, 0.15]} position={[0.6, 2.6, z1]} />
      </RigidBody>
    </group>
  );
}

const SPONSORS: { text: string; bg: string; fg: string }[] = [
  { text: "PROXMOX", bg: "#16181b", fg: "#f2a948" },
  { text: "DOCKER", bg: "#f4f1ea", fg: "#1d63c4" },
  { text: "CISCO", bg: "#16181b", fg: "#5fd0e0" },
  { text: "NETFORGE", bg: "#f2a948", fg: "#16181b" },
  { text: "HOMELAB", bg: "#1f2a33", fg: "#e9e5dc" },
];

function SponsorBoard({ index, position, yaw }: { index: number; position: [number, number, number]; yaw: number }) {
  const sp = SPONSORS[index % SPONSORS.length]!;
  const tex = canvasTexture(`sponsor:${sp.text}`, 512, 96, (ctx, w, h) => {
    ctx.fillStyle = sp.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = sp.fg;
    ctx.font = "700 60px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sp.text, w / 2, h / 2 + 3);
  });
  const material = cachedMaterial(`sponsor:${sp.text}`, () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: 0.18 }));
  return (
    <mesh position={position} rotation={[0, yaw, 0]} material={material}>
      <planeGeometry args={[5.2, 0.9]} />
    </mesh>
  );
}

/**
 * Mur extérieur continu (bord de piste affleurant) : un seul maillage fusionné
 * pour le rendu, des blocs de collision le long du tracé.
 */
function OuterWall() {
  const segments = useMemo(() => {
    const list: { x: number; z: number; y: number; h: number; yaw: number; len: number }[] = [];
    const d = HALF_W + WALL_T / 2;
    const pieces = 150;
    const step = TRACK_LENGTH / pieces;
    for (let i = 0; i < pieces; i++) {
      const s = (i + 0.5) * step;
      const f = trackFrame(s);
      const top = bankHeight(HALF_W, f.bank) + WALL_H;
      // Longueur de l'arc au rayon du mur (plus long qu'à l'axe dans les virages).
      const r = f.bank > 0 || Math.abs(f.x) > TRACK.a ? (TRACK.R + d) / TRACK.R : 1;
      list.push({ x: f.x + f.nx * d, z: f.z + f.nz * d, y: top / 2, h: top, yaw: headingAt(s), len: step * r + 0.08 });
    }
    return list;
  }, []);
  const geometry = useMemo(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const parts = segments.map((sg) => {
      const g = unitBox().clone();
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), sg.yaw);
      m.compose(new THREE.Vector3(sg.x, sg.y, sg.z), q, new THREE.Vector3(sg.len, sg.h, WALL_T));
      g.applyMatrix4(m);
      return g;
    });
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((g) => g.dispose());
    return merged;
  }, [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const wallMat = mat("#d9d4c9", { roughness: 0.85 });
  const boards = useMemo(() => {
    const list: { position: [number, number, number]; yaw: number }[] = [];
    const zBack = -(TRACK.R + HALF_W) - 0.01;
    const zFront = TRACK.R + HALF_W + WALL_T + 0.01;
    for (let i = 0; i < 9; i++) {
      const x = -TRACK.a + 4 + i * 6.6;
      list.push({ position: [x, WALL_H * 0.55, zBack], yaw: 0 });
      list.push({ position: [x + 3.3, WALL_H * 0.55, zFront], yaw: 0 });
    }
    return list;
  }, []);
  return (
    <group>
      <mesh geometry={geometry} material={wallMat} castShadow receiveShadow />
      {boards.map((b, i) => (
        <SponsorBoard key={i} index={i} position={b.position} yaw={b.yaw} />
      ))}
      <RigidBody type="fixed" colliders={false}>
        {segments.map((sg, i) => (
          <CuboidCollider key={i} args={[sg.len / 2, sg.h / 2 + 1.2, WALL_T / 2]} position={[sg.x, sg.y + 1.2, sg.z]} rotation={[0, sg.yaw, 0]} />
        ))}
      </RigidBody>
    </group>
  );
}

/** Herbe, limites du monde et arbres. */
function Ground() {
  const tex = grass();
  const material = cachedMaterial("circuit:grass", () => new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  const W = 190;
  const D = 140;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[W / 2, 1, D / 2]} position={[0, -1, 0]} friction={0.9} />
        <CuboidCollider args={[0.5, 6, D / 2]} position={[W / 2 - 12, 6, 0]} />
        <CuboidCollider args={[0.5, 6, D / 2]} position={[-W / 2 + 12, 6, 0]} />
        <CuboidCollider args={[W / 2, 6, 0.5]} position={[0, 6, D / 2 - 12]} />
        <CuboidCollider args={[W / 2, 6, 0.5]} position={[0, 6, -D / 2 + 12]} />
      </RigidBody>
    </group>
  );
}

function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const list: [number, number, number][] = [];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + rand() * 0.05;
      const rx = 70 + rand() * 12;
      const rz = 42 + rand() * 12;
      list.push([Math.cos(a) * rx, 0, Math.sin(a) * rz]);
    }
    return list.filter(([x, , z]) => !(z < -34 && Math.abs(x) < 30));
  }, []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.3, 2, 6), []);
  const crownGeo = useMemo(() => new THREE.ConeGeometry(1.8, 4.2, 7), []);
  useEffect(
    () => () => {
      trunkGeo.dispose();
      crownGeo.dispose();
    },
    [trunkGeo, crownGeo],
  );
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    spots.forEach(([x, , z], i) => {
      const k = 0.8 + ((i * 37) % 10) / 20;
      m.makeScale(k, k, k).setPosition(x, 1 * k, z);
      trunks.current?.setMatrixAt(i, m);
      m.makeScale(k, k, k).setPosition(x, 4 * k, z);
      crowns.current?.setMatrixAt(i, m);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={trunks} args={[trunkGeo, mat("#6b4a2f"), spots.length]} castShadow />
      <instancedMesh ref={crowns} args={[crownGeo, mat("#4f7a3a"), spots.length]} castShadow />
    </>
  );
}

/** Tribune derrière la ligne opposée. */
function Grandstand() {
  const z = -(TRACK.R + HALF_W + WALL_T + 2.2);
  const colors = ["#d3272e", "#f4f1ea", "#1d63c4", "#f2a948"] as const;
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i}>
          <B p={[0, 0.35 + i * 0.7, z - i * 0.9]} s={[46, 0.7, 0.9]} m="#9aa1a8" />
          <B p={[0, 0.75 + i * 0.7, z - i * 0.9 + 0.1]} s={[45.4, 0.12, 0.5]} m={colors[i % 4]!} />
        </group>
      ))}
      <B p={[0, 4.9, z - 5.6]} s={[47, 0.2, 7]} r={[0.12, 0, 0]} m="graphite" />
      {[-22.8, 0, 22.8].map((x) => (
        <B key={x} p={[x, 2.6, z - 8.4]} s={[0.3, 5.2, 0.3]} m="graphite" />
      ))}
      <Label mono position={[0, 5.6, z - 1.8]} fontSize={0.9} color="#f2a948" letterSpacing={0.2}>
        CIRCUIT EXTÉRIEUR
      </Label>
    </group>
  );
}

export function Track() {
  return (
    <group>
      <Ground />
      <TrackSurface />
      <Kerbs />
      <StartLine />
      <OuterWall />
      <Grandstand />
      <Trees />
    </group>
  );
}
