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
    world: "lab",
    zone: "spawn",
    target: { type: "about" },
    fragments: ["whoami", "evann@lab", "uid=1000"],
  },
  {
    id: "evann.skills.networking",
    source: "Switch SW-LAB",
    world: "lab",
    zone: "baie",
    target: { type: "skill-family", id: "reseaux" },
    fragments: ["vlan 10", "192.168.10.0/24", "switchport access", "TTL=64"],
    revealedBy: "mission:lab-online",
  },
  {
    id: "evann.xp.net4business-2024.wifi",
    source: "Borne Wi-Fi",
    world: "lab",
    zone: "baie",
    target: { type: "experience", id: "net4business-2024" },
    fragments: ["SSID invités", "SSID privé", "2024"],
  },
  {
    id: "evann.skills.systems",
    source: "Hôte Proxmox",
    world: "lab",
    zone: "cluster",
    target: { type: "skill-family", id: "systemes" },
    fragments: ["qm list", "docker ps", "apt update"],
  },
  {
    id: "evann.xp.net4business-2025.proxmox",
    source: "Hyperviseur de stage",
    world: "lab",
    zone: "cluster",
    target: { type: "experience", id: "net4business-2025" },
    fragments: ["pve", "debian", "2025"],
  },
  {
    id: "evann.projects.netforge",
    source: "Écran NetForge",
    world: "lab",
    zone: "bureau",
    target: { type: "project", id: "netforge" },
    fragments: ["/26", "encapsulation dot1Q", "broadcast", "VLSM"],
  },
  {
    id: "evann.xp.net4business-2026.ventoy",
    source: "Clé d'installation",
    world: "lab",
    zone: "bureau",
    target: { type: "experience", id: "net4business-2026" },
    fragments: ["ventoy", "install.iso", "2026"],
  },
  {
    id: "evann.skills.development",
    source: "Poste de développement",
    world: "lab",
    zone: "bureau",
    target: { type: "skill-family", id: "developpement" },
    fragments: ["<html>", "front-end", "back-end"],
  },
  {
    id: "evann.skills.method",
    source: "Carnet de tests",
    world: "lab",
    zone: "bureau",
    target: { type: "skill-family", id: "methode" },
    fragments: ["test 01 : OK", "retour terrain", "étape suivante"],
  },
  {
    id: "evann.xp.efs.active-directory",
    source: "Console d'annuaire",
    world: "lab",
    zone: "parcours",
    target: { type: "experience", id: "efs-2026" },
    fragments: ["OU=Utilisateurs", "sAMAccountName", "DSI"],
  },
  {
    id: "evann.skills.support",
    source: "Poste en maintenance",
    world: "lab",
    zone: "parcours",
    target: { type: "skill-family", id: "support" },
    fragments: ["ticket N1", "MCO", "masterisation"],
  },
  // --- Circuit extérieur : loisirs et pop culture --------------------
  {
    id: "evann.hobbies.valorant",
    source: "Site A — caisses de radianite",
    world: "circuit",
    zone: "spot-valorant",
    color: "#ff5a64",
    target: { type: "hobby", id: "valorant" },
    fragments: ["clutch", "site A", "1v3"],
  },
  {
    id: "evann.hobbies.minecraft",
    source: "Structure en blocs",
    world: "circuit",
    zone: "spot-minecraft",
    color: "#7ccf4e",
    target: { type: "hobby", id: "minecraft" },
    fragments: ["redstone", "bloc par bloc", "/give"],
  },
  {
    id: "evann.hobbies.gta",
    source: "Borne d'attente GTA VI",
    world: "circuit",
    zone: "spot-gta",
    color: "#ff6fb1",
    target: { type: "hobby", id: "gta" },
    fragments: ["Los Santos", "Vice City", "wanted: 0"],
  },
  {
    id: "evann.hobbies.cinema-mecanique",
    source: "Drive-in et établi mécanique",
    world: "circuit",
    zone: "spot-cinema",
    color: "#f2a948",
    target: { type: "hobby", id: "cinema-mecanique" },
    fragments: ["V8", "pit stop", "vroum"],
  },
];

export const anomalyById = Object.fromEntries(anomalies.map((a) => [a.id, a])) as Record<
  AnomalyId,
  Anomaly
>;
