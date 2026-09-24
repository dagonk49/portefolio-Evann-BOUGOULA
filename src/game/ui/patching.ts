/**
 * Brassage : logique partagée par le panneau HTML de la baie et les ports
 * cliquables en 3D. Deux clics = un câble, avec un retour lisible.
 */
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { audioEngine } from "@/audio/AudioEngine";
import { cableAt, endpointLabel, isFixedEndpoint, linkStatus, type ActiveEndpoint } from "@/sim/network";
import { explainLink } from "@/sim/diagnostics";
import { ENDPOINT_BY_ID, type EndpointId } from "@/sim/scenario";

export function clickPort(id: EndpointId): void {
  const ui = useLabUi.getState();
  const app = useApp.getState();
  const def = ENDPOINT_BY_ID[id];
  if (!def?.selectable) return;
  const selected = ui.selectedPort;
  if (!selected) {
    if (isFixedEndpoint(id)) {
      ui.setPatchMessage({ text: `${endpointLabel(id)} est déjà relié par une liaison préconfigurée.`, tone: "info" });
      return;
    }
    ui.selectPort(id);
    const occupied = cableAt(app.progress.lab, id);
    ui.setPatchMessage({
      text: occupied
        ? `${endpointLabel(id)} sélectionné : il est déjà câblé. Utilise « Débrancher » pour libérer ce port.`
        : `${endpointLabel(id)} sélectionné. Choisis maintenant l'autre extrémité du câble.`,
      tone: "info",
    });
    return;
  }
  if (selected === id) {
    ui.selectPort(null);
    ui.setPatchMessage({ text: "Sélection annulée.", tone: "info" });
    return;
  }
  const result = app.plugCable(selected, id);
  ui.selectPort(null);
  if (!result.ok) {
    audioEngine.cue("error");
    ui.setPatchMessage({ text: result.reason, tone: "error" });
    return;
  }
  audioEngine.cue("plug");
  const lab = useApp.getState().progress.lab;
  ui.setPatchMessage({ text: `Câble branché : ${endpointLabel(selected)} ↔ ${endpointLabel(id)}. ${describeAfterPlug(lab, selected, id)}`, tone: "ok" });
}

function describeAfterPlug(lab: ReturnType<typeof useApp.getState>["progress"]["lab"], a: EndpointId, b: EndpointId): string {
  if ([a, b].includes("pp-02")) return explainLink(lab, "pc-eth0");
  if ([a, b].includes("srv-eth0")) return explainLink(lab, "srv-eth0");
  const active = [a, b].find((x) => ENDPOINT_BY_ID[x].role !== "patch") as ActiveEndpoint | undefined;
  if (active) return linkStatus(lab, active).up ? "Liaison active." : "Pas de liaison : aucun équipement actif au bout.";
  return "";
}

export function unplugPort(id: EndpointId): void {
  const app = useApp.getState();
  app.unplugCable(id);
  audioEngine.cue("unplug");
  useLabUi.getState().selectPort(null);
  useLabUi.getState().setPatchMessage({ text: `${endpointLabel(id)} débranché.`, tone: "info" });
}
