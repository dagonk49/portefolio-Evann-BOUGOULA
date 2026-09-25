"use client";
/**
 * Fenêtre « Options » du mode 3D (engrenage du HUD ou touche O) : son,
 * rappel des commandes, graphismes. Tous les réglages sont persistés.
 */
import { useId } from "react";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { useAudioController } from "@/audio/useAudioController";
import { Dialog } from "./Dialog";

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="opt-keys">
      {keys.map((k, i) =>
        k === "/" || k === "ou" ? (
          <span key={i} className="opt-keys__sep">
            {k}
          </span>
        ) : (
          <kbd key={i} className="lab-kbd">
            {k}
          </kbd>
        ),
      )}
    </span>
  );
}

const CONTROLS: { title: string; rows: [string, string[]][] }[] = [
  {
    title: "À pied",
    rows: [
      ["Se déplacer (clavier AZERTY)", ["Z", "Q", "S", "D"]],
      ["Se déplacer (clavier QWERTY)", ["W", "A", "S", "D"]],
      ["Se déplacer (flèches)", ["←", "↑", "→", "↓"]],
      ["Courir (sprint)", ["Maj"]],
      ["Sauter", ["Espace"]],
      ["Interagir avec une machine, une dalle, une anomalie", ["E", "ou", "Entrée"]],
    ],
  },
  {
    title: "Conduite (kart et mode NASCAR)",
    rows: [
      ["Accélérer", ["Z", "/", "↑"]],
      ["Freiner, puis reculer", ["S", "/", "↓"]],
      ["Braquer", ["Q", "/", "D", "ou", "←", "/", "→"]],
      ["Dérapage (frein à main)", ["Espace"]],
      ["Monter ou descendre", ["F"]],
      ["Remettre sur ses roues", ["R"]],
    ],
  },
  {
    title: "Interface",
    rows: [
      ["Quitter une interface, pause", ["Échap"]],
      ["Options", ["O"]],
      ["Index des contenus", ["I"]],
      ["Aide", ["H"]],
      ["Recentrer la caméra", ["C"]],
    ],
  },
];

function Slider({
  label,
  value,
  onChange,
  dimmed,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  dimmed: boolean;
}) {
  const id = useId();
  const pct = Math.round(value * 100);
  return (
    <div className={`opt-slider ${dimmed ? "is-dimmed" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        aria-valuetext={`${pct} %${dimmed ? ", son coupé" : ""}`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <output htmlFor={id} className="lab-mono">
        {pct} %
      </output>
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const audio = useAudioController();
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const world = useApp((s) => s.world);
  const nascar = useApp((s) => s.isNascarUnlocked);
  const openPanel = useLabUi((s) => s.openPanel);
  const circuit = world === "circuit";
  return (
    <Dialog title="Options" kicker={<span className="lab-mono">Son · commandes · graphismes</span>} onClose={onClose} size="wide">
      <div className="opt-grid">
        <section className="opt-section" aria-labelledby="opt-audio">
          <h3 id="opt-audio" className="lab-h3">
            Son
          </h3>
          <label className="opt-switch">
            <input type="checkbox" role="switch" checked={!audio.muted} onChange={(e) => audio.setMuted(!e.target.checked)} data-autofocus />
            <span className="opt-switch__track" aria-hidden="true" />
            <span>{audio.muted ? "Son désactivé" : "Son activé"}</span>
          </label>
          <Slider label="Musique d'ambiance" value={audio.music} onChange={audio.setMusic} dimmed={audio.muted} />
          <Slider label="Effets sonores et voix de l'intro" value={audio.sfx} onChange={audio.setSfx} dimmed={audio.muted} />
          {audio.phase === "blocked" ? (
            <button type="button" className="lab-btn lab-btn--primary" onClick={audio.resumeBlocked}>
              ▶ Activer le son (bloqué par le navigateur)
            </button>
          ) : null}
          {circuit ? (
            <div className="opt-actions">
              <button type="button" className="lab-btn" aria-pressed={audio.musicOn} onClick={audio.toggleMusic}>
                {audio.musicOn ? "Arrêter la musique" : "Lancer la musique"}
              </button>
              {nascar ? (
                audio.phase === "intro" ? (
                  <button type="button" className="lab-btn" onClick={audio.skipIntro}>
                    Passer l&apos;intro
                  </button>
                ) : (
                  <button type="button" className="lab-btn" onClick={audio.replayIntro}>
                    {audio.introPlayed ? "Rejouer l'intro" : "Lancer l'intro"}
                  </button>
                )
              ) : null}
            </div>
          ) : (
            <p className="lab-muted">La musique d&apos;ambiance accompagne le circuit extérieur.</p>
          )}
          <p className="lab-muted">Coupé par défaut : rien ne se lance sans ton accord.</p>
        </section>

        <section className="opt-section opt-section--controls" aria-labelledby="opt-controls">
          <h3 id="opt-controls" className="lab-h3">
            Contrôles et raccourcis
          </h3>
          {CONTROLS.map((group) => (
            <div key={group.title} className="opt-controls">
              <p className="opt-controls__title lab-mono">{group.title}</p>
              <dl>
                {group.rows.map(([action, keys]) => (
                  <div key={action}>
                    <dt>{action}</dt>
                    <dd>
                      <Keys keys={keys} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <button type="button" className="lab-link" onClick={() => openPanel({ kind: "help" })}>
            Aide détaillée (manette, écran tactile)
          </button>
        </section>

        <section className="opt-section" aria-labelledby="opt-gfx">
          <h3 id="opt-gfx" className="lab-h3">
            Graphismes et performance
          </h3>
          <fieldset className="opt-quality">
            <legend>Qualité</legend>
            <label>
              <input
                type="radio"
                name="opt-quality"
                checked={settings.quality === "high"}
                onChange={() => updateSettings({ quality: "high", autoQuality: false })}
              />
              <span>
                <strong>Élevée</strong> — ombres douces, halo lumineux (bloom) sur les néons, antialiasing
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="opt-quality"
                checked={settings.quality === "low"}
                onChange={() => updateSettings({ quality: "low", autoQuality: false })}
              />
              <span>
                <strong>Basse</strong> — sans ombres ni bloom, plus fluide sur les machines modestes
              </span>
            </label>
          </fieldset>
          <label className="lab-switch">
            <input type="checkbox" checked={settings.autoQuality} onChange={(e) => updateSettings({ autoQuality: e.target.checked })} />
            <span>Baisser la qualité automatiquement si l&apos;animation ralentit</span>
          </label>
          <label className="lab-switch">
            <input type="checkbox" checked={settings.effects === false} onChange={(e) => updateSettings({ effects: e.target.checked ? false : null })} />
            <span>Réduire les animations décoratives</span>
          </label>
        </section>
      </div>
    </Dialog>
  );
}
