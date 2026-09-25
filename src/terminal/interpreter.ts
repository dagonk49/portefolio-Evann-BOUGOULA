/**
 * Interpréteur du terminal du mode sobre.
 *
 * Il ne fait que consulter une table de commandes locales : aucun shell,
 * aucun `eval`, aucune injection HTML. Les sorties sont des structures
 * (texte, liens, actions) rendues par React, jamais du HTML brut.
 */
import {
  certifications,
  CONTACT_EMAIL,
  e5Competences,
  education,
  experiences,
  homelab,
  GITHUB_URL,
  organizationName,
  profile,
  projects,
  realisationPeriod,
  realisations,
  skillFamilies,
  skillsOfFamily,
} from "@/data";
import { certificationMeta, formatMonth, formatPeriod } from "@/lib/format";

export type Tone = "muted" | "accent" | "ok" | "warn" | "strong";

export type Segment =
  | { kind: "text"; text: string; tone?: Tone }
  | { kind: "link"; text: string; href: string }
  | { kind: "action"; text: string; action: TerminalAction };

export type TerminalAction = "print" | "enter-3d" | "enter-circuit";

export type Line = Segment[];

export type Effect =
  | { type: "clear" }
  | { type: "open-url"; url: string }
  | { type: "download"; url: string; filename: string }
  | { type: "enter-3d" }
  | { type: "unlock-racer" }
  | { type: "fx"; name: EasterEgg };

export type EasterEgg = "valorant" | "minecraft" | "gta5" | "gta6" | "sudo" | "cars";

/** Réponse exacte de la commande secrète `cars`. */
export const RACER_UNLOCKED =
  "[RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit extérieur pour prendre la piste.";

export interface CommandResult {
  lines: Line[];
  effects: Effect[];
}

export interface TerminalContext {
  /** Historique de la session (commandes déjà saisies, sans la courante). */
  history: string[];
  /** Le mode 3D peut-il être lancé sur ce navigateur ? */
  can3d: boolean;
}

interface CommandDef {
  name: string;
  aliases?: string[];
  description: string;
  hidden?: boolean;
  run: (args: string[], ctx: TerminalContext) => CommandResult;
}

const t = (text: string, tone?: Tone): Segment => ({ kind: "text", text, tone });
const line = (...segments: (Segment | string)[]): Line => segments.map((s) => (typeof s === "string" ? t(s) : s));
const blank: Line = [];
const out = (lines: Line[], effects: Effect[] = []): CommandResult => ({ lines, effects });

export const GOOGLE_URL = "https://www.google.com";

const linkedin = profile.contacts.find((c) => c.id === "linkedin");
const MAILTO = `mailto:${CONTACT_EMAIL}`;
const CV_NAME = "CV_Evann_Bougoula.pdf";

