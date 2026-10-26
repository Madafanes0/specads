// Bloques de UI animados que componen cada pantalla del teléfono.
// Cada bloque recibe el tiempo local del paso (t) y su duración (dur) y
// coreografía su propia micro-interacción: tipeo, taps, conteos, rellenos…
import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring } from "remotion";
import { resolveAsset } from "../../lib/assets";
import type { SfxEvent } from "../../lib/sfx";
import { mix, rgba } from "../../lib/color";
import { FONT } from "../../lib/fonts";
import { SPRINGS } from "../../presets/springs";
import type { Block, UITheme } from "../../schemas";
import { Placeholder } from "../Placeholder";

export type Ctx = { t: number; dur: number; fps: number; i: number; ui: UITheme; seed: number };

/** Ancho útil de la pantalla (px) */
export const SCREEN_W = 476;
export const PAD = 26;
const W = SCREEN_W - PAD * 2;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const at = (ctx: Ctx, f: number) => Math.round(ctx.dur * f);
const sp = (ctx: Ctx, from: number, config = SPRINGS.snappy) => spring({ frame: ctx.t - from, fps: ctx.fps, config });

/** Entrada escalonada de cada bloque */
const Reveal: React.FC<{ ctx: Ctx; children: React.ReactNode; style?: React.CSSProperties }> = ({ ctx, children, style }) => {
  const p = sp(ctx, 4 + ctx.i * 4);
  return (
    <div style={{ position: "relative", opacity: interpolate(p, [0, 0.4], [0, 1], clamp), transform: `translateY(${(1 - p) * 36}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Dedo virtual: aparece, presiona y deja una onda */
export const Tap: React.FC<{ t: number; at: number; x: number | string; y: number | string }> = ({ t, at: a, x, y }) => {
  const d = t - a;
  if (d < -16 || d > 32) return null;
  const show = interpolate(d, [-16, -6], [0, 1], clamp) * interpolate(d, [14, 32], [1, 0], clamp);
  const press = interpolate(d, [-5, 0, 6], [1, 0.78, 1], clamp);
  const ripple = interpolate(d, [0, 24], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 20, pointerEvents: "none" }}>
      {d >= 0 && (
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            marginLeft: -75,
            marginTop: -75,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.9)",
            boxShadow: "0 0 0 2px rgba(0,0,0,0.12)",
            transform: `scale(${0.3 + ripple * 0.9})`,
            opacity: (1 - ripple) * 0.9,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          width: 70,
          height: 70,
          marginLeft: -35,
          marginTop: -35,
          borderRadius: "50%",
          background: "rgba(140,140,150,0.45)",
          border: "3px solid rgba(255,255,255,0.95)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          transform: `scale(${press * (0.6 + 0.4 * show)})`,
          opacity: show,
        }}
      />
    </div>
  );
};

/** Botón principal (plano o "3D" en modo playful) */
const PrimaryButton: React.FC<{ ui: UITheme; label: string; pressed: number; enabled?: number; height?: number }> = ({ ui, label, pressed, enabled = 1, height = 76 }) => {
  const bg = mix("#e5e5e5", ui.primary, enabled);
  const shade = mix("#c8c8c8", ui.primaryDark, enabled);
  const depth = ui.playful ? 6 * (1 - pressed) : 0;
  return (
    <div
      style={{
        height,
        borderRadius: ui.radius,
        background: bg,
        boxShadow: ui.playful ? `0 ${depth}px 0 ${shade}` : `0 8px 22px ${rgba(ui.primary, 0.3 * enabled)}`,
        transform: `translateY(${ui.playful ? 6 - depth : pressed * 2}px) scale(${1 - pressed * 0.02})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: enabled > 0.5 ? "#fff" : "#a0a0a0",
        fontWeight: 800,
        fontSize: ui.playful ? 24 : 25,
        letterSpacing: ui.playful ? "0.06em" : "-0.01em",
        textTransform: ui.playful ? "uppercase" : "none",
      }}
    >
      {label}
    </div>
  );
};

