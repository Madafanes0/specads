// Tarjeta de anuncio de auto (estilo portal de seminuevos) + foto procedural
import React from "react";
import { Img } from "remotion";
import { rgba } from "../../lib/color";
import { FONT } from "../../lib/fonts";

// Escenas de fondo: [cielo, horizonte, piso]
const SCENES = [
  ["#cfd8e3", "#eef2f6", "#9aa3ad"], // lote de día
  ["#f3b27a", "#ffd9b0", "#7d6a5c"], // atardecer
  ["#d9d9de", "#f4f4f6", "#b8b8bf"], // estudio gris
  ["#1d2633", "#3b4a5e", "#22262c"], // noche
  ["#a9c8e8", "#e3eef8", "#8e979f"], // cielo abierto
  ["#e8e2d6", "#f7f3ea", "#a39a8b"], // concreto cálido
];
const PAINT = ["#f4f4f5", "#a1a1aa", "#3f3f46", "#111113", "#b91c1c", "#1e3a8a", "#7f1d1d", "#d4d4d8", "#334155", "#e5e7eb"];

// Siluetas laterales en un viewBox 320×200 (frente a la izquierda)
const BODIES = [
  // sedán
  { body: "M28 150 L28 128 Q30 114 52 111 L96 105 Q122 80 152 76 L204 76 Q228 79 250 101 L284 108 Q298 112 298 128 L298 150 Z", glass: "M110 103 Q128 85 152 82 L200 82 Q218 85 236 101 Z", pillar: 172, top: 82 },
  // hatchback
  { body: "M28 150 L28 126 Q32 112 56 109 L100 103 Q126 79 156 75 L238 77 Q266 84 284 112 L292 120 L292 150 Z", glass: "M114 101 Q132 84 158 81 L234 82 Q254 88 268 106 Z", pillar: 190, top: 81 },
  // SUV
  { body: "M26 150 L26 116 Q28 102 50 100 L92 96 Q108 70 132 66 L252 66 Q272 68 284 94 L294 104 L294 150 Z", glass: "M102 96 Q116 74 134 72 L248 72 Q262 74 274 96 Z", pillar: 186, top: 72 },
];

export const CarPhoto: React.FC<{ variant: number; src?: string | null }> = ({ variant, src }) => {
  if (src) return <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  const [sky, horizon, ground] = SCENES[variant % SCENES.length];
  const paint = PAINT[(variant * 7) % PAINT.length];
  const b = BODIES[(variant * 5) % BODIES.length];
  const flip = variant % 2 === 1;
  const id = `cp${variant}`;
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky} />
          <stop offset="0.68" stopColor={horizon} />
          <stop offset="0.69" stopColor={ground} />
          <stop offset="1" stopColor={ground} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${id}s)`} />
      <g transform={flip ? "translate(320 0) scale(-1 1)" : undefined}>
        <ellipse cx="163" cy="168" rx="150" ry="10" fill="#000" opacity="0.28" />
        <path d={b.body} fill={paint} />
        <path d={b.body} fill={`url(#${id}b)`} />
        <path d={b.glass} fill="#1b2430" opacity="0.92" />
        <rect x={b.pillar} y={b.top} width="7" height={104 - b.top} fill={paint} />
        <rect x="270" y="114" width="20" height="7" rx="3" fill="#fca5a5" opacity="0.8" />
        <rect x="30" y="118" width="18" height="6" rx="3" fill="#fff7d6" />
        {[85, 240].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="150" r="25" fill="#111" />
            <circle cx={cx} cy="150" r="13" fill="#9ca3af" />
            <circle cx={cx} cy="150" r="5" fill="#374151" />
          </g>
        ))}
      </g>
    </svg>
  );
};

type Props = {
  w: number;
  model: string;
  year: string | number;
  km: string;
  city?: string;
  price: string;
  oldPrice?: string;
  portal: string;
  variant: number;
  src?: string | null;
  /** Nivel de detalle: "lite" para las capas lejanas y desenfocadas */
  lite?: boolean;
  /** 0–1: anuncio descartado por la mira (se apaga) */
  off?: number;
  /** 0–1: destello verde del escaneo */
  scan?: number;
  /** 0–1: el anuncio que coincide (borde y glow verdes) */
  lit?: number;
  accent: string;
};

export const AdCard: React.FC<Props> = ({ w, model, year, km, city, price, oldPrice, portal, variant, src, lite, off = 0, scan = 0, lit = 0, accent }) => {
  const u = w / 340;
  const h = 430 * u;
  const ring = Math.max(scan * 0.9, lit);
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        borderRadius: 24 * u,
        background: "#fafafa",
        overflow: "hidden",
        fontFamily: FONT,
        boxShadow: [
          `0 ${24 * u}px ${50 * u}px rgba(0,0,0,0.45)`,
          ring > 0 ? `0 0 0 ${6 * u}px ${rgba(accent, ring)}` : "",
          lit > 0 ? `0 0 ${120 * u}px ${30 * u}px ${rgba(accent, 0.55 * lit)}` : "",
        ]
          .filter(Boolean)
          .join(", "),
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "relative", height: h * 0.56, background: "#d4d4d8" }}>
        <CarPhoto variant={variant} src={src} />
        {!lite && (
          <div
            style={{
              position: "absolute",
              left: 14 * u,
              top: 14 * u,
              padding: `${6 * u}px ${12 * u}px`,
              borderRadius: 999,
              background: "rgba(17,17,17,0.78)",
              color: "#fff",
              fontSize: 17 * u,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            {portal}
          </div>
        )}
      </div>
      {lite ? (
        // Versión ligera: solo bloques, se ve igual de lejos y desenfocada
        <div style={{ padding: 22 * u, display: "flex", flexDirection: "column", gap: 14 * u }}>
          <div style={{ height: 22 * u, width: "72%", borderRadius: 6, background: "#27272a" }} />
          <div style={{ height: 16 * u, width: "50%", borderRadius: 6, background: "#a1a1aa" }} />
          <div style={{ height: 30 * u, width: "58%", borderRadius: 6, background: "#111" }} />
        </div>
      ) : (
        <div style={{ padding: `${18 * u}px ${22 * u}px`, color: "#111" }}>
          <div style={{ fontSize: 28 * u, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden" }}>
            {model} {year}
          </div>
          <div style={{ marginTop: 6 * u, fontSize: 19 * u, fontWeight: 500, color: "#71717a", whiteSpace: "nowrap" }}>
            {km}
            {city ? ` · ${city}` : ""}
          </div>
          <div style={{ marginTop: 14 * u, display: "flex", alignItems: "baseline", gap: 12 * u }}>
            <div style={{ fontSize: 40 * u, fontWeight: 800, letterSpacing: "-0.03em", color: lit > 0.5 ? accent : "#111" }}>{price}</div>
            {oldPrice && <div style={{ fontSize: 22 * u, fontWeight: 600, color: "#a1a1aa", textDecoration: "line-through" }}>{oldPrice}</div>}
          </div>
        </div>
      )}
      {/* Descartado: se apaga hacia el fondo */}
      {off > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(8,8,8,${0.72 * off})` }} />}
    </div>
  );
};
