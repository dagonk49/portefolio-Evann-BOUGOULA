/**
 * Entrées unifiées : clavier, manette et joystick tactile.
 *
 * L'état est un objet mutable lu à chaque image (pas de rendu React).
 * Les touches sont lues par code physique : ZQSD sur AZERTY et WASD sur
 * QWERTY correspondent aux mêmes codes (KeyW, KeyA, KeyS, KeyD).
 */
import { isTypingTarget } from "@/lib/device";

export interface InputState {
  keys: Set<string>;
  /** Horodatage du dernier appui sur « sauter » (tampon de saut). */
  jumpAt: number;
  touch: { x: number; y: number };
  touchRun: boolean;
  gamepadRun: boolean;
  gamepadMove: { x: number; y: number };
  /** Gâchettes de la manette : accélérer (+) / freiner, reculer (−). */
  gamepadThrottle: number;
  gamepadDrift: boolean;
  touchDrift: boolean;
}

export const input: InputState = {
  keys: new Set(),
  jumpAt: -Infinity,
  touch: { x: 0, y: 0 },
  touchRun: false,
  gamepadRun: false,
  gamepadMove: { x: 0, y: 0 },
  gamepadThrottle: 0,
  gamepadDrift: false,
  touchDrift: false,
};

const FORWARD = ["KeyW", "ArrowUp"];
const BACK = ["KeyS", "ArrowDown"];
const LEFT = ["KeyA", "ArrowLeft"];
const RIGHT = ["KeyD", "ArrowRight"];
const RUN = ["ShiftLeft", "ShiftRight"];
export const MOVEMENT_CODES = new Set([...FORWARD, ...BACK, ...LEFT, ...RIGHT, ...RUN]);

export function resetInput(): void {
  input.keys.clear();
  input.touch.x = 0;
  input.touch.y = 0;
  input.touchRun = false;
  input.gamepadMove.x = 0;
  input.gamepadMove.y = 0;
  input.gamepadRun = false;
  input.gamepadThrottle = 0;
  input.gamepadDrift = false;
  input.touchDrift = false;
  input.jumpAt = -Infinity;
}

const any = (codes: string[]) => codes.some((c) => input.keys.has(c));

/** Vecteur de déplacement dans le repère écran : x à droite, y vers le haut. */
export function moveVector(): { x: number; y: number; run: boolean } {
  let x = (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0);
  let y = (any(FORWARD) ? 1 : 0) - (any(BACK) ? 1 : 0);
  let run = any(RUN);
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  // Joystick tactile ou manette : on garde l'entrée la plus ample.
  for (const v of [input.touch, input.gamepadMove]) {
    if (Math.hypot(v.x, v.y) > Math.hypot(x, y)) {
      x = v.x;
      y = v.y;
    }
  }
  run = run || input.touchRun || input.gamepadRun;
  return { x, y, run };
}

/**
 * Commandes d'un véhicule, dans son propre repère : accélérateur (−1 … 1),
 * direction (positive vers la gauche) et frein à main pour le drift.
 */
export function vehicleInput(): { throttle: number; steer: number; drift: boolean } {
  let throttle = (any(FORWARD) ? 1 : 0) - (any(BACK) ? 1 : 0);
  let steer = (any(LEFT) ? 1 : 0) - (any(RIGHT) ? 1 : 0);
  const t = input.touch;
  if (Math.hypot(t.x, t.y) > 0.15) {
    throttle = Math.max(-1, Math.min(1, t.y * 1.4));
    steer = -t.x;
  }
  const g = input.gamepadMove;
  if (Math.abs(g.x) > 0.05) steer = -g.x;
  if (Math.abs(input.gamepadThrottle) > 0.05) throttle = input.gamepadThrottle;
  else if (Math.abs(g.y) > 0.3 && throttle === 0) throttle = g.y;
  const drift = input.keys.has("Space") || input.touchDrift || input.gamepadDrift;
  return { throttle, steer, drift };
}

export interface GameKeyHandlers {
  /** Le jeu accepte-t-il les commandes (pas de panneau ouvert) ? */
  canPlay: () => boolean;
  onInteract: () => void;
  onPause: () => void;
  onIndex: () => void;
  onHelp: () => void;
  onRecenter: () => void;
  /** Monter dans un véhicule proche ou en descendre (F). */
  onVehicle?: () => void;
  /** Remettre le véhicule d'aplomb (R). */
  onReset?: () => void;
  /** Ouvrir les options (O). */
  onOptions?: () => void;
  /**
   * Le visiteur reprend le jeu alors qu'un bouton du HUD a gardé le focus :
   * on rend le focus à la surface de jeu, pour qu'Entrée et Espace servent au jeu.
   */
  onResume?: () => void;
}

