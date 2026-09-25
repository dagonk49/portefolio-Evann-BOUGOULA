/**
 * Persistance locale versionnée. Tout accès est protégé : navigation privée,
 * stockage bloqué ou quota plein n'empêchent jamais le site de fonctionner.
 *
 * Rien n'est lu ni écrit sans l'accord du visiteur pour la catégorie
 * « Préférences et progression » (voir `consent.ts`).
 */
import { preferencesAllowed } from "./consent";

export const STORAGE_KEY = "evann-root-access";
export const STORAGE_VERSION = 1;
/** Durée de vie maximale des préférences enregistrées (recommandation CNIL : 13 mois). */
export const STORAGE_TTL_MS = 395 * 24 * 60 * 60 * 1000;

export interface Envelope<T> {
  v: number;
  savedAt: string;
  data: T;
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = "__evann_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function storageAvailable(): boolean {
  return getStorage() !== null;
}

/**
 * Lit la donnée enregistrée. `migrate` reçoit une enveloppe d'une autre
 * version et renvoie la donnée convertie, ou `null` pour l'ignorer.
 */
export function loadPersisted<T>(migrate?: (old: Envelope<unknown>) => T | null): T | null {
  if (!preferencesAllowed()) return null;
  const s = getStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<unknown>;
    if (!env || typeof env !== "object" || typeof env.v !== "number") return null;
    const savedAt = Date.parse(env.savedAt);
    if (Number.isFinite(savedAt) && Date.now() - savedAt > STORAGE_TTL_MS) {
      s.removeItem(STORAGE_KEY);
      return null;
    }
    if (env.v === STORAGE_VERSION) return env.data as T;
    return migrate ? migrate(env) : null;
  } catch {
    return null;
  }
}

export function savePersisted<T>(data: T): boolean {
  if (!preferencesAllowed()) return false;
  const s = getStorage();
  if (!s) return false;
  try {
    const env: Envelope<T> = { v: STORAGE_VERSION, savedAt: new Date().toISOString(), data };
    s.setItem(STORAGE_KEY, JSON.stringify(env));
    return true;
  } catch {
    return false;
  }
}

/** Clés de session (tutoriel) : effacées avec le reste en cas de refus. */
export const SESSION_KEYS = ["evann-tutorial-hidden"] as const;

export function clearPersisted(): void {
  const s = getStorage();
  if (s) {
    try {
      s.removeItem(STORAGE_KEY);
    } catch {
      /* rien à faire */
    }
  }
  try {
    for (const k of SESSION_KEYS) window.sessionStorage.removeItem(k);
  } catch {
    /* rien à faire */
  }
}
