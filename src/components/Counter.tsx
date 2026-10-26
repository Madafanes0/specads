// Contador animado: el número sigue al progreso (0–1) que le pasen
import React from "react";
import { FONT } from "../lib/fonts";

type Props = { value: number; progress: number; prefix?: string; suffix?: string; decimals?: number; style?: React.CSSProperties };

export const formatValue = (v: number, decimals: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const Counter: React.FC<Props> = ({ value, progress, prefix = "", suffix = "", decimals = 0, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", whiteSpace: "nowrap", ...style }}>
    {prefix}
    {formatValue(value * Math.min(1, Math.max(0, progress)), decimals)}
    {suffix}
  </div>
);
