"use client";
import { Text } from "@react-three/drei";
import { Suspense, type ComponentProps } from "react";
import * as THREE from "three";
import { FONT_MONO, FONT_SANS, glow, mat, unitBox, type PaletteKey } from "../materials";
import type { Vec3 } from "../layout";

type MatSpec = PaletteKey | `#${string}` | THREE.Material;

function resolve(m: MatSpec): THREE.Material {
  return typeof m === "string" ? mat(m) : m;
}

/** Boîte partagée (géométrie unique, mise à l'échelle). */
export function B({
  p = [0, 0, 0],
  s = [1, 1, 1],
  r,
  m = "graphite",
  shadow = true,
  receive = true,
  ...rest
}: { p?: Vec3; s?: Vec3; r?: Vec3; m?: MatSpec; shadow?: boolean; receive?: boolean } & Omit<ComponentProps<"mesh">, "position" | "scale" | "rotation">) {
  return (
    <mesh
      geometry={unitBox()}
      material={resolve(m)}
      position={p}
      scale={s}
      rotation={r}
      castShadow={shadow}
      receiveShadow={receive}
      {...rest}
    />
  );
}

/** Rectangle lumineux (LED, liseré). */
export function Glow({ p, s, color = "cyan", r }: { p: Vec3; s: Vec3; color?: PaletteKey | string; r?: Vec3 }) {
  return <mesh geometry={unitBox()} material={glow(color)} position={p} scale={s} rotation={r} />;
}

type TextProps = Omit<ComponentProps<typeof Text>, "font"> & { mono?: boolean };

/**
 * Texte 3D net (SDF) avec les polices locales du site. Chaque texte a sa
 * propre frontière Suspense : un souci de police ne bloque jamais le reste
 * de la scène (sol, colliders, joueur).
 */
export function Label({ mono = false, children, ...rest }: TextProps) {
  return (
    <Suspense fallback={null}>
      <Text font={mono ? FONT_MONO : FONT_SANS} anchorX="center" anchorY="middle" {...rest}>
        {children}
      </Text>
    </Suspense>
  );
}
