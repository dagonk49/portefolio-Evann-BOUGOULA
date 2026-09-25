import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, profile, projects, skillById } from "@/data";
import { LabLaunchButton } from "@/components/LabLaunchButton";
import { PrintButton } from "@/components/PrintButton";

/** Accroche : identité, statut, actions principales et fiche « whoami ». */
export function Hero() {
  const netforge = projects.find((p) => p.id === "netforge")?.liveUrl;
  const links = [
    { label: "Email", href: `mailto:${CONTACT_EMAIL}`, display: CONTACT_EMAIL },
    { label: "GitHub", href: GITHUB_URL, display: "github.com/dagonk49" },
    { label: "LinkedIn", href: LINKEDIN_URL, display: "linkedin.com/in/evann-bougoula" },
    ...(netforge ? [{ label: "NetForge", href: netforge, display: new URL(netforge).host }] : []),
  ];
  const { mobility } = profile;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__main">
        <p className="kicker mono">Portfolio · BTS SIO option SISR</p>
        <h1 id="hero-title">{profile.fullName}</h1>
        <ul className="hero__status" aria-label="Statut">
          {profile.status.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="hero__lead">
          {profile.specialty} : support N1, Active Directory, virtualisation Proxmox, conteneurs Docker et réseaux. Je comprends, je
          branche, je configure, je teste.
        </p>
        <div className="hero__actions" role="group" aria-label="Actions principales">
          <LabLaunchButton />
          {profile.cvFile ? (
            <a className="btn btn--ghost" href={profile.cvFile} download="CV_Evann_Bougoula.pdf" data-action="cv">
              <span className="btn__icon" aria-hidden="true">
                ↓
              </span>
              Télécharger le CV (PDF)
            </a>
          ) : null}
          <PrintButton />
        </div>
        <ul className="hero__links" aria-label="Liens et coordonnées">
          {links.map((l) => {
            const external = l.href.startsWith("http");
            return (
              <li key={l.label}>
                <a href={l.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="hero__link-label mono">{l.label}</span>
                  <span>{l.display}</span>
                  {external ? <span className="sr-only"> (nouvel onglet)</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="whoami mono" aria-label="Fiche d'identité">
        <p className="whoami__prompt" aria-hidden="true">
          <span>evann@dagz</span>:~$ whoami
        </p>
        <dl>
          <div>
            <dt>poste</dt>
            <dd>Alternant technicien informatique — EFS (DSI régionale)</dd>
          </div>
          <div>
            <dt>formation</dt>
            <dd>BTS SIO SISR (en cours) — MyDigitalSchool Angers</dd>
          </div>
          <div>
            <dt>secteur</dt>
            <dd>{mobility.areas.join(" · ")}</dd>
          </div>
          <div>
            <dt>mobilité</dt>
            <dd>
              {mobility.license} · {mobility.vehicle.toLowerCase()}
            </dd>
          </div>
          <div>
            <dt>travail</dt>
            <dd>{mobility.workModes.join(" · ")}</dd>
          </div>
          <div>
            <dt>stack</dt>
            <dd>{profile.featuredSkills.map((id) => skillById[id].label).join(" · ")}</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}
