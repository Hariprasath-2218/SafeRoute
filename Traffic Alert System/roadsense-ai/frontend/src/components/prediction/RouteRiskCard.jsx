import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { riskScoreToColor } from "../../utils/riskColors.js";

const COLORS = ["#10B981", "#EAB308", "#F97316", "#EF4444"];

export default function RouteRiskCard({
  overall,
  safestHour,
  distanceKm,
  waypoints = [],
  pickActive = false,
  onTogglePick,
}) {
  const counts = waypoints.reduce(
    (acc, w) => {
      const k = (w.severity || "Medium").toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 },
  );

  const pieData = [
    { name: "Low", value: counts.low },
    { name: "Medium", value: counts.medium },
    { name: "High", value: counts.high },
    { name: "Critical", value: counts.critical },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-bg-card p-4 shadow-glass">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-txt-secondary">
            Overall route risk
          </p>
          <p
            className="font-mono text-3xl font-bold"
            style={{ color: riskScoreToColor(overall) }}
          >
            {(overall ?? 0).toFixed(1)}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="text-right text-sm text-txt-secondary">
            <p>Safest departure hour</p>
            <p className="font-mono text-txt-primary">
              {String(safestHour).padStart(2, "0")}:00
            </p>
          </div>
          {onTogglePick && (
            <button
              type="button"
              className={`rounded-lg border px-3 py-1.5 text-xs ${pickActive ? "border-emerald-500 bg-emerald-600 text-white" : "border-border bg-bg-secondary text-txt-primary"}`}
              onClick={onTogglePick}
              title="Toggle map pick mode"
            >
              Pick: {pickActive ? "On" : "Off"}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-txt-secondary">
        Great-circle distance ≈{" "}
        <span className="font-mono text-txt-primary">{distanceKm} km</span>
      </p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="value"
              data={pieData}
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1C2333",
                border: "1px solid #2D3748",
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs text-txt-secondary">
        Waypoint risk breakdown
      </p>
    </div>
  );
}
