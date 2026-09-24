"use client";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useLabUi } from "@/state/labUi";
import { cachedMaterial, glow, PALETTE } from "../materials";
import { canvasTexture } from "../textures";
import { B, Glow, Label } from "../scene/primitives";
import { headingAt, KART_SPOT, PADDOCK, SAS_DOOR, STOCKCAR_GRID, trackPoint } from "./layout";

/** Vue peinte de l'intérieur : la salle serveur du lab. */
function drawServerRoom(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#101316");
  g.addColorStop(1, "#1d2126");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    const x = 18 + i * 60;
    ctx.fillStyle = "#23282e";
    ctx.fillRect(x, h * 0.18, 44, h * 0.74);
    for (let y = h * 0.22; y < h * 0.88; y += 12) {
      ctx.fillStyle = (Math.floor(y) + i * 7) % 3 ? "#3cc7da" : "#59e08a";
      ctx.fillRect(x + 6, y, 4, 3);
      ctx.fillStyle = "#353b42";
      ctx.fillRect(x + 14, y, 24, 6);
    }
  }
  ctx.fillStyle = "rgba(60, 199, 218, 0.25)";
  ctx.fillRect(0, h * 0.93, w, 4);
}

function hazardMaterial() {
  return cachedMaterial("paddock:hazard", () => {
    const t = canvasTexture("paddock:hazard", 128, 32, (ctx, w, h) => {
      ctx.fillStyle = "#1c1f23";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = PALETTE.amber;
      for (let i = -2; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 16, h);
        ctx.lineTo(i * 16 + 8, h);
        ctx.lineTo(i * 16 + 8 + h, 0);
        ctx.lineTo(i * 16 + h, 0);
        ctx.fill();
      }
    });
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
  });
}

/** Bâtiment du paddock et sas de retour vers le lab. */
function SasBuilding() {
  const { x, z, width, depth, height } = PADDOCK;
  const face = z + depth / 2;
  const doorW = 2.6;
  const doorH = 2.6;
  const leaf = doorW / 2;
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const open = useRef(0);
  const view = canvasTexture("paddock:server-room", 256, 256, drawServerRoom);
  const viewMat = cachedMaterial("paddock:view", () => new THREE.MeshBasicMaterial({ map: view, toneMapped: false }));
  const glass = cachedMaterial(
    "paddock:glass",
    () => new THREE.MeshStandardMaterial({ color: "#9fdbe3", transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.3, depthWrite: false }),
  );
  useFrame((_, delta) => {
    const travel = useLabUi.getState().travel;
    const target = travel && travel.to === "lab" ? 1 : 0;
    open.current += (target - open.current) * (1 - Math.exp(-3 * Math.min(delta, 0.05)));
    const d = open.current * leaf * 0.92;
    if (left.current) left.current.position.x = -leaf / 2 - d;
    if (right.current) right.current.position.x = leaf / 2 + d;
  });
  return (
    <group>
      <B p={[x, height / 2, z]} s={[width, height, depth]} m="graphite" />
      <B p={[x, height + 0.08, z]} s={[width + 0.4, 0.16, depth + 0.4]} m="aluDark" />
      <Glow p={[x, height - 0.2, face + 0.01]} s={[width - 0.4, 0.05, 0.01]} color="cyan" />
      <mesh position={[x, doorH / 2 + 0.02, face + 0.01]} material={viewMat}>
        <planeGeometry args={[doorW, doorH]} />
      </mesh>
      <B p={[x - doorW / 2 - 0.2, doorH / 2 + 0.1, face + 0.14]} s={[0.4, doorH + 0.2, 0.28]} m="graphiteDark" />
      <B p={[x + doorW / 2 + 0.2, doorH / 2 + 0.1, face + 0.14]} s={[0.4, doorH + 0.2, 0.28]} m="graphiteDark" />
      <B p={[x, doorH + 0.22, face + 0.14]} s={[doorW + 0.8, 0.3, 0.28]} m="graphiteDark" />
      <mesh position={[x, doorH + 0.22, face + 0.285]} material={hazardMaterial()}>
        <planeGeometry args={[doorW + 0.7, 0.2]} />
      </mesh>
      <group position={[x, 0, face + 0.07]} userData={{ noBatch: true }}>
        {[left, right].map((ref, i) => (
          <group key={i} ref={ref} position={[(i ? 1 : -1) * (leaf / 2), 0, 0]}>
            <B p={[0, doorH / 2, 0]} s={[leaf, doorH, 0.05]} m="aluDark" />
            <mesh position={[0, doorH / 2 + 0.12, 0.03]} material={glass}>
              <planeGeometry args={[leaf - 0.2, doorH - 0.6]} />
            </mesh>
            <Glow p={[(i ? -1 : 1) * (leaf / 2 - 0.03), doorH / 2, 0.03]} s={[0.02, doorH - 0.1, 0.01]} color="cyan" />
          </group>
        ))}
      </group>
      <Label mono position={[x, height - 0.55, face + 0.02]} fontSize={0.24} color={PALETTE.cyan} letterSpacing={0.12}>
        SAS · RETOUR AU LAB
      </Label>
      <Label mono position={[x - 3.1, height - 1.2, face + 0.02]} fontSize={0.2} color={PALETTE.offWhite}>
        PADDOCK
      </Label>
      <Label
        mono
        position={[SAS_DOOR[0] + 0.2, 0.035, SAS_DOOR[2] + 3.6]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        fontSize={0.26}
        color={PALETTE.cyan}
        letterSpacing={0.08}
        outlineWidth={0.006}
        outlineColor="#071a1d"
      >
        [E] RENTRER AU LAB
      </Label>
      <mesh position={[SAS_DOOR[0] + 0.1, 0.02, SAS_DOOR[2] + 3.6]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={glow("#071a1d", 0.55)}>
        <planeGeometry args={[3.8, 0.5]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[width / 2, height / 2, depth / 2 + 0.3]} position={[x, height / 2, z + 0.3]} />
      </RigidBody>
    </group>
  );
}

/** Garage des stands, ouvert vers la piste. */
function Garage({ cx, label }: { cx: number; label: string }) {
  const z = PADDOCK.z + 0.6;
  return (
    <group>
      <B p={[cx, 1.6, z - 1.5]} s={[4.6, 3.2, 0.25]} m="graphiteSoft" />
      <B p={[cx - 2.2, 1.6, z]} s={[0.25, 3.2, 3]} m="graphiteSoft" />
      <B p={[cx + 2.2, 1.6, z]} s={[0.25, 3.2, 3]} m="graphiteSoft" />
      <B p={[cx, 3.28, z + 0.2]} s={[4.8, 0.16, 3.6]} m="aluDark" />
      <Glow p={[cx, 3.1, z + 1.95]} s={[4.4, 0.06, 0.02]} color="amber" />
      <B p={[cx - 1.4, 0.45, z - 1.05]} s={[1.2, 0.9, 0.55]} m="#b8322c" />
      <B p={[cx - 1.4, 0.93, z - 1.05]} s={[1.22, 0.06, 0.57]} m="aluDark" />
      <B p={[cx + 1.3, 0.3, z - 0.9]} s={[0.9, 0.6, 0.9]} m="graphiteDark" />
      <Label mono position={[cx, 2.7, z - 1.36]} fontSize={0.26} color={PALETTE.offWhite} letterSpacing={0.1}>
        {label}
      </Label>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.3, 1.6, 0.13]} position={[cx, 1.6, z - 1.5]} />
        <CuboidCollider args={[0.13, 1.6, 1.5]} position={[cx - 2.2, 1.6, z]} />
        <CuboidCollider args={[0.13, 1.6, 1.5]} position={[cx + 2.2, 1.6, z]} />
      </RigidBody>
    </group>
  );
}

