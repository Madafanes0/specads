// Roadmap en el piso: camino serpenteante con un nodo por paso.
// La cámara "viaja" por el camino a medida que avanzan los pasos.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mix, rgba } from "../../lib/color";
import { FONT } from "../../lib/fonts";
import { SPRINGS } from "../../presets/springs";

const SP = 430; // distancia entre nodos sobre el piso
const XS = [0, 250, -230, 240, -210, 200];
const TILT = 74;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = { icons: string[]; starts: number[]; active: number; travel: number; primary: string; dim: number; y?: number; fade?: number };

export const Roadmap: React.FC<Props> = ({ icons, starts, active, travel, primary, dim, y = 600, fade = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = icons.length;
  const pts = icons.map((_, i) => ({ x: XS[i % XS.length], y: -i * SP }));
  // Curva suave entre nodos
  const d = pts
    .map((p, i) => (i === 0 ? `M${p.x},${p.y + SP}L${p.x},${p.y}` : `C${pts[i - 1].x},${pts[i - 1].y - SP / 2} ${p.x},${p.y + SP / 2} ${p.x},${p.y}`))
    .join(" ") + ` L${pts[n - 1].x},${pts[n - 1].y - SP}`;
  const top = -(n + 1) * SP;
  const H = (n + 2) * SP;
  // Progreso del trazo: de un nodo al siguiente con cada paso
  const prog = interpolate(travel, [-1, n], [0, 1], clamp);
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2);

  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", opacity: fade, transform: `translate3d(0, ${y}px, -120px) rotateX(${TILT}deg)` }}>
      <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateY(${travel * SP}px)` }}>
        <svg
          width={1400}
          height={H}
          viewBox={`-700 ${top} 1400 ${H}`}
          style={{
            position: "absolute",
            left: -700,
            top,
            overflow: "visible",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
          }}
        >
          <path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={46} strokeLinecap="round" />
          <path d={d} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeLinecap="round" strokeDasharray="2 34" />
          <path d={d} fill="none" stroke={rgba(primary, 0.55 * dim)} strokeWidth={64} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} style={{ filter: "blur(14px)" }} />
          <path d={d} fill="none" stroke={primary} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} />
        </svg>
        {pts.map((p, i) => {
          const dist = i - travel; // >0 adelante (lejos), <0 ya pasado
          const o = interpolate(dist, [-1.3, -0.6, 0, 3.5], [0, 1, 1, 0.35], clamp);
          const done = i < active;
          const cur = i === active;
          const pop = spring({ frame: frame - starts[i], fps, config: SPRINGS.pop });
          const s = cur ? 0.85 + 0.25 * pop : 0.85;
          const fill = done || cur ? primary : "#2b2e37";
          const dark = done || cur ? mix(primary, "#000", 0.35) : "#191b21";
          return (
            <div key={i} style={{ position: "absolute", left: p.x, top: p.y, transformStyle: "preserve-3d", opacity: o }}>
              {/* Sombra/halo en el piso */}
              <div style={{ position: "absolute", width: 260, height: 260, left: -130, top: -130, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(cur ? primary : "#000000", cur ? 0.5 * dim : 0.5)}, transparent 65%)` }} />
              {/* Nodo de pie frente a cámara */}
              <div style={{ position: "absolute", transformOrigin: "50% 100%", transform: `rotateX(${-TILT}deg)` }}>
                <div style={{ position: "absolute", left: -75, top: -170, width: 150, transform: `scale(${s})`, transformOrigin: "50% 100%" }}>
                  {cur && <div style={{ position: "absolute", left: -18, top: -18, width: 186, height: 172, borderRadius: "50%", border: `8px solid ${rgba(primary, 0.3 + 0.35 * pulse)}` }} />}
                  <div
                    style={{
                      width: 150,
                      height: 136,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 40% 30%, ${mix(fill, "#fff", 0.25)}, ${fill} 60%)`,
                      boxShadow: `0 16px 0 ${dark}, 0 30px 60px rgba(0,0,0,0.6)${cur ? `, 0 0 70px ${rgba(primary, 0.7 * dim)}` : ""}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 64,
                      filter: done || cur ? "none" : "grayscale(1) brightness(0.7)",
                    }}
                  >
                    {done ? <span style={{ color: "#fff", fontFamily: FONT, fontWeight: 900 }}>✓</span> : icons[i]}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
