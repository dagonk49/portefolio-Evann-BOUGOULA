/**
 * Partition de la boucle « synthwave chill » du circuit, générée en code
 * (aucun fichier musical, aucune œuvre tierce). Fonctions pures : la même
 * partition sert au séquenceur Web Audio et aux tests.
 */

export const BPM = 96;
export const STEPS_PER_BAR = 16;
export const BARS = 4;
export const STEPS = STEPS_PER_BAR * BARS;
export const STEP_SECONDS = 60 / BPM / 4;

/** Numéro MIDI → fréquence (La 440). */
export function midiToHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

/** Progression i – VI – III – VII en la mineur : Am, F, C, G. */
export const CHORDS: { name: string; notes: [number, number, number] }[] = [
  { name: "Am", notes: [57, 60, 64] },
  { name: "F", notes: [53, 57, 60] },
  { name: "C", notes: [48, 52, 55] },
  { name: "G", notes: [55, 59, 62] },
];

export type Voice = "kick" | "snare" | "hat" | "bass" | "arp" | "pad";

export interface NoteEvent {
  voice: Voice;
  step: number;
  /** Notes MIDI (vide pour la batterie). */
  notes: number[];
  /** Durée en pas de double croche. */
  length: number;
  velocity: number;
}

/** Événements d'un pas de la boucle (0 … STEPS-1). */
export function eventsAt(step: number): NoteEvent[] {
  const s = ((step % STEPS) + STEPS) % STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const inBar = s % STEPS_PER_BAR;
  const chord = CHORDS[bar]!;
  const root = chord.notes[0] - 24;
  const out: NoteEvent[] = [];
  // Batterie : grosse caisse à chaque temps, caisse claire sur 2 et 4, charleston sur les contretemps.
  if (inBar % 4 === 0) out.push({ voice: "kick", step: s, notes: [], length: 1, velocity: 0.9 });
  if (inBar === 4 || inBar === 12) out.push({ voice: "snare", step: s, notes: [], length: 1, velocity: 0.55 });
  if (inBar % 4 === 2) out.push({ voice: "hat", step: s, notes: [], length: 1, velocity: 0.28 });
  if (inBar % 2 === 1) out.push({ voice: "hat", step: s, notes: [], length: 1, velocity: 0.12 });
  // Basse en croches, octave sur les contretemps.
  if (inBar % 2 === 0) {
    out.push({ voice: "bass", step: s, notes: [inBar % 4 === 2 ? root + 12 : root], length: 2, velocity: 0.7 });
  }
  // Nappe tenue sur la mesure.
  if (inBar === 0) out.push({ voice: "pad", step: s, notes: [...chord.notes], length: STEPS_PER_BAR, velocity: 0.4 });
  // Arpège doux en doubles croches (montée puis descente de l'accord).
  const order = [0, 1, 2, 1];
  const tone = chord.notes[order[inBar % 4]!]! + 12 + (inBar >= 8 ? 12 : 0);
  out.push({ voice: "arp", step: s, notes: [tone], length: 1, velocity: inBar % 4 === 0 ? 0.32 : 0.2 });
  return out;
}
