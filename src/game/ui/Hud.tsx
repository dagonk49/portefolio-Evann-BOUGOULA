"use client";
import { useEffect, useRef, useState } from "react";
import type { WorldId } from "@/data/types";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { currentStep, MISSION_STEPS, stepCompletion } from "@/sim/mission";
import { labOnline } from "@/sim/diagnostics";
import { ContentPanel } from "./ContentPanel";
import { BayPanel, PcPanel } from "./MissionPanels";
import { HelpPanel, IndexPanel, PauseMenu } from "./MetaPanels";
import { exitVehicle, openContent, resetVehicle } from "./actions";
import { hasCoarsePointer } from "@/lib/device";
import { SettingsModal } from "./SettingsModal";
import { TutorialBanner } from "./TutorialBanner";
import { useAudioController } from "@/audio/useAudioController";
import { anomaliesOf } from "../interaction";
import { drive, lapClock, VEHICLE_LABEL } from "../circuit/vehicleState";
import { formatLap } from "../circuit/layout";

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

/** Lecture refusée par le navigateur : seul rappel sonore laissé dans le HUD, le temps de l'autoriser. */
function AudioBlockedPrompt() {
  const audio = useAudioController();
  if (audio.phase !== "blocked") return null;
  return (
    <button type="button" className="hud-btn hud-btn--accent hud-audio-blocked" onClick={audio.resumeBlocked}>
      <span aria-hidden="true">▶</span> Activer le son
    </button>
  );
}

/** Compteur de vitesse et chronomètre (mis à jour hors React, à chaque image). */
function DriveHud() {
  const driving = useLabUi((s) => s.driving);
  const bestLap = useApp((s) => s.bestLap);
  const speed = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const lap = useRef<HTMLSpanElement>(null);
  const last = useRef<HTMLSpanElement>(null);
  const drift = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (speed.current) speed.current.textContent = String(Math.round(drive.kmh));
      if (bar.current) bar.current.style.transform = `scaleX(${drive.speed01.toFixed(3)})`;
      const start = lapClock.state.lapStart;
      if (lap.current) lap.current.textContent = start !== null ? formatLap(performance.now() - start) : "—";
      if (last.current) last.current.textContent = lapClock.last !== null ? formatLap(lapClock.last) : "—";
      if (drift.current) drift.current.dataset.on = drive.drifting ? "true" : "false";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!driving) return null;
  return (
    <section className="hud-drive" aria-label={`Tableau de bord : ${VEHICLE_LABEL[driving]}`}>
      <div className="hud-drive__speed">
        <p className="lab-mono">
          <span ref={speed} className="hud-drive__kmh">
            0
          </span>{" "}
          <span className="hud-drive__unit">km/h</span>
        </p>
        <span className="hud-drive__bar" aria-hidden="true">
          <span ref={bar} />
        </span>
        <span ref={drift} className="hud-drive__drift lab-mono" data-on="false" aria-hidden="true">
          DRIFT
        </span>
      </div>
      <dl className="hud-drive__laps lab-mono">
        <div>
          <dt>Tour</dt>
          <dd>
            <span ref={lap}>—</span>
          </dd>
        </div>
        <div>
          <dt>Dernier</dt>
          <dd>
            <span ref={last}>—</span>
          </dd>
        </div>
        <div>
          <dt>Record</dt>
          <dd>{bestLap !== null ? formatLap(bestLap) : "—"}</dd>
        </div>
      </dl>
      <div className="hud-drive__actions">
        <button type="button" className="hud-btn" onClick={() => exitVehicle()}>
          Descendre <span className="lab-kbd">F</span>
        </button>
        <button type="button" className="hud-btn" onClick={() => resetVehicle()}>
          Redresser <span className="lab-kbd">R</span>
        </button>
      </div>
    </section>
  );
}

export function Hud({ world = "lab" }: { world?: WorldId }) {
  const zone = useLabUi((s) => s.zone);
  const panel = useLabUi((s) => s.panel);
  const openPanel = useLabUi((s) => s.openPanel);
  const states = useApp((s) => s.progress.anomalies);
  const lab = useApp((s) => s.progress.lab);
  const online = labOnline(lab);
  const list = anomaliesOf(world);
  const viewed = list.filter((a) => states[a.id] === "viewed").length;
  const circuit = world === "circuit";
  return (
    <div className="hud" data-panel-open={panel ? "true" : undefined} data-world={world}>
      <header className="hud-top">
        <div className="hud-brand">
          <p className="lab-mono hud-brand__name">EVANN // ROOT ACCESS</p>
          <p className="hud-zone" aria-live="polite">
            {zone}
            {circuit ? (
              <span className="hud-net is-up">
                <span aria-hidden="true">◆</span> circuit extérieur
              </span>
            ) : (
              <span className={`hud-net ${online.server && online.gateway ? "is-up" : ""}`}>
                <span aria-hidden="true">{online.server && online.gateway ? "●" : "○"}</span> PC-LAB {online.server && online.gateway ? "en ligne" : "hors ligne"}
              </span>
            )}
          </p>
        </div>
        <nav className="hud-tools" aria-label={circuit ? "Outils du circuit" : "Outils du lab"}>
          <button type="button" className="hud-btn" onClick={() => openPanel({ kind: "index" })}>
            Index <span className="lab-kbd">I</span>
          </button>
          <button type="button" className="hud-btn" onClick={() => openContent({ type: "contact" })}>
            Contact
          </button>
          <button type="button" className="hud-btn" onClick={() => openPanel({ kind: "pause" })}>
            Menu <span className="lab-kbd">Échap</span>
          </button>
          {/* Engrenage discret, collé à la bascule de mode : son, commandes, graphismes. */}
          <button type="button" className="hud-btn hud-btn--gear" onClick={() => openPanel({ kind: "settings" })} aria-label="Options">
            <span className="hud-gear" aria-hidden="true">
              ⚙
            </span>
            <span className="hud-gear__label">Options</span> <span className="lab-kbd">O</span>
          </button>
        </nav>
      </header>
      <div className="hud-bottom">
        {circuit ? <DriveHud /> : <MissionTracker />}
        <p className="hud-progress lab-mono" aria-label={`${viewed} anomalies stabilisées sur ${list.length} ${circuit ? "sur le circuit" : "dans le lab"}`}>
          {circuit ? "loisirs découverts" : "anomalies stabilisées"} {viewed}/{list.length}
        </p>
      </div>
      <AudioBlockedPrompt />
      <TutorialBanner key={world} world={world} />
      {circuit ? null : <OnlineToast />}
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
    case "settings":
      return <SettingsModal onClose={close} />;
    case "pause":
      return <PauseMenu onClose={close} />;
  }
}
