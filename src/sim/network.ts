/**
 * Modèle réseau du lab : couche physique (câbles, liaisons), couche 2
 * (VLAN, domaines de diffusion) et couche 3 (adressage, routage, ARP).
 * Fonctions pures, sans dépendance au rendu : l'état entre, un résultat sort.
 */
import {
  broadcastOf,
  formatIPv4,
  isLoopback,
  isMulticastOrReserved,
  networkOf,
  parseIPv4,
  parseMask,
  sameSubnet,
  type IPv4,
} from "@/lib/ipv4";
import {
  DEVICES,
  EDITABLE_PORTS,
  ENDPOINT_BY_ID,
  FIXED_CABLES,
  LOCKED_PORTS,
  SCENARIO_IPS,
  STATIC_INTERFACES,
  VLANS,
  type AccessPortConfig,
  type Cable,
  type EditablePortId,
  type EndpointId,
  type L3Node,
  type NicId,
  type StaticInterface,
  type SwitchPortId,
} from "./scenario";

export type PcConfig =
  | { mode: "dhcp" }
  | { mode: "static"; ip: IPv4; prefix: number; gateway: IPv4 | null };

export interface LabState {
  /** Câbles posés par le joueur (les câbles fixes sont dans le scénario). */
  cables: Cable[];
  ports: Record<EditablePortId, AccessPortConfig>;
  pc: PcConfig;
}

export function initialLabState(): LabState {
  const ports = {} as Record<EditablePortId, AccessPortConfig>;
  for (const id of EDITABLE_PORTS) ports[id] = { vlan: 1, shutdown: id === "sw-gi0/5" };
  return { cables: [], ports, pc: { mode: "dhcp" } };
}

/* ------------------------------------------------------------------ */
/* Couche physique                                                      */
/* ------------------------------------------------------------------ */

export function allCables(state: LabState): Cable[] {
  return [...FIXED_CABLES, ...state.cables];
}

export function isFixedEndpoint(id: EndpointId): boolean {
  return FIXED_CABLES.some((c) => c.a === id || c.b === id);
}

export function cableAt(state: LabState, id: EndpointId): Cable | undefined {
  return allCables(state).find((c) => c.a === id || c.b === id);
}

export type PlugCheck = { ok: true } | { ok: false; reason: string };

export function canPlug(state: LabState, a: EndpointId, b: EndpointId): PlugCheck {
  const ea = ENDPOINT_BY_ID[a];
  const eb = ENDPOINT_BY_ID[b];
  if (!ea || !eb) return { ok: false, reason: "Port inconnu." };
  if (a === b) return { ok: false, reason: "Choisis deux extrémités différentes." };
  if (!ea.selectable || !eb.selectable) {
    return { ok: false, reason: "Ce port n'est pas accessible depuis la baie." };
  }
  for (const e of [ea, eb]) {
    if (e.connector === "sfp") {
      return {
        ok: false,
        reason: `${e.label} est une cage SFP : elle attend un module (fibre ou cuivre), absent ici. Un câble RJ45 ne peut pas s'y brancher.`,
      };
    }
    if (cableAt(state, e.id)) {
      return {
        ok: false,
        reason: isFixedEndpoint(e.id)
          ? `${e.label} est déjà utilisé par une liaison préconfigurée.`
          : `${e.label} est déjà occupé : débranche d'abord son câble.`,
      };
    }
  }
  if (ea.device === "sw-lab" && eb.device === "sw-lab") {
    return {
      ok: false,
      reason: "Relier deux ports du même switch crée une boucle : ce lab ne l'autorise pas.",
    };
  }
  return { ok: true };
}

export function plug(state: LabState, a: EndpointId, b: EndpointId): LabState {
  if (!canPlug(state, a, b).ok) return state;
  return { ...state, cables: [...state.cables, { a, b }] };
}

export function unplug(state: LabState, endpoint: EndpointId): LabState {
  return { ...state, cables: state.cables.filter((c) => c.a !== endpoint && c.b !== endpoint) };
}

/** Extrémités actives (tout sauf les ports passifs de brassage). */
export type ActiveEndpoint = Exclude<EndpointId, "pp-01" | "pp-02" | "pp-03" | "pp-04">;

function neighbors(state: LabState, id: EndpointId): EndpointId[] {
  const out: EndpointId[] = [];
  for (const c of allCables(state)) {
    if (c.a === id) out.push(c.b);
    else if (c.b === id) out.push(c.a);
  }
  const def = ENDPOINT_BY_ID[id];
  if (def.wallRun) out.push(def.wallRun);
  // Côté carte réseau : retrouver le port de brassage qui la dessert.
  for (const e of Object.values(ENDPOINT_BY_ID)) if (e.wallRun === id) out.push(e.id);
  return out;
}

