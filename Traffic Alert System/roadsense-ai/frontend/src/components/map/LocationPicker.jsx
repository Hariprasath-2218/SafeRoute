import { useMapEvents } from "react-leaflet";

/**
 * Forwards map clicks to parent when `active` is true (e.g. picking source / destination).
 */
export default function LocationPicker({ onPick, active = false }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
