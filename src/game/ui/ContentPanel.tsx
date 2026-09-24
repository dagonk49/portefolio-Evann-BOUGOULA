"use client";
import { useState } from "react";
import {
  anchorFor,
  anomalies,
  anomalyById,
  certifications,
  getEducation,
  getExperience,
  getProject,
  getSkillFamily,
  homelab,
  internshipRank,
  organizationName,
  profile,
  skillById,
  skillsOfFamily,
  summarize,
} from "@/data";
import type { AnomalyId, ContentRef, Skill } from "@/data/types";
import { formatMonth, formatPeriod } from "@/lib/format";
import { useApp } from "@/state/app";
import { Dialog, Tabs } from "./Dialog";
import { openContent } from "./actions";

const KIND_LABEL = { entreprise: "Entreprise", formation: "Formation", "pratique-personnelle": "Pratique perso", projet: "Projet" } as const;

function RefButton({ refTo, children }: { refTo: ContentRef; children?: React.ReactNode }) {
  return (
    <button type="button" className="lab-link" onClick={() => openContent(refTo)}>
      {children ?? summarize(refTo).title}
    </button>
  );
}

function SkillChips({ ids }: { ids: Skill["id"][] }) {
  const unique = [...new Set(ids)].map((id) => skillById[id]);
  if (unique.length === 0) return null;
  return (
    <ul className="lab-chips" aria-label="Compétences liées">
      {unique.map((s) => (
        <li key={s.id}>
          <button type="button" className="lab-chip" onClick={() => openContent({ type: "skill-family", id: s.family })}>
            {s.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ExperienceBody({ id }: { id: Parameters<typeof getExperience>[0] }) {
  const e = getExperience(id);
  if (!e) return null;
  const rank = internshipRank(e);
  return (
    <>
      <p className="lab-meta">
        {e.role === e.contract ? e.contract : `${e.role} · ${e.contract}`}
        {rank ? ` · stage ${rank.rank}/${rank.total} chez ${organizationName(e.organizationId)}` : ""}
      </p>
      <p className="lab-meta lab-mono">
        {formatPeriod(e.period)}
        {e.location ? ` · ${e.location.city}, ${e.location.region}` : ""}
        {e.workMode ? ` · ${e.workMode}` : ""}
      </p>
      {e.context ? <p className="lab-lead">{e.context}</p> : null}
      {e.missions.length > 0 ? (
        <ul className="lab-list">
          {e.missions.map((m, i) => (
            <li key={i}>
              {m.title ? <strong>{m.title} — </strong> : null}
              {m.text}
            </li>
          ))}
        </ul>
      ) : null}
      <SkillChips ids={e.skills} />
    </>
  );
}

function EducationBody({ id }: { id: Parameters<typeof getEducation>[0] }) {
  const e = getEducation(id);
  if (!e) return null;
  return (
    <>
      <p className="lab-meta">
        {e.school}
        {e.level ? ` · ${e.level}` : ""}
      </p>
      {e.specialty ? <p className="lab-meta">{e.specialty}</p> : null}
      <p className="lab-meta lab-mono">{formatPeriod(e.period)}</p>
      {e.status.kind === "en-cours" ? (
        <p className="lab-status">Formation en cours · fin prévue en {formatMonth(e.status.expectedEnd)}</p>
      ) : (
        <p className="lab-status lab-status--ok">
          Diplôme obtenu en {formatMonth(e.status.obtainedAt)}
          {e.result ? ` · ${e.result.grade}, ${e.result.honors.toLowerCase()}` : ""}
        </p>
      )}
      <h3 className="lab-h3">Thèmes étudiés</h3>
      <dl className="lab-dl">
        {e.topics.map((g) => (
          <div key={g.title}>
            <dt>{g.title}</dt>
            <dd>{g.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function CertificationsBody() {
  return (
    <ul className="lab-certs">
      {certifications.map((c) => (
        <li key={c.id}>
          <p className="lab-strong">{c.name}</p>
          <p className="lab-meta lab-mono">
            {c.issuer} · délivrée en {formatMonth(c.issuedAt)}
            {c.expiresAt ? ` · expire en ${formatMonth(c.expiresAt)}` : ""}
          </p>
          {c.clarification ? <p className="lab-muted">{c.clarification}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function SkillFamilyBody({ id }: { id: Parameters<typeof getSkillFamily>[0] }) {
  const f = getSkillFamily(id);
  if (!f) return null;
  return (
    <>
      <p className="lab-lead">{f.description}</p>
      <ul className="lab-skills">
        {skillsOfFamily(f.id).map((s) => (
          <li key={s.id}>
            <p className="lab-strong">
              {s.label}
              {s.sourceLabel !== s.label ? <span className="lab-alias"> · profil : « {s.sourceLabel} »</span> : null}
            </p>
            {s.contexts.length > 0 ? (
              <ul className="lab-ctx">
                {s.contexts.map((c, i) => (
                  <li key={i}>
                    <span className={`lab-kind lab-kind--${c.kind}`}>{KIND_LABEL[c.kind]}</span> <RefButton refTo={c.ref} /> — {c.note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lab-muted">Compétence déclarée sur mon profil, sans contexte détaillé ici.</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function NetForgeBody() {
  const p = getProject("netforge")!;
  const [tab, setTab] = useState<"about" | "pillars" | "approach">("about");
  return (
    <>
      <p className="lab-meta lab-mono">
        {p.kind}
        {p.since ? ` · depuis ${formatMonth(p.since)}` : ""}
      </p>
      <p className="lab-lead">{p.tagline}</p>
      <Tabs
        label="Sections NetForge"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "about", label: "Présentation" },
          { id: "pillars", label: "Piliers" },
          { id: "approach", label: "Démarche" },
        ]}
      />
      <div role="tabpanel" className="lab-tabpanel">
        {tab === "about" ? (
          <>
            <h3 className="lab-h3">Le problème</h3>
            <p>{p.problem}</p>
            <h3 className="lab-h3">Pour qui</h3>
            <ul className="lab-list">{p.audience?.map((a) => <li key={a}>{a}</li>)}</ul>
            <h3 className="lab-h3">La solution</h3>
            <p>{p.solution}</p>
          </>
        ) : tab === "pillars" ? (
          <ol className="lab-pillars">
            {p.pillars.map((pl) => (
              <li key={pl.id}>
                <p className="lab-strong">{pl.title}</p>
                <ul className="lab-list">{pl.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <h3 className="lab-h3">Ce qu&apos;il apporte</h3>
            <ul className="lab-list">{p.value?.map((v) => <li key={v}>{v}</li>)}</ul>
            <h3 className="lab-h3">Ce qu&apos;il illustre de ma démarche</h3>
            <ul className="lab-list">{p.illustrates?.map((v) => <li key={v}>{v}</li>)}</ul>
          </>
        )}
      </div>
      <p className="lab-muted">
        Une démonstration pédagogique (calcul VLSM et aperçu IOS, réalisée pour ce portfolio) se trouve dans la section NetForge du
        mode sobre.
      </p>
      <SkillChips ids={p.skills} />
    </>
  );
}

function HomeLabBody() {
  return (
    <>
      <p className="lab-lead">{homelab.intro}</p>
      <div className="lab-schema" role="group" aria-label="Schéma logique du HomeLab">
        <p className="lab-schema__node lab-schema__node--host">
          <span className="lab-mono">Hyperviseur</span> {homelab.hypervisor.label}
        </p>
        <div className="lab-schema__children">
          <div className="lab-schema__node lab-schema__node--main">
            <p>
              <span className="lab-mono">VM principale</span> Docker
            </p>
            <p className="lab-muted">{homelab.mainVm.resourceShare}</p>
            <ul className="lab-list">
              {homelab.mainVm.services.map((s) => (
                <li key={s.id}>
                  {s.label}
                  {s.detail ? ` — ${s.detail.toLowerCase()}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="lab-schema__node">
            <p className="lab-mono">Environnements de test</p>
            <ul className="lab-list">{homelab.testEnvironments.map((e) => <li key={e.id}>{e.label}</li>)}</ul>
          </div>
        </div>
      </div>
      <h3 className="lab-h3">Pratique réseau personnelle</h3>
      <ul className="lab-list">
        {homelab.networkPractice.map((n) => (
          <li key={n.label}>
            <strong>{n.label}</strong> — {n.detail}
          </li>
        ))}
      </ul>
      <p className="lab-muted">Schéma illustratif des usages connus : ni nombre exact de VM, ni matériel, ni topologie précise.</p>
      <p>{homelab.spirit}</p>
      <SkillChips ids={homelab.skills} />
    </>
  );
}

function AboutBody() {
  return (
    <>
      <p className="lab-meta">{profile.headline}</p>
      <p className="lab-meta lab-mono">
        {profile.location} · {profile.currentTraining}
      </p>
      {profile.about.map((p, i) => (
        <p key={i} className={i === 0 ? "lab-lead" : undefined}>
          {p}
        </p>
      ))}
      <dl className="lab-dl">
        {profile.practiceScopes.map((s) => (
          <div key={s.title}>
            <dt>{s.title}</dt>
            <dd>{s.text}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function ContactBody() {
  const setMode = useApp((s) => s.setMode);
  return (
    <>
      <p className="lab-lead">
        Pour échanger sur une alternance, un stage ou un projet d&apos;infrastructure, écrivez-moi
        {profile.contacts.length === 1 ? ` sur ${profile.contacts[0]!.label}` : ""}.
      </p>
      {profile.contacts.map((c) => {
        const external = c.href.startsWith("http");
        return (
          <a key={c.id} className="lab-btn lab-btn--primary" href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {c.label} — {c.display}
            {external ? <span className="sr-only"> (nouvel onglet)</span> : null}
          </a>
        );
      })}
      <button
        type="button"
        className="lab-btn"
        onClick={() => {
          setMode("sober", { anchor: "contact" });
          window.setTimeout(() => window.print(), 400);
        }}
      >
        Imprimer mon parcours
      </button>
    </>
  );
}

function titleOf(ref: ContentRef): string {
  switch (ref.type) {
    case "experience": {
      const e = getExperience(ref.id);
      return e ? organizationName(e.organizationId) : ref.id;
    }
    case "education":
      return getEducation(ref.id)?.shortName ?? ref.id;
    case "project":
      return getProject(ref.id)?.name ?? ref.id;
    default:
      return summarize(ref).title;
  }
}

export function ContentPanel({ refTo, anomalyId, onClose }: { refTo: ContentRef; anomalyId?: AnomalyId; onClose: () => void }) {
  const setMode = useApp((s) => s.setMode);
  const anomalyStates = useApp((s) => s.progress.anomalies);
  const anomaly = anomalyId ? anomalyById[anomalyId] : undefined;
  const related = anomalies.filter((a) => JSON.stringify(a.target) === JSON.stringify(refTo));
  const body = (() => {
    switch (refTo.type) {
      case "experience":
        return <ExperienceBody id={refTo.id} />;
      case "education":
        return <EducationBody id={refTo.id} />;
      case "certification":
      case "certifications":
        return <CertificationsBody />;
      case "skill-family":
        return <SkillFamilyBody id={refTo.id} />;
      case "project":
        return refTo.id === "netforge" ? <NetForgeBody /> : <ProjectBody id={refTo.id} />;
      case "homelab":
        return <HomeLabBody />;
      case "about":
        return <AboutBody />;
      case "contact":
        return <ContactBody />;
    }
  })();
  return (
    <Dialog
      title={titleOf(refTo)}
      onClose={onClose}
      kicker={
        anomaly ? (
          <span className="lab-anomaly-tag">
            <span className="lab-mono">{anomaly.id}</span> · paquet restauré depuis « {anomaly.source} »
          </span>
        ) : (
          <span className="lab-mono">{summarize(refTo).group}</span>
        )
      }
      footer={
        <>
          <button type="button" className="lab-btn" onClick={() => setMode("sober", { anchor: anchorFor(refTo) })}>
            Voir dans le parcours (mode sobre)
          </button>
          {related.length > 0 && !anomaly ? (
            <p className="lab-foot-note lab-mono">
              {related.map((a) => `${a.id} : ${anomalyStates[a.id] === "viewed" ? "consultée" : anomalyStates[a.id] === "spotted" ? "repérée" : "à découvrir"}`).join(" · ")}
            </p>
          ) : null}
        </>
      }
    >
      {body}
    </Dialog>
  );
}

function ProjectBody({ id }: { id: Parameters<typeof getProject>[0] }) {
  const p = getProject(id);
  if (!p) return null;
  return (
    <>
      <p className="lab-meta lab-mono">
        {p.kind}
        {p.since ? ` · depuis ${formatMonth(p.since)}` : ""}
      </p>
      <p className="lab-lead">{p.tagline}</p>
      {p.problem ? <p>{p.problem}</p> : null}
      {p.solution ? <p>{p.solution}</p> : null}
      {p.pillars.map((pl) => (
        <div key={pl.id}>
          <h3 className="lab-h3">{pl.title}</h3>
          <ul className="lab-list">{pl.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
        </div>
      ))}
      {p.links.map((l) => (
        <a key={l.href} className="lab-btn" href={l.href} target="_blank" rel="noopener noreferrer">
          {l.label}
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
      ))}
      <SkillChips ids={p.skills} />
    </>
  );
}
