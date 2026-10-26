// Mockups de app flotando en 3D alrededor del logo (producto / SaaS)
import React from "react";
import { useVideoConfig } from "remotion";
import { Camera, Node3D } from "../components/Camera";
import { CardField, cardDelays } from "../components/CardField";
import { FlyerLayer } from "../components/Flyer";
import { useFocusDim } from "../components/Chrome";
import { GlowLogo } from "../components/GlowLogo";
import { KineticHeadline } from "../components/KineticHeadline";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import { PhoneScreen } from "../components/PhoneScreen";
import { SceneShell } from "../components/SceneShell";
import { getBeats, snapToBeat } from "../presets/beats";
import type { AppShowcaseProps } from "../schemas";

export const AppShowcase: React.FC<AppShowcaseProps> = (props) => {
  const { fps } = useVideoConfig();
  const b = getBeats(props.durationSec, fps, snapToBeat(Math.max(props.durationSec * 0.75, 3.2), props.beats));
  const dim = useFocusDim(b.sloganIn);
  const events = cardDelays(5, b.cardsStart, b.cardsEnd).flatMap((d, i) => [
    { at: d - 4, name: "whoosh" as const, rate: 0.9 + (i % 4) * 0.07 },
    { at: d + 14, name: "tap" as const, volume: 0.7 },
  ]);

  return (
    <SceneShell
      base={props}
      blurWindow={[b.cardsStart, b.cardsEnd + 20]}
      shade={1 - (dim - 0.7) / 0.3}
      sloganIn={b.sloganIn}
      events={events}
      world={
        <Camera zoomFrom={b.driftStart} zoomTo={b.sloganIn + 30}>
          {props.grid && <PerspectiveGrid color={props.accentColor} y={680} />}
          <CardField
            images={[]}
            layout={props.layout}
            count={5}
            start={b.cardsStart}
            end={b.cardsEnd}
            color={props.brandColor}
            accent={props.accentColor}
            dim={dim}
            radius={50}
            spread={0.8}
            // Proporción de teléfono (9:19.5)
            sizeOf={(i) => ({ w: i < 4 ? 290 : 250, h: i < 4 ? 610 : 530 })}
            renderContent={(i) => <PhoneScreen src={props.screens[i % Math.max(1, props.screens.length)]} accent={props.accentColor} seed={i + 1} brand={props.brand} />}
          />
          <FlyerLayer flyers={props.flyers} color={props.brandColor} accent={props.accentColor} />
          <Node3D z={80}>
            <GlowLogo logo={props.logo} brand={props.brand} color={props.brandColor} accent={props.accentColor} size={280} dim={0.85 + 0.15 * dim} />
          </Node3D>
        </Camera>
      }
      overlay={
        <>
          <KineticHeadline text={props.headline} start={b.sloganIn} glow={props.accentColor} />
        </>
      }
    />
  );
};
