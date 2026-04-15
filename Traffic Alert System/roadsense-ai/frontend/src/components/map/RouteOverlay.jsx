import { Polyline } from "react-leaflet";
import { riskScoreToColor } from "../../utils/riskColors.js";

/**
 * Draws color-coded segments along a route. `riskScores` should align with segment count (len-1).
 */
export default function RouteOverlay({ positions, riskScores = [] }) {
  if (!positions || positions.length < 2) return null;

  const segs = [];
  for (let i = 0; i < positions.length - 1; i += 1) {
    const a = positions[i];
    const b = positions[i + 1];
    const r = riskScores[i] ?? riskScores[riskScores.length - 1] ?? 40;
    segs.push({
      key: `${a[0]}-${a[1]}-${i}`,
      positions: [a, b],
      color: riskScoreToColor(r),
    });
  }

  return (
    <>
      {segs.map((s) => (
        <Polyline
          key={s.key}
          positions={s.positions}
          pathOptions={{
            color: s.color,
            weight: 6,
            opacity: 0.92,
            lineCap: "round",
            dashArray: "12 14",
            className: "roadsense-route-line",
          }}
        />
      ))}
    </>
  );
}
