// Shared map configuration + geo helpers for the KOVA gym maps.

export const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";
export const LIGHT_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Great-circle distance between two points in kilometers (Haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

/** Human-friendly distance: "450 m" under 1 km, otherwise "3.2 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 10) * 10)} m`;
  return `${km.toFixed(1)} km`;
}