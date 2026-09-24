/**
 * Sorties de diagnostic (ipconfig, ping, rapport) calculées depuis l'état du
 * lab. Chaque résultat dépend de la configuration : rien n'est affiché
 * « en dur » comme un succès.
 */
import { capitalize } from "@/lib/format";
import { broadcastOf, formatIPv4, networkOf, parseIPv4, prefixToMask, sameSubnet, type IPv4 } from "@/lib/ipv4";
import { DEVICES, ENDPOINT_BY_ID, INITIAL_TTL, NODE_NAMES, SCENARIO_IPS, type L3Node, type SwitchPortId } from "./scenario";
import {
  computeNetwork,
  deliver,
  interfacesOf,
  linkStatus,
  ownerOf,
  portConfig,
  sourceIpFor,
  switchPortOf,
  vlanName,
  type ActiveEndpoint,
  type Failure,
  type LabState,
  type LinkStatus,
  type NetworkView,
} from "./network";

const ip = formatIPv4;

/* ------------------------------------------------------------------ */
/* Explications en langage clair                                        */
/* ------------------------------------------------------------------ */

function portName(id: string): string {
  const def = ENDPOINT_BY_ID[id as ActiveEndpoint];
  return def ? def.label : id;
}

/** Explique l'état de liaison d'une carte réseau (poste ou serveur). */
export function explainLink(state: LabState, nic: "pc-eth0" | "srv-eth0"): string {
  const who = nic === "pc-eth0" ? "PC-LAB" : "SRV-LAB";
  const link: LinkStatus = linkStatus(state, nic);
  const entry = nic === "pc-eth0" ? "PP-02 (prise B-02)" : "eth0";
  if (link.up) {
    const peer = ENDPOINT_BY_ID[link.peer];
    if (peer.role === "switchport") {
      const cfg = portConfig(state, link.peer as SwitchPortId);
      return `${who} est relié au port ${peer.label} du switch (VLAN ${cfg.vlan} « ${vlanName(cfg.vlan)} »).`;
    }
    return `${who} est relié directement à ${DEVICES[peer.device].name}, sans passer par le switch.`;
  }
  switch (link.reason) {
    case "no-cable":
      return nic === "pc-eth0"
        ? `Aucun câble n'est branché sur ${entry} à la baie : la carte réseau de ${who} est « déconnectée ».`
        : `Aucun câble n'est branché sur eth0 : ${who} est déconnecté.`;
    case "dead-end":
      return `Le câble de ${who} aboutit à une prise murale non raccordée : aucun équipement actif au bout.`;
    case "console":
      return `${who} est branché sur le port console du switch : c'est un port d'administration série, pas une interface Ethernet.`;
    case "shutdown-local":
    case "shutdown-peer":
      return `${who} est branché sur ${portName(link.peer ?? "")}, un port désactivé (shutdown) : active-le ou choisis un autre port.`;
    case "sfp":
      return `Cage SFP sans module : aucune liaison possible.`;
  }
}

/** « dans le VLAN 10 », « sur une liaison directe »… */
function inDomain(domain: string | null): string {
  if (!domain) return "sans réseau";
  if (domain.startsWith("vlan:")) return `dans le VLAN ${domain.slice(5)}`;
  return "sur une liaison directe, hors switch";
}

/** Où se trouve le serveur, en une proposition courte. */
function serverWhereabouts(state: LabState): string {
  const port = switchPortOf(state, "srv-eth0");
  if (port) {
    const cfg = portConfig(state, port);
    return `SRV-LAB est sur ${portName(port)}, dans le VLAN ${cfg.vlan}`;
  }
  return "SRV-LAB est relié en direct, hors switch";
}

