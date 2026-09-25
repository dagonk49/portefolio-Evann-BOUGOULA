"use client";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useApp } from "@/state/app";
import { useLabUi } from "@/state/labUi";
import { labOnline } from "@/sim/diagnostics";
import { linkStatus, portConfig, type ActiveEndpoint } from "@/sim/network";
import { ENDPOINT_BY_ID, type EndpointId, type SwitchPortId } from "@/sim/scenario";
import { cachedMaterial, geo, glow, mat, PALETTE, unitBox, registerGlow } from "../../materials";
import { canvasTexture } from "../../textures";
import { PLATFORMS, RACK_LAB, RACK_UNITS } from "../../layout";
import { B, Glow, Label } from "../primitives";
import { clickPort } from "../../ui/patching";
import { BASE_Y, FRONT, LOCAL_PORTS, PORT_SIZE, RACK_DEPTH, RACK_HEIGHT, RACK_WIDTH } from "./rackLayout";
import { MissionCables } from "./MissionCables";

type LedState = "up" | "activity" | "shutdown" | "off";

function ledColor(state: LedState): string {
  if (state === "up" || state === "activity") return "#59e08a";
  if (state === "shutdown") return PALETTE.amber;
  return "#26292d";
}

/** Voyant de port : allumé fixe (liaison), clignotant (trafic), ambre (désactivé), éteint. */
function Led({ position, state, reducedMotion }: { position: [number, number, number]; state: LedState; reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (state !== "activity" || reducedMotion) {
      ref.current.visible = true;
      return;
    }
    const t = clock.elapsedTime * 7 + seed;
    ref.current.visible = Math.sin(t) + Math.sin(t * 2.3) > -0.6;
  });
  return <mesh ref={ref} geometry={unitBox()} material={glow(ledColor(state))} position={position} scale={[0.014, 0.012, 0.006]} />;
}

function RackFrame({ children }: { children?: React.ReactNode }) {
  const hw = RACK_WIDTH / 2;
  const hd = RACK_DEPTH / 2;
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <B key={`${sx}${sz}`} p={[sx * (hw - 0.03), RACK_HEIGHT / 2, sz * (hd - 0.03)]} s={[0.05, RACK_HEIGHT, 0.05]} m="graphiteDark" />),
      )}
      <B p={[0, RACK_HEIGHT - 0.025, 0]} s={[RACK_WIDTH, 0.05, RACK_DEPTH]} m="graphiteDark" />
      <B p={[0, 0.04, 0]} s={[RACK_WIDTH, 0.08, RACK_DEPTH]} m="graphiteDark" />
      <B p={[-hw + 0.01, RACK_HEIGHT / 2, 0]} s={[0.02, RACK_HEIGHT - 0.1, RACK_DEPTH - 0.08]} m="graphite" />
      <B p={[hw - 0.01, RACK_HEIGHT / 2, 0]} s={[0.02, RACK_HEIGHT - 0.1, RACK_DEPTH - 0.08]} m="graphite" />
      <B p={[0, RACK_HEIGHT / 2, -hd + 0.02]} s={[RACK_WIDTH - 0.04, RACK_HEIGHT - 0.1, 0.02]} m="graphiteSoft" />
      {[-1, 1].map((sx) => (
        <B key={sx} p={[sx * (hw - 0.07), RACK_HEIGHT / 2, hd - 0.06]} s={[0.035, RACK_HEIGHT - 0.12, 0.02]} m="alu" />
      ))}
      {children}
    </group>
  );
}

function CableManager({ y }: { y: number }) {
  return (
    <group position={[0, y, FRONT - 0.05]}>
      <B s={[0.8, 0.045, 0.1]} m="graphiteDark" />
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
        <B key={x} p={[x, 0, 0.07]} s={[0.03, 0.04, 0.05]} m="aluDark" shadow={false} />
      ))}
    </group>
  );
}

