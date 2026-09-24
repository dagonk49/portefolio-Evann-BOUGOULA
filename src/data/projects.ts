import type { HomeLab, Project } from "./types";
import { SOURCE_BRIEF, SOURCE_HOMELAB } from "./profile";

export const projects: Project[] = [
  {
    id: "netforge",
    name: "NetForge",
    kind: "Projet personnel",
    since: { year: 2026, month: 5 },
    tagline:
      "Une boîte à outils pour concevoir un réseau, organiser son adressage et préparer les configurations des équipements.",
    problem:
      "Entre le schéma d'un réseau et les commandes saisies sur les équipements, les étapes sont nombreuses : découper les plages, suivre les attributions, écrire les configurations. Réalisées à la main, elles sont longues et propices aux erreurs d'adressage.",
    audience: [
      "Administrateurs systèmes et réseaux",
      "Étudiants en BTS SIO SISR ou en BUT Réseaux & Télécoms",
      "Passionnés de HomeLab",
    ],
    solution:
      "NetForge centralise les tâches de conception réseau : il simplifie l'adressage et automatise la préparation des configurations, pour relier la conception théorique aux commandes réellement utilisées sur les équipements.",
    pillars: [
      {
        id: "addressing",
        title: "Adressage IP et VLSM",
        points: [
          "Découpage d'une plage parente en sous-réseaux",
          "Plages utilisables, masques décimaux et CIDR",
          "Adresses de broadcast et passerelles proposées",
          "Prévention des chevauchements",
        ],
      },
      {
        id: "ipam",
        title: "Documentation et IPAM léger",
        points: [
          "Suivi des blocs d'adresses",
          "Organisation des attributions : serveurs, passerelles, hyperviseurs, pools DHCP",
          "Traçabilité de l'espace réseau",
        ],
      },
      {
        id: "cisco",
        title: "Génération Cisco IOS",
        points: [
          "VLAN et leurs noms, ports d'accès",
          "Trunks 802.1Q",
          "Routage inter-VLAN : sous-interfaces Router-on-a-Stick ou SVI",
          "ACL, pools DHCP et routage dynamique tel qu'OSPF",
        ],
      },
      {
        id: "visualisation",
        title: "Visualisation",
        points: [
          "Représentations textuelles ou visuelles de la répartition des réseaux",
          "Réutilisables dans des dossiers techniques et des projets de validation",
        ],
      },
    ],
    value: [
      "Faire le lien entre la conception théorique et les commandes utilisées sur les équipements.",
      "Limiter les erreurs d'adressage.",
      "Accélérer la préparation d'une configuration.",
    ],
    illustrates: [
      "Partir d'un besoin concret rencontré en formation et en pratique.",
      "Comprendre un calcul avant de l'automatiser.",
      "Construire des outils utiles à d'autres techniciens et étudiants.",
    ],
    skills: ["computer-networking", "tcp-ip", "vlan", "cisco-ios", "frontend-dev", "backend-dev", "web-apps"],
    links: [],
    provenance: SOURCE_BRIEF,
    editorialNotes: [
      "Stack technique, URL, dépôt, captures et état de mise en production non fournis.",
    ],
  },
  {
    id: "portfolio",
    name: "Ce portfolio — EVANN // ROOT ACCESS",
    kind: "Projet personnel",
    tagline:
      "Un portfolio en deux modes : une lecture sobre pour aller à l'essentiel, et un lab 3D où l'on remet une petite infrastructure en ligne.",
    pillars: [
      {
        id: "modes",
        title: "Deux modes, une seule source",
        points: [
          "Mode sobre en HTML accessible, consultable sans jouer",
          "Lab 3D chargé uniquement à la demande",
          "Les deux modes et le terminal lisent les mêmes données",
        ],
      },
      {
        id: "mission",
        title: "Une mission réseau simulée",
        points: [
          "Brassage, VLAN d'accès et adressage IPv4 réellement pris en compte",
          "Diagnostic ipconfig / ping calculé à partir de l'état du lab",
          "Simulation locale : aucune connexion à une infrastructure réelle",
        ],
      },
    ],
    skills: ["frontend-dev", "web-apps", "vlan", "tcp-ip"],
    links: [],
    provenance: SOURCE_HOMELAB,
  },
];

export const homelab: HomeLab = {
  intro:
    "En dehors du travail, je pratique l'informatique chez moi, surtout les systèmes, les infrastructures et les réseaux. Mon HomeLab me sert à expérimenter, comprendre et apprendre par la pratique.",
  hypervisor: {
    label: "Proxmox VE",
    detail: "Hyperviseur du lab, qui héberge plusieurs machines virtuelles.",
  },
  mainVm: {
    label: "VM principale — Docker",
    detail: "La plus puissante du lab : elle héberge mes conteneurs Docker.",
    resourceShare: "Plus de 50 % des ressources de mon infrastructure, selon mon organisation actuelle.",
    services: [
      { id: "library", label: "Automatisations", detail: "Pour une bibliothèque privée" },
      { id: "netforge", label: "NetForge", detail: "Projet de développement" },
      { id: "portfolio", label: "Ce portfolio", detail: "Projet de développement" },
    ],
  },
  testEnvironments: [
    { id: "ws2022", label: "Windows Server 2022" },
    { id: "ws2025", label: "Windows Server 2025" },
    { id: "debian", label: "Debian" },
    { id: "win11", label: "Windows 11" },
  ],
  networkPractice: [
    { label: "VLAN", detail: "Segmentation du réseau" },
    { label: "WireGuard", detail: "Accès VPN" },
    { label: "Nginx Proxy Manager", detail: "Reverse proxy" },
  ],
  spirit:
    "Ce lab est mon terrain d'expérimentation : j'y essaie, je comprends et j'apprends par la pratique. Il s'agit d'une pratique personnelle, distincte de mon expérience professionnelle.",
  skills: ["proxmox", "docker", "debian", "windows-server", "vlan", "vpn", "servers"],
  provenance: SOURCE_HOMELAB,
  editorialNotes: [
    "Nombre exact de VM, CPU, RAM, stockage et logiciels de la bibliothèque non fournis : ne pas les inventer.",
    "Topologie exacte et emplacement d'exécution de WireGuard / Nginx Proxy Manager non fournis.",
    "VLAN, WireGuard et Nginx Proxy Manager proviennent de la présentation LinkedIn (pratique personnelle).",
  ],
};

