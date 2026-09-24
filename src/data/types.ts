/**
 * Modèle de données central du portfolio.
 *
 * Toutes les vues (mode sobre, lab 3D, terminal) lisent ces structures :
 * une modification ici se répercute partout. Les champs `provenance` et
 * `editorialNotes` sont internes : ils ne sont jamais affichés aux visiteurs.
 */

/** Mois calendaire (1 = janvier). */
export interface YearMonth {
  year: number;
  month: number;
}

export interface Period {
  start: YearMonth;
  /** `"present"` : poste ou formation toujours en cours. */
  end: YearMonth | "present";
}

/** D'où vient une information (usage interne, jamais affiché). */
export interface Provenance {
  source: "profil-linkedin" | "brief-evann" | "notes-homelab-evann";
  /** Date de référence du contenu fourni. */
  asOf: string;
  note?: string;
}

export type ExperienceId =
  | "efs-2026"
  | "net4business-2026"
  | "net4business-2025"
  | "moizan-2024"
  | "net4business-2024";

export type EducationId = "bts-sio-sisr" | "bac-pro-ciel";

export type CertificationId = "habilitation-b1v" | "sst" | "cisco-intro-cybersecurity";

export type ProjectId = "netforge" | "portfolio";

export type HobbyId = "valorant" | "minecraft" | "gta" | "cinema-mecanique";

export type SkillFamilyId =
  | "reseaux"
  | "systemes"
  | "developpement"
  | "support"
  | "methode"
  | "secourisme";

export type SkillId =
  | "frontend-dev"
  | "web-apps"
  | "servers"
  | "maintenance-management"
  | "backend-dev"
  | "first-aid-certification"
  | "technical-support"
  | "active-directory"
  | "ubiquiti-unifi"
  | "proxmox"
  | "cisco-ios"
  | "field-training"
  | "work-based-learning"
  | "hands-on-training"
  | "field-technicians"
  | "technical-maintenance"
  | "vpn"
  | "nat"
  | "vlan"
  | "computer-networking"
  | "ubiquiti"
  | "tcp-ip"
  | "hyper-v"
  | "docker"
  | "windows-server"
  | "debian";

/** Référence vers n'importe quel contenu consultable. */
export type ContentRef =
  | { type: "about" }
  | { type: "contact" }
  | { type: "homelab" }
  | { type: "certifications" }
  | { type: "experience"; id: ExperienceId }
  | { type: "education"; id: EducationId }
  | { type: "certification"; id: CertificationId }
  | { type: "project"; id: ProjectId }
  | { type: "skill-family"; id: SkillFamilyId }
  | { type: "hobby"; id: HobbyId };

export interface Organization {
  id: string;
  name: string;
  /** Nom court pour les espaces réduits (stèles, terminal). */
  shortName: string;
}

export interface Location {
  city: string;
  region: string;
  country: string;
}

export interface Mission {
  /** Intitulé court (optionnel) affiché en gras. */
  title?: string;
  text: string;
}

export interface Experience {
  id: ExperienceId;
  organizationId: string;
  role: string;
  contract: "Alternance" | "Stage";
  period: Period;
  location?: Location;
  workMode?: "Hybride" | "Sur site";
  context?: string;
  missions: Mission[];
  skills: SkillId[];
  provenance: Provenance;
  /** Suivi éditorial interne (non affiché). */
  editorialNotes?: string[];
}

export interface TopicGroup {
  title: string;
  items: string[];
}

export interface Education {
  id: EducationId;
  school: string;
  diploma: string;
  shortName: string;
  specialty?: string;
  level?: string;
  period: Period;
  /**
   * Statut saisi à la main : il n'évolue jamais automatiquement avec la date.
   * `expectedEnd` décrit une fin prévue, pas un diplôme obtenu.
   */
  status: { kind: "en-cours"; expectedEnd: YearMonth } | { kind: "obtenu"; obtainedAt: YearMonth };
  result?: { grade: string; honors: string };
  /** Thèmes étudiés : ce sont des connaissances, pas une preuve de maîtrise professionnelle. */
  topics: TopicGroup[];
  skills: SkillId[];
  provenance: Provenance;
}

export interface Certification {
  id: CertificationId;
  name: string;
  issuer: string;
  issuedAt: YearMonth;
  expiresAt?: YearMonth;
  /** Précision affichée pour éviter toute confusion (ex. : pas un CCNA). */
  clarification?: string;
  provenance: Provenance;
}

export type SkillContextKind = "entreprise" | "formation" | "pratique-personnelle" | "projet";

export interface SkillContext {
  kind: SkillContextKind;
  ref: ContentRef;
  /** Ce qui a été fait ou étudié, tel que documenté. */
  note: string;
}

