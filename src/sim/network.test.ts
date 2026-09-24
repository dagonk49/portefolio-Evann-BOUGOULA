import { describe, expect, it } from "vitest";
import { parseIPv4 } from "@/lib/ipv4";
import {
  canPlug,
  computeNetwork,
  initialLabState,
  linkStatus,
  plug,
  unplug,
  validatePcConfig,
  type LabState,
} from "./network";
import { ipconfig, ping, runDiagnostic, labOnline } from "./diagnostics";
import { currentStep, initialMissionFlags, stepCompletion } from "./mission";
import { runPcCommand, runSwitchCommand } from "./consoles";

function configure(state: LabState, ip: string, mask = "/24", gateway = "192.168.10.1"): LabState {
  const v = validatePcConfig({ ip, mask, gateway });
  if (!v.ok) throw new Error(v.errors.map((e) => e.message).join(" / "));
  return { ...state, pc: v.config };
}

function setVlan(state: LabState, port: keyof LabState["ports"], vlan: number, shutdown = false): LabState {
  return { ...state, ports: { ...state.ports, [port]: { vlan, shutdown } } };
}

/** Lab correctement câblé et configuré. */
function solved(): LabState {
  let s = initialLabState();
  s = plug(s, "pp-02", "sw-gi0/2");
  s = plug(s, "srv-eth0", "sw-gi0/3");
  s = setVlan(s, "sw-gi0/2", 10);
  s = setVlan(s, "sw-gi0/3", 10);
  return configure(s, "192.168.10.42");
}

describe("couche physique", () => {
  it("le poste est déconnecté au départ", () => {
    const s = initialLabState();
    expect(linkStatus(s, "pc-eth0")).toMatchObject({ up: false, reason: "no-cable" });
    expect(ipconfig(s).join("\n")).toContain("Média déconnecté");
  });

  it("brancher PP-02 sur un port d'accès actif monte la liaison du poste", () => {
    const s = plug(initialLabState(), "pp-02", "sw-gi0/2");
    expect(linkStatus(s, "pc-eth0")).toMatchObject({ up: true, peer: "sw-gi0/2" });
    expect(linkStatus(s, "sw-gi0/2")).toMatchObject({ up: true, peer: "pc-eth0" });
  });

  it("la mauvaise prise de brassage ne mène à aucun équipement", () => {
    const s = plug(initialLabState(), "pp-03", "sw-gi0/2");
    expect(linkStatus(s, "pc-eth0").up).toBe(false);
    expect(linkStatus(s, "sw-gi0/2")).toMatchObject({ up: false, reason: "dead-end" });
  });

  it("un port désactivé (Gi0/5) n'établit pas de liaison", () => {
    const s = plug(initialLabState(), "pp-02", "sw-gi0/5");
    expect(linkStatus(s, "pc-eth0")).toMatchObject({ up: false, reason: "shutdown-peer" });
    const enabled = setVlan(s, "sw-gi0/5", 1, false);
    expect(linkStatus(enabled, "pc-eth0").up).toBe(true);
  });

  it("refuse les cages SFP, les ports occupés, les boucles et les doublons", () => {
    const s = initialLabState();
    expect(canPlug(s, "pp-02", "sw-gi0/9")).toMatchObject({ ok: false });
    expect(canPlug(s, "pp-02", "sw-gi0/1")).toMatchObject({ ok: false }); // occupé (borne)
    expect(canPlug(s, "pp-01", "sw-gi0/2")).toMatchObject({ ok: false }); // PP-01 préconfiguré
    expect(canPlug(s, "sw-gi0/2", "sw-gi0/3")).toMatchObject({ ok: false }); // boucle
    expect(canPlug(s, "pp-02", "pp-02")).toMatchObject({ ok: false });
    const once = plug(s, "pp-02", "sw-gi0/2");
    expect(canPlug(once, "pp-02", "sw-gi0/4")).toMatchObject({ ok: false });
    expect(plug(once, "pp-02", "sw-gi0/4")).toBe(once);
  });

  it("le port console accepte le câble mais pas de liaison Ethernet", () => {
    const s = plug(initialLabState(), "pp-02", "sw-console");
    expect(linkStatus(s, "pc-eth0")).toMatchObject({ up: false, reason: "console" });
  });

  it("débrancher libère le port", () => {
    const s = unplug(plug(initialLabState(), "pp-02", "sw-gi0/2"), "sw-gi0/2");
    expect(s.cables).toHaveLength(0);
    expect(linkStatus(s, "pc-eth0").up).toBe(false);
  });
});

