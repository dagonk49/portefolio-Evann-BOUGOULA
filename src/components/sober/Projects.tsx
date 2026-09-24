import { homelab, projects, skillById } from "@/data";
import { formatMonth } from "@/lib/format";
import { NetForgeLaunch } from "@/components/NetForgeLaunch";
import { SectionHeading } from "./common";

export function ProjectsSection() {
  const nf = projects.find((p) => p.id === "netforge")!;
  return (
    <section className="section" aria-labelledby="projets">
      <SectionHeading id="projets" index="04" title="Projets" />

      <article id="projet-netforge" tabIndex={-1} className="case" aria-labelledby="projet-netforge-title">
        <header className="case__head">
          <p className="case__kicker mono">
            {nf.kind}
            {nf.since ? ` · depuis ${formatMonth(nf.since)}` : ""}
          </p>
          <h3 id="projet-netforge-title" className="case__title">
            {nf.name}
          </h3>
          <p className="case__tagline">{nf.tagline}</p>
        </header>

        <NetForgeLaunch variant="sober" />

        <div className="case__grid">
          <div>
            <h4 className="case__label mono">Le problème</h4>
            <p>{nf.problem}</p>
          </div>
          <div>
            <h4 className="case__label mono">Pour qui</h4>
            <ul className="dash-list">
              {nf.audience?.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="case__label mono">La solution</h4>
            <p>{nf.solution}</p>
          </div>
        </div>

        <h4 className="case__label mono case__label--spaced">Quatre piliers</h4>
        <ol className="pillars">
          {nf.pillars.map((p, i) => (
            <li key={p.id} className="pillar">
              <span className="pillar__n mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h5>{p.title}</h5>
              <ul className="dash-list">
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="case__grid case__grid--2">
          <div>
            <h4 className="case__label mono">Ce qu&apos;il apporte</h4>
            <ul className="dash-list">
              {nf.value?.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="case__label mono">Ce qu&apos;il illustre de ma démarche</h4>
            <ul className="dash-list">
              {nf.illustrates?.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="tags" aria-label="Compétences liées">
          {nf.skills.map((id) => (
            <li key={id}>
              <a href={`#competences-${skillById[id].family}`}>{skillById[id].label}</a>
            </li>
          ))}
        </ul>

      </article>

      {projects
        .filter((p) => p.id !== "netforge")
        .map((p) => (
          <article key={p.id} id={`projet-${p.id}`} tabIndex={-1} className="case case--secondary" aria-labelledby={`projet-${p.id}-title`}>
            <header className="case__head">
              <p className="case__kicker mono">
                {p.kind}
                {p.since ? ` · depuis ${formatMonth(p.since)}` : ""}
              </p>
              <h3 id={`projet-${p.id}-title`} className="case__title case__title--small">
                {p.name}
              </h3>
              <p className="case__tagline">{p.tagline}</p>
            </header>
            {p.problem || p.solution ? (
              <div className="case__grid case__grid--2">
                {p.problem ? (
                  <div>
                    <h4 className="case__label mono">Le problème</h4>
                    <p>{p.problem}</p>
                  </div>
                ) : null}
                {p.solution ? (
                  <div>
                    <h4 className="case__label mono">La solution</h4>
                    <p>{p.solution}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="case__grid case__grid--2">
              {p.pillars.map((pl) => (
                <div key={pl.id}>
                  <h4 className="case__label mono">{pl.title}</h4>
                  <ul className="dash-list">
                    {pl.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {p.links.length > 0 ? (
              <ul className="tags" aria-label="Liens du projet">
                {p.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
    </section>
  );
}

export function HomeLabSection() {
  return (
    <section className="section" aria-labelledby="homelab">
      <SectionHeading id="homelab" index="05" title="HomeLab" lead={homelab.intro} />
      <figure className="lab-diagram">
        <div className="lab-diagram__host">
          <p className="lab-node__type mono">Hyperviseur</p>
          <p className="lab-node__name">{homelab.hypervisor.label}</p>
          <p className="lab-node__detail">{homelab.hypervisor.detail}</p>

          <div className="lab-diagram__vms">
            <div className="lab-node lab-node--main">
              <p className="lab-node__type mono">VM principale</p>
              <p className="lab-node__name">Docker</p>
              <p className="lab-node__detail">{homelab.mainVm.detail}</p>
              <p className="lab-node__share mono">{homelab.mainVm.resourceShare}</p>
              <ul className="lab-services" aria-label="Services hébergés dans des conteneurs">
                {homelab.mainVm.services.map((s) => (
                  <li key={s.id}>
                    <span className="lab-services__name">{s.label}</span>
                    {s.detail ? <span className="lab-services__detail">{s.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lab-node lab-node--tests">
              <p className="lab-node__type mono">Environnements de test</p>
              <ul className="lab-envs">
                {homelab.testEnvironments.map((e) => (
                  <li key={e.id}>{e.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="lab-diagram__net">
          <p className="lab-node__type mono">Pratique réseau personnelle</p>
          <ul className="lab-net">
            {homelab.networkPractice.map((n) => (
              <li key={n.label}>
                <strong>{n.label}</strong> <span>{n.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <figcaption>
          Schéma logique des usages connus de mon lab. Il n&apos;indique ni le nombre exact de VM, ni le matériel, ni la
          topologie réseau précise.
        </figcaption>
      </figure>
      <p className="lab-spirit">{homelab.spirit}</p>
    </section>
  );
}
