import { skillFamilies, skillsOfFamily } from "@/data";
import type { Skill } from "@/data/types";
import { CONTEXT_KIND_LABEL, RefLink, SectionHeading } from "./common";

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

export function SkillsSection() {
  return (
    <section className="section" aria-labelledby="competences">
      <SectionHeading
        id="competences"
        index="03"
        title="Compétences"
        lead="Chaque compétence est reliée au contexte où je l'ai pratiquée ou étudiée. Les thèmes de formation sont des connaissances étudiées, pas une maîtrise professionnelle."
      />
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
              <h3 id={`competences-${f.id}-title`}>{f.label}</h3>
              <p className="skill-family__desc">{f.description}</p>
              <ul className="skill-list">
                {groupSkills(skillsOfFamily(f.id)).map((g) => (
                  <SkillRow key={g[0]!.id} group={g} />
                ))}
              </ul>
            </section>
          ))}
      </div>
    </section>
  );
}
