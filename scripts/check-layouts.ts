// Verifica que ningún layout tenga tarjetas superpuestas, sobre el logo o fuera de cuadro.
// Uso: npx tsx scripts/check-layouts.ts
import { LAYOUTS } from "../src/presets/layouts";

const P = 1250; // perspectiva de la cámara
const GAP = 20; // margen extra (flotación + drift)
const LOGO = 175;

const project = (s: (typeof LAYOUTS)["orbit"][number]) => {
  const k = P / (P - s.z);
  const w = s.w * Math.cos((s.ry * Math.PI) / 180) * k + Math.abs(Math.sin((s.rz * Math.PI) / 180)) * s.h * k;
  const h = s.h * Math.cos((s.rx * Math.PI) / 180) * k;
  return { x0: s.x * k - w / 2 - GAP, x1: s.x * k + w / 2 + GAP, y0: s.y * k - h / 2 - GAP, y1: s.y * k + h / 2 + GAP };
};
type R = ReturnType<typeof project>;
const hit = (a: R, b: R) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0);
const logo: R = { x0: -LOGO, x1: LOGO, y0: -LOGO, y1: LOGO };

let bad = 0;
for (const [name, slots] of Object.entries(LAYOUTS)) {
  const rs = slots.map(project);
  const issues: string[] = [];
  rs.forEach((a, i) => {
    if (slots[i].z > -500 && hit(a, logo)) issues.push(`#${i} toca el logo`);
    rs.forEach((b, j) => {
      // Solo importan tarjetas en planos de profundidad parecidos
      if (j > i && Math.abs(slots[i].z - slots[j].z) < 400 && hit(a, b)) issues.push(`#${i} ∩ #${j}`);
    });
    if (slots[i].z > -800 && (a.x0 < -560 || a.x1 > 560)) issues.push(`#${i} sale por el costado`);
  });
  bad += issues.length;
  console.log(`${issues.length ? "✗" : "✓"} ${name}${issues.length ? ": " + issues.join(", ") : ""}`);
}
process.exit(bad ? 1 : 0);
