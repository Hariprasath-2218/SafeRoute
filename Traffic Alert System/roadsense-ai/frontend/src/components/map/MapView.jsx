import { useMemo, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AccidentHeatmap from "./AccidentHeatmap.jsx";

// Leaflet default icon paths (CDN avoids Vite asset resolution edge cases)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

function LocateControl() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: 64 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          className="leaflet-control-zoom-in"
          title="My location"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 12);
              },
              () => {
                /* user denied */
              },
            );
          }}
          aria-label="My location"
        >
          ⌖
        </button>
      </div>
    </div>
  );
}

export default function MapView({
  children,
  heatmapPoints = [],
  showHeatmap = false,
  containerClassName = "h-[90vh]",
}) {
  const [tile, setTile] = useState("osm");

  const url = useMemo(() => {
    if (tile === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }, [tile]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border ${containerClassName}`}
    >
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2 rounded-xl border border-border bg-bg-card/90 p-2 text-xs shadow-glass backdrop-blur">
        <span className="px-2 text-txt-secondary">Basemap</span>
        <button
          type="button"
          className={`rounded-lg px-3 py-1 ${tile === "osm" ? "bg-accent-primary text-white" : "text-txt-primary"}`}
          onClick={() => setTile("osm")}
        >
          Standard
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1 ${tile === "satellite" ? "bg-accent-primary text-white" : "text-txt-primary"}`}
          onClick={() => setTile("satellite")}
        >
          Satellite
        </button>
      </div>

      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer attribution="&copy; OpenStreetMap" url={url} />
        <ZoomControl position="bottomright" />
        <LocateControl />
        {children}
        <AccidentHeatmap points={heatmapPoints} enabled={showHeatmap} />
      </MapContainer>
    </div>
  );
}

export { INDIA_CENTER, INDIA_ZOOM };