/** Éléments sur lesquels Entrée/Espace ont déjà un sens (bouton, lien…). */
function isActivatable(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return !!el.closest("button, a, summary, [role='button'], select, input, textarea, [contenteditable='true']");
}

export function attachKeyboard(handlers: GameKeyHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    // Jamais de déplacement pendant la saisie dans un champ.
    if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
    if (!handlers.canPlay()) {
      input.keys.clear();
      return;
    }
    const active = document.activeElement;
    if (MOVEMENT_CODES.has(e.code)) {
      input.keys.add(e.code);
      if (e.code.startsWith("Arrow")) e.preventDefault();
      if (isActivatable(active) && !(active as HTMLElement).closest("[role='dialog']")) handlers.onResume?.();
      return;
    }
    if (isActivatable(active) && (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter")) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        // Saut à pied, frein à main (drift) en véhicule : on garde aussi l'état maintenu.
        input.keys.add("Space");
        if (!e.repeat) input.jumpAt = performance.now();
        break;
      case "KeyF":
        if (!e.repeat) handlers.onVehicle?.();
        break;
      case "KeyR":
        if (!e.repeat) handlers.onReset?.();
        break;
      case "KeyO":
        if (!e.repeat) handlers.onOptions?.();
        break;
      case "KeyE":
      case "Enter":
      case "NumpadEnter":
        if (!e.repeat) {
          e.preventDefault();
          handlers.onInteract();
        }
        break;
      case "Escape":
        e.preventDefault();
        handlers.onPause();
        break;
      case "KeyI":
        handlers.onIndex();
        break;
      case "KeyH":
        handlers.onHelp();
        break;
      case "KeyC":
        handlers.onRecenter();
        break;
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    input.keys.delete(e.code);
  };
  // Touches « collées » si la fenêtre perd le focus : on remet tout à zéro.
  const clear = () => resetInput();
  const onVisibility = () => {
    if (document.hidden) resetInput();
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clear);
    document.removeEventListener("visibilitychange", onVisibility);
    resetInput();
  };
}

/* ------------------------------------------------------------------ */
/* Manette (API Gamepad, interrogée à chaque image)                     */
/* ------------------------------------------------------------------ */

const DEADZONE = 0.18;
let previousButtons: boolean[] = [];

export interface GamepadHandlers {
  canPlay: () => boolean;
  onInteract: () => void;
  onPause: () => void;
  onBack: () => void;
  onVehicle?: () => void;
}

export function pollGamepad(handlers: GamepadHandlers): void {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return;
  const pad = Array.from(navigator.getGamepads()).find((p) => p && p.connected);
  if (!pad) {
    input.gamepadMove.x = 0;
    input.gamepadMove.y = 0;
    input.gamepadRun = false;
    input.gamepadThrottle = 0;
    input.gamepadDrift = false;
    return;
  }
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  const mag = Math.hypot(ax, ay);
  const playing = handlers.canPlay();
  if (mag > DEADZONE && playing) {
    const scale = Math.min(1, (mag - DEADZONE) / (1 - DEADZONE)) / mag;
    input.gamepadMove.x = ax * scale;
    input.gamepadMove.y = -ay * scale;
  } else {
    input.gamepadMove.x = 0;
    input.gamepadMove.y = 0;
  }
  const pressed = pad.buttons.map((b) => b.pressed);
  const edge = (i: number) => pressed[i] && !previousButtons[i];
  input.gamepadRun = playing && !!(pressed[7] || pressed[5] || pressed[10]);
  input.gamepadThrottle = playing ? (pad.buttons[7]?.value ?? 0) - (pad.buttons[6]?.value ?? 0) : 0;
  input.gamepadDrift = playing && !!pressed[0];
  if (playing && edge(0)) input.jumpAt = performance.now(); // A / Croix : sauter (drift en véhicule)
  if (playing && edge(2)) handlers.onInteract(); // X / Carré : interagir
  if (playing && edge(3)) (handlers.onVehicle ?? handlers.onInteract)(); // Y / Triangle : véhicule (ou interagir)
  if (edge(9)) handlers.onPause(); // Start / Options
  if (edge(1)) handlers.onBack(); // B / Rond : fermer
  previousButtons = pressed;
}