function Port({ id }: { id: EndpointId }) {
  const def = LOCAL_PORTS[id]!;
  const [w, h] = PORT_SIZE[def.kind];
  const selected = useLabUi((s) => s.selectedPort === id);
  const bayOpen = useLabUi((s) => s.panel?.kind === "bay");
  const [hover, setHover] = useState(false);
  const selectable = ENDPOINT_BY_ID[id].selectable;
  return (
    <group position={[def.x, def.y, FRONT + 0.004]} userData={{ noBatch: true }}>
      <mesh
        geometry={unitBox()}
        material={mat(def.kind === "sfp" ? "#0c0e10" : "#101214", { roughness: 0.5 })}
        scale={[w, h, 0.012]}
        onClick={(e) => {
          if (!bayOpen || !selectable) return;
          e.stopPropagation();
          clickPort(id);
        }}
        onPointerOver={(e) => {
          if (!bayOpen || !selectable) return;
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      />
      {selected || (hover && bayOpen) ? (
        <mesh geometry={unitBox()} material={glow(selected ? "amber" : "cyan", 0.9)} position={[0, 0, -0.004]} scale={[w + 0.022, h + 0.022, 0.006]} />
      ) : null}
    </group>
  );
}

function portLedState(lab: ReturnType<typeof useApp.getState>["progress"]["lab"], id: ActiveEndpoint, online: boolean): LedState {
  const def = ENDPOINT_BY_ID[id];
  if (def.role === "switchport" && portConfig(lab, id as SwitchPortId).shutdown) return "shutdown";
  const link = linkStatus(lab, id);
  if (!link.up) return "off";
  if (!online) return "up";
  return "activity";
}

/** Rack RACK-LAB : panneau de brassage, SW-LAB, R1, SRV-LAB, onduleur. */
function MissionRack({ reducedMotion }: { reducedMotion: boolean }) {
  const lab = useApp((s) => s.progress.lab);
  const online = useMemo(() => labOnline(lab).server, [lab]);
  const switchPorts = (Object.keys(LOCAL_PORTS) as EndpointId[]).filter((id) => id.startsWith("sw-gi"));
  const ppLabel = cachedMaterial("pp:label", () => new THREE.MeshBasicMaterial({ color: "#e9e6de" }));
  return (
    <group position={[RACK_LAB.x, BASE_Y, RACK_LAB.z]} rotation={[0, Math.PI / 2, 0]}>
      <RackFrame>
        {/* Panneau de brassage */}
        <group position={[0, RACK_UNITS.patch, FRONT - 0.06]}>
          <B s={[0.8, 0.09, 0.12]} m="aluDark" />
          <mesh geometry={unitBox()} material={ppLabel} position={[0.05, 0.036, 0.061]} scale={[0.66, 0.014, 0.002]} />
        </group>
        {(["pp-01", "pp-02", "pp-03", "pp-04"] as const).map((id) => (
          <Label key={id} mono position={[LOCAL_PORTS[id]!.x, RACK_UNITS.patch + 0.036, FRONT + 0.004]} fontSize={0.0125} color="#1b1e22">
            {ENDPOINT_BY_ID[id].label}
          </Label>
        ))}
        <Label mono position={[-0.385, RACK_UNITS.patch - 0.03, FRONT + 0.004]} fontSize={0.016} color={PALETTE.offWhite} anchorX="left">
          PP
        </Label>
        {[0.07, 0.17, 0.27].map((x) => (
          <B key={x} p={[x, RACK_UNITS.patch, FRONT + 0.001]} s={[0.058, 0.046, 0.004]} m="graphiteSoft" shadow={false} />
        ))}
        <CableManager y={RACK_UNITS.patch - 0.13} />

        {/* Switch SW-LAB */}
        <group position={[0, RACK_UNITS.switch, FRONT - 0.23]}>
          <B s={[0.8, 0.09, 0.46]} m="graphiteDark" />
        </group>
        <Label mono position={[-0.39, RACK_UNITS.switch + 0.032, FRONT + 0.004]} fontSize={0.016} color={PALETTE.cyan} anchorX="left">
          SW-LAB
        </Label>
        {switchPorts.map((id, i) => (
          <group key={id}>
            <Label mono position={[LOCAL_PORTS[id]!.x, RACK_UNITS.switch + 0.028, FRONT + 0.004]} fontSize={0.013} color={PALETTE.alu}>
              {i < 8 ? String(i + 1) : i === 8 ? "SFP9" : "SFP10"}
            </Label>
            <Led position={[LOCAL_PORTS[id]!.x + 0.018, RACK_UNITS.switch - 0.041, FRONT + 0.006]} state={portLedState(lab, id as ActiveEndpoint, online)} reducedMotion={reducedMotion} />
          </group>
        ))}
        <Label mono position={[0.335, RACK_UNITS.switch + 0.052, FRONT + 0.004]} fontSize={0.011} color={PALETTE.alu}>
          CON
        </Label>
        <CableManager y={RACK_UNITS.switch - 0.14} />

        {/* Routeur R1 */}
        <group position={[0, RACK_UNITS.router, FRONT - 0.2]}>
          <B s={[0.8, 0.09, 0.4]} m="alu" />
        </group>
        <Label mono position={[-0.39, RACK_UNITS.router, FRONT + 0.004]} fontSize={0.02} color={PALETTE.graphite} anchorX="left">
          R1
        </Label>
        <Glow p={[-0.3, RACK_UNITS.router, FRONT + 0.004]} s={[0.012, 0.012, 0.004]} color="green" />
        <Led position={[0.2, RACK_UNITS.router - 0.03, FRONT + 0.006]} state={portLedState(lab, "r1-gi0/0", online)} reducedMotion={reducedMotion} />

        {/* Serveur SRV-LAB (2U) */}
        <group position={[0, RACK_UNITS.server, FRONT - 0.4]}>
          <B s={[0.8, 0.18, 0.8]} m="graphite" />
        </group>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[-0.33 + i * 0.1, RACK_UNITS.server + 0.01, FRONT + 0.002]}>
            <B s={[0.085, 0.13, 0.006]} m="graphiteDark" shadow={false} />
            <Glow p={[0.03, -0.05, 0.004]} s={[0.01, 0.01, 0.004]} color={i < 3 ? "green" : "cyanDeep"} />
          </group>
        ))}
        <Label mono position={[0.3, RACK_UNITS.server + 0.05, FRONT + 0.004]} fontSize={0.016} color={PALETTE.offWhite}>
          SRV-LAB
        </Label>
        <Label mono position={[0.3, RACK_UNITS.server - 0.068, FRONT + 0.004]} fontSize={0.011} color={PALETTE.alu}>
          eth0
        </Label>
        <Led position={[0.335, RACK_UNITS.server - 0.03, FRONT + 0.006]} state={portLedState(lab, "srv-eth0", online)} reducedMotion={reducedMotion} />

        {/* Onduleur */}
        <group position={[0, RACK_UNITS.ups, FRONT - 0.35]}>
          <B s={[0.8, 0.26, 0.7]} m="graphiteDark" />
        </group>
        <Glow p={[-0.2, RACK_UNITS.ups + 0.04, FRONT + 0.003]} s={[0.14, 0.05, 0.004]} color="cyanDeep" />
        <Label mono position={[0.25, RACK_UNITS.ups + 0.04, FRONT + 0.004]} fontSize={0.02} color={PALETTE.alu}>
          UPS
        </Label>
        {/* Obturateurs */}
        <B p={[0, 1.15, FRONT - 0.005]} s={[0.8, 0.14, 0.01]} m="graphiteSoft" shadow={false} />
        <B p={[0, 0.72, FRONT - 0.005]} s={[0.8, 0.22, 0.01]} m="graphiteSoft" shadow={false} />
        <B p={[0, 1.99, FRONT - 0.005]} s={[0.8, 0.12, 0.01]} m="graphiteSoft" shadow={false} />

        {(Object.keys(LOCAL_PORTS) as EndpointId[]).map((id) => (
          <Port key={id} id={id} />
        ))}
        {/* Faisceau vers le chemin de câbles (liaisons murales B-01 et B-02) */}
        <B p={[-0.28, RACK_HEIGHT + 0.2, -0.3]} s={[0.1, 0.4, 0.1]} m="cyanDeep" />
      </RackFrame>
      <Label mono position={[0, RACK_HEIGHT + 0.12, FRONT]} fontSize={0.07} color={PALETTE.offWhite} letterSpacing={0.1}>
        RACK-LAB
      </Label>
    </group>
  );
}

