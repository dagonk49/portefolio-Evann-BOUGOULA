import { describe, expect, it } from "vitest";
import { sanitize } from "./app";

describe("stockage versionné : relecture et migrations", () => {
  it("valeurs par défaut : son coupé, tutoriel à afficher, lab, mode course verrouillé", () => {
    const d = sanitize(null);
    expect(d.audio).toEqual({ muted: true, music: 0.7, sfx: 0.8 });
    expect(d.settings.tutorial).toBe("pending");
    expect(d.world).toBe("lab");
    expect(d.isNascarUnlocked).toBe(false);
  });

  it("reprend les anciens réglages (carte d'accueil vue, son v1, volume unique v2.0)", () => {
    const d = sanitize({
      settings: { quality: "low", autoQuality: false, effects: null, helpSeen: true, sound: true } as never,
      audio: { muted: false, volume: 0.4 } as never,
    });
    expect(d.settings.tutorial).toBe("done");
    expect(d.settings).not.toHaveProperty("helpSeen");
    expect(d.settings).not.toHaveProperty("sound");
    expect(d.audio).toEqual({ muted: false, music: 0.4, sfx: 0.4 });
    expect(sanitize({ settings: { sound: true } as never }).audio.muted).toBe(false);
  });

  it("rejette les valeurs invalides", () => {
    const d = sanitize({
      settings: { quality: "ultra", tutorial: "maybe" } as never,
      audio: { muted: "oui", music: 3, sfx: -1 } as never,
      world: "moon" as never,
      isNascarUnlocked: "true" as never,
      bestLap: -5,
    });
    expect(d.settings.quality).toBe("high");
    expect(d.settings.tutorial).toBe("pending");
    expect(d.audio).toEqual({ muted: true, music: 0.7, sfx: 0.8 });
    expect(d.world).toBe("lab");
    expect(d.isNascarUnlocked).toBe(false);
    expect(d.bestLap).toBeNull();
  });

  it("conserve un tutoriel ignoré et le mode course débloqué", () => {
    const d = sanitize({ settings: { tutorial: "skipped" } as never, isNascarUnlocked: true, world: "circuit" });
    expect(d.settings.tutorial).toBe("skipped");
    expect(d.isNascarUnlocked).toBe(true);
    expect(d.world).toBe("circuit");
  });
});
