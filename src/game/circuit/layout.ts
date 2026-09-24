/**
 * Circuit extérieur (monde « circuit ») : tracé, dévers, chronométrage et
 * points d'intérêt. Données et calculs purs, sans rendu, testés à part.
 *
 * Tracé : ovale « stade » dans le plan XZ. Deux lignes droites de 2a le long
 * de X (z = ±R), reliées par deux virages relevés de rayon R. On roule dans le
 * sens antihoraire vu du dessus (virages à gauche, comme en stock-car) :
 * départ à (0, +R), direction +X.
 *
 *             ligne opposée (z = -R, sens -X)
 *        ╭──────────────────────────────────────╮
 *  virage│  Valorant   Minecraft    GTA   Cinéma │virage
 *  ouest │              paddock / sas            │est
 *        ╰──────────── départ ▶ ────────────────╯
 *             ligne des stands (z = +R, sens +X)
 */
import type { CircuitZoneId } from "@/data/types";
import type { Interactable, Vec3 } from "../layout";

export const TRACK = {
  /** Demi-longueur des lignes droites. */
  a: 30,
  /** Rayon des virages (axe de la piste). */
  R: 22,
  /** Largeur de la piste. */
  width: 12,
  /** Dévers maximal au milieu des virages (radians, ≈ 14°). */
  maxBank: (14 * Math.PI) / 180,
  /** La piste est légèrement surélevée par rapport à l'herbe (évite le z-fighting). */
  lift: 0.02,
} as const;

const { a, R } = TRACK;
const HALF_W = TRACK.width / 2;
const TURN = Math.PI * R;
export const TRACK_LENGTH = 4 * a + 2 * TURN;

/** Bornes des tronçons, en abscisse curviligne depuis la ligne de départ. */
const S1 = a; // fin de la première demi-ligne des stands
const S2 = S1 + TURN; // fin du virage est
const S3 = S2 + 2 * a; // fin de la ligne opposée
const S4 = S3 + TURN; // fin du virage ouest

export interface TrackFrame {
  x: number;
  z: number;
  /** Tangente unitaire (sens de course). */
  tx: number;
  tz: number;
  /** Normale unitaire vers l'extérieur de la piste. */
  nx: number;
  nz: number;
  /** Dévers (radians) : nul en ligne droite, maximal au milieu des virages. */
  bank: number;
}