const COMMANDS: CommandDef[] = [
  {
    name: "help",
    aliases: ["aide", "?"],
    description: "affiche cette aide",
    run: () => {
      const visible = COMMANDS.filter((c) => !c.hidden);
      const width = Math.max(...visible.map((c) => c.name.length)) + 2;
      return out([
        line(t("Commandes disponibles :", "strong")),
        ...visible.map((c) => line(t(`  ${c.name.padEnd(width)}`, "accent"), t(c.description))),
        blank,
        line(t("Tab complète une commande, ↑/↓ parcourt l'historique, Échap quitte le terminal.", "muted")),
        line(t("Quelques commandes cachées existent aussi…", "muted")),
      ]);
    },
  },
  {
    name: "whoami",
    description: "qui je suis, en bref",
    run: () =>
      out([
        line(t(profile.fullName, "strong")),
        ...profile.status.map((s) => line(s)),
        line(
          t(
            `${profile.mobility.license}, ${profile.mobility.vehicle.toLowerCase()} · ${profile.mobility.areas.join(", ")} · ${profile.mobility.workModes.join(" ou ").toLowerCase()}`,
            "muted",
          ),
        ),
        blank,
        line(t(profile.tagline, "accent")),
      ]),
  },
  {
    name: "about",
    aliases: ["a-propos", "apropos"],
    description: "ma présentation",
    run: () => out(profile.about.flatMap((p, i) => (i === 0 ? [line(p)] : [blank, line(p)]))),
  },
  {
    name: "skills",
    aliases: ["competences", "compétences"],
    description: "mes compétences, par famille",
    run: () => {
      const lines: Line[] = [];
      for (const family of skillFamilies) {
        if (family.id === "secourisme") continue;
        const labels = [...new Set(skillsOfFamily(family.id).map((s) => s.label))];
        lines.push(line(t(`${family.label}`, "strong")));
        lines.push(line(t(`  ${labels.join(" · ")}`)));
      }
      lines.push(blank, line(t("Secourisme : voir la commande certifications.", "muted")));
      return out(lines);
    },
  },
  {
    name: "experience",
    aliases: ["experiences", "expérience", "expériences", "xp"],
    description: "mes expériences professionnelles",
    run: () => {
      const lines: Line[] = [];
      experiences.forEach((e, i) => {
        if (i > 0) lines.push(blank);
        lines.push(line(t(formatPeriod(e.period), "accent")));
        lines.push(line(t(`${organizationName(e.organizationId)} — ${e.role === e.contract ? e.contract : `${e.role} (${e.contract.toLowerCase()})`}`, "strong")));
        if (e.location) lines.push(line(t(`${e.location.city}${e.workMode ? ` · ${e.workMode.toLowerCase()}` : ""}`, "muted")));
        for (const m of e.missions) lines.push(line(`  - ${m.title ? `${m.title} : ` : ""}${m.text}`));
      });
      return out(lines);
    },
  },
  {
    name: "education",
    aliases: ["formation", "formations", "etudes", "études"],
    description: "mes formations",
    run: () => {
      const lines: Line[] = [];
      education.forEach((e, i) => {
        if (i > 0) lines.push(blank);
        lines.push(line(t(formatPeriod(e.period), "accent")));
        lines.push(line(t(`${e.shortName} — ${e.school}`, "strong")));
        if (e.status.kind === "en-cours") {
          lines.push(line(t(`Formation en cours, fin prévue en ${formatMonth(e.status.expectedEnd)}.`, "muted")));
        } else {
          lines.push(line(t(`Diplôme obtenu en ${formatMonth(e.status.obtainedAt)}${e.result ? ` — ${e.result.grade}, ${e.result.honors.toLowerCase()}` : ""}.`, "ok")));
        }
        lines.push(line(t(`  Thèmes : ${e.topics.map((g) => g.title).join(", ")}.`)));
      });
      return out(lines);
    },
  },
  {
    name: "certifications",
    aliases: ["certification", "certifs"],
    description: "mes certifications",
    run: () =>
      out(
        certifications.map((c) =>
          line(
            t(c.name, "strong"),
            t(certificationMeta(c) ? ` — ${certificationMeta(c)}.` : ""),
            ...(c.details ? [t(` ${c.details}`, "muted")] : []),
          ),
        ),
      ),
  },
  {
    name: "projects",
    aliases: ["projets", "projet"],
    description: "mes projets",
    run: () => {
      const lines: Line[] = [];
      for (const p of projects) {
        lines.push(line(t(p.name, "strong"), t(` — ${p.kind.toLowerCase()}${p.since ? ` depuis ${formatMonth(p.since)}` : ""}`, "muted")));
        lines.push(line(`  ${p.tagline}`));
      }
      lines.push(line(t("HomeLab", "strong"), t(" — pratique personnelle", "muted")));
      lines.push(line(`  ${homelab.hypervisor.label}, une VM principale Docker et des environnements de test.`));
      lines.push(blank, line(t("Détails : netforge, homelab.", "muted")));
      return out(lines);
    },
  },
  {
    name: "netforge",
    description: "mon projet principal",
    run: () => {
      const p = projects.find((x) => x.id === "netforge")!;
      return out([
        line(t(`${p.name} — projet personnel depuis ${p.since ? formatMonth(p.since) : "?"}`, "strong")),
        line(p.tagline),
        blank,
        ...p.pillars.map((pl) => line(t(`  ${pl.title}`, "accent"), t(` : ${pl.points.join(", ")}.`))),
        blank,
        p.liveUrl
          ? line(t("Plateforme en ligne : ", "muted"), { kind: "link", text: new URL(p.liveUrl).host, href: p.liveUrl })
          : line(t("Adresse publique non renseignée.", "muted")),
      ]);
    },
  },
  {
    name: "homelab",
    aliases: ["lab"],
    description: "mon HomeLab",
    run: () =>
      out([
        line(homelab.intro),
        blank,
        line(t(homelab.hypervisor.label, "strong"), t(` : ${homelab.hypervisor.detail}`)),
        line(t(`  └─ ${homelab.mainVm.label}`, "accent"), t(` : ${homelab.mainVm.detail} ${homelab.mainVm.resourceShare}`)),
        ...homelab.mainVm.services.map((s) => line(`       · ${s.label}${s.detail ? ` (${s.detail.toLowerCase()})` : ""}`)),
        line(t("  Environnements de test : ", "accent"), t(homelab.testEnvironments.map((e) => e.label).join(", "))),
        line(t("  Pratique réseau : ", "accent"), t(homelab.networkPractice.map((n) => n.label).join(", "))),
      ]),
  },
  {
    name: "contact",
    description: "comment me contacter",
    run: () =>
      out([
        line(profile.contacts.length === 1 ? `Le plus simple pour me contacter : ${profile.contacts[0]!.label}.` : "Pour me contacter :"),
        ...profile.contacts.map((c) => line(t(`  ${c.label} : `), { kind: "link", text: c.display, href: c.href })),
        line(t("  Formulaire : ", "muted"), { kind: "link", text: "section Contact", href: "#contact" }),
      ]),
  },
  {
    name: "linkedin",
    description: "ouvre mon profil LinkedIn",
    run: () =>
      linkedin
        ? out(
            [
              line("Ouverture de LinkedIn dans un nouvel onglet…"),
              line(t("Rien ne s'est ouvert ? ", "muted"), { kind: "link", text: linkedin.display, href: linkedin.href }),
            ],
            [{ type: "open-url", url: linkedin.href }],
          )
        : out([line("Aucun profil LinkedIn renseigné.")]),
  },
  {
    name: "cv",
    aliases: ["resume"],
    description: "télécharge mon CV (PDF)",
    run: () =>
      profile.cvFile
        ? out(
            [
              line(`Téléchargement de ${CV_NAME}…`),
              line(t("Rien ne s'est passé ? ", "muted"), { kind: "link", text: "Télécharger le CV (PDF)", href: profile.cvFile }),
            ],
            [{ type: "download", url: profile.cvFile, filename: CV_NAME }],
          )
        : out([
            line("Aucun CV téléchargeable n'est publié pour l'instant."),
            line(t("Tu peux imprimer mon parcours (mise en page dédiée) : ", "muted"), { kind: "action", text: "imprimer", action: "print" }),
          ]),
  },
  {
    name: "github",
    aliases: ["gh", "git"],
    description: "ouvre mon GitHub",
    run: () =>
      out(
        [
          line("Ouverture de GitHub dans un nouvel onglet…"),
          line(t("Rien ne s'est ouvert ? ", "muted"), { kind: "link", text: "github.com/dagonk49", href: GITHUB_URL }),
        ],
        [{ type: "open-url", url: GITHUB_URL }],
      ),
  },
  {
    name: "email",
    aliases: ["mail", "courriel"],
    description: "affiche mon adresse email",
    run: () =>
      out([
        line(t("Email : ", "accent"), t(CONTACT_EMAIL, "strong")),
        line(t("Écrire un message : ", "muted"), { kind: "link", text: `mailto:${CONTACT_EMAIL}`, href: MAILTO }),
        line(t("Ou via le formulaire : ", "muted"), { kind: "link", text: "section Contact", href: "#contact" }),
      ]),
  },
  {
    name: "realisations",
    aliases: ["e5", "fiches", "realisation"],
    description: "mes réalisations professionnelles (fiches E5)",
    run: () =>
      out([
        line(t("Réalisations professionnelles — tableau de synthèse E5", "strong")),
        ...realisations.map((r) =>
          line(t(`  R${r.number}  `, "accent"), { kind: "link", text: r.title, href: `#realisation-${r.id}` }, t(` — ${realisationPeriod(r)}`, "muted")),
        ),
        blank,
        line(t(`Compétences couvertes : ${e5Competences.map((c) => c.short).join(" · ")}`, "muted")),
      ]),
  },
  {
    name: "history",
    description: "commandes saisies pendant cette session",
    run: (_args, ctx) =>
      ctx.history.length === 0
        ? out([line(t("Historique vide.", "muted"))])
        : out(ctx.history.map((h, i) => line(t(`${String(i + 1).padStart(4)}  `, "muted"), t(h)))),
  },
  {
    name: "clear",
    aliases: ["cls"],
    description: "efface le terminal",
    run: () => out([], [{ type: "clear" }]),
  },
  {
    name: "gui",
    aliases: ["3d", "startx"],
    description: "entre dans le lab 3D",
    run: (_args, ctx) =>
      ctx.can3d
        ? out([line("Chargement du lab 3D…")], [{ type: "enter-3d" }])
        : out([line(t("Le lab 3D n'est pas disponible sur ce navigateur (WebGL indisponible). Tout le contenu reste consultable ici.", "warn"))]),
  },
  {
    name: "google",
    description: "ouvre Google dans un nouvel onglet",
    run: () =>
      out(
        [
          line("Ouverture de Google dans un nouvel onglet…"),
          line(t("Rien ne s'est ouvert ? ", "muted"), { kind: "link", text: "www.google.com", href: GOOGLE_URL }),
        ],
        [{ type: "open-url", url: GOOGLE_URL }],
      ),
  },
  {
    name: "valorant",
    aliases: ["valo"],
    description: "easter egg",
    hidden: true,
    run: () => out([line("En dehors de l'infra, j'adore aussi jouer à Valorant.")], [{ type: "fx", name: "valorant" }]),
  },
  {
    name: "minecraft",
    description: "easter egg",
    hidden: true,
    run: () =>
      out([line("Minecraft me plaît aussi : construire bloc par bloc, ça me parle forcément.")], [{ type: "fx", name: "minecraft" }]),
  },
  {
    name: "gta5",
    aliases: ["gta v", "gta 5", "gtav"],
    description: "easter egg",
    hidden: true,
    run: () => out([line("GTA V fait aussi partie des jeux qui m'intéressent.")], [{ type: "fx", name: "gta5" }]),
  },
  {
    name: "gta6",
    aliases: ["gta vi", "gta 6", "gtavi"],
    description: "easter egg",
    hidden: true,
    run: () => out([line("GTA VI m'intéresse aussi beaucoup.")], [{ type: "fx", name: "gta6" }]),
  },
  {
    name: "cars",
    aliases: ["racer", "nascar"],
    description: "easter egg",
    hidden: true,
    run: (_args, ctx) =>
      out(
        [
          line(t(RACER_UNLOCKED, "ok")),
          ctx.can3d
            ? line(t("Le circuit se rejoint par le sas du lab. ", "muted"), { kind: "action", text: "aller au circuit", action: "enter-circuit" })
            : line(t("Le circuit 3D n'est pas disponible sur ce navigateur (WebGL indisponible).", "warn")),
        ],
        [{ type: "unlock-racer" }, { type: "fx", name: "cars" }],
      ),
  },
  {
    name: "sudo",
    description: "easter egg",
    hidden: true,
    run: (args) =>
      out(
        [
          line(t(`[sudo] mot de passe pour visiteur : `, "muted"), t("********", "muted")),
          line(
            t("Bien tenté ! visiteur n'apparaît pas dans le fichier sudoers. Les droits administrateur, je les garde pour mon lab.", "warn"),
          ),
          line(t(args.length > 0 ? `Rien n'a été exécuté (« ${args.join(" ")} » reste une simple chaîne de caractères).` : "Rien n'a été exécuté.", "muted")),
        ],
        [{ type: "fx", name: "sudo" }],
      ),
  },
];