/** Chemin physique depuis une extrémité active jusqu'à l'autre extrémité active. */
export function tracePath(state: LabState, from: ActiveEndpoint): { path: EndpointId[]; far: ActiveEndpoint | null } {
  const path: EndpointId[] = [from];
  const visited = new Set<EndpointId>([from]);
  let current: EndpointId = from;
  for (;;) {
    const next: EndpointId | undefined = neighbors(state, current).find((n) => !visited.has(n));
    if (!next) return { path, far: null };
    path.push(next);
    visited.add(next);
    if (ENDPOINT_BY_ID[next].role !== "patch") return { path, far: next as ActiveEndpoint };
    current = next;
  }
}

export type LinkDownReason =
  | "no-cable"
  | "dead-end"
  | "shutdown-local"
  | "shutdown-peer"
  | "console"
  | "sfp";

export type LinkStatus =
  | { up: true; peer: ActiveEndpoint; path: EndpointId[] }
  | { up: false; reason: LinkDownReason; peer: ActiveEndpoint | null; path: EndpointId[] };

export function portConfig(state: LabState, port: SwitchPortId): { mode: "access" | "trunk"; vlan: number; shutdown: boolean; allowed?: number[] } {
  if ((EDITABLE_PORTS as string[]).includes(port)) {
    const cfg = state.ports[port as EditablePortId];
    return { mode: "access", vlan: cfg.vlan, shutdown: cfg.shutdown };
  }
  const locked = LOCKED_PORTS[port as keyof typeof LOCKED_PORTS];
  return { mode: locked.mode, vlan: locked.vlan, shutdown: false, allowed: locked.allowed };
}

function isShutdown(state: LabState, id: EndpointId): boolean {
  return ENDPOINT_BY_ID[id].role === "switchport" && portConfig(state, id as SwitchPortId).shutdown;
}

export function linkStatus(state: LabState, from: ActiveEndpoint): LinkStatus {
  const def = ENDPOINT_BY_ID[from];
  if (def.connector === "sfp") return { up: false, reason: "sfp", peer: null, path: [from] };
  const { path, far } = tracePath(state, from);
  if (path.length === 1) return { up: false, reason: "no-cable", peer: null, path };
  if (!far) {
    // Carte réseau murale dont le port de brassage n'a pas de câble en façade.
    const last = path[path.length - 1]!;
    const frontCabled = allCables(state).some((c) => c.a === last || c.b === last);
    const reason = path.length === 2 && ENDPOINT_BY_ID[last].role === "patch" && !frontCabled ? "no-cable" : "dead-end";
    return { up: false, reason, peer: null, path };
  }
  if (def.role === "console" || ENDPOINT_BY_ID[far].role === "console") {
    return { up: false, reason: "console", peer: far, path };
  }
  if (isShutdown(state, from)) return { up: false, reason: "shutdown-local", peer: far, path };
  if (isShutdown(state, far)) return { up: false, reason: "shutdown-peer", peer: far, path };
  return { up: true, peer: far, path };
}

/* ------------------------------------------------------------------ */
/* Couche 2 : domaines de diffusion                                     */
/* ------------------------------------------------------------------ */

export interface L3Interface extends Omit<StaticInterface, "id"> {
  id: string;
  apipa?: boolean;
  duplicate?: boolean;
}

/** Interface IPv4 effective du poste, selon sa configuration et sa liaison. */
export function pcInterface(state: LabState): L3Interface | null {
  if (state.pc.mode === "static") {
    return {
      id: "pc",
      node: "pc-lab",
      nic: "pc-eth0",
      ip: state.pc.ip,
      prefix: state.pc.prefix,
      gateway: state.pc.gateway,
    };
  }
  // DHCP sans serveur DHCP : adresse APIPA une fois la liaison établie.
  if (!linkStatus(state, "pc-eth0").up) return null;
  return { id: "pc", node: "pc-lab", nic: "pc-eth0", ip: SCENARIO_IPS.apipa, prefix: 16, gateway: null, apipa: true };
}

/** Domaine de diffusion d'une interface L3, ou `null` sans liaison exploitable. */
export function domainOf(state: LabState, iface: Pick<L3Interface, "nic" | "vlan">): string | null {
  const link = linkStatus(state, iface.nic);
  if (!link.up) return null;
  const peer = link.peer;
  const peerDef = ENDPOINT_BY_ID[peer];
  if (peerDef.role === "switchport") {
    const cfg = portConfig(state, peer as SwitchPortId);
    if (iface.vlan !== undefined) {
      // Sous-interface 802.1Q : il faut un trunk qui transporte ce VLAN.
      return cfg.mode === "trunk" && cfg.allowed?.includes(iface.vlan) ? `vlan:${iface.vlan}` : null;
    }
    // Trame non étiquetée : un port d'accès la place dans son VLAN.
    return cfg.mode === "access" ? `vlan:${cfg.vlan}` : null;
  }
  if (peerDef.role === "nic") {
    if (iface.vlan !== undefined) return null;
    const pair = [iface.nic, peer].sort().join("|");
    return `direct:${pair}`;
  }
  return null;
}