/** Ramène une abscisse dans [0, L). */
export function wrapS(s: number): number {
  return ((s % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
}

/** Point de l'axe de la piste à l'abscisse curviligne `s`. */
export function trackFrame(sIn: number): TrackFrame {
  const s = wrapS(sIn);
  let x: number, z: number, tx: number, tz: number, bank = 0;
  if (s < S1) {
    x = s;
    z = R;
    tx = 1;
    tz = 0;
  } else if (s < S2) {
    const phi = (s - S1) / R;
    x = a + R * Math.sin(phi);
    z = R * Math.cos(phi);
    tx = Math.cos(phi);
    tz = -Math.sin(phi);
    bank = TRACK.maxBank * Math.sin(phi);
  } else if (s < S3) {
    x = a - (s - S2);
    z = -R;
    tx = -1;
    tz = 0;
  } else if (s < S4) {
    const phi = (s - S3) / R;
    x = -a - R * Math.sin(phi);
    z = -R * Math.cos(phi);
    tx = -Math.cos(phi);
    tz = Math.sin(phi);
    bank = TRACK.maxBank * Math.sin(phi);
  } else {
    x = -a + (s - S4);
    z = R;
    tx = 1;
    tz = 0;
  }
  return { x, z, tx, tz, nx: -tz, nz: tx, bank };
}

/**
 * Projette un point au sol sur la piste : abscisse `s` et décalage latéral
 * `d` (positif vers l'extérieur, 0 sur l'axe).
 */
export function projectToTrack(x: number, z: number): { s: number; d: number } {
  if (x >= -a && x <= a) {
    if (z >= 0) return { s: wrapS(x), d: z - R };
    return { s: S2 + (a - x), d: -z - R };
  }
  if (x > a) {
    const dx = x - a;
    const r = Math.hypot(dx, z);
    const phi = Math.atan2(dx, z);
    return { s: S1 + phi * R, d: r - R };
  }
  const dx = -a - x;
  const r = Math.hypot(dx, z);
  const phi = Math.atan2(dx, -z);
  return { s: S3 + phi * R, d: r - R };
}

/** Le point est-il sur le revêtement (avec une marge) ? */
export function onTrack(x: number, z: number, margin = 0): boolean {
  return Math.abs(projectToTrack(x, z).d) <= HALF_W + margin;
}

/** Hauteur du revêtement relevé à un décalage latéral `d` pour un dévers donné. */
export function bankHeight(d: number, bank: number): number {
  return (Math.min(HALF_W, Math.max(-HALF_W, d)) + HALF_W) * Math.tan(bank);
}

/** Hauteur du sol (piste ou herbe) en un point. */
export function surfaceHeight(x: number, z: number): number {
  const { s, d } = projectToTrack(x, z);
  if (Math.abs(d) > HALF_W) return 0;
  return bankHeight(d, trackFrame(s).bank) + TRACK.lift;
}

/** Position au sol pour une abscisse et un décalage donnés. */
export function trackPoint(s: number, d: number, extraY = 0): Vec3 {
  const f = trackFrame(s);
  return [f.x + f.nx * d, bankHeight(d, f.bank) + TRACK.lift + extraY, f.z + f.nz * d];
}

/** Cap (rotation Y) qui oriente l'axe +X d'un objet selon la tangente. */
export function headingAt(s: number): number {
  const f = trackFrame(s);
  return Math.atan2(-f.tz, f.tx);
}

/* ------------------------------------------------------------------ */
/* Chronométrage                                                         */
/* ------------------------------------------------------------------ */

export const SECTORS = 4;

export interface LapState {
  /** Secteur courant (0 … 3), ou -1 avant le premier passage sur la piste. */
  sector: number;
  /** Nombre de secteurs franchis dans l'ordre depuis le départ du tour. */
  visited: number;
  /** Heure de départ du tour en cours (ms), ou null. */
  lapStart: number | null;
}

export const initialLap = (): LapState => ({ sector: -1, visited: 0, lapStart: null });

/**
 * Met à jour le chronométrage à partir de la position sur la piste.
 * Un tour n'est validé que si les quatre secteurs ont été franchis dans
 * l'ordre : couper par l'herbe ou faire demi-tour annule le tour.
 */
export function lapStep(state: LapState, x: number, z: number, now: number): { state: LapState; lapMs: number | null } {
  if (!onTrack(x, z, 1)) return { state, lapMs: null };
  const { s } = projectToTrack(x, z);
  const sector = Math.min(SECTORS - 1, Math.floor(s / (TRACK_LENGTH / SECTORS)));
  if (sector === state.sector) return { state, lapMs: null };
  if (state.sector === -1) return { state: { sector, visited: 0, lapStart: null }, lapMs: null };
  const forward = sector === (state.sector + 1) % SECTORS;
  const backward = sector === (state.sector + SECTORS - 1) % SECTORS;
  if (forward && sector === 0) {
    // Franchissement de la ligne dans le bon sens.
    const lapMs = state.lapStart !== null && state.visited === SECTORS - 1 ? now - state.lapStart : null;
    return { state: { sector, visited: 0, lapStart: now }, lapMs };
  }
  if (forward) {
    return { state: { ...state, sector, visited: state.visited === sector - 1 ? sector : state.visited }, lapMs: null };
  }
  if (backward && state.sector === 0) {
    // Ligne franchie à rebours : le tour en cours est annulé.
    return { state: { sector, visited: 0, lapStart: null }, lapMs: null };
  }
  // Recul d'un secteur ou saut (raccourci) : le tour reste en cours mais ne pourra être validé que dans l'ordre.
  return { state: { ...state, sector, visited: backward ? state.visited : Math.min(state.visited, 0) }, lapMs: null };
}

/** Formate un temps au tour : 1:02.345 ou 58.120. */
export function formatLap(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const rest = String(total % 1000).padStart(3, "0");
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}.${rest}` : `${s}.${rest}`;
}

/* ------------------------------------------------------------------ */
/* Points d'intérêt                                                      */
/* ------------------------------------------------------------------ */

/** Bâtiment du paddock : le sas qui ramène au lab. */
export const PADDOCK = { x: 0, z: 6, width: 9, depth: 3.2, height: 3.4 } as const;
export const SAS_DOOR: Vec3 = [PADDOCK.x, 0, PADDOCK.z + PADDOCK.depth / 2];
/** Arrivée à pied depuis le lab. */
export const CIRCUIT_ARRIVAL: Vec3 = [2.6, 0.2, 12.8];
export const CIRCUIT_RESPAWN_Y = -6;

/** Grille de départ du stock-car, face au sens de course. */
export const STOCKCAR_GRID = { s: TRACK_LENGTH - 9, d: -1.5 } as const;
/** Emplacement du kart dans les stands. */
export const KART_SPOT: Vec3 = [-7.2, 0, 12.6];

export const SPOTS = {
  valorant: { x: -31, z: 0 },
  minecraft: { x: -12, z: -5.5 },
  gta: { x: 12.5, z: -5.5 },
  cinema: { x: 33, z: 0 },
} as const;

export interface CircuitZoneDef {
  id: CircuitZoneId;
  name: string;
  center: [number, number];
  radius: number;
}

export const CIRCUIT_ZONES: CircuitZoneDef[] = [
  { id: "paddock", name: "Paddock et sas", center: [0, 9], radius: 7.5 },
  { id: "spot-valorant", name: "Spot Valorant", center: [SPOTS.valorant.x, SPOTS.valorant.z], radius: 10 },
  { id: "spot-minecraft", name: "Spot Minecraft", center: [SPOTS.minecraft.x, SPOTS.minecraft.z], radius: 7 },
  { id: "spot-gta", name: "Spot GTA", center: [SPOTS.gta.x, SPOTS.gta.z], radius: 7 },
  { id: "spot-cinema", name: "Spot cinéma et mécanique", center: [SPOTS.cinema.x, SPOTS.cinema.z], radius: 10 },
];

export function circuitZoneAt(x: number, z: number): string {
  let best: string | null = null;
  let bestScore = Infinity;
  for (const zone of CIRCUIT_ZONES) {
    const score = Math.hypot(x - zone.center[0], z - zone.center[1]) / zone.radius;
    if (score < 1 && score < bestScore) {
      best = zone.name;
      bestScore = score;
    }
  }
  if (best) return best;
  return onTrack(x, z, 0.5) ? "Piste" : "Circuit extérieur";
}

export const CIRCUIT_INTERACTABLES: Interactable[] = [
  {
    id: "circuit.sas",
    label: "Sas — rentrer au lab",
    zone: "paddock",
    position: [SAS_DOOR[0], 0, SAS_DOOR[2] + 1.9],
    radius: 1.3,
    action: { type: "travel", to: "lab" },
    focus: { target: [SAS_DOOR[0], 1.6, SAS_DOOR[2]], distance: 0.34 },
    pad: true,
  },
];
