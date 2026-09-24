import { experiences, internshipRank, organizationName, profile, skillById } from "@/data";
import type { Experience } from "@/data/types";
import { formatMonth, formatPeriod, isoMonth } from "@/lib/format";
import { SectionHeading } from "./common";

export function About() {
  return (
    <section className="section" aria-labelledby="a-propos">
      <SectionHeading id="a-propos" index="01" title="À propos" />
      <div className="about">
        <div className="about__text">
          {profile.about.map((p, i) => (
            <p key={i} className={i === 0 ? "lede" : undefined}>
              {p}
            </p>
          ))}
        </div>
        <dl className="scopes">
          {profile.practiceScopes.map((s) => (
            <div key={s.title} className="scope">
              <dt className="mono">{s.title}</dt>
              <dd>{s.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ExperienceItem({ exp }: { exp: Experience }) {
  const rank = internshipRank(exp);
  const org = organizationName(exp.organizationId);
  const { start, end } = exp.period;
  return (
    <li className="xp" data-org={exp.organizationId}>
      <article id={`experience-${exp.id}`} tabIndex={-1} aria-labelledby={`experience-${exp.id}-title`}>
        <p className="xp__when mono">
          <time dateTime={isoMonth(start)}>{formatMonth(start, "short")}</time>
          {" – "}
          {end === "present" ? "aujourd'hui" : <time dateTime={isoMonth(end)}>{formatMonth(end, "short")}</time>}
        </p>
        <div className="xp__body">
          <h3 id={`experience-${exp.id}-title`}>
            {org}
            {rank ? (
              <span className="xp__badge mono">
                stage {rank.rank}/{rank.total}
              </span>
            ) : null}
          </h3>
          <p className="xp__role">
            {exp.role === exp.contract ? exp.contract : `${exp.role} · ${exp.contract}`}
            <span className="sr-only"> — {formatPeriod(exp.period)}</span>
          </p>
          {exp.location || exp.workMode ? (
            <p className="xp__where mono">
              {exp.location ? `${exp.location.city}, ${exp.location.region}` : null}
              {exp.location && exp.workMode ? " · " : null}
              {exp.workMode ?? null}
            </p>
          ) : null}
          {exp.context ? <p className="xp__context">{exp.context}</p> : null}
          {exp.missions.length > 0 ? (
            <ul className="xp__missions">
              {exp.missions.map((m, i) => (
                <li key={i}>
                  {m.title ? <strong>{m.title} — </strong> : null}
                  {m.text}
                </li>
              ))}
            </ul>
          ) : null}
          {exp.skills.length > 0 ? (
            <ul className="tags" aria-label="Compétences liées">
              {[...new Set(exp.skills.map((id) => skillById[id]))].map((s) => (
                <li key={s.id}>
                  <a href={`#competences-${s.family}`}>{s.label}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function ExperienceSection() {
  return (
    <section className="section" aria-labelledby="experiences">
      <SectionHeading
        id="experiences"
        index="02"
        title="Expériences"
        lead="De la plus récente à la plus ancienne. Mes trois stages chez NET4BUSINESS ont eu lieu à des périodes distinctes."
      />
      <ol className="timeline">
        {experiences.map((e) => (
          <ExperienceItem key={e.id} exp={e} />
        ))}
      </ol>
    </section>
  );
}
