// Título del paso arriba: "STEP 01" + título + caption, con relevo entre pasos
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../../lib/fonts";
import { SPRINGS } from "../../presets/springs";

type Props = { index: number; total: number; title: string; caption: string; start: number; end: number; color: string };

export const StepHeader: React.FC<Props> = ({ index, total, title, caption, start, end, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < start - 2 || frame > end + 16) return null;
  const pin = spring({ frame: frame - start - 4, fps, config: SPRINGS.soft });
  const pout = interpolate(frame, [end - 4, end + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = (k: number) => {
    const p = spring({ frame: frame - start - 4 - k * 4, fps, config: SPRINGS.soft });
    return {
      opacity: Math.min(1, p * 1.6) * (1 - pout),
      transform: `translateY(${(1 - p) * 40 - pout * 30}px)`,
      filter: `blur(${(1 - Math.min(1, p)) * 12 + pout * 10}px)`,
    } as React.CSSProperties;
  };
  return (
    <div style={{ position: "absolute", top: 196, left: 60, right: 60, textAlign: "center", fontFamily: FONT, opacity: pin > 0 ? 1 : 0 }}>
      <div style={{ ...line(0), fontSize: 22, fontWeight: 800, letterSpacing: "0.3em", color }}>
        {String(index + 1).padStart(2, "0")} <span style={{ opacity: 0.45 }}>/ {String(total).padStart(2, "0")}</span>
      </div>
      <div style={{ ...line(1), fontSize: 64, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", lineHeight: 1.05, marginTop: 10 }}>{title}</div>
      <div style={{ ...line(2), fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginTop: 10, lineHeight: 1.25 }}>{caption}</div>
    </div>
  );
};
