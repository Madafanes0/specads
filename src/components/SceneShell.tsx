// Capas comunes a todas las plantillas: fondo, música, grano, viñeta, wordmark y footer
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PulseProvider } from "../lib/audio";
import { baseEvents, flyerEvents, SfxTrack, type SfxEvent } from "../lib/sfx";
import { resolveAsset } from "../lib/assets";
import type { BaseProps } from "../schemas";
import { Background } from "./Background";
import { BottomShade, Footer, Wordmark } from "./Chrome";
import { FilmGrain } from "./FilmGrain";
import { LightFlash } from "./LightFlash";
import { Vignette } from "./Vignette";

type Props = {
  base: BaseProps;
  /** Contenido 3D (dentro de <Camera>) */
  world: React.ReactNode;
  /** Capas 2D sobre el mundo (slogan, etiquetas) */
  overlay?: React.ReactNode;
  /** Ventana(s) con motion blur [desde, hasta] en frames */
  blurWindow?: [number, number] | [number, number][];
  /** 0–1: intensidad del degradado inferior */
  shade?: number;
  centerY?: number;
  /** Frame del slogan (para riser + hit) */
  sloganIn?: number;
  /** Efectos propios de la plantilla */
  events?: SfxEvent[];
};

export const SceneShell: React.FC<Props> = ({ base, world, overlay, blurWindow, shade = 0, centerY = 46, sloganIn, events = [] }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const music = resolveAsset(base.music);
  const windows: [number, number][] = !blurWindow ? [] : Array.isArray(blurWindow[0]) ? (blurWindow as [number, number][]) : [blurWindow as [number, number]];
  const inBlur = windows.some(([a, b]) => frame >= a && frame <= b);
  // Fade de la música en el último medio segundo para que el loop no corte en seco
  // La música queda por debajo de los efectos para que estos se sientan
  const vol = (f: number) => interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0, 0.55, 0.55, 0], { extrapolateRight: "clamp" });
  // Beats automáticos a partir del BPM si el brief no trae beats marcados
  const beats = base.beats?.length ? base.beats : base.bpm ? Array.from({ length: Math.ceil((durationInFrames / fps) * (base.bpm / 60)) }, (_, k) => (k * 60) / base.bpm!) : undefined;
  const sfx = base.sfx ? [...(sloganIn ? baseEvents(sloganIn, fps) : []), ...flyerEvents(base.flyers, fps), ...events] : [];

  return (
    <PulseProvider music={music} beats={beats}>
      <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
        <Background brandColor={base.accentColor} palette={base.palette} centerY={centerY} />
        {/* Mismo árbol siempre: solo cambia el número de muestras (sin remontar) */}
        <CameraMotionBlur shutterAngle={180} samples={inBlur ? 6 : 1}>
          {world}
        </CameraMotionBlur>
        <BottomShade strength={shade} />
        <LightFlash color={base.accentColor} centerY={centerY} />
        <Vignette strength={0.85} />
        {/* Textos por encima de la viñeta para que queden blancos y nítidos */}
        {overlay}
        <Wordmark src={base.wordmark} brand={base.brand} height={56} />
        <Footer text={base.footer} />
        <FilmGrain opacity={0.045} />
        {music && <Audio src={music} volume={vol} />}
        <SfxTrack events={sfx} />
      </AbsoluteFill>
    </PulseProvider>
  );
};
