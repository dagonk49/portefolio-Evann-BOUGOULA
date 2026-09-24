/**
 * Topologie du lab 3D (données pures, sans rendu).
 *
 * Repère : Y vers le haut, unités en mètres. La caméra regarde en diagonale
 * (lacet 45°) : l'île carrée apparaît en losange. Les murs sont sur les deux
 * bords du fond (x = -24 et z = -24), côté opposé à la caméra.
 *
 *            (haut de l'écran)
 *     HomeLab ↖           ↗ Parcours
 *   Baie ←      Accueil       → Bureau
 */
import type { AnomalyId, ContentRef, ZoneId } from "@/data/types";
import type { CameraFocus, Panel } from "@/state/labUi";

export type Vec3 = [number, number, number];

export const ISLAND = { minX: -24, maxX: 16, minZ: -24, maxZ: 16 } as const;
export const ISLAND_CENTER: Vec3 = [(ISLAND.minX + ISLAND.maxX) / 2, 0, (ISLAND.minZ + ISLAND.maxZ) / 2];

/** Lacet de la caméra (45°) : directions « écran » projetées au sol. */
export const CAMERA_YAW = Math.PI / 4;
const S = Math.SQRT1_2;
/** Convertit un décalage écran (droite, haut) en coordonnées monde au sol. */
export function fromScreen(sx: number, sy: number, y = 0): Vec3 {
  return [S * (sx - sy), y, -S * (sx + sy)];
}
/** Rotation Y qui oriente une face +Z vers la caméra. */
export const FACE_CAMERA = Math.PI / 4;

export const SPAWN: Vec3 = [4, 1.2, 4];
export const RESPAWN_Y = -8;

export interface ZoneDef {
  id: ZoneId;
  name: string;
  center: [number, number];
  radius: number;
}

export const ZONES: ZoneDef[] = [
  { id: "spawn", name: "Accueil", center: [3, 3], radius: 10 },
  { id: "baie", name: "Baie réseau", center: [-17, 8.5], radius: 8 },
  { id: "bureau", name: "Bureau et atelier", center: [11.5, -17], radius: 8 },
  { id: "cluster", name: "Cluster HomeLab", center: [-17.5, -9.5], radius: 8 },
  { id: "parcours", name: "Mur du parcours", center: [-2, -19.5], radius: 10 },
];

/** Hauteur du sol par zone surélevée (sert au rendu et aux colliders). */
export const PLATFORMS = {
  bay: { minX: -23.6, maxX: -15.2, minZ: 2.2, maxZ: 15.4, top: 0.08 },
  cluster: { minX: -23.6, maxX: -15.2, minZ: -14.8, maxZ: -4.2, top: 0.5 },
  career: { minX: -12, maxX: 8, minZ: -23.6, maxZ: -17, top: 0.3 },
} as const;

/* ------------------------------------------------------------------ */
/* Baie réseau : position des équipements du rack de la mission          */
/* ------------------------------------------------------------------ */

/** Rack de la mission : face avant tournée vers +X. */
export const RACK_LAB = { x: -22.2, z: 8.6, frontX: -21.68 } as const;
export const RACK_UNITS = {
  patch: 1.86,
  switch: 1.6,
  router: 1.32,
  server: 0.98,
  ups: 0.42,
} as const;

/* ------------------------------------------------------------------ */
/* Interactables                                                         */
/* ------------------------------------------------------------------ */

export type InteractAction =
  | { type: "panel"; panel: Panel }
  | { type: "content"; ref: ContentRef }
  | { type: "anomaly"; id: AnomalyId };

export interface Interactable {
  id: string;
  label: string;
  zone: ZoneId;
  /** Point au sol (x, z) où se tenir, et hauteur du sol à cet endroit. */
  position: Vec3;
  radius: number;
  action: InteractAction;
  focus: CameraFocus;
  /** Dalle lumineuse au sol (les anomalies n'en ont pas). */
  pad: boolean;
}

const f = (target: Vec3, distance = 0.42): CameraFocus => ({ target, distance });