describe("validation IPv4 du poste", () => {
  it("accepte masque CIDR et décimal", () => {
    expect(validatePcConfig({ ip: "192.168.10.42", mask: "24", gateway: "" }).ok).toBe(true);
    expect(validatePcConfig({ ip: "192.168.10.42", mask: "255.255.255.0", gateway: "192.168.10.1" }).ok).toBe(true);
  });

  it("refuse l'adresse réseau et le broadcast", () => {
    const net = validatePcConfig({ ip: "192.168.10.0", mask: "/24", gateway: "" });
    const bc = validatePcConfig({ ip: "192.168.10.255", mask: "/24", gateway: "" });
    expect(net.ok).toBe(false);
    expect(bc.ok).toBe(false);
    if (!net.ok) expect(net.errors[0]?.message).toMatch(/adresse du réseau/);
    if (!bc.ok) expect(bc.errors[0]?.message).toMatch(/broadcast/);
    // .255 est valide dans un /23
    expect(validatePcConfig({ ip: "192.168.10.255", mask: "/23", gateway: "" }).ok).toBe(true);
  });

  it("refuse un masque non contigu, une IP invalide et une passerelle hors réseau", () => {
    expect(validatePcConfig({ ip: "192.168.10.42", mask: "255.0.255.0", gateway: "" }).ok).toBe(false);
    expect(validatePcConfig({ ip: "192.168.10.420", mask: "/24", gateway: "" }).ok).toBe(false);
    expect(validatePcConfig({ ip: "192.168.10.42", mask: "/24", gateway: "192.168.20.1" }).ok).toBe(false);
    expect(validatePcConfig({ ip: "192.168.10.42", mask: "/24", gateway: "192.168.10.42" }).ok).toBe(false);
    expect(validatePcConfig({ ip: "127.0.0.1", mask: "/8", gateway: "" }).ok).toBe(false);
  });
});

