// Slogan palabra por palabra: reveal de máscara + blur → nítido
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { rgba } from "../lib/color";
import { FONT } from "../lib/fonts";
import { SPRINGS } from "../presets/springs";

type Props = {
  text: string;
  start: number;
  color?: string;
  glow: string;
  fontSize?: number;
  bottom?: number;
  stagger?: number;
};

/** Divide en máx. 2 líneas: respeta \n, si no balancea por longitud */
const toLines = (text: string): string[][] => {
  const explicit = text.split(/\\n|\n/).map((l) => l.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit.slice(0, 2).map((l) => l.split(/\s+/));
  const words = text.trim().split(/\s+/);
  if (text.length <= 12 || words.length < 2) return [words];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return [words.slice(0, best), words.slice(best)];
};

export const KineticHeadline: React.FC<Props> = ({ text, start, color = "#fff", glow, fontSize = 124, bottom = 330, stagger = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = toLines(text);
  let idx = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        bottom,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.02,
        letterSpacing: "-0.035em",
        color,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {words.map((w, wi) => {
            const d = start + idx++ * stagger;
            const p = spring({ frame: frame - d, fps, config: SPRINGS.soft });
            const y = interpolate(p, [0, 1], [105, 0]);
            const blur = interpolate(p, [0, 0.8], [16, 0], { extrapolateRight: "clamp" });
            const o = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.06em 0.14em", verticalAlign: "top" }}>
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${y}%)`,
                    filter: `blur(${blur}px)`,
                    opacity: o,
                    textShadow: `0 0 50px ${rgba(glow, 0.3)}, 0 2px 12px rgba(0,0,0,0.35)`,
                  }}
                >
                  {w}
                </span>
                {wi < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
