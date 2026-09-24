"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useApp } from "@/state/app";
import { computeNetwork, interfacesOf, linkStatus } from "@/sim/network";
import { labOnline } from "@/sim/diagnostics";
import { formatIPv4 } from "@/lib/ipv4";
import { cachedMaterial, geo, glow, mat, PALETTE, trackTexture } from "../materials";
import { canvasTexture, drawNetForgeScreen, drawNetworkPoster, drawPixelGrass, drawSunsetCard, screenTexture } from "../textures";
import { CONTACT_KIOSK, DESK, DEV_TABLE, FACE_CAMERA, TEST_CART, WORKBENCH, type Vec3 } from "../layout";
import { B, Glow, Label } from "./primitives";
import { DeskChair } from "./Props";

function Monitor({ p, material, width = 0.64, height = 0.4, yaw = 0 }: { p: Vec3; material: THREE.Material; width?: number; height?: number; yaw?: number }) {
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <B p={[0, 0.015, 0]} s={[0.22, 0.03, 0.16]} m="graphiteDark" />
      <B p={[0, 0.16, -0.02]} s={[0.05, 0.28, 0.04]} m="aluDark" />
      <B p={[0, 0.3 + height / 2, 0]} s={[width + 0.04, height + 0.04, 0.035]} m="graphiteDark" />
      <mesh position={[0, 0.3 + height / 2, 0.019]} material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}

/** Écran du poste PC-LAB : il affiche l'état réel de la carte réseau simulée. */
function PcScreen() {
  const lab = useApp((s) => s.progress.lab);
  const passed = useApp((s) => s.progress.mission.diagnosticPassed);
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 320;
    const t = trackTexture(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    const link = linkStatus(lab, "pc-eth0");
    const iface = interfacesOf(computeNetwork(lab), "pc-lab")[0];
    const online = labOnline(lab);
    ctx.fillStyle = "#0e1215";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1a2126";
    ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = "#e8eef0";
    ctx.font = "600 22px 'IBM Plex Sans', sans-serif";
    ctx.fillText("PC-LAB · console d'administration", 18, 30);
    const rows: [string, string, string][] = [
      ["Liaison", link.up ? "active" : "déconnectée", link.up ? "#59e08a" : "#f0a13a"],
      [
        "IPv4",
        iface ? `${formatIPv4(iface.ip)}/${iface.prefix}${iface.apipa ? " (APIPA)" : ""}${iface.duplicate ? " (conflit)" : ""}` : "aucune",
        iface && !iface.apipa && !iface.duplicate ? "#e8eef0" : "#f0a13a",
      ],
      ["Passerelle", iface?.gateway != null ? formatIPv4(iface.gateway) : "—", "#e8eef0"],
      ["SRV-LAB", online.server ? "joignable" : "injoignable", online.server ? "#59e08a" : "#8b979f"],
      ["Autre réseau", online.remote ? "joignable" : "injoignable", online.remote ? "#59e08a" : "#8b979f"],
    ];
    ctx.font = "500 21px 'IBM Plex Mono', monospace";
    rows.forEach(([k, v, color], i) => {
      const y = 92 + i * 40;
      ctx.fillStyle = "#8b979f";
      ctx.fillText(k, 22, y);
      ctx.fillStyle = color;
      ctx.fillText(v, 200, y);
    });
    ctx.fillStyle = passed && online.server && online.gateway ? "#3cc7da" : "#5b666e";
    ctx.font = "600 19px 'IBM Plex Mono', monospace";
    ctx.fillText(passed && online.server && online.gateway ? "● poste en ligne" : "○ diagnostic à lancer", 22, h - 22);
    texture.needsUpdate = true;
  }, [lab, passed, canvas, texture]);

  return <Monitor p={[DESK.x - 0.62, DESK.height, DESK.z - 0.12]} material={material} yaw={0.12} />;
}

