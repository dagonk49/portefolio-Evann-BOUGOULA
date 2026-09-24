"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { complete, execute, type EasterEgg, type Line } from "@/terminal/interpreter";
import { effectsEnabled, useApp } from "@/state/app";
import { detectWebGL, openExternal, prefersReducedMotion } from "@/lib/device";
import { EasterEggFx } from "./EasterEggFx";

const PROMPT = "visiteur@evann:~$";
const MAX_ENTRIES = 200;

type NewEntry = { kind: "input"; text: string } | { kind: "output"; lines: Line[]; fx?: EasterEgg };
type Entry = NewEntry & { id: number };

const WELCOME: Line[] = [
  [{ kind: "text", text: "EVANN // ROOT ACCESS — terminal du portfolio (commandes locales uniquement).", tone: "muted" }],
  [
    { kind: "text", text: "Tape " },
    { kind: "text", text: "help", tone: "accent" },
    { kind: "text", text: " pour voir les commandes." },
  ],
];

export function Terminal() {
  const setMode = useApp((s) => s.setMode);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, kind: "output", lines: WELCOME }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [reduced, setReduced] = useState(false);
  const [can3d, setCan3d] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();

  useEffect(() => {
    setReduced(prefersReducedMotion());
    setCan3d(detectWebGL());
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries]);

  const fxOn = effectsEnabled(settings, reduced);

  const push = (...items: NewEntry[]) =>
    setEntries((prev) => [...prev, ...items.map((e): Entry => ({ ...e, id: nextId.current++ }))].slice(-MAX_ENTRIES));

  /** Exécuté dans le gestionnaire de la touche Entrée : l'ouverture d'onglet reste un geste utilisateur. */
  const submit = () => {
    const input = value;
    setValue("");
    setCursor(null);
    setHint("");
    if (input.trim() === "") {
      push({ kind: "input", text: "" });
      return;
    }
    const result = execute(input, { history, can3d });
    setHistory((h) => [...h, input.trim()].slice(-100));
    let fx: EasterEgg | undefined;
    for (const effect of result.effects) {
      if (effect.type === "open-url") openExternal(effect.url);
      if (effect.type === "fx") fx = effect.name;
    }
    if (result.effects.some((e) => e.type === "clear")) {
      setEntries([]);
      return;
    }
    push({ kind: "input", text: input }, { kind: "output", lines: result.lines, fx });
    if (result.effects.some((e) => e.type === "enter-3d")) setMode("lab");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (history.length === 0) return;
      e.preventDefault();
      let next: number | null;
      if (e.key === "ArrowUp") next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      else next = cursor === null ? null : cursor + 1 >= history.length ? null : cursor + 1;
      setCursor(next);
      setValue(next === null ? "" : (history[next] ?? ""));
      return;
    }
    if (e.key === "Tab" && !e.shiftKey) {
      // Tab ne complète que si une commande correspond ; sinon le focus avance normalement.
      const { value: completion, candidates } = complete(value);
      if (completion && completion !== value) {
        e.preventDefault();
        setValue(completion);
        setHint(candidates.length > 1 ? `Possibilités : ${candidates.join(", ")}` : "");
      } else if (candidates.length > 1 && value.trim() !== "") {
        e.preventDefault();
        setHint(`Possibilités : ${candidates.join(", ")}`);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      shellRef.current?.focus();
    }
  };

  const runAction = (action: "print" | "enter-3d") => {
    if (action === "print") window.print();
    else setMode("lab");
  };

  return (
    <div className="terminal" ref={shellRef} tabIndex={-1} aria-label="Terminal interactif">
      <div className="terminal__bar">
        <span className="terminal__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="terminal__title mono">{PROMPT.replace(":~$", "")} — bash (simulé)</span>
        <button
          type="button"
          className="terminal__fx-toggle mono"
          aria-pressed={fxOn}
          onClick={() => updateSettings({ effects: !fxOn })}
        >
          Effets visuels : {fxOn ? "activés" : "désactivés"}
        </button>
      </div>
      <div
        className="terminal__log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Sortie du terminal"
        onMouseUp={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("a,button") || window.getSelection()?.toString()) return;
          inputRef.current?.focus();
        }}
      >
        {entries.map((entry) =>
          entry.kind === "input" ? (
            <p key={entry.id} className="terminal__line terminal__line--input">
              <span className="terminal__prompt" aria-hidden="true">
                {PROMPT}
              </span>{" "}
              <span className="sr-only">Commande : </span>
              {entry.text}
            </p>
          ) : (
            <div key={entry.id} className="terminal__out">
              {entry.lines.map((line, i) => (
                <p key={i} className="terminal__line">
                  {line.length === 0
                    ? " "
                    : line.map((seg, j) => {
                        if (seg.kind === "link") {
                          return (
                            <a key={j} href={seg.href} target="_blank" rel="noopener noreferrer">
                              {seg.text}
                            </a>
                          );
                        }
                        if (seg.kind === "action") {
                          return (
                            <button key={j} type="button" className="terminal__action" onClick={() => runAction(seg.action)}>
                              {seg.text}
                            </button>
                          );
                        }
                        return (
                          <span key={j} className={seg.tone ? `tone-${seg.tone}` : undefined}>
                            {seg.text}
                          </span>
                        );
                      })}
                </p>
              ))}
              {entry.fx && fxOn ? <EasterEggFx name={entry.fx} /> : null}
            </div>
          ),
        )}
      </div>
      <div className="terminal__input-row">
        <label htmlFor={inputId} className="terminal__prompt">
          {PROMPT}
          <span className="sr-only"> Saisir une commande</span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="terminal__input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCursor(null);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          aria-describedby={hintId}
        />
      </div>
      <p id={hintId} className="terminal__hint mono">
        {hint || "Entrée : valider · Tab : compléter · ↑ ↓ : historique · Échap : quitter le terminal"}
      </p>
    </div>
  );
}
