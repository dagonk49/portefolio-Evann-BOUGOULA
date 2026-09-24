import { describe, expect, it } from "vitest";
import { formatIPv4 } from "@/lib/ipv4";
import { ciscoPreview, computeVlsm, sanitizeVlanName } from "./vlsm";

const fmt = (n: number) => formatIPv4(n);

describe("démonstration VLSM", () => {
  it("découpe 192.168.10.0/24 sans chevauchement", () => {
    const r = computeVlsm("192.168.10.0/24", [
      { name: "Wi-Fi", hosts: 20, vlan: 20 },
      { name: "Lab", hosts: 50, vlan: 10 },
      { name: "Admin", hosts: 10, vlan: 99 },
      { name: "Lien", hosts: 2, vlan: 30 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const rows = r.subnets.map((s) => [s.name, `${fmt(s.network)}/${s.prefix}`, fmt(s.firstHost), fmt(s.lastHost), fmt(s.broadcast)]);
    expect(rows).toEqual([
      ["Lab", "192.168.10.0/26", "192.168.10.1", "192.168.10.62", "192.168.10.63"],
      ["Wi-Fi", "192.168.10.64/27", "192.168.10.65", "192.168.10.94", "192.168.10.95"],
      ["Admin", "192.168.10.96/28", "192.168.10.97", "192.168.10.110", "192.168.10.111"],
      ["Lien", "192.168.10.112/30", "192.168.10.113", "192.168.10.114", "192.168.10.115"],
    ]);
    expect(fmt(r.subnets[0]!.mask)).toBe("255.255.255.192");
    expect(r.subnets[0]!.capacity).toBe(62);
    expect(r.used).toBe(116);
    // Aucun chevauchement
    const ranges = r.subnets.map((s) => [s.network, s.broadcast] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ranges.length; i++) expect(ranges[i]![0]).toBeGreaterThan(ranges[i - 1]![1]);
  });

  it("frontières exactes : 62 hôtes tiennent dans un /26, 63 non", () => {
    const ok = computeVlsm("10.0.0.0/26", [{ name: "A", hosts: 62, vlan: 10 }]);
    expect(ok.ok).toBe(true);
    const ko = computeVlsm("10.0.0.0/26", [{ name: "A", hosts: 63, vlan: 10 }]);
    expect(ko.ok).toBe(false);
  });

  it("signale le manque de place et les entrées invalides", () => {
    expect(computeVlsm("192.168.1.0/28", [{ name: "A", hosts: 10, vlan: 10 }, { name: "B", hosts: 10, vlan: 20 }]).ok).toBe(false);
    expect(computeVlsm("192.168.1.0", [{ name: "A", hosts: 10, vlan: 10 }]).ok).toBe(false);
    expect(computeVlsm("192.168.1.0/24", [{ name: "A", hosts: 0, vlan: 10 }]).ok).toBe(false);
    expect(computeVlsm("192.168.1.0/24", [{ name: "A", hosts: 5, vlan: 10 }, { name: "B", hosts: 5, vlan: 10 }]).ok).toBe(false);
    expect(computeVlsm("192.168.1.0/24", []).ok).toBe(false);
  });

  it("normalise une plage parente non alignée", () => {
    const r = computeVlsm("192.168.1.77/24", [{ name: "A", hosts: 10, vlan: 10 }]);
    expect(r.ok && fmt(r.parent.network)).toBe("192.168.1.0");
    expect(r.ok && r.normalizedFrom).toBe("192.168.1.77/24");
  });

  it("génère un aperçu IOS cohérent", () => {
    const r = computeVlsm("192.168.10.0/24", [{ name: "Lab é", hosts: 50, vlan: 10 }]);
    if (!r.ok) throw new Error(r.error);
    const cfg = ciscoPreview(r.subnets, { routerInterface: "GigabitEthernet0/0", dhcp: true }).join("\n");
    expect(cfg).toContain("vlan 10\n name LAB_E");
    expect(cfg).toContain("interface GigabitEthernet0/0.10\n description LAB_E\n encapsulation dot1Q 10\n ip address 192.168.10.1 255.255.255.192");
    expect(cfg).toContain("ip dhcp pool LAB_E\n network 192.168.10.0 255.255.255.192\n default-router 192.168.10.1");
    expect(sanitizeVlanName("  ")).toBe("RESEAU");
  });
});
