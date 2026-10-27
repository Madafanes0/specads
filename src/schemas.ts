// Schemas zod de cada plantilla (editables en Remotion Studio)
import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const layoutEnum = z.enum(["orbit", "columns", "scatter", "arc"]);
export const paletteEnum = z.enum(["noir", "warm", "cold", "ink"]);

/** Props comunes a todas las plantillas */
export const baseSchema = z.object({
  brand: z.string(),
  brandColor: zColor(),
  accentColor: zColor(),
  logo: z.string().optional(),
  wordmark: z.string().optional(),
  headline: z.string().describe("Usa \\n para forzar el salto de línea"),
  // Texto del pie ("Spec ad · autor"); vacío = sin pie
  footer: z.string().default(""),
  palette: paletteEnum.default("noir"),
  music: z.string().optional(),
  /** Timestamps (s) de beats musicales para pulso y slogan */
  beats: z.array(z.number()).optional(),
  grid: z.boolean().default(false),
  durationSec: z.number().min(5).max(15).default(8),
  seed: z.number().default(1),
  /** BPM de la música: genera beats automáticos si no hay `beats` */
  bpm: z.number().optional(),
  /** Efectos de sonido (impactos, taps, pops, risers…) */
  sfx: z.boolean().default(true),
  /** Mascotas u objetos que vuelan por la escena */
  flyers: z
    .array(
      z.object({
        kind: z.enum(["owl", "plane", "paperplane"]),
        path: z.enum(["orbit", "swoop", "flyby", "perch"]),
        /** Segundos de inicio y fin del vuelo */
        from: z.number(),
        to: z.number(),
        scale: z.number().default(1),
        color: zColor().optional(),
        src: z.string().optional(),
        /** Destino de "perch" en coordenadas del mundo (centro = 0,0) */
        target: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .default([]),
});

export const heroLogoSchema = baseSchema.extend({
  template: z.literal("HeroLogo").default("HeroLogo"),
  images: z.array(z.string()).default([]),
  cardCount: z.number().int().min(4).max(7).default(6),
  layout: layoutEnum.default("orbit"),
  /** Estilo de las tarjetas: elige el que mejor cuente la marca */
  cardStyle: z.enum(["glass", "polaroid", "sticker", "frame", "ticket", "mix"]).default("glass"),
  /** Texto por tarjeta (pie de polaroid, badge del sticker, dato del ticket…) */
  captions: z.array(z.string()).default([]),
});

export const dataExplainerSchema = baseSchema.extend({
  template: z.literal("DataExplainer").default("DataExplainer"),
  title: z.string(),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  decimals: z.number().int().min(0).max(2).default(0),
  // Fuente de los datos (texto chico bajo el título)
  source: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        year: z.string().default(""),
        color: zColor(),
        logo: z.string().optional(),
        // Overrides por barra: mostrar otro número/unidad que el usado para la altura (ej. 0.17 h → "10 min")
        countTo: z.number().optional(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
        decimals: z.number().int().min(0).max(2).optional(),
      }),
    )
    .min(2)
    .max(4),
});

export const mapPinSchema = baseSchema.extend({
  template: z.literal("MapPin").default("MapPin"),
  city: z.string(),
  pinLabel: z.string(),
  routes: z.number().int().min(1).max(5).default(3),
});

export const appShowcaseSchema = baseSchema.extend({
  template: z.literal("AppShowcase").default("AppShowcase"),
  screens: z.array(z.string()).default([]),
  layout: layoutEnum.default("columns"),
});

// ---------- AppFlow: el uso principal de una app como roadmap ----------

/** Tema visual de la UI dentro del teléfono */
export const uiThemeSchema = z.object({
  background: zColor(),
  surface: zColor(),
  text: zColor(),
  muted: zColor(),
  border: zColor(),
  primary: zColor(),
  primaryDark: zColor(),
  /** Botones con borde inferior "3D" y tipografía más gruesa (estilo juego) */
  playful: z.boolean().default(false),
  radius: z.number().default(16),
  /** Íconos de la barra inferior (vacío = sin barra) */
  tabs: z.array(z.string()).default([]),
  activeTab: z.number().int().default(0),
});

const str = z.string();

/** Bloques de pantalla: cada uno trae su micro-animación (tap, tipeo, conteo…) */
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("header"), title: str, subtitle: str.optional() }),
  z.object({ type: z.literal("search"), placeholder: str, query: str }),
  z.object({ type: z.literal("chips"), items: z.array(str), active: z.number().int().default(0) }),
  z.object({ type: z.literal("options"), items: z.array(z.object({ icon: str, label: str })), pick: z.number().int().default(0) }),
  z.object({
    type: z.literal("lesson"),
    prompt: str,
    sentence: str,
    words: z.array(str),
    /** Índices de `words` en el orden correcto */
    answer: z.array(z.number().int()),
    check: str.default("Check"),
  }),
  z.object({ type: z.literal("streak"), from: z.number().int(), to: z.number().int(), label: str, color: zColor().default("#FF9600") }),
  z.object({ type: z.literal("progress"), label: str, from: z.number(), to: z.number() }),
  z.object({ type: z.literal("celebrate"), icon: str, title: str, stats: z.array(z.object({ label: str, value: str, color: zColor() })).default([]) }),
  z.object({
    type: z.literal("listings"),
    items: z.array(z.object({ image: str.optional(), title: str, subtitle: str, price: str, rating: str })),
  }),
  z.object({
    type: z.literal("calendar"),
    month: str,
    /** Día de la semana en que empieza el mes (0 = lunes) */
    offset: z.number().int().min(0).max(6).default(0),
    days: z.number().int().default(30),
    start: z.number().int(),
    end: z.number().int(),
  }),
  z.object({ type: z.literal("button"), label: str, tap: z.boolean().default(true), at: z.number().default(0.72) }),
  z.object({ type: z.literal("confirm"), title: str, subtitle: str }),
  z.object({ type: z.literal("path"), nodes: z.number().int().min(3).max(6).default(5), current: z.number().int().default(2), label: str.default("START") }),
  z.object({ type: z.literal("card"), icon: str, title: str, subtitle: str }),
  /** Panel fijo abajo de la pantalla que sube en `at` (fracción del paso) */
  z.object({ type: z.literal("banner"), text: str, icon: str.default("✓"), at: z.number().default(0.78) }),
]);

export const stepSchema = z.object({
  /** Nombre corto del paso: aparece arriba y en el roadmap */
  title: str,
  caption: str,
  /** Emoji o carácter para el nodo del roadmap */
  icon: str,
  screen: z.array(blockSchema),
  /** Chips flotantes que salen del teléfono (máx. 2) */
  callouts: z.array(z.object({ icon: str, text: str })).max(2).default([]),
});

export const appFlowSchema = baseSchema.extend({
  template: z.literal("AppFlow").default("AppFlow"),
  durationSec: z.number().min(8).max(24).default(14),
  ui: uiThemeSchema,
  steps: z.array(stepSchema).min(2).max(6),
});

export type UITheme = z.infer<typeof uiThemeSchema>;
export type Block = z.infer<typeof blockSchema>;
export type AppFlowProps = z.infer<typeof appFlowSchema>;
export type HeroLogoProps = z.infer<typeof heroLogoSchema>;
export type DataExplainerProps = z.infer<typeof dataExplainerSchema>;
export type MapPinProps = z.infer<typeof mapPinSchema>;
export type AppShowcaseProps = z.infer<typeof appShowcaseSchema>;
export type BaseProps = z.infer<typeof baseSchema>;
