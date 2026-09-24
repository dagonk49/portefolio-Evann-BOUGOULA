import type { EasterEgg } from "@/terminal/interpreter";

/** Petits clins d'œil visuels, brefs et silencieux (désactivables). */
export function EasterEggFx({ name }: { name: EasterEgg }) {
  switch (name) {
    case "valorant":
      return (
        <div className="egg egg--valorant" aria-hidden="true">
          <svg viewBox="0 0 120 40" width="120" height="40">
            <path d="M8 6 L28 34 L36 34 L16 6 Z" />
            <path d="M44 34 L60 10 L76 34" />
            <circle cx="100" cy="20" r="9" />
            <path d="M100 6 V12 M100 28 V34 M86 20 H92 M108 20 H114" />
          </svg>
        </div>
      );
    case "minecraft": {
      // Bloc d'herbe en pixels : 2 rangées vertes, puis terre mouchetée.
      const cells = Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        if (row < 2 || (row === 2 && (col * 7) % 3 === 0)) return (col + row) % 3 === 0 ? "g2" : "g1";
        return (col * 5 + row * 3) % 7 === 0 ? "d2" : "d1";
      });
      return (
        <div className="egg egg--minecraft" aria-hidden="true">
          <div className="egg-block">
            {cells.map((c, i) => (
              <span key={i} className={`px px--${c}`} />
            ))}
          </div>
        </div>
      );
    }
    case "gta5":
      return (
        <div className="egg egg--gta5" aria-hidden="true">
          <span>mission réussie</span>
        </div>
      );
    case "gta6":
      return (
        <div className="egg egg--gta6" aria-hidden="true">
          <svg viewBox="0 0 240 44" width="240" height="44">
            <defs>
              <linearGradient id="egg-sunset" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f6b24c" />
                <stop offset="1" stopColor="#e5577a" />
              </linearGradient>
            </defs>
            <rect width="240" height="44" rx="4" fill="url(#egg-sunset)" />
            <circle cx="170" cy="30" r="14" fill="#fde6a8" opacity="0.9" />
            <path d="M0 36 H240 V44 H0 Z" fill="#2a1a2e" />
            <path d="M36 36 C38 24 40 18 44 12 M44 12 C36 10 30 13 27 16 M44 12 C50 9 56 11 59 15 M44 12 C40 7 35 6 31 7 M44 12 C48 7 53 6 57 8" stroke="#2a1a2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M208 36 C209 28 211 23 214 19 M214 19 C208 17 204 19 202 22 M214 19 C219 17 223 18 225 21" stroke="#2a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "sudo":
      return (
        <div className="egg egg--sudo" aria-hidden="true">
          <span>permission refusée</span>
        </div>
      );
  }
}
