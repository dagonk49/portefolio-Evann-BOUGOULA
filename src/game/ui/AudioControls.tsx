"use client";
import { useId } from "react";
import { useApp } from "@/state/app";
import { useAudioController } from "@/audio/useAudioController";

/**
 * Commandes audio toujours visibles dans la barre du haut : couper / rétablir,
 * volume, et sur le circuit la musique et l'intro du stock-car.
 */
export function AudioControls({ circuit }: { circuit: boolean }) {
  const audio = useAudioController();
  const nascar = useApp((s) => s.isNascarUnlocked);
  const volumeId = useId();
  const pct = Math.round(audio.volume * 100);
  return (
    <div className="hud-audio" role="group" aria-label="Son">
      {audio.phase === "blocked" ? (
        <button type="button" className="hud-btn hud-btn--accent" onClick={audio.resumeBlocked}>
          <span aria-hidden="true">▶</span> Activer le son
        </button>
      ) : null}
      <button
        type="button"
        className="hud-btn hud-audio__mute"
        aria-pressed={!audio.muted}
        onClick={audio.toggleMute}
        title={audio.muted ? "Rétablir le son" : "Couper le son"}
      >
        <span aria-hidden="true">{audio.muted ? "🔇" : "🔊"}</span>
        <span className="hud-audio__label">{audio.muted ? "Son coupé" : "Son actif"}</span>
      </button>
      <label className="hud-audio__volume" htmlFor={volumeId}>
        <span className="sr-only">Volume</span>
        <input
          id={volumeId}
          type="range"
          min={0}
          max={100}
          step={5}
          value={audio.muted ? 0 : pct}
          aria-valuetext={audio.muted ? "son coupé" : `${pct} %`}
          onChange={(e) => audio.setVolume(Number(e.target.value) / 100)}
        />
      </label>
      {circuit ? (
        <>
          <button type="button" className="hud-btn" aria-pressed={audio.musicOn} onClick={audio.toggleMusic}>
            Musique
          </button>
          {nascar ? (
            audio.phase === "intro" ? (
              <button type="button" className="hud-btn" onClick={audio.skipIntro}>
                Passer l&apos;intro
              </button>
            ) : (
              <button type="button" className="hud-btn" onClick={audio.replayIntro}>
                {audio.introPlayed ? "Rejouer l'intro" : "Lancer l'intro"}
              </button>
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
