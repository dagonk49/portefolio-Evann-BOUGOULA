import type { ContentRef, SkillContextKind } from "@/data/types";
import { anchorFor, getEducation, getExperience, getHobby, getProject, organizationName } from "@/data";

export function SectionHeading({ id, index, title, lead }: { id: string; index: string; title: string; lead?: React.ReactNode }) {
  return (
    <header className="section-head">
      <p className="section-head__index mono" aria-hidden="true">
        {index} /
      </p>
      <div className="section-head__text">
        <h2 id={id} tabIndex={-1}>
          {title}
        </h2>
        {lead ? <p className="section-head__lead">{lead}</p> : null}
      </div>
    </header>
  );
}

/** Titre de sous-partie (h3) ; l'identifiant sert d'ancre depuis le lab 3D et le terminal. */
export function SubHeading({ id, title, meta }: { id: string; title: string; meta?: React.ReactNode }) {
  return (
    <div className="sub-head">
      <h3 id={id} tabIndex={-1}>
        {title}
      </h3>
      {meta ? <p className="sub-head__meta mono">{meta}</p> : null}
    </div>
  );
}

export const CONTEXT_KIND_LABEL: Record<SkillContextKind, string> = {
  entreprise: "Entreprise",
  formation: "Formation",
  "pratique-personnelle": "Pratique perso",
  projet: "Projet",
};

/** Libellé court d'un contenu référencé (« EFS · alternance », « BTS SIO SISR »…). */
export function refShortLabel(ref: ContentRef): string {
  switch (ref.type) {
    case "experience": {
      const e = getExperience(ref.id);
      if (!e) return ref.id;
      const org = e.organizationId === "efs" ? "EFS" : organizationName(e.organizationId);
      return e.contract === "Alternance" ? `${org} · alternance` : `${org} · stage ${e.period.start.year}`;
    }
    case "education":
      return getEducation(ref.id)?.shortName ?? ref.id;
    case "project":
      return getProject(ref.id)?.name ?? ref.id;
    case "homelab":
      return "HomeLab";
    case "certification":
    case "certifications":
      return "Certifications";
    case "skill-family":
      return "Compétences";
    case "about":
      return "À propos";
    case "contact":
      return "Contact";
    case "hobby":
      return getHobby(ref.id)?.title ?? ref.id;
  }
}

export function RefLink({ refTo, children }: { refTo: ContentRef; children?: React.ReactNode }) {
  return <a href={`#${anchorFor(refTo)}`}>{children ?? refShortLabel(refTo)}</a>;
}
