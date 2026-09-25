/**
 * Consentement au stockage local (recommandations CNIL, article 82 de la loi
 * Informatique et Libertés).
 *
 * Le site ne dépose aucun cookie et n'utilise aucun traceur tiers. La seule
 * catégorie optionnelle est « Préférences et progression » : mode préféré
 * (sobre ou 3D), réglages du son, de l'accessibilité et des graphismes,
 * tutoriel, progression de la mission 3D et du circuit. Sans accord, rien de
 * tout cela n'est écrit dans le navigateur (tout reste en mémoire le temps de
 * la visite).
 *
 * Le choix lui-même (accord ou refus) est conservé 6 mois, comme la CNIL le
 * recommande, pour ne pas redemander à chaque visite. Cette conservation est
 * strictement nécessaire et ne requiert pas de consentement.
 */

export const CONSENT_KEY = "evann-consent";
export const CONSENT_VERSION = 1;
/** Durée de validité du choix : 6 mois. */
export const CONSENT_TTL_MS = 182 * 24 * 60 * 60 * 1000;

export interface ConsentRecord {
  v: typeof CONSENT_VERSION;
  /** Catégorie « Préférences et progression ». */
  preferences: boolean;
  /** Date du choix (ISO 8601). */
  decidedAt: string;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Choix enregistré et encore valide, sinon `null` (premier passage ou choix expiré). */
export function readConsent(now: number = Date.now()): ConsentRecord | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(CONSENT_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as Partial<ConsentRecord>;
    if (rec.v !== CONSENT_VERSION || typeof rec.preferences !== "boolean" || typeof rec.decidedAt !== "string") return null;
    const at = Date.parse(rec.decidedAt);
    if (!Number.isFinite(at) || now - at > CONSENT_TTL_MS || at - now > 60_000) return null;
    return rec as ConsentRecord;
  } catch {
    return null;
  }
}

export function writeConsent(preferences: boolean, now: number = Date.now()): ConsentRecord {
  const rec: ConsentRecord = { v: CONSENT_VERSION, preferences, decidedAt: new Date(now).toISOString() };
  try {
    storage()?.setItem(CONSENT_KEY, JSON.stringify(rec));
  } catch {
    /* stockage indisponible : le choix vaut pour cette visite */
  }
  memory = rec;
  return rec;
}

/** Choix de la visite en cours (utile si le stockage est bloqué). */
let memory: ConsentRecord | null = null;

/** Le visiteur a-t-il accepté la catégorie « Préférences et progression » ? */
export function preferencesAllowed(): boolean {
  return (readConsent() ?? memory)?.preferences === true;
}

export function clearConsent(): void {
  memory = null;
  try {
    storage()?.removeItem(CONSENT_KEY);
  } catch {
    /* rien à faire */
  }
}
