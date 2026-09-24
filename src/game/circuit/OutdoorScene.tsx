"use client";
/**
 * Monde 2 : le circuit extérieur. Monté à la place du lab (Canvas neuf,
 * monde physique neuf) : les ressources du lab sont libérées avant.
 */
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { audioEngine, useAudioStatus } from "@/audio/AudioEngine";
import { PlayerController } from "../player/PlayerController";
import { Anomalies } from "../scene/Anomalies";
import { InteractionSystem } from "../scene/InteractionSystem";
import { ActivePrompt, Pads } from "../scene/Pads";
import { StaticBatch } from "../scene/StaticBatch";
import { CircuitEnvironment } from "./CircuitEnvironment";
import { CircuitProps } from "./CircuitProps";
import { CoveredStockCar, Paddock } from "./Paddock";
import { SkidMarks } from "./SkidMarks";
import { Spots } from "./Spots";
import { Track } from "./Track";
import { Vehicle } from "./VehicleController";
import {
  CIRCUIT_ARRIVAL,
  CIRCUIT_INTERACTABLES,
  CIRCUIT_RESPAWN_Y,
  formatLap,
  headingAt,
  KART_SPOT,
  lapStep,
  STOCKCAR_GRID,
  trackPoint,
} from "./layout";
import { drive, lapClock, resetVehicleState, vehicles } from "./vehicleState";

const STOCKCAR_SPAWN = trackPoint(STOCKCAR_GRID.s, STOCKCAR_GRID.d, 0.95);
const STOCKCAR_YAW = headingAt(STOCKCAR_GRID.s);
const KART_SPAWN: [number, number, number] = [KART_SPOT[0], 0.7, KART_SPOT[2]];

/** Son moteur synthétisé du véhicule conduit (coupé à pied). */
function EngineSound() {
  const driving = useLabUi((s) => s.driving);
  useEffect(() => {
    if (!driving) audioEngine.setEngine(false, 0, 0);
  }, [driving]);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (!driving || clock.elapsedTime - last.current < 0.05) return;
    last.current = clock.elapsedTime;
    audioEngine.setEngine(true, drive.speed01, Math.max(0, drive.throttle));
  });
  return null;
}

export function OutdoorScene({ reducedMotion, quality, paused }: { reducedMotion: boolean; quality: "high" | "low"; paused: boolean }) {
  const nascar = useApp((s) => s.isNascarUnlocked);
  const muted = useApp((s) => s.audio.muted);
  const driving = useLabUi((s) => s.driving);
  const exitAt = useLabUi((s) => s.exitAt);

  // L'arrivée (à pied ou en stock-car) est préparée par la racine avant le montage.
  useEffect(
    () => () => {
      audioEngine.stopAll();
      resetVehicleState();
      useLabUi.getState().setDriving(null);
    },
    [],
  );

  // Mode course réinitialisé depuis le menu : on descend du stock-car qui disparaît.
  useEffect(() => {
    const ui = useLabUi.getState();
    if (!nascar && ui.driving === "stockcar") {
      const p = vehicles.stockcar.position;
      ui.setDriving(null, [p.x - 2, 1, p.z - 2]);
    }
  }, [nascar]);

  // Intro du stock-car puis musique en boucle (son actif uniquement ; une intro par session).
  // À l'arrivée, la musique reprend si l'intro a déjà été entendue ; ensuite, rétablir le son ne
  // relance l'intro que si elle n'a jamais été jouée (on respecte un « Musique » coupé à la main).
  const arrived = useRef(false);
  useEffect(() => {
    if (!nascar || muted) return;
    if (!arrived.current || !useAudioStatus.getState().introPlayed) void audioEngine.playIntroThenMusic();
    arrived.current = true;
  }, [nascar, muted]);

  const onLap = useCallback((x: number, z: number) => {
    const r = lapStep(lapClock.state, x, z, performance.now());
    lapClock.state = r.state;
    if (r.lapMs === null) return;
    lapClock.last = r.lapMs;
    const best = useApp.getState().recordLap(Math.round(r.lapMs));
    audioEngine.cue("lap");
    useLabUi.getState().announce(`Tour bouclé en ${formatLap(r.lapMs)}${best ? " : meilleur tour !" : ""}`);
  }, []);

  return (
    <>
      <CircuitEnvironment shadows={quality === "high"} />
      <StaticBatch>
        <Track />
        <Paddock />
        <Spots reducedMotion={reducedMotion} />
      </StaticBatch>
      {nascar ? null : <CoveredStockCar />}
      <CircuitProps />
      <Vehicle kind="kart" spawn={KART_SPAWN} yaw={0} paused={paused} onLap={onLap} />
      {nascar ? <Vehicle kind="stockcar" spawn={STOCKCAR_SPAWN} yaw={STOCKCAR_YAW} paused={paused} onLap={onLap} /> : null}
      <SkidMarks />
      <Pads reducedMotion={reducedMotion} items={CIRCUIT_INTERACTABLES} />
      <Anomalies reducedMotion={reducedMotion} quality={quality} world="circuit" />
      <ActivePrompt />
      {driving ? null : (
        <PlayerController
          reducedMotion={reducedMotion}
          paused={paused}
          start={exitAt ?? CIRCUIT_ARRIVAL}
          spawn={CIRCUIT_ARRIVAL}
          respawnY={CIRCUIT_RESPAWN_Y}
          persist={false}
        />
      )}
      <InteractionSystem world="circuit" />
      <EngineSound />
    </>
  );
}
