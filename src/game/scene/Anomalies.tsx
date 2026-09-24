"use client";
import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { anomalies } from "@/data/anomalies";
import type { Anomaly as AnomalyDef } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { ANOMALY_PLACEMENTS } from "../layout";
import { anomalyVisible } from "../interaction";
import { cachedMaterial, geo, glow, PALETTE } from "../materials";
import { particleMaterial } from "../shaders";
import { Label } from "./primitives";

const PARTICLES = 40;

function useParticles() {
  return useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLES * 3);
    const seed = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.25 + Math.random() * 0.65;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 1.8 - 0.9;
      pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
}

/**
 * Anomalie de code : un noyau lumineux, des fragments typographiques en
 * orbite lente et des particules localisées. Une fois stabilisée, elle se
 * fige en une étiquette lisible.
 */
function AnomalyObject({ def, reducedMotion, quality }: { def: AnomalyDef; reducedMotion: boolean; quality: "high" | "low" }) {
  const placement = ANOMALY_PLACEMENTS[def.id];
  const state = useApp((s) => s.progress.anomalies[def.id]);
  const stabilizing = useLabUi((s) => s.stabilizing === def.id);
  const viewed = state === "viewed";
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const cage = useRef<THREE.LineSegments>(null);
  const ring = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  const appear = useRef(def.revealedBy ? 0 : 1);
  const clear = useRef(1);
  const gather = useRef(0);
  const particles = useParticles();
  const pMat = useMemo(() => particleMaterial(PALETTE.cyan), []);
  useEffect(
    () => () => {
      particles.dispose();
      pMat.dispose();
    },
    [particles, pMat],
  );
  const coreGeo = geo("anomaly:core", () => new THREE.OctahedronGeometry(0.26, 0));
  const cageGeo = geo("anomaly:cage", () => {
    const b = new THREE.BoxGeometry(0.78, 0.78, 0.78);
    const e = new THREE.EdgesGeometry(b);
    b.dispose();
    return e;
  });
  const cageMat = cachedMaterial("anomaly:cage", () => new THREE.LineBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.75, toneMapped: false }));
  const flashGeo = geo("anomaly:flash", () => new THREE.RingGeometry(0.3, 0.36, 32));
  const flashMat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }), []);
  useEffect(() => () => flashMat.dispose(), [flashMat]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    appear.current = Math.min(1, appear.current + dt * (reducedMotion ? 10 : 0.9));
    // Une fiche cadre un autre objet tout proche : l'anomalie s'efface pour ne pas masquer la vue.
    const ui = useLabUi.getState();
    const f = ui.focus;
    const hide =
      !!f &&
      ui.panel !== null &&
      !(ui.panel.kind === "content" && ui.panel.anomalyId === def.id) &&
      Math.hypot(f.target[0] - placement.float[0], f.target[2] - placement.float[2]) < 3.4;
    clear.current += ((hide ? 0 : 1) - clear.current) * (1 - Math.exp(-8 * dt));
    const s = THREE.MathUtils.smoothstep(appear.current, 0, 1) * clear.current;
    g.visible = s > 0.02;
    g.scale.setScalar(Math.max(0.001, s));
    const bob = reducedMotion || viewed ? 0 : Math.sin(t * 0.9 + placement.float[0]) * 0.06;
    g.position.set(placement.float[0], placement.float[1] + bob, placement.float[2]);

    gather.current += ((stabilizing ? 1 : 0) - gather.current) * (1 - Math.exp(-(reducedMotion ? 30 : 3.5) * dt));
    const k = gather.current;
    if (core.current) {
      core.current.visible = !viewed;
      if (!reducedMotion) core.current.rotation.set(t * 0.4, t * 0.6, 0);
      core.current.scale.setScalar(1 + k * 0.6);
    }
    if (cage.current) {
      cage.current.visible = !viewed;
      if (!reducedMotion) cage.current.rotation.set(-t * 0.25, -t * 0.35, t * 0.1);
      cage.current.scale.setScalar(1 - k * 0.55);
    }
    if (ring.current) {
      ring.current.visible = !viewed;
      if (!reducedMotion) ring.current.rotation.y = t * 0.18;
      ring.current.scale.setScalar(1 - k * 0.85);
    }
    if (flash.current) {
      flashMat.opacity = stabilizing ? Math.max(0, Math.sin(k * Math.PI)) * 0.85 : 0;
      flash.current.scale.setScalar(1 + k * 2.2);
    }
    pMat.uniforms.uTime!.value = t;
    pMat.uniforms.uMotion!.value = reducedMotion ? 0 : 1;
    pMat.uniforms.uGather!.value = k;
    pMat.uniforms.uIntensity!.value = viewed ? 0.25 : state === "spotted" ? 1 : 0.7;
  });

  const labelColor = viewed ? PALETTE.offWhite : PALETTE.cyan;
  const fragments = def.fragments;
  return (
    <group ref={root} position={placement.float}>
      <mesh ref={core} geometry={coreGeo} material={glow("cyan", 0.92)} />
      <lineSegments ref={cage} geometry={cageGeo} material={cageMat} />
      <group ref={ring}>
        {fragments.map((f, i) => {
          const a = (i / fragments.length) * Math.PI * 2;
          return (
            <Billboard key={f} position={[Math.cos(a) * 0.95, (i % 2 ? 0.16 : -0.14), Math.sin(a) * 0.95]}>
              <Label mono fontSize={0.11} color={PALETTE.cyan} fillOpacity={0.85} outlineWidth={0.006} outlineColor="#0d1215">
                {f}
              </Label>
            </Billboard>
          );
        })}
      </group>
      <mesh ref={flash} geometry={flashGeo} material={flashMat} rotation={[-Math.PI / 2, 0, 0]} />
      {quality === "high" || !viewed ? <points geometry={particles} material={pMat} frustumCulled={false} /> : null}
      <Billboard position={[0, viewed ? 0 : 0.72, 0]}>
        {viewed ? (
          <>
            <mesh position={[0, 0, -0.01]} material={cachedMaterial("anomaly:card", () => new THREE.MeshBasicMaterial({ color: "#12171b", transparent: true, opacity: 0.88 }))}>
              <planeGeometry args={[Math.max(1.9, def.id.length * 0.092), 0.42]} />
            </mesh>
            <mesh position={[0, -0.21, -0.005]} geometry={geo("box", () => new THREE.BoxGeometry(1, 1, 1))} material={glow("amber")} scale={[Math.max(1.9, def.id.length * 0.092), 0.014, 0.001]} />
          </>
        ) : null}
        <Label mono fontSize={0.135} color={labelColor} outlineWidth={viewed ? 0 : 0.008} outlineColor="#0d1215" position={[0, viewed ? 0.05 : 0, 0]}>
          {def.id}
        </Label>
        {viewed ? (
          <Label mono position={[0, -0.1, 0]} fontSize={0.075} color={PALETTE.amber}>
            stabilisée · consultable
          </Label>
        ) : null}
      </Billboard>
    </group>
  );
}

export function Anomalies({ reducedMotion, quality }: { reducedMotion: boolean; quality: "high" | "low" }) {
  const mission = useApp((s) => s.progress.mission);
  return (
    <group>
      {anomalies
        .filter((a) => anomalyVisible(a.id, mission))
        .map((a) => (
          <AnomalyObject key={a.id} def={a} reducedMotion={reducedMotion} quality={quality} />
        ))}
    </group>
  );
}
