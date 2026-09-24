"use client";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useLabUi } from "@/state/labUi";
import { cachedMaterial, glow, PALETTE } from "../materials";
import { canvasTexture } from "../textures";
import { LAB_DOOR, LAB_DOOR_PAD } from "../layout";
import { B, Glow, Label } from "./primitives";

/** Vue peinte de l'extérieur : ciel d'heure dorée au-dessus du circuit. */
function drawGoldenHour(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#3b3f7a");
  sky.addColorStop(0.45, "#e0799a");
  sky.addColorStop(0.72, "#f6b35f");
  sky.addColorStop(1, "#ffd9a0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255, 236, 190, 0.95)";
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.7, h * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // Collines et tribune en silhouette
  ctx.fillStyle = "#6a4a6e";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.8);
  for (let x = 0; x <= w; x += w / 8) ctx.lineTo(x, h * (0.76 + 0.04 * Math.sin(x * 0.03)));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillStyle = "#3a2f40";
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  // Vibreurs rouge et blanc
  for (let x = 0; x < w; x += 16) {
    ctx.fillStyle = (x / 16) % 2 ? "#f4f1ea" : "#e0453c";
    ctx.fillRect(x, h * 0.86, 16, 6);
  }
}

/**
 * Sas blindé du lab : portes vitrées coulissantes ouvertes sur le circuit.
 * Les vantaux s'écartent pendant le passage vers le circuit.
 */
export function ExitDoor() {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const open = useRef(0);
  const { x, z, width, height } = LAB_DOOR;
  const face = z + 0.02;
  const view = canvasTexture("sas:golden-hour", 256, 256, drawGoldenHour);
  const viewMat = cachedMaterial("sas:view", () => new THREE.MeshBasicMaterial({ map: view, toneMapped: false }));
  const glass = cachedMaterial(
    "sas:glass",
    () => new THREE.MeshStandardMaterial({ color: "#9fdbe3", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.3, depthWrite: false }),
  );
  const leaf = width / 2;

  useFrame((_, delta) => {
    const travel = useLabUi.getState().travel;
    const target = travel && travel.to === "circuit" ? 1 : 0;
    open.current += (target - open.current) * (1 - Math.exp(-3 * Math.min(delta, 0.05)));
    const d = open.current * leaf * 0.92;
    if (left.current) left.current.position.x = -leaf / 2 - d;
    if (right.current) right.current.position.x = leaf / 2 + d;
  });

  const hazard = cachedMaterial("sas:hazard", () => {
    const t = canvasTexture("sas:hazard", 128, 32, (ctx, w, h) => {
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

  return (
    <group>
      {/* Vue extérieure derrière les vantaux */}
      <mesh position={[x, height / 2 + 0.02, face]} material={viewMat}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Encadrement blindé */}
      <B p={[x - width / 2 - 0.22, height / 2 + 0.1, face + 0.16]} s={[0.44, height + 0.2, 0.32]} m="graphiteDark" />
      <B p={[x + width / 2 + 0.22, height / 2 + 0.1, face + 0.16]} s={[0.44, height + 0.2, 0.32]} m="graphiteDark" />
      <B p={[x, height + 0.26, face + 0.16]} s={[width + 0.88, 0.32, 0.32]} m="graphiteDark" />
      <mesh position={[x, height + 0.26, face + 0.325]} material={hazard}>
        <planeGeometry args={[width + 0.8, 0.22]} />
      </mesh>
      <Glow p={[x - width / 2 - 0.01, height / 2, face + 0.33]} s={[0.04, height - 0.2, 0.01]} color="amber" />
      <Glow p={[x + width / 2 + 0.01, height / 2, face + 0.33]} s={[0.04, height - 0.2, 0.01]} color="amber" />
      {/* Vantaux vitrés (animés : exclus de la fusion statique) */}
      <group position={[x, 0, face + 0.08]} userData={{ noBatch: true }}>
        {[left, right].map((ref, i) => (
          <group key={i} ref={ref} position={[(i ? 1 : -1) * (leaf / 2), 0, 0]}>
            <B p={[0, height / 2, 0]} s={[leaf, height, 0.06]} m="aluDark" />
            <mesh position={[0, height / 2 + 0.15, 0.035]} material={glass}>
              <planeGeometry args={[leaf - 0.24, height - 0.7]} />
            </mesh>
            <Glow p={[(i ? -1 : 1) * (leaf / 2 - 0.03), height / 2, 0.035]} s={[0.02, height - 0.1, 0.01]} color="cyan" />
          </group>
        ))}
      </group>
      {/* Enseigne */}
      <Label mono position={[x, height + 0.62, face + 0.34]} fontSize={0.2} color={PALETTE.amber} letterSpacing={0.12}>
        SAS · CIRCUIT EXTÉRIEUR
      </Label>
      {/* Marquage au sol, devant la dalle */}
      <Label
        mono
        position={[LAB_DOOR_PAD[0] + 0.1, 0.035, LAB_DOOR_PAD[2] + 1.75]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        fontSize={0.26}
        color={PALETTE.amber}
        letterSpacing={0.08}
        outlineWidth={0.006}
        outlineColor="#2a1a06"
      >
        [E] SORTIR VERS LE CIRCUIT
      </Label>
      <mesh position={[LAB_DOOR_PAD[0], 0.02, LAB_DOOR_PAD[2] + 1.75]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={glow("#2a1a06", 0.55)}>
        <planeGeometry args={[4.4, 0.5]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.22, height / 2 + 0.1, 0.16]} position={[x - width / 2 - 0.22, height / 2 + 0.1, face + 0.16]} />
        <CuboidCollider args={[0.22, height / 2 + 0.1, 0.16]} position={[x + width / 2 + 0.22, height / 2 + 0.1, face + 0.16]} />
        <CuboidCollider args={[width / 2, height / 2, 0.06]} position={[x, height / 2, face + 0.08]} />
      </RigidBody>
    </group>
  );
}