export interface Skill {
  id: SkillId;
  /** Libellé normalisé pour l'affichage. */
  label: string;
  /** Intitulé d'origine du profil, conservé à l'identique. */
  sourceLabel: string;
  aliases: string[];
  family: SkillFamilyId;
  /** Regroupement visuel (ex. Ubiquiti + Ubiquiti UniFi). */
  displayGroup?: string;
  /** Compétence mise en avant sur le profil. */
  featured?: boolean;
  /** Contextes réellement documentés. Tableau vide : aucun contexte fourni. */
  contexts: SkillContext[];
  /** Lien vers une certification lorsque la compétence en relève. */
  certificationId?: CertificationId;
  provenance: Provenance;
}

export interface SkillFamily {
  id: SkillFamilyId;
  label: string;
  description: string;
}

export interface ProjectPillar {
  id: string;
  title: string;
  points: string[];
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  id: ProjectId;
  name: string;
  kind: "Projet personnel";
  since?: YearMonth;
  tagline: string;
  problem?: string;
  audience?: string[];
  solution?: string;
  pillars: ProjectPillar[];
  value?: string[];
  illustrates?: string[];
  skills: SkillId[];
  /** Liens publics réels uniquement. Vide tant qu'aucune URL n'est fournie. */
  links: ProjectLink[];
  /** Adresse de l'application en production, si elle est publiée. */
  liveUrl?: string;
  /** Badges courts affichés sur la carte du projet. */
  badges?: string[];
  provenance: Provenance;
  editorialNotes?: string[];
}

export interface HomeLabService {
  id: string;
  label: string;
  detail?: string;
}

export interface HomeLab {
  intro: string;
  hypervisor: { label: string; detail: string };
  mainVm: { label: string; detail: string; resourceShare: string; services: HomeLabService[] };
  testEnvironments: HomeLabService[];
  networkPractice: { label: string; detail: string }[];
  spirit: string;
  skills: SkillId[];
  provenance: Provenance;
  editorialNotes?: string[];
}

export interface ContactChannel {
  /** Ajouter un canal = ajouter une entrée dans `profile.contacts` (il apparaît partout). */
  id: "linkedin" | "email" | "github" | "website";
  label: string;
  /** `https://…` ou `mailto:…` : uniquement des valeurs réelles. */
  href: string;
  display: string;
}

export interface Profile {
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  shortRole: string;
  location: string;
  currentTraining: string;
  tagline: string;
  specialty: string;
  about: string[];
  /** Répartition honnête des lieux de pratique. */
  practiceScopes: { title: string; text: string }[];
  featuredSkills: SkillId[];
  contacts: ContactChannel[];
  /** Fichier de CV publié (chemin sous /public). `null` tant qu'aucun fichier n'est fourni. */
  cvFile: string | null;
  provenance: Provenance;
}

export type LabZoneId = "spawn" | "baie" | "bureau" | "cluster" | "parcours" | "sas";
export type CircuitZoneId = "paddock" | "spot-valorant" | "spot-minecraft" | "spot-gta" | "spot-cinema" | "piste";
export type ZoneId = LabZoneId | CircuitZoneId;

/** Monde 3D où se trouve un contenu : le lab intérieur ou le circuit extérieur. */
export type WorldId = "lab" | "circuit";

export interface Hobby {
  id: HobbyId;
  title: string;
  /** Sous-titre court (carte, stèle). */
  kicker: string;
  /** Phrases à la première personne, uniquement ce qui a été fourni. */
  lines: string[];
  quote?: string;
  tags: string[];
  provenance: Provenance;
}

export type AnomalyId =
  | "evann.profile.about"
  | "evann.skills.networking"
  | "evann.xp.net4business-2024.wifi"
  | "evann.skills.systems"
  | "evann.xp.net4business-2025.proxmox"
  | "evann.projects.netforge"
  | "evann.xp.net4business-2026.ventoy"
  | "evann.skills.development"
  | "evann.skills.method"
  | "evann.xp.efs.active-directory"
  | "evann.skills.support"
  | "evann.hobbies.valorant"
  | "evann.hobbies.minecraft"
  | "evann.hobbies.gta"
  | "evann.hobbies.cinema-mecanique";

export interface Anomaly {
  id: AnomalyId;
  /** Nom lisible de l'objet d'où s'échappe l'anomalie. */
  source: string;
  world: WorldId;
  zone: ZoneId;
  /** Teinte du cube holographique (cyan par défaut). */
  color?: string;
  target: ContentRef;
  /** Fragments de code affichés autour de l'anomalie (décor). */
  fragments: string[];
  /** Si défini, l'anomalie n'apparaît qu'après cette interaction. */
  revealedBy?: "mission:lab-online";
}
