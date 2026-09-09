import { useCallback, useEffect, useRef, useState } from "react";
import { LngLatBounds } from "maplibre-gl";
import MapGL, { type MapRef, Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, Crosshair, Dumbbell, Loader2, MapPin, Navigation, Search } from "lucide-react";
import { GymPin } from "@/components/GymPin";
import { useTheme } from "@/hooks/use-theme";
import { formatDistance, haversineKm, DARK_STYLE, LIGHT_STYLE } from "@/lib/geo";
import { gymStatus } from "@/lib/opening-hours";

export type GymLocation = {
  name: string;
  lat: number;
  lng: number;
  osmType?: "node" | "way" | "relation";
  osmId?: number;
  openingHours?: string | null;
};

const DEFAULT_CENTER: { lat: number; lng: number } = { lat: 52.3676, lng: 4.9041 }; // Amsterdam

type NominatimResult = {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  osm_type?: "node" | "way" | "relation";
  osm_id?: number;
};

type OverpassElement = {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; opening_hours?: string; [key: string]: string | undefined };
};

function shortName(displayName: string, fallback: string) {
  return displayName.split(",")[0]?.trim() || fallback;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; osmType?: "node" | "way" | "relation"; osmId?: number }> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`);
    if (!response.ok) throw new Error("reverse failed");
    const data = (await response.json()) as { display_name?: string; osm_type?: "node" | "way" | "relation"; osm_id?: number };
    return {
      name: data.display_name ? shortName(data.display_name, "Selected gym") : "Selected gym",
      osmType: data.osm_type,
      osmId: data.osm_id,
    };
  } catch {
    return { name: "Selected gym" };
  }
}

/** Fetch the full tag set (incl. opening_hours) for one OSM element from the free OSM API. */
async function fetchOsmTags(osmType: string, osmId: number): Promise<Record<string, string> | null> {
  try {
    const response = await fetch(`https://api.openstreetmap.org/api/0.6/${osmType}/${osmId}.json`);
    if (!response.ok) throw new Error("osm fetch failed");
    const data = (await response.json()) as { elements?: Array<{ tags?: Record<string, string> }> };
    return data.elements?.[0]?.tags ?? null;
  } catch {
    return null;
  }
}

const STATUS_DOT: Record<string, string> = {
  open: "#34d399",
  closed: "#fb7185",
  unknown: "#9ca3af",
};

