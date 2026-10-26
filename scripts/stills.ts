// Renderiza stills de frames clave para revisión: npm run stills -- briefs/x.json [frames...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { readBrief } from "./lib";

const main = async () => {
  const [briefPath, ...frameArgs] = process.argv.slice(2);
  if (!briefPath) throw new Error("Uso: npm run stills -- briefs/x.json [frames]");
  const brief = readBrief(briefPath);
  const name = path.basename(briefPath, ".json");
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  const comp = await selectComposition({ serveUrl, id: brief.template, inputProps: brief });
  const last = comp.durationInFrames - 1;
  const frames = frameArgs.length ? frameArgs.map(Number) : [0, 20, 90, 200, 380, last];
  fs.mkdirSync("out/stills", { recursive: true });
  for (const frame of frames) {
    const output = `out/stills/${name}-${frame}.jpg`;
    await renderStill({ serveUrl, composition: comp, inputProps: brief, frame, output, imageFormat: "jpeg", scale: 0.5, chromiumOptions: { gl: "angle" } });
    console.log("✓", output);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
