/**
 * Point d'entrée unique des données. Les vues n'importent que ce module.
 */
import { anomalies, anomalyById } from "./anomalies";
import { hobbies } from "./hobbies";
import { certifications, education } from "./education";
import { experiences } from "./experiences";
import { LINKEDIN_URL, organizations, profile } from "./profile";
import { homelab, projects } from "./projects";
import { skillById, skillFamilies, skills } from "./skills";
import type {
  Certification,
  ContentRef,
  Education,
  Experience,
  Hobby,
  Project,
  Skill,
  SkillFamily,
  SkillFamilyId,
} from "./types";
import { formatPeriod } from "@/lib/format";

export {
  hobbies,
  anomalies,
  anomalyById,
  certifications,
  education,
  experiences,
  homelab,
  LINKEDIN_URL,
  organizations,
  profile,
  projects,
  skillById,
  skillFamilies,
  skills,
};
export type * from "./types";

export function getExperience(id: string): Experience | undefined {
  return experiences.find((e) => e.id === id);
}
export function getEducation(id: string): Education | undefined {
  return education.find((e) => e.id === id);
}
export function getCertification(id: string): Certification | undefined {
  return certifications.find((c) => c.id === id);
}
export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
export function getHobby(id: string): Hobby | undefined {
  return hobbies.find((h) => h.id === id);
}
export function getSkillFamily(id: string): SkillFamily | undefined {
  return skillFamilies.find((f) => f.id === id);
}
export function skillsOfFamily(id: SkillFamilyId): Skill[] {
  return skills.filter((s) => s.family === id);
}
export function organizationName(orgId: string): string {
  return organizations[orgId]?.name ?? orgId;
}

/** Numérotation des stages d'un même employeur (ex. « stage 2/3 »), dans l'ordre chronologique. */
export function internshipRank(exp: Experience): { rank: number; total: number } | null {
  const same = experiences
    .filter((e) => e.organizationId === exp.organizationId && e.contract === exp.contract)
    .sort((a, b) => a.period.start.year * 12 + a.period.start.month - (b.period.start.year * 12 + b.period.start.month));
  if (same.length < 2) return null;
  return { rank: same.findIndex((e) => e.id === exp.id) + 1, total: same.length };
}

/** Ancre HTML de la section correspondante dans le mode sobre. */
export function anchorFor(ref: ContentRef): string {
  switch (ref.type) {
    case "about":
      return "a-propos";
    case "contact":
      return "contact";
    case "homelab":
      return "homelab";
    case "certifications":
      return "certifications";
    case "experience":
      return `experience-${ref.id}`;
    case "education":
      return `formation-${ref.id}`;
    case "certification":
      return `certification-${ref.id}`;
    case "project":
      return `projet-${ref.id}`;
    case "skill-family":
      return `competences-${ref.id}`;
    case "hobby":
      return `loisir-${ref.id}`;
  }
}

export interface ContentSummary {
  ref: ContentRef;
  title: string;
  subtitle: string;
  group: "Profil" | "Expériences" | "Formations" | "Certifications" | "Compétences" | "Projets" | "Loisirs" | "Contact";
}

export function summarize(ref: ContentRef): ContentSummary {
  switch (ref.type) {
    case "about":
      return { ref, title: "À propos", subtitle: profile.headline, group: "Profil" };
    case "contact":
      return { ref, title: "Contact", subtitle: "LinkedIn", group: "Contact" };
    case "homelab":
      return { ref, title: "HomeLab", subtitle: "Proxmox, Docker et environnements de test", group: "Projets" };
    case "certifications":
      return {
        ref,
        title: "Certifications",
        subtitle: `${certifications.length} certifications`,
        group: "Certifications",
      };
    case "experience": {
      const e = getExperience(ref.id);
      return {
        ref,
        title: e ? `${organizationName(e.organizationId)} — ${e.contract === "Stage" ? `stage ${e.period.start.year}` : e.role}` : ref.id,
        subtitle: e ? `${e.contract} · ${formatPeriod(e.period)}` : "",
        group: "Expériences",
      };
    }
    case "education": {
      const e = getEducation(ref.id);
      return {
        ref,
        title: e ? e.shortName : ref.id,
        subtitle: e ? `${e.school} · ${formatPeriod(e.period)}` : "",
        group: "Formations",
      };
    }
    case "certification": {
      const c = getCertification(ref.id);
      return { ref, title: c?.name ?? ref.id, subtitle: c?.issuer ?? "", group: "Certifications" };
    }
    case "project": {
      const p = getProject(ref.id);
      return { ref, title: p?.name ?? ref.id, subtitle: p?.kind ?? "", group: "Projets" };
    }
    case "skill-family": {
      const f = getSkillFamily(ref.id);
      return { ref, title: f?.label ?? ref.id, subtitle: f?.description ?? "", group: "Compétences" };
    }
    case "hobby": {
      const h = getHobby(ref.id);
      return { ref, title: h?.title ?? ref.id, subtitle: h?.kicker ?? "", group: "Loisirs" };
    }
  }
}

/** Index complet des contenus, utilisé par l'index du lab et le terminal. */
export function contentIndex(): ContentSummary[] {
  const refs: ContentRef[] = [
    { type: "about" },
    ...experiences.map((e) => ({ type: "experience", id: e.id }) as const),
    ...education.map((e) => ({ type: "education", id: e.id }) as const),
    { type: "certifications" },
    ...skillFamilies.filter((f) => f.id !== "secourisme").map((f) => ({ type: "skill-family", id: f.id }) as const),
    ...projects.map((p) => ({ type: "project", id: p.id }) as const),
    { type: "homelab" },
    ...hobbies.map((h) => ({ type: "hobby", id: h.id }) as const),
    { type: "contact" },
  ];
  return refs.map(summarize);
}

export function refKey(ref: ContentRef): string {
  return "id" in ref ? `${ref.type}:${ref.id}` : ref.type;
}

export function sameRef(a: ContentRef, b: ContentRef): boolean {
  return refKey(a) === refKey(b);
}

/** Vérifie qu'une référence pointe vers un contenu existant. */
export function refExists(ref: ContentRef): boolean {
  switch (ref.type) {
    case "about":
    case "contact":
    case "homelab":
    case "certifications":
      return true;
    case "experience":
      return !!getExperience(ref.id);
    case "education":
      return !!getEducation(ref.id);
    case "certification":
      return !!getCertification(ref.id);
    case "project":
      return !!getProject(ref.id);
    case "skill-family":
      return !!getSkillFamily(ref.id);
    case "hobby":
      return !!getHobby(ref.id);
  }
}
