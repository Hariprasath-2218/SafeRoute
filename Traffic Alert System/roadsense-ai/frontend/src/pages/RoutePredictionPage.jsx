import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import MapView from "../components/map/MapView.jsx";
import LocationPicker from "../components/map/LocationPicker.jsx";
import RouteOverlay from "../components/map/RouteOverlay.jsx";
import {
  createRouteDestinationPinIcon,
  createRouteSourceCarIcon,
} from "../components/map/routeLeafletIcons.js";
import PredictionForm from "../components/prediction/PredictionForm.jsx";
import RouteRiskCard from "../components/prediction/RouteRiskCard.jsx";
import TrafficAccidentScene3D from "../components/route/TrafficAccidentScene3D.jsx";
import RouteGuidancePopover from "../components/route/RouteGuidancePopover.jsx";
import { predictRoute, fetchHeatmapHistory } from "../api/prediction.js";
import {
  googleForwardGeocode,
  googleReverseGeocode,
  getGoogleMapsApiKey,
} from "../utils/googleGeocoding.js";
import { usePredictionCtx } from "../context/PredictionContext.jsx";
import { registerPredictionForAlerts } from "../utils/predictionAlerts.js";

/**
 * Fit the map to the route polyline when scored; otherwise frame source + destination
 * after Google search or picks; single-point search flies to that city.
 */
function RouteMapBounds({ source, destination, pathPositions }) {
  const map = useMap();

  useEffect(() => {
    if (pathPositions?.length >= 2) {
      const latlngs = pathPositions.map((p) => L.latLng(p[0], p[1]));
      const b = L.latLngBounds(latlngs);
      if (b.isValid()) {
        map.fitBounds(b.pad(0.12), { maxZoom: 14, animate: true });
      }
      return;
    }
    if (source && destination) {
      const b = L.latLngBounds(
        L.latLng(source.lat, source.lng),
        L.latLng(destination.lat, destination.lng),
      );
      if (b.isValid()) {
        map.fitBounds(b.pad(0.16), { maxZoom: 11, animate: true });
      }
      return;
    }
    if (source) {
      map.flyTo([source.lat, source.lng], 9, { animate: true });
    } else if (destination) {
      map.flyTo([destination.lat, destination.lng], 9, { animate: true });
    }
  }, [
    map,
    source?.lat,
    source?.lng,
    destination?.lat,
    destination?.lng,
    pathPositions,
  ]);

  return null;
}

