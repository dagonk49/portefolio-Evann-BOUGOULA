"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { PALETTE } from "../materials";
import { AD_CONSOLE, CAREER_STELES, FACE_CAMERA, PLATFORMS, STELE_Z, SUPPORT_CART } from "../layout";
import { B, Glow, Label } from "./primitives";

const P = PLATFORMS.career;
const RAMP = { fromZ: P.maxZ, toZ: P.maxZ + 2.4 };

const KIND_STYLE = {
  xp: { body: "graphite", band: "amber", title: PALETTE.offWhite, sub: PALETTE.alu },
  edu: { body: "offWhite", band: "cyanDeep", title: PALETTE.graphite, sub: "#5b6168" },
  cert: { body: "alu", band: "green", title: PALETTE.graphite, sub: "#3c424a" },
} as const;

function Stele({ x, year, title, sub, kind }: { x: number; year: string; title: string; sub: string; kind: keyof typeof KIND_STYLE }) {
  const st = KIND_STYLE[kind];
  const top = P.top;
  return (
    <group position={[x, top, STELE_Z]}>
      <B p={[0, 0.06, 0]} s={[1.6, 0.12, 0.5]} m="graphiteDark" />
      <B p={[0, 1.12, 0]} s={[1.42, 2.0, 0.26]} m={st.body} />
      <Glow p={[0, 2.1, 0.132]} s={[1.42, 0.06, 0.01]} color={st.band} />
      <Label mono position={[0, 1.72, 0.135]} fontSize={0.3} color={kind === "xp" ? PALETTE.amber : st.title} letterSpacing={0.02}>
        {year}
      </Label>
      <Label position={[0, 1.34, 0.135]} fontSize={0.155} color={st.title} maxWidth={1.3} textAlign="center">
        {title}
      </Label>
      <Label mono position={[0, 1.1, 0.135]} fontSize={0.075} color={st.sub} maxWidth={1.3} textAlign="center">
        {sub}
      </Label>
      <Label mono position={[0, 0.5, 0.135]} fontSize={0.058} color={st.sub}>
        {kind === "xp" ? "EXPÉRIENCE" : kind === "edu" ? "FORMATION" : "CERTIFICATIONS"}
      </Label>
    </group>
  );
}

const YEARS = ["2023", "2024", "2025", "2026", "2027", "2028"];

export function Career() {
  const top = P.top;
  const cx = (P.minX + P.maxX) / 2;
  const cz = (P.minZ + P.maxZ) / 2;
  const w = P.maxX - P.minX;
  const d = P.maxZ - P.minZ;
  const rampLen = Math.hypot(RAMP.toZ - RAMP.fromZ, top) + 0.1;
  const rampAngle = Math.atan2(top, RAMP.toZ - RAMP.fromZ);
  return (
    <group>
      {/* Terrasse et rampe d'accès */}
      <B p={[cx, top / 2, cz]} s={[w, top, d]} m="floorWarm" />
      <Glow p={[cx, top - 0.02, P.maxZ + 0.005]} s={[w, 0.025, 0.02]} color="amberDeep" />
      <group position={[cx, top / 2 - 0.1, (RAMP.fromZ + RAMP.toZ) / 2]} rotation={[rampAngle, 0, 0]}>
        <B s={[w, 0.2, rampLen]} m="floorWarm" />
      </group>

      {/* Frise chronologique murale */}
      <group position={[0, 2.45, -23.97]}>
        <B p={[cx, 0, 0]} s={[w - 0.6, 0.03, 0.02]} m="alu" shadow={false} />
        {YEARS.map((y, i) => {
          const x = P.minX + 0.8 + (i / (YEARS.length - 1)) * (w - 1.6);
          return (
            <group key={y} position={[x, 0, 0.01]}>
              <B p={[0, -0.08, 0]} s={[0.02, 0.16, 0.01]} m="alu" shadow={false} />
              <Label mono position={[0, 0.16, 0.01]} fontSize={0.13} color={PALETTE.alu}>
                {y}
              </Label>
            </group>
          );
        })}
        <Label mono position={[P.minX + 0.4, -0.3, 0.01]} anchorX="left" fontSize={0.1} color={PALETTE.amber} letterSpacing={0.12}>
          MUR DU PARCOURS
        </Label>
      </group>

      {CAREER_STELES.map((s) => (
        <Stele key={s.id} x={s.x} year={s.year} title={s.title} sub={s.sub} kind={s.kind} />
      ))}

      {/* Console d'annuaire (Active Directory à l'EFS) */}
      <group position={AD_CONSOLE} rotation={[0, FACE_CAMERA, 0]}>
        <B p={[0, 0.5, 0]} s={[0.5, 1.0, 0.4]} m="graphite" />
        <B p={[0, 1.12, 0.05]} s={[0.62, 0.42, 0.06]} r={[-0.3, 0, 0]} m="graphiteDark" />
        <group position={[0, 1.13, 0.09]} rotation={[-0.3, 0, 0]}>
          <Label mono position={[0, 0.1, 0]} fontSize={0.045} color={PALETTE.cyan}>
            annuaire
          </Label>
          <Label mono position={[0, 0.0, 0]} fontSize={0.035} color={PALETTE.offWhite}>
            OU=Utilisateurs
          </Label>
          <Label mono position={[0, -0.08, 0]} fontSize={0.035} color={PALETTE.alu}>
            OU=Postes
          </Label>
        </group>
      </group>

      {/* Poste en maintenance (support et MCO) */}
      <group position={SUPPORT_CART} rotation={[0, FACE_CAMERA, 0]}>
        <B p={[0, 0.75, 0]} s={[0.8, 0.04, 0.5]} m="alu" />
        <B p={[0, 0.37, 0]} s={[0.06, 0.74, 0.06]} m="aluDark" />
        <B p={[0, 0.03, 0]} s={[0.6, 0.06, 0.5]} m="graphite" />
        <B p={[-0.12, 0.98, 0]} s={[0.2, 0.42, 0.4]} m="graphiteDark" />
        <Glow p={[-0.12, 1.12, 0.201]} s={[0.1, 0.02, 0.004]} color="amber" />
        <B p={[0.22, 0.79, 0.05]} s={[0.24, 0.03, 0.18]} m="offWhite" />
        <Label mono position={[0.22, 0.81, 0.05]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color={PALETTE.graphite}>
          ticket N1
        </Label>
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2, top / 2, d / 2]} position={[cx, top / 2, cz]} />
        <CuboidCollider args={[w / 2, 0.1, rampLen / 2]} position={[cx, top / 2 - 0.1, (RAMP.fromZ + RAMP.toZ) / 2]} rotation={[rampAngle, 0, 0]} />
        {CAREER_STELES.map((s) => (
          <CuboidCollider key={s.id} args={[0.72, 1.05, 0.2]} position={[s.x, top + 1.05, STELE_Z]} />
        ))}
        <CuboidCollider args={[0.3, 0.6, 0.3]} position={[AD_CONSOLE[0], 0.6, AD_CONSOLE[2]]} />
        <CuboidCollider args={[0.42, 0.55, 0.3]} position={[SUPPORT_CART[0], 0.55, SUPPORT_CART[2]]} />
      </RigidBody>
    </group>
  );
}
