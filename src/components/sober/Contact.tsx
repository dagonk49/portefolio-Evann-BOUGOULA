import { CONTACT_EMAIL, profile, projects } from "@/data";
import { ContactForm } from "./ContactForm";
import { SectionHeading } from "./common";

export function ContactSection() {
  const netforge = projects.find((p) => p.id === "netforge")?.liveUrl;
  const channels = [
    ...profile.contacts,
    ...(netforge ? [{ id: "netforge", label: "NetForge", href: netforge, display: new URL(netforge).host }] : []),
  ];
  const { mobility } = profile;
  return (
    <section className="section" data-nav="contact" aria-labelledby="contact">
      <SectionHeading
        id="contact"
        index="06"
        title="Contact"
        lead="Pour échanger sur une alternance, un stage, un poste ou un projet d'infrastructure : le formulaire ci-dessous ou directement par email."
      />
      <div className="contact">
        <div className="contact__side">
          <ul className="contact__list">
            {channels.map((c) => {
              const external = c.href.startsWith("http");
              return (
                <li key={c.id}>
                  <a className="contact__link" href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <span className="contact__label mono">{c.label}</span>
                    <span className="contact__value">{c.display}</span>
                    {external ? <span className="sr-only"> (nouvel onglet)</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
          <dl className="contact__facts">
            <div>
              <dt className="mono">Mobilité</dt>
              <dd>
                {mobility.license}, {mobility.vehicle.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="mono">Secteur</dt>
              <dd>{mobility.areas.join(", ")}</dd>
            </div>
            <div>
              <dt className="mono">Modalités</dt>
              <dd>{mobility.workModes.join(" ou ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}</dd>
            </div>
          </dl>
          {profile.cvFile ? (
            <p>
              <a className="btn btn--ghost" href={profile.cvFile} download="CV_Evann_Bougoula.pdf" data-action="cv-contact">
                <span className="btn__icon" aria-hidden="true">
                  ↓
                </span>
                Télécharger le CV (PDF)
              </a>
            </p>
          ) : null}
          <p className="contact__direct">
            Réponse directe : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
