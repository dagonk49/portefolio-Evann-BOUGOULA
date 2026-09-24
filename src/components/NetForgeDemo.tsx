"use client";
import { useId, useMemo, useState } from "react";
import { formatIPv4 } from "@/lib/ipv4";
import { ciscoPreview, computeVlsm, type SubnetRequest } from "@/netforge-demo/vlsm";

const DEFAULT_ROWS: SubnetRequest[] = [
  { name: "LAB", hosts: 50, vlan: 10 },
  { name: "WIFI", hosts: 20, vlan: 20 },
  { name: "ADMIN", hosts: 10, vlan: 99 },
];

/**
 * Démonstration pédagogique réalisée pour ce portfolio :
 * paramètres → résultat réseau → aperçu de configuration.
 * Ce n'est pas l'application NetForge.
 */
export function NetForgeDemo() {
  const [parent, setParent] = useState("192.168.10.0/24");
  const [rows, setRows] = useState<SubnetRequest[]>(DEFAULT_ROWS);
  const [dhcp, setDhcp] = useState(false);
  const [copied, setCopied] = useState(false);
  const baseId = useId();

  const result = useMemo(() => computeVlsm(parent, rows), [parent, rows]);
  const config = useMemo(
    () => (result.ok ? ciscoPreview(result.subnets, { routerInterface: "GigabitEthernet0/0", dhcp }).join("\n") : ""),
    [result, dhcp],
  );

  const update = (i: number, patch: Partial<SubnetRequest>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <section className="demo" aria-labelledby={`${baseId}-title`}>
      <header className="demo__head">
        <p className="demo__badge mono">Démonstration du portfolio</p>
        <h4 id={`${baseId}-title`}>Du besoin à la configuration, en trois temps</h4>
        <p className="demo__disclaimer">
          Ce mini-calculateur a été écrit pour ce portfolio afin d&apos;illustrer la démarche de NetForge. Ce n&apos;est pas
          l&apos;application NetForge et il n&apos;en reprend pas le code.
        </p>
      </header>

      <div className="demo__steps">
        <fieldset className="demo__params">
          <legend className="mono">1 · Paramètres</legend>
          <label className="field">
            <span>Plage parente (CIDR)</span>
            <input value={parent} onChange={(e) => setParent(e.target.value)} spellCheck={false} inputMode="decimal" />
          </label>
          <table className="demo__rows">
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Hôtes</th>
                <th scope="col">VLAN</th>
                <th scope="col">
                  <span className="sr-only">Retirer</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input aria-label={`Nom du sous-réseau ${i + 1}`} value={row.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={32} />
                  </td>
                  <td>
                    <input
                      aria-label={`Nombre d'hôtes du sous-réseau ${i + 1}`}
                      type="number"
                      min={1}
                      value={Number.isFinite(row.hosts) ? row.hosts : ""}
                      onChange={(e) => update(i, { hosts: e.target.value === "" ? NaN : Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`VLAN du sous-réseau ${i + 1}`}
                      type="number"
                      min={1}
                      max={4094}
                      value={Number.isFinite(row.vlan) ? row.vlan : ""}
                      onChange={(e) => update(i, { vlan: e.target.value === "" ? NaN : Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                      aria-label={`Retirer ${row.name || `le sous-réseau ${i + 1}`}`}
                      disabled={rows.length <= 1}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="demo__actions">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setRows((r) => [...r, { name: `RESEAU${r.length + 1}`, hosts: 10, vlan: Math.max(0, ...r.map((x) => (Number.isFinite(x.vlan) ? x.vlan : 0))) + 10 }])}
              disabled={rows.length >= 8}
            >
              Ajouter un sous-réseau
            </button>
            <label className="check">
              <input type="checkbox" checked={dhcp} onChange={(e) => setDhcp(e.target.checked)} /> Pools DHCP
            </label>
          </div>
        </fieldset>

        <div className="demo__result" aria-live="polite">
          <p className="demo__step-label mono">2 · Résultat réseau (VLSM)</p>
          {result.ok ? (
            <>
              {result.normalizedFrom ? (
                <p className="demo__note">
                  {result.normalizedFrom} a été ramené à l&apos;adresse de réseau {formatIPv4(result.parent.network)}/{result.parent.prefix}.
                </p>
              ) : null}
              <div className="table-wrap">
                <table className="demo__table">
                  <thead>
                    <tr>
                      <th scope="col">Nom / VLAN</th>
                      <th scope="col">Réseau</th>
                      <th scope="col">Masque</th>
                      <th scope="col">Plage utilisable</th>
                      <th scope="col">Broadcast</th>
                      <th scope="col">Passerelle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subnets.map((s) => (
                      <tr key={s.vlan}>
                        <th scope="row">
                          {s.name} <span className="mono">/ {s.vlan}</span>
                          <span className="demo__cap mono">
                            {s.hostsRequested} demandés · {s.capacity} possibles
                          </span>
                        </th>
                        <td className="mono">
                          {formatIPv4(s.network)}/{s.prefix}
                        </td>
                        <td className="mono">{formatIPv4(s.mask)}</td>
                        <td className="mono">
                          {formatIPv4(s.firstHost)} – {formatIPv4(s.lastHost)}
                        </td>
                        <td className="mono">{formatIPv4(s.broadcast)}</td>
                        <td className="mono">{formatIPv4(s.gateway)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="demo__usage mono">
                {result.used} adresses sur {result.total} allouées · blocs alignés, sans chevauchement
              </p>
            </>
          ) : (
            <p className="demo__error" role="alert">
              {result.error}
            </p>
          )}
        </div>

        <div className="demo__config">
          <div className="demo__config-head">
            <p className="demo__step-label mono">3 · Aperçu de configuration Cisco IOS</p>
            {result.ok ? (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(config);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Copié" : "Copier"}
              </button>
            ) : null}
          </div>
          <pre className="demo__code" tabIndex={0} aria-label="Aperçu de configuration généré">
            {result.ok ? config : "! Corrige les paramètres pour générer un aperçu."}
          </pre>
        </div>
      </div>
    </section>
  );
}
