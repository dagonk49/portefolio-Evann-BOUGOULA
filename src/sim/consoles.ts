/**
 * Deux petits interpréteurs de commandes, limités à une liste explicite :
 * - le terminal du poste PC-LAB : help, ipconfig, ping, diag, clear ;
 * - la console en lecture seule de SW-LAB : show vlan brief, show interfaces status.
 * Aucune exécution arbitraire : chaque commande est une fonction du scénario.
 */
import { ENDPOINTS, LOCKED_PORTS, VLANS, type SwitchPortId } from "./scenario";
import { linkStatus, portConfig, type LabState } from "./network";
import { ipconfig, ping, runDiagnostic, type DiagnosticReport } from "./diagnostics";

export interface ConsoleResult {
  lines: string[];
  clear?: boolean;
  /** Rapport renvoyé par `diag` (utilisé pour la progression). */
  diagnostic?: DiagnosticReport;
  /** Analyse lisible affichée à part de la sortie brute. */
  note?: string;
}

export const PC_COMMANDS = [
  { name: "help", usage: "help", text: "liste des commandes disponibles" },
  { name: "ipconfig", usage: "ipconfig [/all]", text: "configuration IP du poste" },
  { name: "ping", usage: "ping <adresse IPv4>", text: "teste la joignabilité d'un hôte (4 requêtes)" },
  { name: "diag", usage: "diag", text: "lance le diagnostic complet de la mission" },
  { name: "clear", usage: "clear (ou cls)", text: "efface l'écran" },
] as const;

export function runPcCommand(state: LabState, raw: string): ConsoleResult {
  const input = raw.trim().replace(/\s+/g, " ");
  if (input === "") return { lines: [] };
  const [cmd = "", ...args] = input.split(" ");
  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
      return {
        lines: [
          "Commandes disponibles sur PC-LAB (simulation locale) :",
          ...PC_COMMANDS.map((c) => `  ${c.usage.padEnd(22)} ${c.text}`),
        ],
      };
    case "ipconfig": {
      const all = args[0]?.toLowerCase() === "/all";
      return { lines: ipconfig(state, all) };
    }
    case "ping": {
      const target = args.find((a) => !a.startsWith("-"));
      if (!target) return { lines: ["Utilisation : ping <adresse IPv4>   (exemple : ping 192.168.10.10)"] };
      const result = ping(state, target);
      return { lines: result.lines, note: result.analysis };
    }
    case "diag": {
      const report = runDiagnostic(state);
      return {
        lines: [
          "Diagnostic du poste PC-LAB :",
          ...report.checks.map((c) => `  [${c.ok ? " OK " : "ÉCHEC"}] ${c.label}`),
          "",
          report.success ? "Résultat : le poste est en ligne." : "Résultat : au moins un test échoue (détails dans l'onglet Diagnostic).",
        ],
        diagnostic: report,
      };
    }
    case "clear":
    case "cls":
      return { lines: [], clear: true };
    default:
      return {
        lines: [`'${cmd}' n'est pas reconnu comme commande de ce poste simulé. Tape help pour la liste.`],
      };
  }
}

/* ------------------------------------------------------------------ */
/* Console SW-LAB (lecture seule)                                       */
/* ------------------------------------------------------------------ */

export const SWITCH_COMMANDS = [
  { usage: "show vlan brief", text: "VLAN et ports d'accès associés" },
  { usage: "show interfaces status", text: "état, VLAN et type de chaque port" },
  { usage: "help", text: "cette aide" },
] as const;

const KEYWORDS: { words: string[]; min: number[]; run: (s: LabState) => string[] }[] = [
  { words: ["show", "vlan", "brief"], min: [2, 1, 2], run: showVlanBrief },
  { words: ["show", "interfaces", "status"], min: [2, 3, 2], run: showInterfacesStatus },
];

/** Reconnaît les abréviations façon IOS (« sh vl br », « sh int status »). */
export function runSwitchCommand(state: LabState, raw: string): ConsoleResult {
  const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { lines: [] };
  if (tokens[0] === "help" || tokens[0] === "?") {
    return {
      lines: [
        "Console SW-LAB en lecture seule (simulation). Commandes disponibles :",
        ...SWITCH_COMMANDS.map((c) => `  ${c.usage.padEnd(24)} ${c.text}`),
        "La configuration des ports se fait dans le formulaire ci-dessus.",
      ],
    };
  }
  if (tokens[0] === "clear" || tokens[0] === "cls") return { lines: [], clear: true };
  for (const k of KEYWORDS) {
    if (tokens.length !== k.words.length) continue;
    const match = tokens.every((t, i) => t.length >= (k.min[i] ?? 1) && k.words[i]!.startsWith(t));
    if (match) return { lines: k.run(state) };
  }
  if (tokens[0] === "conf" || tokens[0] === "configure" || tokens[0] === "enable") {
    return { lines: ["% Console en lecture seule : utilise le formulaire de configuration des ports."] };
  }
  return { lines: ["% Invalid input detected — commande non disponible dans cette console simulée (tape help)."] };
}

const SWITCH_PORTS = ENDPOINTS.filter((e) => e.role === "switchport").map((e) => e.id as SwitchPortId);

const short = (id: SwitchPortId) => id.replace("sw-gi", "Gi");

export function showVlanBrief(state: LabState): string[] {
  const lines = [
    "VLAN Name                             Status    Ports",
    "---- -------------------------------- --------- -------------------------------",
  ];
  for (const vlan of VLANS) {
    const ports = SWITCH_PORTS.filter((p) => {
      const cfg = portConfig(state, p);
      return cfg.mode === "access" && cfg.vlan === vlan.id;
    }).map(short);
    lines.push(`${String(vlan.id).padEnd(4)} ${vlan.name.padEnd(32)} active    ${ports.join(", ")}`);
  }
  return lines;
}

export function showInterfacesStatus(state: LabState): string[] {
  const lines = ["Port      Name               Status       Vlan       Duplex  Speed Type"];
  for (const p of SWITCH_PORTS) {
    const cfg = portConfig(state, p);
    const link = linkStatus(state, p);
    const locked = LOCKED_PORTS[p as keyof typeof LOCKED_PORTS];
    const isSfp = p === "sw-gi0/9" || p === "sw-gi0/10";
    const status = cfg.shutdown ? "disabled" : link.up ? "connected" : "notconnect";
    const vlan = cfg.mode === "trunk" ? "trunk" : String(cfg.vlan);
    const duplex = link.up ? "a-full" : "auto";
    const speed = link.up ? "a-1000" : "auto";
    const type = isSfp ? "Not Present" : "10/100/1000BaseTX";
    const name = locked?.description ?? "";
    lines.push(
      `${short(p).padEnd(10)}${name.padEnd(19)}${status.padEnd(13)}${vlan.padEnd(11)}${duplex.padEnd(8)}${speed.padEnd(6)}${type}`,
    );
  }
  return lines;
}
