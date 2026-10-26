// Viñeta fuerte para cerrar el cuadro hacia los bordes
import React from "react";
import { AbsoluteFill } from "remotion";

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.9 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 62% at 50% 48%, transparent 40%, rgba(0,0,0,${strength * 0.55}) 75%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);
