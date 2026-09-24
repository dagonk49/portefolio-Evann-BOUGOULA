import { profile, skillById } from "@/data";
import { LabLaunchButton } from "@/components/LabLaunchButton";
import { PatchStrip } from "./common";

/** Illustration décorative : la baie du lab, câble PP-02 → Gi0/2. */
function RackIllustration() {
  const ports = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg className="hero-rack" viewBox="0 0 320 250" aria-hidden="true" focusable="false">
      <rect x="18" y="8" width="284" height="234" rx="6" className="rack-frame" />
      <rect x="30" y="8" width="8" height="234" className="rack-rail" />
      <rect x="282" y="8" width="8" height="234" className="rack-rail" />
      {/* Panneau de brassage */}
      <g transform="translate(44 26)">
        <rect width="232" height="34" rx="3" className="rack-unit" />
        <text x="8" y="21" className="rack-label">PP</text>
        {ports.map((i) => (
          <g key={i} transform={`translate(${34 + i * 24} 9)`}>
            <rect width="16" height="12" rx="2" className="rack-port" />
            <text x="8" y="23" className="rack-tag">{`0${i + 1}`}</text>
          </g>
        ))}
      </g>
      {/* Switch */}
      <g transform="translate(44 76)">
        <rect width="232" height="34" rx="3" className="rack-unit rack-unit--dark" />
        <text x="8" y="21" className="rack-label rack-label--light">SW</text>
        {ports.map((i) => (
          <g key={i} transform={`translate(${34 + i * 24} 9)`}>
            <rect width="16" height="12" rx="2" className="rack-port rack-port--dark" />
            <circle cx="8" cy="-3" r="2" className={i === 0 || i === 1 || i === 2 || i === 7 ? "rack-led is-on" : "rack-led"} style={{ animationDelay: `${i * 0.37}s` }} />
          </g>
        ))}
      </g>
      {/* Routeur */}
      <g transform="translate(44 126)">
        <rect width="232" height="26" rx="3" className="rack-unit" />
        <text x="8" y="17" className="rack-label">R1</text>
        <rect x="190" y="8" width="16" height="10" rx="2" className="rack-port" />
      </g>
      {/* Serveur */}
      <g transform="translate(44 166)">
        <rect width="232" height="58" rx="3" className="rack-unit rack-unit--dark" />
        <text x="8" y="20" className="rack-label rack-label--light">SRV</text>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={40 + i * 26} y="10" width="20" height="38" rx="2" className="rack-bay" />
        ))}
        <circle cx="214" cy="18" r="2.4" className="rack-led is-on" />
        <rect x="204" y="34" width="16" height="12" rx="2" className="rack-port rack-port--dark" />
      </g>
      {/* Câbles de la mission */}
      <path d="M110 45 C 110 70, 110 70, 110 94" className="rack-cable" />
      <path d="M256 212 C 300 190, 300 110, 134 94" className="rack-cable rack-cable--b" />
      <path d="M254 94 C 262 118, 262 126, 242 139" className="rack-cable rack-cable--fixed" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__text">
        <p className="hero__kicker mono">
          <PatchStrip /> EVANN // ROOT ACCESS
        </p>
        <h1 id="hero-title">{profile.fullName}</h1>
        <p className="hero__role">{profile.headline}</p>
        <p className="hero__meta mono">
          {profile.location} · {profile.currentTraining}
        </p>
        <p className="hero__tagline">{profile.tagline}</p>
        <div className="hero__choices" role="group" aria-label="Choisir un mode de visite">
          <LabLaunchButton />
          <a className="btn btn--ghost" href="#a-propos" data-choice="sober">
            Voir mon parcours (Sobre)
          </a>
        </div>
        <p className="hero__note">
          Tout mon parcours se lit ici, sans jouer. Le lab 3D ne se charge que si vous le lancez.
        </p>
        <ul className="hero__skills" aria-label="Compétences mises en avant">
          {profile.featuredSkills.map((id) => (
            <li key={id} className="mono">
              {skillById[id].label}
            </li>
          ))}
        </ul>
      </div>
      <div className="hero__visual">
        <RackIllustration />
        <p className="hero__caption mono" aria-hidden="true">
          baie du lab · PP-02 → Gi0/2 · VLAN 10
        </p>
      </div>
    </section>
  );
}
