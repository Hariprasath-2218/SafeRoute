/**
 * Map severity / risk score to Tailwind / hex colors for map markers and UI.
 */

export function severityToColor(severity) {
  const s = (severity || "").toLowerCase();
  if (s === "low") return "#10B981";
  if (s === "medium") return "#EAB308";
  if (s === "high") return "#F97316";
  if (s === "critical") return "#EF4444";
  return "#6B7280";
}

export function riskScoreToColor(score) {
  const v = Number(score) || 0;
  if (v < 30) return "#10B981";
  if (v < 50) return "#EAB308";
  if (v < 70) return "#F97316";
  return "#EF4444";
}

export function heatmapIntensity(riskScore) {
  return Math.min(1, Math.max(0.15, (Number(riskScore) || 0) / 100));
}
