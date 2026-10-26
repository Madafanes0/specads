// Barra 3D (cuboide CSS) que crece desde el piso, con reflejo de luz en el suelo
import React from "react";
import { mix, rgba } from "../lib/color";

type Props = { x: number; floorY: number; z?: number; height: number; width?: number; depth?: number; color: string; glow?: number };

export const Bar3D: React.FC<Props> = ({ x, floorY, z = 0, height, width = 190, depth = 190, color, glow = 1 }) => {
  const H = Math.max(2, height);
  const face: React.CSSProperties = { position: "absolute", backfaceVisibility: "hidden" };
  const light = mix(color, "#ffffff", 0.35);
  const dark = mix(color, "#000000", 0.55);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `translate3d(${x}px, ${floorY}px, ${z}px)` }}>
      {/* Reflejo de luz sobre el piso */}
      <div
        style={{
          ...face,
          left: -width * 1.6,
          top: -depth * 1.6,
          width: width * 3.2,
          height: depth * 3.2,
          transform: "rotateX(90deg)",
          background: `radial-gradient(ellipse, ${rgba(color, 0.45 * glow)}, transparent 65%)`,
        }}
      />
      {/* Frente */}
      <div
        style={{
          ...face,
          left: -width / 2,
          top: -H,
          width,
          height: H,
          transform: `translateZ(${depth / 2}px)`,
          background: `linear-gradient(180deg, ${light} 0%, ${color} 35%, ${mix(color, "#000", 0.35)} 100%)`,
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.5), 0 0 ${60 * glow}px ${rgba(color, 0.35 * glow)}`,
        }}
      />
      {/* Atrás */}
      <div style={{ ...face, left: -width / 2, top: -H, width, height: H, transform: `rotateY(180deg) translateZ(${depth / 2}px)`, background: dark }} />
      {/* Lado izquierdo */}
      <div
        style={{
          ...face,
          left: -depth / 2,
          top: -H,
          width: depth,
          height: H,
          transform: `rotateY(-90deg) translateZ(${width / 2}px)`,
          background: `linear-gradient(180deg, ${mix(color, "#000", 0.25)}, ${mix(color, "#000", 0.65)})`,
        }}
      />
      {/* Lado derecho */}
      <div
        style={{
          ...face,
          left: -depth / 2,
          top: -H,
          width: depth,
          height: H,
          transform: `rotateY(90deg) translateZ(${width / 2}px)`,
          background: `linear-gradient(180deg, ${mix(color, "#000", 0.4)}, ${mix(color, "#000", 0.8)})`,
        }}
      />
      {/* Tapa */}
      <div
        style={{
          ...face,
          left: -width / 2,
          top: -depth / 2,
          width,
          height: depth,
          transform: `translateY(${-H}px) rotateX(90deg)`,
          background: `linear-gradient(135deg, #ffffff, ${light})`,
          boxShadow: `0 0 ${40 * glow}px ${rgba(color, 0.8 * glow)}`,
        }}
      />
    </div>
  );
};