export interface NetworkView {
  interfaces: (L3Interface & { domain: string | null })[];
}

/** Calcule toutes les interfaces L3, leur domaine et les conflits d'adresses. */
export function computeNetwork(state: LabState): NetworkView {
  const list: (L3Interface & { domain: string | null })[] = [];
  for (const s of STATIC_INTERFACES) list.push({ ...s, domain: domainOf(state, s) });
  const pc = pcInterface(state);
  if (pc) list.push({ ...pc, domain: domainOf(state, pc) });
  // Conflit : le poste reprend une adresse déjà utilisée dans son domaine.
  const pcEntry = list.find((i) => i.node === "pc-lab");
  if (pcEntry && pcEntry.domain) {
    const clash = list.some((i) => i !== pcEntry && i.domain === pcEntry.domain && i.ip === pcEntry.ip);
    if (clash) pcEntry.duplicate = true;
  }
  return { interfaces: list };
}

export function interfacesOf(view: NetworkView, node: L3Node) {
  return view.interfaces.filter((i) => i.node === node);
}

/** Qui, dans le lab, porte cette adresse (hors poste) ? */
export function ownerOf(ip: IPv4): StaticInterface | undefined {
  return STATIC_INTERFACES.find((i) => i.ip === ip);
}

/* ------------------------------------------------------------------ */
/* Couche 3 : acheminement                                              */
/* ------------------------------------------------------------------ */

export type Failure =
  | { kind: "no-address"; node: L3Node }
  | { kind: "duplicate"; node: L3Node; ip: IPv4 }
  | { kind: "no-link"; node: L3Node }
  | { kind: "no-route"; node: L3Node; dst: IPv4; viaIp?: IPv4 }
  | { kind: "arp-failed"; node: L3Node; nextHop: IPv4; direct: boolean; domain: string; fromIp: IPv4 }
  | { kind: "not-a-router"; node: L3Node; from: L3Node }
  | { kind: "ttl-expired"; node: L3Node };

export type Delivery =
  | { ok: true; at: L3Node; routers: number; path: L3Node[] }
  | { ok: false; failure: Failure; path: L3Node[] };

function isRouter(node: L3Node): boolean {
  return node === "r1";
}

/**
 * Achemine un paquet depuis `src` vers `dst`. Règle clé : si la destination
 * est dans le réseau de l'interface, la remise est directe (ARP) et la
 * passerelle n'intervient pas.
 */
export function deliver(view: NetworkView, src: L3Node, dst: IPv4, ttl = 16): Delivery {
  const path: L3Node[] = [src];
  let node: L3Node = src;
  let routers = 0;
  for (let hop = 0; hop < ttl; hop++) {
    const ifaces = interfacesOf(view, node);
    if (ifaces.some((i) => i.ip === dst && !i.duplicate)) return { ok: true, at: node, routers, path };
    if (ifaces.length === 0) return { ok: false, failure: { kind: "no-address", node }, path };

    let egress: (typeof ifaces)[number] | undefined;
    let nextHop: IPv4;
    let direct: boolean;
    if (isRouter(node)) {
      egress = ifaces.find((i) => sameSubnet(i.ip, dst, i.prefix));
      if (!egress) return { ok: false, failure: { kind: "no-route", node, dst }, path };
      nextHop = dst;
      direct = true;
    } else {
      egress = ifaces[0]!;
      if (egress.duplicate) return { ok: false, failure: { kind: "duplicate", node, ip: egress.ip }, path };
      if (sameSubnet(egress.ip, dst, egress.prefix)) {
        nextHop = dst;
        direct = true;
      } else if (egress.gateway !== null) {
        nextHop = egress.gateway;
        direct = false;
      } else {
        return { ok: false, failure: { kind: "no-route", node, dst }, path };
      }
    }
    if (!egress.domain) return { ok: false, failure: { kind: "no-link", node }, path };
    const domain = egress.domain;
    const target = view.interfaces.find(
      (i) => i !== egress && i.node !== node && i.domain === domain && i.ip === nextHop && !i.duplicate,
    );
    if (!target) {
      return {
        ok: false,
        failure: { kind: "arp-failed", node, nextHop, direct, domain, fromIp: egress.ip },
        path,
      };
    }
    path.push(target.node);
    if (target.ip === dst) return { ok: true, at: target.node, routers, path };
    if (!isRouter(target.node)) {
      return { ok: false, failure: { kind: "not-a-router", node: target.node, from: node }, path };
    }
    routers++;
    node = target.node;
  }
  return { ok: false, failure: { kind: "ttl-expired", node }, path };
}

