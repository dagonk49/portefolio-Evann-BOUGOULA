"use client";
/**
 * État transitoire de l'interface du lab 3D (non persisté) : panneau ouvert,
 * point d'intérêt actif, cadrage caméra, sélection de port.
 */
import { create } from "zustand";
import type { AnomalyId, ContentRef, WorldId } from "@/data/types";
import type { EndpointId } from "@/sim/scenario";

export type Panel =
  | { kind: "content"; ref: ContentRef; anomalyId?: AnomalyId }
  | { kind: "bay" }
  | { kind: "pc"; tab?: "nic" | "switch" | "diag" }
  | { kind: "index" }
  | { kind: "help" }
  | { kind: "settings" }
  | { kind: "pause" };

export interface CameraFocus {
  target: [number, number, number];
  /** Facteur de distance (1 = suivi normal). */
  distance: number;
}

export type VehicleKind = "kart" | "stockcar";

export interface TravelStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

/** Passage d'un monde à l'autre, affiché par l'écran de chargement. */
export interface Travel {
  from: WorldId | null;
  to: WorldId;
  steps: TravelStep[];
  /** Avancement global, de 0 à 1. */
  progress: number;
  done: boolean;
}

interface LabUiStore {
  panel: Panel | null;
  focus: CameraFocus | null;
  /** Identifiant de l'interactable le plus proche du joueur, ou null. */
  active: string | null;
  /** Anomalie en cours de stabilisation (animation courte). */
  stabilizing: AnomalyId | null;
  selectedPort: EndpointId | null;
  patchMessage: { text: string; tone: "info" | "ok" | "error" } | null;
  announcement: string;
  zone: string;
  /** Demande de changement de monde (traitée par la racine du lab). */
  travelRequest: WorldId | null;
  travel: Travel | null;
  /** Véhicule conduit sur le circuit, ou null à pied. */
  driving: VehicleKind | null;
  /** Où reprendre à pied en descendant du véhicule. */
  exitAt: [number, number, number] | null;
  /**
   * Horodatage de la dernière fermeture de fenêtre : le système d'interaction
   * recalcule aussitôt le point actif au lieu de garder celui d'avant.
   */
  closedAt: number;
  requestTravel: (to: WorldId) => void;
  setTravel: (travel: Travel | null) => void;
  setDriving: (kind: VehicleKind | null, exitAt?: [number, number, number] | null) => void;
  openPanel: (panel: Panel, focus?: CameraFocus | null) => void;
  closePanel: () => void;
  setActive: (id: string | null) => void;
  setStabilizing: (id: AnomalyId | null) => void;
  selectPort: (id: EndpointId | null) => void;
  setPatchMessage: (message: LabUiStore["patchMessage"]) => void;
  announce: (text: string) => void;
  setZone: (zone: string) => void;
  reset: () => void;
}

export const useLabUi = create<LabUiStore>()((set) => ({
  panel: null,
  focus: null,
  active: null,
  stabilizing: null,
  selectedPort: null,
  patchMessage: null,
  announcement: "",
  zone: "Accueil",
  travelRequest: null,
  travel: null,
  driving: null,
  exitAt: null,
  closedAt: 0,
  requestTravel: (to) => set((s) => (s.travel || s.travelRequest ? s : { travelRequest: to, panel: null })),
  setTravel: (travel) => set({ travel }),
  setDriving: (driving, exitAt = null) => set({ driving, exitAt }),
  openPanel: (panel, focus = null) => set({ panel, focus }),
  // Fermeture : tout l'état lié à la fenêtre est purgé (point actif compris), rien ne reste « collé ».
  closePanel: () =>
    set({ panel: null, focus: null, selectedPort: null, patchMessage: null, active: null, closedAt: performance.now() }),
  setActive: (active) => set((s) => (s.active === active ? s : { active })),
  setStabilizing: (stabilizing) => set({ stabilizing }),
  selectPort: (selectedPort) => set({ selectedPort }),
  setPatchMessage: (patchMessage) => set({ patchMessage }),
  announce: (announcement) => set({ announcement }),
  setZone: (zone) => set((s) => (s.zone === zone ? s : { zone })),
  reset: () =>
    set({
      panel: null,
      focus: null,
      active: null,
      stabilizing: null,
      selectedPort: null,
      announcement: "",
      travelRequest: null,
      travel: null,
      driving: null,
      exitAt: null,
    }),
}));
