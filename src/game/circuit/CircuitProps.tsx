"use client";
import { ConvexHullCollider, InstancedRigidBodies, RigidBody, type InstancedRigidBodyProps } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { geo, glow, mat } from "../materials";
import { Cone } from "../scene/Props";
import { Label } from "../scene/primitives";
import { TRACK } from "./layout";

/** Piles de pneus dynamiques, à l'intérieur de chaque virage. */
function TireStacks() {
  const instances = useMemo<InstancedRigidBodyProps[]>(() => {
    const list: InstancedRigidBodyProps[] = [];
    const apex = TRACK.a + TRACK.R - TRACK.width / 2 - 2.2;
    let n = 0;
    for (const side of [1, -1]) {
      for (const dz of [-3.2, -1.6, 0, 1.6, 3.2]) {
        for (let level = 0; level < 3; level++) {
          list.push({ key: `tire-${n++}`, position: [side * apex, 0.16 + level * 0.3, dz], rotation: [0, 0, 0] });
        }
      }
    }
    return list;
  }, []);
  const tire = geo("tire:stack", () => new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10));
  return (
    <InstancedRigidBodies instances={instances} colliders="hull" linearDamping={0.5} angularDamping={0.6} friction={0.9} restitution={0.35} density={1.4}>
      <instancedMesh args={[tire, mat("#202226", { roughness: 0.95 }), instances.length]} castShadow receiveShadow />
    </InstancedRigidBodies>
  );
}

/** Tremplin : un coin incliné, maillage et collision convexe. */
function Ramp({ p, yaw, length = 5.5, width = 3.4, height = 1.15 }: { p: [number, number, number]; yaw: number; length?: number; width?: number; height?: number }) {
  const { geometry, points } = useMemo(() => {
    const l = length / 2;
    const w = width / 2;
    const pts = [
      [-l, 0, -w],
      [-l, 0, w],
      [l, 0, -w],
      [l, 0, w],
      [l, height, -w],
      [l, height, w],
    ];
    const pos = new Float32Array(pts.flat());
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    // Faces : pente, dos, deux flancs, dessous.
    g.setIndex([0, 1, 5, 0, 5, 4, 2, 4, 5, 2, 5, 3, 0, 4, 2, 1, 3, 5, 0, 2, 3, 0, 3, 1]);
    const flat = g.toNonIndexed();
    g.dispose();
    flat.computeVertexNormals();
    return { geometry: flat, points: pos };
  }, [length, width, height]);
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <mesh geometry={geometry} material={mat("#f2a948", { roughness: 0.7 })} castShadow receiveShadow />
      <mesh position={[length / 2 + 0.01, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={glow("#16181b", 0.9)}>
        <planeGeometry args={[width, height * 0.7]} />
      </mesh>
      <Label mono position={[length / 2 + 0.03, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.28} color="#f2a948">
        JUMP
      </Label>
      <RigidBody type="fixed" colliders={false}>
        <ConvexHullCollider args={[points]} friction={0.8} />
      </RigidBody>
    </group>
  );
}

export function CircuitProps() {
  const cones: [number, number, number][] = [];
  // Slalom de cônes entre le paddock et les spots.
  for (let i = 0; i < 7; i++) {
    cones.push([-22 + i * 2.6, 0, 1.2 + (i % 2 ? 0.9 : -0.9)]);
    cones.push([6.6 + i * 2.6, 0, 1.2 + (i % 2 ? -0.9 : 0.9)]);
  }
  return (
    <group userData={{ noBatch: true }}>
      {cones.map((p, i) => (
        <Cone key={i} p={p} />
      ))}
      <TireStacks />
      <Ramp p={[-2.5, 0, -11.5]} yaw={0} />
      <Ramp p={[22, 0, 9.5]} yaw={0} length={4.6} height={0.9} />
    </group>
  );
}
