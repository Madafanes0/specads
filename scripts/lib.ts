// Utilidades compartidas por los scripts de render
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { appFlowSchema, appShowcaseSchema, dataExplainerSchema, heroLogoSchema, mapPinSchema } from "../src/schemas";

const SCHEMAS = {
  HeroLogo: heroLogoSchema,
  DataExplainer: dataExplainerSchema,
  MapPin: mapPinSchema,
  AppShowcase: appShowcaseSchema,
  AppFlow: appFlowSchema,
} as const;
export const TEMPLATES = Object.keys(SCHEMAS);

export const readBrief = (file: string) => {
  const brief = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!TEMPLATES.includes(brief.template)) {
    throw new Error(`${file}: "template" debe ser uno de ${TEMPLATES.join(", ")}`);
  }
  // Se valida y completa con defaults: así ningún campo omitido hereda el valor del brief de ejemplo de la composition
  const parsed = SCHEMAS[brief.template as keyof typeof SCHEMAS].parse(brief);
  return parsed as Record<string, unknown> & { template: string; brand: string };
};

export const makeBundle = () => bundle({ entryPoint: path.resolve("src/index.ts") });

/** Renderiza un brief a out/{nombre}.mp4 (H.264, CRF 17) */
export const renderBrief = async (serveUrl: string, file: string) => {
  const brief = readBrief(file);
  const name = path.basename(file, ".json");
  // calculateMetadata toma la duración del brief
  const composition = await selectComposition({ serveUrl, id: brief.template, inputProps: brief });
  fs.mkdirSync("out", { recursive: true });
  const outputLocation = `out/${name}.mp4`;
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps: brief,
    codec: "h264",
    crf: 17,
    pixelFormat: "yuv420p",
    imageFormat: "jpeg",
    jpegQuality: 95,
    chromiumOptions: { gl: "angle" },
    // Escenas 3D con blur consumen mucha memoria de GPU: concurrencia moderada
    concurrency: Number(process.env.CONCURRENCY ?? 3),
    outputLocation,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct % 10 === 0 && pct !== last) {
        last = pct;
        process.stdout.write(`  ${name}: ${pct}%\n`);
      }
    },
  });
  return outputLocation;
};