/** Adresse source utilisée par un nœud pour joindre `dst`. */
export function sourceIpFor(view: NetworkView, node: L3Node, dst: IPv4): IPv4 | null {
  const ifaces = interfacesOf(view, node);
  const match = ifaces.find((i) => sameSubnet(i.ip, dst, i.prefix));
  return (match ?? ifaces[0])?.ip ?? null;
}

/* ------------------------------------------------------------------ */
/* Validation de la configuration IPv4 du poste                         */
/* ------------------------------------------------------------------ */

export interface PcConfigInput {
  ip: string;
  mask: string;
  gateway: string;
}

export type FieldError = { field: keyof PcConfigInput; message: string };

export type PcConfigValidation =
  | { ok: true; config: Extract<PcConfig, { mode: "static" }> }
  | { ok: false; errors: FieldError[] };

export function validatePcConfig(input: PcConfigInput): PcConfigValidation {
  const errors: FieldError[] = [];
  const ip = parseIPv4(input.ip);
  const prefix = parseMask(input.mask);
  if (ip === null) errors.push({ field: "ip", message: "Adresse IPv4 invalide (exemple de format : 192.168.1.20)." });
  if (prefix === null) {
    errors.push({ field: "mask", message: "Masque invalide : saisis /24 ou 255.255.255.0 (bits contigus)." });
  } else if (prefix < 1 || prefix > 30) {
    errors.push({ field: "mask", message: "Ce lab accepte les masques de /1 à /30." });
  }
  if (ip !== null && (isLoopback(ip) || isMulticastOrReserved(ip))) {
    errors.push({ field: "ip", message: "Adresse réservée (boucle locale, multidiffusion ou 0.x.x.x) : non attribuable à un poste." });
  }
  if (ip !== null && prefix !== null && prefix >= 1 && prefix <= 30 && !errors.some((e) => e.field === "ip")) {
    const net = networkOf(ip, prefix);
    const bcast = broadcastOf(ip, prefix);
    const cidr = `${formatIPv4(net)}/${prefix}`;
    if (ip === net) {
      errors.push({ field: "ip", message: `${formatIPv4(ip)} est l'adresse du réseau ${cidr} : elle ne peut pas être attribuée à un poste.` });
    } else if (ip === bcast) {
      errors.push({ field: "ip", message: `${formatIPv4(ip)} est l'adresse de diffusion (broadcast) du réseau ${cidr} : elle ne peut pas être attribuée à un poste.` });
    }
  }
  let gateway: IPv4 | null = null;
  if (input.gateway.trim() !== "") {
    gateway = parseIPv4(input.gateway);
    if (gateway === null) {
      errors.push({ field: "gateway", message: "Passerelle invalide (laisse le champ vide si tu n'en veux pas)." });
    } else if (ip !== null && prefix !== null && prefix >= 1 && prefix <= 30) {
      const cidr = `${formatIPv4(networkOf(ip, prefix))}/${prefix}`;
      if (!sameSubnet(ip, gateway, prefix)) {
        errors.push({ field: "gateway", message: `La passerelle doit appartenir au réseau du poste (${cidr}).` });
      } else if (gateway === ip) {
        errors.push({ field: "gateway", message: "La passerelle ne peut pas être l'adresse du poste lui-même." });
      } else if (gateway === networkOf(ip, prefix) || gateway === broadcastOf(ip, prefix)) {
        errors.push({ field: "gateway", message: "La passerelle ne peut pas être l'adresse du réseau ni celle de broadcast." });
      }
    }
  }
  if (errors.length > 0 || ip === null || prefix === null) return { ok: false, errors };
  return { ok: true, config: { mode: "static", ip, prefix, gateway } };
}

/* ------------------------------------------------------------------ */
/* Aides de lecture                                                     */
/* ------------------------------------------------------------------ */

export function vlanName(id: number): string {
  return VLANS.find((v) => v.id === id)?.name ?? `VLAN${String(id).padStart(4, "0")}`;
}

export function endpointLabel(id: EndpointId): string {
  const def = ENDPOINT_BY_ID[id];
  const device = DEVICES[def.device].name;
  return def.device === "patch-panel" ? def.label : `${device} ${def.label}`;
}

/** Port du switch auquel une carte réseau aboutit (liaison active ou non). */
export function switchPortOf(state: LabState, nic: NicId): SwitchPortId | null {
  const { far } = tracePath(state, nic);
  return far && ENDPOINT_BY_ID[far].role === "switchport" ? (far as SwitchPortId) : null;
}
