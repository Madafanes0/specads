// Mascotas y objetos que vuelan por la escena en 3D (búho, avión, avión de papel o imagen propia).
// Cada uno sigue una trayectoria (orbit, swoop, flyby, perch) y deja una estela de destellos.
import React from "react";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../lib/assets";
import { mix, rgba } from "../lib/color";

export type FlyerKind = "owl" | "plane" | "paperplane";
export type FlightPath = "orbit" | "swoop" | "flyby" | "perch";

type Props = {
  kind: FlyerKind;
  path: FlightPath;
  /** Frames de inicio y fin del vuelo */
  from: number;
  to: number;
  color: string;
  accent: string;
  scale?: number;
  /** Imagen propia (svg/png en public/) que reemplaza al personaje */
  src?: string;
  /** Destino para "perch" (coordenadas del mundo) */
  target?: { x: number; y: number };
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (u: number) => u * u * (3 - 2 * u);

/** Posición en el mundo para u ∈ [0, 1] (y local en frames para el idle) */
export const flightPos = (path: FlightPath, u: number, target = { x: 220, y: -520 }) => {
  switch (path) {
    case "orbit": {
      // Una vuelta y cuarto alrededor del centro: pasa por delante y por detrás
      const a = -Math.PI / 2 + u * Math.PI * 2.5;
      return { x: Math.cos(a) * 460, y: -120 + Math.sin(a * 2) * 90 - u * 120, z: Math.sin(a) * 420 };
    }
    case "swoop": {
      // Entra por abajo a la izquierda, sube en curva hacia la cámara y sale arriba a la derecha
      const x = interpolate(u, [0, 0.5, 1], [-820, -40, 860]);
      const y = interpolate(u, [0, 0.5, 1], [700, -40, -780]) + Math.sin(u * Math.PI) * -120;
      const z = Math.sin(u * Math.PI) * 380;
      return { x, y, z };
    }
    case "flyby": {
      const x = interpolate(u, [0, 1], [-900, 900]);
      return { x, y: -250 + Math.sin(u * Math.PI) * -60, z: 40 + Math.sin(u * Math.PI) * 200 };
    }
    case "perch": {
      // Llega desde arriba a la derecha y se posa en el destino
      const k = ease(Math.min(1, u / 0.55));
      return {
        x: interpolate(k, [0, 1], [820, target.x]),
        y: interpolate(k, [0, 1], [-1000, target.y]) - Math.sin(k * Math.PI) * 160,
        z: interpolate(k, [0, 1], [-300, 140]),
      };
    }
  }
};

/** Búho cartoon original: alas articuladas, parpadeo y patitas */
const Owl: React.FC<{ color: string; flap: number; blink: number; landed: number }> = ({ color, flap, blink, landed }) => {
  const dark = mix(color, "#000000", 0.28);
  const belly = mix(color, "#ffffff", 0.35);
  const wing = (side: 1 | -1) => (
    <g transform={`translate(${100 + side * 62} 128) rotate(${side * (flap * 55 - 10 + landed * 40)})`}>
      <path d={`M0 0 Q ${side * 52} -6 ${side * 58} 46 Q ${side * 30} 52 0 34 Z`} fill={dark} />
      <path d={`M${side * 14} 8 Q ${side * 44} 8 ${side * 48} 38`} fill="none" stroke={mix(dark, "#000", 0.2)} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 200 230" width="200" height="230" style={{ overflow: "visible" }}>
      {wing(-1)}
      {wing(1)}
      {/* Cuerpo y orejitas */}
      <path d="M42 70 L48 22 L78 48 Q100 40 122 48 L152 22 L158 70 Q172 120 158 170 Q140 206 100 206 Q60 206 42 170 Q28 120 42 70 Z" fill={color} />
      <ellipse cx="100" cy="160" rx="42" ry="38" fill={belly} />
      {/* Ojos con parpadeo */}
      {[70, 130].map((cx, k) => (
        <g key={k}>
          <circle cx={cx} cy="92" r="30" fill="#fff" />
          <circle cx={cx + (k ? -4 : 4)} cy="96" r="14" fill="#1f1f1f" />
          <circle cx={cx + (k ? -8 : 0)} cy="90" r="5" fill="#fff" />
          <rect x={cx - 31} y={62} width="62" height={60 * blink} rx="8" fill={color} />
        </g>
      ))}
      {/* Pico y patas */}
      <path d="M90 116 L110 116 L100 134 Z" fill="#FFB020" />
      {[82, 118].map((x) => (
        <path key={x} d={`M${x - 10} 206 l6 10 l4 -10 l4 10 l6 -10`} fill="none" stroke="#FFB020" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

/** Avión de línea visto desde arriba con la cola en color de marca */
const Plane: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 220 220" width="220" height="220">
    <g transform="rotate(90 110 110)">
      <path d="M110 12 Q122 12 122 40 L122 92 L204 132 L204 150 L122 128 L120 178 L146 196 L146 208 L110 200 L74 208 L74 196 L100 178 L98 128 L16 150 L16 132 L98 92 L98 40 Q98 12 110 12 Z" fill="#f7f7f9" />
      <path d="M100 178 L120 178 L146 196 L146 208 L110 200 L74 208 L74 196 Z" fill={color} />
      <path d="M104 30 Q110 24 116 30 L116 44 L104 44 Z" fill="#2a3442" />
    </g>
  </svg>
);

const PaperPlane: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 200 140" width="200" height="140">
    <path d="M6 70 L194 10 L120 130 L92 88 Z" fill="#ffffff" />
    <path d="M92 88 L194 10 L104 96 Z" fill={mix(color, "#ffffff", 0.6)} />
    <path d="M92 88 L104 96 L96 124 Z" fill={mix(color, "#000000", 0.1)} />
  </svg>
);

export const Flyer: React.FC<Props> = ({ kind, path, from, to, color, accent, scale = 1, src, target }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from - 1 || frame > to + 30) return null;
  const uAt = (f: number) => interpolate(f, [from, to], [0, 1], clamp);
  const u = uAt(frame);
  const p = flightPos(path, u, target);
  const prev = flightPos(path, uAt(frame - 2), target);
  const vx = p.x - prev.x;
  const vy = p.y - prev.y;
  const speed = Math.hypot(vx, vy);
  const t = frame / fps;

  // "perch": se queda posado y respira; las demás salen de cuadro
  const landed = path === "perch" ? interpolate(u, [0.5, 0.6], [0, 1], clamp) : 0;
  const idleBob = landed * Math.sin(t * 3) * 6;
  const fade = path === "perch" ? 1 : interpolate(frame, [to, to + 20], [1, 0], clamp);
  const appear = interpolate(frame, [from, from + 6], [0, 1], clamp);

  const flap = landed > 0.9 ? Math.max(0, Math.sin(t * 2.2)) ** 8 : 0.5 + 0.5 * Math.sin(t * 22);
  const blink = Math.max(0, 1 - Math.abs(((t * fps) % 150) - 4) / 4);
  const facing = vx < -0.5 ? -1 : 1;
  const bank = Math.max(-30, Math.min(30, vy * 0.9)) * (1 - landed);
  const heading = (Math.atan2(vy, vx) * 180) / Math.PI;

  // Estela: puntos en posiciones anteriores
  const trail = Array.from({ length: 12 }, (_, k) => {
    const q = flightPos(path, uAt(frame - (k + 1) * 2.2), target);
    return { ...q, k };
  });
  const url = resolveAsset(src);
  const isPlane = kind === "plane" || kind === "paperplane";

  return (
    <>
      {speed > 1 &&
        trail.map((q) => (
          <div
            key={q.k}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate3d(${q.x}px, ${q.y}px, ${q.z}px)`,
              opacity: fade * appear * (1 - q.k / 12) * (isPlane ? 0.8 : 0.9),
            }}
          >
            <div
              style={{
                width: isPlane ? 14 : 16 - q.k,
                height: isPlane ? 14 : 16 - q.k,
                marginLeft: -8,
                marginTop: -8,
                borderRadius: isPlane ? 7 : 2,
                transform: isPlane ? "none" : `rotate(45deg) scale(${1 + Math.sin(t * 20 + q.k) * 0.3})`,
                background: isPlane ? "rgba(255,255,255,0.85)" : q.k % 2 ? "#FFE36B" : accent,
                boxShadow: `0 0 16px ${isPlane ? "rgba(255,255,255,0.6)" : rgba(accent, 0.9)}`,
              }}
            />
          </div>
        ))}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate3d(${p.x}px, ${p.y + idleBob}px, ${p.z}px)`, opacity: fade * appear }}>
        <div
          style={{
            transform: `translate(-50%, -50%) scale(${scale}) ${
              isPlane ? `rotate(${kind === "paperplane" ? heading - 15 : heading}deg)` : `scaleX(${facing}) rotate(${bank * facing}deg)`
            }`,
            filter: `drop-shadow(0 24px 30px rgba(0,0,0,0.55)) drop-shadow(0 0 30px ${rgba(accent, 0.35)})`,
          }}
        >
          {url ? (
            <Img src={url} style={{ width: 220 }} />
          ) : kind === "owl" ? (
            <Owl color={color} flap={flap} blink={blink} landed={landed} />
          ) : kind === "plane" ? (
            <Plane color={color} />
          ) : (
            <PaperPlane color={color} />
          )}
        </div>
      </div>
    </>
  );
};


type FlyerSpec = { kind: FlyerKind; path: FlightPath; from: number; to: number; scale: number; color?: string; src?: string; target?: { x: number; y: number } };

/** Capa con todos los voladores del brief (va dentro de <Camera>) */
export const FlyerLayer: React.FC<{ flyers: FlyerSpec[]; color: string; accent: string }> = ({ flyers, color, accent }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {flyers.map((f, i) => (
        <Flyer key={i} {...f} from={Math.round(f.from * fps)} to={Math.round(f.to * fps)} color={f.color ?? color} accent={accent} />
      ))}
    </>
  );
};
