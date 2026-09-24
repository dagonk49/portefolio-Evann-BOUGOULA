import { describe, expect, it } from "vitest";
import { initialMissionFlags } from "@/sim/mission";
import { anomalies } from "@/data/anomalies";
import { availableInteractables, pickActive, zoneNameAt } from "./interaction";
import { ANOMALY_PLACEMENTS, INTERACTABLES, ISLAND } from "./layout";

describe("interactions du lab", () => {
  it("chaque anomalie a un placement sur l'île", () => {
    for (const a of anomalies) {
      const p = ANOMALY_PLACEMENTS[a.id];
      expect(p, a.id).toBeDefined();
      expect(p.ground[0]).toBeGreaterThan(ISLAND.minX);
      expect(p.ground[0]).toBeLessThan(ISLAND.maxX);
      expect(p.ground[2]).toBeGreaterThan(ISLAND.minZ);
      expect(p.ground[2]).toBeLessThan(ISLAND.maxZ);
    }
  });

  it("l'anomalie de la mission n'apparaît qu'une fois le diagnostic réussi", () => {
    const before = availableInteractables(initialMissionFlags()).map((i) => i.id);
    expect(before).not.toContain("anomaly:evann.skills.networking");
    const after = availableInteractables({ ...initialMissionFlags(), diagnosticPassed: true }).map((i) => i.id);
    expect(after).toContain("anomaly:evann.skills.networking");
  });

  it("sélectionne le point le plus proche dans son rayon, avec hystérésis", () => {
    const list = INTERACTABLES;
    const bay = list.find((i) => i.id === "baie.patch")!;
    expect(pickActive(bay.position[0], bay.position[2], list, null)).toBe("baie.patch");
    expect(pickActive(0, -2, list, null)).toBeNull();
    // Juste hors du rayon, l'actif courant est conservé grâce à l'hystérésis.
    expect(pickActive(bay.position[0] + bay.radius + 0.2, bay.position[2], list, "baie.patch")).toBe("baie.patch");
    expect(pickActive(bay.position[0] + bay.radius + 1, bay.position[2], list, "baie.patch")).toBeNull();
  });

  it("les dalles ne se chevauchent pas au point de se masquer", () => {
    const pads = INTERACTABLES;
    for (const a of pads) {
      expect(pickActive(a.position[0], a.position[2], pads, null), a.id).toBe(a.id);
    }
  });

  it("nomme la zone courante", () => {
    expect(zoneNameAt(-18, 8)).toBe("Baie réseau");
    expect(zoneNameAt(11, -17)).toBe("Bureau et atelier");
    expect(zoneNameAt(4, 4)).toBe("Accueil");
  });
});
