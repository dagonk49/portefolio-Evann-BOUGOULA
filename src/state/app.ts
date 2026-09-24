"use client";
/**
 * État applicatif partagé par les deux modes : préférence de mode, réglages
 * et progression du lab. Seul ce qui est utile est persisté (format versionné).
 */
import { create } from "zustand";
import type { AnomalyId } from "@/data/types";
import { anomalyById } from "@/data/anomalies";
import { clearPersisted, loadPersisted, savePersisted, storageAvailable } from "@/lib/storage";
import {
  canPlug,
  initialLabState,
  plug,
  unplug,
  type LabState,
  type PcConfig,
  type PlugCheck,
} from "@/sim/network";
import { runDiagnostic, type DiagnosticReport } from "@/sim/diagnostics";
import { initialMissionFlags, type MissionFlags, type MissionStepId } from "@/sim/mission";
import { EDITABLE_PORTS, ENDPOINT_BY_ID, type EditablePortId, type EndpointId } from "@/sim/scenario";

export type Mode = "sober" | "lab";
export type AnomalyState = "spotted" | "viewed";

export interface Settings {
  quality: "high" | "low";
  /** Baisse automatique de la qualité si l'animation n'est pas fluide. */
  autoQuality: boolean;
  sound: boolean;
  /** `null` : suit la préférence système de réduction des mouvements. */
  effects: boolean | null;
  helpSeen: boolean;
}

export interface Progress {
  anomalies: Partial<Record<AnomalyId, AnomalyState>>;
  lab: LabState;
  mission: MissionFlags;
  hints: Partial<Record<MissionStepId, number>>;
  player: [number, number, number] | null;
}

interface PersistedData {
  modePreference: Mode | null;
  settings: Settings;
  progress: Progress;
}

const defaultSettings = (): Settings => ({ quality: "high", autoQuality: true, sound: false, effects: null, helpSeen: false });
const defaultProgress = (): Progress => ({
  anomalies: {},
  lab: initialLabState(),
  mission: initialMissionFlags(),
  hints: {},
  player: null,
});

interface AppStore extends PersistedData {
  hydrated: boolean;
  storageOk: boolean;
  mode: Mode;
  /** Ancre à afficher en arrivant dans le mode sobre (depuis une fiche 3D). */
  pendingAnchor: string | null;
  lastReport: DiagnosticReport | null;

  hydrate: () => void;
  setMode: (mode: Mode, options?: { anchor?: string; remember?: boolean }) => void;
  consumeAnchor: () => string | null;
  updateSettings: (patch: Partial<Settings>) => void;

  spotAnomaly: (id: AnomalyId) => void;
  viewAnomaly: (id: AnomalyId) => void;

  plugCable: (a: EndpointId, b: EndpointId) => PlugCheck;
  unplugCable: (endpoint: EndpointId) => void;
  setPort: (port: EditablePortId, patch: Partial<LabState["ports"][EditablePortId]>) => void;
  setPcConfig: (config: PcConfig) => void;
  runLabDiagnostic: () => DiagnosticReport;
  markMission: (flag: "bayInspected" | "pcOpened") => void;
  revealHint: (step: MissionStepId, max: number) => void;
  resetMission: () => void;
  resetAll: () => void;
  savePlayer: (pos: [number, number, number]) => void;
}

/** Vérifie une progression relue depuis le stockage (données potentiellement anciennes). */
function sanitize(data: Partial<PersistedData> | null): PersistedData {
  const base: PersistedData = { modePreference: null, settings: defaultSettings(), progress: defaultProgress() };
  if (!data || typeof data !== "object") return base;
  const settings = { ...base.settings, ...(data.settings ?? {}) };
  if (settings.quality !== "high" && settings.quality !== "low") settings.quality = "high";
  const p = data.progress;
  const progress = defaultProgress();
  if (p && typeof p === "object") {
    for (const [id, st] of Object.entries(p.anomalies ?? {})) {
      if (id in anomalyById && (st === "spotted" || st === "viewed")) progress.anomalies[id as AnomalyId] = st;
    }
    progress.mission = { ...progress.mission, ...(p.mission ?? {}) };
    progress.hints = { ...(p.hints ?? {}) };
    if (Array.isArray(p.player) && p.player.length === 3 && p.player.every((n) => Number.isFinite(n))) {
      progress.player = p.player as [number, number, number];
    }
    const lab = p.lab;
    if (lab && Array.isArray(lab.cables) && lab.ports && lab.pc) {
      let rebuilt = initialLabState();
      for (const c of lab.cables) {
        if (c && c.a in ENDPOINT_BY_ID && c.b in ENDPOINT_BY_ID) rebuilt = plug(rebuilt, c.a, c.b);
      }
      for (const id of EDITABLE_PORTS) {
        const cfg = lab.ports[id];
        if (cfg && [1, 10, 20].includes(cfg.vlan) && typeof cfg.shutdown === "boolean") rebuilt.ports[id] = { ...cfg };
      }
      if (lab.pc.mode === "dhcp") rebuilt.pc = { mode: "dhcp" };
      else if (lab.pc.mode === "static" && Number.isFinite(lab.pc.ip) && Number.isFinite(lab.pc.prefix)) rebuilt.pc = lab.pc;
      progress.lab = rebuilt;
    }
  }
  const modePreference = data.modePreference === "lab" || data.modePreference === "sober" ? data.modePreference : null;
  return { modePreference, settings, progress };
}

