import type { Experience } from "./types";
import { SOURCE_LINKEDIN } from "./profile";

/** Ordre chronologique inverse (la plus récente d'abord). */
export const experiences: Experience[] = [
  {
    id: "efs-2026",
    organizationId: "efs",
    role: "Technicien informatique",
    contract: "Alternance",
    period: { start: { year: 2026, month: 9 }, end: "present" },
    location: { city: "Angers", region: "Pays de la Loire", country: "France" },
    workMode: "Hybride",
    context:
      "Au sein de la DSI régionale : support technique et fiabilité des infrastructures à l'échelle du territoire.",
    missions: [
      {
        title: "Support N1",
        text: "Traitement des demandes et résolution des incidents techniques du quotidien.",
      },
      {
        title: "Active Directory",
        text: "Gestion des accès et des comptes, conformité et pérennité de l'annuaire d'entreprise.",
      },
      {
        title: "Programme national AMI",
        text: "Participation aux initiatives du programme et au déploiement de ses processus.",
      },
      {
        title: "MCO et parc",
        text: "Masterisation, déploiement et maintenance du matériel régional.",
      },
    ],
    skills: [
      "technical-support",
      "active-directory",
      "technical-maintenance",
      "maintenance-management",
      "work-based-learning",
      "field-technicians",
    ],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: [
      "Acronyme AMI volontairement non développé (aucune définition vérifiée fournie).",
      "Missions de niveau N1 uniquement : ne pas mentionner de N2.",
    ],
  },
  {
    id: "net4business-2026",
    organizationId: "net4business",
    role: "Stage",
    contract: "Stage",
    period: { start: { year: 2026, month: 1 }, end: { year: 2026, month: 3 } },
    location: { city: "La Chapelle-Glain", region: "Pays de la Loire", country: "France" },
    workMode: "Sur site",
    missions: [
      { text: "Mise en place d'ordinateurs portables en entreprise." },
      {
        title: "Installation automatisée avec Ventoy",
        text: "Création d'un support d'installation Windows automatisé, personnalisé selon les besoins des clients.",
      },
      { text: "Assistance au support technique sur les problèmes du quotidien." },
    ],
    skills: ["technical-support", "hands-on-training", "field-training"],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: [
      "Description LinkedIn tronquée après ces missions : ne pas supposer d'autres tâches.",
    ],
  },
  {
    id: "net4business-2025",
    organizationId: "net4business",
    role: "Stage",
    contract: "Stage",
    period: { start: { year: 2025, month: 5 }, end: { year: 2025, month: 6 } },
    location: { city: "La Chapelle-Glain", region: "Pays de la Loire", country: "France" },
    workMode: "Sur site",
    missions: [
      { text: "Création d'un script de désinstallation des applications inutiles sous Windows." },
      {
        title: "Virtualisation",
        text: "Mise en place d'un hyperviseur Proxmox pour la virtualisation, sous Debian.",
      },
    ],
    skills: ["proxmox", "debian", "servers", "hands-on-training", "field-training"],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: ["Langage du script non précisé : ne pas l'attribuer à PowerShell."],
  },
  {
    id: "moizan-2024",
    organizationId: "moizan",
    role: "Stage",
    contract: "Stage",
    period: { start: { year: 2024, month: 4 }, end: { year: 2024, month: 5 } },
    missions: [],
    skills: [],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: ["Missions et localisation non fournies : ne rien inventer."],
  },
  {
    id: "net4business-2024",
    organizationId: "net4business",
    role: "Stage",
    contract: "Stage",
    period: { start: { year: 2024, month: 2 }, end: { year: 2024, month: 3 } },
    missions: [
      { text: "Préparation d'ordinateurs pour des clients professionnels et particuliers." },
      {
        title: "Wi-Fi Ubiquiti",
        text: "Déploiement d'un réseau Wi-Fi Ubiquiti avec réseaux invités et privés.",
      },
    ],
    skills: ["ubiquiti", "ubiquiti-unifi", "hands-on-training", "field-training"],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: ["Localisation non fournie pour ce stage."],
  },
];
