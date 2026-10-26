// Cámara 3D: perspectiva + órbita lenta (parallax real) + micro-zoom
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  children: React.ReactNode;
  perspective?: number;
  /** Frame donde arranca el micro-zoom 1.00→1.06 */
  zoomFrom?: number;
  zoomTo?: number;
  /** Intensidad del drift (1 = estándar) */
  drift?: number;
  /** Origen vertical de la perspectiva en % */
  originY?: number;
};

/** Ángulos de órbita periódicos en la duración total: el final empalma con el inicio */
export const useCameraOrbit = (drift = 1) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = (frame / durationInFrames) * Math.PI * 2;
  return {
    ry: Math.sin(t) * 4.5 * drift,
    rx: Math.sin(t * 2 + 0.6) * 2.2 * drift,
    ty: Math.cos(t) * 14 * drift,
  };
};

export const Camera: React.FC<Props> = ({ children, perspective = 1250, zoomFrom = 180, zoomTo = 360, drift = 1, originY = 46 }) => {
  const frame = useCurrentFrame();
  const { rx, ry, ty } = useCameraOrbit(drift);
  // Micro-zoom con easing por seno (sin lineal)
  const zt = interpolate(frame, [zoomFrom, zoomTo], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = 1 + 0.06 * (0.5 - 0.5 * Math.cos(zt * Math.PI));
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: `50% ${originY}%` }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transform: `translateY(${ty}px) scale(${zoom}) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Nodo posicionado en el espacio del mundo (centro del cuadro = 0,0,0) */
export const Node3D: React.FC<{ x?: number; y?: number; z?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x = 0,
  y = 0,
  z = 0,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 0,
      height: 0,
      transformStyle: "preserve-3d",
      transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);
