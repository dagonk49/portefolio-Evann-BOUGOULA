import type { Organization, Profile, Provenance } from "./types";

export const SOURCE_LINKEDIN: Provenance = {
  source: "profil-linkedin",
  asOf: "2026-09",
  note: "Extraits du profil fournis directement par Evann (corrections d'Evann prioritaires).",
};

export const SOURCE_BRIEF: Provenance = {
  source: "brief-evann",
  asOf: "2026-09",
};

export const SOURCE_HOMELAB: Provenance = {
  source: "notes-homelab-evann",
  asOf: "2026-09",
  note: "Description de son organisation par Evann, pas une mesure en direct.",
};

export const LINKEDIN_URL = "https://www.linkedin.com/in/evann-bougoula";

export const profile: Profile = {
  firstName: "Evann",
  lastName: "Bougoula",
  fullName: "Evann Bougoula",
  headline: "Alternant technicien informatique chez Établissement Français du Sang",
  shortRole: "Alternant technicien informatique",
  location: "Angers et périphérie",
  currentTraining: "BTS SIO option SISR — MyDigitalSchool",
  specialty: "Systèmes, réseaux et HomeLab",
  tagline: "Je comprends, je branche, je configure, je teste. Bienvenue dans mon lab.",
  about: [
    "Étudiant en BTS SIO option SISR et alternant à la DSI régionale de l'Établissement Français du Sang, j'interviens au quotidien sur le support technique de niveau 1, l'intégrité de l'Active Directory et le suivi opérationnel du programme national AMI.",
    "Passionné d'informatique, j'expérimente quotidiennement dans mon HomeLab avec Proxmox, Docker et Debian, et je travaille la sécurisation réseau avec les VLAN, WireGuard et Nginx Proxy Manager. Je conçois aussi mes propres outils d'automatisation, en m'appuyant sur PowerShell, la CLI Cisco et des architectures web.",
    "Rigoureux et curieux, je suis motivé par la résolution de problèmes concrets, au service des utilisateurs comme de l'infrastructure.",
  ],
  practiceScopes: [
    {
      title: "En entreprise",
      text: "Support N1, Active Directory, programme AMI et MCO du parc à l'EFS ; préparation de postes, Wi-Fi Ubiquiti, Proxmox et supports d'installation Windows lors de mes stages.",
    },
    {
      title: "En formation",
      text: "BTS SIO SISR en cours et Bac Pro CIEL obtenu : administration systèmes, réseaux, cybersécurité, câblage et maintenance, étudiés en cours et en travaux pratiques.",
    },
    {
      title: "En pratique personnelle",
      text: "Mon HomeLab Proxmox et mes conteneurs Docker, mes environnements de test Windows Server et Debian, et mon projet NetForge.",
    },
  ],
  featuredSkills: ["proxmox", "docker", "debian", "cisco-ios", "ubiquiti-unifi"],
  contacts: [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: LINKEDIN_URL,
      display: "linkedin.com/in/evann-bougoula",
    },
  ],
  cvFile: null,
  provenance: SOURCE_LINKEDIN,
};

export const organizations: Record<string, Organization> = {
  efs: { id: "efs", name: "Établissement Français du Sang", shortName: "EFS" },
  net4business: { id: "net4business", name: "NET4BUSINESS", shortName: "NET4BUSINESS" },
  moizan: { id: "moizan", name: "EURL Moizan", shortName: "EURL Moizan" },
};
