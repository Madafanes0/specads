// Pin de ubicación con glow (se usa de pie, como billboard, sobre el mapa)
import React from "react";
import { rgba } from "../lib/color";

export const Pin: React.FC<{ color: string; accent: string; size?: number; glow?: number }> = ({ color, accent, size = 150, glow = 1 }) => (
  <svg
    width={size}
    height={size * 1.3}
    viewBox="0 0 100 130"
    style={{
      position: "absolute",
      left: -size / 2,
      top: -size * 1.3,
      overflow: "visible",
      filter: `drop-shadow(0 0 12px ${rgba(accent, 0.9 * glow)}) drop-shadow(0 0 40px ${rgba(accent, 0.6 * glow)})`,
    }}
  >
    <defs>
      <linearGradient id="pinFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={color} />
        <stop offset="1" stopColor={accent} />
      </linearGradient>
    </defs>
    <path d="M50 128C50 128 6 76 6 46a44 44 0 0 1 88 0c0 30-44 82-44 82Z" fill="url(#pinFill)" />
    <path d="M50 128C50 128 6 76 6 46a44 44 0 0 1 44-44" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
    <circle cx="50" cy="46" r="17" fill="#0a0a0d" />
  </svg>
);
