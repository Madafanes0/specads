// Placeholder "fotográfico" generado: cielo, bokeh y skyline, con grading cinematográfico
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { mix, rgba } from "../lib/color";

// Escenas base: [cielo arriba, cielo abajo, luz] — teal & orange
const SCENES = [
  ["#0d1b2e", "#e0794a", "#ffb36b"], // atardecer urbano
  ["#05070d", "#1b2a4a", "#7fb4ff"], // noche fría
  ["#2b1408", "#a65a28", "#ffd29a"], // interior cálido
  ["#0a1f24", "#2f6f73", "#9ee6e0"], // amanecer teal
  ["#130a1c", "#5b2a5e", "#ff8fb1"], // neón
];

export const Placeholder: React.FC<{ color: string; accent: string; seed: number }> = ({ accent, seed }) => {
  const r = (k: string) => random(`${seed}-${k}`);
  const [top, bottom, light] = SCENES[seed % SCENES.length];
  const horizon = 55 + r("h") * 15;
  // Bokeh determinista
  const dots = Array.from({ length: 14 }, (_, i) => ({
    x: r(`bx${i}`) * 100,
    y: r(`by${i}`) * horizon,
    s: 8 + r(`bs${i}`) * 30,
    o: 0.15 + r(`bo${i}`) * 0.35,
  }));
  // Skyline determinista
  let x = 0;
  const pts: string[] = [`0,100`];
  while (x < 100) {
    const w = 4 + r(`w${x}`) * 9;
    const h = horizon - 6 - r(`hh${x}`) * 26;
    pts.push(`${x},${h}`, `${x + w},${h}`);
    x += w;
  }
  pts.push(`100,100`);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${mix(bottom, accent, 0.15)} ${horizon}%, #050507 100%)` }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse 70% 40% at ${30 + r("sx") * 40}% ${horizon}%, ${rgba(light, 0.85)}, transparent 70%)` }}
      />
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            borderRadius: "50%",
            background: rgba(i % 3 ? light : accent, d.o),
            filter: "blur(5px)",
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <polygon points={pts.join(" ")} fill="#06070a" opacity={0.85} />
      </svg>
      {/* Grading: sombras frías, viñeta interna */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
