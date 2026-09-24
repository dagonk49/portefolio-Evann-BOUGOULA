/** Détections côté navigateur (toujours prudentes, jamais bloquantes). */

let webglCache: boolean | null = null;

export function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    webglCache = !!gl;
    // Libère immédiatement le contexte de test.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Écran tactile de petite taille : on privilégie le mode sobre. */
export function isSmallTouchDevice(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse && Math.min(window.innerWidth, window.innerHeight) < 820;
}

export function hasCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Ouvre un lien externe dans un nouvel onglet, sans accès à cette page. */
export function openExternal(url: string): void {
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    /* le lien de secours affiché prend le relais */
  }
}

/** Le focus est-il dans un champ de saisie ? (le personnage ne doit pas bouger) */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "range", "submit", "reset"].includes(type);
  }
  return false;
}
