import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatDate } from "../../utils/formatters.js";
import { severityToColor } from "../../utils/riskColors.js";

export default function RecentPredictions({ items = [] }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5 shadow-glass">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-txt-primary">
          Recent predictions
        </h3>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-sm text-accent-primary hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-txt-secondary">
              <th className="pb-2 pr-4 font-medium">When</th>
              <th className="pb-2 pr-4 font-medium">City</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Risk</th>
              <th className="pb-2 font-medium">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-txt-secondary">
                  No predictions yet — start from the map workspace.
                </td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-bg-secondary/50">
                <td className="py-3 pr-4 font-mono text-xs text-txt-secondary">
                  {formatDate(row.created_at)}
                </td>
                <td className="py-3 pr-4 text-txt-primary">{row.city}</td>
                <td className="py-3 pr-4 capitalize text-txt-secondary">{row.prediction_type}</td>
                <td className="py-3 pr-4 font-mono">{Number(row.risk_score).toFixed(1)}</td>
                <td className="py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${severityToColor(row.severity_level)}22`,
                      color: severityToColor(row.severity_level),
                    }}
                  >
                    {row.severity_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
