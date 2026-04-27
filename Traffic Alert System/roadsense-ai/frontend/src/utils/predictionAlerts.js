const STORAGE = {
  enabled: "roadsense_prediction_alerts_enabled",
  intervalMin: "roadsense_prediction_alert_interval_min",
  latestPayload: "roadsense_latest_prediction_alert",
  firstShown: "roadsense_first_prediction_popup_shown",
  lastIntervalFiredAt: "roadsense_prediction_last_interval_fired_at",
};

const DEFAULT_INTERVAL = 5;

export function getPredictionAlertsEnabled() {
  const raw = localStorage.getItem(STORAGE.enabled);
  if (raw == null) return true;
  return raw === "true";
}

export function setPredictionAlertsEnabled(enabled) {
  localStorage.setItem(STORAGE.enabled, String(Boolean(enabled)));
}

export function getPredictionAlertIntervalMin() {
  const raw = Number(localStorage.getItem(STORAGE.intervalMin));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_INTERVAL;
  return raw;
}

export function setPredictionAlertIntervalMin(mins) {
  localStorage.setItem(
    STORAGE.intervalMin,
    String(Math.max(1, Number(mins) || DEFAULT_INTERVAL)),
  );
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  if (Notification.permission === "granted") return "granted";
  const perm = await Notification.requestPermission();
  return perm;
}

function buildAlertText(payload) {
  const risk = Number(payload?.riskScore ?? 0).toFixed(1);
  const sev = payload?.severity || "Unknown";
  const city = payload?.city || "Unknown city";
  return `Prediction ${sev} (${risk}) in ${city}`;
}

export function emitBrowserAlert(
  payload,
  { title = "RoadSense Prediction", forcePopup = false } = {},
) {
  const body = buildAlertText(payload);
  if (forcePopup) {
    window.alert(`${title}\n${body}`);
    return;
  }
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(title, { body });
    return;
  }
  window.alert(`${title}\n${body}`);
}

export function registerPredictionForAlerts(payload) {
  const normalized = {
    riskScore: Number(payload?.riskScore ?? 0),
    severity: payload?.severity || "Unknown",
    city: payload?.city || "Unknown city",
    at: Date.now(),
  };
  localStorage.setItem(STORAGE.latestPayload, JSON.stringify(normalized));

  const firstShown = localStorage.getItem(STORAGE.firstShown) === "true";
  if (!firstShown) {
    emitBrowserAlert(normalized, {
      title: "First prediction completed",
      forcePopup: true,
    });
    localStorage.setItem(STORAGE.firstShown, "true");
    localStorage.setItem(STORAGE.lastIntervalFiredAt, String(Date.now()));
  }

  window.dispatchEvent(
    new CustomEvent("roadsense-prediction-registered", { detail: normalized }),
  );
}

export function getLatestPredictionAlertPayload() {
  const raw = localStorage.getItem(STORAGE.latestPayload);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getLastIntervalFiredAt() {
  return Number(localStorage.getItem(STORAGE.lastIntervalFiredAt) || 0);
}

export function setLastIntervalFiredAt(ts) {
  localStorage.setItem(STORAGE.lastIntervalFiredAt, String(ts));
}
