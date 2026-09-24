import { describe, expect, it } from "vitest";
import {
  CIRCUIT_INTERACTABLES,
  TRACK,
  TRACK_LENGTH,
  circuitZoneAt,
  formatLap,
  headingAt,
  initialLap,
  lapStep,
  onTrack,
  projectToTrack,
  surfaceHeight,
  trackFrame,
  type LapState,
} from "./layout";
import { pickActive } from "../interaction";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe("tracé du circuit", () => {
  it("a la longueur d'un stade : 4a + 2πR", () => {
    expect(TRACK_LENGTH).toBeCloseTo(4 * TRACK.a + 2 * Math.PI * TRACK.R, 6);
  });

  it("est continu et tangent partout (pas de saut entre tronçons)", () => {
    const step = 0.25;
    for (let s = 0; s < TRACK_LENGTH; s += step) {
      const p = trackFrame(s);
      const q = trackFrame(s + step);
      const dist = Math.hypot(q.x - p.x, q.z - p.z);
      expect(dist).toBeLessThan(step + 1e-6);
      expect(dist).toBeGreaterThan(step * 0.99);
      expect(close(Math.hypot(p.tx, p.tz), 1)).toBe(true);
      // La normale pointe vers l'extérieur : le centre de l'ovale est de l'autre côté.
      expect(p.nx * p.x + p.nz * p.z).toBeGreaterThan(0);
    }
  });

  it("projette l'axe sur lui-même (abscisse et décalage nul)", () => {
    for (let s = 0.5; s < TRACK_LENGTH; s += 7.3) {
      const f = trackFrame(s);
      const pr = projectToTrack(f.x, f.z);
      expect(pr.s).toBeCloseTo(s, 5);
      expect(pr.d).toBeCloseTo(0, 5);
      const out = projectToTrack(f.x + f.nx * 3, f.z + f.nz * 3);
      expect(out.d).toBeCloseTo(3, 5);
    }
  });

  it("relève les virages et laisse les lignes droites à plat", () => {
    expect(trackFrame(5).bank).toBe(0);
    expect(trackFrame(TRACK.a + (Math.PI * TRACK.R) / 2).bank).toBeCloseTo(TRACK.maxBank, 6);
    // Au milieu du virage est, le bord extérieur est plus haut que le bord intérieur.
    const mid = TRACK.a + TRACK.R;
    expect(surfaceHeight(mid + TRACK.width / 2 - 0.1, 0)).toBeGreaterThan(2.5);
    expect(surfaceHeight(mid - TRACK.width / 2 + 0.1, 0)).toBeLessThan(0.1);
    // Hors piste : herbe à plat.
    expect(surfaceHeight(0, 0)).toBe(0);
  });

  it("oriente l'axe +X d'un objet dans le sens de course", () => {
    expect(headingAt(1)).toBeCloseTo(0, 6);
    const back = headingAt(TRACK.a * 2 + Math.PI * TRACK.R);
    expect(Math.abs(back)).toBeCloseTo(Math.PI, 6);
  });

  it("distingue piste et infield", () => {
    expect(onTrack(0, TRACK.R)).toBe(true);
    expect(onTrack(0, 0)).toBe(false);
    expect(circuitZoneAt(0, TRACK.R)).toBe("Piste");
    expect(circuitZoneAt(0, 9)).toBe("Paddock et sas");
  });

  it("garde les dalles du paddock hors de la piste et distinctes", () => {
    for (const it of CIRCUIT_INTERACTABLES) {
      expect(onTrack(it.position[0], it.position[2], 1), it.id).toBe(false);
      expect(pickActive(it.position[0], it.position[2], CIRCUIT_INTERACTABLES, null)).toBe(it.id);
    }
  });
});

describe("chronométrage", () => {
  /** Fait rouler un point le long de l'axe, de s0 à s1, et renvoie les tours validés. */
  function drive(state: LapState, s0: number, s1: number, t0: number, speed = 25) {
    const laps: number[] = [];
    let st = state;
    let t = t0;
    const dir = Math.sign(s1 - s0);
    for (let s = s0; dir > 0 ? s <= s1 : s >= s1; s += dir * 0.8) {
      const f = trackFrame(s);
      t += (0.8 / speed) * 1000;
      const r = lapStep(st, f.x, f.z, t);
      st = r.state;
      if (r.lapMs !== null) laps.push(r.lapMs);
    }
    return { state: st, laps, t };
  }

  it("valide un tour complet dans le bon sens, avec son temps", () => {
    const first = drive(initialLap(), TRACK_LENGTH - 20, TRACK_LENGTH + 5, 0);
    expect(first.laps).toEqual([]);
    expect(first.state.lapStart).not.toBeNull();
    const lap = drive(first.state, TRACK_LENGTH + 5, 2 * TRACK_LENGTH + 5, first.t);
    expect(lap.laps).toHaveLength(1);
    expect(lap.laps[0]! / 1000).toBeCloseTo(TRACK_LENGTH / 25, 0);
  });

  it("n'accepte pas un tour coupé par l'infield", () => {
    const start = drive(initialLap(), TRACK_LENGTH - 10, TRACK_LENGTH + 10, 0);
    let st = start.state;
    // Traversée de l'herbe : aucun effet, puis reprise directement sur la ligne opposée.
    st = lapStep(st, 0, 0, 1000).state;
    const rest = drive(st, TRACK.a * 2 + Math.PI * TRACK.R, TRACK_LENGTH + 10, 2000);
    expect(rest.laps).toEqual([]);
  });

  it("annule le tour si la ligne est franchie à rebours", () => {
    const start = drive(initialLap(), TRACK_LENGTH - 10, TRACK_LENGTH + 10, 0);
    const back = drive(start.state, TRACK_LENGTH + 10, TRACK_LENGTH - 10, start.t);
    expect(back.state.lapStart).toBeNull();
  });

  it("formate les temps", () => {
    expect(formatLap(58120)).toBe("58.120");
    expect(formatLap(62345)).toBe("1:02.345");
  });
});