export function explainFailure(state: LabState, view: NetworkView, f: Failure): string {
  const name = NODE_NAMES[f.node];
  switch (f.kind) {
    case "no-address":
      if (f.node === "pc-lab") {
        return state.pc.mode === "dhcp"
          ? `${explainLink(state, "pc-eth0")} Le poste est en DHCP, mais le lab ne contient aucun serveur DHCP.`
          : "Le poste n'a pas d'adresse IPv4.";
      }
      return `${name} n'a pas d'adresse IPv4.`;
    case "duplicate": {
      const owner = ownerOf(f.ip);
      return `Conflit d'adresse IP : ${ip(f.ip)} est déjà utilisée par ${owner ? NODE_NAMES[owner.node] : "un autre équipement"} dans le même réseau. Windows désactive alors l'adresse du poste.`;
    }
    case "no-link":
      return f.node === "pc-lab" ? explainLink(state, "pc-eth0") : f.node === "srv-lab" ? explainLink(state, "srv-eth0") : `${name} n'a pas de liaison.`;
    case "no-route": {
      if (f.node === "r1") {
        const isPrivate = (f.dst >>> 24 === 10) || (f.dst >>> 20 === 0xac1) || (f.dst >>> 16 === 0xc0a8);
        return isPrivate
          ? `R1 ne connaît aucune route vers ${ip(f.dst)} : ses seuls réseaux sont 192.168.10.0/24 et 192.168.20.0/24.`
          : `R1 ne connaît aucune route vers ${ip(f.dst)} : le lab est isolé et ne simule pas d'accès Internet.`;
      }
      const iface = interfacesOf(view, f.node)[0];
      const net = iface ? `${ip(networkOf(iface.ip, iface.prefix))}/${iface.prefix}` : "?";
      const apipa = iface && "apipa" in iface && iface.apipa;
      return `${ip(f.dst)} n'est pas dans le réseau de ${name} (${net}) et aucune passerelle n'est configurée.${apipa ? " L'adresse 169.254.x.x est une adresse APIPA, prise faute de serveur DHCP : configure une adresse statique." : ""}`;
    }
    case "arp-failed": {
      const owner = ownerOf(f.nextHop);
      const where = inDomain(f.domain);
      if (!f.direct) {
        if (!owner) {
          return `La passerelle ${ip(f.nextHop)} ne répond pas : aucun équipement n'a cette adresse ${where}, où se trouve ${name}.`;
        }
        if (owner.node !== "r1") {
          return `La passerelle ${ip(f.nextHop)} (${NODE_NAMES[owner.node]}) ne répond pas depuis ${name}, ${where}.`;
        }
        return `La passerelle ${ip(f.nextHop)} (R1) ne répond pas : ${name} est ${where}, où R1 ${
          f.domain === "vlan:10" || f.domain === "vlan:20" ? "n'utilise pas cette adresse" : "n'a aucune interface"
        }.`;
      }
      if (!owner) {
        return `Aucun équipement du lab ne répond à ${ip(f.nextHop)} ${where} : cette adresse n'est utilisée par personne.`;
      }
      if (owner.node === "srv-lab") {
        if (!linkStatus(state, "srv-eth0").up) {
          return `SRV-LAB (${ip(f.nextHop)}) ne répond pas : ${explainLink(state, "srv-eth0")}`;
        }
        return `SRV-LAB (${ip(f.nextHop)}) ne répond pas à la requête ARP : ${name} est ${where}, tandis que ${serverWhereabouts(state)}. Sans VLAN commun, pas de domaine de diffusion partagé.`;
      }
      return `${NODE_NAMES[owner.node]} (${ip(f.nextHop)}) ne répond pas à la requête ARP : ${name} est ${where}, tandis que cette adresse est utilisée dans le VLAN ${owner.vlan ?? "?"}.`;
    }
    case "not-a-router":
      return `La passerelle configurée pointe vers ${name}, qui n'est pas un routeur : il ne relaie pas les paquets des autres.`;
    case "ttl-expired":
      return "Le paquet a tourné en boucle jusqu'à expiration du TTL.";
  }
}

/* ------------------------------------------------------------------ */
/* ipconfig                                                             */
/* ------------------------------------------------------------------ */

export function ipconfig(state: LabState, all = false): string[] {
  const view = computeNetwork(state);
  const link = linkStatus(state, "pc-eth0");
  const pc = interfacesOf(view, "pc-lab")[0];
  const lines = ["Configuration IP de Windows", "", "Carte Ethernet Ethernet :", ""];
  if (all) {
    lines.push(`   Description. . . . . . . . . . . . . . : Carte réseau du poste PC-LAB (simulée)`);
    lines.push(`   DHCP activé. . . . . . . . . . . . . . : ${state.pc.mode === "dhcp" ? "Oui" : "Non"}`);
  }
  if (!link.up && state.pc.mode === "dhcp") {
    lines.push("   Statut du média. . . . . . . . . . . . : Média déconnecté");
    return lines;
  }
  if (!link.up) lines.push("   Statut du média. . . . . . . . . . . . : Média déconnecté");
  if (!pc) return lines;
  const label = pc.apipa ? "Adresse IPv4 d'autoconfiguration" : "Adresse IPv4";
  const dots = ". ".repeat(Math.max(1, Math.floor((38 - label.length) / 2)));
  lines.push(`   ${label} ${dots}: ${ip(pc.ip)}${pc.duplicate ? "(Dupliqué)" : ""}`);
  lines.push(`   Masque de sous-réseau. . . . . . . . . : ${ip(prefixToMask(pc.prefix))}`);
  lines.push(`   Passerelle par défaut. . . . . . . . . : ${pc.gateway !== null ? ip(pc.gateway) : ""}`);
  return lines;
}

/* ------------------------------------------------------------------ */
/* ping                                                                 */
/* ------------------------------------------------------------------ */

