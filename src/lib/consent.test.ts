import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CONSENT_KEY, CONSENT_TTL_MS, clearConsent, preferencesAllowed, readConsent, writeConsent } from "./consent";
import { STORAGE_KEY, STORAGE_TTL_MS, loadPersisted, savePersisted } from "./storage";

/** Stockage en mémoire, installé comme `window.localStorage`. */
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

describe("consentement et stockage local", () => {
  let store: Storage;
  beforeEach(() => {
    store = fakeStorage();
    (globalThis as { window?: unknown }).window = { localStorage: store, sessionStorage: fakeStorage() };
    clearConsent();
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("sans choix : rien n'est lu ni écrit", () => {
    expect(readConsent()).toBeNull();
    expect(preferencesAllowed()).toBe(false);
    expect(savePersisted({ a: 1 })).toBe(false);
    expect(store.getItem(STORAGE_KEY)).toBeNull();
    store.setItem(STORAGE_KEY, JSON.stringify({ v: 1, savedAt: new Date().toISOString(), data: { a: 1 } }));
    expect(loadPersisted()).toBeNull();
  });

  it("accord : préférences enregistrées et relues ; refus : plus rien", () => {
    writeConsent(true);
    expect(preferencesAllowed()).toBe(true);
    expect(savePersisted({ a: 1 })).toBe(true);
    expect(loadPersisted<{ a: number }>()).toEqual({ a: 1 });
    writeConsent(false);
    expect(preferencesAllowed()).toBe(false);
    expect(loadPersisted()).toBeNull();
    expect(JSON.parse(store.getItem(CONSENT_KEY)!)).toMatchObject({ v: 1, preferences: false });
  });

  it("le choix expire après 6 mois ; les préférences après 13 mois", () => {
    const now = Date.now();
    writeConsent(true, now - CONSENT_TTL_MS - 1000);
    expect(readConsent(now)).toBeNull();
    writeConsent(true, now);
    store.setItem(STORAGE_KEY, JSON.stringify({ v: 1, savedAt: new Date(now - STORAGE_TTL_MS - 1000).toISOString(), data: { a: 1 } }));
    expect(loadPersisted()).toBeNull();
    expect(store.getItem(STORAGE_KEY)).toBeNull();
  });

  it("un enregistrement malformé est ignoré", () => {
    store.setItem(CONSENT_KEY, "{pas du json");
    expect(readConsent()).toBeNull();
    store.setItem(CONSENT_KEY, JSON.stringify({ v: 2, preferences: true, decidedAt: new Date().toISOString() }));
    expect(readConsent()).toBeNull();
  });
});
