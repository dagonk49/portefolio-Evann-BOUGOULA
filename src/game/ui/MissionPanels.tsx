"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { playCue } from "@/lib/sound";
import { formatIPv4, prefixToMask } from "@/lib/ipv4";
import {
  cableAt,
  computeNetwork,
  endpointLabel,
  interfacesOf,
  isFixedEndpoint,
  linkStatus,
  portConfig,
  validatePcConfig,
  vlanName,
  type ActiveEndpoint,
  type FieldError,
  type LabState,
} from "@/sim/network";
import { explainLink, type DiagnosticReport } from "@/sim/diagnostics";
import { PC_COMMANDS, runPcCommand, runSwitchCommand, SWITCH_COMMANDS } from "@/sim/consoles";
import { DEVICES, EDITABLE_PORTS, ENDPOINTS, VLANS, type EditablePortId, type EndpointDef, type SwitchPortId } from "@/sim/scenario";
import { Dialog, Tabs } from "./Dialog";
import { clickPort, unplugPort } from "./patching";

/* ------------------------------------------------------------------ */
/* État d'un port, en texte + symbole (jamais la couleur seule)         */
/* ------------------------------------------------------------------ */

type PortState = { symbol: string; text: string; tone: "ok" | "warn" | "off" | "info" };

function portState(lab: LabState, def: EndpointDef): PortState {
  if (def.connector === "sfp") return { symbol: "▢", text: "cage SFP vide", tone: "off" };
  const cable = cableAt(lab, def.id);
  const peer = cable ? (cable.a === def.id ? cable.b : cable.a) : null;
  const locked = isFixedEndpoint(def.id);
  if (def.role === "switchport" && portConfig(lab, def.id as SwitchPortId).shutdown) {
    return { symbol: "⊘", text: peer ? `désactivé · câble vers ${endpointLabel(peer)}` : "désactivé (shutdown)", tone: "warn" };
  }
  if (!cable) return { symbol: "○", text: "libre", tone: "off" };
  if (def.role === "patch") {
    return { symbol: "●", text: `${locked ? "préconfiguré · " : ""}relié à ${endpointLabel(peer!)}`, tone: locked ? "info" : "ok" };
  }
  const link = linkStatus(lab, def.id as ActiveEndpoint);
  const who = link.peer ? DEVICES[ENDPOINTS.find((e) => e.id === link.peer)!.device].name : endpointLabel(peer!);
  if (link.up) return { symbol: "●", text: `${locked ? "préconfiguré · " : ""}liaison active avec ${who}`, tone: locked ? "info" : "ok" };
  if (link.reason === "console") return { symbol: "◐", text: "câblé, mais port console : pas d'Ethernet", tone: "warn" };
  return { symbol: "◌", text: `câblé vers ${endpointLabel(peer!)} · pas de liaison`, tone: "warn" };
}

function PortButton({ def, lab }: { def: EndpointDef; lab: LabState }) {
  const selected = useLabUi((s) => s.selectedPort === def.id);
  const st = portState(lab, def);
  const removable = !!cableAt(lab, def.id) && !isFixedEndpoint(def.id);
  return (
    <li className={`port-row port-row--${st.tone}`}>
      <button
        type="button"
        className="port-btn"
        aria-pressed={selected}
        onClick={() => clickPort(def.id)}
        disabled={isFixedEndpoint(def.id)}
      >
        <span className="port-btn__label">{def.label}</span>
        <span className="port-btn__note">{def.note}</span>
        <span className="port-btn__state">
          <span aria-hidden="true">{st.symbol}</span> {st.text}
        </span>
      </button>
      {removable ? (
        <button type="button" className="port-unplug" onClick={() => unplugPort(def.id)} aria-label={`Débrancher ${def.label}`}>
          Débrancher
        </button>
      ) : null}
    </li>
  );
}

