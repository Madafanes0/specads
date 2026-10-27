// Escenas del túnel: búsqueda (en el mundo), HUD de la cacería, alerta en el teléfono y dato
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { rgba } from "../../lib/color";
import { FONT } from "../../lib/fonts";
import { SPRINGS } from "../../presets/springs";
import type { TunnelProps } from "../../schemas";
import { Phone3D } from "../flow/Phone3D";
import { AdCard } from "./AdCard";
import { money } from "./cards";
import { MARKS, type Timeline } from "./timeline";
import { projectToScreen } from "./World";

export const SEARCH_Y = -130;
export const SEARCH_W = 900;
export const TARGET_Y = -70;
export const TARGET_W = 560;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** La mira de Cazauto (mismo trazo que public/logos/cazauto.svg) */
export const Mira: React.FC<{ size: number; color: string; stroke?: number }> = ({ size, color, stroke = 9 }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: "block" }}>
    <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth={stroke} />
    <circle cx="60" cy="60" r="11" fill={color} />
    <path d="M60 6v22M60 92v22M6 60h22M92 60h22" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

// ---------- Búsqueda ----------

/** Tiempos del tipeo (los usa el panel y los efectos de sonido) */
export const searchTiming = (search: TunnelProps["search"], tl: Timeline) => {
  const s = tl.total / 960;
  const sugg = search.suggestions[search.pick];
  const pre = sugg ? Math.min(5, sugg.length) : search.query.length;
  const rest = sugg && search.query.startsWith(sugg) ? search.query.slice(sugg.length) : "";
  const t0 = tl.at(MARKS.typeIn);
  const pick = tl.at(MARKS.pick);
  const restFrom = pick + Math.round(12 * s);
  const step1 = sugg ? 4 * s : Math.min(3 * s, (tl.at(MARKS.enter) - t0 - 10) / search.query.length);
  const step2 = rest.length ? Math.min(2.6 * s, (tl.at(MARKS.enter) - restFrom - 8) / rest.length) : 0;
  const chars = [
    ...Array.from({ length: pre }, (_, k) => Math.round(t0 + k * step1)),
    ...Array.from({ length: rest.length }, (_, k) => Math.round(restFrom + k * step2)),
  ];
  return { sugg, pre, rest, t0, pick, restFrom, step1, step2, chars, openAt: Math.round(t0 + Math.min(3, pre) * step1) };
};

