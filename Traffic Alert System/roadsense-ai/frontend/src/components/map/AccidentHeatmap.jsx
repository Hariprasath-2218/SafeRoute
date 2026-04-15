import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

/**
 * Overlays leaflet.heat from historical prediction coordinates (lat, lng, risk).
 */
export default function AccidentHeatmap({ points, enabled }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !points?.length) return undefined;

    const heatPoints = points.map((p) => [p.lat, p.lng, p.intensity ?? 0.5]);
    const layer = L.heatLayer(heatPoints, {
      radius: 26,
      blur: 20,
      maxZoom: 12,
      max: 1,
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, enabled, points]);

  return null;
}
