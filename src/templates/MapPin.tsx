// Mapa isométrico: edificios que crecen, pin que cae con rebote, onda expansiva y rutas
import React, { useMemo } from "react";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera } from "../components/Camera";
import { FlyerLayer } from "../components/Flyer";
import type { SfxEvent } from "../lib/sfx";
import { useFocusDim } from "../components/Chrome";
import { KineticHeadline } from "../components/KineticHeadline";
import { Pin } from "../components/Pin";
import { SceneShell } from "../components/SceneShell";
import { mix, rgba } from "../lib/color";
import { FONT } from "../lib/fonts";
import { getBeats, snapToBeat } from "../presets/beats";
import { SPRINGS } from "../presets/springs";
import type { MapPinProps } from "../schemas";

const SIZE = 1800; // lado del plano del mapa
const CELL = 150; // separación de calles
const PLANE = "rotateX(58deg) rotateZ(-38deg)";
const BILLBOARD = "rotateZ(38deg) rotateX(-58deg)"; // inverso: de pie frente a cámara
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Building = { x: number; y: number; w: number; d: number; h: number; delay: number };

/** Genera edificios deterministas dentro de las manzanas, dejando libre la plaza del pin */
const makeCity = (seed: number): Building[] => {
  const out: Building[] = [];
  const n = Math.floor(SIZE / 2 / CELL);
  for (let i = -n; i < n; i++) {
    for (let j = -n; j < n; j++) {
      const cx = i * CELL + CELL / 2;
      const cy = j * CELL + CELL / 2;
      const dist = Math.hypot(cx, cy);
      if (dist > 760 || dist < 130) continue;
      if (random(`${seed}-b-${i}-${j}`) < 0.45) continue;
      const w = 60 + random(`${seed}-w-${i}-${j}`) * 50;
      const d = 60 + random(`${seed}-d-${i}-${j}`) * 50;
      // Más altos cerca del centro (skyline)
      const r = random(`${seed}-h-${i}-${j}`);
      const h = (20 + r * r * 150) * interpolate(dist, [130, 760], [1.4, 0.4]);
      out.push({ x: cx, y: cy, w, d, h, delay: dist / 30 + random(`${seed}-t-${i}-${j}`) * 10 });
    }
  }
  return out;
};

/** Rutas por las calles desde el pin (0,0) hacia destinos */
const makeRoutes = (seed: number, count: number) =>
  Array.from({ length: count }, (_, k) => {
    const ang = (k / count) * Math.PI * 2 + random(`${seed}-r${k}`) * 0.8;
    const ex = Math.round((Math.cos(ang) * 600) / CELL) * CELL;
    const ey = Math.round((Math.sin(ang) * 600) / CELL) * CELL;
    const mx = Math.round(ex / 2 / CELL) * CELL;
    // L con un quiebre intermedio, siempre sobre calles
    const pts: [number, number][] = [[0, 0], [mx, 0], [mx, ey], [ex, ey]];
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    return { d: pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" "), len, end: [ex, ey] as [number, number] };
  });

const Box: React.FC<{ b: Building; h: number; color: string; accent: string; dim: number }> = ({ b, h, color, accent, dim }) => {
  if (h < 1) return null;
  const side = (w: number, t: string, shade: number): React.CSSProperties => ({
    position: "absolute",
    width: w,
    height: h,
    left: -w / 2,
    top: -h,
    transformOrigin: "50% 100%",
    transform: t,
    backfaceVisibility: "hidden",
    background: `linear-gradient(0deg, ${mix(color, "#000", 0.2 + shade)}, ${mix(color, "#000", shade)})`,
    // Ventanas iluminadas sutiles
    // Ventanas: puntos de luz dispersos en vez de franjas
    backgroundImage: `radial-gradient(circle, ${rgba("#ffd9a0", 0.35 * dim)} 1.4px, transparent 2px), linear-gradient(0deg, ${mix(color, "#000", 0.25 + shade)}, ${mix(color, "#000", shade)})`,
    backgroundSize: "13px 17px, 100% 100%",
  });
  return (
    <div style={{ position: "absolute", left: SIZE / 2 + b.x, top: SIZE / 2 + b.y, transformStyle: "preserve-3d" }}>
      {/* Las caras se levantan del plano (rotateX -90) y se ubican en cada lado */}
      <div style={side(b.w, `translateY(${b.d / 2}px) rotateX(-90deg)`, 0.35)} />
      <div style={side(b.w, `translateY(${-b.d / 2}px) rotateX(-90deg) rotateY(180deg)`, 0.5)} />
      <div style={side(b.d, `translateX(${b.w / 2}px) rotateZ(90deg) rotateX(-90deg)`, 0.6)} />
      <div style={side(b.d, `translateX(${-b.w / 2}px) rotateZ(-90deg) rotateX(-90deg)`, 0.45)} />
      {/* Techo */}
      <div
        style={{
          position: "absolute",
          width: b.w,
          height: b.d,
          left: -b.w / 2,
          top: -b.d / 2,
          transform: `translateZ(${h}px)`,
          background: mix(color, "#fff", 0.08),
          boxShadow: `inset 0 0 0 1px ${rgba(accent, 0.25)}`,
        }}
      />
    </div>
  );
};

