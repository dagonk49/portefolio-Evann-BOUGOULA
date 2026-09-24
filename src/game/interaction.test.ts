import { describe, expect, it } from "vitest";
import { initialMissionFlags } from "@/sim/mission";
import { anomalies } from "@/data/anomalies";
import { anomaliesOf, availableInteractables, pickActive, zoneNameAt } from "./interaction";
import { ANOMALY_PLACEMENTS, INTERACTABLES, ISLAND } from "./layout";
import { CIRCUIT_INTERACTABLES, onTrack, TRACK } from "./circuit/layout";

describe("interactions du lab", () => {
  it("chaque anomalie du lab a un placement sur l'île", () => {
    for (const a of anomaliesOf("lab")) {
      const p = ANOMALY_PLACEMENTS[a.id];
      expect(p, a.id).toBeDefined();
      expect(p.ground[0]).toBeGreaterThan(ISLAND.minX);
      expect(p.ground[0]).toBeLessThan(ISLAND.maxX);
      expect(p.ground[2]).toBeGreaterThan(ISLAND.minZ);
      expect(p.ground[2]).toBeLessThan(ISLAND.maxZ);
    }
  });

  it("chaque anomalie du circuit est dans l'infield, hors de la piste", () => {
    const circuit = anomaliesOf("circuit");
    expect(circuit.map((a) => a.id)).toEqual([
      "evann.hobbies.valorant",
      "evann.hobbies.minecraft",
      "evann.hobbies.gta",
      "evann.hobbies.cinema-mecanique",
    ]);
    for (const a of circuit) {
      const p = ANOMALY_PLACEMENTS[a.id];
      expect(onTrack(p.ground[0], p.ground[2], 1), a.id).toBe(false);
      expect(Math.abs(p.ground[2])).toBeLessThan(TRACK.R - TRACK.width / 2);
    }
    expect(anomalies.every((a) => a.world === "lab" || a.world === "circuit")).toBe(true);
  });

  it("sépare les points d'intérêt des deux mondes", () => {
    const mission = initialMissionFlags();
    const lab = availableInteractables(mission, "lab").map((i) => i.id);
    const circuit = availableInteractables(mission, "circuit").map((i) => i.id);
    expect(lab).toContain("lab.sas");
    expect(lab).not.toContain("circuit.sas");
    expect(lab).not.toContain("anomaly:evann.hobbies.valorant");
    expect(circuit).toContain("circuit.sas");
    expect(circuit).toContain("anomaly:evann.hobbies.gta");
    expect(circuit).not.toContain("anomaly:evann.profile.about");
    expect(CIRCUIT_INTERACTABLES.find((i) => i.id === "circuit.sas")?.action).toEqual({ type: "travel", to: "lab" });
    expect(INTERACTABLES.find((i) => i.id === "lab.sas")?.action).toEqual({ type: "travel", to: "circuit" });
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
    expect(zoneNameAt(-18.6, -21.3)).toBe("Sas du circuit");
    expect(zoneNameAt(0, 9, "circuit")).toBe("Paddock et sas");
  });
});
