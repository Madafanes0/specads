// AppFlow: el uso principal de una app contado como roadmap.
// Teléfono 3D al centro cuya pantalla recorre los pasos del flujo, camino con
// nodos en el piso que la cámara recorre, títulos por paso y chips flotantes.
import React from "react";
import { Node3D } from "../components/Camera";
import { Camera } from "../components/Camera";
import { useFocusDim } from "../components/Chrome";
import { Callout } from "../components/flow/Callout";
import { blockEvents, Screen } from "../components/flow/blocks";
import { FlyerLayer } from "../components/Flyer";
import type { SfxEvent } from "../lib/sfx";
import { Phone3D, PHONE_W } from "../components/flow/Phone3D";
import { Roadmap } from "../components/flow/Roadmap";
import { StepHeader } from "../components/flow/StepHeader";
import { GlowLogo } from "../components/GlowLogo";
import { KineticHeadline } from "../components/KineticHeadline";
import { SceneShell } from "../components/SceneShell";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { snapToBeat } from "../presets/beats";
import { SPRINGS } from "../presets/springs";
import type { AppFlowProps } from "../schemas";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const AppFlow: React.FC<AppFlowProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { steps, ui } = props;
  const n = steps.length;

  // Tiempos: hook 1 s → pasos repartidos → slogan 2.2 s antes del final
  const introEnd = Math.round(1.0 * fps);
  const sloganIn = Math.round(snapToBeat(props.durationSec - 2.2, props.beats) * fps);
  const stepDur = (sloganIn - 8 - introEnd) / n;
  const starts = steps.map((_, k) => Math.round(introEnd + k * stepDur));
  const idx = Math.max(0, Math.min(n - 1, Math.floor((frame - introEnd) / stepDur)));
  const dim = useFocusDim(sloganIn);

  // Viaje por el roadmap: suma de springs, uno por cambio de paso
  const travel = starts.slice(1).reduce((acc, s) => acc + spring({ frame: frame - s, fps, config: SPRINGS.soft }), 0) - (1 - spring({ frame: frame - introEnd + 20, fps, config: SPRINGS.soft }));

  // Teléfono: sube desde abajo tras el hook, gira un poco en cada paso
  const phoneIn = spring({ frame: frame - 26, fps, config: { damping: 18, mass: 1.1, stiffness: 110 } });
  const kick = idx > 0 ? 1 - spring({ frame: frame - starts[idx], fps, config: SPRINGS.snappy }) : 0;
  const outro = spring({ frame: frame - sloganIn + 12, fps, config: SPRINGS.soft });
  const t = frame / fps;
  const phoneTransform = [
    `translate3d(0px, ${40 + (1 - phoneIn) * 1500 - outro * 110}px, ${-outro * 120}px)`,
    `rotateX(${(1 - phoneIn) * 38 + Math.sin(t * 0.9) * 2}deg)`,
    `rotateY(${-9 + Math.sin(t * 0.7) * 4 + kick * (idx % 2 ? 16 : -16)}deg)`,
    `rotateZ(${(1 - phoneIn) * -8 + kick * (idx % 2 ? -2 : 2)}deg)`,
    `scale(${0.94 - outro * 0.08})`,
  ].join(" ");

  // Sonidos: entrada del teléfono, cambio de pantalla, interacciones y callouts
  const events: SfxEvent[] = [
    { at: 26, name: "whoosh-big", volume: 0.7 },
    ...starts.slice(1).map((s) => ({ at: s - 2, name: "swipe" as const })),
    ...steps.flatMap((s, k) => {
      const t0 = k === 0 ? 34 : starts[k];
      const dur = k === 0 ? stepDur + starts[0] - 34 : stepDur;
      const end = k === n - 1 ? sloganIn : starts[k + 1];
      return s.screen.flatMap((b) => blockEvents(b, dur)).map((e) => ({ ...e, at: t0 + e.at })).filter((e) => e.at < end);
    }),
    ...steps.flatMap((s, k) => s.callouts.map((_, j) => ({ at: Math.round(starts[k] + stepDur * (0.3 + j * 0.18)), name: "pop" as const, rate: 0.9 }))),
  ];

  // Logo: aparece en el hook y se va al fondo como halo
  const logoBack = spring({ frame: frame - 30, fps, config: SPRINGS.soft });

  return (
    <SceneShell
      base={props}
      centerY={50}
      blurWindow={[[24, 56], ...starts.slice(1).map((s) => [s - 2, s + 14] as [number, number])]}
      shade={outro * 1.3}
      sloganIn={sloganIn}
      events={events}
      world={
        <Camera zoomFrom={introEnd} zoomTo={sloganIn} drift={0.7} perspective={1500}>
          <Roadmap icons={steps.map((s) => s.icon)} starts={starts} active={idx} travel={travel} primary={ui.primary} dim={dim} fade={(1 - outro * 0.85) * phoneIn} />
          <Node3D y={-60 - logoBack * 200} z={-logoBack * 1100} style={{ opacity: 1 - logoBack * 0.8 }}>
            <GlowLogo logo={props.logo} brand={props.brand} color={props.brandColor} accent={props.accentColor} size={300} dim={dim} />
          </Node3D>
          <FlyerLayer flyers={props.flyers} color={props.brandColor} accent={props.accentColor} />
          <Phone3D transform={phoneTransform} glow={props.accentColor} dim={dim}>
            {steps.map((s, k) => {
              const visible = k === idx || (k === idx - 1 && frame < starts[idx] + 30);
              if (!visible) return null;
              const enter = k === 0 ? 1 : spring({ frame: frame - starts[k], fps, config: SPRINGS.snappy });
              const leave = k < idx ? spring({ frame: frame - starts[idx], fps, config: SPRINGS.snappy }) : 0;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateX(${(1 - enter) * 100 - leave * 32}%)`,
                    filter: `brightness(${1 - leave * 0.45})`,
                    boxShadow: k > 0 ? "-30px 0 60px rgba(0,0,0,0.35)" : "none",
                    zIndex: k,
                  }}
                >
                  <Screen blocks={s.screen} t={frame - (k === 0 ? 34 : starts[k])} dur={k === 0 ? stepDur + starts[0] - 34 : stepDur} fps={fps} ui={ui} seed={props.seed * 100 + k} />
                </div>
              );
            })}
          </Phone3D>
          {steps.map((s, k) =>
            s.callouts.map((c, j) => (
              <Callout
                key={`${k}-${j}`}
                icon={c.icon}
                text={c.text}
                side={(k + j) % 2 === 0 ? 1 : -1}
                y={60 + j * 250 + (k % 2) * 110}
                appear={Math.round(starts[k] + stepDur * (0.3 + j * 0.18))}
                leave={Math.round(starts[k] + stepDur - 6)}
                accent={props.accentColor}
                phoneW={PHONE_W}
                dim={dim}
                variant={ui.playful ? "sticker" : "light"}
              />
            )),
          )}
        </Camera>
      }
      overlay={
        <>
          {steps.map((s, k) => (
            <StepHeader
              key={k}
              index={k}
              total={n}
              title={s.title}
              caption={s.caption}
              start={starts[k]}
              end={k === n - 1 ? sloganIn - 10 : starts[k + 1]}
              color={props.accentColor}
            />
          ))}
          <div style={{ opacity: interpolate(frame, [sloganIn - 10, sloganIn], [0, 1], clamp) }}>
            <KineticHeadline text={props.headline} start={sloganIn} glow={props.accentColor} />
          </div>
        </>
      }
    />
  );
};
