"use client";
/**
 * Moteur audio unique du site (Web Audio).
 *
 * - Bus : maître (muet/volume) → voix (intro), musique, moteur, interface.
 * - Intro : fichier fourni (public/audio/intro-racer.*), lu une fois par
 *   session à l'arrivée sur le circuit en mode stock-car, puis fondu
 *   enchaîné vers la boucle synthwave générée en code.
 * - Politique de lecture automatique : `unlock()` doit être appelé depuis un
 *   geste du visiteur (touche, clic). Si le navigateur refuse malgré tout,
 *   l'état passe à « blocked » et le HUD propose un bouton de lecture.
 * - Rien ne sonne tant que le son est coupé (réglage par défaut).
 */
import { create } from "zustand";
import { eventsAt, midiToHz, STEP_SECONDS, type NoteEvent } from "./synthwave";

export type AudioPhase = "idle" | "intro" | "music" | "blocked";

interface AudioStatus {
  phase: AudioPhase;
  introPlayed: boolean;
  musicOn: boolean;
  unlocked: boolean;
}

export const useAudioStatus = create<AudioStatus>()(() => ({
  phase: "idle",
  introPlayed: false,
  musicOn: false,
  unlocked: false,
}));

const setStatus = (patch: Partial<AudioStatus>) => useAudioStatus.setState(patch);

export const INTRO_SOURCES = {
  aac: "/audio/intro-racer.m4a",
  opus: "/audio/intro-racer.ogg",
} as const;

/** Durée du fondu enchaîné entre l'intro et la musique (secondes). */
const CROSSFADE = 1.8;

type Cue = "plug" | "unplug" | "stabilize" | "success" | "error" | "open" | "lap";