export function BayPanel({ onClose }: { onClose: () => void }) {
  const lab = useApp((s) => s.progress.lab);
  const message = useLabUi((s) => s.patchMessage);
  const selected = useLabUi((s) => s.selectedPort);
  const groups: { title: string; device: EndpointDef["device"] }[] = [
    { title: "Panneau de brassage", device: "patch-panel" },
    { title: "Switch SW-LAB", device: "sw-lab" },
    { title: "Serveur SRV-LAB", device: "srv-lab" },
  ];
  return (
    <Dialog title="Baie réseau — RACK-LAB" kicker={<span className="lab-mono">Mission · étapes 1 et 2</span>} onClose={onClose} size="wide">
      <section aria-labelledby="bay-identify">
        <h3 id="bay-identify" className="lab-h3">
          Identifier les équipements
        </h3>
        <ul className="lab-devices">
          <li>
            <strong>PC-LAB</strong> — le poste du bureau. Sa prise murale <span className="lab-mono">B-02</span> arrive sur{" "}
            <span className="lab-mono">PP-02</span>.
          </li>
          <li>
            <strong>SW-LAB</strong> — switch d&apos;accès : ports Gi0/1 à Gi0/8, cages SFP Gi0/9-10, port console.
          </li>
          <li>
            <strong>SRV-LAB</strong> — serveur du lab, 192.168.10.10/24 (préconfiguré), carte <span className="lab-mono">eth0</span>.
          </li>
          <li>
            <strong>R1</strong> — routeur inter-VLAN préconfiguré, relié en trunk 802.1Q sur Gi0/8. <strong>Borne Wi-Fi</strong> —
            VLAN 20, sur Gi0/1 (préconfigurée).
          </li>
        </ul>
      </section>
      <section aria-labelledby="bay-patch">
        <h3 id="bay-patch" className="lab-h3">
          Brasser
        </h3>
        <p className="lab-muted">
          Choisis une extrémité, puis l&apos;autre : le câble apparaît dans le rack. Tu peux aussi cliquer directement sur les ports en
          3D.
        </p>
        <p className={`lab-feedback lab-feedback--${message?.tone ?? "info"}`} role="status" aria-live="polite">
          {message?.text ?? (selected ? "" : "Aucun port sélectionné.")}
        </p>
        <div className="port-groups">
          {groups.map((g) => (
            <div key={g.device} className="port-group">
              <h4>{g.title}</h4>
              <ul>
                {ENDPOINTS.filter((e) => e.device === g.device && e.selectable).map((def) => (
                  <PortButton key={def.id} def={def} lab={lab} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="bay-links">
        <h3 id="bay-links" className="lab-h3">
          État des liaisons
        </h3>
        <ul className="lab-list">
          <li>{explainLink(lab, "pc-eth0")}</li>
          <li>{explainLink(lab, "srv-eth0")}</li>
        </ul>
        <p className="lab-muted">Étape suivante : la console du poste PC-LAB, au bureau (à droite de l&apos;accueil).</p>
      </section>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Console du poste                                                     */
/* ------------------------------------------------------------------ */

function NicTab() {
  const lab = useApp((s) => s.progress.lab);
  const setPcConfig = useApp((s) => s.setPcConfig);
  const sound = useApp((s) => s.settings.sound);
  const current = lab.pc;
  const [mode, setMode] = useState<"dhcp" | "static">(current.mode);
  const [ip, setIp] = useState(current.mode === "static" ? formatIPv4(current.ip) : "");
  const [mask, setMask] = useState(current.mode === "static" ? formatIPv4(prefixToMask(current.prefix)) : "255.255.255.0");
  const [gateway, setGateway] = useState(current.mode === "static" && current.gateway !== null ? formatIPv4(current.gateway) : "");
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [status, setStatus] = useState("");
  const id = useId();
  const pc = interfacesOf(computeNetwork(lab), "pc-lab")[0];
  const err = (f: FieldError["field"]) => errors.find((e) => e.field === f)?.message;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "dhcp") {
      setPcConfig({ mode: "dhcp" });
      setErrors([]);
      setStatus("Carte réseau en DHCP.");
      return;
    }
    const v = validatePcConfig({ ip, mask, gateway });
    if (!v.ok) {
      setErrors(v.errors);
      setStatus("Configuration refusée : corrige les champs signalés.");
      playCue("error", sound);
      return;
    }
    setErrors([]);
    setPcConfig(v.config);
    playCue("plug", sound);
    setStatus(`Configuration appliquée : ${formatIPv4(v.config.ip)}/${v.config.prefix}.`);
  };

  return (
    <form className="lab-form" onSubmit={apply} noValidate>
      <p className="lab-meta">
        État actuel :{" "}
        {!linkStatus(lab, "pc-eth0").up
          ? "média déconnecté"
          : pc
            ? `${formatIPv4(pc.ip)}/${pc.prefix}${pc.apipa ? " (adresse APIPA, faute de serveur DHCP)" : ""}${pc.duplicate ? " — conflit d'adresse détecté !" : ""}`
            : "aucune adresse"}
      </p>
      <fieldset className="lab-radio">
        <legend>Mode d&apos;adressage</legend>
        <label>
          <input type="radio" name={`${id}-mode`} checked={mode === "dhcp"} onChange={() => setMode("dhcp")} /> Automatique (DHCP)
        </label>
        <label>
          <input type="radio" name={`${id}-mode`} checked={mode === "static"} onChange={() => setMode("static")} /> Statique
        </label>
      </fieldset>
      {mode === "static" ? (
        <div className="lab-fields">
          {([
            ["ip", "Adresse IPv4", ip, setIp, "192.168.10.42"],
            ["mask", "Masque (/24 ou 255.255.255.0)", mask, setMask, "255.255.255.0"],
            ["gateway", "Passerelle par défaut (facultative)", gateway, setGateway, "192.168.10.1"],
          ] as const).map(([field, label, value, set, placeholder]) => (
            <label key={field} className="lab-field">
              <span>{label}</span>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                inputMode="decimal"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!!err(field)}
                aria-describedby={err(field) ? `${id}-${field}-err` : undefined}
              />
              {err(field) ? (
                <span id={`${id}-${field}-err`} className="lab-field__error">
                  {err(field)}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      ) : (
        <p className="lab-muted">Aucun serveur DHCP n&apos;existe dans ce lab : en DHCP, le poste se donnera une adresse APIPA.</p>
      )}
      <button type="submit" className="lab-btn lab-btn--primary">
        Appliquer
      </button>
      <p role="status" className="lab-feedback">
        {status}
      </p>
    </form>
  );
}

function SwitchTab() {
  const lab = useApp((s) => s.progress.lab);
  const setPort = useApp((s) => s.setPort);
  const rows = ENDPOINTS.filter((e) => e.device === "sw-lab" && e.role === "switchport" && e.connector === "rj45");
  return (
    <div>
      <p className="lab-muted">
        Administration hors bande : le port de management du switch est préconfiguré, la configuration fonctionne même sans liaison
        des ports.
      </p>
      <div className="table-scroll">
        <table className="lab-table">
          <thead>
            <tr>
              <th scope="col">Port</th>
              <th scope="col">État</th>
              <th scope="col">VLAN d&apos;accès</th>
              <th scope="col">Activé</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((def) => {
              const cfg = portConfig(lab, def.id as SwitchPortId);
              const link = linkStatus(lab, def.id as ActiveEndpoint);
              const editable = (EDITABLE_PORTS as string[]).includes(def.id);
              const state = cfg.shutdown ? "⊘ désactivé" : link.up ? "● connecté" : "○ non connecté";
              return (
                <tr key={def.id}>
                  <th scope="row" className="lab-mono">
                    {def.label}
                  </th>
                  <td>{state}</td>
                  <td>
                    {editable ? (
                      <select
                        aria-label={`VLAN d'accès de ${def.label}`}
                        value={cfg.vlan}
                        onChange={(e) => setPort(def.id as EditablePortId, { vlan: Number(e.target.value) })}
                      >
                        {VLANS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.id} — {v.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="lab-mono">
                        {cfg.mode === "trunk" ? `trunk ${cfg.allowed?.join(",")}` : `${cfg.vlan} — ${vlanName(cfg.vlan)}`} (préconfiguré)
                      </span>
                    )}
                  </td>
                  <td>
                    {editable ? (
                      <label className="lab-switch">
                        <input
                          type="checkbox"
                          checked={!cfg.shutdown}
                          onChange={(e) => setPort(def.id as EditablePortId, { shutdown: !e.target.checked })}
                        />
                        <span>{cfg.shutdown ? "non (shutdown)" : "oui"}</span>
                      </label>
                    ) : (
                      <span>oui</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MiniConsole
        title="Console SW-LAB (lecture seule)"
        prompt="SW-LAB#"
        help={`Commandes : ${SWITCH_COMMANDS.map((c) => c.usage).join(", ")}`}
        run={(cmd) => runSwitchCommand(useApp.getState().progress.lab, cmd)}
      />
    </div>
  );
}

function ReportView({ report }: { report: DiagnosticReport }) {
  return (
    <div className={`lab-report ${report.success ? "is-ok" : "is-ko"}`}>
      <p className="lab-strong" role="status">
        {report.success ? "✔ Le poste est en ligne : toutes les vérifications passent." : "✖ Au moins une vérification échoue."}
      </p>
      <ul>
        {report.checks.map((c) => (
          <li key={c.id} className={c.ok ? "ok" : "ko"}>
            <span className="lab-report__badge">{c.ok ? "OK" : "ÉCHEC"}</span>
            <span>
              <strong>{c.label}</strong>
              <br />
              {c.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiagTab() {
  const runLabDiagnostic = useApp((s) => s.runLabDiagnostic);
  const lastReport = useApp((s) => s.lastReport);
  const sound = useApp((s) => s.settings.sound);
  const announce = useLabUi((s) => s.announce);
  const run = () => {
    const r = runLabDiagnostic();
    playCue(r.success ? "success" : "error", sound);
    announce(r.success ? "Diagnostic réussi : le poste est en ligne." : "Diagnostic : au moins une vérification échoue.");
  };
  return (
    <div>
      <button type="button" className="lab-btn lab-btn--primary" onClick={run} data-autofocus>
        Lancer le diagnostic
      </button>
      {lastReport ? <ReportView report={lastReport} /> : <p className="lab-muted">Le diagnostic teste la liaison, l&apos;adresse, le serveur, la passerelle et un autre réseau.</p>}
      <MiniConsole
        title="Terminal de PC-LAB"
        prompt={"C:\\>"}
        help={`Commandes : ${PC_COMMANDS.map((c) => c.usage).join(", ")}`}
        run={(cmd) => {
          const result = runPcCommand(useApp.getState().progress.lab, cmd);
          if (result.diagnostic) run();
          return result;
        }}
      />
    </div>
  );
}

/** Petit terminal local pour la mission (liste explicite de commandes). */
function MiniConsole({ title, prompt, help, run }: { title: string; prompt: string; help: string; run: (cmd: string) => { lines: string[]; clear?: boolean; note?: string } }) {
  const [log, setLog] = useState<{ id: number; lines: string[]; note?: string; cmd: string }[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const next = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);
  return (
    <section className="mini-console" aria-labelledby={`${id}-t`}>
      <h4 id={`${id}-t`}>{title}</h4>
      <p className="lab-muted lab-mono">{help}</p>
      <div className="mini-console__log" ref={logRef} role="log" aria-live="polite">
        {log.map((entry) => (
          <div key={entry.id}>
            <p className="mini-console__cmd">
              {prompt} {entry.cmd}
            </p>
            <pre>{entry.lines.join("\n")}</pre>
            {entry.note ? <p className="mini-console__note">Analyse du lab : {entry.note}</p> : null}
          </div>
        ))}
      </div>
      <form
        className="mini-console__row"
        onSubmit={(e) => {
          e.preventDefault();
          const cmd = value.trim();
          setValue("");
          setCursor(null);
          if (!cmd) return;
          setHistory((h) => [...h, cmd].slice(-50));
          const result = run(cmd);
          if (result.clear) setLog([]);
          else setLog((l) => [...l, { id: next.current++, cmd, lines: result.lines, note: result.note }].slice(-30));
        }}
      >
        <label htmlFor={`${id}-in`} className="lab-mono">
          {prompt}
          <span className="sr-only"> commande</span>
        </label>
        <input
          id={`${id}-in`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
            if (history.length === 0) return;
            e.preventDefault();
            const n = e.key === "ArrowUp" ? (cursor === null ? history.length - 1 : Math.max(0, cursor - 1)) : cursor === null ? null : cursor + 1 >= history.length ? null : cursor + 1;
            setCursor(n);
            setValue(n === null ? "" : history[n] ?? "");
          }}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
        />
        <button type="submit" className="lab-btn">
          Exécuter
        </button>
      </form>
    </section>
  );
}

export function PcPanel({ onClose, initialTab = "nic" }: { onClose: () => void; initialTab?: "nic" | "switch" | "diag" }) {
  const [tab, setTab] = useState<"nic" | "switch" | "diag">(initialTab);
  const tabs = useMemo(
    () =>
      [
        { id: "nic", label: "Carte réseau" },
        { id: "switch", label: "Switch SW-LAB" },
        { id: "diag", label: "Diagnostic" },
      ] as { id: "nic" | "switch" | "diag"; label: string }[],
    [],
  );
  return (
    <Dialog title="Poste PC-LAB — console d'administration" kicker={<span className="lab-mono">Mission · étapes 3 à 5 · simulation locale</span>} onClose={onClose} size="wide">
      <Tabs label="Sections de la console" tabs={tabs} value={tab} onChange={setTab} />
      <div role="tabpanel" className="lab-tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
        {tab === "nic" ? <NicTab /> : tab === "switch" ? <SwitchTab /> : <DiagTab />}
      </div>
      <p className="lab-muted lab-foot-note">
        Scénario : VLAN 10 « LAB », 192.168.10.0/24, poste .42, serveur .10, passerelle .1. R1, le trunk Gi0/8 et la borne Wi-Fi
        (VLAN 20) sont préconfigurés. Aucune connexion à une infrastructure réelle.
      </p>
    </Dialog>
  );
}
