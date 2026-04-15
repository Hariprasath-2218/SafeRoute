import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, accent = "primary" }) {
  const accents = {
    primary: "from-accent-primary/20 to-accent-secondary/10 text-accent-primary",
    success: "from-accent-success/20 to-emerald-900/10 text-accent-success",
    warning: "from-accent-warning/20 to-amber-900/10 text-accent-warning",
    danger: "from-accent-danger/20 to-red-900/10 text-accent-danger",
  };
  const cls = accents[accent] || accents.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-bg-card p-5 shadow-glass"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${cls} opacity-40`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-txt-secondary">{title}</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-txt-primary">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-txt-secondary">{subtitle}</p>}
        </div>
        {Icon && (
          <span className="rounded-xl bg-bg-secondary p-2 text-accent-primary">
            <Icon className="h-6 w-6" />
          </span>
        )}
      </div>
    </motion.div>
  );
}
