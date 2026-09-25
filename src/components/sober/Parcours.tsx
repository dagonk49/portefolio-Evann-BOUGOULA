import { certifications, education, experiences, hobbies, internshipRank, organizationName, profile, skillById, skills } from "@/data";
import type { Experience } from "@/data/types";
import { formatMonth, formatPeriod, isoMonth } from "@/lib/format";
import { SectionHeading, SubHeading } from "./common";

function About() {
  return (
    <div className="block">
      <SubHeading id="a-propos" title="À propos" />
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
    </div>
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
          {" — "}
          {end === "present" ? "aujourd'hui" : <time dateTime={isoMonth(end)}>{formatMonth(end, "short")}</time>}
        </p>
        <div className="xp__body">
          <h4 id={`experience-${exp.id}-title`}>
            {org}
            {rank ? (
              <span className="badge mono">
                stage {rank.rank}/{rank.total}
              </span>
            ) : null}
          </h4>
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

function Experiences() {
  return (
    <div className="block block--xp">
      <SubHeading id="experiences" title="Expériences" meta="De la plus récente à la plus ancienne" />
      <p className="block__lead">Mes trois stages chez NET4BUSINESS ont eu lieu à des périodes distinctes.</p>
      <ol className="timeline">
        {experiences.map((e) => (
          <ExperienceItem key={e.id} exp={e} />
        ))}
      </ol>
    </div>
  );
}

function Education() {
  return (
    <div className="block">
      <SubHeading id="formations" title="Formations" />
      <div className="edu-grid">
        {education.map((e) => (
          <article key={e.id} id={`formation-${e.id}`} tabIndex={-1} className="edu" aria-labelledby={`formation-${e.id}-title`}>
            <p className="edu__when mono">
              <time dateTime={isoMonth(e.period.start)}>{formatMonth(e.period.start, "short")}</time>
              {" — "}
              {e.period.end !== "present" ? <time dateTime={isoMonth(e.period.end)}>{formatMonth(e.period.end, "short")}</time> : "aujourd'hui"}
            </p>
            <h4 id={`formation-${e.id}-title`}>{e.shortName}</h4>
            <p className="edu__school">
              {e.school}
              {e.level ? ` · ${e.level}` : ""}
            </p>
            {e.specialty ? <p className="edu__specialty">{e.specialty}</p> : null}
            {e.status.kind === "en-cours" ? (
              <p className="edu__status mono">Formation en cours · fin prévue en {formatMonth(e.status.expectedEnd)}</p>
            ) : (
              <p className="edu__status mono">
                Diplôme obtenu en {formatMonth(e.status.obtainedAt)}
                {e.result ? (
                  <>
                    {" · "}
                    <strong>{e.result.grade}</strong>, {e.result.honors.toLowerCase()}
                  </>
                ) : null}
              </p>
            )}
            <details className="edu__topics">
              <summary>Thèmes étudiés</summary>
              <dl>
                {e.topics.map((g) => (
                  <div key={g.title}>
                    <dt>{g.title}</dt>
                    <dd>{g.items.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}

function Certifications() {
  const firstAid = skills.find((s) => s.certificationId === "sst");
  return (
    <div className="block">
      <SubHeading id="certifications" title="Certifications et habilitations" />
      <ul className="cert-list">
        {certifications.map((c) => (
          <li key={c.id} id={`certification-${c.id}`} className="cert">
            <p className="cert__name">{c.name}</p>
            {c.issuer || c.issuedAt ? (
              <p className="cert__meta mono">
                {c.issuer}
                {c.issuer && c.issuedAt ? " · " : null}
                {c.issuedAt ? (
                  <>
                    délivrée en <time dateTime={isoMonth(c.issuedAt)}>{formatMonth(c.issuedAt)}</time>
                  </>
                ) : null}
                {c.expiresAt ? (
                  <>
                    {" "}· expire en <time dateTime={isoMonth(c.expiresAt)}>{formatMonth(c.expiresAt)}</time>
                  </>
                ) : null}
              </p>
            ) : null}
            {c.details ? <p className="cert__note">{c.details}</p> : null}
            {c.clarification ? <p className="cert__note">{c.clarification}</p> : null}
            {c.id === "sst" && firstAid ? (
              <p className="cert__note">Correspond à la compétence de profil « {firstAid.sourceLabel} ».</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Centres d'intérêt : le ton se détend, les faits restent ceux fournis par Evann. */
function Interests() {
  return (
    <div className="block">
      <SubHeading id="loisirs" title="Centres d'intérêt" meta="Dans la version 3D, ils jalonnent le circuit extérieur" />
      <ul className="hobbies">
        {hobbies.map((h) => (
          <li key={h.id}>
            <article id={`loisir-${h.id}`} tabIndex={-1} className="hobby" aria-labelledby={`loisir-${h.id}-title`}>
              <p className="hobby__kicker mono">{h.kicker}</p>
              <h4 id={`loisir-${h.id}-title`}>{h.title}</h4>
              {h.lines.map((l) => (
                <p key={l} className="hobby__text">
                  {l}
                </p>
              ))}
              {h.quote ? <blockquote className="hobby__quote">« {h.quote} »</blockquote> : null}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ParcoursSection() {
  return (
    <section className="section" data-nav="parcours" aria-labelledby="parcours">
      <SectionHeading
        id="parcours"
        index="01"
        title="Parcours"
        lead="Alternance à la DSI régionale de l'EFS, quatre stages dont trois chez NET4BUSINESS, un Bac Pro CIEL obtenu avec mention très bien et un BTS SIO SISR en cours."
      />
      <About />
      <Experiences />
      <Education />
      <Certifications />
      <Interests />
    </section>
  );
}
