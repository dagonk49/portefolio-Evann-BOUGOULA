"use client";
/**
 * Racine des mondes 3D (lab intérieur et circuit extérieur), chargée à la
 * demande (import dynamique).
 *
 * Un seul monde est monté à la fois. Passer le sas démonte entièrement le
 * Canvas du monde courant (boucles arrêtées, monde physique détruit, contexte
 * WebGL libéré), détruit les ressources partagées, puis monte un Canvas neuf
 * pour l'autre monde. L'écran de transition affiche ces étapes réelles.
 */
import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { WorldId } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi, type Travel, type TravelStep } from "@/state/labUi";
import { hasCoarsePointer, prefersReducedMotion } from "@/lib/device";
import { audioEngine, useAudioStatus } from "@/audio/AudioEngine";
import { attachKeyboard, resetInput } from "./input";
import { disposeSharedResources } from "./materials";
import { clearTextureCache } from "./textures";
import { World } from "./scene/World";
import { OutdoorScene } from "./circuit/OutdoorScene";
import { CameraRig, cameraControl } from "./camera/CameraRig";
import { Hud, Panels } from "./ui/Hud";
import { TouchControls } from "./ui/TouchControls";
import { cancelPendingActions, interactWith, resetVehicle, toggleVehicle } from "./ui/actions";
import { player } from "./player/playerState";
import { LAB_DOOR_ARRIVAL, SPAWN } from "./layout";
import { resetVehicleState, vehicles } from "./circuit/vehicleState";
import { CIRCUIT_ARRIVAL, STOCKCAR_GRID, trackPoint } from "./circuit/layout";
import { LoadingTransition } from "./LoadingTransition";
import { PostFX } from "./PostFX";
import { trackInputModality } from "./ui/inputModality";
import { skidMarks } from "./circuit/SkidMarks";

/** Remet les compteurs du renderer à zéro au début de chaque image (mesures via __lab.stats). */
function InfoReset() {
  useFrame(({ gl }) => gl.info.reset(), -100);
  return null;
}

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
      state: () => {
        active: string | null;
        panel: string | null;
        zone: string;
        world: WorldId;
        travel: string | null;
        driving: string | null;
        /** Véhicules présents dans la scène (le stock-car n'existe qu'en mode course). */
        vehicles: string[];
        announcement: string;
        audio: { phase: string; muted: boolean; musicOn: boolean; introPlayed: boolean };
      };
      vehicle: () => { kind: string; x: number; y: number; z: number; yaw: number; speed: number; skids: number } | null;
      travel: (to: WorldId) => void;
    };
  }
}

const WORLD_LABEL: Record<WorldId, string> = { lab: "salle serveur", circuit: "circuit extérieur" };

function stepsFor(from: WorldId | null, to: WorldId): TravelStep[] {
  const list: TravelStep[] = [];
  if (from) {
    list.push({ id: "approach", label: "Ouverture du sas…", status: "active" });
    list.push({
      id: "unload",
      label: from === "lab" ? "Déchargement des modules salle serveur..." : "Déchargement du circuit extérieur...",
      status: "pending",
    });
  }
  list.push({
    id: "alloc",
    label: to === "circuit" ? "Allocation mémoire du circuit..." : "Allocation mémoire de la salle serveur...",
    status: from ? "pending" : "active",
  });
  list.push({ id: "physics", label: "Initialisation du moteur physique...", status: "pending" });
  list.push({ id: "granted", label: "Root access granted.", status: "pending" });
  return list;
}

/**
 * Prépare l'état partagé avant de monter un monde : position du joueur et,
 * sur le circuit, départ en stock-car si le mode course est débloqué.
 */
