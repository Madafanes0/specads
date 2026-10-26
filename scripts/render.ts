// npm run render -- briefs/lumen.json
import { makeBundle, renderBrief } from "./lib";

const main = async () => {
  const file = process.argv[2];
  if (!file) throw new Error("Uso: npm run render -- briefs/<marca>.json");
  const serveUrl = await makeBundle();
  const out = await renderBrief(serveUrl, file);
  console.log(`✓ ${out}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
