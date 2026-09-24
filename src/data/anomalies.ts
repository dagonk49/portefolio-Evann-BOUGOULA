import type { Anomaly, AnomalyId } from "./types";

/**
 * Anomalies du lab : des fragments de code qui s'échappent des machines.
 * Chacune pointe vers un vrai contenu partagé (`target`). Les positions 3D
 * sont définies séparément dans `src/game/layout.ts`.
 */
export const anomalies: Anomaly[] = [
  {
    id: "evann.profile.about",
    source: "Borne d'accueil",
    zone: "spawn",
    target: { type: "about" },
    fragments: ["whoami", "evann@lab", "uid=1000"],
  },
  {
    id: "evann.skills.networking",
    source: "Switch SW-LAB",
    zone: "baie",
    target: { type: "skill-family", id: "reseaux" },
    fragments: ["vlan 10", "192.168.10.0/24", "switchport access", "TTL=64"],
    revealedBy: "mission:lab-online",
  },
  {
    id: "evann.xp.net4business-2024.wifi",
    source: "Borne Wi-Fi",
    zone: "baie",
    target: { type: "experience", id: "net4business-2024" },
    fragments: ["SSID invités", "SSID privé", "2024"],
  },
  {
    id: "evann.skills.systems",
    source: "Hôte Proxmox",
    zone: "cluster",
    target: { type: "skill-family", id: "systemes" },
    fragments: ["qm list", "docker ps", "apt update"],
  },
  {
    id: "evann.xp.net4business-2025.proxmox",
    source: "Hyperviseur de stage",
    zone: "cluster",
    target: { type: "experience", id: "net4business-2025" },
    fragments: ["pve", "debian", "2025"],
  },
  {
    id: "evann.projects.netforge",
    source: "Écran NetForge",
    zone: "bureau",
    target: { type: "project", id: "netforge" },
    fragments: ["/26", "encapsulation dot1Q", "broadcast", "VLSM"],
  },
  {
    id: "evann.xp.net4business-2026.ventoy",
    source: "Clé d'installation",
    zone: "bureau",
    target: { type: "experience", id: "net4business-2026" },
    fragments: ["ventoy", "install.iso", "2026"],
  },
  {
    id: "evann.skills.development",
    source: "Poste de développement",
    zone: "bureau",
    target: { type: "skill-family", id: "developpement" },
    fragments: ["<html>", "front-end", "back-end"],
  },
  {
    id: "evann.skills.method",
    source: "Carnet de tests",
    zone: "bureau",
    target: { type: "skill-family", id: "methode" },
    fragments: ["test 01 : OK", "retour terrain", "étape suivante"],
  },
  {
    id: "evann.xp.efs.active-directory",
    source: "Console d'annuaire",
    zone: "parcours",
    target: { type: "experience", id: "efs-2026" },
    fragments: ["OU=Utilisateurs", "sAMAccountName", "DSI"],
  },
  {
    id: "evann.skills.support",
    source: "Poste en maintenance",
    zone: "parcours",
    target: { type: "skill-family", id: "support" },
    fragments: ["ticket N1", "MCO", "masterisation"],
  },
];

export const anomalyById = Object.fromEntries(anomalies.map((a) => [a.id, a])) as Record<
  AnomalyId,
  Anomaly
>;
