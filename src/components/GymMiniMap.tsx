import MapGL, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { GymPin } from "@/components/GymPin";
import { useTheme } from "@/hooks/use-theme";
import { DARK_STYLE, LIGHT_STYLE } from "@/lib/geo";

export function GymMiniMap({ gym, className = "" }: { gym: { name: string; lat: number; lng: number }; className?: string }) {
  const { resolved } = useTheme();
  const dark = resolved !== "light";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <MapGL
        style={{ width: "100%", height: "100%" }}
        initialViewState={{ longitude: gym.lng, latitude: gym.lat, zoom: 15 }}
        mapStyle={dark ? DARK_STYLE : LIGHT_STYLE}
        dragPan={false}
        scrollZoom={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
        keyboard={false}
        attributionControl={false}
      >
        <Marker longitude={gym.lng} latitude={gym.lat} anchor="bottom">
          <GymPin dark={dark} />
        </Marker>
      </MapGL>
    </div>
  );
}