/** Rack de décor avec voyants d'activité animés. */
function DecorRack({ z, name, variant, reducedMotion }: { z: number; name: string; variant: 0 | 1; reducedMotion: boolean }) {
  const count = 36;
  const ref = useRef<THREE.InstancedMesh>(null);
  const colors = useMemo(() => [new THREE.Color("#59e08a"), new THREE.Color("#3cc7da"), new THREE.Color("#26292d")], []);
  const matrices = useMemo(() => {
    const m = new THREE.Matrix4();
    const list: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 6);
      const col = i % 6;
      m.compose(
        new THREE.Vector3(-0.3 + col * 0.05, 0.4 + row * (variant ? 0.28 : 0.3), FRONT + 0.006),
        new THREE.Quaternion(),
        new THREE.Vector3(0.014, 0.012, 0.006),
      );
      list.push(m.clone());
    }
    return list;
  }, [variant]);
  const last = useRef(0);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (!mesh.userData.init) {
      matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, colors[i % 3 === 2 ? 2 : i % 2]!);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.init = true;
    }
    if (reducedMotion || clock.elapsedTime - last.current < 0.16) return;
    last.current = clock.elapsedTime;
    for (let k = 0; k < 6; k++) {
      const i = Math.floor(Math.random() * count);
      mesh.setColorAt(i, colors[Math.random() < 0.55 ? (i % 2) : 2]!);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  // LED d'activité des serveurs décoratifs : néons (bloom en qualité haute).
  const ledMat = cachedMaterial("decor:led", () => registerGlow(new THREE.MeshBasicMaterial({ toneMapped: false })));
  return (
    <group position={[RACK_LAB.x, BASE_Y, z]} rotation={[0, Math.PI / 2, 0]}>
      <RackFrame>
        {Array.from({ length: 6 }, (_, i) => (
          <B key={i} p={[0, 0.4 + i * (variant ? 0.28 : 0.3), FRONT - 0.3]} s={[0.8, variant ? 0.22 : 0.1, 0.6]} m={i % 2 ? "graphite" : "graphiteDark"} />
        ))}
        {variant === 1
          ? [0.62, 1.18].map((y) => (
              <mesh key={y} position={[0.12, y, FRONT + 0.03]} rotation={[0, 0, Math.PI / 2]} material={mat("#e6c34a", { roughness: 0.5 })}>
                <torusGeometry args={[0.1, 0.008, 5, 16, Math.PI]} />
              </mesh>
            ))
          : null}
        <instancedMesh ref={ref} args={[unitBox(), ledMat, count]} frustumCulled={false} />
      </RackFrame>
      <Label mono position={[0, RACK_HEIGHT + 0.12, FRONT]} fontSize={0.06} color={PALETTE.alu} letterSpacing={0.1}>
        {name}
      </Label>
    </group>
  );
}

