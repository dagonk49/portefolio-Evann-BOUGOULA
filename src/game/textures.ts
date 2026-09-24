/**
 * Textures procédurales dessinées sur canvas (aucun fichier image).
 */
import * as THREE from "three";
import { trackTexture } from "./materials";

const cache = new Map<string, THREE.CanvasTexture>();

export function canvasTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  options: { repeat?: [number, number]; srgb?: boolean } = {},
): THREE.CanvasTexture {
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, width, height);
  const tex = trackTexture(new THREE.CanvasTexture(canvas));
  if (options.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  if (options.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(options.repeat[0], options.repeat[1]);
  }
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

export function clearTextureCache(): void {
  cache.clear();
}

/** Dalles de sol technique : joints fins et perforations discrètes. */
export function tileTexture(kind: "floor" | "raised" | "warm" | "dark", repeat: [number, number]): THREE.CanvasTexture {
  return canvasTexture(
    `tile:${kind}:${repeat.join("x")}`,
    256,
    256,
    (ctx, w, h) => {
      const base = kind === "floor" ? "#dcd7cc" : kind === "raised" ? "#c3c8cc" : kind === "dark" ? "#4a5058" : "#cdbb9f";
      const seam = kind === "floor" ? "#c5bfb2" : kind === "raised" ? "#9fa6ad" : kind === "dark" ? "#343a41" : "#b39f82";
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = seam;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      if (kind === "raised" || kind === "dark") {
        ctx.fillStyle = kind === "dark" ? "#3d434a" : "#aab1b7";
        for (let y = 40; y < h - 30; y += 22) for (let x = 40; x < w - 30; x += 22) ctx.fillRect(x, y, 6, 6);
      } else if (kind === "floor") {
        ctx.fillStyle = "rgba(0,0,0,0.035)";
        ctx.fillRect(10, 10, w - 20, h - 20);
      } else {
        ctx.strokeStyle = "rgba(90,70,40,0.12)";
        ctx.lineWidth = 2;
        for (let y = 32; y < h; y += 32) {
          ctx.beginPath();
          ctx.moveTo(8, y);
          ctx.lineTo(w - 8, y);
          ctx.stroke();
        }
      }
    },
    { repeat },
  );
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function screenTexture(key: string, draw: Draw, width = 512, height = 320): THREE.CanvasTexture {
  return canvasTexture(`screen:${key}`, width, height, draw);
}

export const MONO = "500 22px 'IBM Plex Mono', ui-monospace, monospace";

/** Maquette de l'écran NetForge : la plateforme en ligne (illustration, pas une capture). */
export const drawNetForgeScreen: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#0e1215";
  ctx.fillRect(0, 0, w, h);
  // Barre du navigateur
  ctx.fillStyle = "#1c2329";
  ctx.fillRect(0, 0, w, 38);
  ["#e5534b", "#f2a948", "#59c27a"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(18 + i * 16, 19, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#0f1316";
  ctx.fillRect(74, 8, w - 90, 22);
  ctx.fillStyle = "#59e08a";
  ctx.fillRect(84, 15, 8, 8);
  ctx.fillStyle = "#c9d3d8";
  ctx.font = "500 15px 'IBM Plex Mono', monospace";
  ctx.fillText("https://netforge.dagz.fr", 100, 24);
  // En-tête de l'application
  ctx.fillStyle = "#f2a948";
  ctx.font = "700 30px 'IBM Plex Sans', sans-serif";
  ctx.fillText("NetForge", 20, 80);
  ctx.fillStyle = "#8b979f";
  ctx.font = "500 14px 'IBM Plex Mono', monospace";
  ctx.fillText("conception réseau · adressage · configurations", 20, 104);
  // Quatre piliers
  const tiles: [string, string, string][] = [
    ["01", "Adressage", "VLSM"],
    ["02", "IPAM", "léger"],
    ["03", "Cisco", "CLI"],
    ["04", "Visua-", "lisation"],
  ];
  const tw = (w - 40 - 3 * 10) / 4;
  tiles.forEach(([n, a, b], i) => {
    const x = 20 + i * (tw + 10);
    ctx.fillStyle = "#161c21";
    ctx.fillRect(x, 124, tw, 112);
    ctx.fillStyle = i === 0 ? "#3cc7da" : i === 1 ? "#f2a948" : i === 2 ? "#59c27a" : "#b88cf2";
    ctx.fillRect(x, 124, tw, 4);
    ctx.font = "500 14px 'IBM Plex Mono', monospace";
    ctx.fillText(n, x + 12, 152);
    ctx.fillStyle = "#e8eef0";
    ctx.font = "600 19px 'IBM Plex Sans', sans-serif";
    ctx.fillText(a, x + 12, 186);
    ctx.fillText(b, x + 12, 210);
  });
  // Invitation
  ctx.fillStyle = "#f2a948";
  ctx.fillRect(20, 254, 250, 40);
  ctx.fillStyle = "#1a1206";
  ctx.font = "600 17px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Ouvrir la plateforme ↗", 34, 280);
  ctx.fillStyle = "#6f7a82";
  ctx.font = "500 13px 'IBM Plex Mono', monospace";
  ctx.fillText("maquette illustrative", w - 186, h - 22);
};

/** Schéma réseau affiché au mur du bureau : le scénario de la mission. */
export const drawNetworkPoster: Draw = (ctx, w, h) => {
  ctx.fillStyle = "#f3f0e8";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#2b2f35";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = "#2b2f35";
  ctx.font = "600 26px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Schéma du lab", 24, 44);
  ctx.font = "500 16px 'IBM Plex Mono', monospace";
  ctx.fillStyle = "#5b6168";
  ctx.fillText("VLAN 10 LAB · 192.168.10.0/24", 24, 70);
  const box = (x: number, y: number, label: string, sub: string, color = "#2b2f35") => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 128, 52);
    ctx.fillStyle = "#f3f0e8";
    ctx.font = "600 17px 'IBM Plex Mono', monospace";
    ctx.fillText(label, x + 10, y + 22);
    ctx.font = "500 13px 'IBM Plex Mono', monospace";
    ctx.fillText(sub, x + 10, y + 42);
  };
  ctx.strokeStyle = "#1b8c9d";
  ctx.lineWidth = 4;
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  line(256, 142, 256, 196);
  line(256, 248, 110, 300);
  line(256, 248, 402, 300);
  box(192, 90, "R1", ".10.1 / .20.1");
  box(192, 196, "SW-LAB", "trunk Gi0/8", "#1b8c9d");
  box(46, 300, "PC-LAB", ".10.42 (B-02)");
  box(338, 300, "SRV-LAB", ".10.10");
  ctx.fillStyle = "#5b6168";
  ctx.font = "500 13px 'IBM Plex Mono', monospace";
  ctx.fillText("passerelle : 192.168.10.1", 24, h - 22);
};

