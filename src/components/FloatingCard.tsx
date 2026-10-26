// Tarjeta con foto flotando en 3D: entra desde fuera de cuadro y flota con seno desfasado
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../lib/assets";
import { mix, rgba } from "../lib/color";
import { FONT, HAND, MONO } from "../lib/fonts";
import type { CardSlot } from "../presets/layouts";
import { SPRINGS } from "../presets/springs";
import { Placeholder } from "./Placeholder";

/** Estilos de tarjeta: cada marca puede tener su propio "objeto" */
export type CardVariant = "glass" | "polaroid" | "sticker" | "frame" | "ticket";

type Props = {
  slot: CardSlot;
  variant?: CardVariant;
  caption?: string;
  src?: string;
  index: number;
  delay: number;
  color: string;
  accent: string;
  radius?: number;
  /** Contenido personalizado (p. ej. mockup de app) en vez de foto */
  children?: React.ReactNode;
  dim?: number;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FloatingCard: React.FC<Props> = ({ slot, src, index, delay, color, accent, radius = 28, children, dim = 1, variant = "glass", caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const url = resolveAsset(src);
  const t = frame / fps;

  const p = spring({ frame: frame - delay, fps, config: SPRINGS.snappy });

  // Punto de partida: fuera de cuadro en la dirección de la tarjeta y más atrás
  const len = Math.hypot(slot.x, slot.y) || 1;
  const dx = slot.x / len;
  const dy = slot.y / len;
  const sx = slot.x + dx * 1100;
  const sy = slot.y + dy * 900;
  const sz = slot.z - 700;

  // Flotación: amplitud mayor en tarjetas cercanas (parallax)
  const near = interpolate(slot.z, [-900, 200], [0.5, 1.2], clamp);
  const phase = index * 1.37;
  const fy = Math.sin(t * 1.25 + phase) * 16 * near;
  const fx = Math.cos(t * 0.9 + phase) * 8 * near;
  const frot = Math.sin(t * 1.05 + phase) * 2.2;

  const x = interpolate(p, [0, 1], [sx, slot.x]) + fx * Math.min(p, 1);
  const y = interpolate(p, [0, 1], [sy, slot.y]) + fy * Math.min(p, 1);
  const z = interpolate(p, [0, 1], [sz, slot.z]);
  const rx = interpolate(p, [0, 1], [slot.rx + 35 * Math.sign(dy || 1), slot.rx]) + frot * 0.6;
  const ry = interpolate(p, [0, 1], [slot.ry - 55 * Math.sign(dx || 1), slot.ry]) + frot;
  const rz = interpolate(p, [0, 1], [slot.rz - 18 * Math.sign(dx || 1), slot.rz]);

  // Profundidad de campo: las lejanas más oscuras y desenfocadas
  const brightness = interpolate(slot.z, [-900, -400, 0, 220], [0.5, 0.72, 0.95, 1.04], clamp) * dim;
  const blur = interpolate(slot.z, [-900, -450, -150, 0], [7, 3.5, 0.8, 0], clamp);
  const opacity = interpolate(p, [0, 0.2], [0, 1], clamp);

  const photo =
    children ??
    (url ? (
      <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <Placeholder color={color} accent={accent} seed={index + 1} />
    ));

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: slot.w,
        height: slot.h,
        marginLeft: -slot.w / 2,
        marginTop: -slot.h / 2,
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        opacity,
        filter: `brightness(${brightness}) blur(${blur}px)`,
      }}
    >
      <CardSkin variant={children ? "glass" : variant} radius={radius} accent={accent} caption={caption} index={index} t={t}>
        {photo}
      </CardSkin>
    </div>
  );
};

