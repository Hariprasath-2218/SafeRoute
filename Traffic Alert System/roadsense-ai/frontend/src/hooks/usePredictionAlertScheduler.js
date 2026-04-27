import { useEffect } from "react";
import {
  emitBrowserAlert,
  getLastIntervalFiredAt,
  getLatestPredictionAlertPayload,
  getPredictionAlertIntervalMin,
  getPredictionAlertsEnabled,
  setLastIntervalFiredAt,
} from "../utils/predictionAlerts.js";

export function usePredictionAlertScheduler(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (!getPredictionAlertsEnabled()) return;
      const latest = getLatestPredictionAlertPayload();
      if (!latest) return;

      const intervalMin = getPredictionAlertIntervalMin();
      const dueMs = Math.max(1, intervalMin) * 60 * 1000;
      const lastFiredAt = getLastIntervalFiredAt();
      const now = Date.now();
      if (now - lastFiredAt < dueMs) return;

      emitBrowserAlert(latest, {
        title: `Prediction interval alert (${intervalMin} min)`,
      });
      setLastIntervalFiredAt(now);
    };

    tick();
    const id = window.setInterval(tick, 15_000);

    const onNewPrediction = () => tick();
    window.addEventListener("roadsense-prediction-registered", onNewPrediction);

    return () => {
      window.clearInterval(id);
      window.removeEventListener(
        "roadsense-prediction-registered",
        onNewPrediction,
      );
    };
  }, [enabled]);
}