const CUES: Record<Cue, { f: number[]; d: number; type: OscillatorType; gain: number }> = {
  plug: { f: [520, 780], d: 0.07, type: "square", gain: 0.035 },
  unplug: { f: [420, 260], d: 0.07, type: "square", gain: 0.03 },
  open: { f: [660], d: 0.05, type: "sine", gain: 0.04 },
  stabilize: { f: [392, 523, 659, 784], d: 0.09, type: "triangle", gain: 0.05 },
  success: { f: [523, 659, 784], d: 0.1, type: "triangle", gain: 0.05 },
  error: { f: [220, 196], d: 0.12, type: "sawtooth", gain: 0.025 },
  lap: { f: [659, 880, 1175], d: 0.12, type: "triangle", gain: 0.05 },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voice: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private delay: DelayNode | null = null;
  private intro: HTMLAudioElement | null = null;
  private introNode: MediaElementAudioSourceNode | null = null;
  private timer: number | undefined;
  private nextStepTime = 0;
  private step = 0;
  private engine: { osc: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  /** Niveaux réglés par le visiteur : musique (BGM) et effets + voix (SFX). */
  private musicLevel: GainNode | null = null;
  private fxLevel: GainNode | null = null;
  private muted = true;
  private levels = { music: 0.7, sfx: 0.8 };

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 3;
      master.connect(compressor).connect(ctx.destination);
      const bus = (g: number, out: AudioNode = master) => {
        const node = ctx.createGain();
        node.gain.value = g;
        node.connect(out);
        return node;
      };
      // Deux niveaux réglables : musique d'un côté, effets / moteur / voix de l'intro de l'autre.
      this.musicLevel = bus(this.levels.music);
      this.fxLevel = bus(this.levels.sfx);
      this.voice = bus(1, this.fxLevel);
      this.music = bus(0, this.musicLevel);
      this.sfx = bus(0.9, this.fxLevel);
      this.engineBus = bus(0.8, this.fxLevel);
      // Écho discret pour l'arpège (croche pointée).
      const delay = ctx.createDelay(1);
      delay.delayTime.value = STEP_SECONDS * 3;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.28;
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(this.music);
      this.delay = delay;
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
      this.ctx = ctx;
      this.master = master;
      this.applyGain(true);
      return ctx;
    } catch {
      return null;
    }
  }

  /**
   * À appeler depuis un geste du visiteur. `primeIntro` (mode course actif) : Safari n'autorise la
   * lecture différée d'un élément audio que s'il a déjà été lancé pendant un geste ; on « amorce »
   * alors l'intro en silence (bus voix à zéro). Sans mode course, le fichier n'est pas téléchargé.
   */
  unlock(primeIntro = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    if (primeIntro && !this.intro) {
      const el = this.ensureIntro();
      if (el && this.voice) {
        this.voice.gain.setValueAtTime(0, ctx.currentTime);
        el.play().then(
          () => {
            if (useAudioStatus.getState().phase !== "intro") {
              el.pause();
              el.currentTime = 0;
            }
          },
          () => undefined,
        );
      }
    }
    setStatus({ unlocked: true });
  }

  /** Élément audio de l'intro, créé une fois et routé vers le bus voix. */
  private ensureIntro(): HTMLAudioElement | null {
    if (this.intro) return this.intro;
    const ctx = this.ensure();
    if (!ctx || !this.voice) return null;
    const el = new Audio();
    el.preload = "auto";
    const aac = el.canPlayType('audio/mp4; codecs="mp4a.40.2"');
    el.src = aac ? INTRO_SOURCES.aac : INTRO_SOURCES.opus;
    try {
      this.introNode = ctx.createMediaElementSource(el);
      this.introNode.connect(this.voice);
    } catch {
      /* lecture directe si le routage échoue */
    }
    this.intro = el;
    return el;
  }

  configure({ muted, music, sfx }: { muted: boolean; music: number; sfx: number }): void {
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    this.muted = muted;
    this.levels = { music: clamp(music), sfx: clamp(sfx) };
    this.applyGain(false);
    if (!muted && this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private applyGain(immediate: boolean): void {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    const set = (param: AudioParam, target: number) => {
      param.cancelScheduledValues(now);
      if (immediate) param.setValueAtTime(target, now);
      else param.setTargetAtTime(target, now, 0.05);
    };
    set(this.master.gain, this.muted ? 0 : 1);
    if (this.musicLevel) set(this.musicLevel.gain, this.levels.music);
    if (this.fxLevel) set(this.fxLevel.gain, this.levels.sfx);
  }

  /** Intro vocale puis musique en boucle (une intro par session). */
  async playIntroThenMusic(force = false): Promise<void> {
    const ctx = this.ensure();
    if (!ctx || !this.voice) return;
    if (useAudioStatus.getState().introPlayed && !force) {
      this.startMusic();
      return;
    }
    const el = this.ensureIntro();
    if (!el) return;
    this.detachIntro?.();
    el.pause();
    el.currentTime = 0;
    this.voice.gain.cancelScheduledValues(ctx.currentTime);
    this.voice.gain.setValueAtTime(1, ctx.currentTime);
    let crossed = false;
    const cross = () => {
      if (crossed || !this.voice || !this.ctx) return;
      crossed = true;
      this.voice.gain.setTargetAtTime(0, this.ctx.currentTime, CROSSFADE / 3);
      this.startMusic(2.5);
    };
    const onTime = () => {
      if (Number.isFinite(el.duration) && el.duration - el.currentTime < CROSSFADE) cross();
    };
    const onEnded = () => {
      cross();
      setStatus({ phase: "music" });
    };
    const onError = () => {
      // Fichier absent ou illisible : on passe directement à la musique.
      cross();
      setStatus({ phase: "music", introPlayed: true });
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    this.detachIntro = () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
      this.detachIntro = null;
    };
    setStatus({ phase: "intro", introPlayed: true });
    try {
      if (ctx.state === "suspended") await ctx.resume();
      await el.play();
    } catch (err) {
      this.detachIntro?.();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        // Lecture refusée par le navigateur : le HUD propose un bouton de lecture.
        setStatus({ phase: "blocked", introPlayed: false });
      } else {
        // Fichier absent, illisible ou lecture interrompue : musique générée directement.
        this.voice.gain.setValueAtTime(0, ctx.currentTime);
        this.startMusic(1.5);
        setStatus({ phase: "music", introPlayed: true });
      }
    }
  }

  private detachIntro: (() => void) | null = null;

  private stopIntro(): void {
    this.detachIntro?.();
    if (this.intro) {
      this.intro.pause();
      this.intro.currentTime = 0;
    }
    if (useAudioStatus.getState().phase === "intro") setStatus({ phase: "idle" });
  }

  skipIntro(): void {
    this.stopIntro();
    this.startMusic(1.2);
  }

  startMusic(fadeIn = 1.5): void {
    const ctx = this.ensure();
    if (!ctx || !this.music) return;
    if (this.timer === undefined) {
      this.step = 0;
      this.nextStepTime = ctx.currentTime + 0.08;
      this.timer = window.setInterval(() => this.schedule(), 25);
    }
    this.music.gain.cancelScheduledValues(ctx.currentTime);
    this.music.gain.setTargetAtTime(0.55, ctx.currentTime, fadeIn / 3);
    setStatus({ musicOn: true, phase: useAudioStatus.getState().phase === "intro" ? "intro" : "music" });
  }

  stopMusic(fadeOut = 0.8): void {
    const ctx = this.ctx;
    if (!ctx || !this.music) return;
    this.music.gain.cancelScheduledValues(ctx.currentTime);
    this.music.gain.setTargetAtTime(0, ctx.currentTime, fadeOut / 3);
    const timer = this.timer;
    this.timer = undefined;
    window.setTimeout(() => window.clearInterval(timer), fadeOut * 1000 + 200);
    setStatus({ musicOn: false, phase: "idle" });
  }

  /** Arrête tout (sortie du circuit ou du lab). */
  stopAll(): void {
    this.stopIntro();
    this.stopMusic(0.4);
    this.setEngine(false, 0, 0);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextStepTime < ctx.currentTime + 0.15) {
      for (const ev of eventsAt(this.step)) this.play(ev, this.nextStepTime);
      this.nextStepTime += STEP_SECONDS;
      this.step++;
    }
  }

  private play(ev: NoteEvent, t: number): void {
    const ctx = this.ctx!;
    const out = this.music!;
    const dur = ev.length * STEP_SECONDS;
    const env = (g: GainNode, peak: number, attack: number, release: number, length = dur) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.setTargetAtTime(0.0001, t + Math.max(attack, length - release), release / 3);
    };
    switch (ev.voice) {
      case "kick": {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(ev.velocity * 0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.32);
        break;
      }
      case "snare":
      case "hat": {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const f = ctx.createBiquadFilter();
        f.type = ev.voice === "snare" ? "bandpass" : "highpass";
        f.frequency.value = ev.voice === "snare" ? 1800 : 7000;
        const g = ctx.createGain();
        const len = ev.voice === "snare" ? 0.18 : 0.05;
        g.gain.setValueAtTime(ev.velocity * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + len);
        src.connect(f).connect(g).connect(out);
        src.start(t);
        src.stop(t + len + 0.02);
        break;
      }
      case "bass": {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = midiToHz(ev.notes[0]!);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(900, t);
        f.frequency.exponentialRampToValueAtTime(260, t + dur);
        const g = ctx.createGain();
        env(g, ev.velocity * 0.22, 0.01, 0.08);
        o.connect(f).connect(g).connect(out);
        o.start(t);
        o.stop(t + dur + 0.1);
        break;
      }
      case "pad": {
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 1400;
        const g = ctx.createGain();
        env(g, ev.velocity * 0.12, 0.6, 0.9);
        f.connect(g).connect(out);
        for (const n of ev.notes) {
          for (const detune of [-7, 7]) {
            const o = ctx.createOscillator();
            o.type = "sawtooth";
            o.frequency.value = midiToHz(n);
            o.detune.value = detune;
            o.connect(f);
            o.start(t);
            o.stop(t + dur + 1);
          }
        }
        break;
      }
      case "arp": {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = midiToHz(ev.notes[0]!);
        const g = ctx.createGain();
        g.gain.setValueAtTime(ev.velocity * 0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g);
        g.connect(out);
        if (this.delay) g.connect(this.delay);
        o.start(t);
        o.stop(t + 0.25);
        break;
      }
    }
  }

  /** Bruit de moteur synthétisé, piloté par la vitesse et l'accélérateur. */
  setEngine(active: boolean, speed01: number, throttle: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.engineBus) return;
    if (active && !this.engine) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const sub = ctx.createOscillator();
      sub.type = "square";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain).connect(this.engineBus);
      osc.start();
      sub.start();
      this.engine = { osc, sub, filter, gain };
    }
    const e = this.engine;
    if (!e) return;
    const now = ctx.currentTime;
    const f = 42 + speed01 * 150 + throttle * 14;
    e.osc.frequency.setTargetAtTime(f, now, 0.08);
    e.sub.frequency.setTargetAtTime(f / 2, now, 0.08);
    e.filter.frequency.setTargetAtTime(380 + speed01 * 1400 + throttle * 300, now, 0.1);
    e.gain.gain.setTargetAtTime(active ? 0.035 + throttle * 0.035 + speed01 * 0.02 : 0, now, 0.12);
    if (!active) {
      const engine = e;
      this.engine = null;
      window.setTimeout(() => {
        engine.osc.stop();
        engine.sub.stop();
        engine.gain.disconnect();
      }, 600);
    }
  }

  /** Petits sons d'interface (brassage, stabilisation, tour…). */
  cue(name: Cue): void {
    if (this.muted || this.levels.sfx === 0) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfx) return;
    const spec = CUES[name];
    let t = ctx.currentTime;
    for (const f of spec.f) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = spec.type;
      osc.frequency.value = f;
      g.gain.setValueAtTime(spec.gain * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + spec.d);
      osc.connect(g).connect(this.sfx);
      osc.start(t);
      osc.stop(t + spec.d + 0.02);
      t += spec.d * 0.8;
    }
  }
}

export const audioEngine = new AudioEngine();