const pressAt = (t: number, a: number) => interpolate(t - a, [-3, 0, 8], [0, 1, 0], clamp);

// ---------------------------------------------------------------- bloques

const Header: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "header" }> }> = ({ ctx, b }) => (
  <Reveal ctx={ctx}>
    <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", color: ctx.ui.text, lineHeight: 1.08 }}>{b.title}</div>
    {b.subtitle && <div style={{ fontSize: 21, fontWeight: 500, color: ctx.ui.muted, marginTop: 8 }}>{b.subtitle}</div>}
  </Reveal>
);

const Search: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "search" }> }> = ({ ctx, b }) => {
  const a = at(ctx, 0.14);
  const typed = Math.floor(interpolate(ctx.t, [a, at(ctx, 0.5)], [0, b.query.length], clamp));
  const focus = interpolate(ctx.t, [a - 6, a], [0, 1], clamp);
  const caret = Math.floor(ctx.t / 15) % 2 === 0 && focus > 0.5;
  return (
    <Reveal ctx={ctx}>
      <div
        style={{
          height: 78,
          borderRadius: 40,
          background: ctx.ui.surface,
          border: `${1 + focus}px solid ${mix(ctx.ui.border, ctx.ui.text, focus * 0.6)}`,
          boxShadow: `0 8px 26px rgba(0,0,0,${0.08 + focus * 0.08})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 26px",
          fontSize: 25,
        }}
      >
        <span style={{ fontSize: 24 }}>🔍</span>
        {typed > 0 ? (
          <span style={{ color: ctx.ui.text, fontWeight: 700 }}>{b.query.slice(0, typed)}</span>
        ) : (
          <span style={{ color: ctx.ui.muted, fontWeight: 600 }}>{b.placeholder}</span>
        )}
        {caret && <span style={{ width: 2.5, height: 30, background: ctx.ui.primary, marginLeft: -10 }} />}
      </div>
      <Tap t={ctx.t} at={a - 4} x="62%" y={40} />
    </Reveal>
  );
};

const Chips: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "chips" }> }> = ({ ctx, b }) => (
  <Reveal ctx={ctx} style={{ display: "flex", gap: 10, flexWrap: "nowrap", overflow: "hidden" }}>
    {b.items.map((it, k) => {
      const on = k === b.active;
      return (
        <div
          key={k}
          style={{
            padding: "12px 20px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            fontSize: 20,
            fontWeight: 700,
            background: on ? ctx.ui.text : ctx.ui.surface,
            color: on ? ctx.ui.background : ctx.ui.text,
            border: `1.5px solid ${on ? ctx.ui.text : ctx.ui.border}`,
          }}
        >
          {it}
        </div>
      );
    })}
  </Reveal>
);

const Options: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "options" }> }> = ({ ctx, b }) => {
  const tapAt = at(ctx, 0.5);
  const sel = sp(ctx, tapAt, SPRINGS.pop);
  return (
    <Reveal ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {b.items.map((it, k) => {
        const on = k === b.pick ? sel : 0;
        const rowIn = sp(ctx, 8 + k * 4);
        return (
          <div
            key={k}
            style={{
              height: 80,
              borderRadius: ctx.ui.radius,
              border: `2.5px solid ${mix(ctx.ui.border, ctx.ui.primary, on)}`,
              boxShadow: ctx.ui.playful ? `0 ${4}px 0 ${mix(ctx.ui.border, ctx.ui.primaryDark, on)}` : "none",
              background: mix(ctx.ui.surface, mix(ctx.ui.surface, ctx.ui.primary, 0.14), on),
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 22px",
              fontSize: 25,
              fontWeight: 700,
              color: mix(ctx.ui.text, ctx.ui.primaryDark, on),
              transform: `translateX(${(1 - rowIn) * 60}px) scale(${1 + on * 0.03 * (1 - Math.min(1, sel))})`,
              opacity: rowIn,
            }}
          >
            <span style={{ fontSize: 38 }}>{it.icon}</span>
            {it.label}
          </div>
        );
      })}
      <Tap t={ctx.t} at={tapAt} x="58%" y={b.pick * 94 + 40} />
    </Reveal>
  );
};

/** Lección: las palabras vuelan del banco a la respuesta y se comprueba */
const Lesson: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "lesson" }> }> = ({ ctx, b }) => {
  const { ui } = ctx;
  const CH = 54;
  const width = (w: string) => 34 + w.length * 13.5;
  // Banco de palabras: filas centradas
  const bank: { x: number; y: number }[] = [];
  const rows: number[][] = [[]];
  let rowW = 0;
  b.words.forEach((w, k) => {
    const ww = width(w);
    if (rowW + ww > W && rows[rows.length - 1].length) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push(k);
    rowW += ww + 10;
  });
  rows.forEach((r, ri) => {
    const total = r.reduce((s, k) => s + width(b.words[k]) + 10, -10);
    let x = (W - total) / 2;
    r.forEach((k) => {
      bank[k] = { x, y: ri * (CH + 12) };
      x += width(b.words[k]) + 10;
    });
  });
  // Posiciones en la línea de respuesta
  const ans: { x: number; y: number }[] = [];
  let ax = 0;
  let ay = 0;
  b.answer.forEach((k) => {
    const ww = width(b.words[k]);
    if (ax + ww > W) {
      ax = 0;
      ay += 68;
    }
    ans.push({ x: ax, y: ay });
    ax += ww + 8;
  });
  const BUBBLE_Y = 46;
  const ANS_Y = 170;
  const BANK_Y = ANS_Y + 158;
  const BTN_Y = BANK_Y + rows.length * (CH + 12) + 30;
  const moveAt = (k: number) => at(ctx, 0.18 + k * 0.09);
  const placedAll = interpolate(ctx.t, [moveAt(b.answer.length - 1) + 6, moveAt(b.answer.length - 1) + 14], [0, 1], clamp);
  const checkAt = Math.max(at(ctx, 0.7), moveAt(b.answer.length - 1) + 20);
  const chip = (w: string, ghost = false): React.CSSProperties => ({
    position: "absolute",
    width: width(w),
    height: CH,
    borderRadius: 14,
    border: `2.5px solid ${ui.border}`,
    boxShadow: ghost ? "none" : `0 4px 0 ${ui.border}`,
    background: ghost ? ui.border : ui.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 23,
    fontWeight: 700,
    color: ui.text,
  });
  return (
    <Reveal ctx={ctx} style={{ height: BTN_Y + 82 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: ui.text, letterSpacing: "-0.02em" }}>{b.prompt}</div>
      {/* Personaje + globo con la frase */}
      <div style={{ position: "absolute", top: BUBBLE_Y + 20, left: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 64 }}>🧑‍🎓</div>
        <div style={{ padding: "16px 20px", borderRadius: 18, border: `2.5px solid ${ui.border}`, fontSize: 23, fontWeight: 600, color: ui.text, maxWidth: 300 }}>
          {b.sentence}
        </div>
      </div>
      {/* Líneas de respuesta */}
      {[0, 1].map((l) => (
        <div key={l} style={{ position: "absolute", left: 0, right: 0, top: ANS_Y + 62 + l * 68, height: 2.5, background: ui.border }} />
      ))}
      {/* Huecos del banco */}
      {b.words.map((w, k) => (
        <div key={`g${k}`} style={{ ...chip(w, true), left: bank[k].x, top: BANK_Y + bank[k].y }} />
      ))}
      {/* Palabras: se mueven en arco hacia la respuesta */}
      {b.words.map((w, k) => {
        const order = b.answer.indexOf(k);
        let x = bank[k].x;
        let y = BANK_Y + bank[k].y;
        if (order >= 0) {
          const p = sp(ctx, moveAt(order));
          x = interpolate(p, [0, 1], [x, ans[order].x]);
          y = interpolate(p, [0, 1], [y, ANS_Y + ans[order].y]) - Math.sin(Math.min(1, p) * Math.PI) * 40;
        }
        return <div key={k} style={{ ...chip(w), left: x, top: y }}>{w}</div>;
      })}
      {b.answer.map((k, o) => (
        <Tap key={`t${o}`} t={ctx.t} at={moveAt(o)} x={bank[k].x + width(b.words[k]) / 2} y={BANK_Y + bank[k].y + CH / 2} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: BTN_Y }}>
        <PrimaryButton ui={ui} label={b.check} pressed={pressAt(ctx.t, checkAt)} enabled={placedAll} />
      </div>
      <Tap t={ctx.t} at={checkAt} x="50%" y={BTN_Y + 38} />
    </Reveal>
  );
};

/** Racha: número que sube con flip + días de la semana */
const Streak: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "streak" }> }> = ({ ctx, b }) => {
  const flipAt = at(ctx, 0.32);
  const f = sp(ctx, flipAt, SPRINGS.pop);
  const fire = sp(ctx, 6, SPRINGS.pop);
  const filled = Math.min(6, Math.max(1, b.from % 7));
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <Reveal ctx={ctx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 30 }}>
      <div style={{ fontSize: 150, lineHeight: 1, transform: `scale(${0.4 + 0.6 * fire + f * 0.15 * (1 - Math.min(1, f))})`, filter: `drop-shadow(0 0 ${20 + f * 30}px ${rgba(b.color, 0.6)})` }}>🔥</div>
      <div style={{ position: "relative", height: 140, width: W, overflow: "hidden", textAlign: "center", marginTop: 18 }}>
        {[b.from, b.to].map((v, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              width: "100%",
              fontSize: 120,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: b.color,
              transform: `translateY(${(k === 0 ? -f : 1 - f) * 130}px)`,
            }}
          >
            {v}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: b.color }}>{b.label}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 34, padding: "20px 22px", borderRadius: 20, border: `2.5px solid ${ctx.ui.border}` }}>
        {days.map((d, k) => {
          const isNew = k === filled;
          const on = k < filled ? 1 : isNew ? f : 0;
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: ctx.ui.muted }}>{d}</div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: mix(ctx.ui.border, b.color, Math.min(1, on)),
                  transform: `scale(${isNew ? 1 + 0.25 * Math.sin(Math.min(1, f) * Math.PI) : 1})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 900,
                }}
              >
                {on > 0.5 ? "✓" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </Reveal>
  );
};

const Progress: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "progress" }> }> = ({ ctx, b }) => {
  const p = sp(ctx, at(ctx, 0.3), SPRINGS.grow);
  const v = interpolate(p, [0, 1], [b.from, b.to]);
  return (
    <Reveal ctx={ctx}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, color: ctx.ui.text, marginBottom: 12 }}>
        <span>{b.label}</span>
        <span style={{ color: ctx.ui.primary }}>{Math.round(v)}%</span>
      </div>
      <div style={{ height: 24, borderRadius: 12, background: ctx.ui.border, overflow: "hidden" }}>
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            borderRadius: 12,
            background: ctx.ui.primary,
            boxShadow: "inset 0 6px 0 rgba(255,255,255,0.3)",
          }}
        />
      </div>
    </Reveal>
  );
};

