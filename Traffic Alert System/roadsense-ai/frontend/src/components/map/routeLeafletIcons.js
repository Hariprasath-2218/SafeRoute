import L from "leaflet";

/**
 * Leaflet divIcons: car at the route source, map-pin teardrop at destination.
 */

const carSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44" fill="none">
  <circle cx="22" cy="22" r="20" fill="rgba(59,130,246,0.2)" stroke="#3B82F6" stroke-width="2"/>
  <path fill="#2563EB" d="M10 24c0-1.5 1.2-2.8 2.8-3l1.2-3.5A2 2 0 0 1 15.9 16h12.2a2 2 0 0 1 1.9 1.5l1.2 3.5c1.6.2 2.8 1.5 2.8 3v4H10v-4z"/>
  <path fill="#1C2333" d="M12 26h20v3H12v-3z"/>
  <circle cx="15" cy="30" r="2.2" fill="#111"/>
  <circle cx="29" cy="30" r="2.2" fill="#111"/>
  <rect x="14" y="18" width="16" height="7" rx="1" fill="#93C5FD"/>
</svg>
`.trim());

const pinSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" fill="none">
  <path d="M20 2C11.6 2 5 8.2 5 16.2c0 9.8 15 27.8 15 27.8s15-18 15-27.8C35 8.2 28.4 2 20 2z" fill="#EF4444" stroke="#fff" stroke-width="2"/>
  <circle cx="20" cy="16" r="5" fill="#fff"/>
</svg>
`.trim());

export function createRouteSourceCarIcon() {
  return L.divIcon({
    className: "roadsense-route-marker",
    html: `<div style="width:44px;height:44px;background:url('data:image/svg+xml,${carSvg}') center/contain no-repeat;"></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -18],
  });
}

export function createRouteDestinationPinIcon() {
  return L.divIcon({
    className: "roadsense-route-marker",
    html: `<div style="width:40px;height:48px;background:url('data:image/svg+xml,${pinSvg}') center/contain no-repeat;"></div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -44],
  });
}
