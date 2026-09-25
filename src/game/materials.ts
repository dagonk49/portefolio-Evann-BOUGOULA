/**
 * Palette et ressources partagées (matériaux, géométries, textures).
 * Créées une seule fois, réutilisées par toutes les instances, puis
 * libérées quand on quitte le lab (`disposeSharedResources`).
 */
import * as THREE from "three";

export const PALETTE = {
  graphite: "#2b2f35",
  graphiteDark: "#1c1f23",
  graphiteSoft: "#3c424a",
  alu: "#aab1b8",
  aluDark: "#7d858d",
  offWhite: "#ebe7de",
  floor: "#d9d4c9",
  floorWarm: "#cdbb9f",
  wood: "#b8946a",
  woodDark: "#8a6a47",
  cyan: "#3cc7da",
  cyanDeep: "#1b8c9d",
  amber: "#f0a13a",
  amberDeep: "#c9771b",
  red: "#d9534a",
  green: "#59c27a",
  cardboard: "#c49a64",
  cardboardDark: "#a67c49",
  screen: "#0f1316",
} as const;

export type PaletteKey = keyof typeof PALETTE;

const materials = new Map<string, THREE.Material>();
const geometries = new Map<string, THREE.BufferGeometry>();
const textures = new Set<THREE.Texture>();

/**
 * Finitions par défaut de certaines teintes : l'aluminium des baies et des
 * rails est métallique et peu rugueux, pour accrocher les reflets de
 * l'environnement lumineux (voir scene/Environment.tsx).
 */
const FINISH: Partial<Record<PaletteKey, { roughness: number; metalness: number }>> = {
  alu: { roughness: 0.34, metalness: 0.62 },
  aluDark: { roughness: 0.42, metalness: 0.55 },
};

/** Matériau standard mat (low-poly, légèrement rugueux). */
export function mat(color: PaletteKey | string, options: { roughness?: number; metalness?: number; flat?: boolean } = {}): THREE.MeshStandardMaterial {
  const finish = FINISH[color as PaletteKey];
  const hex = color in PALETTE ? PALETTE[color as PaletteKey] : color;
  const roughness = options.roughness ?? finish?.roughness ?? 0.82;
  const metalness = options.metalness ?? finish?.metalness ?? 0.05;
  const key = `std:${hex}:${roughness}:${metalness}:${options.flat ?? true}`;
  let m = materials.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: hex, roughness, metalness, flatShading: options.flat ?? true });
    materials.set(key, m);
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* Néons (LED, dalles, flux) : seuls éléments à dépasser le seuil de bloom */
/* ------------------------------------------------------------------ */

/**
 * Intensité des néons. En qualité haute, le post-traitement ne fait briller
 * (bloom) que les pixels au-delà de 1 : on pousse donc la couleur des néons
 * au-dessus de ce seuil, et rien d'autre. En qualité réduite (sans bloom),
 * elle reste à 1 et le rendu est identique à celui d'origine.
 */
export const GLOW_UNIFORM = { value: 1 };
const glowMaterials = new Set<THREE.MeshBasicMaterial>();

/** Enregistre un matériau lumineux dont la couleur suit l'intensité des néons. */
export function registerGlow<T extends THREE.MeshBasicMaterial>(m: T): T {
  if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
  m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(GLOW_UNIFORM.value);
  glowMaterials.add(m);
  return m;
}

export function setGlowBoost(k: number): void {
  GLOW_UNIFORM.value = k;
  for (const m of glowMaterials) m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(k);
}

/** Matériau lumineux (LED, écrans, traits) : non affecté par l'éclairage. */
export function glow(color: PaletteKey | string, opacity = 1): THREE.MeshBasicMaterial {
  const hex = color in PALETTE ? PALETTE[color as PaletteKey] : color;
  const key = `glow:${hex}:${opacity}`;
  let m = materials.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = registerGlow(new THREE.MeshBasicMaterial({ color: hex, toneMapped: false, transparent: opacity < 1, opacity }));
    materials.set(key, m);
  }
  return m;
}

export function cachedMaterial<T extends THREE.Material>(key: string, create: () => T): T {
  let m = materials.get(key) as T | undefined;
  if (!m) {
    m = create();
    materials.set(key, m);
  }
  return m;
}

export function geo<T extends THREE.BufferGeometry>(key: string, create: () => T): T {
  let g = geometries.get(key) as T | undefined;
  if (!g) {
    g = create();
    geometries.set(key, g);
  }
  return g;
}

export const unitBox = () => geo("box", () => new THREE.BoxGeometry(1, 1, 1));
export const unitCylinder = (segments = 12) => geo(`cyl:${segments}`, () => new THREE.CylinderGeometry(0.5, 0.5, 1, segments));

export function trackTexture<T extends THREE.Texture>(t: T): T {
  textures.add(t);
  return t;
}

export function disposeSharedResources(): void {
  glowMaterials.clear();
  for (const m of materials.values()) m.dispose();
  for (const g of geometries.values()) g.dispose();
  for (const t of textures) t.dispose();
  materials.clear();
  geometries.clear();
  textures.clear();
}

export const FONT_MONO = "/fonts/ibm-plex-mono-latin-500-normal.woff";
export const FONT_SANS = "/fonts/ibm-plex-sans-latin-600-normal.woff";