export type PingOutcome = "success" | "unreachable" | "timeout" | "general-failure" | "invalid";

export interface PingResult {
  outcome: PingOutcome;
  target: string;
  lines: string[];
  /** Analyse pédagogique en français clair. */
  analysis: string;
  replyFrom?: L3Node;
}

const COUNT = 4;

function stats(target: string, received: number): string[] {
  const lost = COUNT - received;
  const out = [
    "",
    `Statistiques Ping pour ${target}:`,
    `    Paquets : envoyés = ${COUNT}, reçus = ${received}, perdus = ${lost} (perte ${Math.round((lost / COUNT) * 100)}%),`,
  ];
  return out;
}

export function ping(state: LabState, target: string, from: L3Node = "pc-lab"): PingResult {
  const dst = parseIPv4(target);
  if (dst === null) {
    return {
      outcome: "invalid",
      target,
      lines: [`La requête Ping n'a pas pu trouver l'hôte ${target}. Vérifiez le nom et essayez à nouveau.`],
      analysis: "Ce terminal attend une adresse IPv4, par exemple : ping 192.168.10.10",
    };
  }
  const view = computeNetwork(state);
  const header = `Envoi d'une requête 'Ping'  ${ip(dst)} avec 32 octets de données :`;
  const src = interfacesOf(view, from)[0];
  if (src && !src.duplicate && (dst === networkOf(src.ip, src.prefix) || dst === broadcastOf(src.ip, src.prefix)) && src.prefix < 31) {
    return {
      outcome: "invalid",
      target: ip(dst),
      lines: [header, "Échec de la transmission. Défaillance générale."],
      analysis: `${ip(dst)} est l'adresse ${dst === networkOf(src.ip, src.prefix) ? "du réseau" : "de diffusion"} : ce lab ne simule pas le ping vers ces adresses.`,
    };
  }

  const request = deliver(view, from, dst);
  if (!request.ok) {
    const f = request.failure;
    const analysis = explainFailure(state, view, f);
    if (f.kind === "no-route" && f.node === "r1") {
      const gw = interfacesOf(view, from)[0]?.gateway;
      const line = `Réponse de ${gw !== null && gw !== undefined ? ip(gw) : "?"} : Impossible de joindre l'hôte de destination.`;
      return {
        outcome: "unreachable",
        target: ip(dst),
        lines: [header, ...Array(COUNT).fill(line), ...stats(ip(dst), COUNT)],
        analysis: `${analysis} Attention : Windows compte ces messages comme « reçus », mais la destination n'a pas été jointe.`,
      };
    }
    if (f.kind === "arp-failed" && f.node === from && f.direct) {
      const line = `Réponse de ${ip(f.fromIp)} : Impossible de joindre l'hôte de destination.`;
      return {
        outcome: "unreachable",
        target: ip(dst),
        lines: [header, ...Array(COUNT).fill(line), ...stats(ip(dst), COUNT)],
        analysis: `${analysis} Attention : Windows compte ces messages comme « reçus », mais la destination n'a pas été jointe.`,
      };
    }
    if (f.node === from && (f.kind === "no-route" || f.kind === "no-link" || f.kind === "no-address" || f.kind === "duplicate")) {
      return {
        outcome: "general-failure",
        target: ip(dst),
        lines: [header, ...Array(COUNT).fill("Échec de la transmission. Défaillance générale."), ...stats(ip(dst), 0)],
        analysis,
      };
    }
    return {
      outcome: "timeout",
      target: ip(dst),
      lines: [header, ...Array(COUNT).fill("Délai d'attente de la demande dépassé."), ...stats(ip(dst), 0)],
      analysis,
    };
  }

  // La requête est arrivée : encore faut-il que la réponse revienne.
  const replier = request.at;
  const srcIp = sourceIpFor(view, from, dst);
  if (srcIp === null) {
    return { outcome: "general-failure", target: ip(dst), lines: [header], analysis: "Le poste n'a pas d'adresse source." };
  }
  const reply = replier === from ? request : deliver(view, replier, srcIp);
  if (!reply.ok) {
    return {
      outcome: "timeout",
      target: ip(dst),
      lines: [header, ...Array(COUNT).fill("Délai d'attente de la demande dépassé."), ...stats(ip(dst), 0)],
      analysis: `La requête atteint ${NODE_NAMES[replier]}, mais sa réponse ne revient pas : ${explainFailure(state, view, reply.failure)}`,
      replyFrom: replier,
    };
  }
  const ttl = INITIAL_TTL[replier] - reply.routers;
  const line = `Réponse de ${ip(dst)} : octets=32 temps<1ms TTL=${ttl}`;
  const viaRouter = request.routers > 0;
  const srcIface = interfacesOf(view, from)[0];
  let analysis: string;
  if (replier === from) {
    analysis = "Le poste se répond à lui-même.";
  } else if (replier === "r1" && !viaRouter) {
    analysis = "R1, la passerelle, répond : elle est joignable dans le même réseau et le même VLAN que le poste.";
  } else if (viaRouter) {
    analysis = `${capitalize(NODE_NAMES[replier])} répond en passant par la passerelle R1 : le routage inter-VLAN fonctionne.`;
  } else if (srcIface && sameSubnet(srcIface.ip, dst, srcIface.prefix)) {
    analysis = `${NODE_NAMES[replier]} répond en remise directe : même réseau et même domaine de diffusion. La passerelle n'intervient pas.`;
  } else {
    analysis = `${NODE_NAMES[replier]} répond.`;
  }
  return {
    outcome: "success",
    target: ip(dst),
    lines: [
      header,
      ...Array(COUNT).fill(line),
      ...stats(ip(dst), COUNT),
      "Durée approximative des boucles en millisecondes :",
      "    Minimum = 0ms, Maximum = 0ms, Moyenne = 0ms",
    ],
    analysis,
    replyFrom: replier,
  };
}

