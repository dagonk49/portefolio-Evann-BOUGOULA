"use client";
/**
 * État transitoire de l'interface du lab 3D (non persisté) : panneau ouvert,
 * point d'intérêt actif, cadrage caméra, sélection de port.
 */
import { create } from "zustand";
import type { AnomalyId, ContentRef } from "@/data/types";
import type { EndpointId } from "@/sim/scenario";

export type Panel =
  | { kind: "content"; ref: ContentRef; anomalyId?: AnomalyId }
  | { kind: "bay" }
  | { kind: "pc"; tab?: "nic" | "switch" | "diag" }
  | { kind: "index" }
  | { kind: "help" }
  | { kind: "pause" };

export interface CameraFocus {
  target: [number, number, number];
  /** Facteur de distance (1 = suivi normal). */
  distance: number;
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
  openPanel: (panel, focus = null) => set({ panel, focus }),
  closePanel: () => set({ panel: null, focus: null, selectedPort: null, patchMessage: null }),
  setActive: (active) => set((s) => (s.active === active ? s : { active })),
  setStabilizing: (stabilizing) => set({ stabilizing }),
  selectPort: (selectedPort) => set({ selectedPort }),
  setPatchMessage: (patchMessage) => set({ patchMessage }),
  announce: (announcement) => set({ announcement }),
  setZone: (zone) => set((s) => (s.zone === zone ? s : { zone })),
  reset: () => set({ panel: null, focus: null, active: null, stabilizing: null, selectedPort: null, announcement: "" }),
}));
