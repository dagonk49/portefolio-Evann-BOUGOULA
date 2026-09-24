import { describe, expect, it } from "vitest";
import { BPM, CHORDS, eventsAt, midiToHz, STEPS, STEP_SECONDS } from "./synthwave";

describe("boucle synthwave du circuit", () => {
  it("tourne en boucle sur 4 mesures à 96 BPM", () => {
    expect(BPM).toBe(96);
    expect(STEPS).toBe(64);
    expect(STEP_SECONDS * STEPS).toBeCloseTo((60 / 96) * 16, 6);
    expect(eventsAt(STEPS + 3)).toEqual(eventsAt(3).map((e) => ({ ...e })));
  });

  it("place la grosse caisse sur les temps et la caisse claire sur 2 et 4", () => {
    const kicks = Array.from({ length: 16 }, (_, i) => eventsAt(i).some((e) => e.voice === "kick"));
    expect(kicks.map((k, i) => (k ? i : -1)).filter((i) => i >= 0)).toEqual([0, 4, 8, 12]);
    const snares = Array.from({ length: 16 }, (_, i) => eventsAt(i).some((e) => e.voice === "snare"));
    expect(snares.map((k, i) => (k ? i : -1)).filter((i) => i >= 0)).toEqual([4, 12]);
  });

  it("suit la grille Am – F – C – G, une nappe par mesure", () => {
    expect(CHORDS.map((c) => c.name)).toEqual(["Am", "F", "C", "G"]);
    for (let bar = 0; bar < 4; bar++) {
      const pad = eventsAt(bar * 16).find((e) => e.voice === "pad");
      expect(pad?.notes).toEqual(CHORDS[bar]!.notes);
    }
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });
});
