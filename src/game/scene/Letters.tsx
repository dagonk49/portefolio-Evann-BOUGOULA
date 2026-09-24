"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { geo, mat } from "../materials";
import { FACE_CAMERA, fromScreen } from "../layout";

/**
 * Police « en blocs » dessinée à la main : chaque lettre est un ensemble de
 * traits rectangulaires (x, y = centre ; w, h ; angle en radians). Les mêmes
 * traits servent au rendu (géométrie fusionnée) et aux colliders physiques.
 */
type Stroke = [x: number, y: number, w: number, h: number, angle?: number];
interface Glyph {
  width: number;
  strokes: Stroke[];
}

const T = 0.46; // épaisseur de trait
const H = 2.1; // hauteur
const DEPTH = 0.55;

function diag(x1: number, y1: number, x2: number, y2: number, w = T): Stroke {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return [(x1 + x2) / 2, (y1 + y2) / 2, w, len, Math.atan2(x1 - x2, y2 - y1)];
}

const GLYPHS: Record<string, Glyph> = {
  E: { width: 1.5, strokes: [[T / 2, H / 2, T, H], [0.75, H - T / 2, 1.5, T], [0.68, H / 2, 1.36, T * 0.92], [0.75, T / 2, 1.5, T]] },
  L: { width: 1.45, strokes: [[T / 2, H / 2, T, H], [0.725, T / 2, 1.45, T]] },
  V: { width: 1.8, strokes: [diag(0.26, H - 0.05, 0.86, 0.12), diag(1.54, H - 0.05, 0.94, 0.12), [0.9, 0.2, 0.62, 0.4]] },
  A: { width: 1.8, strokes: [diag(0.2, 0.05, 0.84, H - 0.2), diag(1.6, 0.05, 0.96, H - 0.2), [0.9, H - 0.24, 0.64, 0.48], [0.9, 0.78, 0.9, T * 0.85]] },
  N: { width: 1.7, strokes: [[T / 2, H / 2, T, H], [1.7 - T / 2, H / 2, T, H], diag(0.32, H - 0.2, 1.38, 0.2, T * 0.95)] },
  B: {
    width: 1.62,
    strokes: [[T / 2, H / 2, T, H], [0.7, H - T / 2, 1.4, T], [0.76, H / 2, 1.52, T * 0.9], [0.8, T / 2, 1.6, T], [1.22, H * 0.74, T * 0.9, H * 0.42], [1.39, H * 0.26, T, H * 0.42]],
  },
  O: { width: 1.7, strokes: [[T / 2, H / 2, T, H], [1.7 - T / 2, H / 2, T, H], [0.85, H - T / 2, 1.7, T], [0.85, T / 2, 1.7, T]] },
  U: { width: 1.7, strokes: [[T / 2, H / 2 + 0.1, T, H - 0.2], [1.7 - T / 2, H / 2 + 0.1, T, H - 0.2], [0.85, T / 2, 1.7, T]] },
  G: {
    width: 1.72,
    strokes: [[T / 2, H / 2, T, H], [0.86, H - T / 2, 1.72, T], [0.86, T / 2, 1.72, T], [1.72 - T / 2, H * 0.3, T, H * 0.5], [1.22, H * 0.47, 1.0, T * 0.8]],
  },
};

const SPACING = 0.34;

function letterGeometry(char: string): THREE.BufferGeometry {
  return geo(`letter:${char}`, () => {
    const g = GLYPHS[char]!;
    const parts = g.strokes.map(([x, y, w, h, a = 0]) => {
      const box = new THREE.BoxGeometry(w, h, DEPTH);
      box.rotateZ(a);
      box.translate(x - g.width / 2, y, 0);
      return box;
    });
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    return merged;
  });
}

interface LetterPlacement {
  char: string;
  position: [number, number, number];
  color: string;
}

function layoutWord(word: string, center: [number, number], color: string): LetterPlacement[] {
  const widths = [...word].map((c) => GLYPHS[c]!.width);
  const total = widths.reduce((a, b) => a + b, 0) + SPACING * (word.length - 1);
  let cursor = -total / 2;
  return [...word].map((char, i) => {
    const w = widths[i]!;
    const sx = center[0] + cursor + w / 2;
    cursor += w + SPACING;
    const p = fromScreen(sx, center[1]);
    return { char, position: [p[0], 0.02, p[2]], color };
  });
}

/** Lettres physiques « EVANN BOUGOULA » à bousculer au point d'arrivée. */
export function Letters() {
  const letters = useMemo(
    () => [...layoutWord("EVANN", [0, 4.4], "#e39a35"), ...layoutWord("BOUGOULA", [0, 0.9], "#2b2f35")],
    [],
  );
  return (
    <group>
      {letters.map((l, i) => {
        const g = GLYPHS[l.char]!;
        return (
          <RigidBody
            key={i}
            colliders={false}
            position={l.position}
            rotation={[0, FACE_CAMERA, 0]}
            linearDamping={0.3}
            angularDamping={0.6}
            userData={{ kind: "letter" }}
          >
            {g.strokes.map(([x, y, w, h, a = 0], j) => (
              <CuboidCollider key={j} args={[w / 2, h / 2, DEPTH / 2]} position={[x - g.width / 2, y, 0]} rotation={[0, 0, a]} density={0.9} friction={0.7} restitution={0.05} />
            ))}
            <mesh geometry={letterGeometry(l.char)} material={mat(l.color, { roughness: 0.6 })} castShadow receiveShadow />
          </RigidBody>
        );
      })}
    </group>
  );
}