/** Celebración con confeti determinista */
const Celebrate: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "celebrate" }> }> = ({ ctx, b }) => {
  const pop = sp(ctx, 4, SPRINGS.pop);
  const ft = Math.max(0, ctx.t - 6) / ctx.fps;
  const colors = [ctx.ui.primary, "#FFC800", "#1CB0F6", "#FF4B4B", "#CE82FF"];
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 20 }}>
      {Array.from({ length: 36 }, (_, k) => {
        const r = (s: string) => random(`${ctx.seed}-c${k}-${s}`);
        const vx = (r("vx") - 0.5) * 520;
        const vy = -380 - r("vy") * 420;
        const x = SCREEN_W / 2 - PAD + vx * ft;
        const y = 120 + vy * ft + 900 * ft * ft;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 12,
              height: 20,
              borderRadius: 3,
              background: colors[k % colors.length],
              transform: `rotate(${r("r") * 360 + ft * 500 * (r("s") - 0.5)}deg)`,
              opacity: ctx.t > 6 ? interpolate(ft, [1.6, 2.2], [1, 0], clamp) : 0,
            }}
          />
        );
      })}
      <div style={{ fontSize: 140, lineHeight: 1, transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)` }}>{b.icon}</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: ctx.ui.primary, letterSpacing: "-0.02em", textAlign: "center", opacity: pop }}>{b.title}</div>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {b.stats.map((s, k) => {
          const p = sp(ctx, 14 + k * 5, SPRINGS.pop);
          return (
            <div key={k} style={{ width: 130, borderRadius: 16, border: `3px solid ${s.color}`, overflow: "hidden", transform: `scale(${p})` }}>
              <div style={{ background: s.color, color: "#fff", fontSize: 15, fontWeight: 900, textAlign: "center", padding: "6px 0", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, textAlign: "center", padding: "14px 0" }}>{s.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Lista de alojamientos con scroll y corazón */
const Listings: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "listings" }> }> = ({ ctx, b }) => {
  const scroll = interpolate(sp(ctx, at(ctx, 0.42), SPRINGS.soft), [0, 1], [0, -330]);
  const heartAt = at(ctx, 0.22);
  const heart = sp(ctx, heartAt, SPRINGS.pop);
  return (
    <Reveal ctx={ctx} style={{ height: 760, overflow: "visible" }}>
      <div style={{ transform: `translateY(${scroll}px)`, display: "flex", flexDirection: "column", gap: 28 }}>
        {b.items.map((it, k) => {
          const url = resolveAsset(it.image);
          return (
            <div key={k}>
              <div style={{ position: "relative", height: 270, borderRadius: 20, overflow: "hidden" }}>
                {url ? <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Placeholder color="#ffffff" accent={ctx.ui.primary} seed={k + 2} />}
                <div style={{ position: "absolute", top: 16, right: 18, fontSize: 34, transform: `scale(${k === 0 ? 1 + 0.4 * Math.sin(Math.min(1, heart) * Math.PI) : 1})`, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>
                  {k === 0 && heart > 0.3 ? "❤️" : "🤍"}
                </div>
                <div style={{ position: "absolute", top: 16, left: 16, padding: "6px 14px", borderRadius: 999, background: "rgba(255,255,255,0.92)", fontSize: 16, fontWeight: 700, color: "#222" }}>
                  Guest favorite
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 22, fontWeight: 700, color: ctx.ui.text }}>
                <span>{it.title}</span>
                <span>★ {it.rating}</span>
              </div>
              <div style={{ fontSize: 19, color: ctx.ui.muted, marginTop: 4 }}>{it.subtitle}</div>
              <div style={{ fontSize: 20, color: ctx.ui.text, marginTop: 6 }}>
                <b>{it.price}</b> night
              </div>
            </div>
          );
        })}
      </div>
      <Tap t={ctx.t} at={heartAt} x={W - 30} y={40} />
    </Reveal>
  );
};

/** Calendario: tap en inicio, tap en fin y el rango se rellena */
const Calendar: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "calendar" }> }> = ({ ctx, b }) => {
  const { ui } = ctx;
  const startAt = at(ctx, 0.28);
  const endAt = at(ctx, 0.5);
  const CELL = 60;
  const GAP = (W - CELL * 7) / 6;
  const pos = (day: number) => {
    const idx = day - 1 + b.offset;
    return { x: (idx % 7) * (CELL + GAP), y: Math.floor(idx / 7) * (CELL + 6) };
  };
  const s = pos(b.start);
  const e = pos(b.end);
  return (
    <Reveal ctx={ctx}>
      <div style={{ fontSize: 26, fontWeight: 800, color: ui.text, marginBottom: 16 }}>{b.month}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, k) => (
          <div key={k} style={{ width: CELL, textAlign: "center", fontSize: 17, fontWeight: 700, color: ui.muted }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: Math.ceil((b.days + b.offset) / 7) * (CELL + 6) }}>
        {Array.from({ length: b.days }, (_, k) => {
          const day = k + 1;
          const p = pos(day);
          const inRange = day > b.start && day < b.end;
          // El rango se pinta día a día después del segundo tap
          const fill = inRange ? interpolate(ctx.t, [endAt + (day - b.start) * 1.5, endAt + (day - b.start) * 1.5 + 6], [0, 1], clamp) : 0;
          const isEdge = day === b.start ? sp(ctx, startAt, SPRINGS.pop) : day === b.end ? sp(ctx, endAt, SPRINGS.pop) : 0;
          return (
            <div key={day} style={{ position: "absolute", left: p.x, top: p.y, width: CELL, height: CELL }}>
              {fill > 0 && <div style={{ position: "absolute", inset: `4px ${-GAP / 2 - 1}px`, background: rgba(ui.text, 0.08 * fill) }} />}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: CELL / 2,
                  background: isEdge > 0.02 ? ui.text : "transparent",
                  transform: `scale(${Math.min(1.1, isEdge)})`,
                }}
              />
              <div style={{ position: "relative", lineHeight: `${CELL}px`, textAlign: "center", fontSize: 21, fontWeight: 600, color: isEdge > 0.5 ? ui.background : ui.text }}>{day}</div>
            </div>
          );
        })}
        <Tap t={ctx.t} at={startAt} x={s.x + CELL / 2} y={s.y + CELL / 2} />
        <Tap t={ctx.t} at={endAt} x={e.x + CELL / 2} y={e.y + CELL / 2} />
      </div>
    </Reveal>
  );
};

const Button: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "button" }> }> = ({ ctx, b }) => {
  const a = at(ctx, b.at);
  return (
    <Reveal ctx={ctx}>
      <PrimaryButton ui={ctx.ui} label={b.label} pressed={b.tap ? pressAt(ctx.t, a) : 0} />
      {b.tap && <Tap t={ctx.t} at={a} x="50%" y={38} />}
    </Reveal>
  );
};

/** Confirmación: círculo que crece y check que se dibuja */
const Confirm: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "confirm" }> }> = ({ ctx, b }) => {
  const c = sp(ctx, 6, SPRINGS.pop);
  const draw = interpolate(ctx.t, [16, 32], [0, 1], clamp);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 50 }}>
      <div style={{ width: 170, height: 170, borderRadius: 85, background: ctx.ui.primary, transform: `scale(${c})`, boxShadow: `0 20px 50px ${rgba(ctx.ui.primary, 0.45)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <path d="M18 47 L38 66 L73 26" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, color: ctx.ui.text, textAlign: "center", letterSpacing: "-0.03em", opacity: draw, transform: `translateY(${(1 - draw) * 16}px)` }}>{b.title}</div>
      <div style={{ fontSize: 22, color: ctx.ui.muted, textAlign: "center", opacity: draw }}>{b.subtitle}</div>
    </div>
  );
};

