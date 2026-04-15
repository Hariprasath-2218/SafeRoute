import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bot, Send, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { askAssistant } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/formatters.js";
import { severityToColor } from "../utils/riskColors.js";

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  const placeholder = useMemo(
    () =>
      user?.full_name
        ? `Ask anything, ${user.full_name.split(" ")[0]}...`
        : "Ask traffic assistant...",
    [user?.full_name],
  );

  const onAskAssistant = async (e) => {
    e.preventDefault();
    const q = message.trim();
    if (!q) return;

    const userMsg = {
      role: "user",
      text: q,
      predictions: [],
      chart: null,
      charts: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setAiBusy(true);

    try {
      const data = await askAssistant({ message: q });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "No response",
          predictions: data.predictions || [],
          chart: data.chart || null,
          charts: data.charts || [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error(err.userMessage || "Assistant unavailable");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not process that right now.",
          predictions: [],
          chart: null,
          charts: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setAiBusy(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiBusy]);

  return (
    <div className="h-[calc(100vh-9rem)] min-h-[620px] w-full">
      <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-glass">
        <div className="flex items-center justify-between border-b border-border bg-bg-secondary/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-success/20 text-accent-success">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold text-txt-primary">
                Traffic Assistant
              </h1>
              <p className="flex items-center gap-1 text-xs text-txt-secondary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Ollama llama3.2:1b • local model
              </p>
            </div>
          </div>
          <p className="hidden text-xs text-txt-secondary md:block">
            Tip: try "get my predictions", "get all predictions", or "analyze
            predictions"
          </p>
        </div>

        <div className="flex-1 overflow-auto bg-gradient-to-b from-bg-primary via-bg-secondary/25 to-bg-primary p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.length === 0 ? (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border bg-bg-card/85 p-4 text-center text-sm text-txt-secondary">
                Ask route safety, weather impact, driving tips, or type "get my
                predictions" / "get all predictions" / "analyze predictions".
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                const charts =
                  Array.isArray(m.charts) && m.charts.length > 0
                    ? m.charts
                    : m.chart
                      ? [m.chart]
                      : [];
                return (
                  <div
                    key={`${m.role}-${idx}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-sm shadow-sm sm:max-w-[78%] ${
                        isUser
                          ? "rounded-br-md bg-accent-success/90 text-white"
                          : "rounded-bl-md border border-border bg-bg-card text-txt-primary"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                      {Array.isArray(m.predictions) &&
                        m.predictions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {m.predictions.map((p) => (
                              <div
                                key={p.id}
                                className="rounded-lg border border-border/70 bg-bg-secondary/70 p-2 text-xs"
                              >
                                <p className="text-txt-primary">
                                  {p.prediction_type} •{" "}
                                  {p.city || "Unknown city"}
                                </p>
                                <p className="font-mono text-txt-secondary">
                                  {formatDate(p.created_at)}
                                </p>
                                <span
                                  className="mt-1 inline-block rounded-full px-2 py-0.5"
                                  style={{
                                    backgroundColor: `${severityToColor(p.severity_level)}22`,
                                    color: severityToColor(p.severity_level),
                                  }}
                                >
                                  {p.severity_level} • Risk{" "}
                                  {Number(p.risk_score).toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      {charts.map((chart, cIdx) =>
                        Array.isArray(chart?.slices) &&
                        chart.slices.length > 0 ? (
                          <div
                            key={`${chart.title || "chart"}-${cIdx}`}
                            className="mt-3 rounded-lg border border-border/70 bg-bg-secondary/70 p-2"
                          >
                            <p className="mb-2 text-xs font-semibold text-txt-primary">
                              {chart.title || "Prediction Analysis"}
                            </p>
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                {chart.chart_type === "bar" ? (
                                  <BarChart data={chart.slices}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                      dataKey="value"
                                      name="Count"
                                      radius={[6, 6, 0, 0]}
                                    >
                                      {chart.slices.map((slice) => (
                                        <Cell
                                          key={slice.name}
                                          fill={
                                            slice.color ||
                                            severityToColor(slice.name)
                                          }
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                ) : chart.chart_type === "line" ? (
                                  <LineChart data={chart.slices}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                      type="monotone"
                                      dataKey="value"
                                      name="Average risk"
                                      stroke="#0ea5e9"
                                      strokeWidth={2}
                                      dot={{ r: 4 }}
                                    />
                                  </LineChart>
                                ) : (
                                  <PieChart>
                                    <Pie
                                      data={chart.slices}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={82}
                                      label
                                    >
                                      {chart.slices.map((slice) => (
                                        <Cell
                                          key={slice.name}
                                          fill={
                                            slice.color ||
                                            severityToColor(slice.name)
                                          }
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : null,
                      )}
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isUser ? "text-white/80" : "text-txt-secondary"
                        }`}
                      >
                        {formatDate(m.createdAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {aiBusy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-border bg-bg-card px-3 py-2 text-xs text-txt-secondary">
                  Assistant is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        <form
          onSubmit={onAskAssistant}
          className="border-t border-border bg-bg-secondary/60 p-3"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              className="min-h-[44px] flex-1 rounded-full border border-border bg-bg-card px-4 py-2.5 text-sm outline-none ring-accent-success/40 focus:ring"
            />
            <button
              type="submit"
              disabled={aiBusy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-success text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
