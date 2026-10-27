// Túnel: un solo universo 3D de anuncios de autos; la cámara vuela de un momento
// a otro sin cortes (hook → búsqueda → cacería → alerta → dato → cierre)
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";
import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { FilmGrain } from "../components/FilmGrain";
import { GlowLogo } from "../components/GlowLogo";
import { KineticHeadline } from "../components/KineticHeadline";
import { LightFlash } from "../components/LightFlash";
import { Vignette } from "../components/Vignette";
import { makeCards } from "../components/tunnel/cards";
import { AlertPhone, HuntHud, SEARCH_W, SEARCH_Y, SearchPanel, searchTiming, StatPanel, TARGET_Y, TargetCard } from "../components/tunnel/Scenes";
import { getTimeline, MARKS } from "../components/tunnel/timeline";
import { projectToScreen, TunnelWorld, type WorldObject } from "../components/tunnel/World";
import { PulseProvider } from "../lib/audio";
import { resolveAsset } from "../lib/assets";
import { rgba } from "../lib/color";
import { FONT } from "../lib/fonts";
import { SfxTrack, type SfxEvent } from "../lib/sfx";
import { SPRINGS } from "../presets/springs";
import type { TunnelProps } from "../schemas";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Tunnel: React.FC<TunnelProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tl = getTimeline(durationInFrames);
  const A = tl.at;
  const s = durationInFrames / 960;
  const accent = props.accentColor;
  const cards = useMemo(() => makeCards(props.cardCount, tl, props.models, props.portals.length, props.seed), [props.cardCount, tl, props.models, props.portals.length, props.seed]);

  const objects: WorldObject[] = [
    { key: "search", d: tl.searchD, x: 0, y: SEARCH_Y, node: <SearchPanel search={props.search} tl={tl} accent={accent} />, fade: [380, 760] },
    {
      key: "target",
      d: tl.targetD,
      x: 0,
      y: TARGET_Y,
      node: <TargetCard target={props.target} portals={props.portals} tl={tl} accent={accent} src={resolveAsset(props.target.image)} />,
    },
  ];

  // Hook: la mira cae de golpe y vuela a convertirse en el ícono de la barra
  const flyP = interpolate(frame, [A(100), A(118)], [0, 1], clamp);
  const ease = 0.5 - 0.5 * Math.cos(flyP * Math.PI);
  const icon = projectToScreen(tl, A(118), fps, tl.searchD, -SEARCH_W / 2 + 40 + 29, SEARCH_Y);
  const logoX = interpolate(ease, [0, 1], [540, icon.x]);
  const logoY = interpolate(ease, [0, 1], [930, icon.y]);
  const logoS = interpolate(ease, [0, 1], [1, 58 / 300]);
  const logoO = interpolate(frame, [A(114), A(120)], [1, 0], clamp);

  // Oscurecimiento del mundo detrás de la alerta, el dato y el cierre
  const dim = interpolate(
    frame,
    [A(MARKS.alertIn), A(MARKS.alertIn) + 30, A(MARKS.statIn), A(MARKS.statIn) + 30, A(MARKS.closeIn), A(MARKS.closeIn) + 60],
    [0, 0.64, 0.64, 0.5, 0.5, 0.88],
    clamp,
  );

  // Durante la búsqueda solo se oscurecen las tarjetas, no la barra
  const dimCards = interpolate(frame, [A(MARKS.barIn), A(MARKS.barIn) + 20, A(MARKS.huntIn), A(MARKS.huntIn) + 20], [0, 0.45, 0.45, 0], clamp);

  const closeLogo = A(MARKS.closeLogo);
  const wmP = spring({ frame: frame - closeLogo - 14, fps, config: SPRINGS.soft });
  const urlP = spring({ frame: frame - closeLogo - 26, fps, config: SPRINGS.soft });
  const headlineAt = A(MARKS.headline);

  // ---------- Sonido ----------
  const st = searchTiming(props.search, tl);
  const huntA = A(MARKS.huntIn);
  const lock = A(MARKS.lock);
  const events: SfxEvent[] = props.sfx
    ? [
        { at: 0, name: "whoosh-big" },
        { at: A(MARKS.logoIn) - 2, name: "impact" },
        { at: A(MARKS.barIn) - 4, name: "swipe" },
        { at: A(116), name: "pop" },
        ...st.chars.map((at, k) => ({ at, name: "type" as const, rate: 0.95 + (k % 4) * 0.05 })),
        ...(st.sugg ? [{ at: st.openAt, name: "pop" as const, volume: 0.7 }, { at: st.pick, name: "tap" as const }] : []),
        { at: A(MARKS.enter), name: "tap" },
        ...props.search.chips.map((_, i) => ({ at: A(MARKS.enter) + 4 + i * 5, name: "pop" as const, rate: 1 + i * 0.1 })),
        { at: huntA, name: "whoosh-big" },
        // Anuncios que pasan zumbando junto a la cámara
        ...Array.from({ length: 5 }, (_, k) => ({ at: huntA + Math.round((40 + k * 34) * s), name: "whoosh" as const, volume: 0.6, rate: 0.9 + (k % 3) * 0.1 })),
        ...Array.from({ length: Math.floor((lock - huntA - 10) / Math.round(7 * s)) }, (_, k) => ({ at: huntA + 10 + k * Math.round(7 * s), name: "tick" as const, volume: 0.5 })),
        ...props.portals.map((_, i) => ({ at: huntA + Math.round((30 + i * 34) * s), name: "ping" as const, volume: 0.45, rate: 1 + i * 0.08 })),
        { at: lock, name: "thud" },
        { at: lock + 4, name: "success" },
        { at: A(MARKS.alertIn), name: "whoosh" },
        { at: A(MARKS.notif), name: "ping" },
        ...(props.alert.secondary ? [{ at: A(MARKS.notif2), name: "ping" as const, rate: 1.2, volume: 0.8 }] : []),
        { at: A(MARKS.statIn), name: "swipe" },
        { at: A(MARKS.statIn) + 12, name: "rise" },
        { at: A(MARKS.strike), name: "swipe", rate: 1.3 },
        { at: A(MARKS.statTo), name: "hit", volume: 0.8 },
        { at: A(MARKS.statTo) + 2, name: "coin" },
        { at: A(MARKS.closeIn), name: "whoosh-big", volume: 0.7 },
        { at: closeLogo, name: "impact" },
        { at: headlineAt - Math.round(1.5 * fps) + 4, name: "riser" },
        { at: headlineAt, name: "hit" },
      ]
    : [];

  const music = resolveAsset(props.music);
  const beats = props.beats?.length ? props.beats : props.bpm ? Array.from({ length: Math.ceil((durationInFrames / fps) * (props.bpm / 60)) }, (_, k) => (k * 60) / props.bpm!) : undefined;
  const vol = (f: number) => interpolate(f, [0, 10, durationInFrames - 30, durationInFrames], [0, 0.55, 0.55, 0], clamp);
  const blurOn = props.motionBlur && ((frame >= 0 && frame <= A(96)) || (frame >= huntA && frame <= huntA + A(60)));

  return (
    <PulseProvider music={music} beats={beats}>
      <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
        <Background brandColor={accent} palette={props.palette} centerY={50} />
        {/* Luz verde al fondo del túnel */}
        <AbsoluteFill style={{ background: `radial-gradient(circle 360px at 50% 50%, ${rgba(accent, 0.28)}, transparent 70%)` }} />
        <CameraMotionBlur shutterAngle={180} samples={blurOn ? 5 : 1}>
          <TunnelWorld tl={tl} cards={cards} objects={objects} portals={props.portals} images={props.images} accent={accent} dimCards={dimCards} />
        </CameraMotionBlur>
        {dim > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} />}
        <LightFlash color={accent} at={A(MARKS.logoIn) - 2} centerY={48} />
        <Vignette strength={0.8} />

        {/* Hook: mira */}
        {frame >= A(MARKS.logoIn) - 2 && frame < A(120) && (
          <div style={{ position: "absolute", left: logoX, top: logoY, transform: `scale(${logoS})`, opacity: logoO }}>
            <GlowLogo logo={props.logo} brand={props.brand} color={props.brandColor} accent={accent} size={300} delay={A(MARKS.logoIn) - 2} />
          </div>
        )}

        <HuntHud hunt={props.hunt} portals={props.portals} tl={tl} accent={accent} />
        <AlertPhone alert={props.alert} tl={tl} accent={accent} />
        <StatPanel stat={props.stat} tl={tl} accent={accent} />

        {/* Cierre: logo, wordmark, URL y slogan */}
        {frame >= closeLogo - 2 && (
          <>
            <div style={{ position: "absolute", left: 540, top: 700 }}>
              <GlowLogo logo={props.logo} brand={props.brand} color={props.brandColor} accent={accent} size={260} delay={closeLogo} />
            </div>
            <div style={{ position: "absolute", top: 930, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, fontFamily: FONT }}>
              {resolveAsset(props.wordmark) && (
                <Img src={resolveAsset(props.wordmark)!} style={{ height: 78, opacity: wmP, transform: `translateY(${(1 - wmP) * 20}px)` }} />
              )}
              {props.url && (
                <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "0.02em", color: "rgba(255,255,255,0.75)", opacity: urlP, transform: `translateY(${(1 - urlP) * 16}px)` }}>
                  {props.url}
                </div>
              )}
            </div>
            <KineticHeadline text={props.headline} start={headlineAt} glow={accent} />
          </>
        )}

        <FilmGrain opacity={0.04} />
        {music && <Audio src={music} volume={vol} />}
        <SfxTrack events={events} />
      </AbsoluteFill>
    </PulseProvider>
  );
};