/** Stèles du mur du parcours, de la plus ancienne à la plus récente. */
export const CAREER_STELES: { id: string; x: number; ref: ContentRef; year: string; title: string; sub: string; kind: "xp" | "edu" | "cert" }[] = [
  { id: "stele.ciel", x: -10.2, ref: { type: "education", id: "bac-pro-ciel" }, year: "2023", title: "Bac Pro CIEL", sub: "Lycée Chevrollier", kind: "edu" },
  { id: "stele.n4b-2024", x: -7.9, ref: { type: "experience", id: "net4business-2024" }, year: "2024", title: "NET4BUSINESS", sub: "Stage · févr.–mars", kind: "xp" },
  { id: "stele.moizan", x: -5.6, ref: { type: "experience", id: "moizan-2024" }, year: "2024", title: "EURL Moizan", sub: "Stage · avr.–mai", kind: "xp" },
  { id: "stele.certs", x: -3.3, ref: { type: "certifications" }, year: "2024+", title: "Certifications", sub: "B1V · Cisco · SST", kind: "cert" },
  { id: "stele.n4b-2025", x: -1.0, ref: { type: "experience", id: "net4business-2025" }, year: "2025", title: "NET4BUSINESS", sub: "Stage · mai–juin", kind: "xp" },
  { id: "stele.n4b-2026", x: 1.3, ref: { type: "experience", id: "net4business-2026" }, year: "2026", title: "NET4BUSINESS", sub: "Stage · janv.–mars", kind: "xp" },
  { id: "stele.bts", x: 3.6, ref: { type: "education", id: "bts-sio-sisr" }, year: "2026", title: "BTS SIO SISR", sub: "MyDigitalSchool", kind: "edu" },
  { id: "stele.efs", x: 5.9, ref: { type: "experience", id: "efs-2026" }, year: "2026", title: "EFS", sub: "Alternance · DSI", kind: "xp" },
];
export const STELE_Z = -21.9;
export const STELE_PAD_Z = -19.6;

export const CONTACT_KIOSK: Vec3 = [8.6, 0, -19.4];
export const CONTROLS_BOARD: Vec3 = [1.2, 0, 10.2];
export const INDEX_KIOSK: Vec3 = [10.2, 0, 1.2];
export const PROXMOX_HOST: Vec3 = [-21.6, PLATFORMS.cluster.top, -9.4];
export const AD_CONSOLE: Vec3 = [7.0, 0, -13.9];
export const SUPPORT_CART: Vec3 = [-12.7, 0, -18.6];
export const DESK = { x: 11.2, z: -21.7, height: 0.76 } as const;
export const WORKBENCH = { x: 14.4, z: -22.2, height: 0.9 } as const;
export const DEV_TABLE: Vec3 = [15.0, 0, -16.4];
export const TEST_CART: Vec3 = [12.9, 0, -13.0];

export const INTERACTABLES: Interactable[] = [
  {
    id: "spawn.controls",
    label: "Panneau des commandes",
    zone: "spawn",
    position: [CONTROLS_BOARD[0] + 0.9, 0, CONTROLS_BOARD[2] - 0.9],
    radius: 1.3,
    action: { type: "panel", panel: { kind: "help" } },
    focus: f([CONTROLS_BOARD[0], 1.3, CONTROLS_BOARD[2]], 0.45),
    pad: true,
  },
  {
    id: "spawn.index",
    label: "Index des contenus",
    zone: "spawn",
    position: [INDEX_KIOSK[0] - 0.9, 0, INDEX_KIOSK[2] + 0.9],
    radius: 1.3,
    action: { type: "panel", panel: { kind: "index" } },
    focus: f([INDEX_KIOSK[0], 1.2, INDEX_KIOSK[2]], 0.45),
    pad: true,
  },
  {
    id: "baie.patch",
    label: "Baie réseau — brassage",
    zone: "baie",
    position: [-19.7, PLATFORMS.bay.top, RACK_LAB.z + 0.2],
    radius: 1.4,
    action: { type: "panel", panel: { kind: "bay" } },
    focus: f([RACK_LAB.frontX, 1.35, RACK_LAB.z], 0.3),
    pad: true,
  },
  {
    id: "bureau.pc",
    label: "Poste PC-LAB",
    zone: "bureau",
    position: [DESK.x - 0.75, 0, DESK.z + 2.0],
    radius: 1.2,
    action: { type: "panel", panel: { kind: "pc" } },
    focus: f([DESK.x - 0.5, 1.05, DESK.z], 0.3),
    pad: true,
  },
  {
    id: "cluster.proxmox",
    label: "Hôte Proxmox — HomeLab",
    zone: "cluster",
    position: [-18.3, PLATFORMS.cluster.top, -9.4],
    radius: 1.4,
    action: { type: "content", ref: { type: "homelab" } },
    focus: f([-20.4, 2.2, -9.4], 0.52),
    pad: true,
  },
  ...CAREER_STELES.map(
    (s): Interactable => ({
      id: s.id,
      label: `Stèle — ${s.title} ${s.year}`,
      zone: "parcours",
      position: [s.x, PLATFORMS.career.top, STELE_PAD_Z],
      radius: 1.0,
      action: { type: "content", ref: s.ref },
      focus: f([s.x, 1.4, STELE_Z], 0.34),
      pad: true,
    }),
  ),
  {
    id: "parcours.contact",
    label: "Borne contact",
    zone: "parcours",
    position: [CONTACT_KIOSK[0], 0, CONTACT_KIOSK[2] + 1.5],
    radius: 1.1,
    action: { type: "content", ref: { type: "contact" } },
    focus: f([CONTACT_KIOSK[0], 1.2, CONTACT_KIOSK[2]], 0.38),
    pad: true,
  },
];

