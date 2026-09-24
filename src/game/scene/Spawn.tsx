"use client";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { PALETTE } from "../materials";
import { CONTROLS_BOARD, FACE_CAMERA, fromScreen, INDEX_KIOSK, type Vec3 } from "../layout";
import { B, Glow, Label } from "./primitives";

function Board({ p, children, width = 2.7, height = 1.75 }: { p: Vec3; children: React.ReactNode; width?: number; height?: number }) {
  return (
    <group position={p} rotation={[0, FACE_CAMERA, 0]}>
      <B p={[-width / 2 + 0.12, 0.7, -0.05]} s={[0.1, 1.4, 0.1]} m="aluDark" />
      <B p={[width / 2 - 0.12, 0.7, -0.05]} s={[0.1, 1.4, 0.1]} m="aluDark" />
      <B p={[0, 0.72 + height / 2, 0]} s={[width, height, 0.08]} m="graphite" />
      <Glow p={[0, 0.72 + height - 0.03, 0.045]} s={[width - 0.1, 0.03, 0.01]} color="amber" />
      <group position={[0, 0.72 + height / 2, 0.05]}>{children}</group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[width / 2, 0.9, 0.1]} position={[0, 0.9, -0.02]} />
      </RigidBody>
    </group>
  );
}

const CONTROLS: [string, string][] = [
  ["ZQSD · WASD · flèches", "se déplacer"],
  ["Maj", "courir"],
  ["Espace", "sauter"],
  ["E · Entrée", "interagir"],
  ["Échap", "pause · fermer"],
  ["I · H · C", "index · aide · recentrer"],
];

export function ControlsBoard() {
  return (
    <Board p={CONTROLS_BOARD}>
      <Label mono position={[-1.2, 0.68, 0]} anchorX="left" fontSize={0.12} color={PALETTE.amber} letterSpacing={0.14}>
        COMMANDES
      </Label>
      {CONTROLS.map(([k, v], i) => (
        <group key={k} position={[0, 0.4 - i * 0.21, 0]}>
          <Label mono position={[-1.2, 0, 0]} anchorX="left" fontSize={0.105} color={PALETTE.offWhite}>
            {k}
          </Label>
          <Label position={[0.25, 0, 0]} anchorX="left" fontSize={0.105} color={PALETTE.alu}>
            {v}
          </Label>
        </group>
      ))}
      <Label position={[-1.2, -0.8, 0]} anchorX="left" fontSize={0.085} color={PALETTE.alu} maxWidth={2.4}>
        Manette : stick, A sauter, X interagir · Tactile : joystick et boutons
      </Label>
    </Board>
  );
}

export function IndexKiosk() {
  return (
    <group position={INDEX_KIOSK} rotation={[0, FACE_CAMERA, 0]}>
      <B p={[0, 0.5, 0]} s={[0.7, 1.0, 0.5]} m="graphite" />
      <B p={[0, 1.08, 0.02]} s={[0.9, 0.62, 0.1]} r={[-0.35, 0, 0]} m="graphiteDark" />
      <group position={[0, 1.09, 0.08]} rotation={[-0.35, 0, 0]}>
        <Label mono position={[0, 0.16, 0]} fontSize={0.1} color={PALETTE.cyan} letterSpacing={0.14}>
          INDEX
        </Label>
        <Label position={[0, -0.02, 0]} fontSize={0.075} color={PALETTE.offWhite} maxWidth={0.78} textAlign="center">
          Tout le parcours, sans jouer
        </Label>
      </group>
      <Glow p={[0, 0.02, 0.26]} s={[0.7, 0.02, 0.02]} color="cyan" />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.4, 0.7, 0.3]} position={[0, 0.7, 0]} />
      </RigidBody>
    </group>
  );
}

/** Poteau indicateur vers les zones. */
export function Signpost() {
  const base = fromScreen(4.2, -3.6);
  const arrows: { text: string; angle: number; color: string }[] = [
    { text: "Baie réseau", angle: Math.PI, color: PALETTE.cyanDeep },
    { text: "Bureau", angle: 0, color: PALETTE.amberDeep },
    { text: "HomeLab", angle: Math.PI * 0.72, color: PALETTE.graphite },
    { text: "Parcours", angle: Math.PI * 0.28, color: PALETTE.graphite },
  ];
  return (
    <group position={base}>
      <B p={[0, 1.2, 0]} s={[0.1, 2.4, 0.1]} m="aluDark" />
      {arrows.map((a, i) => {
        // Rotation dans le plan écran : 0 = droite, π/2 = haut.
        const dir = fromScreen(Math.cos(a.angle), Math.sin(a.angle));
        const yaw = Math.atan2(dir[0], dir[2]) - Math.PI / 2;
        return (
          <group key={a.text} position={[0, 2.15 - i * 0.28, 0]} rotation={[0, yaw, 0]}>
            <B p={[0.55, 0, 0]} s={[1.0, 0.22, 0.05]} m={a.color === PALETTE.graphite ? "graphite" : a.color === PALETTE.cyanDeep ? "cyanDeep" : "amberDeep"} />
            <Label position={[0.55, 0, 0.03]} fontSize={0.11} color={PALETTE.offWhite}>
              {a.text}
            </Label>
            <Label position={[0.55, 0, -0.03]} rotation={[0, Math.PI, 0]} fontSize={0.11} color={PALETTE.offWhite}>
              {a.text}
            </Label>
          </group>
        );
      })}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.08, 1.2, 0.08]} position={[0, 1.2, 0]} />
      </RigidBody>
    </group>
  );
}

/** Rappel de la mission près de l'accueil. */
export function MissionSign() {
  const p = fromScreen(-8.6, -1.2);
  return (
    <Board p={p} width={2.1} height={1.0}>
      <Label mono position={[-0.92, 0.3, 0]} anchorX="left" fontSize={0.1} color={PALETTE.cyan} letterSpacing={0.14}>
        MISSION
      </Label>
      <Label position={[-0.92, 0.06, 0]} anchorX="left" fontSize={0.13} color={PALETTE.offWhite} maxWidth={1.9}>
        Remettre le poste du lab en ligne
      </Label>
      <Label position={[-0.92, -0.26, 0]} anchorX="left" fontSize={0.085} color={PALETTE.alu} maxWidth={1.9}>
        Commence par la baie réseau, à gauche.
      </Label>
    </Board>
  );
}
