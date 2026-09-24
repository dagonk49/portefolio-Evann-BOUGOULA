/**
 * Scénario pédagogique « Remettre le poste du lab en ligne ».
 *
 * Simulation 100 % locale : aucune connexion à une infrastructure réelle.
 *
 * Topologie :
 *   PC-LAB (bureau) ──prise murale B-02──▶ PP-02 (panneau de brassage, baie)
 *   Borne Wi-Fi ──prise murale B-01──▶ PP-01 ══ Gi0/1 (VLAN 20, préconfiguré)
 *   R1 Gi0/0 ══ Gi0/8 (trunk 802.1Q 10,20, préconfiguré)
 *   SRV-LAB eth0 : à brancher
 *
 *   VLAN 10 « LAB »  : 192.168.10.0/24 — R1 .1, SRV-LAB .10, PC-LAB .42 (cible)
 *   VLAN 20 « WIFI » : 192.168.20.0/24 — R1 .1, borne .2
 *
 * Préconfiguré et verrouillé : R1 (sous-interfaces Gi0/0.10 et Gi0/0.20),
 * le trunk Gi0/8, la borne Wi-Fi sur Gi0/1, l'adressage de SRV-LAB.
 * Aucun serveur DHCP n'existe dans le lab.
 */
import { parseIPv4, type IPv4 } from "@/lib/ipv4";

export type DeviceId = "patch-panel" | "sw-lab" | "srv-lab" | "r1" | "pc-lab" | "ap-wifi";

export type SwitchPortId =
  | "sw-gi0/1"
  | "sw-gi0/2"
  | "sw-gi0/3"
  | "sw-gi0/4"
  | "sw-gi0/5"
  | "sw-gi0/6"
  | "sw-gi0/7"
  | "sw-gi0/8"
  | "sw-gi0/9"
  | "sw-gi0/10";

export type PatchPortId = "pp-01" | "pp-02" | "pp-03" | "pp-04";

export type NicId = "pc-eth0" | "srv-eth0" | "ap-eth0" | "r1-gi0/0";

export type EndpointId = PatchPortId | SwitchPortId | "sw-console" | NicId;

export type EndpointRole = "patch" | "switchport" | "console" | "nic";

export interface EndpointDef {
  id: EndpointId;
  device: DeviceId;
  label: string;
  connector: "rj45" | "sfp";
  role: EndpointRole;
  /** Accessible dans l'interface de brassage de la baie. */
  selectable: boolean;
  /** Description lisible (étiquette du port). */
  note: string;
  /** Liaison murale derrière un port de brassage. */
  wallRun?: NicId;
}

export const DEVICES: Record<DeviceId, { name: string; role: string }> = {
  "pc-lab": { name: "PC-LAB", role: "Poste du lab, au bureau" },
  "patch-panel": { name: "Panneau de brassage", role: "Arrivée des prises murales" },
  "sw-lab": { name: "SW-LAB", role: "Switch d'accès du lab" },
  "srv-lab": { name: "SRV-LAB", role: "Serveur du lab (192.168.10.10/24, préconfiguré)" },
  r1: { name: "R1", role: "Routeur inter-VLAN (préconfiguré)" },
  "ap-wifi": { name: "Borne Wi-Fi", role: "Borne du VLAN 20 (préconfigurée)" },
};

const sw = (n: number, note: string, connector: "rj45" | "sfp" = "rj45"): EndpointDef => ({
  id: `sw-gi0/${n}` as SwitchPortId,
  device: "sw-lab",
  label: `Gi0/${n}`,
  connector,
  role: "switchport",
  selectable: true,
  note,
});

export const ENDPOINTS: EndpointDef[] = [
  {
    id: "pp-01",
    device: "patch-panel",
    label: "PP-01",
    connector: "rj45",
    role: "patch",
    selectable: true,
    note: "Prise B-01 — borne Wi-Fi",
    wallRun: "ap-eth0",
  },
  {
    id: "pp-02",
    device: "patch-panel",
    label: "PP-02",
    connector: "rj45",
    role: "patch",
    selectable: true,
    note: "Prise B-02 — bureau, PC-LAB",
    wallRun: "pc-eth0",
  },
  {
    id: "pp-03",
    device: "patch-panel",
    label: "PP-03",
    connector: "rj45",
    role: "patch",
    selectable: true,
    note: "Prise B-03 — bureau, libre",
  },
  {
    id: "pp-04",
    device: "patch-panel",
    label: "PP-04",
    connector: "rj45",
    role: "patch",
    selectable: true,
    note: "Prise B-04 — atelier, non raccordée",
  },
  sw(1, "Borne Wi-Fi (préconfiguré)"),
  sw(2, "Port d'accès"),
  sw(3, "Port d'accès"),
  sw(4, "Port d'accès"),
  sw(5, "Port d'accès"),
  sw(6, "Port d'accès"),
  sw(7, "Port d'accès"),
  sw(8, "Uplink vers R1 (préconfiguré)"),
  sw(9, "Port SFP — module fibre requis", "sfp"),
  sw(10, "Port SFP — module fibre requis", "sfp"),
  {
    id: "sw-console",
    device: "sw-lab",
    label: "Console",
    connector: "rj45",
    role: "console",
    selectable: true,
    note: "Port console (administration série, pas Ethernet)",
  },
  {
    id: "srv-eth0",
    device: "srv-lab",
    label: "eth0",
    connector: "rj45",
    role: "nic",
    selectable: true,
    note: "Carte réseau du serveur",
  },
  {
    id: "pc-eth0",
    device: "pc-lab",
    label: "Ethernet",
    connector: "rj45",
    role: "nic",
    selectable: false,
    note: "Carte réseau du poste (reliée à la prise B-02)",
  },
  {
    id: "ap-eth0",
    device: "ap-wifi",
    label: "eth0",
    connector: "rj45",
    role: "nic",
    selectable: false,
    note: "Borne Wi-Fi (reliée à la prise B-01)",
  },
  {
    id: "r1-gi0/0",
    device: "r1",
    label: "Gi0/0",
    connector: "rj45",
    role: "nic",
    selectable: false,
    note: "Interface trunk du routeur",
  },
];

