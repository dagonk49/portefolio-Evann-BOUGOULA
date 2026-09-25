"use client";
import { useEffect } from "react";
import { useApp } from "@/state/app";
import { audioEngine, useAudioStatus } from "./AudioEngine";

/**
 * Relie les réglages persistés (muet, volume) au moteur audio et expose les
 * commandes du HUD. Toute lecture part d'un geste du visiteur (`unlock`).
 */
export function useAudioController() {
  const audio = useApp((s) => s.audio);
  const setAudio = useApp((s) => s.setAudio);
  const status = useAudioStatus();

  useEffect(() => {
    audioEngine.configure(audio);
  }, [audio]);

  return {
    ...status,
    muted: audio.muted,
    music: audio.music,
    sfx: audio.sfx,
    toggleMute: () => {
      audioEngine.unlock();
      setAudio({ muted: !audio.muted });
    },
    setMuted: (muted: boolean) => {
      audioEngine.unlock();
      setAudio({ muted });
    },
    /** Monter un curseur rétablit le son s'il était coupé. */
    setMusic: (v: number) => {
      audioEngine.unlock();
      setAudio(v > 0 && audio.muted ? { music: v, muted: false } : { music: v });
    },
    setSfx: (v: number) => {
      audioEngine.unlock();
      setAudio(v > 0 && audio.muted ? { sfx: v, muted: false } : { sfx: v });
      audioEngine.cue("open");
    },
    toggleMusic: () => {
      audioEngine.unlock();
      if (status.musicOn) audioEngine.stopMusic();
      else {
        if (audio.muted) setAudio({ muted: false });
        audioEngine.startMusic();
      }
    },
    replayIntro: () => {
      audioEngine.unlock(true);
      if (audio.muted) setAudio({ muted: false });
      void audioEngine.playIntroThenMusic(true);
    },
    resumeBlocked: () => {
      audioEngine.unlock(true);
      void audioEngine.playIntroThenMusic(true);
    },
    skipIntro: () => audioEngine.skipIntro(),
  };
}
