import type { Certification, Education } from "./types";
import { SOURCE_LINKEDIN, SOURCE_V3 } from "./profile";

export const education: Education[] = [
  {
    id: "bts-sio-sisr",
    school: "MyDigitalSchool Angers",
    diploma: "BTS Services Informatiques aux Organisations",
    shortName: "BTS SIO SISR",
    specialty: "Option SISR (Solutions d'Infrastructure, Systèmes et Réseaux)",
    level: "Bac +2",
    period: { start: { year: 2026, month: 9 }, end: { year: 2028, month: 7 } },
    status: { kind: "en-cours", expectedEnd: { year: 2028, month: 7 } },
    topics: [
      {
        title: "Administration systèmes",
        items: ["Windows Server", "Active Directory", "GPO", "Linux", "Virtualisation", "DNS", "DHCP", "NFS", "SMB"],
      },
      {
        title: "Réseaux et télécoms",
        items: [
          "Architectures réseau",
          "VLAN",
          "Routage",
          "Switching",
          "Équipements actifs",
          "Interconnexions sécurisées",
        ],
      },
      {
        title: "Cybersécurité",
        items: ["Pare-feux", "VPN", "Filtrage", "Sauvegardes", "PCA/PRA", "Bonnes pratiques ANSSI", "RGPD"],
      },
      { title: "Automatisation et outils", items: ["Bash", "PowerShell", "Supervision", "MCO"] },
      {
        title: "Support et parc",
        items: ["Incidents N1/N2", "Cycle de vie des équipements", "Assistance aux utilisateurs"],
      },
    ],
    skills: ["windows-server", "active-directory", "vlan", "vpn", "computer-networking", "debian"],
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "bac-pro-ciel",
    school: "Lycée Chevrollier",
    diploma: "Bac professionnel CIEL",
    shortName: "Bac Pro CIEL",
    specialty: "Cybersécurité, Informatique et réseaux, Électronique",
    period: { start: { year: 2023, month: 9 }, end: { year: 2026, month: 7 } },
    status: { kind: "obtenu", obtainedAt: { year: 2026, month: 7 } },
    result: { grade: "17,14/20", honors: "Mention très bien" },
    topics: [
      {
        title: "Réseaux et câblage",
        items: [
          "Cuivre et fibre optique",
          "Raccordement d'infrastructures physiques",
          "Configuration de base des switchs et routeurs",
          "Mise en réseau de postes",
        ],
      },
      {
        title: "Cybersécurité et systèmes",
        items: [
          "Installation et paramétrage d'OS clients et serveurs",
          "Sécurisation élémentaire des postes, des données et des accès réseau",
        ],
      },
      {
        title: "Maintenance et support",
        items: ["Diagnostic matériel et logiciel", "Dépannage de premier niveau", "MCO"],
      },
      {
        title: "Électronique et IoT",
        items: [
          "Intégration de composants",
          "Tests de continuité de signaux",
          "Interconnexion d'objets communicants",
        ],
      },
    ],
    skills: ["computer-networking", "technical-maintenance", "technical-support"],
    provenance: SOURCE_LINKEDIN,
  },
];

export const certifications: Certification[] = [
  {
    id: "habilitation-b1v",
    name: "Habilitation électrique B1V",
    issuer: "Lycée Chevrollier",
    issuedAt: { year: 2024, month: 6 },
    expiresAt: { year: 2029, month: 6 },
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "cisco-intro-cybersecurity",
    name: "Certificat d'introduction à la cybersécurité — Cisco Networking Academy",
    issuer: "Lycée Chevrollier",
    issuedAt: { year: 2024, month: 9 },
    expiresAt: { year: 2029, month: 9 },
    clarification: "Certificat de module d'introduction, distinct d'une certification CCNA.",
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "sst",
    name: "Sauveteur Secouriste du Travail (SST)",
    issuer: "Lycée Chevrollier",
    issuedAt: { year: 2026, month: 6 },
    expiresAt: { year: 2028, month: 6 },
    provenance: SOURCE_LINKEDIN,
  },
  {
    id: "pix",
    name: "Certification Pix",
    issuer: "Lycée polyvalent Chevrollier, Angers",
    provenance: SOURCE_V3,
  },
  {
    id: "travail-hauteur",
    name: "Sensibilisation au travail en hauteur",
    details: "Échafaudage et PIRL (plateforme individuelle roulante légère).",
    provenance: SOURCE_V3,
  },
];
