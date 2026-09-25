import { CONTACT_EMAIL, experiences, organizationName, profile, projects, skillFamilies, skillsOfFamily } from "@/data";
import { formatPeriod } from "@/lib/format";

/**
 * En-tête et tableaux réservés à l'export PDF (masqués à l'écran) :
 * coordonnées, synthèse du profil, chronologie des expériences et
 * tableau des compétences. Le reste du document reprend les sections
 * de la page, fiches E5 dépliées.
 */
export function PrintSummary() {
  const netforge = projects.find((p) => p.id === "netforge")?.liveUrl;
  const { mobility } = profile;
  return (
    <div className="print-only print-summary">
      <header className="print-head">
        <p className="print-head__name">{profile.fullName}</p>
        {profile.status.map((s) => (
          <p key={s} className="print-head__status">
            {s}
          </p>
        ))}
        <p className="print-head__coords">
          {CONTACT_EMAIL} · github.com/dagonk49 · linkedin.com/in/evann-bougoula
          {netforge ? ` · ${new URL(netforge).host}` : ""}
        </p>
        <p className="print-head__coords">
          {mobility.license}, {mobility.vehicle.toLowerCase()} · {mobility.areas.join(", ")} · {mobility.workModes.join(" ou ").toLowerCase()}
        </p>
      </header>

      <section className="print-block">
        <h2>Synthèse du profil</h2>
        {profile.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section className="print-block">
        <h2>Chronologie des expériences</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th scope="col">Période</th>
              <th scope="col">Organisation</th>
              <th scope="col">Poste</th>
              <th scope="col">Missions principales</th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((e) => (
              <tr key={e.id}>
                <td>{formatPeriod(e.period, "short")}</td>
                <td>
                  {organizationName(e.organizationId)}
                  {e.location ? `, ${e.location.city}` : ""}
                </td>
                <td>{e.role === e.contract ? e.contract : `${e.role} (${e.contract.toLowerCase()})`}</td>
                <td>{e.missions.length ? e.missions.map((m) => (m.title ?? m.text).replace(/\.$/, "")).join(" ; ") : "Missions non détaillées"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-block">
        <h2>Compétences</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th scope="col">Domaine</th>
              <th scope="col">Compétences</th>
            </tr>
          </thead>
          <tbody>
            {skillFamilies.map((f) => (
              <tr key={f.id}>
                <td>{f.label}</td>
                <td>{skillsOfFamily(f.id).map((s) => s.label).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