function prepareWorld(world: WorldId) {
  resetVehicleState();
  const ui = useLabUi.getState();
  if (world === "lab") {
    ui.setDriving(null);
    const start = useApp.getState().progress.player ?? SPAWN;
    player.position.set(start[0], start[1], start[2]);
  } else if (useApp.getState().isNascarUnlocked) {
    ui.setDriving("stockcar");
    const p = trackPoint(STOCKCAR_GRID.s, STOCKCAR_GRID.d);
    player.position.set(p[0], 0, p[2]);
  } else {
    ui.setDriving(null);
    player.position.set(CIRCUIT_ARRIVAL[0], CIRCUIT_ARRIVAL[1], CIRCUIT_ARRIVAL[2]);
  }
  player.velocity.set(0, 0, 0);
}

/** Avance l'écran de transition : `id` terminé, l'étape suivante devient active. */
function completeStep(id: string, detail?: string) {
  const t = useLabUi.getState().travel;
  if (!t) return;
  const steps = t.steps.map((s) => ({ ...s }));
  const i = steps.findIndex((s) => s.id === id);
  if (i < 0) return;
  steps[i]!.status = "done";
  if (detail) steps[i]!.detail = detail;
  if (steps[i + 1] && steps[i + 1]!.status === "pending") steps[i + 1]!.status = "active";
  const done = steps.filter((s) => s.status === "done").length;
  const travel: Travel = { ...t, steps, progress: done / steps.length, done: steps[steps.length - 1]!.status === "done" };
  useLabUi.getState().setTravel(travel);
}

