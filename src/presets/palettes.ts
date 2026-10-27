// Paletas base. brandColor/accentColor del brief tienen prioridad.
export type Palette = {
  bgCenter: string;
  bgEdge: string;
  text: string;
  muted: string;
};

export const PALETTES = {
  noir: { bgCenter: "#1a1d24", bgEdge: "#030304", text: "#ffffff", muted: "rgba(255,255,255,0.4)" },
  warm: { bgCenter: "#2a1a12", bgEdge: "#050302", text: "#fff8f0", muted: "rgba(255,248,240,0.4)" },
  // Neutro puro, sin tinte (para marcas con base negra/gris)
  ink: { bgCenter: "#1f1f1f", bgEdge: "#040404", text: "#ffffff", muted: "rgba(255,255,255,0.4)" },
  cold: { bgCenter: "#0f1d2b", bgEdge: "#020407", text: "#f2f8ff", muted: "rgba(242,248,255,0.4)" },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;