export const ENDPOINT_BY_ID = Object.fromEntries(ENDPOINTS.map((e) => [e.id, e])) as Record<
  EndpointId,
  EndpointDef
>;

export interface Cable {
  a: EndpointId;
  b: EndpointId;
}

/** Câbles préinstallés, impossibles à débrancher dans ce scénario. */
export const FIXED_CABLES: Cable[] = [
  { a: "pp-01", b: "sw-gi0/1" },
  { a: "r1-gi0/0", b: "sw-gi0/8" },
];

export interface VlanDef {
  id: number;
  name: string;
}

export const VLANS: VlanDef[] = [
  { id: 1, name: "default" },
  { id: 10, name: "LAB" },
  { id: 20, name: "WIFI" },
];

export type EditablePortId = "sw-gi0/2" | "sw-gi0/3" | "sw-gi0/4" | "sw-gi0/5" | "sw-gi0/6" | "sw-gi0/7";

export const EDITABLE_PORTS: EditablePortId[] = [
  "sw-gi0/2",
  "sw-gi0/3",
  "sw-gi0/4",
  "sw-gi0/5",
  "sw-gi0/6",
  "sw-gi0/7",
];

export interface AccessPortConfig {
  vlan: number;
  shutdown: boolean;
}

/** Configuration verrouillée des autres ports. */
export const LOCKED_PORTS: Record<Exclude<SwitchPortId, EditablePortId>, { mode: "access" | "trunk"; vlan: number; allowed?: number[]; description?: string }> = {
  "sw-gi0/1": { mode: "access", vlan: 20, description: "AP-WIFI" },
  "sw-gi0/8": { mode: "trunk", vlan: 1, allowed: [10, 20], description: "UPLINK-R1" },
  "sw-gi0/9": { mode: "access", vlan: 1 },
  "sw-gi0/10": { mode: "access", vlan: 1 },
};

export type HostNode = "pc-lab" | "srv-lab" | "ap-wifi";
export type L3Node = HostNode | "r1";

export interface StaticInterface {
  id: string;
  node: L3Node;
  nic: NicId;
  /** Sous-interface 802.1Q (routeur uniquement). */
  vlan?: number;
  ip: IPv4;
  prefix: number;
  gateway: IPv4 | null;
}

const ip = (s: string): IPv4 => {
  const v = parseIPv4(s);
  if (v === null) throw new Error(`IP invalide dans le scénario : ${s}`);
  return v;
};

export const SCENARIO_IPS = {
  labNetwork: ip("192.168.10.0"),
  labPrefix: 24,
  gateway: ip("192.168.10.1"),
  server: ip("192.168.10.10"),
  pcTarget: ip("192.168.10.42"),
  wifiGateway: ip("192.168.20.1"),
  accessPoint: ip("192.168.20.2"),
  /** Adresse APIPA que prend le poste en DHCP sans serveur DHCP. */
  apipa: ip("169.254.23.7"),
} as const;

/** Interfaces préconfigurées (hors poste PC-LAB, configuré par le joueur). */
export const STATIC_INTERFACES: StaticInterface[] = [
  { id: "srv", node: "srv-lab", nic: "srv-eth0", ip: SCENARIO_IPS.server, prefix: 24, gateway: SCENARIO_IPS.gateway },
  { id: "ap", node: "ap-wifi", nic: "ap-eth0", ip: SCENARIO_IPS.accessPoint, prefix: 24, gateway: SCENARIO_IPS.wifiGateway },
  { id: "r1.10", node: "r1", nic: "r1-gi0/0", vlan: 10, ip: SCENARIO_IPS.gateway, prefix: 24, gateway: null },
  { id: "r1.20", node: "r1", nic: "r1-gi0/0", vlan: 20, ip: SCENARIO_IPS.wifiGateway, prefix: 24, gateway: null },
];

/** TTL initial par système (valeurs usuelles : Windows 128, Linux 64, Cisco 255). */
export const INITIAL_TTL: Record<L3Node, number> = {
  "pc-lab": 128,
  "srv-lab": 64,
  "ap-wifi": 64,
  r1: 255,
};

export const NODE_NAMES: Record<L3Node, string> = {
  "pc-lab": "PC-LAB",
  "srv-lab": "SRV-LAB",
  "ap-wifi": "la borne Wi-Fi",
  r1: "R1",
};
