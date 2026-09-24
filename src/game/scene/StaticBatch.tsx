"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { unitBox } from "../materials";

/**
 * Fusionne, par matériau, les boîtes statiques du décor (géométrie partagée
 * `unitBox`, matériaux standard) pour réduire le nombre d'appels de dessin.
 *
 * Exclus : tout ce qui se trouve sous un objet `userData.noBatch` (ports
 * cliquables, objets physiques, éléments animés), les matériaux lumineux,
 * les textes et les maillages instanciés. Les originaux sont masqués, pas
 * supprimés : React garde la main sur eux.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    group.updateMatrixWorld(true);
    const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const box = unitBox();
    const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();

    const visit = (o: THREE.Object3D) => {
      if (o.userData.noBatch) return;
      const mesh = o as THREE.Mesh;
      if (
        mesh.isMesh &&
        !(o as THREE.InstancedMesh).isInstancedMesh &&
        mesh.geometry === box &&
        !Array.isArray(mesh.material) &&
        (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial &&
        mesh.visible
      ) {
        const g = box.clone();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
        const bucket = buckets.get(mesh.material as THREE.Material) ?? { geos: [], meshes: [] };
        bucket.geos.push(g);
        bucket.meshes.push(mesh);
        buckets.set(mesh.material as THREE.Material, bucket);
      }
      for (const child of o.children) visit(child);
    };
    for (const child of group.children) visit(child);

    const merged: THREE.Mesh[] = [];
    const hidden: THREE.Mesh[] = [];
    for (const [material, { geos, meshes }] of buckets) {
      if (geos.length < 2) {
        geos.forEach((g) => g.dispose());
        continue;
      }
      const geometry = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!geometry) continue;
      const m = new THREE.Mesh(geometry, material);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.batched = true;
      group.add(m);
      merged.push(m);
      for (const original of meshes) {
        original.visible = false;
        hidden.push(original);
      }
    }
    return () => {
      for (const m of merged) {
        group.remove(m);
        m.geometry.dispose();
      }
      // Remise en état (double montage du mode strict, remontage) : les originaux redeviennent visibles.
      for (const original of hidden) original.visible = true;
    };
  }, []);

  return <group ref={root}>{children}</group>;
}
