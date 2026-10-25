import type { Place } from "../data/places";

export interface RouteLeg {
  distanceKm: number;
  durationMin: number;
}

export interface DrivingRoute {
  geometry: [number, number][];
  legs: RouteLeg[];
  totalKm: number;
  totalMinutes: number;
}

/**
 * Fetches a real driving route through the given stops, in order, from
 * OSRM's free public demo server (no API key — rate-limited, fine for a
 * light-traffic demo app, not for production volume).
 * Returns null if the request fails so callers can fall back to a
 * straight-line estimate.
 */
export async function fetchDrivingRoute(places: Place[], signal?: AbortSignal): Promise<DrivingRoute | null> {
  if (places.length < 2) return null;

  const coords = places.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const geometry: [number, number][] = route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
    );
    const legs: RouteLeg[] = route.legs.map((leg: { distance: number; duration: number }) => ({
      distanceKm: leg.distance / 1000,
      durationMin: Math.round(leg.duration / 60),
    }));

    return {
      geometry,
      legs,
      totalKm: route.distance / 1000,
      totalMinutes: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}
