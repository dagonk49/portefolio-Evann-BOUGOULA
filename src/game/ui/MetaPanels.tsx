"use client";
import { useState } from "react";
import { anomalies, contentIndex, refKey } from "@/data";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { MISSION_STEPS, stepCompletion } from "@/sim/mission";
import { Dialog } from "./Dialog";
import { openContent } from "./actions";
import { cameraControl } from "../camera/CameraRig";

const STATE_LABEL = { spotted: "repérée", viewed: "consultée" } as const;

/** Index de tous les contenus : consultables immédiatement, sans jouer. */
export function IndexPanel({ onClose }: { onClose: () => void }) {
  const states = useApp((s) => s.progress.anomalies);
  const mission = useApp((s) => s.progress.mission);
  const lab = useApp((s) => s.progress.lab);
  const setMode = useApp((s) => s.setMode);
  const entries = contentIndex();
  const groups = [...new Set(entries.map((e) => e.group))];
  const viewed = anomalies.filter((a) => states[a.id] === "viewed").length;
  const done = stepCompletion(lab, mission);
  const stepsDone = MISSION_STEPS.filter((s) => done[s.id]).length;
  return (
    <Dialog title="Index des contenus" kicker={<span className="lab-mono">Tout le parcours, accessible sans jouer</span>} onClose={onClose} size="wide">
      <div className="lab-index-summary">
        <p>
          <strong>{viewed}</strong> / {anomalies.length} anomalies stabilisées · mission : <strong>{stepsDone}</strong> / {MISSION_STEPS.length} étapes
        </p>
        <button type="button" className="lab-btn" onClick={() => setMode("sober")}>
          Lire le parcours en mode sobre
        </button>
      </div>
      <div className="lab-index">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`idx-${g}`}>
            <h3 id={`idx-${g}`} className="lab-h3">
              {g}
            </h3>
            <ul>
              {entries
                .filter((e) => e.group === g)
                .map((e) => {
                  const linked = anomalies.filter((a) => refKey(a.target) === refKey(e.ref));
                  return (
                    <li key={refKey(e.ref)}>
                      <button type="button" className="lab-index__item" onClick={() => openContent(e.ref)}>
                        <span className="lab-index__title">{e.title}</span>
                        <span className="lab-index__sub">{e.subtitle}</span>
                        {linked.length > 0 ? (
                          <span className="lab-index__anomaly lab-mono">
                            {linked.map((a) => `${a.id} · ${states[a.id] ? STATE_LABEL[states[a.id]!] : "à découvrir"}`).join(" — ")}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

export function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Aide et commandes" kicker={<span className="lab-mono">EVANN // ROOT ACCESS</span>} onClose={onClose}>
      <p className="lab-lead">
        Bienvenue dans mon lab. Explore les zones, stabilise les anomalies de code pour lire mon parcours et remets le poste du lab en
        ligne. Tout reste consultable depuis l&apos;index ou le mode sobre.
      </p>
      <h3 className="lab-h3">Clavier</h3>
      <dl className="lab-keys">
        {[
          ["ZQSD, WASD ou flèches", "se déplacer"],
          ["Maj", "courir"],
          ["Espace", "sauter"],
          ["E ou Entrée", "interagir, stabiliser une anomalie"],
          ["Échap", "fermer un panneau · pause"],
          ["I", "index des contenus"],
          ["H", "cette aide"],
          ["C", "recentrer la caméra"],
          ["Glisser · molette", "décaler la vue · zoomer"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="lab-kbd">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="lab-h3">Manette</h3>
      <p>Stick gauche : se déplacer · A / Croix : sauter · X / Carré : interagir · gâchette droite : courir · B / Rond : fermer · Start : pause.</p>
      <h3 className="lab-h3">Écran tactile</h3>
      <p>Joystick en bas à gauche, boutons Interagir, Sauter et Courir en bas à droite.</p>
    </Dialog>
  );
}

export function PauseMenu({ onClose }: { onClose: () => void }) {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const resetAll = useApp((s) => s.resetAll);
  const resetMission = useApp((s) => s.resetMission);
  const setMode = useApp((s) => s.setMode);
  const openPanel = useLabUi((s) => s.openPanel);
  const [confirm, setConfirm] = useState<null | "all" | "mission">(null);
  return (
    <Dialog title="Pause" onClose={onClose} size="center" closeLabel="Reprendre">
      <div className="lab-menu">
        <button type="button" className="lab-btn lab-btn--primary" onClick={onClose} data-autofocus>
          Reprendre
        </button>
        <button type="button" className="lab-btn" onClick={() => openPanel({ kind: "index" })}>
          Index des contenus
        </button>
        <button type="button" className="lab-btn" onClick={() => openPanel({ kind: "help" })}>
          Aide et commandes
        </button>
        <button
          type="button"
          className="lab-btn"
          onClick={() => {
            cameraControl.recenter();
            onClose();
          }}
        >
          Recentrer la caméra
        </button>
        <button type="button" className="lab-btn" onClick={() => setMode("sober")}>
          Passer au mode sobre
        </button>
      </div>
      <h3 className="lab-h3">Réglages</h3>
      <div className="lab-settings">
        <fieldset>
          <legend>Qualité graphique</legend>
          <label>
            <input type="radio" name="quality" checked={settings.quality === "high"} onChange={() => updateSettings({ quality: "high", autoQuality: false })} /> Haute (ombres, antialiasing)
          </label>
          <label>
            <input type="radio" name="quality" checked={settings.quality === "low"} onChange={() => updateSettings({ quality: "low", autoQuality: false })} /> Réduite (plus fluide)
          </label>
        </fieldset>
        <label className="lab-switch">
          <input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
          <span>Effets sonores (désactivés par défaut)</span>
        </label>
        <label className="lab-switch">
          <input type="checkbox" checked={settings.effects === false} onChange={(e) => updateSettings({ effects: e.target.checked ? false : null })} />
          <span>Réduire les animations décoratives</span>
        </label>
      </div>
      <h3 className="lab-h3">Progression</h3>
      {confirm ? (
        <div className="lab-confirm" role="alert">
          <p>{confirm === "all" ? "Effacer toute la progression et les préférences de ce navigateur ?" : "Recommencer la mission depuis le début ?"}</p>
          <button
            type="button"
            className="lab-btn lab-btn--danger"
            onClick={() => {
              if (confirm === "all") resetAll();
              else resetMission();
              setConfirm(null);
            }}
          >
            Confirmer
          </button>
          <button type="button" className="lab-btn" onClick={() => setConfirm(null)}>
            Annuler
          </button>
        </div>
      ) : (
        <div className="lab-menu lab-menu--inline">
          <button type="button" className="lab-btn" onClick={() => setConfirm("mission")}>
            Recommencer la mission
          </button>
          <button type="button" className="lab-btn" onClick={() => setConfirm("all")}>
            Réinitialiser toute la progression
          </button>
        </div>
      )}
    </Dialog>
  );
}
