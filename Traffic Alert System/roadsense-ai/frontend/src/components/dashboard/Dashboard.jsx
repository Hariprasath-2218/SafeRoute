import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldAlert, Route, Target } from "lucide-react";
import StatsCard from "./StatsCard.jsx";
import RecentPredictions from "./RecentPredictions.jsx";
import { fetchHistory, fetchHistoryStats, fetchModelInfo } from "../../api/prediction.js";
import { formatPercent } from "../../utils/formatters.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, hist, m] = await Promise.all([
          fetchHistoryStats(),
          fetchHistory({ page: 1, limit: 6 }),
          fetchModelInfo().catch(() => null),
        ]);
        if (!cancelled) {
          setStats(s);
          setRecent(hist.items || []);
          setModel(m);
        }
      } catch {
        if (!cancelled) {
          setStats({ total_predictions: 0, alerts_count: 0, safe_routes_count: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const acc =
    model?.metrics?.accuracy != null ? formatPercent(model.metrics.accuracy, 1) : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-txt-primary md:text-3xl">
          Operations overview
        </h1>
        <p className="mt-1 text-txt-secondary">
          Real-time signals from your prediction graph and route intelligence.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-bg-card"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total predictions"
            value={stats?.total_predictions ?? 0}
            subtitle="Lifetime workspace volume"
            icon={MapPin}
            accent="primary"
          />
          <StatsCard
            title="Accident alerts"
            value={stats?.alerts_count ?? 0}
            subtitle="High / critical severity"
            icon={ShieldAlert}
            accent="danger"
          />
          <StatsCard
            title="Safe routes"
            value={stats?.safe_routes_count ?? 0}
            subtitle="Routes with manageable risk"
            icon={Route}
            accent="success"
          />
          <StatsCard
            title="Model accuracy"
            value={acc}
            subtitle={model?.trained_at ? `Trained ${model.trained_at.slice(0, 10)}` : "Live model"}
            icon={Target}
            accent="warning"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentPredictions items={recent} />
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-bg-card p-5 shadow-glass">
          <h3 className="font-display text-lg font-semibold text-txt-primary">Quick actions</h3>
          <p className="text-sm text-txt-secondary">
            Launch the geospatial workspace to score a point or an entire corridor.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/map"
              className="rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
            >
              Open map prediction
            </Link>
            <Link
              to="/route"
              className="rounded-xl border border-border px-4 py-3 text-center text-sm font-medium text-txt-primary hover:border-accent-primary"
            >
              Plan route risk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
