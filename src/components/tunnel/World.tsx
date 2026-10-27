// Universo del túnel: una sola cámara que vuela por cientos de tarjetas.
// Desenfoque por capas: cada tarjeta cae en la capa nítida, media o lejana según su
// distancia (con fundido entre capas) y cada capa lleva un solo `filter: blur`.
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../../lib/assets";
import { mix, rgba } from "../../lib/color";
import { AdCard } from "./AdCard";
import type { AdCardData } from "./cards";
import { cameraSway, FAR, NEAR, P, type Timeline } from "./timeline";

/** Objeto fijo del mundo (barra de búsqueda, anuncio objetivo): siempre en la capa nítida */
export type WorldObject = { key: string; d: number; x: number; y: number; node: React.ReactNode; fade?: [number, number] };

const BLUR = [0, 2.6, 6.5, 0];
const B1 = 2300;
const B2 = 4300;
const FADE = 220;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

/** Peso de la tarjeta en cada capa según su distancia a la cámara */
const layerWeights = (rel: number): [number, number, number] => {
  const w0 = 1 - ramp(rel, B1 - FADE, B1 + FADE);
  const w2 = ramp(rel, B2 - FADE, B2 + FADE);
  return [w0, Math.max(0, 1 - w0 - w2), w2];
};

const STREAKS = 34;
const STREAK_T = 6400;

type Props = {
  tl: Timeline;
  cards: AdCardData[];
  objects: WorldObject[];
  portals: string[];
  images: string[];
  accent: string;
  /** 0–1: oscurece solo las tarjetas (los objetos fijos quedan encima, nítidos) */
  dimCards?: number;
};

export const TunnelWorld: React.FC<Props> = ({ tl, cards, objects, portals, images, accent, dimCards = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camD = tl.dist(frame);
  const speed = tl.speed01(frame);
  const sway = cameraSway(frame, fps, speed);
  const cam = `translateZ(${P}px) rotateZ(${sway.roll}deg) rotateY(${sway.yaw}deg) translate3d(${-sway.x}px, ${-sway.y}px, ${camD}px)`;
  const srcs = images.map((s) => resolveAsset(s));
  const streakColor = mix(accent, "#ffffff", 0.35);

  // Reparte las tarjetas visibles en las tres capas
  const layers: React.ReactNode[][] = [[], [], []];
  for (const c of cards) {
    const rel = c.d - camD;
    if (rel < NEAR || rel > FAR) continue;
    const fog = interpolate(rel, [NEAR, NEAR + 200, FAR - 1900, FAR], [0, 1, 1, 0]);
    // Escaneo de la cacería: destello verde y luego se apaga
    const scan = c.hunt ? interpolate(rel, [1650, 1850, 2050], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
    const off = c.hunt ? interpolate(rel, [1350, 1750], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
    const w = layerWeights(rel);
    w.forEach((wk, li) => {
      if (wk <= 0.01) return;
      layers[li].push(
        <div
          key={c.id}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transformStyle: "preserve-3d",
            transform: `translate3d(${c.x}px, ${c.y}px, ${-c.d}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg)`,
            opacity: fog * wk,
          }}
        >
          <AdCard
            w={c.w}
            model={c.model}
            year={c.year}
            km={c.km}
            price={c.price}
            portal={portals[c.portal % portals.length]}
            variant={c.img}
            src={srcs.length ? srcs[c.img % srcs.length] : null}
            lite={li > 0}
            off={off}
            scan={scan}
            accent={accent}
          />
        </div>,
      );
    });
  }

  // Rayas de luz en las paredes: se reciclan delante de la cámara
  const streakO = clamp01((speed - 0.12) / 0.6);
  const streaks: React.ReactNode[] = [];
  if (streakO > 0) {
    for (let i = 0; i < STREAKS; i++) {
      const a = random(`streak-a-${i}`) * Math.PI * 2;
      const k = 0.8 + random(`streak-k-${i}`) * 0.5;
      const len = 900 + random(`streak-l-${i}`) * 1600;
      const z0 = random(`streak-z-${i}`) * STREAK_T;
      const dist = (((z0 - camD) % STREAK_T) + STREAK_T) % STREAK_T;
      if (dist < NEAR) continue;
      const o = interpolate(dist, [NEAR, NEAR + 400, STREAK_T - 1800, STREAK_T], [0, 1, 1, 0]) * streakO;
      streaks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: len,
            height: 4 + random(`streak-h-${i}`) * 4,
            marginLeft: -len / 2,
            transform: `translate3d(${Math.cos(a) * 560 * k}px, ${Math.sin(a) * 980 * k}px, ${-(camD + dist + len / 2)}px) rotateY(90deg)`,
            background: `linear-gradient(90deg, transparent, ${rgba(streakColor, 0.95)} 40%, #ffffff 50%, ${rgba(streakColor, 0.95)} 60%, transparent)`,
            opacity: o,
            borderRadius: 4,
          }}
        />,
      );
    }
  }

  const fixed = objects.map((o) => {
    const rel = o.d - camD;
    if (rel < NEAR || rel > FAR) return null;
    const [a, b] = o.fade ?? [NEAR, NEAR + 300];
    const op = interpolate(rel, [a, b, FAR - 1900, FAR], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div
        key={o.key}
        style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `translate3d(${o.x}px, ${o.y}px, ${-o.d}px)`, opacity: op }}
      >
        {o.node}
      </div>
    );
  });

  const layer = (li: number, content: React.ReactNode) => (
    <AbsoluteFill key={li} style={{ filter: BLUR[li] ? `blur(${BLUR[li]}px)` : undefined }}>
      <AbsoluteFill style={{ perspective: P, perspectiveOrigin: "50% 50%" }}>
        <AbsoluteFill style={{ transformStyle: "preserve-3d", transform: cam }}>{content}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill>
      {layer(2, layers[2])}
      {layer(1, layers[1])}
      {layer(0, [...layers[0], ...streaks])}
      {dimCards > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dimCards})` }} />}
      {layer(3, fixed)}
    </AbsoluteFill>
  );
};

/** Escala en pantalla y posición de un punto del mundo (para alinear capas 2D con el mundo) */
export const projectToScreen = (tl: Timeline, frame: number, fps: number, d: number, x: number, y: number) => {
  const camD = tl.dist(frame);
  const sway = cameraSway(frame, fps, tl.speed01(frame));
  const rel = d - camD;
  const s = P / rel;
  return { s, x: 540 + (x - sway.x) * s, y: 960 + (y - sway.y) * s };
};
