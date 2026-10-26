// Piso con retícula en perspectiva, muy tenue y con fade hacia el horizonte
import React from "react";
import { rgba } from "../lib/color";

type Props = { color: string; y?: number; opacity?: number; size?: number; extent?: number; tilt?: number };

export const PerspectiveGrid: React.FC<Props> = ({ color, y = 520, opacity = 0.16, size = 120, extent = 2600, tilt = 90 }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: extent,
      height: extent,
      marginLeft: -extent / 2,
      marginTop: -extent / 2,
      transform: `translate3d(0, ${y}px, 0) rotateX(${tilt}deg)`,
      opacity,
      backgroundImage: `linear-gradient(${rgba(color, 0.9)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${rgba(color, 0.9)} 1.5px, transparent 1.5px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: "center center",
      WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 35%, transparent 62%)",
      maskImage: "radial-gradient(circle at 50% 50%, black 0%, rgba(0,0,0,0.6) 35%, transparent 62%)",
    }}
  />
);
