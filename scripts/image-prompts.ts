// Genera 6–8 prompts fotográficos coherentes a partir de un brief
// Uso: npm run prompts -- briefs/lumen.json   (o sin argumento: todos los briefs)
import fs from "node:fs";
import path from "node:path";

type Brief = {
  brand: string;
  template: string;
  concept?: string;
  headline?: string;
  accentColor?: string;
  palette?: string;
  models?: string[];
  target?: { title: string; year: string };
};

/** Nombre aproximado del color (los modelos de imagen no entienden hex) */
const colorName = (hex = "#ffffff") => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return max > 0.7 ? "white" : "silver";
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  const names: [number, string][] = [[15, "red"], [40, "orange"], [65, "amber"], [160, "green"], [195, "teal"], [250, "blue"], [290, "violet"], [335, "magenta"], [360, "red"]];
  return names.find(([lim]) => h < lim)![1];
};

// Estilo compartido: misma luz, grading y lente en todas las imágenes
const STYLE = (b: Brief) => {
  const tone = { warm: "warm amber highlights, deep brown shadows", cold: "cool blue night tones, cyan highlights", noir: "teal-and-orange grading, deep inky shadows" }[
    b.palette ?? "noir"
  ];
  return [
    "editorial lifestyle photograph, shot on 35mm film, 35mm lens, f/1.8, shallow depth of field",
    `cinematic color grading, ${tone}, subtle accent of ${colorName(b.accentColor)} light`,
    "soft directional practical light, natural film grain, high dynamic range, moody and premium",
    "vertical 4:5 composition, generous negative space",
    "no text, no logos, no watermarks, no brand names, no signage",
  ].join(", ");
};

// Planos variados pero de una misma "sesión de fotos"
const SHOTS = [
  "wide establishing shot of the setting at blue hour",
  "medium shot of a person mid-action, candid, face partially turned away",
  "close-up detail of hands interacting with the product or object",
  "over-the-shoulder shot looking towards the destination",
  "low-angle shot with reflections on wet pavement or glass",
  "intimate portrait with bokeh city lights behind",
  "top-down detail shot of textures and materials",
  "silhouette against a bright window or sunset, rim light",
];

// Tunnel: fotos de anuncio de seminuevos (horizontales 3:2), no fotos editoriales
const CAR_STYLE = [
  "realistic used-car listing photo as posted on a Mexican classifieds site",
  "full car visible, car fills about 70% of the frame, eye-level camera, 35mm lens",
  "clean dealer lot or street in Mexico City, soft daylight, natural colors, sharp focus",
  "horizontal 3:2 composition",
  "no people, no text, no watermarks, license plate blank or blurred",
].join(", ");
const ANGLES = ["side profile view", "front three-quarter view", "rear three-quarter view"];
const PAINTS = ["white", "silver", "dark gray", "black", "red", "dark blue"];

const buildTunnel = (file: string, b: Brief) => {
  const models = (b.models?.length ? b.models : ["Nissan Versa", "VW Jetta", "Toyota Corolla"]).slice(0, 12);
  const dir = `img/${path.basename(file, ".json")}`;
  const lines: string[] = [];
  models.forEach((m, i) =>
    ANGLES.forEach((a, j) => {
      const n = i * ANGLES.length + j + 1;
      const year = 2016 + ((i * 3 + j) % 8);
      lines.push(`${n}. \`${dir}/${n}.jpg\` — ${year} ${m}, ${PAINTS[(i + j) % PAINTS.length]}, ${a}. ${CAR_STYLE}.`);
    }),
  );
  const t = b.target;
  const md = [
    `# Prompts de imagen · ${b.brand} (túnel)`,
    "",
    `Pega cada prompt en Higgsfield / Nano Banana / GPT Image y guarda el resultado en \`public/\` con el nombre indicado.`,
    "El brief ya apunta a esas rutas: la foto que falte se queda como silueta procedural.",
    "",
    "## Anuncio que encuentra la mira",
    "",
    t ? `\`${dir}/target.jpg\` — ${t.year} ${t.title} sedan, soul red metallic, front three-quarter view, the best-looking car of the set. ${CAR_STYLE}.` : "",
    "",
    "## Anuncios de relleno",
    "",
    ...lines.flatMap((l) => [l, ""]),
  ].join("\n");
  const out = path.join(path.dirname(file), `${path.basename(file, ".json")}.prompts.md`);
  fs.writeFileSync(out, md);
  console.log(`✓ ${out}`);
};

const build = (file: string) => {
  const b: Brief = JSON.parse(fs.readFileSync(file, "utf8"));
  if (b.template === "Tunnel") return buildTunnel(file, b);
  const concept = b.concept ?? `${b.brand} brand world, everyday moments where the product matters`;
  const n = 6 + (b.brand.length % 3); // 6–8 prompts
  const lines = SHOTS.slice(0, n).map((shot, i) => `${i + 1}. ${shot}. Scene: ${concept}. ${STYLE(b)}.`);
  const md = [
    `# Prompts de imagen · ${b.brand}`,
    "",
    `Plantilla: **${b.template}** · Slogan: _${b.headline ?? ""}_`,
    "",
    "Pega cada prompt en Higgsfield / Nano Banana / GPT Image. Guarda los resultados como",
    `\`public/img/${b.brand.toLowerCase()}/1.jpg\`, \`2.jpg\`… y añádelos a \`images\` del brief.`,
    "",
    ...lines.flatMap((l) => [l, ""]),
  ].join("\n");
  const out = path.join(path.dirname(file), `${path.basename(file, ".json")}.prompts.md`);
  fs.writeFileSync(out, md);
  console.log(`✓ ${out}`);
};

const arg = process.argv[2];
const files = arg ? [arg] : fs.readdirSync("briefs").filter((f) => f.endsWith(".json")).map((f) => `briefs/${f}`);
files.forEach(build);
