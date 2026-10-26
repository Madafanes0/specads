// Fondo con profundidad: gradiente radial tintado con el color de marca
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, rgba } from "../lib/color";
import { PALETTES, type PaletteName } from "../presets/palettes";

export const Background: React.FC<{ brandColor: string; palette?: PaletteName; centerY?: number }> = ({
  brandColor,
  palette = "noir",
  centerY = 46,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = PALETTES[palette];
  // Centro: mezcla de la paleta con un toque de la marca
  const center = mix(p.bgCenter, brandColor, 0.18);
  // Respiración lenta del halo central
  const breathe = 1 + Math.sin((frame / fps) * 0.9) * 0.03;
  return (
    <AbsoluteFill style={{ background: p.bgEdge }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${78 * breathe}% ${52 * breathe}% at 50% ${centerY}%, ${center} 0%, ${mix(
            center,
            p.bgEdge,
            0.55,
          )} 45%, ${p.bgEdge} 100%)`,
        }}
      />
      {/* Halo de color de marca muy difuso */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 520px at 50% ${centerY}%, ${rgba(brandColor, 0.1)}, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
