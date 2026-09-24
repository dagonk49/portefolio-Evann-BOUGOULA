/**
 * Progression de la mission « Remettre le poste du lab en ligne ».
 * Les étapes sont déduites de l'état du lab et de quelques drapeaux :
 * le rendu 3D ne décide jamais de l'avancement.
 */
import { linkStatus, portConfig, switchPortOf, type LabState } from "./network";
import { ENDPOINT_BY_ID } from "./scenario";

export type MissionStepId = "inspect" | "cable" | "open-pc" | "configure" | "diagnose" | "stabilize";

export interface MissionFlags {
  bayInspected: boolean;
  pcOpened: boolean;
  /** Dernier diagnostic lancé réussi (drapeau conservé). */
  diagnosticPassed: boolean;
  /** L'anomalie révélée par la mission a été stabilisée. */
  stabilized: boolean;
}

export const initialMissionFlags = (): MissionFlags => ({
  bayInspected: false,
  pcOpened: false,
  diagnosticPassed: false,
  stabilized: false,
});

export interface MissionStep {
  id: MissionStepId;
  title: string;
  where: string;
  /** Indices progressifs : du plus général au plus précis. */
  hints: string[];
}

export const MISSION_STEPS: MissionStep[] = [
  {
    id: "inspect",
    title: "Identifier le poste, le switch et le serveur",
    where: "Baie réseau",
    hints: [
      "La baie réseau est à gauche de l'accueil. Approche-toi de la dalle lumineuse devant le rack.",
      "Dans la fiche de la baie, repère d'où arrive le poste : chaque port du panneau de brassage porte l'étiquette de sa prise murale.",
    ],
  },
  {
    id: "cable",
    title: "Brancher le poste et le serveur sur le switch",
    where: "Baie réseau",
    hints: [
      "Le poste PC-LAB arrive sur la prise B-02, donc sur le port PP-02 du panneau de brassage.",
      "Relie PP-02 à un port d'accès libre du switch (Gi0/2 à Gi0/7), puis relie eth0 de SRV-LAB à un autre port d'accès.",
      "Évite Gi0/5 (désactivé), les cages SFP Gi0/9-10 et le port console : ils ne donneront pas de liaison Ethernet.",
    ],
  },
  {
    id: "open-pc",
    title: "Ouvrir la console d'administration du poste",
    where: "Bureau",
    hints: ["Le poste PC-LAB est sur le bureau, à droite de l'accueil. Utilise la dalle devant l'écran."],
  },
  {
    id: "configure",
    title: "Configurer le VLAN d'accès et l'IPv4 du poste",
    where: "Bureau — console du poste",
    hints: [
      "Le serveur et la passerelle sont dans le VLAN 10 « LAB », réseau 192.168.10.0/24.",
      "Dans l'onglet Switch, place les deux ports utilisés dans le VLAN 10.",
      "Dans l'onglet Carte réseau, passe en statique : 192.168.10.42, masque /24 (255.255.255.0), passerelle 192.168.10.1.",
    ],
  },
  {
    id: "diagnose",
    title: "Lancer le diagnostic et lire le résultat",
    where: "Bureau — console du poste",
    hints: [
      "L'onglet Diagnostic teste la liaison, l'adresse, le serveur, la passerelle et un autre réseau.",
      "Chaque test en échec explique pourquoi : corrige l'élément signalé puis relance.",
    ],
  },
  {
    id: "stabilize",
    title: "Stabiliser l'anomalie apparue dans la baie",
    where: "Baie réseau",
    hints: ["Le lien est rétabli : une anomalie s'est formée au-dessus du switch. Approche-toi et interagis."],
  },
];

export function isCabled(state: LabState): boolean {
  for (const nic of ["pc-eth0", "srv-eth0"] as const) {
    const link = linkStatus(state, nic);
    if (!link.up || ENDPOINT_BY_ID[link.peer].role !== "switchport") return false;
  }
  return true;
}

/** Configuration saisie (sans préjuger de sa justesse, vérifiée par le diagnostic). */
export function isConfigured(state: LabState): boolean {
  if (state.pc.mode !== "static") return false;
  const pcPort = switchPortOf(state, "pc-eth0");
  const srvPort = switchPortOf(state, "srv-eth0");
  if (!pcPort || !srvPort) return false;
  return portConfig(state, pcPort).vlan !== 1 && portConfig(state, srvPort).vlan !== 1;
}

export function stepCompletion(state: LabState, flags: MissionFlags): Record<MissionStepId, boolean> {
  return {
    inspect: flags.bayInspected,
    cable: isCabled(state) || flags.diagnosticPassed,
    "open-pc": flags.pcOpened,
    configure: isConfigured(state) || flags.diagnosticPassed,
    diagnose: flags.diagnosticPassed,
    stabilize: flags.stabilized,
  };
}

export function currentStep(state: LabState, flags: MissionFlags): MissionStep | null {
  const done = stepCompletion(state, flags);
  return MISSION_STEPS.find((s) => !done[s.id]) ?? null;
}