export const MapPin: React.FC<MapPinProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = getBeats(props.durationSec, fps, snapToBeat(Math.max(props.durationSec * 0.75, 3.2), props.beats));
  const dim = useFocusDim(b.sloganIn);
  const city = useMemo(() => makeCity(props.seed), [props.seed]);
  const routes = useMemo(() => makeRoutes(props.seed, props.routes), [props.seed, props.routes]);

  const ground = mix(props.accentColor, "#06070a", 0.9);
  const block = mix(props.accentColor, "#1c2029", 0.93);

  // Pin: cae desde arriba con rebote (|1-p| convierte el overshoot en rebote sobre el piso)
  const dropAt = b.cardsStart + 10;
  const pp = spring({ frame: frame - dropAt, fps, config: { damping: 14, mass: 1, stiffness: 160 } });
  const pinZ = 1100 * Math.abs(1 - pp);
  const pinOpacity = interpolate(frame - dropAt, [0, 6], [0, 1], clamp);
  const landAt = dropAt + 17;

  // Rutas: se dibujan después del aterrizaje
  const routeStart = landAt + 12;

  // Sonidos: ciudad que sube, caída del pin, golpe, ping del sonar y rutas
  const events: SfxEvent[] = [
    { at: 6, name: "rise", volume: 0.8 },
    { at: dropAt - 2, name: "whoosh-big" },
    { at: landAt, name: "thud" },
    { at: landAt + 2, name: "ping" },
    ...routes.map((_, i) => ({ at: routeStart + i * 8, name: "swipe" as const, rate: 0.9 + i * 0.1 })),
    { at: landAt + 20, name: "pop" },
    ...routes.map((_, i) => ({ at: routeStart + i * 8 + 50, name: "tick" as const, volume: 1.5 })),
  ];

  return (
    <SceneShell
      base={props}
      centerY={48}
      blurWindow={[dropAt, landAt + 8]}
      shade={1 - (dim - 0.7) / 0.3}
      sloganIn={b.sloganIn}
      events={events}
      world={
        <Camera zoomFrom={b.driftStart} zoomTo={b.sloganIn + 30} drift={0.9} perspective={1600}>
          <FlyerLayer flyers={props.flyers} color={props.brandColor} accent={props.accentColor} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: SIZE,
              height: SIZE,
              marginLeft: -SIZE / 2,
              marginTop: -SIZE / 2,
              transformStyle: "preserve-3d",
              transform: PLANE,
            }}
          >
            {/* Suelo: manzanas y calles */}
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 62%)",
                maskImage: "radial-gradient(circle, black 30%, transparent 62%)",
              }}
            >
              <rect x={-SIZE / 2} y={-SIZE / 2} width={SIZE} height={SIZE} fill={ground} />
              {Array.from({ length: Math.ceil(SIZE / CELL) + 1 }, (_, i) => {
                const p = -SIZE / 2 + i * CELL - (SIZE / 2) % CELL;
                return (
                  <g key={i} stroke={rgba(props.accentColor, 0.18)} strokeWidth={2}>
                    <line x1={p} y1={-SIZE / 2} x2={p} y2={SIZE / 2} />
                    <line x1={-SIZE / 2} y1={p} x2={SIZE / 2} y2={p} />
                  </g>
                );
              })}
              {/* Parque y agua para romper la retícula */}
              <rect x={CELL * 2 + 14} y={-CELL * 3 + 14} width={CELL * 2 - 28} height={CELL - 28} rx={10} fill={rgba("#2f7d5b", 0.35)} />
              <path d={`M${-SIZE / 2} ${CELL * 3.4} C -300 ${CELL * 2.6}, 200 ${CELL * 4.6}, ${SIZE / 2} ${CELL * 3.6} L ${SIZE / 2} ${SIZE / 2} L ${-SIZE / 2} ${SIZE / 2} Z`} fill={rgba("#2a5a8a", 0.35)} />
              {/* Rutas animadas con stroke-dashoffset */}
              {routes.map((r, i) => {
                const p = spring({ frame: frame - (routeStart + i * 8), fps, config: SPRINGS.soft, durationInFrames: 70 });
                return (
                  <g key={i}>
                    <path d={r.d} fill="none" stroke={rgba(props.accentColor, 0.35)} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.len} strokeDashoffset={r.len * (1 - p)} style={{ filter: "blur(6px)" }} />
                    <path d={r.d} fill="none" stroke={props.accentColor} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.len} strokeDashoffset={r.len * (1 - p)} />
                    <circle cx={r.end[0]} cy={r.end[1]} r={14 * interpolate(p, [0.9, 1], [0, 1], clamp)} fill="#fff" stroke={props.accentColor} strokeWidth={5} />
                  </g>
                );
              })}
              {/* Onda expansiva al aterrizar */}
              {[0, 9, 18].map((d, i) => {
                const t = interpolate(frame - landAt - d, [0, 50], [0, 1], clamp);
                if (frame < landAt + d) return null;
                return <circle key={i} r={40 + t * 380} fill="none" stroke={props.accentColor} strokeWidth={14 * (1 - t) + 2} opacity={(1 - t)} style={{ filter: "drop-shadow(0 0 10px white)" }} />;
              })}
              {/* Sombra del pin */}
              <ellipse rx={50 * interpolate(pinZ, [0, 1100], [1, 0.3])} ry={50 * interpolate(pinZ, [0, 1100], [1, 0.3])} fill={`rgba(0,0,0,${0.6 * pinOpacity})`} style={{ filter: "blur(8px)" }} />
            </svg>
            {/* Edificios */}
            {city.map((bd, i) => {
              const g = spring({ frame: frame - 4 - bd.delay, fps, config: SPRINGS.snappy });
              return <Box key={i} b={bd} h={bd.h * g} color={block} accent={props.accentColor} dim={dim} />;
            })}
            {/* Pin de pie (billboard) */}
            <div style={{ position: "absolute", left: SIZE / 2, top: SIZE / 2, transformStyle: "preserve-3d", transform: `translateZ(${pinZ}px)`, opacity: pinOpacity }}>
              <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: BILLBOARD }}>
                <Pin color={props.brandColor} accent={props.accentColor} glow={dim} size={190} />
                {/* Etiqueta del pin */}
                <div
                  style={{
                    position: "absolute",
                    top: -370,
                    left: 0,
                    transform: `translateX(-50%) scale(${interpolate(frame - landAt - 20, [0, 18], [0.85, 1], clamp)})`,
                    opacity: interpolate(frame - landAt - 20, [0, 14], [0, 1], clamp) * (0.4 + 0.6 * dim),
                    padding: "18px 30px",
                    borderRadius: 999,
                    background: "rgba(16,18,24,0.72)",
                    border: "1.5px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 40,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {props.pinLabel}
                </div>
              </div>
            </div>
          </div>
        </Camera>
      }
      overlay={
        <>
          <div
            style={{
              position: "absolute",
              top: 220,
              width: "100%",
              textAlign: "center",
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 30,
              letterSpacing: "0.32em",
              color: "rgba(255,255,255,0.6)",
              opacity: interpolate(frame, [20, 50], [0, 1], clamp),
            }}
          >
            {props.city.toUpperCase()}
          </div>
          <KineticHeadline text={props.headline} start={b.sloganIn} glow={props.accentColor} />
        </>
      }
    />
  );
};
