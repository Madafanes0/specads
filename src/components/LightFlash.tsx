// Flash de luz del hook: estallido radial que se apaga en ~0.4 s
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { rgba } from "../lib/color";

export const LightFlash: React.FC<{ color: string; at?: number; centerY?: number }> = ({ color, at = 0, centerY = 46 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 40) return null;
  const o = interpolate(f, [0, 3, 40], [0, 1, 0], { extrapolateRight: "clamp" });
  const r = interpolate(f, [0, 40], [180, 1100]);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: o,
        mixBlendMode: "screen",
        background: `radial-gradient(circle ${r}px at 50% ${centerY}%, rgba(255,255,255,0.9), ${rgba(color, 0.45)} 35%, transparent 75%)`,
      }}
    />
  );
};
