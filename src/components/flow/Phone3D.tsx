// Teléfono 3D: cuerpo con grosor, bisel, isla dinámica y reflejo de cristal
import React from "react";
import { rgba } from "../../lib/color";

export const PHONE_W = 500;
export const PHONE_H = 1040;
const R = 70;

type Props = { transform: string; glow: string; dim?: number; children: React.ReactNode };

export const Phone3D: React.FC<Props> = ({ transform, glow, dim = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: PHONE_W,
      height: PHONE_H,
      marginLeft: -PHONE_W / 2,
      marginTop: -PHONE_H / 2,
      transformStyle: "preserve-3d",
      transform,
    }}
  >
    {/* Halo de marca detrás */}
    <div
      style={{
        position: "absolute",
        inset: -260,
        borderRadius: "50%",
        background: `radial-gradient(ellipse, ${rgba(glow, 0.32 * dim)}, transparent 62%)`,
        transform: "translateZ(-60px)",
      }}
    />
    {/* Grosor: capas apiladas detrás del frente */}
    {[22, 16, 10, 5].map((z, k) => (
      <div
        key={z}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: R,
          background: k === 0 ? "#050506" : "#2a2b31",
          transform: `translateZ(${-z}px)`,
          boxShadow: k === 0 ? "0 80px 140px -20px rgba(0,0,0,0.9)" : "none",
        }}
      />
    ))}
    {/* Frente: bisel y pantalla */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: R,
        background: "linear-gradient(145deg, #3a3b42, #121216 40%, #08080a)",
        padding: 12,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.18)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: R - 12, overflow: "hidden", filter: `brightness(${0.75 + 0.25 * dim})` }}>
        {children}
        {/* Isla dinámica */}
        <div style={{ position: "absolute", top: 16, left: "50%", width: 120, height: 34, marginLeft: -60, borderRadius: 17, background: "#000", zIndex: 30 }} />
        {/* Reflejo de cristal */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 31,
            background: "linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, transparent 45%)",
          }}
        />
      </div>
    </div>
  </div>
);