/** Borne Wi-Fi murale (VLAN 20, préconfigurée). */
function AccessPoint() {
  const discGeo = geo("ap:disc", () => new THREE.CylinderGeometry(0.2, 0.22, 0.05, 18));
  const ringGeo = geo("ap:ring", () => new THREE.TorusGeometry(0.12, 0.008, 4, 24));
  return (
    <group position={[-23.93, 2.72, 14.3]} rotation={[0, 0, -Math.PI / 2]}>
      <mesh geometry={discGeo} material={mat("offWhite", { roughness: 0.4 })} castShadow />
      <mesh geometry={ringGeo} material={glow("cyan")} position={[0, -0.028, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/** Plan de brassage affiché au mur : un indice pour la mission. */
function PatchPlan() {
  const tex = canvasTexture("poster:patchplan", 512, 360, (ctx, w, h) => {
    ctx.fillStyle = "#f3f0e8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#2b2f35";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = "#2b2f35";
    ctx.font = "600 30px 'IBM Plex Sans', sans-serif";
    ctx.fillText("Plan de brassage", 28, 56);
    ctx.font = "500 22px 'IBM Plex Mono', monospace";
    const rows = [
      ["PP-01", "B-01 · borne Wi-Fi"],
      ["PP-02", "B-02 · bureau, PC-LAB"],
      ["PP-03", "B-03 · bureau, libre"],
      ["PP-04", "B-04 · atelier (non raccordée)"],
    ];
    rows.forEach(([a, b], i) => {
      const y = 112 + i * 52;
      ctx.fillStyle = i === 1 ? "#1b8c9d" : "#2b2f35";
      ctx.fillText(a!, 28, y);
      ctx.fillStyle = "#454b52";
      ctx.fillText(b!, 150, y);
    });
    ctx.fillStyle = "#6a7078";
    ctx.font = "500 18px 'IBM Plex Mono', monospace";
    ctx.fillText("Uplink R1 : Gi0/8 (trunk 10,20)", 28, h - 28);
  });
  const material = cachedMaterial("poster:patchplan", () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  return (
    <mesh position={[-23.97, 1.55, 4.6]} rotation={[0, Math.PI / 2, 0]} material={material}>
      <planeGeometry args={[1.3, 0.92]} />
    </mesh>
  );
}

/** Chariot d'intervention : portable et câble console bleu. */
function ServiceCart() {
  return (
    <group position={[-17.4, BASE_Y, 11.2]} rotation={[0, 0.5, 0]}>
      <B p={[0, 0.84, 0]} s={[0.7, 0.04, 0.46]} m="alu" />
      <B p={[0, 0.3, 0]} s={[0.7, 0.04, 0.46]} m="alu" />
      {[-0.32, 0.32].map((dx) => [-0.2, 0.2].map((dz) => <B key={`${dx}${dz}`} p={[dx, 0.43, dz]} s={[0.03, 0.86, 0.03]} m="aluDark" />))}
      <B p={[-0.08, 0.87, 0.04]} s={[0.36, 0.018, 0.24]} m="graphiteSoft" />
      <group position={[-0.08, 0.88, -0.07]} rotation={[-0.35, 0, 0]}>
        <B p={[0, 0.11, 0]} s={[0.36, 0.22, 0.012]} m="graphiteSoft" />
        <Glow p={[0, 0.11, 0.008]} s={[0.32, 0.18, 0.002]} color="#16323a" />
      </group>
      <mesh position={[0.2, 0.9, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={mat("#3f7fd0", { roughness: 0.5 })}>
        <torusGeometry args={[0.07, 0.012, 5, 14]} />
      </mesh>
      <B p={[0.1, 0.34, 0]} s={[0.3, 0.12, 0.3]} m="cardboard" />
    </group>
  );
}

/** Chemin de câbles aérien au-dessus des baies. */
function CableLadder() {
  const zs = [3.9, 13.3];
  return (
    <group>
      {zs.map((z) => (
        <B key={z} p={[RACK_LAB.x, BASE_Y + 2.5, z]} s={[0.05, 0.5, 0.05]} m="aluDark" />
      ))}
      <B p={[RACK_LAB.x - 0.25, BASE_Y + 2.72, 8.6]} s={[0.04, 0.05, 10.2]} m="alu" />
      <B p={[RACK_LAB.x + 0.25, BASE_Y + 2.72, 8.6]} s={[0.04, 0.05, 10.2]} m="alu" />
      {Array.from({ length: 13 }, (_, i) => (
        <B key={i} p={[RACK_LAB.x, BASE_Y + 2.7, 3.6 + i * 0.83]} s={[0.5, 0.02, 0.04]} m="aluDark" shadow={false} />
      ))}
      <B p={[RACK_LAB.x - 0.1, BASE_Y + 2.78, 8.6]} s={[0.12, 0.08, 10.0]} m="cyanDeep" shadow={false} />
      <B p={[RACK_LAB.x + 0.1, BASE_Y + 2.78, 8.6]} s={[0.1, 0.07, 10.0]} m="amberDeep" shadow={false} />
    </group>
  );
}

export function Bay({ reducedMotion }: { reducedMotion: boolean }) {
  const racks = [RACK_LAB.z - 4.2, RACK_LAB.z - 2.1, RACK_LAB.z, RACK_LAB.z + 2.1, RACK_LAB.z + 4.2];
  return (
    <group>
      <MissionRack reducedMotion={reducedMotion} />
      <DecorRack z={RACK_LAB.z + 2.1} name="RACK-02 · stockage" variant={0} reducedMotion={reducedMotion} />
      <DecorRack z={RACK_LAB.z - 2.1} name="RACK-03 · cœur" variant={1} reducedMotion={reducedMotion} />
      <DecorRack z={RACK_LAB.z + 4.2} name="RACK-04" variant={1} reducedMotion={reducedMotion} />
      <DecorRack z={RACK_LAB.z - 4.2} name="RACK-05" variant={0} reducedMotion={reducedMotion} />
      <CableLadder />
      <ServiceCart />
      <AccessPoint />
      <PatchPlan />
      <MissionCables reducedMotion={reducedMotion} />
      <Label mono position={[-17.8, PLATFORMS.bay.top + 0.01, 13.2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} fontSize={0.32} color={PALETTE.aluDark} letterSpacing={0.12}>
        BAIE RÉSEAU
      </Label>
      <pointLight position={[-18.2, 2.9, 8.6]} color="#8fdcff" intensity={14} distance={11} decay={1.6} />
      <RigidBody type="fixed" colliders={false}>
        {racks.map((z) => (
          <CuboidCollider key={z} args={[RACK_DEPTH / 2, RACK_HEIGHT / 2, RACK_WIDTH / 2]} position={[RACK_LAB.x, BASE_Y + RACK_HEIGHT / 2, z]} />
        ))}
        <CuboidCollider args={[0.4, 0.45, 0.3]} position={[-17.4, BASE_Y + 0.45, 11.2]} rotation={[0, 0.5, 0]} />
      </RigidBody>
    </group>
  );
}
