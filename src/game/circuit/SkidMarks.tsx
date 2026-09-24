"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 360;
const tmpM = new THREE.Matrix4();
const tmpX = new THREE.Vector3();
const tmpY = new THREE.Vector3();
const tmpZ = new THREE.Vector3();

/**
 * Tampon circulaire de traces de pneus (une seule géométrie instanciée) :
 * les plus anciennes sont réutilisées, rien n'est alloué pendant la conduite.
 */
class SkidBuffer {
  mesh: THREE.InstancedMesh | null = null;
  private next = 0;

  add(point: THREE.Vector3, normal: { x: number; y: number; z: number }, heading: number): void {
    const mesh = this.mesh;
    if (!mesh) return;
    tmpY.set(normal.x, normal.y, normal.z).normalize();
    tmpX.set(Math.cos(heading), 0, -Math.sin(heading));
    tmpX.addScaledVector(tmpY, -tmpX.dot(tmpY)).normalize();
    tmpZ.crossVectors(tmpX, tmpY);
    tmpM.makeBasis(tmpX, tmpY, tmpZ);
    tmpM.setPosition(point.x + tmpY.x * 0.025, point.y + tmpY.y * 0.025, point.z + tmpY.z * 0.025);
    mesh.setMatrixAt(this.next, tmpM);
    this.next = (this.next + 1) % COUNT;
    mesh.count = Math.max(mesh.count, Math.min(COUNT, this.next === 0 ? COUNT : this.next));
    mesh.instanceMatrix.needsUpdate = true;
  }

  clear(): void {
    this.next = 0;
    if (this.mesh) this.mesh.count = 0;
  }
}

export const skidMarks = new SkidBuffer();

export function SkidMarks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.5, 0.24).rotateX(-Math.PI / 2), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1a1a1c",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.count = 0;
    skidMarks.mesh = mesh;
    return () => {
      skidMarks.mesh = null;
      skidMarks.clear();
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  return <instancedMesh ref={ref} args={[geometry, material, COUNT]} frustumCulled={false} renderOrder={1} />;
}
