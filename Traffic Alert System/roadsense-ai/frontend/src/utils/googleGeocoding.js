/**
 * Google Maps Geocoding API (REST). Requires VITE_GOOGLE_MAPS_API_KEY in .env.
 * Restrict the key to Geocoding API + your dev/prod referrers in Google Cloud Console.
 */

const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

export function getGoogleMapsApiKey() {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof k === "string" && k.trim() ? k.trim() : "";
}

/** Pull locality / admin names from Google's address_components. */
export function parseGoogleAddress(result) {
  if (!result?.address_components) {
    return { city: "", state: "", country: "" };
  }
  let city = "";
  let state = "";
  let country = "";
  for (const c of result.address_components) {
    const types = c.types || [];
    if (types.includes("locality")) city = c.long_name;
    else if (!city && types.includes("sublocality_level_1")) city = c.long_name;
    else if (!city && types.includes("administrative_area_level_2")) city = c.long_name;
    if (types.includes("administrative_area_level_1")) state = c.long_name;
    if (types.includes("country")) country = c.long_name;
  }
  return { city, state, country };
}

/**
 * Forward geocode: address string → lat, lng, formatted name, city, state.
 */
export async function googleForwardGeocode(query) {
  const key = getGoogleMapsApiKey();
  if (!key) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY. Add it to frontend/.env and restart Vite.");
  }
  const url = `${GEOCODE_BASE}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    throw new Error(data.error_message || `Geocoding: ${data.status}`);
  }
  if (data.status === "ZERO_RESULTS" || !data.results?.length) {
    throw new Error("No results for that search");
  }

  const r = data.results[0];
  const loc = r.geometry.location;
  const { city, state, country } = parseGoogleAddress(r);
  return {
    lat: loc.lat,
    lng: loc.lng,
    name: r.formatted_address,
    city: city || query.split(",")[0]?.trim() || "",
    state: state || "",
    country,
  };
}

/**
 * Reverse geocode: coordinates → formatted address + city/state hints.
 */
export async function googleReverseGeocode(lat, lng) {
  const key = getGoogleMapsApiKey();
  if (!key) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY. Add it to frontend/.env and restart Vite.");
  }
  const url = `${GEOCODE_BASE}?latlng=${encodeURIComponent(`${lat},${lng}`)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    throw new Error(data.error_message || `Reverse geocoding: ${data.status}`);
  }
  if (data.status === "ZERO_RESULTS" || !data.results?.length) {
    return {
      name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: "",
      state: "",
      country: "",
    };
  }

  const r = data.results[0];
  const { city, state, country } = parseGoogleAddress(r);
  return {
    name: r.formatted_address,
    city,
    state,
    country,
  };
}