/** Mini camino de lecciones en zigzag; el nodo actual se completa */
const PathBlock: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "path" }> }> = ({ ctx, b }) => {
  const { ui } = ctx;
  const doneAt = at(ctx, 0.55);
  const done = sp(ctx, doneAt, SPRINGS.pop);
  const offs = [0, 80, 120, 80, 0, -80];
  const S = 92;
  const pulse = 0.5 + 0.5 * Math.sin((ctx.t / ctx.fps) * Math.PI * 2.4);
  return (
    <Reveal ctx={ctx} style={{ height: b.nodes * 118 + 40 }}>
      {Array.from({ length: b.nodes }, (_, k) => {
        const x = W / 2 + offs[k % offs.length] - S / 2;
        const y = 30 + k * 118;
        const isCur = k === b.current;
        const isNext = k === b.current + 1;
        const state = k < b.current ? 1 : isCur ? 0.6 + 0.4 * Math.min(1, done) : isNext ? done * 0.6 : 0;
        const color = state > 0.55 ? ui.primary : mix(ui.border, ui.primary, state);
        const dark = state > 0.55 ? ui.primaryDark : mix("#cfcfcf", ui.primaryDark, state);
        const active = (isCur && done < 0.5) || (isNext && done >= 0.5);
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y }}>
            {active && (
              <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: `6px solid ${rgba(ui.primary, 0.35 + 0.25 * pulse)}` }} />
            )}
            {active && (
              <div style={{ position: "absolute", top: -58, left: S / 2, transform: "translateX(-50%)", padding: "8px 16px", borderRadius: 12, border: `2.5px solid ${ui.border}`, background: ui.surface, color: ui.primary, fontWeight: 900, fontSize: 18, letterSpacing: "0.06em" }}>
                {b.label}
              </div>
            )}
            <div
              style={{
                width: S,
                height: S - 10,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 10px 0 ${dark}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                color: "#fff",
                transform: `scale(${isCur ? 1 + 0.12 * Math.sin(Math.min(1, done) * Math.PI) : 1})`,
              }}
            >
              {k < b.current || (isCur && done > 0.5) ? "★" : state > 0.3 ? "▶" : "🔒"}
            </div>
          </div>
        );
      })}
      <Tap t={ctx.t} at={doneAt} x={W / 2 + offs[b.current % offs.length]} y={30 + b.current * 118 + 40} />
    </Reveal>
  );
};