/* ------------------------------------------------------------------ */
/* Rapport de diagnostic                                                */
/* ------------------------------------------------------------------ */

export interface DiagnosticCheck {
  id: "pc-link" | "srv-link" | "pc-ip" | "ping-server" | "ping-gateway" | "ping-remote";
  label: string;
  ok: boolean;
  detail: string;
}

export interface DiagnosticReport {
  success: boolean;
  checks: DiagnosticCheck[];
}

export function runDiagnostic(state: LabState): DiagnosticReport {
  const view = computeNetwork(state);
  const pcLink = linkStatus(state, "pc-eth0");
  const srvLink = linkStatus(state, "srv-eth0");
  const pcIface = interfacesOf(view, "pc-lab")[0];

  let ipOk = false;
  let ipDetail: string;
  if (state.pc.mode === "dhcp") {
    ipDetail = pcIface
      ? `Adresse APIPA ${ip(pcIface.ip)} : le poste est en DHCP mais aucun serveur DHCP n'existe dans le lab. Passe en configuration statique.`
      : "Poste en DHCP, sans liaison : aucune adresse. Le lab ne contient d'ailleurs aucun serveur DHCP.";
  } else if (pcIface?.duplicate) {
    const owner = ownerOf(pcIface.ip);
    ipDetail = `Conflit : ${ip(pcIface.ip)} est déjà utilisée par ${owner ? NODE_NAMES[owner.node] : "un autre équipement"}.`;
  } else if (pcIface) {
    ipOk = true;
    ipDetail = `${ip(pcIface.ip)}/${pcIface.prefix}, passerelle ${pcIface.gateway !== null ? ip(pcIface.gateway) : "non définie"}.`;
  } else {
    ipDetail = "Aucune adresse IPv4.";
  }

  const server = ping(state, ip(SCENARIO_IPS.server));
  const gateway = ping(state, ip(SCENARIO_IPS.gateway));
  const remote = ping(state, ip(SCENARIO_IPS.accessPoint));

  const checks: DiagnosticCheck[] = [
    { id: "pc-link", label: "Liaison du poste PC-LAB", ok: pcLink.up, detail: explainLink(state, "pc-eth0") },
    { id: "srv-link", label: "Liaison du serveur SRV-LAB", ok: srvLink.up, detail: explainLink(state, "srv-eth0") },
    { id: "pc-ip", label: "Adresse IPv4 du poste", ok: ipOk, detail: ipDetail },
    {
      id: "ping-server",
      label: `Ping SRV-LAB (${ip(SCENARIO_IPS.server)})`,
      ok: server.outcome === "success",
      detail: server.analysis,
    },
    {
      id: "ping-gateway",
      label: `Ping passerelle R1 (${ip(SCENARIO_IPS.gateway)})`,
      ok: gateway.outcome === "success",
      detail: gateway.analysis,
    },
    {
      id: "ping-remote",
      label: `Autre réseau : borne Wi-Fi (${ip(SCENARIO_IPS.accessPoint)}, VLAN 20)`,
      ok: remote.outcome === "success",
      detail: remote.analysis,
    },
  ];
  return { success: checks.every((c) => c.ok), checks };
}

/** Le poste joint-il le serveur et la passerelle ? (sert aux voyants et aux flux 3D) */
export function labOnline(state: LabState): { server: boolean; gateway: boolean; remote: boolean } {
  return {
    server: ping(state, ip(SCENARIO_IPS.server)).outcome === "success",
    gateway: ping(state, ip(SCENARIO_IPS.gateway)).outcome === "success",
    remote: ping(state, ip(SCENARIO_IPS.accessPoint)).outcome === "success",
  };
}
