import type { Hobby } from "./types";

const SOURCE_V2 = {
  source: "brief-evann",
  asOf: "2026-09",
  note: "Brief v2 (circuit extérieur et pop culture).",
} as const;

/**
 * Loisirs : uniquement ce qu'Evann a fourni. Pas de rang, de temps de jeu
 * ni de préférence inventés.
 */
export const hobbies: Hobby[] = [
  {
    id: "valorant",
    title: "Valorant",
    kicker: "Duelist / Initiator",
    lines: [
      "En dehors de l'infra, j'adore aussi jouer à Valorant.",
      "Côté rôles : Duelist ou Initiator, prêt à clutch l'infra.",
    ],
    tags: ["Duelist", "Initiator"],
    provenance: SOURCE_V2,
  },
  {
    id: "minecraft",
    title: "Minecraft",
    kicker: "Bloc par bloc",
    lines: ["Minecraft me plaît aussi : construire bloc par bloc, jusqu'aux circuits de redstone, ça me parle forcément."],
    tags: ["Construction", "Redstone"],
    provenance: SOURCE_V2,
  },
  {
    id: "gta",
    title: "GTA V et GTA VI",
    kicker: "Los Santos, Vice City",
    lines: ["GTA V fait partie des jeux qui m'intéressent, et GTA VI m'intéresse aussi beaucoup."],
    quote: "Le seul braquage toléré est celui d'une baie mal brassée.",
    tags: ["Monde ouvert"],
    provenance: SOURCE_V2,
  },
  {
    id: "cinema-mecanique",
    title: "Cinéma et mécanique",
    kicker: "Culture automobile",
    lines: [
      "La culture automobile et les films cultes de vitesse font partie de mes références : ce circuit en est le clin d'œil.",
    ],
    tags: ["Automobile", "Films de vitesse"],
    provenance: SOURCE_V2,
  },
];