/** Placement des anomalies : position flottante et point d'interaction au sol. */
export const ANOMALY_PLACEMENTS: Record<AnomalyId, { float: Vec3; ground: Vec3; radius?: number }> = {
  "evann.profile.about": { float: [-0.6, 1.9, 7.4], ground: [-0.2, 0, 7.8] },
  "evann.skills.networking": { float: [-21.0, 2.55, 6.3], ground: [-19.4, PLATFORMS.bay.top, 6.1] },
  "evann.xp.net4business-2024.wifi": { float: [-20.6, 2.6, 14.3], ground: [-19.2, PLATFORMS.bay.top, 13.9] },
  "evann.skills.systems": { float: [-18.2, 2.3, -5.3], ground: [-16.9, PLATFORMS.cluster.top, -5.8] },
  "evann.xp.net4business-2025.proxmox": { float: [-18.2, 2.3, -13.6], ground: [-16.9, PLATFORMS.cluster.top, -13.0] },
  "evann.projects.netforge": { float: [12.2, 2.55, -22.5], ground: [12.3, 0, -19.5] },
  "evann.xp.net4business-2026.ventoy": { float: [14.0, 1.6, -22.2], ground: [14.1, 0, -20.0] },
  "evann.skills.development": { float: [15.0, 1.65, -16.4], ground: [13.8, 0, -16.2] },
  "evann.skills.method": { float: [12.9, 1.55, -13.0], ground: [12.2, 0, -11.9] },
  "evann.xp.efs.active-directory": { float: [7.0, 1.95, -13.9], ground: [6.2, 0, -12.9] },
  "evann.skills.support": { float: [-12.7, 1.75, -18.6], ground: [-12.6, 0, -16.9] },
};

export const ANOMALY_RADIUS = 1.25;
/** Distance à laquelle une anomalie est « repérée ». */
export const SPOT_DISTANCE = 6.5;

export function anomalyInteractable(id: AnomalyId, label: string, zone: ZoneId): Interactable {
  const p = ANOMALY_PLACEMENTS[id];
  return {
    id: `anomaly:${id}`,
    label,
    zone,
    position: p.ground,
    radius: p.radius ?? ANOMALY_RADIUS,
    action: { type: "anomaly", id },
    focus: { target: p.float, distance: 0.34 },
    pad: false,
  };
}

/** Chemins lumineux reliant l'accueil aux zones. */
export const PATHS: { from: [number, number]; to: [number, number] }[] = [
  { from: [4, 4], to: [-14.6, 9] },
  { from: [4, 4], to: [9.5, -13] },
  { from: [4, 4], to: [-11.6, -9.4] },
  { from: [4, 4], to: [-2, -14.5] },
];

/** Tracé de la liaison murale B-02 (du poste du bureau jusqu'au panneau de brassage). */
export const WALL_RUN: Vec3[] = [
  [DESK.x - 0.62, 0.06, DESK.z - 0.25],
  [DESK.x - 0.62, 0.06, -18.4],
  [6.4, 0.06, -12.2],
  [-2.0, 0.06, -8.6],
  [-10.2, 0.06, -3.2],
  [-12.6, 0.06, 5.2],
  [-19.6, 0.14, 9.6],
  [-21.3, 0.14, 9.6],
];