const Card: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "card" }> }> = ({ ctx, b }) => (
  <Reveal ctx={ctx}>
    <div style={{ display: "flex", gap: 18, alignItems: "center", padding: 20, borderRadius: ctx.ui.radius + 4, border: `1.5px solid ${ctx.ui.border}`, background: ctx.ui.surface, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: rgba(ctx.ui.primary, 0.12), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>{b.icon}</div>
      <div>
        <div style={{ fontSize: 23, fontWeight: 800, color: ctx.ui.text }}>{b.title}</div>
        <div style={{ fontSize: 19, color: ctx.ui.muted, marginTop: 4 }}>{b.subtitle}</div>
      </div>
    </div>
  </Reveal>
);

/** Panel inferior fijo que sube (p. ej. "¡Correcto!") */
export const Banner: React.FC<{ ctx: Ctx; b: Extract<Block, { type: "banner" }> }> = ({ ctx, b }) => {
  const p = sp(ctx, at(ctx, b.at), SPRINGS.snappy);
  if (p <= 0.001) return null;
  const tone = ctx.ui.primary;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 230,
        background: mix("#ffffff", tone, 0.18),
        transform: `translateY(${(1 - p) * 240}px)`,
        padding: "30px 28px",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        zIndex: 15,
      }}
    >
      <div style={{ width: 62, height: 62, borderRadius: 31, background: tone, color: "#fff", fontSize: 34, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{b.icon}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: ctx.ui.primaryDark, paddingTop: 10, letterSpacing: "-0.02em" }}>{b.text}</div>
    </div>
  );
};

