// Efectos de sonido sincronizados a frames. Los archivos están en public/audio/sfx
// (generados con scripts/make-sounds.sh).
import { Audio } from "@remotion/media";
import React from "react";
import { Sequence } from "remotion";
import { resolveAsset } from "./assets";

export type SfxName =
  | "whoosh"
  | "whoosh-big"
  | "swipe"
  | "impact"
  | "riser"
  | "hit"
  | "pop"
  | "tap"
  | "type"
  | "tick"
  | "success"
  | "coin"
  | "thud"
  | "ping"
  | "flap"
  | "rise";

export type SfxEvent = { at: number; name: SfxName; volume?: number; rate?: number };

// Volumen base de cada efecto (mezcla general)
const MIX: Record<SfxName, number> = {
  whoosh: 0.35,
  "whoosh-big": 0.5,
  swipe: 0.3,
  impact: 0.75,
  riser: 0.4,
  hit: 0.7,
  pop: 0.35,
  tap: 0.45,
  type: 0.25,
  tick: 0.2,
  success: 0.45,
  coin: 0.4,
  thud: 0.55,
  ping: 0.35,
  flap: 0.5,
  rise: 0.3,
};

const LEN: Partial<Record<SfxName, number>> = { impact: 110, riser: 95, hit: 100, "whoosh-big": 90, ping: 90, success: 60, coin: 55 };

/** Reproduce una lista de eventos. Va fuera de <CameraMotionBlur>. */
export const SfxTrack: React.FC<{ events: SfxEvent[] }> = ({ events }) => (
  <>
    {events.map((e, i) => {
      const src = resolveAsset(`audio/sfx/${e.name}.wav`);
      if (!src || e.at < 0) return null;
      return (
        <Sequence key={`${e.name}-${i}`} from={Math.round(e.at)} durationInFrames={LEN[e.name] ?? 50} layout="none">
          <Audio src={src} volume={(e.volume ?? 1) * MIX[e.name]} playbackRate={e.rate ?? 1} />
        </Sequence>
      );
    })}
  </>
);

/** Eventos comunes a todas las plantillas: impacto del hook, riser y golpe del slogan */
export const baseEvents = (sloganIn: number, fps: number): SfxEvent[] => [
  { at: 0, name: "impact" },
  { at: 2, name: "whoosh-big", volume: 0.6 },
  { at: sloganIn - Math.round(1.5 * fps) + 4, name: "riser" },
  { at: sloganIn, name: "hit" },
];

/** Sonidos de los voladores: aleteos o paso del avión */
export const flyerEvents = (flyers: { kind: string; from: number; to: number }[], fps: number): SfxEvent[] =>
  flyers.flatMap((f) => {
    const a = Math.round(f.from * fps);
    const b = Math.round(f.to * fps);
    if (f.kind === "owl") {
      const out: SfxEvent[] = [{ at: a, name: "whoosh", volume: 0.8 }];
      for (let k = a + 6; k < Math.min(b, a + 3 * fps); k += 22) out.push({ at: k, name: "flap", volume: 0.7, rate: 0.9 + ((k / 22) % 3) * 0.1 });
      return out;
    }
    return [{ at: a, name: "whoosh-big", volume: 0.7 }, { at: Math.round((a + b) / 2), name: "whoosh", volume: 0.6, rate: 0.8 }];
  });
