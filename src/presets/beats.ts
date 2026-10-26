// Ritmo de la historia en "beats". Todo en segundos, convertido a frames con fps.
export type Beats = {
  hookEnd: number;
  cardsStart: number;
  cardsEnd: number;
  driftStart: number;
  sloganIn: number;
  holdStart: number;
  total: number;
};

/**
 * Calcula los beats para una duración dada.
 * 8 s → hook 0–0.6, tarjetas 0.6–3, drift 3–6, slogan 6, hold desde 7.
 */
export const getBeats = (durationSec: number, fps: number, sloganAtSec?: number): Beats => {
  const total = Math.round(durationSec * fps);
  const f = (s: number) => Math.round(s * fps);
  const holdStart = Math.max(f(durationSec - 1), f(4));
  const sloganDefault = Math.max(durationSec * 0.75, 3.2);
  const sloganIn = f(Math.min(sloganAtSec ?? sloganDefault, durationSec - 1.4));
  return {
    hookEnd: f(0.6),
    cardsStart: f(0.6),
    cardsEnd: f(3),
    driftStart: f(3),
    sloganIn,
    holdStart,
    total,
  };
};

/**
 * Si el brief trae beats musicales, ajusta el slogan al beat más cercano
 * a su posición natural (±0.8 s).
 */
export const snapToBeat = (targetSec: number, beats: number[] | undefined): number => {
  if (!beats || beats.length === 0) return targetSec;
  let best = targetSec;
  let dist = 0.8;
  for (const b of beats) {
    const d = Math.abs(b - targetSec);
    if (d < dist) {
      dist = d;
      best = b;
    }
  }
  return best;
};
