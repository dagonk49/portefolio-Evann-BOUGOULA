import type { Skill, SkillFamily, SkillId } from "./types";
import { SOURCE_LINKEDIN } from "./profile";

export const skillFamilies: SkillFamily[] = [
  {
    id: "reseaux",
    label: "Réseaux",
    description: "Adressage, segmentation, équipements actifs et accès distants.",
  },
  {
    id: "systemes",
    label: "Systèmes et virtualisation",
    description: "Hyperviseurs, conteneurs, serveurs Linux et Windows, annuaire.",
  },
  {
    id: "developpement",
    label: "Développement web et outils",
    description: "Interfaces et applications web au service de l'infrastructure.",
  },
  {
    id: "support",
    label: "Support et maintenance",
    description: "Assistance aux utilisateurs, incidents et maintien en condition opérationnelle.",
  },
  {
    id: "methode",
    label: "Méthode et pratique",
    description: "Apprendre sur le terrain : alternance, stages et interventions concrètes.",
  },
  {
    id: "secourisme",
    label: "Secourisme",
    description: "Relève des certifications (SST), pas des compétences techniques.",
  },
];

const EFS = { type: "experience", id: "efs-2026" } as const;
const N4B_2024 = { type: "experience", id: "net4business-2024" } as const;
const N4B_2025 = { type: "experience", id: "net4business-2025" } as const;
const N4B_2026 = { type: "experience", id: "net4business-2026" } as const;
const BTS = { type: "education", id: "bts-sio-sisr" } as const;
const CIEL = { type: "education", id: "bac-pro-ciel" } as const;
const NETFORGE = { type: "project", id: "netforge" } as const;
const HOMELAB = { type: "homelab" } as const;

/**
 * Les 26 compétences du profil, dans l'ordre d'origine.
 * `sourceLabel` conserve l'intitulé exact ; `label` est la version affichée.
 */