export const useApp = create<AppStore>()((set, get) => ({
  modePreference: null,
  settings: defaultSettings(),
  progress: defaultProgress(),
  hydrated: false,
  storageOk: false,
  mode: "sober",
  pendingAnchor: null,
  lastReport: null,

  hydrate: () => {
    if (get().hydrated) return;
    const data = sanitize(loadPersisted<PersistedData>());
    set({ ...data, hydrated: true, storageOk: storageAvailable() });
  },

  setMode: (mode, options) =>
    set((s) => ({
      mode,
      modePreference: options?.remember === false ? s.modePreference : mode,
      pendingAnchor: options?.anchor ?? null,
    })),

  consumeAnchor: () => {
    const anchor = get().pendingAnchor;
    if (anchor) set({ pendingAnchor: null });
    return anchor;
  },

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  spotAnomaly: (id) =>
    set((s) => (s.progress.anomalies[id] ? s : { progress: { ...s.progress, anomalies: { ...s.progress.anomalies, [id]: "spotted" } } })),

  viewAnomaly: (id) =>
    set((s) => {
      const mission = anomalyById[id]?.revealedBy === "mission:lab-online" ? { ...s.progress.mission, stabilized: true } : s.progress.mission;
      return { progress: { ...s.progress, mission, anomalies: { ...s.progress.anomalies, [id]: "viewed" } } };
    }),

  plugCable: (a, b) => {
    const lab = get().progress.lab;
    const check = canPlug(lab, a, b);
    if (check.ok) set((s) => ({ progress: { ...s.progress, lab: plug(lab, a, b) } }));
    return check;
  },

  unplugCable: (endpoint) => set((s) => ({ progress: { ...s.progress, lab: unplug(s.progress.lab, endpoint) } })),

  setPort: (port, patch) =>
    set((s) => ({
      progress: {
        ...s.progress,
        lab: { ...s.progress.lab, ports: { ...s.progress.lab.ports, [port]: { ...s.progress.lab.ports[port], ...patch } } },
      },
    })),

  setPcConfig: (config) => set((s) => ({ progress: { ...s.progress, lab: { ...s.progress.lab, pc: config } } })),

  runLabDiagnostic: () => {
    const report = runDiagnostic(get().progress.lab);
    set((s) => ({
      lastReport: report,
      progress: report.success ? { ...s.progress, mission: { ...s.progress.mission, diagnosticPassed: true } } : s.progress,
    }));
    return report;
  },

  markMission: (flag) =>
    set((s) => (s.progress.mission[flag] ? s : { progress: { ...s.progress, mission: { ...s.progress.mission, [flag]: true } } })),

  revealHint: (step, max) =>
    set((s) => ({
      progress: { ...s.progress, hints: { ...s.progress.hints, [step]: Math.min(max, (s.progress.hints[step] ?? 0) + 1) } },
    })),

  resetMission: () =>
    set((s) => {
      const anomalies = { ...s.progress.anomalies };
      delete anomalies["evann.skills.networking"];
      return {
        lastReport: null,
        progress: { ...s.progress, lab: initialLabState(), mission: initialMissionFlags(), hints: {}, anomalies },
      };
    }),

  resetAll: () => {
    clearPersisted();
    set({ modePreference: null, settings: defaultSettings(), progress: defaultProgress(), lastReport: null });
  },

  savePlayer: (pos) => set((s) => ({ progress: { ...s.progress, player: pos } })),
}));

/* Sauvegarde différée après hydratation. */
if (typeof window !== "undefined") {
  let timer: number | undefined;
  useApp.subscribe((state, prev) => {
    if (!state.hydrated) return;
    if (state.settings === prev.settings && state.progress === prev.progress && state.modePreference === prev.modePreference) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const { modePreference, settings, progress } = useApp.getState();
      savePersisted<PersistedData>({ modePreference, settings, progress });
    }, 250);
  });
}

/** Les effets visuels décoratifs sont-ils actifs ? */
export function effectsEnabled(settings: Settings, reducedMotion: boolean): boolean {
  return settings.effects ?? !reducedMotion;
}
