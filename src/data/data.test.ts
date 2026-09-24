import { describe, expect, it } from "vitest";
import {
  anomalies,
  certifications,
  contentIndex,
  education,
  experiences,
  projects,
  refExists,
  skillById,
  skills,
} from "./index";

describe("intégrité des données", () => {
  it("conserve les 26 compétences du profil avec leurs intitulés d'origine", () => {
    expect(skills).toHaveLength(26);
    expect(new Set(skills.map((s) => s.id)).size).toBe(26);
    const sources = skills.map((s) => s.sourceLabel);
    expect(sources).toEqual([
      "Développement front-end",
      "Applications web",
      "Serveurs",
      "Gestion de la maintenance",
      "Développement web back-end",
      "Certification de secouriste",
      "Support technique",
      "Active Directory",
      "Ubiquiti UniFi",
      "Proxmox",
      "Cisco IOS",
      "Formation sur le terrain",
      "Apprentissage en milieu de travail",
      "Formation pratique",
      "Techniciens de terrain",
      "Maintenance technique",
      "Virtual Private Network (VPN)",
      "Network Address Translation (NAT)",
      "VLAN",
      "Computer Networking",
      "Ubiquiti",
      "Internet Protocol Suite (TCP/IP)",
      "Hyper-V",
      "Docker Products",
      "Windows Server",
      "Debian",
    ]);
    expect(skillById["computer-networking"].label).toBe("Réseaux informatiques");
    expect(skillById.docker.label).toBe("Docker");
  });

  it("garde les cinq expériences, dont trois stages NET4BUSINESS distincts", () => {
    expect(experiences).toHaveLength(5);
    expect(experiences.filter((e) => e.organizationId === "net4business")).toHaveLength(3);
    const moizan = experiences.find((e) => e.id === "moizan-2024");
    expect(moizan?.missions).toEqual([]);
    const efs = experiences.find((e) => e.id === "efs-2026");
    expect(JSON.stringify(efs?.missions)).not.toMatch(/N2/);
  });

  it("n'attribue pas le script de 2025 à PowerShell", () => {
    const s2025 = experiences.find((e) => e.id === "net4business-2025");
    expect(JSON.stringify(s2025?.missions)).not.toMatch(/PowerShell/i);
  });

  it("le BTS reste en cours, le Bac Pro est obtenu", () => {
    expect(education.find((e) => e.id === "bts-sio-sisr")?.status.kind).toBe("en-cours");
    expect(education.find((e) => e.id === "bac-pro-ciel")?.status.kind).toBe("obtenu");
    expect(certifications).toHaveLength(3);
  });

  it("toutes les références pointent vers un contenu existant", () => {
    for (const s of skills) for (const c of s.contexts) expect(refExists(c.ref), `${s.id} → ${JSON.stringify(c.ref)}`).toBe(true);
    for (const a of anomalies) expect(refExists(a.target), a.id).toBe(true);
    for (const e of [...experiences, ...education, ...projects]) {
      for (const id of e.skills) expect(skillById[id], `${e.id} → ${id}`).toBeDefined();
    }
  });

  it("les identifiants d'anomalies sont uniques et bien formés", () => {
    expect(new Set(anomalies.map((a) => a.id)).size).toBe(anomalies.length);
    for (const a of anomalies) expect(a.id).toMatch(/^evann\.[a-z]+(\.[a-z0-9-]+)+$/);
  });

  it("NetForge n'a ni lien ni stack inventés", () => {
    const nf = projects.find((p) => p.id === "netforge");
    expect(nf?.links).toEqual([]);
    expect(nf?.since).toEqual({ year: 2026, month: 5 });
    expect(nf?.pillars).toHaveLength(4);
  });

  it("l'index couvre tout le parcours", () => {
    const idx = contentIndex();
    expect(idx.filter((c) => c.group === "Expériences")).toHaveLength(5);
    expect(idx.filter((c) => c.group === "Formations")).toHaveLength(2);
    expect(idx.some((c) => c.ref.type === "contact")).toBe(true);
  });
});
