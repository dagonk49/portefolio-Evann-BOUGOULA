"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useApp } from "@/state/app";
import { labOnline } from "@/sim/diagnostics";
import { allCables, isFixedEndpoint, linkStatus } from "@/sim/network";
import type { Cable, EndpointId } from "@/sim/scenario";
import { mat, PALETTE } from "../../materials";
import { flowMaterial } from "../../shaders";
import { WALL_RUN } from "../../layout";
import { portWorldPosition } from "./rackLayout";
import { B, Label } from "../primitives";

/** Courbe d'un cordon de brassage : il sort du port, pend légèrement, rentre dans l'autre. */
function patchCurve(a: EndpointId, b: EndpointId): THREE.CatmullRomCurve3 | null {
  const pa = portWorldPosition(a);
  const pb = portWorldPosition(b);
  if (!pa || !pb) return null;
  const out = new THREE.Vector3(1, 0, 0); // face avant du rack = +X
  const a1 = pa.clone().addScaledVector(out, 0.07);
  const b1 = pb.clone().addScaledVector(out, 0.07);
  const mid = a1.clone().lerp(b1, 0.5).addScaledVector(out, 0.1);
  mid.y = Math.min(pa.y, pb.y) - 0.06 - pa.distanceTo(pb) * 0.08;
  return new THREE.CatmullRomCurve3([pa, a1, mid, b1, pb], false, "catmullrom", 0.5);
}

function cableColor(c: Cable): string {
  if (isFixedEndpoint(c.a) && isFixedEndpoint(c.b)) return PALETTE.aluDark;
  if (c.a === "pp-02" || c.b === "pp-02") return PALETTE.cyan;
  if (c.a === "srv-eth0" || c.b === "srv-eth0") return PALETTE.amber;
  return "#d9d4c9";
}

function CableMesh({ cable, online, reducedMotion }: { cable: Cable; online: boolean; reducedMotion: boolean }) {
  const geometry = useMemo(() => {
    const curve = patchCurve(cable.a, cable.b);
    return curve ? new THREE.TubeGeometry(curve, 40, 0.011, 6, false) : null;
  }, [cable.a, cable.b]);
  const flowGeo = useMemo(() => {
    const curve = patchCurve(cable.a, cable.b);
    return curve ? new THREE.TubeGeometry(curve, 40, 0.015, 6, false) : null;
  }, [cable.a, cable.b]);
  const flow = useMemo(() => flowMaterial(PALETTE.cyan, 3), []);
  useEffect(
    () => () => {
      geometry?.dispose();
      flowGeo?.dispose();
      flow.dispose();
    },
    [geometry, flowGeo, flow],
  );
  useFrame(({ clock }) => {
    flow.uniforms.uTime!.value = clock.elapsedTime;
    flow.uniforms.uMotion!.value = reducedMotion ? 0 : 1;
    const target = online ? 1 : 0;
    const u = flow.uniforms.uOpacity!;
    u.value += (target - u.value) * 0.08;
  });
  if (!geometry) return null;
  return (
    <group>
      <mesh geometry={geometry} material={mat(cableColor(cable), { roughness: 0.45, flat: false })} castShadow />
      {flowGeo ? <mesh geometry={flowGeo} material={flow} /> : null}
    </group>
  );
}

/** Câbles de la baie + liaison murale B-02 vers le bureau, avec flux quand le lien fonctionne. */
export function MissionCables({ reducedMotion }: { reducedMotion: boolean }) {
  const lab = useApp((s) => s.progress.lab);
  const online = useMemo(() => labOnline(lab), [lab]);
  const cables = allCables(lab);
  const pcUp = linkStatus(lab, "pc-eth0").up;

  const wallCurve = useMemo(() => new THREE.CatmullRomCurve3(WALL_RUN.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1), []);
  const wallGeo = useMemo(() => new THREE.TubeGeometry(wallCurve, 160, 0.045, 6, false), [wallCurve]);
  const wallFlowGeo = useMemo(() => new THREE.TubeGeometry(wallCurve, 160, 0.06, 6, false), [wallCurve]);
  const wallFlow = useMemo(() => flowMaterial(PALETTE.cyan, 36), []);
  useEffect(
    () => () => {
      wallGeo.dispose();
      wallFlowGeo.dispose();
      wallFlow.dispose();
    },
    [wallGeo, wallFlowGeo, wallFlow],
  );
  useFrame(({ clock }) => {
    wallFlow.uniforms.uTime!.value = clock.elapsedTime;
    wallFlow.uniforms.uMotion!.value = reducedMotion ? 0 : 1;
    const target = online.server ? 1 : pcUp ? 0.25 : 0;
    const u = wallFlow.uniforms.uOpacity!;
    u.value += (target - u.value) * 0.05;
  });

  // Étiquettes « B-02 » le long du tracé.
  const tags = useMemo(() => [0.18, 0.5, 0.82].map((t) => wallCurve.getPointAt(t)), [wallCurve]);

  return (
    <group>
      {cables.map((c) => (
        <CableMesh
          key={`${c.a}|${c.b}`}
          cable={c}
          reducedMotion={reducedMotion}
          online={
            (online.server && (c.a === "pp-02" || c.b === "pp-02" || c.a === "srv-eth0" || c.b === "srv-eth0")) ||
            (online.gateway && (c.a === "r1-gi0/0" || c.b === "r1-gi0/0"))
          }
        />
      ))}
      <mesh geometry={wallGeo} material={mat("#3a4a52", { roughness: 0.6, flat: false })} receiveShadow />
      <mesh geometry={wallFlowGeo} material={wallFlow} />
      {tags.map((p, i) => (
        <group key={i} position={[p.x, 0.07, p.z]}>
          <B s={[0.36, 0.05, 0.2]} m="offWhite" />
          <Label mono position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} fontSize={0.07} color={PALETTE.graphite}>
            B-02
          </Label>
        </group>
      ))}
    </group>
  );
}
