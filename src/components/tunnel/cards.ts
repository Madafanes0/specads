// Datos deterministas de las tarjetas del túnel (posición + anuncio)
import { random } from "remotion";
import type { Timeline } from "./timeline";

/** Variantes de foto distintas: las tarjetas las reutilizan */
export const IMAGE_VARIANTS = 36;

export type AdCardData = {
  id: number;
  /** Distancia a lo largo del túnel (z del mundo = -d) */
  d: number;
  x: number;
  y: number;
  ry: number;
  rx: number;
  rz: number;
  w: number;
  /** Tarjeta flotante (en el centro del túnel) o de pared */
  float: boolean;
  /** Se escanea y se apaga durante la cacería */
  hunt: boolean;
  model: string;
  year: number;
  km: string;
  price: string;
  portal: number;
  img: number;
};

// Formato $238,000 sin depender del locale de Chrome
export const money = (n: number) => `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

// Elipse del túnel: vertical, para el formato 9:16
const RX = 640;
const RY = 1060;

export const makeCards = (count: number, tl: Timeline, models: string[], portals: number, seed: number): AdCardData[] => {
  const cards: AdCardData[] = [];
  const r = (i: number, k: string) => random(`tunnel-${seed}-${i}-${k}`);
  // 30 % flotantes en la cacería y 10 % en el hook, con tope de densidad para que
  // no tapen la mira (1 cada ~130 unidades); el resto va a las paredes
  const nHunt = Math.min(Math.round(count * 0.3), Math.round((tl.huntTo - tl.huntFrom) / 130));
  const nHook = Math.min(Math.round(count * 0.1), Math.round((tl.searchD - 2900) / 160));
  const nWall = count - nHunt - nHook;
  const end = tl.totalD + 2000;
  for (let i = 0; i < count; i++) {
    const kind = i < nWall ? "wall" : i < nWall + nHunt ? "hunt" : "hook";
    let d: number;
    let x: number;
    let y: number;
    let ry = 0;
    let rx = 0;
    if (kind === "wall") {
      // Distribución estratificada: sin huecos grandes aunque haya pocas tarjetas
      d = 400 + ((i + r(i, "d")) / nWall) * end;
      const a = r(i, "a") * Math.PI * 2;
      const k = 1 + r(i, "k") * 0.28;
      x = Math.cos(a) * RX * k;
      y = Math.sin(a) * RY * k;
      // Giradas hacia el eje del túnel
      ry = -Math.cos(a) * 38;
      rx = Math.sin(a) * 30;
    } else {
      const [from, to] = kind === "hunt" ? [tl.huntFrom, tl.huntTo] : [1600, tl.searchD - 1300];
      const j = kind === "hunt" ? i - nWall : i - nWall - nHunt;
      const n = kind === "hunt" ? nHunt : nHook;
      d = from + ((j + r(i, "d")) / Math.max(1, n)) * (to - from);
      const a = r(i, "a") * Math.PI * 2;
      const rad = 380 + r(i, "rad") * 260;
      x = Math.cos(a) * rad * 1.05;
      y = Math.sin(a) * rad * 1.5;
      ry = (r(i, "ry") - 0.5) * 30;
      rx = (r(i, "rx") - 0.5) * 16;
    }
    // Modelo y año salen de la foto (3 ángulos por modelo, igual que `npm run prompts`)
    const img = Math.floor(r(i, "img") * IMAGE_VARIANTS);
    const year = 2016 + (img % 8);
    cards.push({
      id: i,
      d,
      x,
      y,
      ry,
      rx,
      rz: (r(i, "rz") - 0.5) * 6,
      w: kind === "wall" ? 340 : 300,
      float: kind !== "wall",
      hunt: kind === "hunt" || (d > tl.huntFrom - 800 && d < tl.huntTo),
      model: models[Math.floor(img / 3) % models.length] ?? "Auto",
      year,
      km: `${(12 + Math.floor(r(i, "km") * 110)).toString()},${Math.floor(r(i, "km2") * 10)}00 km`,
      price: money(Math.round(150 + r(i, "p") * 280 + (year - 2016) * 18) * 1000),
      portal: Math.floor(r(i, "portal") * portals),
      img,
    });
  }
  return cards;
};