export default function LabExperience() {
  const quality = useApp((s) => s.settings.quality);
  const effects = useApp((s) => s.settings.effects);
  const autoQuality = useApp((s) => s.settings.autoQuality);
  const updateSettings = useApp((s) => s.updateSettings);
  const panel = useLabUi((s) => s.panel);
  const travel = useLabUi((s) => s.travel);
  const announcement = useLabUi((s) => s.announcement);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  /** Monde monté dans le Canvas (null pendant le changement de monde). */
  const [mounted, setMounted] = useState<WorldId | null>(() => useApp.getState().world);
  const [ready, setReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [downgraded, setDowngraded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const waiters = useRef<{ canvas: (() => void)[]; physics: (() => void)[] }>({ canvas: [], physics: [] });
  const coarse = useMemo(() => hasCoarsePointer(), []);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []) || effects === false;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const high = quality === "high";

  // Écran de démarrage : mêmes étapes que la transition, sans le sas.
  useState(() => {
    const world = useApp.getState().world;
    prepareWorld(world);
    useLabUi.getState().setTravel({ from: null, to: world, steps: stepsFor(null, world), progress: 0, done: false });
    return null;
  });

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

  // Signaux « Canvas créé » et « moteur physique prêt », mémorisés jusqu'au prochain changement de monde.
  const signals = useRef({ canvas: false, physics: false });
  // Délai maximal d'attente d'un signal : une étape qui n'aboutit jamais ne verrouille pas l'interface.
  const SIGNAL_TIMEOUT = 20_000;
  const waitFor = (kind: "canvas" | "physics") =>
    new Promise<void>((resolve) => {
      if (signals.current[kind]) return resolve();
      waiters.current[kind].push(resolve);
      window.setTimeout(resolve, SIGNAL_TIMEOUT);
    });
  const release = (kind: "canvas" | "physics") => {
    signals.current[kind] = true;
    const list = waiters.current[kind];
    waiters.current[kind] = [];
    list.forEach((r) => r());
  };

  // Démarrage : le monde monté signale ses étapes à l'écran de chargement.
  useEffect(() => {
    let disposed = false;
    const boot = async () => {
      await waitFor("canvas");
      if (disposed) return;
      completeStep("alloc", WORLD_LABEL[useApp.getState().world]);
      await waitFor("physics");
      if (disposed) return;
      completeStep("physics");
      completeStep("granted");
      await new Promise((r) => window.setTimeout(r, reducedRef.current ? 150 : 900));
      if (!disposed && useLabUi.getState().travel?.from === null) useLabUi.getState().setTravel(null);
    };
    void boot();
    return () => {
      disposed = true;
    };
  }, []);

  // Passage du sas : séquence réelle de changement de monde.
  useEffect(() => {
    let disposed = false;
    const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, reducedRef.current ? Math.min(ms, 60) : ms));
    let running = false;
    const run = async (to: WorldId) => {
      if (running) return;
      running = true;
      try {
        await sequence(to);
      } finally {
        running = false;
        // Quoi qu'il arrive (erreur, étape interrompue), aucune transition ne reste active : jeu et interfaces se débloquent.
        if (!disposed && (useLabUi.getState().travel?.from ?? null) !== null) {
          useLabUi.setState({ travel: null, travelRequest: null, focus: null, active: null });
        }
        if (!disposed) useLabUi.setState({ travelRequest: null });
      }
    };
    const sequence = async (to: WorldId) => {
      const app = useApp.getState();
      const from = app.world;
      if (from === to) {
        useLabUi.setState({ travelRequest: null, focus: null });
        return;
      }
      useLabUi.getState().setTravel({ from, to, steps: stepsFor(from, to), progress: 0, done: false });
      resetInput();
      // 1. Approche : la caméra cadre le sas, les portes s'ouvrent.
      await wait(1150);
      if (disposed) return;
      completeStep("approach");
      // 2. Démontage complet du monde courant.
      const mem = glRef.current?.info.memory;
      const freed = mem ? `${mem.geometries} géométries et ${mem.textures} textures libérées` : undefined;
      if (from === "circuit") audioEngine.stopAll();
      setReady(false);
      setMounted(null);
      glRef.current = null;
      signals.current = { canvas: false, physics: false };
      // R3F libère le rendu (contexte WebGL) environ 500 ms après le démontage.
      await wait(700);
      if (disposed) return;
      disposeSharedResources();
      clearTextureCache();
      completeStep("unload", freed);
      // 3. Montage du nouveau monde.
      if (to === "lab") useApp.getState().savePlayer(LAB_DOOR_ARRIVAL);
      useApp.getState().setWorld(to);
      useLabUi.setState({ focus: null, active: null, exitAt: null });
      prepareWorld(to);
      setMounted(to);
      // Chaque ligne du journal reste lisible un court instant (les étapes elles-mêmes sont réelles).
      await Promise.all([waitFor("canvas"), wait(450)]);
      if (disposed) return;
      completeStep("alloc", WORLD_LABEL[to]);
      await Promise.all([waitFor("physics"), wait(450)]);
      if (disposed) return;
      completeStep("physics");
      await wait(250);
      if (disposed) return;
      completeStep("granted");
      useLabUi.getState().announce(to === "circuit" ? "Circuit extérieur chargé." : "Retour dans le lab.");
      await wait(1000);
      if (disposed) return;
      useLabUi.setState({ travel: null, travelRequest: null });
      rootRef.current?.focus({ preventScroll: true });
    };
    const unsub = useLabUi.subscribe((s, prev) => {
      if (s.travelRequest && s.travelRequest !== prev.travelRequest) void run(s.travelRequest);
    });
    return () => {
      disposed = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const detach = attachKeyboard({
      canPlay: () => {
        const s = useLabUi.getState();
        return !s.panel && !s.stabilizing && (!s.travel || s.travel.done);
      },
      onInteract: () => {
        const active = useLabUi.getState().active;
        if (active) interactWith(active);
      },
      onPause: () => useLabUi.getState().openPanel({ kind: "pause" }),
      onIndex: () => useLabUi.getState().openPanel({ kind: "index" }),
      onHelp: () => useLabUi.getState().openPanel({ kind: "help" }),
      onRecenter: () => cameraControl.recenter(),
      onVehicle: () => toggleVehicle(),
      onReset: () => resetVehicle(),
      onOptions: () => useLabUi.getState().openPanel({ kind: "settings" }),
      onResume: () => rootRef.current?.focus({ preventScroll: true }),
    });
    const stopModality = trackInputModality();
    // Fermeture d'une fenêtre : entrées remises à zéro (aucune touche « collée ») et contrôleur aussitôt actif.
    const unsubPanel = useLabUi.subscribe((s, prev) => {
      if (prev.panel && !s.panel) resetInput();
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
        const a = useApp.getState();
        const audio = useAudioStatus.getState();
        return {
          active: s.active,
          panel: s.panel?.kind ?? null,
          zone: s.zone,
          world: a.world,
          travel: s.travel ? (s.travel.done ? "done" : s.travel.steps.find((x) => x.status === "active")?.id ?? "running") : null,
          driving: s.driving,
          vehicles: (Object.keys(vehicles) as (keyof typeof vehicles)[]).filter((k) => vehicles[k].present),
          announcement: s.announcement,
          audio: { phase: audio.phase, muted: a.audio.muted, musicOn: audio.musicOn, introPlayed: audio.introPlayed },
        };
      },
      vehicle: () => {
        const kind = useLabUi.getState().driving;
        if (!kind) return null;
        const v = vehicles[kind];
        return { kind, x: v.position.x, y: v.position.y, z: v.position.z, yaw: v.yaw, speed: v.speed, skids: skidMarks.mesh?.count ?? 0 };
      },
      travel: (to) => useLabUi.getState().requestTravel(to),
    };
    return () => {
      detach();
      stopModality();
      unsubPanel();
      cancelPendingActions();
      resetInput();
      audioEngine.stopAll();
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

  const showUi = ready && !contextLost && mounted !== null && !(travel && travel.from !== null);

  return (
    <div
      className="lab-root"
      ref={rootRef}
      tabIndex={-1}
      aria-label={mounted === "circuit" ? "Circuit extérieur 3D d'Evann Bougoula" : "Lab 3D d'Evann Bougoula"}
      data-world={mounted ?? undefined}
      data-reduced={reducedMotion ? "true" : undefined}
    >
      <p className="sr-only">
        Monde 3D interactif. Tout son contenu est accessible sans le parcourir : bouton Index, ou bouton « Passer au mode sobre ».
      </p>
      {contextLost ? (
        <div className="lab-fatal" role="alert">
          <p>Le contexte graphique a été perdu (pilote ou mémoire vidéo).</p>
          <button type="button" className="lab-btn lab-btn--primary" onClick={() => useApp.getState().setMode("sober")}>
            Passer au mode sobre
          </button>
        </div>
      ) : fontsReady && mounted ? (
        <Canvas
          key={`${mounted}-${quality}`}
          className="lab-canvas"
          shadows={high ? "percentage" : false}
          dpr={high ? [1, 1.75] : 1}
          frameloop={hidden ? "never" : "always"}
          camera={{ fov: 32, near: 0.5, far: 180, position: [20, 18, 20] }}
          // Antialiasing : MSAA du post-traitement en qualité haute ; ACES Filmic sans post-traitement.
          gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: false, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={({ gl }) => {
            glRef.current = gl;
            // Compteurs de rendu cumulés sur toute l'image (passes de post-traitement comprises), remis à zéro par InfoReset.
            gl.info.autoReset = false;
            release("canvas");
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              // Le démontage volontaire (changement de monde, de qualité, sortie) libère aussi le contexte :
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
              <PhysicsReady
                onReady={() => {
                  setReady(true);
                  release("physics");
                }}
              />
              <Suspense fallback={null}>
                {mounted === "lab" ? (
                  <World reducedMotion={reducedMotion} quality={quality} paused={paused} />
                ) : (
                  <OutdoorScene reducedMotion={reducedMotion} quality={quality} paused={paused} />
                )}
              </Suspense>
            </Physics>
          </Suspense>
          <CameraRig reducedMotion={reducedMotion} world={mounted} />
          <InfoReset />
          {high ? <PostFX reducedMotion={reducedMotion} /> : null}
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
      {travel && !contextLost ? <LoadingTransition travel={travel} /> : null}
      {showUi ? <Hud world={mounted} /> : null}
      {showUi && coarse ? <TouchControls world={mounted} /> : null}
      {mounted ? <Panels /> : null}
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