/** Marquage de l'emplacement du kart. */
function KartBay() {
  const [x, , z] = KART_SPOT;
  return (
    <group>
      {[
        [0, -1.1, 2.6, 0.08],
        [0, 1.1, 2.6, 0.08],
        [-1.3, 0, 0.08, 2.28],
        [1.3, 0, 0.08, 2.28],
      ].map(([dx, dz, sx, sz], i) => (
        <Glow key={i} p={[x + dx!, 0.02, z + dz!]} s={[sx!, 0.01, sz!]} color="amber" />
      ))}
      <Label mono position={[x - 0.2, 0.03, z + 1.6]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} fontSize={0.22} color={PALETTE.amber}>
        KART · [E]
      </Label>
    </group>
  );
}

/** Stock-car sous bâche tant que le mode course n'est pas débloqué. */
export function CoveredStockCar() {
  const p = trackPoint(STOCKCAR_GRID.s, STOCKCAR_GRID.d);
  const yaw = headingAt(STOCKCAR_GRID.s);
  const tarp = cachedMaterial("tarp", () => new THREE.MeshStandardMaterial({ color: "#3d4d63", roughness: 0.95 }));
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <B p={[0, 0.55, 0]} s={[4.0, 1.1, 1.9]} m={tarp} />
      <B p={[-0.2, 1.3, 0]} s={[1.8, 0.5, 1.6]} m={tarp} />
      <B p={[-1.8, 1.02, 0]} s={[0.4, 0.14, 1.9]} m={tarp} />
      <B p={[0.6, 1.12, 0]} s={[0.8, 0.06, 0.4]} m="#d3272e" />
      <group position={[0, 0, -2.0]} rotation={[0, 0, 0]}>
        <B p={[0, 0.7, 0]} s={[0.08, 1.4, 0.08]} m="aluDark" />
        <B p={[0, 1.45, 0]} s={[2.2, 0.62, 0.05]} m="graphiteDark" />
        <Label mono position={[0, 1.55, 0.03]} fontSize={0.13} color={PALETTE.amber}>
          STOCK-CAR N°49 · SOUS BÂCHE
        </Label>
        <Label mono position={[0, 1.34, 0.03]} fontSize={0.085} color={PALETTE.offWhite}>
          Déblocage : une commande secrète du terminal
        </Label>
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.0, 0.8, 0.95]} position={[0, 0.8, 0]} />
      </RigidBody>
    </group>
  );
}

export function Paddock() {
  return (
    <group>
      <SasBuilding />
      <Garage cx={-7.2} label="STANDS · KART" />
      <Garage cx={7.2} label="STANDS · N°49" />
      <KartBay />
      {/* Mât et drapeau à damier */}
      <B p={[11.4, 3, 12.8]} s={[0.1, 6, 0.1]} m="alu" />
      <mesh position={[12.1, 5.5, 12.8]} material={cachedMaterial("paddock:flag", () => {
        const t = canvasTexture("paddock:flag", 64, 48, (ctx, w, h) => {
          for (let y = 0; y < 6; y++)
            for (let xx = 0; xx < 8; xx++) {
              ctx.fillStyle = (xx + y) % 2 ? "#15171a" : "#f4f1ea";
              ctx.fillRect(xx * (w / 8), y * (h / 6), w / 8, h / 6);
            }
        });
        return new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 });
      })}>
        <planeGeometry args={[1.4, 1]} />
      </mesh>
    </group>
  );
}
