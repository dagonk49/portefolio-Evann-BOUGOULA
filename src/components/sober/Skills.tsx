import { skillFamilies, skillsOfFamily } from "@/data";
import type { Skill } from "@/data/types";
import { CONTEXT_KIND_LABEL, RefLink, SectionHeading, SubHeading } from "./common";

/** Regroupe visuellement les compétences d'un même `displayGroup` (Ubiquiti + UniFi). */
function groupSkills(list: Skill[]): Skill[][] {
  const groups: Skill[][] = [];
  const byKey = new Map<string, Skill[]>();
  for (const s of list) {
    if (s.displayGroup) {
      const existing = byKey.get(s.displayGroup);
      if (existing) {
        existing.push(s);
        continue;
      }
      const g = [s];
      byKey.set(s.displayGroup, g);
      groups.push(g);
    } else groups.push([s]);
  }
  return groups;
}

function SkillRow({ group }: { group: Skill[] }) {
  const main = group[0]!;
  const name = group.length > 1 ? group.map((s) => s.label).sort((a, b) => a.length - b.length).join(" · ") : main.label;
  const sources = group.map((s) => s.sourceLabel);
  const showSource = group.length > 1 || main.sourceLabel !== main.label;
  // Contextes dédoublonnés (même contenu référencé).
  const seen = new Set<string>();
  const contexts = group
    .flatMap((s) => s.contexts)
    .filter((c) => {
      const key = JSON.stringify(c.ref) + c.kind;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return (
    <li className="skill">
      <div className="skill__head">
        <span className="skill__name">{name}</span>
        {showSource ? (
          <span className="skill__alias mono">profil : {sources.map((s) => `« ${s} »`).join(", ")}</span>
        ) : null}
      </div>
      {contexts.length > 0 ? (
        <ul className="skill__ctx">
          {contexts.map((c, i) => (
            <li key={i}>
              <span className={`ctx-kind ctx-kind--${c.kind} mono`}>{CONTEXT_KIND_LABEL[c.kind]}</span>
              <span>
                <RefLink refTo={c.ref} /> <span className="skill__note">— {c.note}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill__none">Compétence déclarée sur mon profil, sans contexte détaillé ici.</p>
      )}
    </li>
  );
}

/** Pratiques d'auto-formation documentées (aucune source de veille inventée). */
const PRACTICES: { title: string; text: string; href: string; link: string }[] = [
  {
    title: "Apprendre par la pratique",
    text: "Mon HomeLab me sert à expérimenter : environnements de test Windows Server 2022 et 2025, Debian et Windows 11, conteneurs Docker, VLAN, WireGuard et reverse proxy.",
    href: "#homelab",
    link: "Voir le HomeLab",
  },
  {
    title: "Construire mes propres outils",
    text: "NetForge part d'un besoin rencontré en formation et en pratique : comprendre un calcul avant de l'automatiser, puis en faire un outil utile à d'autres techniciens et étudiants.",
    href: "#netforge",
    link: "Voir NetForge",
  },
  {
    title: "Se former en continu",
    text: "BTS SIO SISR en alternance à la DSI régionale de l'EFS, après un Bac Pro CIEL ; certifications et habilitations complémentaires (introduction à la cybersécurité Cisco Networking Academy, Pix, SST, habilitation B1V, travail en hauteur).",
    href: "#formations",
    link: "Voir les formations",
  },
];

export function SkillsSection() {
  return (
    <section className="section" data-nav="veille" aria-labelledby="veille">
      <SectionHeading
        id="veille"
        index="05"
        title="Veille & compétences"
        lead="Comment je me forme, et ce que je sais faire — chaque compétence est reliée au contexte où je l'ai pratiquée ou étudiée."
      />
      <div className="block">
        <SubHeading id="veille-pratiques" title="Veille et développement professionnel" />
        <ul className="practices">
          {PRACTICES.map((p) => (
            <li key={p.title}>
              <h4>{p.title}</h4>
              <p>{p.text}</p>
              <a href={p.href}>{p.link}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="block block--skills">
        <SubHeading id="competences" title="Compétences" meta="Compétences de mon profil, par famille" />
        <p className="block__lead">
          Les thèmes de formation sont des connaissances étudiées, pas une maîtrise professionnelle.
        </p>
        <ul className="ctx-legend" aria-label="Légende des contextes">
          {Object.entries(CONTEXT_KIND_LABEL).map(([k, label]) => (
            <li key={k}>
              <span className={`ctx-kind ctx-kind--${k} mono`}>{label}</span>
            </li>
          ))}
        </ul>
        <div className="skill-families">
          {skillFamilies
            .filter((f) => f.id !== "secourisme")
            .map((f) => (
              <section key={f.id} id={`competences-${f.id}`} tabIndex={-1} className="skill-family" aria-labelledby={`competences-${f.id}-title`}>
                <h4 id={`competences-${f.id}-title`}>{f.label}</h4>
                <p className="skill-family__desc">{f.description}</p>
                <ul className="skill-list">
                  {groupSkills(skillsOfFamily(f.id)).map((g) => (
                    <SkillRow key={g[0]!.id} group={g} />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      </div>
    </section>
  );
}
