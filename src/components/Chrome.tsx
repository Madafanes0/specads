// Elementos fijos de pantalla: wordmark arriba, footer abajo, dimmer de foco
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../lib/assets";
import { FONT } from "../lib/fonts";
import { SPRINGS } from "../presets/springs";

export const Wordmark: React.FC<{ src?: string; brand: string; delay?: number; height?: number }> = ({ src, brand, delay = 18, height = 46 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: SPRINGS.soft });
  const url = resolveAsset(src);
  const style: React.CSSProperties = {
    position: "absolute",
    top: 118,
    left: "50%",
    transform: `translate(-50%, ${interpolate(p, [0, 1], [-16, 0])}px)`,
    opacity: p * 0.92,
  };
  return url ? (
    <Img src={url} style={{ ...style, height }} />
  ) : (
    <div style={{ ...style, fontFamily: FONT, fontWeight: 700, fontSize: height * 0.8, color: "#fff", letterSpacing: "-0.02em" }}>{brand}</div>
  );
};

export const Footer: React.FC<{ text: string; delay?: number }> = ({ text, delay = 30 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 128,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 25,
        letterSpacing: "0.02em",
        color: `rgba(255,255,255,${0.4 * o})`,
      }}
    >
      {text}
    </div>
  );
};

/** Valor 1 → 0.7 cuando entra el slogan (para bajar el brillo del resto) */
export const useFocusDim = (sloganIn: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - (sloganIn - 6), fps, config: SPRINGS.soft });
  return 1 - 0.3 * p;
};

/** Degradado inferior para legibilidad del slogan */
export const BottomShade: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `linear-gradient(180deg, transparent 52%, rgba(0,0,0,${0.55 * strength}) 78%, rgba(0,0,0,${0.75 * strength}) 100%)`,
    }}
  />
);