/** Brillo de cristal reutilizable */
const Gloss: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(155deg, rgba(255,255,255,${0.16 * strength}) 0%, rgba(255,255,255,0.02) 32%, transparent 55%, rgba(0,0,0,0.28) 100%)`,
    }}
  />
);

type SkinProps = { variant: CardVariant; radius: number; accent: string; caption?: string; index: number; t: number; children: React.ReactNode };

/** "Piel" de la tarjeta según el estilo de la marca */
const CardSkin: React.FC<SkinProps> = ({ variant, radius, accent, caption, index, t, children }) => {
  const shadow = "0 60px 120px -20px rgba(0,0,0,0.85), 0 24px 48px -12px rgba(0,0,0,0.6)";

  if (variant === "polaroid") {
    // Papel blanco, foto cuadrada arriba y nota manuscrita abajo
    return (
      <div style={{ position: "absolute", inset: 0, background: "#f4f1ea", borderRadius: 6, padding: "16px 16px 0", boxShadow: shadow, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", flex: 1, overflow: "hidden", borderRadius: 2 }}>
          {children}
          <Gloss strength={0.6} />
        </div>
        <div style={{ height: 74, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontWeight: 700, fontSize: 38, color: "#2b2b2b", transform: `rotate(${index % 2 ? -2 : 1.5}deg)` }}>
          {caption ?? ""}
        </div>
        {/* Cinta adhesiva */}
        <div style={{ position: "absolute", top: -16, left: "50%", width: 110, height: 34, marginLeft: -55, background: rgba("#ffffff", 0.55), transform: `rotate(${index % 2 ? 4 : -3}deg)`, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
      </div>
    );
  }

  if (variant === "sticker") {
    // Borde blanco grueso, sombra sólida de color y badge (estilo playful)
    const dark = mix(accent, "#000000", 0.35);
    return (
      <>
        <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "#fff", padding: 10, boxShadow: `0 14px 0 ${dark}, ${shadow}` }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 30, overflow: "hidden" }}>
            {children}
            <Gloss />
          </div>
        </div>
        {caption && (
          <div
            style={{
              position: "absolute",
              bottom: -26,
              left: index % 2 ? undefined : -14,
              right: index % 2 ? -14 : undefined,
              padding: "12px 22px",
              borderRadius: 999,
              background: accent,
              boxShadow: `0 6px 0 ${dark}`,
              color: "#fff",
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 28,
              whiteSpace: "nowrap",
              transform: `rotate(${index % 2 ? 5 : -5}deg) scale(${1 + Math.sin(t * 3 + index) * 0.03})`,
            }}
          >
            {caption}
          </div>
        )}
      </>
    );
  }

  if (variant === "frame") {
    // Interfaz tech: borde de marca con glow, chip "live" y barra de datos
    const blink = 0.5 + 0.5 * Math.sin(t * 5 + index);
    return (
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", boxShadow: `${shadow}, 0 0 40px ${rgba(accent, 0.35)}`, border: `2px solid ${rgba(accent, 0.8)}` }}>
        {children}
        <Gloss />
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: accent, boxShadow: `0 0 ${8 + blink * 10}px ${accent}`, opacity: 0.5 + blink * 0.5 }} />
          LIVE
        </div>
        {caption && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 18px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.75))", fontFamily: MONO, fontSize: 21, fontWeight: 700, color: "#fff" }}>
            {caption}
          </div>
        )}
        {/* Esquinas de visor */}
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              width: 26,
              height: 26,
              [k < 2 ? "top" : "bottom"]: 10,
              [k % 2 ? "right" : "left"]: 10,
              borderColor: rgba("#ffffff", 0.7),
              borderStyle: "solid",
              borderWidth: `${k < 2 ? 3 : 0}px ${k % 2 ? 3 : 0}px ${k < 2 ? 0 : 3}px ${k % 2 ? 0 : 3}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "ticket") {
    // Boarding pass: foto arriba, perforación y talón con datos
    const stub = 96;
    return (
      <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.7))" }}>
        <div style={{ position: "absolute", inset: `0 0 ${stub}px 0`, borderRadius: `${radius}px ${radius}px 8px 8px`, overflow: "hidden" }}>
          {children}
          <Gloss />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: stub, background: "#fbfaf7", borderRadius: `8px 8px ${radius}px ${radius}px`, padding: "14px 20px", fontFamily: MONO, color: "#1d1d1f", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div style={{ fontSize: 14, color: accent, fontWeight: 700, letterSpacing: "0.12em" }}>{`NO. 00${index + 1} · ADMIT ONE`}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{caption ?? ""}</div>
        </div>
        {/* Perforación */}
        <div style={{ position: "absolute", left: 14, right: 14, bottom: stub - 1, borderTop: "3px dashed rgba(0,0,0,0.25)" }} />
        {[-1, 1].map((sd) => (
          <div key={sd} style={{ position: "absolute", bottom: stub - 14, [sd < 0 ? "left" : "right"]: -14, width: 28, height: 28, borderRadius: 14, background: "#0b0b0e" }} />
        ))}
      </div>
    );
  }

  // glass: foto con borde fino translúcido (estilo base)
  return (
    <>
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", background: "#0c0c10", boxShadow: shadow }}>
        {children}
        <Gloss />
        {caption && (
          <div style={{ position: "absolute", left: 18, bottom: 16, fontFamily: FONT, fontWeight: 700, fontSize: 24, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{caption}</div>
        )}
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.14), inset 0 1.5px 0 rgba(255,255,255,0.22)" }} />
    </>
  );
};
