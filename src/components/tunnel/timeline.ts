// Línea de tiempo del túnel: escenas y recorrido de la cámara.
// Todo está diseñado a 16 s / 60 fps (960 frames) y se escala a la duración del brief.
import { interpolate } from "remotion";

export const DESIGN_FRAMES = 960;
/** Perspectiva CSS: un objeto a esta distancia se ve a escala 1 */
export const P = 1000;
/** Distancia máxima visible (más lejos se descarta) */
export const FAR = 7600;
/** Distancia mínima: más cerca se descarta para no cruzar el ojo */
export const NEAR = 230;

/** Marcas de cada escena, en frames de diseño */
export const MARKS = {
  logoIn: 34,
  barIn: 98,
  typeIn: 124,
  pick: 156,
  enter: 210,
  huntIn: 238,
  lock: 452,
  alertIn: 482,
  notif: 528,
  notif2: 580,
  statIn: 664,
  strike: 718,
  statTo: 734,
  closeIn: 812,
  closeLogo: 832,
  headline: 878,
} as const;

// Velocidad de la cámara (unidades por frame de diseño): rápida en el hook,
// se frena en la búsqueda, crucero en la cacería, casi quieta en la alerta
const SPEED: [number, number][] = [
  [0, 230],
  [30, 205],
  [78, 64],
  [106, 6],
  [114, 0.8],
  [228, 0.8],
  [250, 40],
  [276, 96],
  [398, 96],
  [438, 30],
  [458, 2],
  [468, 0.6],
  [662, 0.6],
  [694, 44],
  [800, 44],
  [842, 18],
  [900, 4],
  [960, 2],
];

const speedAt = (designFrame: number) =>
  interpolate(
    designFrame,
    SPEED.map((s) => s[0]),
    SPEED.map((s) => s[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

export type Timeline = {
  total: number;
  /** Frame de diseño → frame real */
  at: (designFrame: number) => number;
  /** Distancia recorrida por la cámara en el frame dado */
  dist: (frame: number) => number;
  /** Velocidad 0–1 relativa al crucero (para rayas de luz y sway) */
  speed01: (frame: number) => number;
  searchD: number;
  targetD: number;
  /** Rango de la cacería (tarjetas que se escanean) */
  huntFrom: number;
  huntTo: number;
  totalD: number;
};

const cache = new Map<number, Timeline>();

export const getTimeline = (total: number): Timeline => {
  const hit = cache.get(total);
  if (hit) return hit;
  const s = total / DESIGN_FRAMES;
  const at = (f: number) => Math.round(f * s);
  // Integra la velocidad frame a frame (la distancia no depende de la duración)
  const d = new Float64Array(total + 1);
  for (let f = 1; f <= total; f++) d[f] = d[f - 1] + speedAt(f / s) / s;
  const dist = (frame: number) => {
    const f = Math.max(0, Math.min(total, frame));
    const i = Math.floor(f);
    const t = f - i;
    return i >= total ? d[total] : d[i] * (1 - t) + d[i + 1] * t;
  };
  const tl: Timeline = {
    total,
    at,
    dist,
    speed01: (frame) => Math.min(1.4, speedAt(frame / s) / 96),
    // La barra queda a escala 1 justo cuando la mira se convierte en su ícono
    searchD: dist(at(118)) + P,
    targetD: dist(at(462)) + 1150,
    huntFrom: dist(at(250)) + 900,
    huntTo: dist(at(462)) + 700,
    totalD: d[total],
  };
  cache.set(total, tl);
  return tl;
};

/** Posición lateral, vertical y roll de la cámara: el sway crece con la velocidad */
export const cameraSway = (frame: number, fps: number, speed: number) => {
  const t = frame / fps;
  const k = Math.min(1, speed);
  return {
    x: Math.sin(t * 1.1) * 150 * k,
    y: Math.cos(t * 0.8) * 70 * k,
    roll: Math.sin(t * 0.7 + 0.4) * 3.2 * k,
    yaw: Math.sin(t * 1.1 + 1.2) * 2.4 * k,
  };
};
