"use client";
/**
 * État du bandeau de consentement : choix du visiteur et ouverture du panneau
 * « Personnaliser » (aussi accessible par « Gérer les cookies » en pied de page).
 */
import { create } from "zustand";
import { readConsent, writeConsent } from "@/lib/consent";
import { clearPersisted } from "@/lib/storage";
import { persistAppState } from "./app";

interface ConsentStore {
  /** Lecture du choix effectuée (côté navigateur). */
  ready: boolean;
  /** Un choix valide existe (accord ou refus, moins de 6 mois). */
  decided: boolean;
  preferences: boolean;
  panelOpen: boolean;
  init: () => void;
  acceptAll: () => void;
  refuseAll: () => void;
  save: (preferences: boolean) => void;
  openPanel: () => void;
  closePanel: () => void;
}

export const useConsent = create<ConsentStore>((set, get) => ({
  ready: false,
  decided: false,
  preferences: false,
  panelOpen: false,
  init: () => {
    if (get().ready) return;
    const rec = readConsent();
    set({ ready: true, decided: rec !== null, preferences: rec?.preferences ?? false });
  },
  acceptAll: () => get().save(true),
  refuseAll: () => get().save(false),
  save: (preferences) => {
    writeConsent(preferences);
    if (preferences) persistAppState();
    else clearPersisted();
    set({ decided: true, preferences, panelOpen: false });
  },
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
}));
