// Plantilla principal: logo central con glow + tarjetas flotantes + slogan
import React from "react";
import { useVideoConfig } from "remotion";
import { Camera, Node3D } from "../components/Camera";
import { CardField, cardDelays } from "../components/CardField";
import { FlyerLayer } from "../components/Flyer";
import { useFocusDim } from "../components/Chrome";
import { GlowLogo } from "../components/GlowLogo";
import { KineticHeadline } from "../components/KineticHeadline";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import { SceneShell } from "../components/SceneShell";
import { getBeats, snapToBeat } from "../presets/beats";
import type { HeroLogoProps } from "../schemas";

export const HeroLogo: React.FC<HeroLogoProps> = (props) => {
  const { fps } = useVideoConfig();
  const sloganSec = snapToBeat(Math.max(props.durationSec * 0.75, 3.2), props.beats);
  const b = getBeats(props.durationSec, fps, sloganSec);
  const dim = useFocusDim(b.sloganIn);
  // Cada tarjeta: whoosh al entrar y pop al asentarse
  const events = cardDelays(props.cardCount, b.cardsStart, b.cardsEnd).flatMap((d, i) => [
    { at: d - 4, name: "whoosh" as const, rate: 0.9 + (i % 4) * 0.07 },
    { at: d + 14, name: "pop" as const, volume: 0.6, rate: 0.85 + (i % 3) * 0.1 },
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
          {props.grid && <PerspectiveGrid color={props.accentColor} y={640} />}
          <CardField
            images={props.images}
            layout={props.layout}
            count={props.cardCount}
            start={b.cardsStart}
            end={b.cardsEnd}
            color={props.brandColor}
            accent={props.accentColor}
            dim={dim}
            variant={props.cardStyle}
            captions={props.captions}
          />
          <FlyerLayer flyers={props.flyers} color={props.brandColor} accent={props.accentColor} />
          <Node3D z={60}>
            <GlowLogo logo={props.logo} brand={props.brand} color={props.brandColor} accent={props.accentColor} dim={0.85 + 0.15 * dim} />
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
