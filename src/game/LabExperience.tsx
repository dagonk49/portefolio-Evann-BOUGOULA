"use client";
/**
 * Racine du lab 3D, chargée à la demande (import dynamique).
 * En sortant du lab, le Canvas est démonté : boucles arrêtées, contexte
 * WebGL libéré, ressources partagées détruites. La progression reste dans
 * le store applicatif.
 */
import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { hasCoarsePointer, prefersReducedMotion } from "@/lib/device";
import { attachKeyboard, resetInput } from "./input";
import { disposeSharedResources } from "./materials";
import { clearTextureCache } from "./textures";
import { World } from "./scene/World";
import { CameraRig, cameraControl } from "./camera/CameraRig";
import { Hud, Panels } from "./ui/Hud";
import { TouchControls } from "./ui/TouchControls";
import { cancelPendingActions, interactWith } from "./ui/actions";
import { player } from "./player/playerState";
import { SPAWN } from "./layout";

function PhysicsReady({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}

declare global {
  interface Window {
    __lab?: {
      player: () => [number, number, number];
      teleport: (x: number, z: number) => void;
      interact: (id: string) => void;
      stats: () => { calls: number; triangles: number; geometries: number; textures: number } | null;
      state: () => { active: string | null; panel: string | null; zone: string };
    };
  }
}

export default function LabExperience() {
  const quality = useApp((s) => s.settings.quality);
  const effects = useApp((s) => s.settings.effects);
  const autoQuality = useApp((s) => s.settings.autoQuality);
  const updateSettings = useApp((s) => s.updateSettings);
  const panel = useLabUi((s) => s.panel);
  const announcement = useLabUi((s) => s.announcement);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [downgraded, setDowngraded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const coarse = useMemo(() => hasCoarsePointer(), []);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []) || effects === false;
  const high = quality === "high";

  // Polices chargées avant de dessiner les textures (écrans, affiches).
  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontsReady(true);
    const timer = window.setTimeout(done, 1500);
    Promise.all([document.fonts.load("500 16px 'IBM Plex Mono'"), document.fonts.load("600 16px 'IBM Plex Sans'")]).then(done, done);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  // Onglet masqué : rendu et physique en pause.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const detach = attachKeyboard({
      canPlay: () => {
        const s = useLabUi.getState();
        return !s.panel && !s.stabilizing;
      },
      onInteract: () => {
        const active = useLabUi.getState().active;
        if (active) interactWith(active);
      },
      onPause: () => useLabUi.getState().openPanel({ kind: "pause" }),
      onIndex: () => useLabUi.getState().openPanel({ kind: "index" }),
      onHelp: () => useLabUi.getState().openPanel({ kind: "help" }),
      onRecenter: () => cameraControl.recenter(),
    });
    window.__lab = {
      player: () => [player.position.x, player.position.y, player.position.z],
      teleport: (x, z) => {
        player.teleport = new THREE.Vector3(x, 1.4, z);
      },
      interact: (id) => interactWith(id),
      stats: () => {
        const gl = glRef.current;
        if (!gl) return null;
        return { calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures };
      },
      state: () => {
        const s = useLabUi.getState();
        return { active: s.active, panel: s.panel?.kind ?? null, zone: s.zone };
      },
    };
    return () => {
      detach();
      cancelPendingActions();
      resetInput();
      useLabUi.getState().reset();
      document.body.style.cursor = "";
      delete window.__lab;
    };
  }, []);

  // Libération des ressources GPU partagées au démontage.
  useEffect(
    () => () => {
      disposeSharedResources();
      clearTextureCache();
    },
    [],
  );

  const paused = hidden || panel?.kind === "pause";
  // Position initiale (une seule fois par montage) : reprise là où on s'était arrêté.
  useState(() => {
    const start = useApp.getState().progress.player ?? SPAWN;
    player.position.set(start[0], start[1], start[2]);
    return null;
  });

  return (
    <div className="lab-root" ref={rootRef} tabIndex={-1} aria-label="Lab 3D d'Evann Bougoula">
      <p className="sr-only">
        Lab 3D interactif. Tout son contenu est accessible sans le parcourir : bouton Index, ou bouton « Passer au mode sobre ».
      </p>
      {contextLost ? (
        <div className="lab-fatal" role="alert">
          <p>Le contexte graphique a été perdu (pilote ou mémoire vidéo).</p>
          <button type="button" className="lab-btn lab-btn--primary" onClick={() => useApp.getState().setMode("sober")}>
            Passer au mode sobre
          </button>
        </div>
      ) : fontsReady ? (
        <Canvas
          key={quality}
          className="lab-canvas"
          shadows={high ? "percentage" : false}
          dpr={high ? [1, 1.75] : 1}
          frameloop={hidden ? "never" : "always"}
          camera={{ fov: 32, near: 0.5, far: 180, position: [20, 18, 20] }}
          gl={{ antialias: high, powerPreference: "high-performance", preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            glRef.current = gl;
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              // Le démontage volontaire (sortie du lab, changement de qualité) libère aussi le contexte :
              // on n'affiche l'erreur que si le canvas est toujours dans la page.
              if (!(e.target as HTMLCanvasElement).isConnected) return;
              e.preventDefault();
              setContextLost(true);
            });
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -18, 0]} paused={paused} timeStep={1 / 60}>
              <PhysicsReady onReady={() => setReady(true)} />
              <Suspense fallback={null}>
                <World reducedMotion={reducedMotion} quality={quality} paused={paused} />
              </Suspense>
            </Physics>
          </Suspense>
          <CameraRig reducedMotion={reducedMotion} />
          {high && autoQuality ? (
            <PerformanceMonitor
              flipflops={2}
              onDecline={() => {
                if (!downgraded) {
                  setDowngraded(true);
                  updateSettings({ quality: "low" });
                }
              }}
            />
          ) : null}
        </Canvas>
      ) : null}
      {!ready && !contextLost ? (
        <div className="lab-boot" role="status">
          <p className="lab-mono">Initialisation du lab…</p>
          <p>Moteur physique et décor en cours de préparation.</p>
        </div>
      ) : null}
      {ready ? <Hud /> : null}
      {ready && coarse ? <TouchControls /> : null}
      <Panels />
      {downgraded ? (
        <p className="hud-toast hud-toast--info" role="status">
          Qualité réduite automatiquement pour garder une animation fluide (modifiable dans le menu).
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
