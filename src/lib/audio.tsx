// Pulso sincronizado con la música: beats marcados en el brief o amplitud real
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import React, { createContext, useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const PulseContext = createContext(0);

/** Valor 0–1 del pulso musical en el frame actual */
export const usePulse = () => useContext(PulseContext);

/** Pulso que decae rápido después de cada beat marcado */
export const beatPulseFromMarks = (frame: number, fps: number, beats: number[]) => {
  let v = 0;
  for (const b of beats) {
    const d = frame - b * fps;
    if (d >= 0 && d < fps * 0.5) v = Math.max(v, Math.exp(-d / (fps * 0.09)));
  }
  return v;
};

const MarksPulse: React.FC<{ beats: number[]; children: React.ReactNode }> = ({ beats, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <PulseContext.Provider value={beatPulseFromMarks(frame, fps, beats)}>{children}</PulseContext.Provider>;
};

const AmplitudePulse: React.FC<{ src: string; children: React.ReactNode }> = ({ src, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = useAudioData(src);
  let v = 0;
  if (data) {
    const bins = visualizeAudio({ fps, frame, audioData: data, numberOfSamples: 32 });
    const bass = (bins[0] + bins[1] + bins[2]) / 3;
    v = interpolate(bass, [0.08, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return <PulseContext.Provider value={v}>{children}</PulseContext.Provider>;
};

/**
 * Prioridad: beats del brief → amplitud de graves de la música → sin pulso.
 */
export const PulseProvider: React.FC<{ music: string | null; beats?: number[]; children: React.ReactNode }> = ({
  music,
  beats,
  children,
}) => {
  if (beats && beats.length) return <MarksPulse beats={beats}>{children}</MarksPulse>;
  if (music) return <AmplitudePulse src={music}>{children}</AmplitudePulse>;
  return <>{children}</>;
};
