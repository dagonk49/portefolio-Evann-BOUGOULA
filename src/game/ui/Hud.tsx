"use client";
import { useEffect, useRef, useState } from "react";
import { anomalies } from "@/data/anomalies";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { currentStep, MISSION_STEPS, stepCompletion } from "@/sim/mission";
import { labOnline } from "@/sim/diagnostics";
import { ContentPanel } from "./ContentPanel";
import { BayPanel, PcPanel } from "./MissionPanels";
import { HelpPanel, IndexPanel, PauseMenu } from "./MetaPanels";
import { openContent } from "./actions";

function MissionTracker() {
  const lab = useApp((s) => s.progress.lab);
  const mission = useApp((s) => s.progress.mission);
  const hints = useApp((s) => s.progress.hints);
  const revealHint = useApp((s) => s.revealHint);
  // Replié par défaut sur petit écran pour laisser la place à la scène et aux contrôles tactiles.
  const [open, setOpen] = useState(() => !window.matchMedia("(max-width: 720px), (pointer: coarse)").matches);
  const step = currentStep(lab, mission);
  const done = stepCompletion(lab, mission);
  const count = MISSION_STEPS.filter((s) => done[s.id]).length;
  const shown = step ? (hints[step.id] ?? 0) : 0;
  return (
    <section className={`hud-mission ${open ? "" : "is-collapsed"}`} aria-labelledby="hud-mission-title">
      <div className="hud-mission__head">
        <h2 id="hud-mission-title">
          <span className="lab-mono">Mission</span> Remettre le poste du lab en ligne
        </h2>
        <button type="button" className="hud-icon-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Réduire" : "Afficher"}
        </button>
      </div>
      {open ? (
        <>
          <ol className="hud-steps" aria-label={`${count} étapes sur ${MISSION_STEPS.length} terminées`}>
            {MISSION_STEPS.map((s, i) => (
              <li key={s.id} className={done[s.id] ? "is-done" : step?.id === s.id ? "is-current" : ""}>
                <span className="hud-steps__mark" aria-hidden="true">
                  {done[s.id] ? "✓" : i + 1}
                </span>
                <span>
                  {s.title}
                  <span className="sr-only">{done[s.id] ? " (terminée)" : step?.id === s.id ? " (en cours)" : ""}</span>
                </span>
              </li>
            ))}
          </ol>
          {step ? (
            <div className="hud-hints">
              <p className="lab-mono hud-where">Où : {step.where}</p>
              {step.hints.slice(0, shown).map((h, i) => (
                <p key={i} className="hud-hint">
                  Indice {i + 1} — {h}
                </p>
              ))}
              {shown < step.hints.length ? (
                <button type="button" className="hud-link" onClick={() => revealHint(step.id, step.hints.length)}>
                  {shown === 0 ? "Besoin d'un indice ?" : "Indice suivant"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="hud-hint">Mission accomplie : le poste est en ligne et l&apos;anomalie réseau est stabilisée.</p>
          )}
        </>
      ) : null}
    </section>
  );
}

function WelcomeCard() {
  const helpSeen = useApp((s) => s.settings.helpSeen);
  const updateSettings = useApp((s) => s.updateSettings);
  const openPanel = useLabUi((s) => s.openPanel);
  if (helpSeen) return null;
  return (
    <aside className="hud-welcome" aria-labelledby="hud-welcome-title">
      <h2 id="hud-welcome-title">Bienvenue dans mon lab</h2>
      <p>
        <span className="lab-kbd">ZQSD</span> / <span className="lab-kbd">WASD</span> ou flèches pour marcher, <span className="lab-kbd">Maj</span> pour courir,{" "}
        <span className="lab-kbd">Espace</span> pour sauter, <span className="lab-kbd">E</span> pour interagir.
      </p>
      <p>Approche-toi des dalles lumineuses et des anomalies de code. Tout le parcours est aussi dans l&apos;index.</p>
      <div className="hud-welcome__actions">
        <button type="button" className="lab-btn lab-btn--primary" onClick={() => updateSettings({ helpSeen: true })}>
          C&apos;est parti
        </button>
        <button
          type="button"
          className="lab-btn"
          onClick={() => {
            updateSettings({ helpSeen: true });
            openPanel({ kind: "index" });
          }}
        >
          Voir l&apos;index
        </button>
      </div>
    </aside>
  );
}

/** Notification brève quand la liaison est rétablie. */
function OnlineToast() {
  const passed = useApp((s) => s.progress.mission.diagnosticPassed);
  const [show, setShow] = useState(false);
  const prev = useRef(passed);
  useEffect(() => {
    if (passed && !prev.current) {
      setShow(true);
      const t = window.setTimeout(() => setShow(false), 6000);
      prev.current = passed;
      return () => window.clearTimeout(t);
    }
    prev.current = passed;
  }, [passed]);
  if (!show) return null;
  return (
    <p className="hud-toast" role="status">
      Liaison rétablie : les flux circulent. Une anomalie vient d&apos;apparaître au-dessus du switch, dans la baie.
    </p>
  );
}

export function Hud() {
  const zone = useLabUi((s) => s.zone);
  const panel = useLabUi((s) => s.panel);
  const openPanel = useLabUi((s) => s.openPanel);
  const states = useApp((s) => s.progress.anomalies);
  const lab = useApp((s) => s.progress.lab);
  const online = labOnline(lab);
  const viewed = anomalies.filter((a) => states[a.id] === "viewed").length;
  return (
    <div className="hud" data-panel-open={panel ? "true" : undefined}>
      <header className="hud-top">
        <div className="hud-brand">
          <p className="lab-mono hud-brand__name">EVANN // ROOT ACCESS</p>
          <p className="hud-zone" aria-live="polite">
            {zone}
            <span className={`hud-net ${online.server && online.gateway ? "is-up" : ""}`}>
              <span aria-hidden="true">{online.server && online.gateway ? "●" : "○"}</span> PC-LAB {online.server && online.gateway ? "en ligne" : "hors ligne"}
            </span>
          </p>
        </div>
        <nav className="hud-tools" aria-label="Outils du lab">
          <button type="button" className="hud-btn" onClick={() => openPanel({ kind: "index" })}>
            Index <span className="lab-kbd">I</span>
          </button>
          <button type="button" className="hud-btn" onClick={() => openContent({ type: "contact" })}>
            Contact
          </button>
          <button type="button" className="hud-btn" onClick={() => openPanel({ kind: "help" })}>
            Aide <span className="lab-kbd">H</span>
          </button>
          <button type="button" className="hud-btn" onClick={() => openPanel({ kind: "pause" })}>
            Menu <span className="lab-kbd">Échap</span>
          </button>
        </nav>
      </header>
      <div className="hud-bottom">
        <MissionTracker />
        <p className="hud-progress lab-mono" aria-label={`${viewed} anomalies stabilisées sur ${anomalies.length}`}>
          anomalies stabilisées {viewed}/{anomalies.length}
        </p>
      </div>
      <WelcomeCard />
      <OnlineToast />
    </div>
  );
}

/** Affiche le panneau ouvert, le cas échéant. */
export function Panels() {
  const panel = useLabUi((s) => s.panel);
  const close = useLabUi((s) => s.closePanel);
  if (!panel) return null;
  switch (panel.kind) {
    case "content":
      return <ContentPanel key={JSON.stringify(panel.ref)} refTo={panel.ref} anomalyId={panel.anomalyId} onClose={close} />;
    case "bay":
      return <BayPanel onClose={close} />;
    case "pc":
      return <PcPanel onClose={close} initialTab={panel.tab} />;
    case "index":
      return <IndexPanel onClose={close} />;
    case "help":
      return <HelpPanel onClose={close} />;
    case "pause":
      return <PauseMenu onClose={close} />;
  }
}
