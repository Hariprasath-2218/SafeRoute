import { motion } from "framer-motion";
import { useMemo } from "react";
import { riskScoreToColor } from "../../utils/riskColors.js";

export default function RiskGauge({
  score = 0,
  label = "Accident probability",
}) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const color = riskScoreToColor(pct);

  const { arcD, arcLength, progressLength } = useMemo(() => {
    const r = 52;
    const d = "M 8 60 A 52 52 0 0 1 112 60";
    const total = Math.PI * r;
    const progress = total * (pct / 100);
    return {
      arcD: d,
      arcLength: total,
      progressLength: Math.max(progress, 0.01),
    };
  }, [pct]);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 120 80">
        <defs>
          <linearGradient id="gaugeGlow" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path
          d={arcD}
          fill="none"
          stroke="#2D3748"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d={arcD}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${arcLength}` }}
          animate={{ strokeDasharray: `${progressLength} ${arcLength}` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <p className="font-mono text-4xl font-semibold" style={{ color }}>
        {pct.toFixed(1)}
      </p>
      <p className="text-sm text-txt-secondary">{label}</p>
    </div>
  );
}