/** Renderiza un bloque según su tipo */
export const renderBlock = (b: Block, ctx: Ctx): React.ReactNode => {
  switch (b.type) {
    case "header":
      return <Header ctx={ctx} b={b} />;
    case "search":
      return <Search ctx={ctx} b={b} />;
    case "chips":
      return <Chips ctx={ctx} b={b} />;
    case "options":
      return <Options ctx={ctx} b={b} />;
    case "lesson":
      return <Lesson ctx={ctx} b={b} />;
    case "streak":
      return <Streak ctx={ctx} b={b} />;
    case "progress":
      return <Progress ctx={ctx} b={b} />;
    case "celebrate":
      return <Celebrate ctx={ctx} b={b} />;
    case "listings":
      return <Listings ctx={ctx} b={b} />;
    case "calendar":
      return <Calendar ctx={ctx} b={b} />;
    case "button":
      return <Button ctx={ctx} b={b} />;
    case "confirm":
      return <Confirm ctx={ctx} b={b} />;
    case "path":
      return <PathBlock ctx={ctx} b={b} />;
    case "card":
      return <Card ctx={ctx} b={b} />;
    case "banner":
      return null; // se dibuja fijo abajo, ver Screen
  }
};

/** Pantalla completa: barra de estado + bloques + banners fijos */
export const Screen: React.FC<{ blocks: Block[]; t: number; dur: number; fps: number; ui: UITheme; seed: number }> = ({ blocks, t, dur, fps, ui, seed }) => (
  <AbsoluteFill style={{ background: ui.background, fontFamily: FONT, overflow: "hidden" }}>
    <div style={{ position: "relative", zIndex: 12, background: ui.background, height: 62, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 34px 6px", fontSize: 19, fontWeight: 700, color: ui.text }}>
      <span>9:41</span>
      <span style={{ letterSpacing: 2, fontSize: 15 }}>▮▮▮ ◖</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: `22px ${PAD}px` }}>
      {blocks.map((b, i) =>
        b.type === "banner" ? null : <React.Fragment key={i}>{renderBlock(b, { t, dur, fps, i, ui, seed: seed * 10 + i })}</React.Fragment>,
      )}
    </div>
    {ui.tabs.length > 0 && (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 110,
          paddingBottom: 26,
          borderTop: `2px solid ${ui.border}`,
          background: ui.surface,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          fontSize: 36,
        }}
      >
        {ui.tabs.map((tab, k) => (
          <div
            key={k}
            style={{
              width: 66,
              height: 58,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: k === ui.activeTab ? `2.5px solid ${rgba(ui.primary, 0.6)}` : "2.5px solid transparent",
              background: k === ui.activeTab ? rgba(ui.primary, 0.1) : "transparent",
              filter: k === ui.activeTab ? "none" : "grayscale(0.6) opacity(0.7)",
            }}
          >
            {tab}
          </div>
        ))}
      </div>
    )}
    {blocks.map((b, i) => (b.type === "banner" ? <Banner key={`b${i}`} b={b} ctx={{ t, dur, fps, i, ui, seed }} /> : null))}
  </AbsoluteFill>
);

