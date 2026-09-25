import { describe, expect, it } from "vitest";
import {
  anomalies,
  certifications,
  contentIndex,
  education,
  experiences,
  hobbies,
  profile,
  projects,
  realisationPeriod,
  realisations,
  e5Competences,
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
    expect(certifications.map((c) => c.id)).toEqual(["habilitation-b1v", "cisco-intro-cybersecurity", "sst", "pix", "travail-hauteur"]);
    // Pas de date supposée pour les certifications ajoutées sans date.
    expect(certifications.find((c) => c.id === "pix")?.issuedAt).toBeUndefined();
    expect(certifications.find((c) => c.id === "travail-hauteur")?.issuedAt).toBeUndefined();
  });

  it("coordonnées v3 : email, GitHub, LinkedIn et CV publiés", () => {
    expect(profile.contacts.map((c) => [c.id, c.href])).toEqual([
      ["email", "mailto:evann.bougoula@dagz.fr"],
      ["linkedin", "https://www.linkedin.com/in/evann-bougoula"],
      ["github", "https://github.com/dagonk49"],
    ]);
    expect(profile.cvFile).toBe("/CV_Evann_Bougoula.pdf");
    expect(profile.status.join(" ")).toMatch(/EFS/);
    expect(profile.status.join(" ")).toMatch(/MyDigitalSchool Angers/);
    expect(profile.mobility.areas).toEqual(["Angers", "Nantes", "Ancenis", "Candé"]);
  });

  it("fiches E5 : six réalisations cohérentes, sans résultat de recette inventé", () => {
    expect(realisations.map((r) => r.id)).toEqual(["efs-ad-parc", "netforge", "ventoy", "proxmox-debian", "unifi-wifi", "homelab"]);
    expect(realisations.map((r) => r.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(e5Competences).toHaveLength(6);
    const known = new Set(e5Competences.map((c) => c.id));
    for (const r of realisations) {
      expect(r.competences.length, r.id).toBeGreaterThan(0);
      for (const c of r.competences) expect(known.has(c.id), `${r.id} → ${c.id}`).toBe(true);
      for (const ref of r.related) expect(refExists(ref), r.id).toBe(true);
      if ("experienceId" in r.period) expect(experiences.some((e) => e.id === (r.period as { experienceId: string }).experienceId)).toBe(true);
      expect(realisationPeriod(r)).not.toBe("");
      expect(r.documents.map((d) => d.kind)).toEqual(["installation", "exploitation", "utilisateur"]);
      // Aucun résultat obtenu ni statut sans cahier de recette fourni par Evann.
      for (const t of r.tests) {
        expect(t.observed, `${r.id} : ${t.case}`).toBeUndefined();
        expect(t.status, `${r.id} : ${t.case}`).toBeUndefined();
      }
      // Pas de capture ni de document référencé tant que le fichier n'existe pas.
      for (const c of r.captures) expect(c.src).toBeUndefined();
      for (const d of r.documents) expect(d.href).toBeUndefined();
    }
    // Texte visible uniquement (les notes éditoriales internes citent justement ces interdits).
    const all = JSON.stringify(realisations.map(({ editorialNotes: _notes, ...visible }) => visible));
    expect(all).not.toMatch(/PowerShell|CCNA|lorem|à compléter/i);
    expect(all).not.toMatch(/\bN2\b/);
    expect(all).not.toMatch(/react|next\.js|node|python|django|laravel|php/i);
    expect(JSON.stringify(realisations.find((r) => r.id === "efs-ad-parc"))).not.toMatch(/AMI \(/);
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

  it("NetForge : seulement l'URL fournie, sans stack inventée", () => {
    const nf = projects.find((p) => p.id === "netforge");
    expect(nf?.links).toEqual([{ label: "Accéder à la plateforme NetForge (netforge.dagz.fr)", href: "https://netforge.dagz.fr" }]);
    expect(nf?.liveUrl).toBe("https://netforge.dagz.fr");
    expect(nf?.badges).toEqual(["Outil en ligne", "IPAM", "Cisco CLI", "VLSM"]);
    expect(nf?.since).toEqual({ year: 2026, month: 5 });
    expect(nf?.pillars).toHaveLength(4);
    // Aucune technologie de réalisation n'a été fournie : elle n'apparaît nulle part.
    expect(JSON.stringify(nf)).not.toMatch(/react|next\.js|node|python|django|laravel|php|vue/i);
  });

  it("loisirs : quatre fiches, uniquement les phrases fournies", () => {
    expect(hobbies.map((h) => h.id)).toEqual(["valorant", "minecraft", "gta", "cinema-mecanique"]);
    const all = JSON.stringify(hobbies);
    // Ni rang, ni temps de jeu, ni plateforme inventés.
    expect(all).not.toMatch(/rang|rank|heures|plateforme|ps5|xbox|immortal|radiant|diamant/i);
    expect(hobbies.find((h) => h.id === "gta")?.quote).toBe("Le seul braquage toléré est celui d'une baie mal brassée.");
    expect(hobbies.find((h) => h.id === "valorant")?.lines.join(" ")).toContain("Duelist ou Initiator, prêt à clutch l'infra");
    const circuit = anomalies.filter((a) => a.world === "circuit");
    expect(circuit.map((a) => a.target)).toEqual(hobbies.map((h) => ({ type: "hobby", id: h.id })));
    expect(circuit.every((a) => /^#[0-9a-f]{6}$/i.test(a.color ?? ""))).toBe(true);
  });

  it("l'index couvre tout le parcours", () => {
    const idx = contentIndex();
    expect(idx.filter((c) => c.group === "Expériences")).toHaveLength(5);
    expect(idx.filter((c) => c.group === "Formations")).toHaveLength(2);
    expect(idx.some((c) => c.ref.type === "contact")).toBe(true);
    expect(idx.filter((c) => c.group === "Loisirs")).toHaveLength(4);
  });
});
