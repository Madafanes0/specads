// Resolución de assets de /public con fallback a placeholder
import { getStaticFiles, staticFile } from "remotion";

let cache: Set<string> | null = null;
const files = () => {
  if (!cache) cache = new Set(getStaticFiles().map((f) => f.name));
  return cache;
};

/** Devuelve la URL del asset o null si no existe en /public */
export const resolveAsset = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.replace(/^\/?(public\/)?/, "");
  return files().has(clean) ? staticFile(clean) : null;
};