export default function RoutePredictionPage() {
  const { setLastRoute } = usePredictionCtx();
  /** Map picking: off | source | destination. Single toggle starts at source then advances to destination. */
  const [clickMode, setClickMode] = useState("off");
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  /** Bound to the panel search boxes; updated on map pick and Google search. */
  const [sourceQ, setSourceQ] = useState("");
  const [destQ, setDestQ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [heatPoints, setHeatPoints] = useState([]);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const keyToastShownRef = useRef(false);

  const hasGoogleKey = Boolean(getGoogleMapsApiKey());
  const GOOGLE_KEY_HELP_MESSAGE =
    "Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env and enable Geocoding API in Google Cloud. Restart npm run dev.";

  useEffect(() => {
    if (!hasGoogleKey && !keyToastShownRef.current) {
      keyToastShownRef.current = true;
      toast.error(GOOGLE_KEY_HELP_MESSAGE);
    }
  }, [hasGoogleKey, GOOGLE_KEY_HELP_MESSAGE]);

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

  const onMapPick = useCallback(
    async (lat, lng) => {
      if (clickMode === "off") return;
      if (!hasGoogleKey) {
        toast.error(GOOGLE_KEY_HELP_MESSAGE);
        return;
      }
      try {
        const geo = await googleReverseGeocode(lat, lng);
        const loc = {
          lat,
          lng,
          name: geo.name,
          city: geo.city || "",
          state: geo.state || "",
        };

        if (clickMode === "source") {
          setSource(loc);
          setSourceQ(geo.name);
          setClickMode("destination");
          toast.success(
            "Source updated in form — click map again for destination or search.",
          );
          return;
        }

        if (clickMode === "destination") {
          setDestination(loc);
          setDestQ(geo.name);
          setClickMode("off");
          toast.success("Destination updated in form.");
        }
      } catch (e) {
        toast.error(e.message || "Google reverse geocoding failed");
      }
    },
    [clickMode, hasGoogleKey, GOOGLE_KEY_HELP_MESSAGE],
  );

  const geocodeSearch = async (which) => {
    if (!hasGoogleKey) {
      toast.error(GOOGLE_KEY_HELP_MESSAGE);
      return;
    }
    try {
      const q = which === "source" ? sourceQ : destQ;
      if (!q.trim()) {
        toast.error("Type an address or place name first.");
        return;
      }
      const hit = await googleForwardGeocode(q);
      const loc = {
        lat: hit.lat,
        lng: hit.lng,
        name: hit.name,
        city: hit.city || "",
        state: hit.state || "",
      };
      if (which === "source") {
        setSource(loc);
        setSourceQ(hit.name);
      } else {
        setDestination(loc);
        setDestQ(hit.name);
      }
      toast.success("Location found (Google)");
    } catch (e) {
      toast.error(e.message || "Search failed");
    }
  };

  const formDefaults = useMemo(
    () => ({
      hour_of_day: new Date().getHours(),
      city:
        source?.city ||
        destination?.city ||
        source?.name?.split(",")[0]?.trim() ||
        "Delhi",
      state: source?.state || destination?.state || "Delhi",
      road_type: "State Highway",
      road_surface_condition: "Dry",
      road_width_meters: 8,
      number_of_lanes: 4,
      speed_limit_kmh: 80,
      average_speed_kmh: 55,
      weather_condition: "Clear",
      temperature_celsius: 30,
      humidity_percent: 50,
      visibility_km: 6,
      traffic_density: 0.5,
      light_condition: "Daylight",
      signal_present: 1,
      road_divider_present: 1,
      vehicle_type_involved: "Car",
      vehicles_involved: 3,
      pedestrians_nearby: 10,
    }),
    [source, destination],
  );

  const onPredict = async (values) => {
    if (!source || !destination) {
      toast.error("Set source and destination (map picks or Google search).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        month: new Date().getMonth() + 1,
        signal_present: Number(values.signal_present),
        road_divider_present: Number(values.road_divider_present),
        source: { lat: source.lat, lng: source.lng, name: source.name },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          name: destination.name,
        },
        travel_time: "12:00",
      };
      const data = await predictRoute(payload);
      setRouteResult(data);
      setLastRoute(data);
      registerPredictionForAlerts({
        riskScore: data.overall_risk,
        severity:
          data.overall_risk >= 70
            ? "Critical"
            : data.overall_risk >= 50
              ? "High"
              : data.overall_risk >= 30
                ? "Medium"
                : "Low",
        city: values.city,
      });
      toast.success("Route scored");
    } catch (e) {
      toast.error(e.userMessage || "Route prediction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const pathPositions = useMemo(() => {
    if (!source || !destination) return [];
    const wps = routeResult?.waypoints || [];
    const pts = [
      [source.lat, source.lng],
      ...wps.map((w) => [w.lat, w.lng]),
      [destination.lat, destination.lng],
    ];
    return pts;
  }, [source, destination, routeResult]);

  const segmentRisks = useMemo(() => {
    if (!routeResult?.waypoints?.length || pathPositions.length < 2) return [];
    const w = routeResult.waypoints;
    const risks = [];
    for (let i = 0; i < pathPositions.length - 1; i += 1) {
      const wi = Math.min(i, w.length - 1);
      risks.push(w[wi]?.risk ?? routeResult.overall_risk ?? 40);
    }
    return risks;
  }, [routeResult, pathPositions.length]);

  const pickingActive = clickMode !== "off";

  const sourceCarIcon = useMemo(() => createRouteSourceCarIcon(), []);
  const destinationPinIcon = useMemo(() => createRouteDestinationPinIcon(), []);
  const onToggleRiskPick = useCallback(() => {
    setClickMode((mode) => {
      if (mode !== "off") return "off";
      return "source";
    });
  }, []);

  return (
    <div className="relative flex min-h-[92vh] flex-col">
      <div className="pointer-events-none order-1 flex w-full max-w-[440px] flex-col gap-3 px-4 pb-4 md:absolute md:left-4 md:top-4 md:z-[600] md:w-[min(100%,440px)] md:max-w-none md:px-0 md:pb-0">
        <div className="pointer-events-auto rounded-2xl border border-border bg-bg-card/90 p-4 shadow-glass backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-semibold text-txt-primary">
                Route intelligence
              </h1>
            </div>
            <div className="flex shrink-0 sm:pt-0.5">
              <RouteGuidancePopover />
            </div>
          </div>

          <TrafficAccidentScene3D />

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
                placeholder="Source — search (Google)"
                value={sourceQ}
                onChange={(e) => setSourceQ(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-xs"
                onClick={() => geocodeSearch("source")}
              >
                Find
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
                placeholder="Destination — search (Google)"
                value={destQ}
                onChange={(e) => setDestQ(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-xs"
                onClick={() => geocodeSearch("destination")}
              >
                Find
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-txt-secondary">
            <span>
              Map pick mode:{" "}
              <span className="font-mono text-txt-primary">
                {clickMode === "source"
                  ? "On - next click sets SOURCE"
                  : clickMode === "destination"
                    ? "On - next click sets DESTINATION"
                    : "Off"}
              </span>
            </span>
            <button
              type="button"
              className={`rounded-lg border px-3 py-1.5 text-xs ${clickMode !== "off" ? "border-emerald-500 bg-emerald-600 text-white" : "border-border bg-bg-secondary text-txt-primary"}`}
              onClick={onToggleRiskPick}
              title="Toggle sequential map picking"
            >
              Picking: {clickMode !== "off" ? "On" : "Off"}
            </button>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <PredictionForm
              key={`${source?.lat}-${destination?.lat}-${formDefaults.city}`}
              defaultValues={formDefaults}
              onSubmit={onPredict}
              submitting={submitting}
              submitLabel="Score full route"
            />
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-xl border border-border px-3 py-2 text-xs ${heatmapOn ? "bg-accent-secondary text-white" : "bg-bg-card"}`}
            onClick={() => setHeatmapOn((v) => !v)}
          >
            Heatmap: {heatmapOn ? "On" : "Off"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-border bg-bg-card px-3 py-2 text-xs"
            onClick={() => {
              setSource(null);
              setDestination(null);
              setSourceQ("");
              setDestQ("");
              setRouteResult(null);
              setClickMode("off");
            }}
          >
            Clear route
          </button>
        </div>
      </div>

      {routeResult && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto absolute bottom-6 right-6 z-[600] w-[min(100%,380px)]"
        >
          <RouteRiskCard
            overall={routeResult.overall_risk}
            safestHour={routeResult.safest_hour}
            distanceKm={routeResult.route_distance_km}
            waypoints={routeResult.waypoints}
            pickActive={clickMode !== "off"}
            onTogglePick={onToggleRiskPick}
          />
        </motion.div>
      )}

      <MapView
        heatmapPoints={heatPoints}
        showHeatmap={heatmapOn}
        containerClassName="order-2 h-[70vh] md:h-[max(92vh,1100px)]"
      >
        <LocationPicker active={pickingActive} onPick={onMapPick} />
        {(source || destination) && (
          <RouteMapBounds
            source={source}
            destination={destination}
            pathPositions={pathPositions}
          />
        )}
        {pathPositions.length >= 2 && (
          <RouteOverlay
            positions={pathPositions}
            riskScores={segmentRisks.length ? segmentRisks : undefined}
          />
        )}
        {source && (
          <Marker position={[source.lat, source.lng]} icon={sourceCarIcon}>
            <Popup>
              <div className="max-w-[240px] text-gray-900">
                <p className="text-xs font-semibold text-blue-700">
                  Source (vehicle)
                </p>
                <p className="text-xs">{source.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationPinIcon}
          >
            <Popup>
              <div className="max-w-[240px] text-gray-900">
                <p className="text-xs font-semibold text-red-700">
                  Destination
                </p>
                <p className="text-xs">{destination.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapView>
    </div>
  );
}
