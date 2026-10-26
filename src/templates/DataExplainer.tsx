// Comparativa con barras 3D que crecen + contadores + piso con retícula
import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bar3D } from "../components/Bar3D";
import { Camera, Node3D } from "../components/Camera";
import { FlyerLayer } from "../components/Flyer";
import type { SfxEvent } from "../lib/sfx";
import { useFocusDim } from "../components/Chrome";
import { Counter } from "../components/Counter";
import { KineticHeadline } from "../components/KineticHeadline";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import { SceneShell } from "../components/SceneShell";
import { resolveAsset } from "../lib/assets";
import { rgba } from "../lib/color";
import { FONT } from "../lib/fonts";
import { getBeats, snapToBeat } from "../presets/beats";
import { SPRINGS } from "../presets/springs";
import type { DataExplainerProps } from "../schemas";

const FLOOR_Y = 170;
const MAX_H = 560;

export const DataExplainer: React.FC<DataExplainerProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = getBeats(props.durationSec, fps, snapToBeat(Math.max(props.durationSec * 0.75, 3.2), props.beats));
  const dim = useFocusDim(b.sloganIn);
  const max = Math.max(...props.items.map((i) => i.value));
  const n = props.items.length;
  const gap = n <= 2 ? 360 : n === 3 ? 300 : 240;
  const barW = n <= 2 ? 210 : 170;

  // Sonidos: título, whoosh + tono que sube por barra, ticks del contador y monedas al final
  const events: SfxEvent[] = [
    { at: 14, name: "pop" },
    ...props.items.flatMap((_, i) => {
      const d = b.cardsStart + 6 + i * 14;
      const ticks = Array.from({ length: 10 }, (_, k) => ({ at: d + 4 + k * 5, name: "tick" as const, rate: 1 + k * 0.05 }));
      return [{ at: d - 2, name: "whoosh" as const }, { at: d, name: "rise" as const }, ...ticks, { at: d + 56, name: "coin" as const, volume: 0.7 }];
    }),
  ];

  // Título: entra justo después del hook
  const tp = spring({ frame: frame - 14, fps, config: SPRINGS.soft });

  return (
    <SceneShell
      base={props}
      centerY={52}
      blurWindow={[b.cardsStart, b.cardsStart + 50]}
      shade={1 - (dim - 0.7) / 0.3}
      sloganIn={b.sloganIn}
      events={events}
      world={
        <Camera zoomFrom={b.driftStart} zoomTo={b.sloganIn + 30} originY={40} drift={0.8}>
          {/* Inclinación fija: cámara alta mirando las barras de 3/4 */}
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: "translate3d(70px, -40px, -260px) rotateX(-14deg) rotateY(-18deg)" }}>
            <PerspectiveGrid color={props.accentColor} y={FLOOR_Y} opacity={0.22} size={110} />
            <FlyerLayer flyers={props.flyers} color={props.brandColor} accent={props.accentColor} />
            {props.items.map((it, i) => {
              const delay = b.cardsStart + 6 + i * 14;
              const p = spring({ frame: frame - delay, fps, config: SPRINGS.grow });
              const H = (it.value / max) * MAX_H * p;
              const x = (i - (n - 1) / 2) * gap;
              const logo = resolveAsset(it.logo);
              const labelIn = interpolate(frame - delay, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <React.Fragment key={i}>
                  <Bar3D x={x} floorY={FLOOR_Y} height={H} width={barW} depth={barW} color={it.color} glow={dim} />
                  {/* Contador sobre la barra */}
                  <Node3D x={x} y={FLOOR_Y - H - 70} z={barW / 2}>
                    <div style={{ transform: "translate(-50%, -100%)", opacity: labelIn }}>
                      <Counter
                        value={it.value}
                        progress={p}
                        prefix={props.prefix}
                        suffix={props.suffix}
                        decimals={props.decimals}
                        style={{ fontSize: 92, color: "#fff", textShadow: `0 0 40px ${rgba(it.color, 0.6)}` }}
                      />
                    </div>
                  </Node3D>
                  {/* Etiqueta de marca y año en el piso, frente a la barra */}
                  <Node3D x={x} y={FLOOR_Y + 40} z={barW / 2 + 30}>
                    <div
                      style={{
                        transform: `translate(-50%, 0) translateY(${(1 - labelIn) * 20}px)`,
                        opacity: labelIn * dim,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        fontFamily: FONT,
                        color: "#fff",
                      }}
                    >
                      {logo ? (
                        <Img src={logo} style={{ height: 50 }} />
                      ) : (
                        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>{it.label}</div>
                      )}
                      <div style={{ fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>{it.year}</div>
                    </div>
                  </Node3D>
                </React.Fragment>
              );
            })}
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
              fontWeight: 700,
              fontSize: 56,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.85)",
              opacity: tp,
              transform: `translateY(${(1 - tp) * 24}px)`,
              filter: `blur(${(1 - tp) * 8}px)`,
            }}
          >
            {props.title}
          </div>
          <KineticHeadline text={props.headline} start={b.sloganIn} glow={props.accentColor} />
        </>
      }
    />
  );
};
