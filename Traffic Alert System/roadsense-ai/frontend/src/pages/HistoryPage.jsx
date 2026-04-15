import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Trash2 } from "lucide-react";
import { fetchHistory, deleteHistoryItem } from "../api/prediction.js";
import { formatDate } from "../utils/formatters.js";
import { severityToColor } from "../utils/riskColors.js";

const DONUT_COLORS = ["#10B981", "#EAB308", "#F97316", "#EF4444"];

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [severity, setSeverity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, city: city || undefined, severity: severity || undefined };
      if (dateFrom) params.date_from = `${dateFrom}T00:00:00`;
      if (dateTo) params.date_to = `${dateTo}T23:59:59`;
      const data = await fetchHistory(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      toast.error(e.userMessage || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, city, severity, dateFrom, dateTo]);

  const timeSeries = useMemo(() => {
    const buckets = {};
    for (const row of items) {
      const d = (row.created_at || "").slice(0, 10);
      if (!d) continue;
      buckets[d] = (buckets[d] || 0) + 1;
    }
    return Object.entries(buckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  const severityDonut = useMemo(() => {
    const m = {};
    for (const row of items) {
      const k = row.severity_level || "Unknown";
      m[k] = (m[k] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [items]);

  const exportCsv = () => {
    const header = ["id", "type", "city", "risk", "severity", "created_at"];
    const lines = [header.join(",")].concat(
      items.map((r) =>
        [r.id, r.prediction_type, JSON.stringify(r.city), r.risk_score, r.severity_level, r.created_at].join(
          ","
        )
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roadsense-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this prediction?")) return;
    try {
      await deleteHistoryItem(id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e.userMessage || "Delete failed");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-txt-primary">Prediction history</h1>
        <p className="text-txt-secondary">Filter, export, and visualize your workspace trail.</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-bg-card p-4 lg:grid-cols-4">
        <div>
          <label className="text-xs text-txt-secondary">City contains</label>
          <input
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-txt-secondary">Severity</label>
          <select
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any</option>
            {["Low", "Medium", "High", "Critical"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-txt-secondary">From</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-txt-secondary">To</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-end gap-2 lg:col-span-4">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV ({items.length})
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg-card p-4 shadow-glass">
          <h3 className="mb-3 font-display text-lg font-semibold text-txt-primary">Predictions by day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries}>
                <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1C2333", border: "1px solid #2D3748", borderRadius: 12 }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-bg-card p-4 shadow-glass">
          <h3 className="mb-3 font-display text-lg font-semibold text-txt-primary">Severity mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityDonut} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {severityDonut.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1C2333", border: "1px solid #2D3748", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-glass">
        {loading ? (
          <div className="p-8 text-center text-txt-secondary">Loading…</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-bg-secondary/80 text-xs uppercase text-txt-secondary">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs text-txt-secondary">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3">{row.city}</td>
                  <td className="px-4 py-3 capitalize">{row.prediction_type}</td>
                  <td className="px-4 py-3 font-mono">{Number(row.risk_score).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${severityToColor(row.severity_level)}22`,
                        color: severityToColor(row.severity_level),
                      }}
                    >
                      {row.severity_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex rounded-lg border border-border p-2 text-txt-secondary hover:text-accent-danger"
                      onClick={() => onDelete(row.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-txt-secondary">
          <span>
            Page {page} — {total} records
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
