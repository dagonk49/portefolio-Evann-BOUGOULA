"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { player } from "../player/playerState";

const SHADOW_EXTENT = 17;
const SUN_OFFSET = new THREE.Vector3(10, 22, 7);

/**
 * Ciel graphite, lumière d'ambiance et « soleil » d'atelier. La lumière
 * directionnelle suit le joueur pour garder une carte d'ombres serrée,
 * recalée sur la grille de texels pour éviter le scintillement.
 */
export function Environment({ shadows }: { shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);

  const mapSize = 2048;
  const texel = (SHADOW_EXTENT * 2) / mapSize;
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const x = Math.round(player.position.x / texel) * texel;
    const z = Math.round(player.position.z / texel) * texel;
    l.target.position.set(x, 0, z);
    l.position.set(x + SUN_OFFSET.x, SUN_OFFSET.y, z + SUN_OFFSET.z);
  });

  return (
    <>
      <color attach="background" args={["#1a1d21"]} />
      <fog attach="fog" args={["#1a1d21", 48, 110]} />
      <hemisphereLight args={["#eef2f5", "#5d544a", 1.35]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={light}
        color="#fff3e2"
        intensity={2.3}
        castShadow={shadows}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
    </>
  );
}
