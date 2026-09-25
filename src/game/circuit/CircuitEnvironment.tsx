"use client";
import { Environment as EnvMap, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { player } from "../player/playerState";

/** Direction du soleil couchant (vers le haut de l'écran, bas sur l'horizon). */
export const SUN_DIR = new THREE.Vector3(-0.58, 0.36, -0.73).normalize();
export const HORIZON = "#f4b98c";
const SHADOW_EXTENT = 26;

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // toujours au fond
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSun;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, -0.2, 1.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
    col = mix(col, uTop, smoothstep(0.22, 0.75, h));
    float d = max(dot(normalize(vDir), uSunDir), 0.0);
    col += uSun * (pow(d, 900.0) * 1.6 + pow(d, 12.0) * 0.35);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Heure dorée : dôme de ciel en dégradé (du pêche au violet), soleil bas,
 * brume chaude et ombres longues. La lumière suit le joueur pour garder
 * une carte d'ombres serrée.
 */
export function CircuitEnvironment({ shadows }: { shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const sky = useRef<THREE.Mesh>(null);
  const { scene, camera } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color("#4b4f93") },
          uMid: { value: new THREE.Color("#e58aa2") },
          uHorizon: { value: new THREE.Color(HORIZON) },
          uSunDir: { value: SUN_DIR.clone() },
          uSun: { value: new THREE.Color("#fff1c9") },
        },
      }),
    [],
  );
  const geometry = useMemo(() => new THREE.SphereGeometry(150, 32, 16), []);
  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

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
    sky.current?.position.copy(camera.position);
    const l = light.current;
    if (!l) return;
    const x = Math.round(player.position.x / texel) * texel;
    const z = Math.round(player.position.z / texel) * texel;
    l.target.position.set(x, 0, z);
    l.position.set(x + SUN_DIR.x * 60, SUN_DIR.y * 60, z + SUN_DIR.z * 60);
  });

  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 70, 175]} />
      <mesh ref={sky} geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />
      {/* Reflets d'heure dorée (carrosserie, jantes, rails) : ciel chaud et soleil bas, calculés une fois. */}
      <EnvMap frames={1} resolution={128} environmentIntensity={0.25}>
        <Lightformer form="rect" intensity={1.6} color="#e58aa2" position={[0, 8, 0]} scale={[20, 20, 1]} />
        <Lightformer form="circle" intensity={4} color="#ffd9a0" position={[SUN_DIR.x * 10, SUN_DIR.y * 10, SUN_DIR.z * 10]} scale={2.4} />
        <Lightformer form="rect" intensity={1.2} color="#f4b98c" position={[0, 1, -10]} scale={[30, 2, 1]} />
      </EnvMap>
      <hemisphereLight args={["#ffd2a6", "#5c6d3c", 1.08]} />
      <ambientLight color="#ffb88a" intensity={0.18} />
      <directionalLight
        ref={light}
        color="#ffc27d"
        intensity={2.7}
        castShadow={shadows}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-radius={4}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={130}
      />
    </>
  );
}
