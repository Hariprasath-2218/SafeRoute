/** Human-friendly formatters for dates and numbers in tables and charts. */

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatPercent(x, digits = 1) {
  return `${(Number(x) * 100).toFixed(digits)}%`;
}
