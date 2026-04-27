import { useCallback, useEffect, useMemo, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import MapView from "../components/map/MapView.jsx";
import LocationPicker from "../components/map/LocationPicker.jsx";
import PredictionForm from "../components/prediction/PredictionForm.jsx";
import RiskGauge from "../components/prediction/RiskGauge.jsx";
import { predictPoint, fetchHeatmapHistory } from "../api/prediction.js";
import { reverseGeocode } from "../utils/nominatim.js";
import { riskScoreToColor, severityToColor } from "../utils/riskColors.js";
import { usePredictionCtx } from "../context/PredictionContext.jsx";
import { registerPredictionForAlerts } from "../utils/predictionAlerts.js";

function FlyTo({ center, zoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapPredictionPage() {
  const { setLastPoint } = usePredictionCtx();
  const [picking, setPicking] = useState(true);
  const [pick, setPick] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [heatPoints, setHeatPoints] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchHeatmapHistory(400);
        const pts = (data.items || [])
          .filter((row) => row.latitude != null && row.longitude != null)
          .map((row) => ({
            lat: row.latitude,
            lng: row.longitude,
            intensity: Math.min(1, (row.risk_score || 40) / 100),
          }));
        if (!cancelled) setHeatPoints(pts);
      } catch {
        if (!cancelled) setHeatPoints([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onMapPick = useCallback(async (lat, lng) => {
    setPick({ lat, lng, city: "", state: "" });
    setLoadingGeo(true);
    setResult(null);
    try {
      const geo = await reverseGeocode(lat, lng);
      setPick({
        lat,
        lng,
        city: geo.city || "Unknown",
        state: geo.state || "",
      });
      toast.success("Location captured");
    } catch {
      toast.error("Could not reverse geocode");
      setPick({ lat, lng, city: "", state: "" });
    } finally {
      setLoadingGeo(false);
    }
  }, []);

  const formDefaults = useMemo(() => {
    return {
      hour_of_day: new Date().getHours(),
      city: pick?.city || "",
      state: pick?.state || "",
      road_type: "State Highway",
      road_surface_condition: "Dry",
      road_width_meters: 8,
      number_of_lanes: 4,
      speed_limit_kmh: 80,
      average_speed_kmh: 55,
      weather_condition: "Clear",
      temperature_celsius: 28,
      humidity_percent: 55,
      visibility_km: 5,
      traffic_density: 0.45,
      light_condition: "Daylight",
      signal_present: 1,
      road_divider_present: 0,
      vehicle_type_involved: "Car",
      vehicles_involved: 2,
      pedestrians_nearby: 5,
    };
  }, [pick]);

  const onPredict = async (values) => {
    if (!pick) {
      toast.error("Pick a point on the map first");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        latitude: pick.lat,
        longitude: pick.lng,
        month: new Date().getMonth() + 1,
        signal_present: Number(values.signal_present),
        road_divider_present: Number(values.road_divider_present),
      };
      const data = await predictPoint(payload);
      setResult(data);
      setLastPoint(data);
      registerPredictionForAlerts({
        riskScore: data.risk_score,
        severity: data.severity_level,
        city: values.city,
      });
      toast.success("Prediction ready");
    } catch (e) {
      toast.error(e.userMessage || "Prediction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const markerIcon = result
    ? L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:999px;background:${severityToColor(
          result.severity_level,
        )};box-shadow:0 0 0 3px rgba(255,255,255,0.25);"></div>`,
        iconSize: [22, 22],
      })
    : pick
      ? L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;border-radius:999px;background:${riskScoreToColor(
            25,
          )};border:2px solid white;"></div>`,
          iconSize: [18, 18],
        })
      : null;

  return (
    <div className="relative flex min-h-[92vh] flex-col">
      <div className="pointer-events-none order-1 flex w-full max-w-[420px] flex-col gap-3 px-4 pb-4 md:absolute md:left-4 md:top-4 md:z-[600] md:w-[min(100%,420px)] md:max-w-none md:px-0 md:pb-0">
        <div className="pointer-events-auto rounded-2xl border border-border bg-bg-card/90 p-4 shadow-glass backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="font-display text-lg font-semibold text-txt-primary">
              Map prediction
            </h1>
            <button
              type="button"
              className={`rounded-lg px-2 py-1 text-xs ${picking ? "bg-accent-primary text-white" : "bg-bg-secondary text-txt-secondary"}`}
              onClick={() => setPicking((p) => !p)}
            >
              {picking ? "Picking on" : "Picking off"}
            </button>
          </div>
          <p className="mb-2 text-xs text-txt-secondary">
            {loadingGeo
              ? "Resolving address…"
              : "Click the map to anchor the scenario. Tune road and weather factors, then predict."}
          </p>
          <PredictionForm
            key={`${pick?.lat}-${pick?.lng}-${formDefaults.city}`}
            defaultValues={formDefaults}
            onSubmit={onPredict}
            submitting={submitting}
            submitLabel="Predict risk at point"
          />
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-xl border border-border px-3 py-2 text-xs ${heatmapOn ? "bg-accent-secondary text-white" : "bg-bg-card text-txt-primary"}`}
            onClick={() => setHeatmapOn((v) => !v)}
          >
            Heatmap: {heatmapOn ? "On" : "Off"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-border bg-bg-card px-3 py-2 text-xs text-txt-primary"
            onClick={() => {
              setPick(null);
              setResult(null);
            }}
          >
            Clear map
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            className="pointer-events-auto absolute right-4 top-4 z-[600] w-[min(100%,360px)] rounded-2xl border border-border bg-bg-card/95 p-4 shadow-glass backdrop-blur-xl"
          >
            <h2 className="font-display text-lg font-semibold text-txt-primary">
              Assessment
            </h2>
            <RiskGauge score={result.risk_score} />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-txt-secondary">Severity</dt>
                <dd className="font-medium text-txt-primary">
                  {result.severity_level}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-txt-secondary">Model class</dt>
                <dd className="font-mono text-txt-primary">
                  {result.accident_occurred}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-txt-secondary">Probability</dt>
                <dd className="font-mono text-txt-primary">
                  {result.probability?.toFixed(3)}
                </dd>
              </div>
            </dl>
          </motion.aside>
        )}
      </AnimatePresence>

      <MapView
        heatmapPoints={heatPoints}
        showHeatmap={heatmapOn}
        containerClassName="order-2 h-[70vh] md:h-[90vh]"
      >
        <LocationPicker active={picking} onPick={onMapPick} />
        {pick && <FlyTo center={[pick.lat, pick.lng]} />}
        {pick && markerIcon && (
          <Marker position={[pick.lat, pick.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-gray-900">
                <p className="font-semibold">RoadSense</p>
                {result ? (
                  <>
                    <p>Risk: {result.risk_score}</p>
                    <p>{result.severity_level}</p>
                  </>
                ) : (
                  <p>Selected point</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapView>
    </div>
  );
}
