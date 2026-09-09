import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Crosshair, Dumbbell, Loader2, MapPin, Navigation, Search } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export type GymLocation = { name: string; lat: number; lng: number };

const DEFAULT_CENTER: [number, number] = [52.3676, 4.9041]; // Amsterdam

type NominatimResult = {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
};

type OverpassElement = {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; [key: string]: string | undefined };
};

function shortName(displayName: string, fallback: string) {
  return displayName.split(",")[0]?.trim() || fallback;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`
    );
    if (!response.ok) throw new Error("reverse failed");
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ? shortName(data.display_name, "Selected gym") : "Selected gym";
  } catch {
    return "Selected gym";
  }
}

function pinIcon(dark: boolean) {
  const pin = dark ? "#ffffff" : "#0a0a0a";
  const ring = dark ? "#000000" : "#ffffff";
  const dot = dark ? "#0a0a0a" : "#ffffff";
  return L.divIcon({
    className: "",
    html: `<div class="kova-gym-marker"><svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${pin}" stroke="${ring}" stroke-width="2"/><circle cx="18" cy="17" r="6.5" fill="${dot}"/></svg></div>`,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
  });
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      const target = event.originalEvent.target as HTMLElement | null;
      if (target?.closest?.(".kova-gym-marker")) return;
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [map, position]);
  return null;
}

function MapBridge({ onMap }: { onMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
  }, [map, onMap]);
  return null;
}

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
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [nearby, setNearby] = useState<OverpassElement[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [naming, setNaming] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => setSelected(value), [value]);

  const icon = useMemo(() => pinIcon(dark), [dark]);

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
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=en&q=${encodeURIComponent(query)}`
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

  const pick = useCallback(async (lat: number, lng: number, name?: string) => {
    setSelected((current) => ({ name: name ?? current?.name ?? "Selected gym", lat, lng }));
    setNearby([]);
    setFocus([lat, lng]);
    if (!name) {
      setNaming(true);
      const resolvedName = await reverseGeocode(lat, lng);
      setSelected({ name: resolvedName, lat, lng });
      setNaming(false);
    }
  }, []);

  const findNearby = useCallback(async () => {
    const center = mapRef.current?.getCenter() ?? selected ?? value;
    const lat = center?.lat ?? DEFAULT_CENTER[0];
    const lng = center?.lng ?? DEFAULT_CENTER[1];
    setNearbyLoading(true);
    setError("");
    try {
      const query = `[out:json][timeout:20];(node["amenity"="gym"](around:5000,${lat},${lng});way["amenity"="gym"](around:5000,${lat},${lng}););out center 40;`;
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
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (lat === undefined || lng === undefined) continue;
        unique.set(`${lat.toFixed(5)},${lng.toFixed(5)}`, element);
      }
      setNearby([...unique.values()].slice(0, 12));
      if (!unique.size) setError("No gyms found within 5 km of this spot. Drag the map to a city and try again.");
    } catch {
      setError("Could not load nearby gyms. The free OpenStreetMap service may be busy — try again in a moment.");
    } finally {
      setNearbyLoading(false);
    }
  }, [selected, value]);

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
        setSelected({ name: "My location", lat: latitude, lng: longitude });
        setNearby([]);
        setFocus([latitude, longitude]);
        setNaming(true);
        const resolvedName = await reverseGeocode(latitude, longitude);
        setSelected({ name: resolvedName, lat: latitude, lng: longitude });
        setNaming(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Location access was denied. Search for a place or drop a pin on the map instead.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

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
                  onClick={() => {
                    pick(Number(result.lat), Number(result.lon), shortName(result.display_name, result.name ?? "Gym"));
                    setResults([]);
                    setSearch("");
                  }}
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
      <div className="relative h-72 overflow-hidden rounded-2xl border border-white/10">
        <MapContainer center={[selected?.lat ?? DEFAULT_CENTER[0], selected?.lng ?? DEFAULT_CENTER[1]]} zoom={selected ? 14 : 12} className="z-0 h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={
              dark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
          />
          <MapBridge onMap={(map) => { mapRef.current = map; }} />
          <ClickCatcher onPick={(lat, lng) => void pick(lat, lng)} />
          <FlyTo position={focus} />
          {selected && <Marker position={[selected.lat, selected.lng]} icon={icon} draggable eventHandlers={{ dragend: (event) => void pick(event.target.getLatLng().lat, event.target.getLatLng().lng) }} />}
        </MapContainer>

        <button
          type="button"
          onClick={() => void findNearby()}
          disabled={nearbyLoading}
          className="absolute bottom-3 left-3 z-[1000] inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3.5 text-xs font-medium text-white backdrop-blur-md disabled:opacity-60"
        >
          {nearbyLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Dumbbell className="size-3.5" />}
          {nearbyLoading ? "Searching…" : "Find gyms nearby"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute right-3 top-3 z-[1000] inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md disabled:opacity-60"
          title="Use my location"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
        </button>
      </div>

      {/* Nearby gym results */}
      {nearby.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Gyms around this spot</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {nearby.map((gym) => {
              const lat = gym.lat ?? gym.center?.lat ?? 0;
              const lng = gym.lon ?? gym.center?.lon ?? 0;
              const name = gym.tags?.name ?? "Gym";
              const active = selected?.lat === lat && selected?.lng === lng;
              return (
                <button
                  key={`${gym.type}-${gym.id}`}
                  type="button"
                  onClick={() => pick(lat, lng, name)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors ${active ? "border-white bg-white text-black" : "border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"}`}
                >
                  <MapPin className="size-3.5" />
                  <span className="max-w-44 truncate">{name}</span>
                  {active && <Check className="size-3.5" />}
                </button>
              );
            })}
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
              <p className="mt-0.5 text-xs text-white/40">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
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
        Maps © OpenStreetMap contributors · search and gym data by Nominatim & Overpass — free, no API key needed. Drag the pin or tap the map to fine-tune.
      </p>
    </div>
  );
}