/** Bloc de pixels d'herbe (clin d'œil discret aux loisirs). */
export const drawPixelGrass: Draw = (ctx, w, h) => {
  const n = 8;
  const s = w / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const grass = y < 2 || (y === 2 && (x * 7) % 3 === 0);
      const alt = (x * 5 + y * 3) % 7 === 0;
      ctx.fillStyle = grass ? ((x + y) % 3 === 0 ? "#79c24b" : "#5ea83a") : alt ? "#6d4527" : "#8a5a36";
      ctx.fillRect(x * s, y * s, s + 1, s + 1);
    }
  }
  void h;
};

export const drawSunsetCard: Draw = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#f6b24c");
  g.addColorStop(1, "#e5577a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fde6a8";
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.66, h * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1a2e";
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  ctx.strokeStyle = "#2a1a2e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.82);
  ctx.quadraticCurveTo(w * 0.24, h * 0.5, w * 0.3, h * 0.3);
  ctx.stroke();
  for (const [dx, dy] of [[-40, 6], [40, 10], [-26, -14], [30, -12]] as const) {
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.3);
    ctx.quadraticCurveTo(w * 0.3 + dx * 0.6, h * 0.3 + dy - 10, w * 0.3 + dx, h * 0.3 + dy + 14);
    ctx.stroke();
  }
};

/** Étiquette de carton (« SWITCH 24P », « CÂBLES CAT6 »…). */
export function cardboardLabel(text: string): THREE.CanvasTexture {
  return canvasTexture(`carton:${text}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c49a64";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a67c49";
    ctx.fillRect(0, h * 0.44, w, h * 0.12);
    ctx.fillStyle = "#f1ece2";
    ctx.fillRect(w * 0.14, h * 0.62, w * 0.72, h * 0.24);
    ctx.fillStyle = "#2b2f35";
    ctx.font = "600 30px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h * 0.79);
  });
}

/** Face d'un bloc de code (« { } », « </> »…). */
export function codeFaceTexture(glyph: string, bg: string, fg: string): THREE.CanvasTexture {
  return canvasTexture(`code:${glyph}:${bg}`, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = fg;
    ctx.font = "600 46px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, w / 2, h / 2 + 2);
  });
}