export const SearchPanel: React.FC<{ search: TunnelProps["search"]; tl: Timeline; accent: string }> = ({ search, tl, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = searchTiming(search, tl);
  const inP = spring({ frame: frame - tl.at(MARKS.barIn), fps, config: SPRINGS.snappy });
  const iconP = spring({ frame: frame - tl.at(116), fps, config: SPRINGS.pop });
  const enter = tl.at(MARKS.enter);

  // Texto escrito hasta este frame
  let text: string;
  if (t.sugg && frame >= t.pick + 4) {
    const n = t.chars.slice(t.pre).filter((c) => c <= frame).length;
    text = t.sugg + t.rest.slice(0, n);
  } else {
    const n = t.chars.slice(0, t.pre).filter((c) => c <= frame).length;
    text = (t.sugg ?? search.query).slice(0, n);
  }
  const typing = frame >= t.t0 && frame < enter + 30;
  const cursor = typing && Math.floor(frame / (fps * 0.45)) % 2 === 0;

  const dropOpen = t.sugg ? spring({ frame: frame - t.openAt, fps, config: SPRINGS.snappy }) * (1 - spring({ frame: frame - (t.pick + 6), fps, config: SPRINGS.snappy })) : 0;
  const tapP = interpolate(frame, [t.pick - 6, t.pick, t.pick + 8], [0, 1, 0], clamp);
  const enterFlash = interpolate(frame, [enter, enter + 4, enter + 40], [0, 1, 0.35], clamp);

  return (
    <div
      style={{
        position: "absolute",
        width: SEARCH_W,
        marginLeft: -SEARCH_W / 2,
        marginTop: -64 - 120,
        fontFamily: FONT,
        opacity: inP,
        transform: `translateY(${(1 - inP) * 40}px) scale(${0.92 + 0.08 * inP})`,
      }}
    >
      <div style={{ height: 120, textAlign: "center", color: "#fff", fontSize: 62, fontWeight: 700, letterSpacing: "-0.03em" }}>
        {search.prompt}
      </div>
      {/* Barra */}
      <div
        style={{
          height: 128,
          borderRadius: 64,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "0 40px",
          boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 ${4 + enterFlash * 4}px ${rgba(accent, 0.35 + enterFlash * 0.65)}, 0 0 ${90 * enterFlash}px ${rgba(accent, 0.6 * enterFlash)}`,
        }}
      >
        <div style={{ transform: `scale(${iconP})` }}>
          <Mira size={58} color={accent} stroke={11} />
        </div>
        <div style={{ fontSize: 46, fontWeight: 600, color: text ? "#111" : "#a1a1aa", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden" }}>
          {text || "Marca, modelo, año…"}
          <span style={{ display: "inline-block", width: 4, height: 52, marginLeft: 4, verticalAlign: "-8px", background: accent, opacity: cursor ? 1 : 0 }} />
        </div>
      </div>
      {/* Autocompletado */}
      {dropOpen > 0.01 && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 34,
            background: "#fafafa",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            opacity: dropOpen,
            transform: `translateY(${(1 - dropOpen) * -24}px)`,
          }}
        >
          {search.suggestions.map((sg, i) => {
            const p = spring({ frame: frame - t.openAt - i * 4, fps, config: SPRINGS.snappy });
            const hl = i === search.pick ? tapP : 0;
            return (
              <div
                key={i}
                style={{
                  height: 96,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 40px",
                  fontSize: 38,
                  fontWeight: 600,
                  color: "#27272a",
                  borderTop: i ? "1px solid #e4e4e7" : "none",
                  background: rgba(accent, 0.14 * hl),
                  opacity: p,
                  transform: `translateX(${(1 - p) * 30}px)`,
                }}
              >
                <span style={{ color: "#a1a1aa", fontSize: 34 }}>↗</span>
                {sg}
              </div>
            );
          })}
        </div>
      )}
      {/* Filtros que caen al dar enter */}
      <div style={{ position: "absolute", top: 120 + 160, width: "100%", display: "flex", justifyContent: "center", gap: 18 }}>
        {search.chips.map((c, i) => {
          const p = spring({ frame: frame - enter - 4 - i * 5, fps, config: SPRINGS.pop });
          return (
            <div
              key={i}
              style={{
                padding: "16px 30px",
                borderRadius: 999,
                background: i === 0 ? accent : "rgba(250,250,250,0.95)",
                color: i === 0 ? "#fff" : "#171717",
                fontSize: 34,
                fontWeight: 700,
                whiteSpace: "nowrap",
                opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * -50}px) scale(${0.6 + 0.4 * p})`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Anuncio objetivo ----------

export const TargetCard: React.FC<{ target: TunnelProps["target"]; portals: string[]; tl: Timeline; accent: string; src: string | null }> = ({ target, portals, tl, accent, src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lit = spring({ frame: frame - tl.at(MARKS.lock), fps, config: SPRINGS.pop });
  return (
    <div style={{ transform: `scale(${1 + 0.04 * lit})` }}>
      <AdCard
        w={TARGET_W}
        model={target.title}
        year={target.year}
        km={target.km}
        city={target.city}
        price={target.price}
        oldPrice={target.oldPrice}
        portal={portals[target.portal % portals.length]}
        variant={3}
        src={src}
        lit={lit}
        accent={accent}
      />
    </div>
  );
};

// ---------- HUD de la cacería + mira ----------

export const HuntHud: React.FC<{ hunt: TunnelProps["hunt"]; portals: string[]; tl: Timeline; accent: string }> = ({ hunt, portals, tl, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = tl.total / 960;
  const a = tl.at(MARKS.huntIn);
  const lock = tl.at(MARKS.lock);
  const inO = interpolate(frame, [a, a + 20], [0, 1], clamp);
  const outO = interpolate(frame, [tl.at(MARKS.alertIn) - 4, tl.at(MARKS.alertIn) + 18], [1, 0], clamp);
  const o = inO * outO;
  if (o <= 0) return null;

  // Contador con easing: rápido al inicio, frena antes del lock
  const cp = interpolate(frame, [a + 10, lock], [0, 1], clamp);
  const count = Math.round(hunt.count * (1 - Math.pow(1 - cp, 2.2)));
  const live = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2.2);

  // Mira: gira mientras escanea, luego se vuelve corchetes sobre el anuncio
  const lockP = spring({ frame: frame - lock, fps, config: SPRINGS.pop });
  const proj = projectToScreen(tl, frame, fps, tl.targetD, 0, TARGET_Y);
  const rw = TARGET_W * proj.s * 1.06;
  const rh = TARGET_W * (430 / 340) * proj.s * 1.06;
  const k = interpolate(lockP, [0, 1], [1.5, 1]);
  const bw = rw * k;
  const bh = rh * k;
  const arm = 74;
  const cx = 540;
  const cy = interpolate(lockP, [0, 1], [900, proj.y]);
  const ringO = 1 - interpolate(lockP, [0, 0.5], [0, 1], clamp);
  const jitter = (1 - lockP) * Math.sin(frame * 0.9) * 6;
  const rot = (frame / fps) * 90;
  const matchP = spring({ frame: frame - lock - 8, fps, config: SPRINGS.pop });

  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const x = cx + (sx * bw) / 2;
    const y = cy + (sy * bh) / 2;
    return `M${x} ${y - sy * arm} L${x} ${y} L${x - sx * arm} ${y}`;
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, fontFamily: FONT }}>
      {/* Sombra arriba y abajo para que el HUD se lea sobre cientos de tarjetas */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, transparent 22%, transparent 66%, rgba(0,0,0,0.85) 90%)" }} />
      {/* Arriba: en vivo + cadencia */}
      <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, background: "rgba(17,17,17,0.75)", border: `2px solid ${rgba(accent, 0.6)}` }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: accent, boxShadow: `0 0 ${10 + live * 16}px ${accent}`, opacity: 0.55 + 0.45 * live }} />
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{hunt.live}</div>
        </div>
        <div style={{ color: "#fff", fontSize: 40, fontWeight: 700, letterSpacing: "-0.01em", textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>{hunt.cadence}</div>
      </div>
      {/* Contador */}
      <div style={{ position: "absolute", top: 1450, width: "100%", textAlign: "center", textShadow: "0 4px 30px rgba(0,0,0,0.9)" }}>
        <div style={{ fontWeight: 800, fontSize: 104, color: "#fff", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{money(count).slice(1)}</div>
        <div style={{ fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em" }}>{hunt.label}</div>
      </div>
      {/* Portales que se van palomeando */}
      <div style={{ position: "absolute", top: 1650, left: 70, right: 70, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {portals.map((p, i) => {
          const on = spring({ frame: frame - a - Math.round((30 + i * 34) * s), fps, config: SPRINGS.pop });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                background: on > 0.5 ? rgba(accent, 0.9) : "rgba(38,38,38,0.85)",
                transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, on) * Math.PI)})`,
              }}
            >
              <span style={{ opacity: on }}>✓</span>
              {p}
            </div>
          );
        })}
      </div>
      {/* Mira */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ringO} transform={`translate(${cx + jitter} ${cy - jitter * 0.6})`} style={{ filter: `drop-shadow(0 0 3px rgba(0,0,0,0.9)) drop-shadow(0 0 14px ${accent})` }}>
          <circle r={150} fill="none" stroke={accent} strokeWidth={6} strokeDasharray="60 34" transform={`rotate(${rot})`} />
          <circle r={118} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={3} />
          <circle r={9} fill={accent} />
          {[0, 90, 180, 270].map((deg) => (
            <line key={deg} x1={0} y1={-178} x2={0} y2={-132} stroke={accent} strokeWidth={7} strokeLinecap="round" transform={`rotate(${deg})`} />
          ))}
        </g>
        <g opacity={interpolate(lockP, [0, 0.3], [0, 1], clamp)} stroke={accent} strokeWidth={10} strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 12px ${accent})` }}>
          {corners.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
      {/* "¡Coincide!" sobre el anuncio */}
      <div
        style={{
          position: "absolute",
          top: proj.y - rh / 2 - 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, matchP * 2),
          transform: `scale(${0.6 + 0.4 * matchP})`,
        }}
      >
        <div style={{ padding: "14px 34px", borderRadius: 999, background: accent, color: "#fff", fontSize: 40, fontWeight: 800, letterSpacing: "-0.01em", boxShadow: `0 0 50px ${rgba(accent, 0.7)}` }}>
          {hunt.match}
        </div>
      </div>
    </div>
  );
};

// ---------- Alerta en el teléfono ----------

const Notification: React.FC<{ app: string; title: string; body: string; accent: string; p: number }> = ({ app, title, body, accent, p }) => (
  <div
    style={{
      borderRadius: 30,
      padding: "22px 24px",
      background: "rgba(44,44,46,0.94)",
      display: "flex",
      gap: 18,
      opacity: Math.min(1, p * 2),
      transform: `translateY(${(1 - p) * -60}px) scale(${0.9 + 0.1 * p})`,
      boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
    }}
  >
    <div style={{ width: 70, height: 70, flex: "none", borderRadius: 18, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Mira size={48} color="#fff" stroke={10} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        <span>{app}</span>
        <span style={{ textTransform: "none" }}>ahora</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 24, fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.25 }}>{body}</div>
    </div>
  </div>
);

export const AlertPhone: React.FC<{ alert: TunnelProps["alert"]; tl: Timeline; accent: string }> = ({ alert, tl, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = tl.at(MARKS.alertIn);
  const out = tl.at(MARKS.statIn);
  if (frame < a - 2 || frame > out + 50) return null;
  const inP = spring({ frame: frame - a, fps, config: SPRINGS.snappy });
  const outP = spring({ frame: frame - out, fps, config: SPRINGS.snappy });
  const y = interpolate(inP, [0, 1], [1500, 90]) - outP * 1900;
  const rx = interpolate(inP, [0, 1], [28, 6]) + outP * 20;
  const ry = interpolate(frame, [a, out], [-12, -3], clamp);
  const n1 = spring({ frame: frame - tl.at(MARKS.notif), fps, config: SPRINGS.pop });
  const n2 = alert.secondary ? spring({ frame: frame - tl.at(MARKS.notif2), fps, config: SPRINGS.pop }) : 0;
  const capP = spring({ frame: frame - a - 10, fps, config: SPRINGS.soft }) * (1 - outP);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT }}>
      {alert.caption && (
        <div
          style={{
            position: "absolute",
            top: 250,
            width: "100%",
            textAlign: "center",
            color: "#fff",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            opacity: capP,
            transform: `translateY(${(1 - capP) * 30}px)`,
          }}
        >
          {alert.caption}
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
        <Phone3D transform={`translate3d(0, ${y}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(0.9)`} glow={accent}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 120% 70% at 50% 100%, ${rgba(accent, 0.55)}, #0a0a0a 70%)` }} />
          <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.8 }}>{alert.date}</div>
            <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{alert.time}</div>
          </div>
          <div style={{ position: "absolute", top: 420, left: 18, right: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <Notification app={alert.app} title={alert.title} body={alert.body} accent={accent} p={n1} />
            {alert.secondary && <Notification {...alert.secondary} accent={accent} p={n2} />}
          </div>
        </Phone3D>
      </div>
    </div>
  );
};

// ---------- Dato: 7.5 h → 10 min ----------

export const StatPanel: React.FC<{ stat: TunnelProps["stat"]; tl: Timeline; accent: string }> = ({ stat, tl, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = tl.at(MARKS.statIn) + 12;
  const close = tl.at(MARKS.closeIn);
  if (frame < a - 2 || frame > close + 40) return null;
  const inP = spring({ frame: frame - a, fps, config: SPRINGS.soft });
  const outP = spring({ frame: frame - close, fps, config: SPRINGS.soft });
  const cnt = interpolate(frame, [a, a + Math.round(0.8 * fps)], [0, 1], clamp);
  const value = (stat.fromValue * (1 - Math.pow(1 - cnt, 3))).toFixed(stat.fromDecimals);
  const strike = interpolate(frame, [tl.at(MARKS.strike), tl.at(MARKS.strike) + 12], [0, 1], clamp);
  const toP = spring({ frame: frame - tl.at(MARKS.statTo), fps, config: SPRINGS.pop });
  const srcO = interpolate(frame, [tl.at(MARKS.statTo) + 10, tl.at(MARKS.statTo) + 30], [0, 1], clamp);
  const label: React.CSSProperties = { fontSize: 44, fontWeight: 700, letterSpacing: "0.02em", color: "rgba(255,255,255,0.65)" };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: (1 - outP) * Math.min(1, inP * 1.5),
        filter: `blur(${outP * 14}px)`,
        transform: `translateY(${(1 - inP) * 40 - outP * 80}px)`,
      }}
    >
      <div style={{ ...label, opacity: inP }}>{stat.fromLabel}</div>
      <div style={{ position: "relative", fontSize: 230, fontWeight: 800, letterSpacing: "-0.05em", color: "#a1a1aa", lineHeight: 1.05 }}>
        {value}
        {stat.fromSuffix}
        <div style={{ position: "absolute", left: "-4%", top: "52%", height: 16, width: `${108 * strike}%`, borderRadius: 8, background: "rgba(255,255,255,0.92)", transform: "rotate(-6deg)" }} />
      </div>
      <div style={{ marginTop: 70, ...label, color: rgba(accent, 1), opacity: toP, filter: "brightness(1.6)" }}>{stat.toLabel}</div>
      <div
        style={{
          fontSize: 250,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          color: "#fff",
          lineHeight: 1.05,
          opacity: Math.min(1, toP * 2),
          transform: `scale(${0.5 + 0.5 * toP})`,
          textShadow: `0 0 60px ${rgba(accent, 0.9)}, 0 0 140px ${rgba(accent, 0.6)}`,
        }}
      >
        {stat.toText}
      </div>
      {stat.source && <div style={{ marginTop: 60, fontSize: 26, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", opacity: srcO }}>{stat.source}</div>}
    </div>
  );
};
