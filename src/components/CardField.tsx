// Acomoda N tarjetas en posiciones 3D según un preset de layout
import React from "react";
import { LAYOUTS, type LayoutName } from "../presets/layouts";
import { FloatingCard, type CardVariant } from "./FloatingCard";

type Props = {
  images: string[];
  layout: LayoutName;
  count: number;
  start: number;
  end: number;
  color: string;
  accent: string;
  dim?: number;
  /** Render alternativo del contenido de cada tarjeta (mockups) */
  renderContent?: (i: number) => React.ReactNode;
  radius?: number;
  /** Escala de tamaño de las tarjetas (p. ej. teléfonos) */
  sizeOf?: (i: number) => { w: number; h: number } | null;
  /** Multiplica la separación horizontal (1 = layout original) */
  spread?: number;
  /** Estilo de tarjeta; "mix" alterna entre todos */
  variant?: CardVariant | "mix";
  captions?: string[];
};

/** Frame de entrada de cada tarjeta: repartidas en la ventana [start, end - 30] */
export const cardDelays = (count: number, start: number, end: number) => {
  const gap = Math.min(24, Math.max(8, (end - 30 - start) / Math.max(1, count - 1)));
  return Array.from({ length: count }, (_, i) => Math.round(start + i * gap));
};

export const CardField: React.FC<Props> = ({ images, layout, count, start, end, color, accent, dim = 1, renderContent, radius, sizeOf, spread = 1, variant = "glass", captions = [] }) => {
  const MIX: CardVariant[] = ["polaroid", "sticker", "frame", "ticket", "glass"];
  const slots = LAYOUTS[layout].slice(0, count).map((s) => ({ ...s, x: s.x * spread }));
  const delays = cardDelays(slots.length, start, end);
  return (
    <>
      {slots.map((slot, i) => {
        const size = sizeOf?.(i);
        return (
          <FloatingCard
            key={i}
            slot={size ? { ...slot, ...size } : slot}
            src={images.length ? images[i % images.length] : undefined}
            index={i}
            delay={delays[i]}
            color={color}
            accent={accent}
            dim={dim}
            radius={radius}
            variant={variant === "mix" ? MIX[i % MIX.length] : variant}
            caption={captions[i]}
          >
            {renderContent?.(i)}
          </FloatingCard>
        );
      })}
    </>
  );
};

