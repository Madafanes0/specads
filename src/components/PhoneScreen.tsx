// Mockup de teléfono: bisel + pantalla (imagen real o UI generada de ejemplo)
import React from "react";
import { AbsoluteFill, Img, random } from "remotion";
import { resolveAsset } from "../lib/assets";
import { mix, rgba } from "../lib/color";
import { FONT } from "../lib/fonts";

/** UI de ejemplo: header, tarjeta destacada, gráfico y lista */
const FakeUI: React.FC<{ accent: string; seed: number; brand: string }> = ({ accent, seed, brand }) => {
  const r = (k: string) => random(`${seed}-${k}`);
  const bars = Array.from({ length: 9 }, (_, i) => 0.25 + r(`bar${i}`) * 0.75);
  const variant = seed % 3;
  return (
    <AbsoluteFill style={{ background: "#0b0c10", fontFamily: FONT, color: "#fff", padding: "54px 22px 22px", gap: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{["Home", "Insights", "Wallet"][variant]}</div>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: `linear-gradient(135deg, ${accent}, ${mix(accent, "#fff", 0.4)})` }} />
      </div>
      <div style={{ borderRadius: 22, padding: 18, background: `linear-gradient(135deg, ${accent}, ${mix(accent, "#000", 0.45)})`, boxShadow: `0 10px 30px ${rgba(accent, 0.35)}` }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{brand}</div>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em" }}>{["$12,480", "+38%", "4.9 ★"][variant]}</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 120, padding: "0 4px" }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 6, background: i === 6 ? accent : "rgba(255,255,255,0.14)" }} />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: rgba(accent, 0.25 + 0.15 * i) }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: `${50 + r(`l${i}`) * 40}%`, borderRadius: 5, background: "rgba(255,255,255,0.7)" }} />
            <div style={{ height: 8, width: `${30 + r(`m${i}`) * 30}%`, borderRadius: 4, marginTop: 8, background: "rgba(255,255,255,0.25)" }} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const PhoneScreen: React.FC<{ src?: string; accent: string; seed: number; brand: string }> = ({ src, accent, seed, brand }) => {
  const url = resolveAsset(src);
  return (
    <AbsoluteFill style={{ background: "#16171c", padding: 10 }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 40, overflow: "hidden" }}>
        {url ? <Img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FakeUI accent={accent} seed={seed} brand={brand} />}
        {/* Isla dinámica */}
        <div style={{ position: "absolute", top: 14, left: "50%", width: 92, height: 26, marginLeft: -46, borderRadius: 13, background: "#000" }} />
      </div>
    </AbsoluteFill>
  );
};
