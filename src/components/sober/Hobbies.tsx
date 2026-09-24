import { hobbies } from "@/data";
import { SectionHeading } from "./common";

/** Loisirs : le ton se détend, les faits restent ceux fournis par Evann. */
export function HobbiesSection() {
  return (
    <section className="section" aria-labelledby="loisirs">
      <SectionHeading
        id="loisirs"
        index="07"
        title="Hors de l'infra"
        lead="Ce qui m'occupe quand les baies sont bien brassées. Dans la version 3D, ces clins d'œil jalonnent le circuit extérieur."
      />
      <ul className="hobbies">
        {hobbies.map((h) => (
          <li key={h.id}>
            <article id={`loisir-${h.id}`} tabIndex={-1} className={`hobby hobby--${h.id}`} aria-labelledby={`loisir-${h.id}-title`}>
              <p className="hobby__kicker mono">{h.kicker}</p>
              <h3 id={`loisir-${h.id}-title`} className="hobby__title">
                {h.title}
              </h3>
              {h.lines.map((l) => (
                <p key={l} className="hobby__text">
                  {l}
                </p>
              ))}
              {h.quote ? <blockquote className="hobby__quote">« {h.quote} »</blockquote> : null}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