describe("couche 2 / couche 3", () => {
  it("scénario résolu : serveur, passerelle et autre VLAN joignables", () => {
    const s = solved();
    expect(ping(s, "192.168.10.10")).toMatchObject({ outcome: "success", replyFrom: "srv-lab" });
    expect(ping(s, "192.168.10.1")).toMatchObject({ outcome: "success", replyFrom: "r1" });
    const remote = ping(s, "192.168.20.2");
    expect(remote.outcome).toBe("success");
    expect(remote.lines.join("\n")).toContain("TTL=63"); // un routeur traversé
    expect(runDiagnostic(s).success).toBe(true);
    expect(labOnline(s)).toEqual({ server: true, gateway: true, remote: true });
  });

  it("un ping dans le même sous-réseau ne dépend pas de la passerelle", () => {
    const noGateway = configure(solved(), "192.168.10.42", "/24", "");
    expect(ping(noGateway, "192.168.10.10").outcome).toBe("success");
    const wrongGateway = configure(solved(), "192.168.10.42", "/24", "192.168.10.254");
    expect(ping(wrongGateway, "192.168.10.10").outcome).toBe("success");
    // …mais l'accès à un autre réseau, lui, en dépend
    expect(ping(noGateway, "192.168.20.2").outcome).toBe("general-failure");
    const viaWrong = ping(wrongGateway, "192.168.20.2");
    expect(viaWrong.outcome).toBe("timeout");
    expect(viaWrong.analysis).toMatch(/192\.168\.10\.254/);
    expect(runDiagnostic(wrongGateway).success).toBe(false);
  });

  it("VLAN différents : pas de remise directe, explication utile", () => {
    let s = solved();
    s = setVlan(s, "sw-gi0/3", 1); // serveur resté en VLAN 1
    const r = ping(s, "192.168.10.10");
    expect(r.outcome).toBe("unreachable");
    expect(r.lines.join("\n")).toContain("Impossible de joindre l'hôte de destination");
    expect(r.analysis).toMatch(/VLAN 10/);
    expect(r.analysis).toMatch(/VLAN 1\b/);
    expect(runDiagnostic(s).success).toBe(false);
  });

  it("poste en VLAN 1 : la passerelle n'est pas joignable", () => {
    let s = solved();
    s = setVlan(s, "sw-gi0/2", 1);
    s = setVlan(s, "sw-gi0/3", 1);
    // poste et serveur partagent le VLAN 1 : le serveur répond quand même
    expect(ping(s, "192.168.10.10").outcome).toBe("success");
    const gw = ping(s, "192.168.20.2");
    expect(gw.outcome).toBe("timeout");
    expect(gw.analysis).toMatch(/n'a aucune interface/);
  });

  it("DHCP sans serveur DHCP : adresse APIPA et échec explicite", () => {
    let s = initialLabState();
    s = plug(s, "pp-02", "sw-gi0/2");
    expect(ipconfig(s).join("\n")).toContain("169.254.23.7");
    const r = ping(s, "192.168.10.10");
    expect(r.outcome).toBe("general-failure");
    expect(r.analysis).toMatch(/APIPA/);
  });

  it("détecte le conflit avec le serveur ou la passerelle", () => {
    for (const ip of ["192.168.10.10", "192.168.10.1"]) {
      const s = configure(solved(), ip, "/24", ip === "192.168.10.1" ? "" : "192.168.10.1");
      const view = computeNetwork(s);
      expect(view.interfaces.find((i) => i.node === "pc-lab")?.duplicate).toBe(true);
      expect(ipconfig(s).join("\n")).toContain("(Dupliqué)");
      expect(ping(s, "192.168.10.10").outcome).toBe("general-failure");
      expect(runDiagnostic(s).checks.find((c) => c.id === "pc-ip")?.ok).toBe(false);
    }
  });

  it("pas de faux conflit si l'adresse dupliquée est dans un autre VLAN", () => {
    let s = configure(solved(), "192.168.10.10");
    s = setVlan(s, "sw-gi0/2", 20);
    const pc = computeNetwork(s).interfaces.find((i) => i.node === "pc-lab");
    expect(pc?.duplicate).toBeFalsy();
  });

  it("masque trop large : la requête arrive mais la réponse ne revient pas", () => {
    const s = configure(solved(), "192.168.11.5", "/16", "");
    const r = ping(s, "192.168.10.10");
    expect(r.outcome).toBe("timeout");
    expect(r.analysis).toMatch(/réponse ne revient pas/);
  });

  it("passerelle pointant vers le serveur : il ne route pas", () => {
    const s = configure(solved(), "192.168.10.42", "/24", "192.168.10.10");
    const r = ping(s, "192.168.20.2");
    expect(r.outcome).toBe("timeout");
    expect(r.analysis).toMatch(/pas un routeur/);
  });

  it("aucun accès Internet simulé", () => {
    const r = ping(solved(), "8.8.8.8");
    expect(r.outcome).toBe("unreachable");
    expect(r.lines[1]).toContain("Réponse de 192.168.10.1");
    expect(r.analysis).toMatch(/isolé/);
  });

  it("câble direct poste ↔ serveur : liaison, mais pas de passerelle", () => {
    let s = initialLabState();
    s = plug(s, "pp-02", "srv-eth0");
    s = configure(s, "192.168.10.42");
    expect(ping(s, "192.168.10.10").outcome).toBe("success");
    expect(ping(s, "192.168.10.1").outcome).not.toBe("success");
  });

  it("refuse les adresses réseau/broadcast comme cible de ping", () => {
    expect(ping(solved(), "192.168.10.255").outcome).toBe("invalid");
    expect(ping(solved(), "pas-une-ip").outcome).toBe("invalid");
    expect(parseIPv4("192.168.10.42")).not.toBeNull();
  });
});

describe("mission et consoles", () => {
  it("les étapes suivent l'état du lab", () => {
    const flags = initialMissionFlags();
    expect(currentStep(initialLabState(), flags)?.id).toBe("inspect");
    const inspected = { ...flags, bayInspected: true };
    expect(currentStep(initialLabState(), inspected)?.id).toBe("cable");
    let s = plug(initialLabState(), "pp-02", "sw-gi0/2");
    s = plug(s, "srv-eth0", "sw-gi0/4");
    expect(currentStep(s, inspected)?.id).toBe("open-pc");
    const opened = { ...inspected, pcOpened: true };
    expect(currentStep(s, opened)?.id).toBe("configure");
    expect(stepCompletion(solved(), opened).configure).toBe(true);
    expect(currentStep(solved(), opened)?.id).toBe("diagnose");
    expect(currentStep(solved(), { ...opened, diagnosticPassed: true })?.id).toBe("stabilize");
    expect(currentStep(solved(), { ...opened, diagnosticPassed: true, stabilized: true })).toBeNull();
  });

  it("terminal du poste : commandes connues, inconnues et diag", () => {
    const s = solved();
    expect(runPcCommand(s, "HELP").lines.join("\n")).toContain("ping");
    expect(runPcCommand(s, "ipconfig").lines.join("\n")).toContain("192.168.10.42");
    expect(runPcCommand(s, "ping   192.168.10.10").note).toMatch(/remise directe/);
    expect(runPcCommand(s, "ping").lines[0]).toMatch(/Utilisation/);
    expect(runPcCommand(s, "rm -rf /").lines[0]).toMatch(/n'est pas reconnu/);
    expect(runPcCommand(s, "diag").diagnostic?.success).toBe(true);
    expect(runPcCommand(s, "cls").clear).toBe(true);
  });

  it("console du switch : abréviations IOS et lecture seule", () => {
    const s = solved();
    const vlan = runSwitchCommand(s, "sh vl br").lines.join("\n");
    expect(vlan).toMatch(/10\s+LAB\s+active\s+Gi0\/2, Gi0\/3/);
    const status = runSwitchCommand(s, "show int status").lines.join("\n");
    expect(status).toMatch(/Gi0\/5\s+disabled/);
    expect(status).toMatch(/Gi0\/8\s+UPLINK-R1\s+connected\s+trunk/);
    expect(runSwitchCommand(s, "conf t").lines[0]).toMatch(/lecture seule/);
    expect(runSwitchCommand(s, "reload").lines[0]).toMatch(/Invalid input/);
  });
});
