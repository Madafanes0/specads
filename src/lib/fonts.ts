// Tipografía principal: Inter Tight (equivalente libre a SF Pro Display)
import { loadFont } from "@remotion/google-fonts/InterTight";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

export const FONT = fontFamily;

// Manuscrita para polaroids y mono para tickets/metadatos
import { loadFont as loadHand } from "@remotion/google-fonts/Caveat";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const HAND = loadHand("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
