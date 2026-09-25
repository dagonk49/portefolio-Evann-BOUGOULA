import type { Metadata } from "next";
import "@/styles/cv.css";
import {
  certifications,
  CONTACT_EMAIL,
  education,
  experiences,
  hobbies,
  homelab,
  internshipRank,
  organizationName,
  profile,
  projects,
  skillFamilies,
  skillsOfFamily,
} from "@/data";
import { certificationMeta, formatMonth, formatPeriod } from "@/lib/format";

export const metadata: Metadata = {
  title: `CV — ${profile.fullName}`,
  description: `CV d'${profile.fullName}, généré à partir des données du portfolio.`,
  robots: { index: false, follow: false },
};

/**
 * CV d'une page A4, généré à partir des mêmes données que le portfolio.
 * `node scripts/build-cv.mjs` l'imprime en PDF dans public/CV_Evann_Bougoula.pdf.
 */
export default function CvPage() {
  const netforge = projects.find((p) => p.id === "netforge")!;
  const { mobility } = profile;
  return (
    <main className="cv-page">
      <article className="cv" aria-label={`CV de ${profile.fullName}`}>
        <header className="cv__head">
          <div>
            <h1>{profile.fullName}</h1>
            {profile.status.map((s) => (
              <p key={s} className="cv__status">
                {s}
              </p>
            ))}
          </div>
          <ul className="cv__coords">
            <li>{CONTACT_EMAIL}</li>
            <li>github.com/dagonk49</li>
            <li>linkedin.com/in/evann-bougoula</li>
            {netforge.liveUrl ? <li>{new URL(netforge.liveUrl).host}</li> : null}
            <li>
              {mobility.license}, {mobility.vehicle.toLowerCase()}
            </li>
          </ul>
        </header>

        <p className="cv__profile">{profile.about[0]}</p>
        <p className="cv__mobility">
          <strong>Secteur :</strong> {mobility.areas.join(", ")} · {mobility.workModes.join(" ou ").toLowerCase()}
        </p>

        <div className="cv__grid">
          <div className="cv__main">
            <section>
              <h2>Expériences</h2>
              <ol className="cv__list">
                {experiences.map((e) => {
                  const rank = internshipRank(e);
                  return (
                    <li key={e.id}>
                      <p className="cv__when">{formatPeriod(e.period, "short")}</p>
                      <div>
                        <h3>
                          {organizationName(e.organizationId)}
                          <span>
                            {" "}
                            — {e.role === e.contract ? e.contract : `${e.role}, ${e.contract.toLowerCase()}`}
                            {rank ? ` ${rank.rank}/${rank.total}` : ""}
                          </span>
                        </h3>
                        {e.location ? <p className="cv__where">{`${e.location.city}${e.workMode ? ` · ${e.workMode}` : ""}`}</p> : null}
                        {e.missions.length ? (
                          <ul className="cv__missions">
                            {e.missions.map((m, i) => (
                              <li key={i}>
                                {m.title ? <strong>{m.title} : </strong> : null}
                                {m.text}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section>
              <h2>Formations</h2>
              <ol className="cv__list">
                {education.map((e) => (
                  <li key={e.id}>
                    <p className="cv__when">
                      {formatMonth(e.period.start, "short")} – {e.period.end === "present" ? "auj." : formatMonth(e.period.end, "short")}
                    </p>
                    <div>
                      <h3>
                        {e.shortName}
                        <span> — {e.school}</span>
                      </h3>
                      <p className="cv__where">
                        {e.status.kind === "en-cours"
                          ? `En cours · fin prévue en ${formatMonth(e.status.expectedEnd)}`
                          : `Obtenu en ${formatMonth(e.status.obtainedAt)}${e.result ? ` · ${e.result.grade}, ${e.result.honors.toLowerCase()}` : ""}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2>Projets</h2>
              <p>
                <strong>NetForge</strong> ({netforge.liveUrl ? new URL(netforge.liveUrl).host : "projet personnel"}) — {netforge.tagline}
              </p>
              <p>
                <strong>HomeLab</strong> — {homelab.hypervisor.label}, VM principale Docker (
                {homelab.mainVm.services.map((s) => s.label).join(", ")}), environnements de test (
                {homelab.testEnvironments.map((t) => t.label).join(", ")}), {homelab.networkPractice.map((n) => n.label).join(", ")}.
              </p>
            </section>
          </div>

          <aside className="cv__side">
            <section>
              <h2>Compétences</h2>
              <dl className="cv__skills">
                {skillFamilies.map((f) => (
                  <div key={f.id}>
                    <dt>{f.label}</dt>
                    <dd>{skillsOfFamily(f.id).map((s) => s.label).join(", ")}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section>
              <h2>Certifications</h2>
              <ul className="cv__certs">
                {certifications.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                    {certificationMeta(c) ? <span>{certificationMeta(c)}</span> : null}
                    {c.details ? <span>{c.details}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2>Centres d&apos;intérêt</h2>
              <p>{hobbies.map((h) => h.title).join(" · ")}</p>
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