function WallPoster({ p, size, draw, name }: { p: Vec3; size: [number, number]; draw: Parameters<typeof screenTexture>[1]; name: string }) {
  const tex = screenTexture(name, draw, 512, Math.round(512 * (size[1] / size[0])));
  const material = cachedMaterial(`poster:${name}`, () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  return (
    <group position={p}>
      <B p={[0, 0, -0.01]} s={[size[0] + 0.06, size[1] + 0.06, 0.02]} m="graphiteDark" shadow={false} />
      <mesh material={material} position={[0, 0, 0.002]}>
        <planeGeometry args={size} />
      </mesh>
    </group>
  );
}

export function Desk() {
  const netforge = screenTexture("netforge", drawNetForgeScreen);
  const netforgeMat = cachedMaterial("screen:netforge", () => new THREE.MeshBasicMaterial({ map: netforge, toneMapped: false }));
  const grass = canvasTexture("pixel:grass", 64, 64, drawPixelGrass);
  grass.magFilter = THREE.NearestFilter;
  const grassMat = cachedMaterial("pixel:grass", () => new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }));
  const sunset = canvasTexture("card:sunset", 128, 96, drawSunsetCard);
  const sunsetMat = cachedMaterial("card:sunset", () => new THREE.MeshStandardMaterial({ map: sunset, roughness: 0.8 }));
  const laptopScreen = canvasTexture("screen:ventoy", 256, 160, (ctx, w, h) => {
    ctx.fillStyle = "#12171b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f0a13a";
    ctx.font = "600 16px 'IBM Plex Mono', monospace";
    ctx.fillText("Ventoy · démarrage", 14, 30);
    ctx.fillStyle = "#dfe6e8";
    ctx.font = "500 13px 'IBM Plex Mono', monospace";
    ["> Windows (personnalisé)", "  Windows (standard)", "  Outils de diagnostic"].forEach((l, i) => ctx.fillText(l, 14, 64 + i * 24));
    ctx.fillStyle = "#3cc7da";
    ctx.fillRect(14, h - 26, (w - 28) * 0.62, 8);
  });
  const laptopMat = cachedMaterial("screen:ventoy", () => new THREE.MeshBasicMaterial({ map: laptopScreen, toneMapped: false }));
  const codeScreen = canvasTexture("screen:code", 256, 160, (ctx, w, h) => {
    ctx.fillStyle = "#12171b";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "500 13px 'IBM Plex Mono', monospace";
    const lines: [string, string][] = [
      ["<section>", "#3cc7da"],
      ["  <h1>Lab</h1>", "#dfe6e8"],
      ["</section>", "#3cc7da"],
      ["", "#fff"],
      ["function route(ip) {", "#f0a13a"],
      ["  return subnet(ip);", "#dfe6e8"],
      ["}", "#f0a13a"],
    ];
    lines.forEach(([l, c], i) => {
      ctx.fillStyle = c;
      ctx.fillText(l, 12, 22 + i * 19);
    });
    void h;
  });
  const codeMat = cachedMaterial("screen:code", () => new THREE.MeshBasicMaterial({ map: codeScreen, toneMapped: false }));
  const notebook = canvasTexture("notebook", 256, 180, (ctx, w, h) => {
    ctx.fillStyle = "#f4f1e8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c9c2b3";
    for (let y = 36; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#2b2f35";
    ctx.font = "600 16px 'IBM Plex Sans', sans-serif";
    ctx.fillText("Carnet de tests", 12, 26);
    ctx.font = "500 13px 'IBM Plex Mono', monospace";
    ["[x] câble testé", "[x] liaison OK", "[ ] VLAN à vérifier", "[ ] ping passerelle"].forEach((l, i) => ctx.fillText(l, 14, 52 + i * 22));
    ctx.fillRect(w / 2 - 1, 0, 2, h);
  });
  const notebookMat = cachedMaterial("notebook", () => new THREE.MeshStandardMaterial({ map: notebook, roughness: 0.95 }));
  const padGeo = geo("gamepad", () => new THREE.CapsuleGeometry(0.035, 0.1, 3, 8));

  const lab = useApp((s) => s.progress.lab);
  const pcLink = linkStatus(lab, "pc-eth0").up;

  const x = DESK.x;
  const z = DESK.z;
  const top = DESK.height;
  return (
    <group>
      {/* Bureau */}
      <B p={[x, top - 0.025, z]} s={[2.6, 0.05, 0.92]} m="wood" />
      {[-1.22, 1.22].map((dx) => (
        <B key={dx} p={[x + dx, (top - 0.05) / 2, z]} s={[0.06, top - 0.05, 0.8]} m="graphite" />
      ))}
      <B p={[x + 0.85, 0.32, z]} s={[0.45, 0.58, 0.7]} m="graphiteSoft" />
      <PcScreen />
      <Monitor p={[x + 0.62, top, z - 0.12]} material={netforgeMat} yaw={-0.12} />
      <Label mono position={[x + 0.62, top + 0.26, z - 0.08]} rotation={[0, -0.12, 0]} fontSize={0.032} color={PALETTE.alu}>
        NetForge — maquette illustrative
      </Label>
      <B p={[x - 0.05, top + 0.012, z + 0.2]} s={[0.46, 0.022, 0.15]} m="graphiteSoft" />
      <B p={[x + 0.34, top + 0.014, z + 0.22]} s={[0.06, 0.024, 0.1]} m="graphiteSoft" />
      {/* Tour du poste : le voyant réseau suit la liaison réelle */}
      <group position={[x - 1.0, 0, z - 0.02]}>
        <B p={[0, 0.25, 0]} s={[0.22, 0.5, 0.48]} m="graphiteDark" />
        <Glow p={[0.05, 0.44, 0.242]} s={[0.02, 0.02, 0.004]} color="cyan" />
        <Glow p={[-0.05, 0.1, 0.242]} s={[0.04, 0.012, 0.004]} color={pcLink ? "#59e08a" : "#3a3f45"} />
      </group>
      {/* Prise murale B-02 : départ de la liaison vers la baie */}
      <group position={[x - 0.62, 0.32, -23.97]}>
        <B s={[0.16, 0.16, 0.03]} m="offWhite" />
        <B p={[0, 0, 0.02]} s={[0.06, 0.05, 0.01]} m="graphiteDark" shadow={false} />
        <Label mono position={[0, 0.12, 0.02]} fontSize={0.05} color={PALETTE.graphite}>
          B-02
        </Label>
      </group>
      <group position={[x + 0.2, 0.32, -23.97]}>
        <B s={[0.16, 0.16, 0.03]} m="offWhite" />
        <Label mono position={[0, 0.12, 0.02]} fontSize={0.05} color={PALETTE.graphite}>
          B-03
        </Label>
      </group>
      {/* Lampe (lumière chaude) */}
      <group position={[x - 1.12, top, z - 0.28]}>
        <B p={[0, 0.02, 0]} s={[0.14, 0.03, 0.14]} m="graphiteDark" />
        <B p={[0, 0.26, 0]} s={[0.025, 0.5, 0.025]} m="aluDark" />
        <B p={[0.08, 0.5, 0.06]} s={[0.2, 0.08, 0.14]} r={[0.3, 0.4, 0]} m="amberDeep" />
        <Glow p={[0.1, 0.46, 0.08]} s={[0.12, 0.01, 0.08]} color="#ffd9a0" />
      </group>
      <pointLight position={[x - 0.6, 1.9, z + 1.0]} color="#ffb870" intensity={16} distance={8} decay={1.6} />
      <pointLight position={[WORKBENCH.x, 2.2, WORKBENCH.z + 1.4]} color="#ffc98a" intensity={8} distance={6} decay={1.8} />
      {/* Loisirs discrets : manette, bloc de pixels, carte coucher de soleil */}
      <group position={[x + 0.95, top + 0.03, z + 0.18]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh geometry={padGeo} material={mat("graphiteSoft")} castShadow />
      </group>
      <B p={[x + 1.02, top + 0.03, z + 0.22]} s={[0.1, 0.04, 0.07]} m="graphiteSoft" />
      <B p={[x - 0.3, top + 0.055, z + 0.28]} s={[0.08, 0.11, 0.08]} m="offWhite" />
      {/* Étagère */}
      <group position={[x + 0.7, 1.72, -23.72]}>
        <B s={[1.8, 0.04, 0.3]} m="woodDark" />
        {["#2b6f7c", "#c9771b", "#3c424a", "#7d858d", "#2b2f35"].map((c, i) => (
          <B key={c} p={[-0.8 + i * 0.09, 0.16, 0]} s={[0.07, 0.28, 0.24]} m={mat(c)} />
        ))}
        <mesh position={[0.2, 0.13, 0]} material={grassMat} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
        </mesh>
        <mesh position={[0.62, 0.12, -0.08]} rotation={[-0.08, -0.2, 0]} material={sunsetMat}>
          <boxGeometry args={[0.28, 0.21, 0.015]} />
        </mesh>
      </group>
      <WallPoster p={[x - 0.5, 2.25, -23.96]} size={[1.0, 0.78]} draw={drawNetworkPoster} name="network" />

      {/* Établi : préparation de portables, support d'installation Ventoy */}
      <group position={[WORKBENCH.x, 0, WORKBENCH.z]}>
        <B p={[0, WORKBENCH.height - 0.03, 0]} s={[2.2, 0.06, 0.9]} m="woodDark" />
        <B p={[0, 0.45, -0.1]} s={[2.1, 0.04, 0.6]} m="graphiteSoft" />
        {[-1.02, 1.02].map((dx) => (
          <B key={dx} p={[dx, (WORKBENCH.height - 0.06) / 2, 0]} s={[0.08, WORKBENCH.height - 0.06, 0.8]} m="graphite" />
        ))}
        <group position={[-0.35, WORKBENCH.height, 0.05]}>
          <B p={[0, 0.012, 0.05]} s={[0.46, 0.02, 0.32]} m="alu" />
          <group position={[0, 0.02, -0.1]} rotation={[-0.25, 0, 0]}>
            <B p={[0, 0.15, 0]} s={[0.46, 0.3, 0.015]} m="alu" />
            <mesh position={[0, 0.15, 0.009]} material={laptopMat}>
              <planeGeometry args={[0.42, 0.26]} />
            </mesh>
          </group>
          <B p={[0.27, 0.02, 0.1]} s={[0.07, 0.018, 0.022]} m="graphiteDark" />
          <B p={[0.315, 0.02, 0.1]} s={[0.03, 0.02, 0.026]} m="amber" />
        </group>
        <B p={[0.45, WORKBENCH.height + 0.06, 0.05]} s={[0.36, 0.12, 0.26]} m="cyanDeep" />
        <B p={[0.8, WORKBENCH.height + 0.03, -0.1]} s={[0.22, 0.06, 0.16]} m="graphiteSoft" />
      </group>

      {/* Table du poste de développement */}
      <group position={DEV_TABLE} rotation={[0, FACE_CAMERA, 0]}>
        <B p={[0, 0.98, 0]} s={[0.9, 0.04, 0.6]} m="wood" />
        <B p={[0, 0.48, 0]} s={[0.08, 0.96, 0.08]} m="graphite" />
        <B p={[0, 0.02, 0]} s={[0.6, 0.04, 0.5]} m="graphite" />
        <group position={[0, 1.0, 0.05]}>
          <B p={[0, 0.01, 0.06]} s={[0.4, 0.018, 0.28]} m="graphiteSoft" />
          <group position={[0, 0.02, -0.08]} rotation={[-0.3, 0, 0]}>
            <B p={[0, 0.13, 0]} s={[0.4, 0.26, 0.014]} m="graphiteSoft" />
            <mesh position={[0, 0.13, 0.008]} material={codeMat}>
              <planeGeometry args={[0.37, 0.23]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Chariot de tests : carnet et testeur de câbles */}
      <group position={TEST_CART} rotation={[0, FACE_CAMERA, 0]}>
        <B p={[0, 0.82, 0]} s={[0.8, 0.04, 0.5]} m="alu" />
        <B p={[0, 0.3, 0]} s={[0.8, 0.04, 0.5]} m="alu" />
        {[-0.37, 0.37].map((dx) => [-0.22, 0.22].map((dz) => <B key={`${dx}${dz}`} p={[dx, 0.42, dz]} s={[0.035, 0.84, 0.035]} m="aluDark" />))}
        <mesh position={[-0.12, 0.85, 0.02]} rotation={[-Math.PI / 2, 0, 0.1]} material={notebookMat}>
          <planeGeometry args={[0.42, 0.3]} />
        </mesh>
        <group position={[0.24, 0.87, 0]}>
          <B s={[0.12, 0.05, 0.2]} m="amberDeep" />
          <Glow p={[0, 0.026, 0.04]} s={[0.07, 0.004, 0.06]} color="#9fe3b6" />
        </group>
        <mesh position={[0.1, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat("cyanDeep", { roughness: 0.5 })}>
          <torusGeometry args={[0.13, 0.02, 5, 16]} />
        </mesh>
      </group>

      {/* Borne contact (fin du parcours) */}
      <group position={CONTACT_KIOSK} rotation={[0, 0, 0]}>
        <B p={[0, 0.55, 0]} s={[0.55, 1.1, 0.4]} m="graphite" />
        <B p={[0, 1.3, 0.02]} s={[0.7, 0.5, 0.08]} m="graphiteDark" />
        <Label mono position={[0, 1.4, 0.07]} fontSize={0.075} color={PALETTE.amber} letterSpacing={0.14}>
          CONTACT
        </Label>
        <Label position={[0, 1.24, 0.07]} fontSize={0.06} color={PALETTE.offWhite}>
          LinkedIn
        </Label>
        <Glow p={[0, 0.02, 0.21]} s={[0.5, 0.02, 0.02]} color="amber" />
      </group>

      <group userData={{ noBatch: true }}>
        <DeskChair p={[x - 0.3, 0, z + 1.0]} />
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.3, top / 2, 0.46]} position={[x, top / 2, z]} />
        <CuboidCollider args={[1.1, WORKBENCH.height / 2, 0.45]} position={[WORKBENCH.x, WORKBENCH.height / 2, WORKBENCH.z]} />
        <CuboidCollider args={[0.42, 0.5, 0.42]} position={[DEV_TABLE[0], 0.5, DEV_TABLE[2]]} />
        <CuboidCollider args={[0.45, 0.45, 0.45]} position={[TEST_CART[0], 0.45, TEST_CART[2]]} />
        <CuboidCollider args={[0.3, 0.8, 0.25]} position={[CONTACT_KIOSK[0], 0.8, CONTACT_KIOSK[2]]} />
      </RigidBody>
    </group>
  );
}
