import { describe, expect, it } from "vitest";
import { complete, execute, GOOGLE_URL, normalize, RACER_UNLOCKED, type CommandResult } from "./interpreter";

const ctx = { history: [] as string[], can3d: true };
const text = (r: CommandResult) => r.lines.map((l) => l.map((s) => s.text).join("")).join("\n");

describe("terminal", () => {
  it("help liste les commandes publiques, pas les easter eggs", () => {
    const r = text(execute("help", ctx));
    for (const c of ["whoami", "about", "skills", "experience", "education", "certifications", "projects", "netforge", "homelab", "contact", "linkedin", "cv", "clear", "history", "gui", "google"]) {
      expect(r).toContain(c);
    }
    expect(r).not.toMatch(/valorant|minecraft|gta|sudo|cars|racer|nascar/);
  });

  it("est insensible à la casse et aux espaces", () => {
    expect(text(execute("  WhoAmI ", ctx))).toContain("Evann Bougoula");
    expect(normalize("  GTA   VI ")).toBe("gta vi");
  });

  it("les contenus viennent des données partagées", () => {
    const xp = text(execute("experience", ctx));
    expect(xp).toContain("Établissement Français du Sang");
    expect(xp).toContain("EURL Moizan");
    expect(xp.match(/NET4BUSINESS/g)).toHaveLength(3);
    expect(xp).toContain("Support N1");
    expect(xp).not.toMatch(/N2/);
    const edu = text(execute("education", ctx));
    expect(edu).toContain("fin prévue en juillet 2028");
    expect(edu).toContain("17,14/20");
    const certs = text(execute("certifications", ctx));
    expect(certs).toContain("expire en juin 2029");
    expect(certs).not.toMatch(/CCNA/);
  });

  it("google ouvre un nouvel onglet et propose un lien de secours", () => {
    const r = execute("google", ctx);
    expect(r.effects).toEqual([{ type: "open-url", url: GOOGLE_URL }]);
    expect(r.lines.flat().some((s) => s.kind === "link" && s.href === GOOGLE_URL)).toBe(true);
  });

  it("linkedin pointe vers le vrai profil", () => {
    const r = execute("LinkedIn", ctx);
    expect(r.effects[0]).toEqual({ type: "open-url", url: "https://www.linkedin.com/in/evann-bougoula" });
  });

  it("cv sans fichier propose l'impression", () => {
    const r = execute("cv", ctx);
    expect(r.lines.flat().some((s) => s.kind === "action" && s.action === "print")).toBe(true);
  });

  it("easter eggs et variantes", () => {
    for (const [input, fx] of [
      ["valorant", "valorant"],
      ["VALO", "valorant"],
      ["minecraft", "minecraft"],
      ["gta5", "gta5"],
      ["gta v", "gta5"],
      ["GTA  V", "gta5"],
      ["gta6", "gta6"],
      ["gta vi", "gta6"],
      ["Gta Vi", "gta6"],
    ] as const) {
      expect(execute(input, ctx).effects).toContainEqual({ type: "fx", name: fx });
    }
    expect(text(execute("valo", ctx))).toBe("En dehors de l'infra, j'adore aussi jouer à Valorant.");
    const sudo = execute("sudo rm -rf /", ctx);
    expect(text(sudo)).toMatch(/Rien n'a été exécuté/);
    expect(sudo.effects).toEqual([{ type: "fx", name: "sudo" }]);
  });

  it("cars : débloque le mode course avec la réponse exacte", () => {
    expect(RACER_UNLOCKED).toBe(
      "[RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit extérieur pour prendre la piste.",
    );
    const r = execute("cars", ctx);
    expect(text(r).split("\n")[0]).toBe(RACER_UNLOCKED);
    expect(r.effects).toEqual([{ type: "unlock-racer" }, { type: "fx", name: "cars" }]);
    expect(r.lines.flat().some((s) => s.kind === "action" && s.action === "enter-circuit")).toBe(true);
    expect(execute("  CARS ", ctx).effects).toContainEqual({ type: "unlock-racer" });
    // Sans WebGL : déblocage mémorisé, mais pas de lien vers un circuit inaccessible.
    const no3d = execute("cars", { history: [], can3d: false });
    expect(no3d.lines.flat().some((s) => s.kind === "action")).toBe(false);
    expect(complete("ca").candidates).toEqual([]);
  });

  it("netforge renvoie vers la plateforme en ligne", () => {
    const r = execute("netforge", ctx);
    expect(r.lines.flat().some((s) => s.kind === "link" && s.href === "https://netforge.dagz.fr")).toBe(true);
    expect(text(r)).not.toMatch(/démonstration/);
  });

  it("commande inconnue : message lisible, suggestion, pas d'interprétation", () => {
    const r = text(execute("<img src=x onerror=alert(1)>", ctx));
    expect(r).toContain("Commande introuvable");
    expect(text(execute("skils", ctx))).toContain("« skills »");
    expect(text(execute("whoami --all", ctx))).toMatch(/ne prend pas d'argument/);
  });

  it("clear, history, gui", () => {
    expect(execute("clear", ctx).effects).toEqual([{ type: "clear" }]);
    expect(text(execute("history", { history: ["help", "skills"], can3d: true }))).toMatch(/1\s+help[\s\S]*2\s+skills/);
    expect(execute("gui", ctx).effects).toEqual([{ type: "enter-3d" }]);
    expect(execute("gui", { history: [], can3d: false }).effects).toEqual([]);
  });

  it("autocomplétion", () => {
    expect(complete("wh").value).toBe("whoami");
    expect(complete("h").candidates).toEqual(["help", "homelab", "history"]);
    expect(complete("h").value).toBeNull();
    expect(complete("hi").value).toBe("history");
    expect(complete("ce").candidates).toEqual(["certifications"]);
    expect(complete("").value).toBeNull();
    expect(complete("val").value).toBeNull(); // commandes cachées non proposées
  });
});