export function GymMapPicker({
  value,
  onChange,
  saving,
}: {
  value: GymLocation | null;
  onChange: (gym: GymLocation) => void;
  saving?: boolean;
}) {
  const { resolved } = useTheme();
  const dark = resolved !== "light";

  const [selected, setSelected] = useState<GymLocation | null>(value);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [nearby, setNearby] = useState<OverpassElement[]>([]);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [locating, setLocating] = useState(false);
  const [naming, setNaming] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => setSelected(value), [value]);

  const applySelected = useCallback((partial: Partial<GymLocation> & { lat: number; lng: number }) => {
    setSelected((current) => ({ name: "Selected gym", openingHours: null, ...current, ...partial }));
    setNearby([]);
    setFocus({ lat: partial.lat, lng: partial.lng });
  }, []);

  const enrichWithHours = useCallback(async (target: GymLocation) => {
    if (!target.osmType || !target.osmId) return;
    const tags = await fetchOsmTags(target.osmType, target.osmId);
    if (!tags) return;
    setSelected((current) =>
      current && current.lat === target.lat && current.lng === target.lng ? { ...current, openingHours: tags.opening_hours ?? null } : current,
    );
  }, []);

  // Debounced Nominatim search
  useEffect(() => {
    const query = search.trim();
    if (query.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=en&q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as NominatimResult[];
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const pickFromResult = useCallback(
    (result: NominatimResult) => {
      const lat = Number(result.lat);
      const lng = Number(result.lon);
      const place: GymLocation = {
        name: shortName(result.display_name, result.name ?? "Gym"),
        lat,
        lng,
        osmType: result.osm_type,
        osmId: result.osm_id,
        openingHours: null,
      };
      applySelected(place);
      void enrichWithHours(place);
      setResults([]);
      setSearch("");
    },
    [applySelected, enrichWithHours],
  );

  const pickFromOverpass = useCallback(
    (gym: OverpassElement) => {
      const lat = gym.lat ?? gym.center?.lat;
      const lng = gym.lon ?? gym.center?.lon;
      if (lat === undefined || lng === undefined) return;
      applySelected({
        name: gym.tags?.name ?? "Gym",
        lat,
        lng,
        osmType: gym.type,
        osmId: gym.id,
        openingHours: gym.tags?.opening_hours ?? null,
      });
    },
    [applySelected],
  );

  const pickRaw = useCallback(
    async (lat: number, lng: number) => {
      applySelected({ lat, lng });
      setNaming(true);
      const place = await reverseGeocode(lat, lng);
      const enriched: GymLocation = { name: place.name, lat, lng, osmType: place.osmType, osmId: place.osmId, openingHours: null };
      applySelected(enriched);
      void enrichWithHours(enriched);
      setNaming(false);
    },
    [applySelected, enrichWithHours],
  );

  const findNearby = useCallback(async () => {
    const center = mapRef.current?.getCenter();
    const lat = center?.lat ?? selected?.lat ?? DEFAULT_CENTER.lat;
    const lng = center?.lng ?? selected?.lng ?? DEFAULT_CENTER.lng;
    setNearbyLoading(true);
    setError("");
    try {
      const query = `[out:json][timeout:20];(node["amenity"="gym"](around:5000,${lat},${lng});way["amenity"="gym"](around:5000,${lat},${lng});node["leisure"="fitness_centre"](around:5000,${lat},${lng});way["leisure"="fitness_centre"](around:5000,${lat},${lng}););out center 40;`;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) throw new Error("overpass failed");
      const data = (await response.json()) as { elements?: OverpassElement[] };
      const unique = new Map<string, OverpassElement>();
      for (const element of data.elements ?? []) {
        const name = element.tags?.name;
        if (!name) continue;
        const lat2 = element.lat ?? element.center?.lat;
        const lng2 = element.lon ?? element.center?.lon;
        if (lat2 === undefined || lng2 === undefined) continue;
        unique.set(`${element.type}-${element.id}`, element);
      }
      setNearby([...unique.values()].slice(0, 14));
      setNearbyCenter({ lat, lng });
      if (!unique.size) setError("No gyms found within 5 km of this spot. Drag the map to a city and try again.");
    } catch {
      setError("Could not load nearby gyms. The free OpenStreetMap service may be busy — try again in a moment.");
    } finally {
      setNearbyLoading(false);
    }
  }, [selected]);

  // Fit the map to all nearby gyms once they are loaded.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !nearby.length) return;
    const bounds = new LngLatBounds();
    for (const gym of nearby) {
      const lat = gym.lat ?? gym.center?.lat;
      const lng = gym.lon ?? gym.center?.lon;
      if (lat !== undefined && lng !== undefined) bounds.extend([lng, lat]);
    }
    if (nearbyCenter) bounds.extend([nearbyCenter.lng, nearbyCenter.lat]);
    map.fitBounds(bounds, { padding: 64, duration: 800, maxZoom: 15 });
  }, [nearby, nearbyCenter]);

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Your browser does not support location access.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await pickRaw(latitude, longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Location access was denied. Search for a place or drop a pin on the map instead.");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [pickRaw]);

  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.flyTo({ center: [focus.lng, focus.lat], zoom: Math.max(mapRef.current.getZoom(), 14), duration: 700 });
    }
  }, [focus]);

  const now = new Date();
  const nearbyWithStatus = nearby.map((gym) => {
    const status = gym.tags?.opening_hours ? gymStatus(gym.tags.opening_hours, now) : { state: "unknown" as const };
    const lat = gym.lat ?? gym.center?.lat ?? 0;
    const lng = gym.lon ?? gym.center?.lon ?? 0;
    const distance = nearbyCenter ? haversineKm(nearbyCenter.lat, nearbyCenter.lng, lat, lng) : null;
    return { gym, status, lat, lng, distance };
  });
  const visibleNearby = filterOpenNow ? nearbyWithStatus.filter((entry) => entry.status.state === "open") : nearbyWithStatus;
  const hasHours = nearbyWithStatus.some((entry) => entry.status.state !== "unknown");
  const selectedStatus = selected?.openingHours ? gymStatus(selected.openingHours, now) : null;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 size-4 text-white/35" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search a city, street or gym name…"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
        />
        {searching && <Loader2 className="absolute right-4 top-3.5 size-4 animate-spin text-white/30" />}
        {results.length > 0 && (
          <ul className="absolute left-0 right-0 top-12 z-[1000] max-h-64 overflow-auto rounded-xl border border-white/20 bg-white p-1 shadow-2xl text-black">
            {results.map((result) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => pickFromResult(result)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-black/80 hover:bg-black/5"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-black/35" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{shortName(result.display_name, "Place")}</span>
                    <span className="block truncate text-xs text-black/45">{result.display_name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative h-80 overflow-hidden rounded-2xl border border-white/10 sm:h-96">
        <MapGL
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          initialViewState={{
            longitude: selected?.lng ?? DEFAULT_CENTER.lng,
            latitude: selected?.lat ?? DEFAULT_CENTER.lat,
            zoom: selected ? 14 : 12,
          }}
          mapStyle={dark ? DARK_STYLE : LIGHT_STYLE}
          onClick={(event) => void pickRaw(event.lngLat.lat, event.lngLat.lng)}
        >
          <NavigationControl position="bottom-right" />
          {visibleNearby.map(({ gym, status, lat, lng }) => (
            <Marker key={`${gym.type}-${gym.id}`} longitude={lng} latitude={lat} anchor="bottom">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  pickFromOverpass(gym);
                }}
                className="group flex flex-col items-center"
                title={`${gym.tags?.name ?? "Gym"}${status.state === "open" ? " — open now" : status.state === "closed" ? " — closed now" : ""}`}
              >
                <span
                  className="block size-4 rounded-full border-2 shadow-lg transition-transform group-hover:scale-125"
                  style={{ background: STATUS_DOT[status.state], borderColor: dark ? "#0a0a0a" : "#ffffff" }}
                />
                <span className="mt-0.5 h-1.5 w-px" style={{ background: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.3)" }} />
              </button>
            </Marker>
          ))}
          {selected && (
            <Marker
              longitude={selected.lng}
              latitude={selected.lat}
              anchor="bottom"
              draggable
              onDragEnd={(event) => void pickRaw(event.lngLat.lat, event.lngLat.lng)}
            >
              <GymPin dark={dark} pulse />
            </Marker>
          )}
        </MapGL>

        <button
          type="button"
          onClick={() => void findNearby()}
          disabled={nearbyLoading}
          className="absolute bottom-3 left-3 z-10 inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3.5 text-xs font-medium text-white backdrop-blur-md disabled:opacity-60"
        >
          {nearbyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Dumbbell className="size-3.5" />}
          {nearbyLoading ? "Searching…" : "Find gyms nearby"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md disabled:opacity-60"
          title="Use my location"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
        </button>
      </div>

      {/* Nearby gym results */}
      {nearby.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
              {filterOpenNow ? "Open right now" : "Gyms around this spot"}
              {visibleNearby.length ? ` · ${visibleNearby.length}` : ""}
            </p>
            {hasHours && (
              <button
                type="button"
                onClick={() => setFilterOpenNow((current) => !current)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors ${filterOpenNow ? "border-kova-emerald/40 bg-kova-emerald/10 text-kova-emerald" : "border-white/15 text-white/50 hover:bg-white/[0.06]"}`}
              >
                <span className={`size-1.5 rounded-full ${filterOpenNow ? "bg-kova-emerald" : "bg-white/40"}`} />
                Open now
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleNearby.map(({ gym, status, lat, lng, distance }) => {
              const name = gym.tags?.name ?? "Gym";
              const active = selected?.lat === lat && selected?.lng === lng;
              return (
                <button
                  key={`${gym.type}-${gym.id}`}
                  type="button"
                  onClick={() => pickFromOverpass(gym)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors ${active ? "border-white bg-white text-black" : "border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"}`}
                >
                  <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[status.state] }} />
                  <span className="max-w-40 truncate">{name}</span>
                  {distance !== null && <span className={active ? "text-black/45" : "text-white/30"}>{formatDistance(distance)}</span>}
                  {active && <Check className="size-3.5" />}
                </button>
              );
            })}
            {!visibleNearby.length && <p className="text-xs text-white/40">No gyms are open right now.</p>}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-200">{error}</p>}

      {/* Selection + save */}
      {selected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              {naming ? <Loader2 className="size-4 animate-spin text-white/50" /> : <MapPin className="size-4 text-white/70" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/85">{selected.name}</p>
              <p className="mt-0.5 text-xs text-white/40">
                {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
              </p>
              {selectedStatus && (
                <p className={`mt-1 flex items-center gap-1.5 text-[11px] font-medium ${selectedStatus.state === "open" ? "text-kova-emerald" : selectedStatus.state === "closed" ? "text-kova-rose" : "text-white/40"}`}>
                  <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[selectedStatus.state] }} />
                  {selectedStatus.statusLabel}
                  {selectedStatus.nextChange ? ` · ${selectedStatus.nextChange}` : ""}
                  {selectedStatus.hoursToday ? ` · Today ${selectedStatus.hoursToday}` : ""}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(selected)}
            disabled={saving || naming}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? "Saving…" : "Save gym"}
          </button>
        </div>
      )}

      <p className="flex items-start gap-2 text-[11px] leading-5 text-white/30">
        <Navigation className="mt-0.5 size-3 shrink-0" />
        Map data © OpenStreetMap contributors · tiles by OpenFreeMap · search by Nominatim · gyms &amp; opening hours by Overpass — all free, no API key. Colored dots show gyms that are open (green) or closed (red) right now.
      </p>
    </div>
  );
}