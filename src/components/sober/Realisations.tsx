import { e5Competences, realisationPeriod, realisations } from "@/data";
import type { Realisation, RealisationDocument, RealisationTest } from "@/data/types";
import { PrintFicheButton } from "@/components/PrintButton";
import { RefLink, SectionHeading } from "./common";
import { Schema } from "./Schemas";

const DOC_KIND: Record<RealisationDocument["kind"], string> = {
  installation: "Procédure d'installation",
  exploitation: "Guide d'exploitation / MCO",
  utilisateur: "Guide utilisateur",
};

/** Tableau de synthèse E5 : une ligne par réalisation, une colonne par compétence. */
function SynthesisTable() {
  return (
    <div className="table-wrap" role="region" aria-labelledby="e5-synthese-caption" tabIndex={0}>
      <table className="synth">
        <caption id="e5-synthese-caption">
          Tableau de synthèse des réalisations professionnelles — BTS SIO option SISR, épreuve E5
        </caption>
        <thead>
          <tr>
            <th scope="col">N°</th>
            <th scope="col">Réalisation, cadre et période</th>
            {e5Competences.map((c) => (
              <th key={c.id} scope="col" className="synth__comp">
                <span aria-hidden="true">{c.short}</span>
                <span className="sr-only">{c.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {realisations.map((r) => {
            const mobilised = new Set(r.competences.map((c) => c.id));
            return (
              <tr key={r.id}>
                <td className="mono">R{r.number}</td>
                <th scope="row" className="synth__title">
                  <a href={`#realisation-${r.id}`}>{r.title}</a>
                  <span className="synth__meta mono">
                    {r.context} · {realisationPeriod(r)}
                  </span>
                </th>
                {e5Competences.map((c) =>
                  mobilised.has(c.id) ? (
                    <td key={c.id} className="synth__cell is-on">
                      <span aria-hidden="true">●</span>
                      <span className="sr-only">Mobilisée</span>
                    </td>
                  ) : (
                    <td key={c.id} className="synth__cell">
                      <span aria-hidden="true">·</span>
                      <span className="sr-only">Non mobilisée</span>
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TestStatus({ t }: { t: RealisationTest }) {
  if (t.status === "OK") return <span className="status status--ok mono">OK</span>;
  if (t.status === "KO") return <span className="status status--ko mono">KO</span>;
  return (
    <span className="status status--none mono">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Statut non consigné</span>
    </span>
  );
}

function Fiche({ r }: { r: Realisation }) {
  const base = `realisation-${r.id}`;
  const mobilised = new Map(r.competences.map((c) => [c.id, c.how]));
  const period = realisationPeriod(r);
  return (
    <article id={base} className="fiche" data-fiche={r.id} tabIndex={-1} aria-labelledby={`${base}-title`}>
      <header className="fiche__head">
        <p className="fiche__num mono">
          <span>R{r.number}</span> · {r.context} · {period}
        </p>
        <h3 id={`${base}-title`}>{r.title}</h3>
        <p className="fiche__summary">{r.summary}</p>
        <ul className="chips" aria-label="Compétences E5 mobilisées">
          {e5Competences
            .filter((c) => mobilised.has(c.id))
            .map((c) => (
              <li key={c.id} className="mono">
                {c.short}
              </li>
            ))}
        </ul>
      </header>

      <details className="fiche__details">
        <summary>
          <span className="fiche__open mono">Consulter la fiche complète</span>
          <span className="fiche__close mono">Replier la fiche</span>
          <span className="sr-only"> : {r.title}</span>
        </summary>
        <div className="fiche__body">
          <div className="fiche__toolbar">
            <p className="mono">Fiche descriptive de réalisation professionnelle · R{r.number}</p>
            <PrintFicheButton id={r.id} title={r.title} />
          </div>

          <section className="fiche__part" aria-labelledby={`${base}-p1`}>
            <h4 id={`${base}-p1`}>
              <span className="mono">01</span> En-tête
            </h4>
            <dl className="fiche__header">
              <div>
                <dt>Intitulé</dt>
                <dd>{r.title}</dd>
              </div>
              <div>
                <dt>Contexte</dt>
                <dd>
                  {r.context} — {r.frame}
                </dd>
              </div>
              <div>
                <dt>Période</dt>
                <dd>{period}</dd>
              </div>
              <div>
                <dt>Rôle</dt>
                <dd>{r.role}</dd>
              </div>
            </dl>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p2`}>
            <h4 id={`${base}-p2`}>
              <span className="mono">02</span> Compétences E5 mobilisées
            </h4>
            <ul className="comp-list">
              {e5Competences.map((c) => {
                const how = mobilised.get(c.id);
                return (
                  <li key={c.id} className={how ? "is-on" : undefined}>
                    <span className="comp-list__mark mono" aria-hidden="true">
                      {how ? "[x]" : "[ ]"}
                    </span>
                    <div>
                      <p className="comp-list__title">
                        {c.title}
                        <span className="sr-only">{how ? " : mobilisée" : " : non mobilisée dans cette réalisation"}</span>
                      </p>
                      {how ? <p className="comp-list__how">{how}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p3`}>
            <h4 id={`${base}-p3`}>
              <span className="mono">03</span> Description technique
            </h4>
            <div className="prose">
              {r.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ul className="tags tags--static" aria-label="Environnement technique">
              {r.environment.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p4`}>
            <h4 id={`${base}-p4`}>
              <span className="mono">04</span> Schéma technique
            </h4>
            <figure className="schema">
              <div className="schema__scroll">
                <Schema id={r.schema} instance={r.id} />
              </div>
              <figcaption>{r.schemaCaption}</figcaption>
            </figure>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p5`}>
            <h4 id={`${base}-p5`}>
              <span className="mono">05</span> Captures et preuves
            </h4>
            <ul className="captures">
              {r.captures.map((c) => (
                <li key={c.id}>
                  <figure>
                    {c.src ? (
                      <img src={c.src} alt={c.alt ?? ""} loading="lazy" />
                    ) : (
                      <div className="captures__slot mono" aria-hidden="true">
                        capture non jointe
                      </div>
                    )}
                    <figcaption>
                      {c.caption}
                      {c.src ? null : <span className="captures__status"> Capture non jointe à la version en ligne.</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p6`}>
            <h4 id={`${base}-p6`}>
              <span className="mono">06</span> Documentation
            </h4>
            <ul className="docs">
              {r.documents.map((d) => (
                <li key={d.kind}>
                  <p className="docs__kind mono">{DOC_KIND[d.kind]}</p>
                  <p className="docs__title">{d.title}</p>
                  {d.href ? (
                    <a className="docs__link" href={d.href} target="_blank" rel="noopener noreferrer">
                      Ouvrir le document (PDF)<span className="sr-only"> : {d.title}, nouvel onglet</span>
                    </a>
                  ) : (
                    <p className="docs__status mono">Document non joint à la version en ligne</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="fiche__part" aria-labelledby={`${base}-p7`}>
            <h4 id={`${base}-p7`}>
              <span className="mono">07</span> Cahier de recette
            </h4>
            <div className="table-wrap" role="region" aria-labelledby={`${base}-p7`} tabIndex={0}>
              <table className="recette">
                <thead>
                  <tr>
                    <th scope="col">Cas testé</th>
                    <th scope="col">Résultat attendu</th>
                    <th scope="col">Résultat obtenu</th>
                    <th scope="col">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {r.tests.map((t) => (
                    <tr key={t.case}>
                      <th scope="row">{t.case}</th>
                      <td>{t.expected}</td>
                      <td className={t.observed ? undefined : "recette__none"}>{t.observed ?? "Non consigné"}</td>
                      <td>
                        <TestStatus t={t} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fiche__note">
              Les cas et les résultats attendus découlent des objectifs de la réalisation. Un résultat obtenu et son statut ne
              sont affichés que s&apos;ils ont été consignés lors de la recette.
            </p>
          </section>

          {r.links?.length || r.related.length ? (
            <footer className="fiche__foot">
              {r.links?.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              ))}
              {r.related.map((ref) => (
                <RefLink key={JSON.stringify(ref)} refTo={ref}>
                  Voir aussi : <RefLabel refTo={ref} />
                </RefLink>
              ))}
            </footer>
          ) : null}
        </div>
      </details>
    </article>
  );
}

function RefLabel({ refTo }: { refTo: Realisation["related"][number] }) {
  switch (refTo.type) {
    case "experience":
      return <>l&apos;expérience dans le parcours</>;
    case "project":
      return <>la présentation du projet</>;
    case "homelab":
      return <>la section HomeLab</>;
    default:
      return <>le contenu lié</>;
  }
}

export function RealisationsSection() {
  return (
    <section className="section" data-nav="realisations" aria-labelledby="realisations">
      <SectionHeading
        id="realisations"
        index="02"
        title="Réalisations & fiches E5"
        lead="Six réalisations professionnelles présentées selon le tableau de synthèse de l'épreuve E5 du BTS SIO SISR. Chaque fiche se déplie : en-tête, compétences mobilisées, description technique, schéma, preuves, documentation et cahier de recette."
      />
      <SynthesisTable />
      <dl className="comp-legend">
        {e5Competences.map((c) => (
          <div key={c.id}>
            <dt className="mono">{c.short}</dt>
            <dd>{c.title}</dd>
          </div>
        ))}
      </dl>
      <p className="section__note">
        Le rattachement de chaque réalisation aux compétences du référentiel est établi à partir des missions décrites. Les
        captures et documents absents de cette version en ligne sont signalés comme tels.
      </p>
      <ol className="fiches">
        {realisations.map((r) => (
          <li key={r.id}>
            <Fiche r={r} />
          </li>
        ))}
      </ol>
    </section>
  );
}
