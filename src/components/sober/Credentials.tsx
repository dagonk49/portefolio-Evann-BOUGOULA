import { certifications, education, profile, skills } from "@/data";
import { formatMonth, isoMonth } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { SectionHeading } from "./common";

export function EducationSection() {
  const firstAid = skills.find((s) => s.certificationId === "sst");
  return (
    <section className="section" aria-labelledby="formations">
      <SectionHeading id="formations" index="06" title="Formations et certifications" />
      <div className="edu-grid">
        {education.map((e) => (
          <article key={e.id} id={`formation-${e.id}`} tabIndex={-1} className="edu" aria-labelledby={`formation-${e.id}-title`}>
            <p className="edu__when mono">
              <time dateTime={isoMonth(e.period.start)}>{formatMonth(e.period.start, "short")}</time>
              {" – "}
              {e.period.end !== "present" ? <time dateTime={isoMonth(e.period.end)}>{formatMonth(e.period.end, "short")}</time> : "aujourd'hui"}
            </p>
            <h3 id={`formation-${e.id}-title`}>{e.shortName}</h3>
            <p className="edu__school">
              {e.school}
              {e.level ? ` · ${e.level}` : ""}
            </p>
            {e.specialty ? <p className="edu__specialty">{e.specialty}</p> : null}
            {e.status.kind === "en-cours" ? (
              <p className="edu__status mono">Formation en cours · fin prévue en {formatMonth(e.status.expectedEnd)}</p>
            ) : (
              <p className="edu__status edu__status--done mono">
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

      <div id="certifications" tabIndex={-1} className="certs" aria-labelledby="certifications-title">
        <h3 id="certifications-title" className="certs__title">
          Certifications
        </h3>
        <ul className="cert-list">
          {certifications.map((c) => (
            <li key={c.id} id={`certification-${c.id}`} className="cert">
              <p className="cert__name">{c.name}</p>
              <p className="cert__meta mono">
                {c.issuer} · délivrée en <time dateTime={isoMonth(c.issuedAt)}>{formatMonth(c.issuedAt)}</time>
                {c.expiresAt ? (
                  <>
                    {" "}· expire en <time dateTime={isoMonth(c.expiresAt)}>{formatMonth(c.expiresAt)}</time>
                  </>
                ) : null}
              </p>
              {c.clarification ? <p className="cert__note">{c.clarification}</p> : null}
              {c.id === "sst" && firstAid ? (
                <p className="cert__note">Correspond à la compétence de profil « {firstAid.sourceLabel} ».</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="section" aria-labelledby="contact">
      <SectionHeading id="contact" index="08" title="Contact" lead={`Pour échanger sur une alternance, un stage ou un projet d'infrastructure, écrivez-moi${profile.contacts.length === 1 ? ` sur ${profile.contacts[0]!.label}` : ""}.`} />
      <div className="contact">
        {profile.contacts.map((c) => {
          const external = c.href.startsWith("http");
          return (
            <a
              key={c.id}
              className="contact__link"
              href={c.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="contact__label mono">{c.label}</span>
              <span className="contact__value">{c.display}</span>
              {external ? <span className="sr-only"> (ouvre un nouvel onglet)</span> : null}
            </a>
          );
        })}
        <div className="contact__print">
          {profile.cvFile ? (
            <a className="btn btn--ghost" href={profile.cvFile} download>
              Télécharger mon CV
            </a>
          ) : (
            <PrintButton />
          )}
        </div>
      </div>
    </section>
  );
}
