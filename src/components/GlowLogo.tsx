// Logo central con bloom en capas + pulso de luz al aparecer y con la música
import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { usePulse } from "../lib/audio";
import { resolveAsset } from "../lib/assets";
import { rgba } from "../lib/color";
import { FONT } from "../lib/fonts";
import { SPRINGS } from "../presets/springs";

type Props = {
  logo?: string;
  brand: string;
  color: string;
  accent: string;
  size?: number;
  delay?: number;
  /** Brillo general (baja cuando entra el slogan) */
  dim?: number;
};

export const GlowLogo: React.FC<Props> = ({ logo, brand, color, accent, size = 340, delay = 2, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = usePulse();
  const src = resolveAsset(logo);

  // Entrada desde 0.6 con overshoot
  const p = spring({ frame: frame - delay, fps, config: SPRINGS.pop });
  const scale = interpolate(p, [0, 1], [0.6, 1]) * (1 + pulse * 0.025);
  const opacity = interpolate(frame - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blurIn = interpolate(frame - delay, [0, 14], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulso de luz inicial + respiración continua + música
  const hit = interpolate(frame - delay, [0, 8, 45], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 0.8);
  const glow = (0.55 + breathe * 0.12 + hit * 0.9 + pulse * 0.35) * dim;

  const shadow = [
    `drop-shadow(0 0 ${6 + hit * 10}px ${rgba(color, Math.min(1, 0.9 * glow))})`,
    `drop-shadow(0 0 ${28 + hit * 30}px ${rgba(color, Math.min(1, 0.6 * glow))})`,
    `drop-shadow(0 0 ${70 + hit * 60}px ${rgba(accent, Math.min(1, 0.45 * glow))})`,
  ].join(" ");

  const content = src ? (
    <Img src={src} style={{ width: size, height: size, objectFit: "contain" }} />
  ) : (
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size * 0.42, color, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
      {brand}
    </div>
  );

  return (
    <div style={{ position: "absolute", transform: "translate(-50%, -50%)", transformStyle: "preserve-3d" }}>
      {/* Halo difuso detrás (bloom grande) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 2.6,
          height: size * 2.6,
          transform: `translate(-50%, -50%) scale(${0.8 + hit * 0.5 + pulse * 0.1})`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(accent, 0.32 * glow)} 0%, ${rgba(color, 0.12 * glow)} 35%, transparent 68%)`,
          opacity,
        }}
      />
      <div
        style={{
          position: "relative",
          transform: `scale(${scale})`,
          opacity,
          filter: `${shadow} blur(${blurIn}px) brightness(${dim})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content}
      </div>
    </div>
  );
};
