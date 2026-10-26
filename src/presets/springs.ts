// Configuraciones de spring reutilizables (damping 14–20, mass 0.8–1.2)
import type { SpringConfig } from "remotion";

export const SPRINGS = {
  /** Entrada con overshoot notable: logo, pin */
  pop: { damping: 14, mass: 1, stiffness: 170 },
  /** Entrada rápida y firme: tarjetas */
  snappy: { damping: 18, mass: 0.9, stiffness: 140 },
  /** Suave, sin rebote visible: textos, dimmers */
  soft: { damping: 20, mass: 1.2, stiffness: 90 },
  /** Crecimiento de barras: lento con leve rebote */
  grow: { damping: 16, mass: 1.1, stiffness: 60 },
} satisfies Record<string, Partial<SpringConfig>>;

/** Escalonado estándar entre elementos (frames a 60 fps) */
export const STAGGER = 4;
