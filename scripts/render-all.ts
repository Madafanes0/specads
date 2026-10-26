// npm run render:all — renderiza todos los briefs/*.json
import fs from "node:fs";
import { makeBundle, renderBrief } from "./lib";

const main = async () => {
  const files = fs.readdirSync("briefs").filter((f) => f.endsWith(".json")).map((f) => `briefs/${f}`);
  const serveUrl = await makeBundle();
  const failed: string[] = [];
  for (const f of files) {
    console.log(`→ ${f}`);
    try {
      console.log(`✓ ${await renderBrief(serveUrl, f)}`);
    } catch (e) {
      // Un brief roto no detiene el resto
      console.error(`✗ ${f}: ${(e as Error).message}`);
      failed.push(f);
    }
  }
  if (failed.length) {
    console.error(`Fallaron: ${failed.join(", ")}`);
    process.exit(1);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
