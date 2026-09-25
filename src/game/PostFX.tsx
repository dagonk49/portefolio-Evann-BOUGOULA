"use client";
/**
 * Post-traitement léger, en qualité haute uniquement :
 * - bloom au seuil élevé : avant tone mapping, un mur blanc en plein soleil
 *   atteint une luminance d'environ 2,5 ; le seuil (2,8) est au-dessus. Seuls
 *   les néons, poussés en HDR (LED d'activité, dalles d'interaction, flux des
 *   câbles, cœurs d'anomalie, phares), et le disque du soleil le dépassent ;
 * - tone mapping ACES Filmic en fin de chaîne (l'EffectComposer désactive
 *   celui du renderer) : pas de blancs brûlés, rendu chaud et contrasté.
 */
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useLayoutEffect } from "react";
import { setGlowBoost } from "./materials";

/** Intensité des néons en qualité haute (cyan et ambre franchissent alors le seuil de bloom). */
export const GLOW_BOOST = 6.5;
const BLOOM_THRESHOLD = 2.8;

export function PostFX({ reducedMotion }: { reducedMotion: boolean }) {
  // Les néons ne dépassent le seuil qu'avec le post-traitement : on rétablit l'intensité normale sans lui.
  useLayoutEffect(() => {
    setGlowBoost(GLOW_BOOST);
    return () => setGlowBoost(1);
  }, []);
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={BLOOM_THRESHOLD} luminanceSmoothing={0.35} intensity={reducedMotion ? 0.5 : 0.7} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