/** Minuscule, espaces normalisés. */
export function normalize(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

const INDEX = new Map<string, CommandDef>();
for (const c of COMMANDS) {
  INDEX.set(c.name, c);
  for (const a of c.aliases ?? []) INDEX.set(a, c);
}

export function publicCommandNames(): string[] {
  return COMMANDS.filter((c) => !c.hidden).map((c) => c.name);
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length]![b.length]!;
}

export function execute(input: string, ctx: TerminalContext): CommandResult {
  const normalized = normalize(input);
  if (normalized === "") return out([]);
  // 1) Commande complète, espaces compris (« gta v », « gta vi »).
  const whole = INDEX.get(normalized);
  if (whole) return whole.run([], ctx);
  // 2) Premier mot + arguments.
  const [head = "", ...args] = normalized.split(" ");
  const cmd = INDEX.get(head);
  if (cmd) {
    if (args.length > 0 && cmd.name !== "sudo") {
      return out([line(t(`${cmd.name} ne prend pas d'argument ici : tape simplement « ${cmd.name} ».`, "warn"))]);
    }
    return cmd.run(args, ctx);
  }
  const suggestion = publicCommandNames()
    .map((name) => ({ name, d: levenshtein(head, name) }))
    .filter((s) => s.d <= 2)
    .sort((a, b) => a.d - b.d)[0];
  // L'entrée est réaffichée en texte brut (jamais interprétée comme HTML).
  const shown = input.trim().slice(0, 60);
  return out([
    line(t(`Commande introuvable : ${shown}`, "warn")),
    line(t(suggestion ? `Vouliez-vous dire « ${suggestion.name} » ? ` : "", "muted"), t("Tape help pour la liste des commandes.", "muted")),
  ]);
}

/** Autocomplétion : renvoie la complétion (préfixe commun) et les candidats. */
export function complete(input: string): { value: string | null; candidates: string[] } {
  const prefix = input.trimStart().toLowerCase();
  if (prefix === "" || prefix.includes(" ")) return { value: null, candidates: [] };
  const candidates = publicCommandNames().filter((n) => n.startsWith(prefix));
  if (candidates.length === 0) return { value: null, candidates };
  if (candidates.length === 1) return { value: `${candidates[0]}`, candidates };
  let common = candidates[0]!;
  for (const c of candidates) {
    while (!c.startsWith(common)) common = common.slice(0, -1);
  }
  return { value: common.length > prefix.length ? common : null, candidates };
}