export const skills: Skill[] = [
  {
    id: "frontend-dev",
    label: "Développement front-end",
    sourceLabel: "Développement front-end",
    aliases: ["front-end", "frontend"],
    family: "developpement",
    contexts: [{ kind: "projet", ref: NETFORGE, note: "Outil web personnel pour la conception réseau." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "web-apps",
    label: "Applications web",
    sourceLabel: "Applications web",
    aliases: ["web"],
    family: "developpement",
    contexts: [{ kind: "projet", ref: NETFORGE, note: "Boîte à outils réseau conçue comme une application web." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "servers",
    label: "Serveurs",
    sourceLabel: "Serveurs",
    aliases: ["serveur"],
    family: "systemes",
    contexts: [
      { kind: "entreprise", ref: N4B_2025, note: "Mise en place d'un hyperviseur Proxmox sous Debian." },
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Hyperviseur Proxmox et VM de mon HomeLab." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "maintenance-management",
    label: "Gestion de la maintenance",
    sourceLabel: "Gestion de la maintenance",
    aliases: ["MCO"],
    family: "support",
    contexts: [
      { kind: "entreprise", ref: EFS, note: "MCO et gestion du parc régional." },
      { kind: "formation", ref: CIEL, note: "Maintenance, support et MCO étudiés au lycée." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "backend-dev",
    label: "Développement web back-end",
    sourceLabel: "Développement web back-end",
    aliases: ["back-end", "backend"],
    family: "developpement",
    contexts: [{ kind: "projet", ref: NETFORGE, note: "Logique de calcul et de génération de configurations." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "first-aid-certification",
    label: "Certification de secouriste",
    sourceLabel: "Certification de secouriste",
    aliases: ["SST", "secourisme"],
    family: "secourisme",
    certificationId: "sst",
    contexts: [],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "technical-support",
    label: "Support technique",
    sourceLabel: "Support technique",
    aliases: ["support", "helpdesk", "N1"],
    family: "support",
    featured: false,
    contexts: [
      { kind: "entreprise", ref: EFS, note: "Support N1 : demandes et incidents du quotidien." },
      { kind: "entreprise", ref: N4B_2026, note: "Assistance au support technique." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "active-directory",
    label: "Active Directory",
    sourceLabel: "Active Directory",
    aliases: ["AD"],
    family: "systemes",
    contexts: [
      { kind: "entreprise", ref: EFS, note: "Gestion des accès et des comptes, conformité de l'annuaire." },
      { kind: "formation", ref: BTS, note: "Active Directory et GPO au programme du BTS." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "ubiquiti-unifi",
    label: "Ubiquiti UniFi",
    sourceLabel: "Ubiquiti UniFi",
    aliases: ["UniFi"],
    family: "reseaux",
    displayGroup: "ubiquiti",
    featured: true,
    contexts: [{ kind: "entreprise", ref: N4B_2024, note: "Déploiement d'un Wi-Fi Ubiquiti avec réseaux invités et privés." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "proxmox",
    label: "Proxmox",
    sourceLabel: "Proxmox",
    aliases: ["Proxmox VE", "PVE"],
    family: "systemes",
    featured: true,
    contexts: [
      { kind: "entreprise", ref: N4B_2025, note: "Mise en place d'un hyperviseur Proxmox sous Debian." },
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Socle de mon HomeLab." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "cisco-ios",
    label: "Cisco IOS",
    sourceLabel: "Cisco IOS",
    aliases: ["IOS", "Cisco CLI"],
    family: "reseaux",
    featured: true,
    contexts: [
      { kind: "projet", ref: NETFORGE, note: "Génération de configurations Cisco IOS." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "field-training",
    label: "Formation sur le terrain",
    sourceLabel: "Formation sur le terrain",
    aliases: [],
    family: "methode",
    contexts: [
      { kind: "entreprise", ref: N4B_2024, note: "Stage en entreprise." },
      { kind: "entreprise", ref: N4B_2025, note: "Stage en entreprise." },
      { kind: "entreprise", ref: N4B_2026, note: "Stage en entreprise." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "work-based-learning",
    label: "Apprentissage en milieu de travail",
    sourceLabel: "Apprentissage en milieu de travail",
    aliases: ["alternance"],
    family: "methode",
    contexts: [{ kind: "entreprise", ref: EFS, note: "Alternance à la DSI régionale de l'EFS." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "hands-on-training",
    label: "Formation pratique",
    sourceLabel: "Formation pratique",
    aliases: [],
    family: "methode",
    contexts: [
      { kind: "entreprise", ref: N4B_2024, note: "Stage en entreprise." },
      { kind: "entreprise", ref: N4B_2025, note: "Stage en entreprise." },
      { kind: "entreprise", ref: N4B_2026, note: "Stage en entreprise." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "field-technicians",
    label: "Technicien de terrain",
    sourceLabel: "Techniciens de terrain",
    aliases: ["terrain"],
    family: "methode",
    contexts: [{ kind: "entreprise", ref: EFS, note: "Déploiement et maintenance du matériel régional." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "technical-maintenance",
    label: "Maintenance technique",
    sourceLabel: "Maintenance technique",
    aliases: ["maintenance"],
    family: "support",
    contexts: [
      { kind: "entreprise", ref: EFS, note: "Masterisation et maintenance du matériel régional." },
      { kind: "formation", ref: CIEL, note: "Diagnostic matériel et logiciel." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "vpn",
    label: "VPN",
    sourceLabel: "Virtual Private Network (VPN)",
    aliases: ["Virtual Private Network", "WireGuard"],
    family: "reseaux",
    contexts: [
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Pratique personnelle de WireGuard." },
      { kind: "formation", ref: BTS, note: "VPN au programme cybersécurité du BTS." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "nat",
    label: "NAT",
    sourceLabel: "Network Address Translation (NAT)",
    aliases: ["Network Address Translation"],
    family: "reseaux",
    contexts: [],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "vlan",
    label: "VLAN",
    sourceLabel: "VLAN",
    aliases: ["802.1Q"],
    family: "reseaux",
    contexts: [
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Segmentation par VLAN dans ma pratique personnelle." },
      { kind: "projet", ref: NETFORGE, note: "Génération des VLAN et des trunks 802.1Q." },
      { kind: "formation", ref: BTS, note: "VLAN et switching au programme du BTS." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "computer-networking",
    label: "Réseaux informatiques",
    sourceLabel: "Computer Networking",
    aliases: ["réseau", "networking"],
    family: "reseaux",
    contexts: [
      { kind: "projet", ref: NETFORGE, note: "Conception et adressage réseau." },
      { kind: "formation", ref: CIEL, note: "Câblage cuivre et fibre, mise en réseau de postes." },
      { kind: "formation", ref: BTS, note: "Architectures réseau, routage et switching." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "ubiquiti",
    label: "Ubiquiti",
    sourceLabel: "Ubiquiti",
    aliases: [],
    family: "reseaux",
    displayGroup: "ubiquiti",
    contexts: [{ kind: "entreprise", ref: N4B_2024, note: "Déploiement d'un Wi-Fi Ubiquiti avec réseaux invités et privés." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "tcp-ip",
    label: "TCP/IP",
    sourceLabel: "Internet Protocol Suite (TCP/IP)",
    aliases: ["Internet Protocol Suite", "IPv4"],
    family: "reseaux",
    contexts: [{ kind: "projet", ref: NETFORGE, note: "Adressage IPv4 et découpage VLSM." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "hyper-v",
    label: "Hyper-V",
    sourceLabel: "Hyper-V",
    aliases: [],
    family: "systemes",
    contexts: [],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "docker",
    label: "Docker",
    sourceLabel: "Docker Products",
    aliases: ["Docker Products", "conteneurs"],
    family: "systemes",
    featured: true,
    contexts: [{ kind: "pratique-personnelle", ref: HOMELAB, note: "VM principale dédiée à mes conteneurs." }],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "windows-server",
    label: "Windows Server",
    sourceLabel: "Windows Server",
    aliases: [],
    family: "systemes",
    contexts: [
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Environnements de test Windows Server 2022 et 2025." },
      { kind: "formation", ref: BTS, note: "Administration Windows Server au programme du BTS." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "debian",
    label: "Debian",
    sourceLabel: "Debian",
    aliases: ["Linux"],
    family: "systemes",
    featured: true,
    contexts: [
      { kind: "entreprise", ref: N4B_2025, note: "Hyperviseur Proxmox sous Debian." },
      { kind: "pratique-personnelle", ref: HOMELAB, note: "Environnement de test Debian." },
    ],
    provenance: SOURCE_LINKEDIN,
  },
];

export const skillById: Record<SkillId, Skill> = Object.fromEntries(
  skills.map((s) => [s.id, s]),
) as Record<SkillId, Skill>;
