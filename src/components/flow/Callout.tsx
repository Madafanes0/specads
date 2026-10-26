// Chip de vidrio que sale del borde del teléfono para destacar un beneficio
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, rgba } from "../../lib/color";
import { FONT } from "../../lib/fonts";
import { SPRINGS } from "../../presets/springs";

/** glass: vidrio oscuro · sticker: color de marca sólido con borde 3D (playful) · light: tarjeta blanca limpia */
export type CalloutVariant = "glass" | "sticker" | "light";

type Props = { icon: string; text: string; side: 1 | -1; y: number; appear: number; leave: number; accent: string; phoneW: number; dim: number; variant?: CalloutVariant };

export const Callout: React.FC<Props> = ({ icon, text, side, y, appear, leave, accent, phoneW, dim, variant = "glass" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < appear - 1 || frame > leave + 14) return null;
  const p = spring({ frame: frame - appear, fps, config: SPRINGS.pop });
  const out = interpolate(frame, [leave, leave + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = frame / fps;
  // Ancho estimado del chip para que nunca se salga del cuadro (1080 px)
  const half = (120 + text.length * 18) / 2;
  const x = side * Math.min(phoneW / 2 - 10 + p * 40, 540 - 100 - half);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate3d(${x}px, ${y + Math.sin(t * 1.6 + side) * 10}px, ${120 + p * 60}px) rotateY(${side * -14}deg) rotateZ(${side * 2}deg)`,
      }}
    >
      <div
        style={{
          transform: `translate(-50%, -50%) scale(${0.5 + 0.5 * p})`,
          opacity: Math.min(1, p * 2) * (1 - out) * (0.55 + 0.45 * dim),
          filter: `blur(${out * 8}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 28px 20px 20px",
          ...SKINS[variant](accent),
          rotate: variant === "sticker" ? `${side * -4 + Math.sin(t * 4) * 1.5}deg` : "0deg",
          fontFamily: FONT,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: variant === "sticker" ? 27 : 16,
            background: variant === "sticker" ? "#fff" : rgba(accent, variant === "light" ? 0.12 : 0.22),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: variant === "light" ? "#222" : "#fff", letterSpacing: "-0.02em" }}>{text}</div>
      </div>
    </div>
  );
};

const SKINS: Record<CalloutVariant, (accent: string) => React.CSSProperties> = {
  glass: (accent) => ({
    borderRadius: 26,
    background: "rgba(20,22,28,0.72)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 40px ${rgba(accent, 0.25)}, inset 0 1.5px 0 rgba(255,255,255,0.2)`,
    backdropFilter: "blur(16px)",
  }),
  sticker: (accent) => ({
    borderRadius: 999,
    background: accent,
    border: "4px solid #fff",
    boxShadow: `0 8px 0 ${mix(accent, "#000000", 0.35)}, 0 30px 50px rgba(0,0,0,0.5)`,
  }),
  light: () => ({
    borderRadius: 20,
    background: "#ffffff",
    boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 2px 0 rgba(0,0,0,0.04)",
  }),
};
