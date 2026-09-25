/**
 * Schémas techniques des fiches E5, dessinés en SVG monochrome.
 *
 * Ce sont des schémas de principe : ils ne représentent que des éléments
 * documentés, avec des libellés génériques quand le détail (équipements,
 * numéros de VLAN, adressage) n'est pas publié. Les couleurs passent par des
 * classes CSS (`sch-*`), ce qui permet une impression noir sur blanc.
 */
import type { SchemaId } from "@/data/types";

type Side = "l" | "r" | "t" | "b";

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string[];
  /** Nœud mis en avant (trait plus clair). */
  strong?: boolean;
}

interface Group {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

interface Edge {
  from: [string, Side];
  to: [string, Side];
  label?: string;
  dashed?: boolean;
  /** Flux bloqué (isolement) : croix au milieu. */
  blocked?: boolean;
  /** Décalage de l'étiquette par rapport au milieu du tracé. */
  labelDy?: number;
  labelDx?: number;
}

interface Diagram {
  width: number;
  height: number;
  title: string;
  desc: string;
  groups?: Group[];
  nodes: Node[];
  edges: Edge[];
}

function anchor(n: Node, side: Side): [number, number] {
  switch (side) {
    case "l":
      return [n.x, n.y + n.h / 2];
    case "r":
      return [n.x + n.w, n.y + n.h / 2];
    case "t":
      return [n.x + n.w / 2, n.y];
    case "b":
      return [n.x + n.w / 2, n.y + n.h];
  }
}

function edgePath(a: [number, number], sa: Side, b: [number, number], sb: Side): { d: string; mid: [number, number] } {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const horizontal = (s: Side) => s === "l" || s === "r";
  // Même côté (ex. bas → bas) : détour de 36 unités vers l'extérieur.
  if (sa === sb && !horizontal(sa)) {
    const y = sa === "b" ? Math.max(y1, y2) + 36 : Math.min(y1, y2) - 36;
    return { d: `M${x1} ${y1} V${y} H${x2} V${y2}`, mid: [(x1 + x2) / 2, y] };
  }
  if (horizontal(sa) && horizontal(sb)) {
    if (y1 === y2) return { d: `M${x1} ${y1} H${x2}`, mid: [(x1 + x2) / 2, y1] };
    const mx = Math.round((x1 + x2) / 2);
    return { d: `M${x1} ${y1} H${mx} V${y2} H${x2}`, mid: [mx, (y1 + y2) / 2] };
  }
  if (!horizontal(sa) && !horizontal(sb)) {
    if (x1 === x2) return { d: `M${x1} ${y1} V${y2}`, mid: [x1, (y1 + y2) / 2] };
    const my = Math.round((y1 + y2) / 2);
    return { d: `M${x1} ${y1} V${my} H${x2} V${y2}`, mid: [(x1 + x2) / 2, my] };
  }
  if (horizontal(sa)) return { d: `M${x1} ${y1} H${x2} V${y2}`, mid: [x2, y1] };
  return { d: `M${x1} ${y1} V${y2} H${x2}`, mid: [x1, y2] };
}

function DiagramSvg({ diagram, id }: { diagram: Diagram; id: string }) {
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const marker = `${id}-arrow`;
  return (
    <svg
      className="schema__svg"
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      focusable="false"
    >
      <title id={titleId}>{diagram.title}</title>
      <desc id={descId}>{diagram.desc}</desc>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="sch-arrow" />
        </marker>
      </defs>
      {diagram.groups?.map((g) => (
        <g key={g.label}>
          <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="6" className="sch-group" />
          <text x={g.x + 12} y={g.y + 18} className="sch-group-label">
            {g.label}
          </text>
        </g>
      ))}
      {diagram.edges.map((e, i) => {
        const a = byId.get(e.from[0]);
        const b = byId.get(e.to[0]);
        if (!a || !b) return null;
        const { d, mid } = edgePath(anchor(a, e.from[1]), e.from[1], anchor(b, e.to[1]), e.to[1]);
        return (
          <g key={i}>
            <path d={d} className={`sch-edge${e.dashed ? " sch-edge--dashed" : ""}`} markerEnd={e.blocked ? undefined : `url(#${marker})`} />
            {e.blocked ? (
              <g transform={`translate(${mid[0]} ${mid[1]})`} className="sch-block">
                <circle r="9" />
                <path d="M-4 -4 L4 4 M4 -4 L-4 4" />
              </g>
            ) : null}
            {e.label ? (
              <text
                x={mid[0] + (e.labelDx ?? 0)}
                y={mid[1] + (e.labelDy ?? -7)}
                textAnchor={e.labelDx ? "start" : "middle"}
                className="sch-edge-label"
              >
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {diagram.nodes.map((n) => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="4" className={`sch-node${n.strong ? " sch-node--strong" : ""}`} />
          <text x={n.x + n.w / 2} y={n.y + (n.sub?.length ? 22 : n.h / 2 + 5)} textAnchor="middle" className="sch-label">
            {n.label}
          </text>
          {n.sub?.map((line, i) => (
            <text key={i} x={n.x + n.w / 2} y={n.y + 40 + i * 15} textAnchor="middle" className="sch-sub">
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

const DIAGRAMS: Record<SchemaId, Diagram> = {
  ad: {
    width: 720,
    height: 300,
    title: "Schéma de principe du support N1 à l'EFS",
    desc: "Une demande ou un incident de l'utilisateur arrive au support N1, qui intervient sur l'Active Directory (comptes et accès), sur le parc régional (masterisation, déploiement, maintenance) et participe aux processus du programme national AMI, puis revient vers l'utilisateur pour la résolution.",
    nodes: [
      { id: "user", x: 16, y: 112, w: 150, h: 76, label: "Utilisateur", sub: ["demande ou incident"] },
      { id: "n1", x: 240, y: 112, w: 170, h: 76, label: "Support N1", sub: ["prise en charge", "et traitement"], strong: true },
      { id: "ad", x: 500, y: 16, w: 204, h: 76, label: "Active Directory", sub: ["comptes et accès", "conformité de l'annuaire"] },
      { id: "parc", x: 500, y: 112, w: 204, h: 76, label: "Parc régional", sub: ["masterisation, déploiement", "maintenance (MCO)"] },
      { id: "ami", x: 500, y: 208, w: 204, h: 76, label: "Programme national AMI", sub: ["déploiement des processus"] },
    ],
    edges: [
      { from: ["user", "r"], to: ["n1", "l"], label: "demande" },
      { from: ["n1", "r"], to: ["ad", "l"] },
      { from: ["n1", "r"], to: ["parc", "l"] },
      { from: ["n1", "r"], to: ["ami", "l"] },
      { from: ["n1", "b"], to: ["user", "b"], label: "résolution, clôture", dashed: true, labelDy: 16 },
    ],
  },
  netforge: {
    width: 740,
    height: 270,
    title: "Chaîne fonctionnelle de NetForge",
    desc: "Une plage d'adresses parente est découpée en sous-réseaux VLSM, vérifiés par des tests unitaires d'adressage ; les attributions sont suivies dans un IPAM léger, qui alimente la génération des configurations Cisco IOS et des visualisations réutilisables dans un dossier technique.",
    nodes: [
      { id: "range", x: 12, y: 30, w: 156, h: 88, label: "Plage parente", sub: ["ex. 192.168.10.0/24", "besoins en hôtes"] },
      { id: "vlsm", x: 198, y: 30, w: 156, h: 88, label: "Découpage VLSM", sub: ["masques, plages utiles", "broadcast, passerelles"], strong: true },
      { id: "ipam", x: 384, y: 30, w: 156, h: 88, label: "IPAM léger", sub: ["blocs et attributions", "sans chevauchement"] },
      { id: "cisco", x: 570, y: 30, w: 156, h: 88, label: "Config. Cisco IOS", sub: ["VLAN, trunks 802.1Q", "inter-VLAN, ACL", "DHCP, OSPF"] },
      { id: "tests", x: 198, y: 186, w: 156, h: 64, label: "Tests unitaires", sub: ["calculs d'adressage"] },
      { id: "viz", x: 384, y: 186, w: 156, h: 64, label: "Visualisation", sub: ["dossiers techniques"] },
    ],
    edges: [
      { from: ["range", "r"], to: ["vlsm", "l"] },
      { from: ["vlsm", "r"], to: ["ipam", "l"] },
      { from: ["ipam", "r"], to: ["cisco", "l"] },
      { from: ["tests", "t"], to: ["vlsm", "b"], label: "vérifient", dashed: true, labelDx: 8, labelDy: 4 },
      { from: ["ipam", "b"], to: ["viz", "t"] },
    ],
  },
  ventoy: {
    width: 720,
    height: 250,
    title: "Schéma de principe du support d'installation Ventoy",
    desc: "Une clé USB Ventoy contient les images d'installation ; au démarrage du portable, le menu Ventoy permet de choisir l'image ; l'installation de Windows se déroule de façon automatisée et personnalisée selon les besoins du client, jusqu'au poste remis à l'utilisateur.",
    nodes: [
      { id: "usb", x: 16, y: 40, w: 150, h: 76, label: "Clé USB Ventoy", sub: ["images d'installation"] },
      { id: "menu", x: 200, y: 40, w: 150, h: 76, label: "Menu Ventoy", sub: ["choix de l'image", "au démarrage"] },
      { id: "install", x: 384, y: 40, w: 150, h: 76, label: "Installation", sub: ["Windows automatisée"], strong: true },
      { id: "poste", x: 568, y: 40, w: 136, h: 76, label: "Poste prêt", sub: ["remis à l'utilisateur"] },
      { id: "besoins", x: 384, y: 160, w: 150, h: 70, label: "Besoins du client", sub: ["personnalisation"] },
    ],
    edges: [
      { from: ["usb", "r"], to: ["menu", "l"] },
      { from: ["menu", "r"], to: ["install", "l"] },
      { from: ["install", "r"], to: ["poste", "l"] },
      { from: ["besoins", "t"], to: ["install", "b"], dashed: true },
    ],
  },
  proxmox: {
    width: 720,
    height: 290,
    title: "Schéma de principe de l'hyperviseur Proxmox VE sous Debian et du script de maintenance",
    desc: "À gauche, l'empilement : un serveur physique, Debian, Proxmox VE, puis des machines virtuelles. À droite, un poste Windows sur lequel le script de désinstallation retire les applications inutiles.",
    groups: [
      { x: 8, y: 8, w: 400, h: 274, label: "Virtualisation" },
      { x: 432, y: 8, w: 280, h: 274, label: "Maintenance des postes" },
    ],
    nodes: [
      { id: "vm1", x: 28, y: 36, w: 110, h: 44, label: "VM" },
      { id: "vm2", x: 153, y: 36, w: 110, h: 44, label: "VM" },
      { id: "vm3", x: 278, y: 36, w: 110, h: 44, label: "VM" },
      { id: "pve", x: 28, y: 104, w: 360, h: 48, label: "Proxmox VE — hyperviseur", strong: true },
      { id: "debian", x: 28, y: 164, w: 360, h: 44, label: "Debian" },
      { id: "hw", x: 28, y: 220, w: 360, h: 44, label: "Serveur physique" },
      { id: "win", x: 460, y: 36, w: 224, h: 56, label: "Poste Windows" },
      { id: "script", x: 460, y: 120, w: 224, h: 56, label: "Script de désinstallation", strong: true },
      { id: "clean", x: 460, y: 204, w: 224, h: 60, label: "Applications inutiles", sub: ["désinstallées"] },
    ],
    edges: [
      { from: ["win", "b"], to: ["script", "t"] },
      { from: ["script", "b"], to: ["clean", "t"] },
    ],
  },
  unifi: {
    width: 720,
    height: 300,
    title: "Schéma de principe du Wi-Fi UniFi avec réseaux invités et privé",
    desc: "Internet est relié au réseau du client, puis au point d'accès UniFi qui diffuse deux réseaux séparés par VLAN : le réseau privé, qui accède aux ressources internes et à Internet, et le réseau invités, qui accède seulement à Internet ; le passage du réseau invités vers les ressources internes est bloqué.",
    nodes: [
      { id: "internet", x: 12, y: 120, w: 110, h: 60, label: "Internet" },
      { id: "lan", x: 156, y: 112, w: 150, h: 76, label: "Réseau du client", sub: ["passerelle, commutation"] },
      { id: "ap", x: 340, y: 112, w: 130, h: 76, label: "Point d'accès", sub: ["Ubiquiti UniFi"], strong: true },
      { id: "prive", x: 510, y: 14, w: 196, h: 66, label: "Réseau privé", sub: ["VLAN privé"] },
      { id: "interne", x: 510, y: 122, w: 196, h: 56, label: "Ressources internes" },
      { id: "invites", x: 510, y: 220, w: 196, h: 66, label: "Réseau invités", sub: ["VLAN invités : Internet seul"] },
    ],
    edges: [
      { from: ["internet", "r"], to: ["lan", "l"] },
      { from: ["lan", "r"], to: ["ap", "l"] },
      { from: ["ap", "r"], to: ["prive", "l"] },
      { from: ["ap", "r"], to: ["invites", "l"] },
      { from: ["prive", "b"], to: ["interne", "t"] },
      { from: ["invites", "t"], to: ["interne", "b"], blocked: true, label: "isolé", labelDx: 16, labelDy: 4 },
    ],
  },
  homelab: {
    width: 760,
    height: 360,
    title: "Vue logique du HomeLab",
    desc: "Depuis Internet, Nginx Proxy Manager publie les services web et WireGuard fournit l'accès VPN. L'hyperviseur Proxmox VE héberge la VM principale Docker (automatisations, NetForge, portfolio, Jellyfin, staging privé) et des VM de test (Windows Server 2022 et 2025, Debian, Windows 11). Le réseau du lab est segmenté par VLAN.",
    groups: [{ x: 270, y: 8, w: 482, h: 344, label: "Proxmox VE — hyperviseur" }],
    nodes: [
      { id: "internet", x: 12, y: 150, w: 96, h: 60, label: "Internet" },
      { id: "npm", x: 150, y: 50, w: 100, h: 88, label: "Reverse proxy", sub: ["Nginx Proxy", "Manager"] },
      { id: "wg", x: 150, y: 228, w: 100, h: 76, label: "Accès VPN", sub: ["WireGuard"] },
      {
        id: "docker",
        x: 290,
        y: 36,
        w: 236,
        h: 150,
        label: "VM principale — Docker",
        sub: ["automatisations (bibliothèque)", "NetForge · ce portfolio", "Jellyfin (multimédia)", "staging privé", "plus de 50 % des ressources"],
        strong: true,
      },
      { id: "tests", x: 542, y: 36, w: 194, h: 150, label: "VM de test", sub: ["Windows Server 2022", "Windows Server 2025", "Debian", "Windows 11"] },
      { id: "vlan", x: 290, y: 232, w: 446, h: 96, label: "Réseau du lab", sub: ["segmenté par VLAN"] },
    ],
    edges: [
      { from: ["internet", "r"], to: ["npm", "l"] },
      { from: ["internet", "r"], to: ["wg", "l"] },
      { from: ["npm", "r"], to: ["docker", "l"] },
      { from: ["wg", "r"], to: ["vlan", "l"] },
    ],
  },
};

export function Schema({ id, instance }: { id: SchemaId; instance: string }) {
  return <DiagramSvg diagram={DIAGRAMS[id]} id={`schema-${instance}`} />;
}

export const SCHEMA_IDS = Object.keys(DIAGRAMS) as SchemaId[];
