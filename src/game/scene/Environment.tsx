"use client";
import { Environment as EnvMap, Lightformer } from "@react-three/drei";
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
      {/* Environnement lumineux calculé une seule fois, sans fichier : panneaux du plafond et néons de l'atelier.
          Il donne les reflets de l'aluminium des baies, sans éclairer davantage le décor. */}
      <EnvMap frames={1} resolution={128} environmentIntensity={0.22}>
        <Lightformer form="rect" intensity={2.2} color="#f4f1ea" position={[0, 6, 0]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#5fd0e0" position={[-6, 2, -3]} scale={[6, 0.6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#f2a948" position={[6, 2, 3]} scale={[6, 0.6, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#c9d3d8" position={[0, 3, 7]} scale={3} />
      </EnvMap>
      <hemisphereLight args={["#eef2f5", "#5d544a", 1.25]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        ref={light}
        color="#fff3e2"
        intensity={2.3}
        castShadow={shadows}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={3}
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
