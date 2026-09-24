/**
 * Démonstration pédagogique du portfolio (ce n'est pas le code de NetForge) :
 * découpage VLSM d'une plage parente et aperçu de configuration Cisco IOS.
 */
import {
  blockSize,
  broadcastOf,
  formatIPv4,
  networkOf,
  parseCidr,
  prefixForHosts,
  prefixToMask,
  usableHosts,
  type IPv4,
} from "@/lib/ipv4";

export interface SubnetRequest {
  name: string;
  hosts: number;
  vlan: number;
}

export interface AllocatedSubnet {
  name: string;
  vlan: number;
  hostsRequested: number;
  network: IPv4;
  prefix: number;
  mask: IPv4;
  firstHost: IPv4;
  lastHost: IPv4;
  broadcast: IPv4;
  gateway: IPv4;
  capacity: number;
}

export type VlsmResult =
  | {
      ok: true;
      parent: { network: IPv4; prefix: number };
      normalizedFrom?: string;
      subnets: AllocatedSubnet[];
      used: number;
      total: number;
    }
  | { ok: false; error: string };

export function sanitizeVlanName(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase()
    .slice(0, 32);
  return cleaned || "RESEAU";
}

export function computeVlsm(parentInput: string, requests: SubnetRequest[]): VlsmResult {
  const parsed = parseCidr(parentInput);
  if (!parsed) return { ok: false, error: "Plage parente invalide : utilise la notation 192.168.10.0/24." };
  if (parsed.prefix < 8 || parsed.prefix > 30) {
    return { ok: false, error: "Pour cette démonstration, la plage parente doit aller de /8 à /30." };
  }
  if (requests.length === 0) return { ok: false, error: "Ajoute au moins un sous-réseau." };
  const vlans = new Set<number>();
  for (const r of requests) {
    if (!Number.isInteger(r.hosts) || r.hosts < 1) {
      return { ok: false, error: `« ${r.name || "Sans nom"} » : indique un nombre d'hôtes entier supérieur ou égal à 1.` };
    }
    if (!Number.isInteger(r.vlan) || r.vlan < 1 || r.vlan > 4094) {
      return { ok: false, error: `« ${r.name || "Sans nom"} » : le VLAN doit être compris entre 1 et 4094.` };
    }
    if (vlans.has(r.vlan)) return { ok: false, error: `Le VLAN ${r.vlan} est utilisé deux fois.` };
    vlans.add(r.vlan);
  }

  const network = networkOf(parsed.ip, parsed.prefix);
  const normalizedFrom = network !== parsed.ip ? parentInput.trim() : undefined;
  const end = network + blockSize(parsed.prefix);

  // Tri par taille décroissante : chaque bloc reste aligné sur sa taille,
  // ce qui empêche tout chevauchement.
  const sorted = requests
    .map((r, index) => ({ ...r, index, prefix: prefixForHosts(r.hosts) }))
    .sort((a, b) => b.hosts - a.hosts || a.index - b.index);

  let cursor = network;
  const subnets: AllocatedSubnet[] = [];
  for (const r of sorted) {
    if (r.prefix === null || r.prefix < parsed.prefix) {
      return { ok: false, error: `« ${r.name} » demande ${r.hosts} hôtes : c'est plus que la plage parente ne peut contenir.` };
    }
    const size = blockSize(r.prefix);
    const aligned = Math.ceil(cursor / size) * size;
    if (aligned + size > end) {
      return {
        ok: false,
        error: `Plus assez de place dans ${formatIPv4(network)}/${parsed.prefix} pour « ${r.name} » (${r.hosts} hôtes, /${r.prefix}).`,
      };
    }
    const net = aligned >>> 0;
    subnets.push({
      name: r.name,
      vlan: r.vlan,
      hostsRequested: r.hosts,
      network: net,
      prefix: r.prefix,
      mask: prefixToMask(r.prefix),
      firstHost: (net + 1) >>> 0,
      lastHost: (broadcastOf(net, r.prefix) - 1) >>> 0,
      broadcast: broadcastOf(net, r.prefix),
      gateway: (net + 1) >>> 0,
      capacity: usableHosts(r.prefix),
    });
    cursor = aligned + size;
  }
  return {
    ok: true,
    parent: { network, prefix: parsed.prefix },
    normalizedFrom,
    subnets,
    used: cursor - network,
    total: blockSize(parsed.prefix),
  };
}

export interface ConfigOptions {
  routerInterface: string;
  dhcp: boolean;
}

/** Aperçu Cisco IOS : VLAN, sous-interfaces Router-on-a-Stick et pools DHCP. */
export function ciscoPreview(subnets: AllocatedSubnet[], options: ConfigOptions): string[] {
  const ip = formatIPv4;
  const lines: string[] = ["! Aperçu généré par la démonstration du portfolio — à relire avant usage", "!", "! --- Switch ---"];
  for (const s of subnets) {
    lines.push(`vlan ${s.vlan}`, ` name ${sanitizeVlanName(s.name)}`, "!");
  }
  lines.push("! --- Routeur (Router-on-a-Stick) ---", `interface ${options.routerInterface}`, " no shutdown", "!");
  for (const s of subnets) {
    lines.push(
      `interface ${options.routerInterface}.${s.vlan}`,
      ` description ${sanitizeVlanName(s.name)}`,
      ` encapsulation dot1Q ${s.vlan}`,
      ` ip address ${ip(s.gateway)} ${ip(s.mask)}`,
      "!",
    );
  }
  if (options.dhcp) {
    for (const s of subnets) {
      lines.push(
        `ip dhcp excluded-address ${ip(s.gateway)}`,
        `ip dhcp pool ${sanitizeVlanName(s.name)}`,
        ` network ${ip(s.network)} ${ip(s.mask)}`,
        ` default-router ${ip(s.gateway)}`,
        "!",
      );
    }
  }
  lines.push("end");
  return lines;
}
