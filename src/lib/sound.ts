/**
 * Effets sonores synthétisés (Web Audio), désactivés par défaut.
 * Aucun fichier audio, aucune lecture automatique : un son n'est joué
 * qu'après une action du visiteur et seulement si le son est activé.
 */

type Cue = "plug" | "unplug" | "stabilize" | "success" | "error" | "open";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const CUES: Record<Cue, { f: number[]; d: number; type: OscillatorType; gain: number }> = {
  plug: { f: [520, 780], d: 0.07, type: "square", gain: 0.035 },
  unplug: { f: [420, 260], d: 0.07, type: "square", gain: 0.03 },
  open: { f: [660], d: 0.05, type: "sine", gain: 0.04 },
  stabilize: { f: [392, 523, 659, 784], d: 0.09, type: "triangle", gain: 0.05 },
  success: { f: [523, 659, 784], d: 0.1, type: "triangle", gain: 0.05 },
  error: { f: [220, 196], d: 0.12, type: "sawtooth", gain: 0.025 },
};

export function playCue(cue: Cue, enabled: boolean): void {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const spec = CUES[cue];
  let t = ac.currentTime;
  for (const f of spec.f) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = spec.type;
    osc.frequency.value = f;
    g.gain.setValueAtTime(spec.gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + spec.d);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + spec.d + 0.02);
    t += spec.d * 0.8;
  }
}
