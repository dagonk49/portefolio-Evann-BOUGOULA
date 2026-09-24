"use client";
import { Environment } from "./Environment";
import { Island } from "./Island";
import { Letters } from "./Letters";
import { PhysicsProps } from "./Props";
import { ControlsBoard, IndexKiosk, MissionSign, Signpost } from "./Spawn";
import { Bay } from "./bay/Bay";
import { Desk } from "./Desk";
import { Cluster } from "./Cluster";
import { Career } from "./Career";
import { ActivePrompt, Pads } from "./Pads";
import { Anomalies } from "./Anomalies";
import { InteractionSystem } from "./InteractionSystem";
import { PlayerController } from "../player/PlayerController";
import { StaticBatch } from "./StaticBatch";

export function World({ reducedMotion, quality, paused }: { reducedMotion: boolean; quality: "high" | "low"; paused: boolean }) {
  return (
    <>
      <Environment shadows={quality === "high"} />
      <StaticBatch>
        <Island />
        <ControlsBoard />
        <IndexKiosk />
        <Signpost />
        <MissionSign />
        <Bay reducedMotion={reducedMotion} />
        <Desk />
        <Cluster reducedMotion={reducedMotion} />
        <Career />
      </StaticBatch>
      <Letters />
      <PhysicsProps />
      <Pads reducedMotion={reducedMotion} />
      <Anomalies reducedMotion={reducedMotion} quality={quality} />
      <ActivePrompt />
      <PlayerController reducedMotion={reducedMotion} paused={paused} />
      <InteractionSystem />
    </>
  );
}