/**
 * Sonidos de cada bloque, con los mismos tiempos que su animación.
 * Devuelve frames relativos al inicio de la pantalla.
 */
export const blockEvents = (b: Block, dur: number): SfxEvent[] => {
  const a = (f: number) => Math.round(dur * f);
  switch (b.type) {
    case "search": {
      const s = a(0.14);
      const e = a(0.5);
      const keys = Array.from({ length: b.query.length }, (_, k) => ({ at: s + ((e - s) * k) / b.query.length, name: "type" as const, rate: 0.9 + (k % 3) * 0.1 }));
      return [{ at: s - 4, name: "tap" }, ...keys];
    }
    case "options":
      return [{ at: a(0.5), name: "tap" }, { at: a(0.5) + 2, name: "pop" }];
    case "lesson": {
      const moves = b.answer.map((_, k) => a(0.18 + k * 0.09));
      const check = Math.max(a(0.7), moves[moves.length - 1] + 20);
      return [...moves.flatMap((m) => [{ at: m, name: "tap" as const }, { at: m + 8, name: "pop" as const, rate: 1.1 }]), { at: check, name: "tap" }];
    }
    case "streak":
      return [{ at: 6, name: "whoosh", volume: 0.6 }, { at: a(0.32), name: "coin" }, { at: a(0.32) + 4, name: "pop" }];
    case "progress":
      return [{ at: a(0.3), name: "rise", volume: 0.8 }];
    case "celebrate":
      return [{ at: 4, name: "coin" }, { at: 8, name: "success" }, { at: 14, name: "pop" }, { at: 19, name: "pop", rate: 1.2 }];
    case "listings":
      return [{ at: a(0.22), name: "tap" }, { at: a(0.22) + 3, name: "pop", rate: 1.2 }, { at: a(0.42), name: "swipe" }];
    case "calendar":
      return [{ at: a(0.28), name: "tap" }, { at: a(0.5), name: "tap" }, { at: a(0.5) + 6, name: "rise", volume: 0.6 }];
    case "button":
      return b.tap ? [{ at: a(b.at), name: "tap" }] : [];
    case "confirm":
      return [{ at: 6, name: "pop" }, { at: 16, name: "success" }];
    case "path":
      return [{ at: a(0.55), name: "tap" }, { at: a(0.55) + 4, name: "success" }];
    case "banner":
      return [{ at: a(b.at), name: "success" }];
    default:
      return [];
  }
};
