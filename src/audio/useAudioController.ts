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
    volume: audio.volume,
    toggleMute: () => {
      audioEngine.unlock();
      setAudio({ muted: !audio.muted });
    },
    setVolume: (v: number) => {
      audioEngine.unlock();
      setAudio({ volume: v, muted: v === 0 ? true : false });
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
