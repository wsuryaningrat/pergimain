import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Place, Category } from "../data/places";
import { categoryLabel } from "../data/places";
import { formatIDR } from "../utils/format";

const categoryDot: Record<Category, string> = {
  cafe: "#d97706",
  kuliner: "#e11d48",
  wisata: "#059669",
  nugas: "#0284c7",
};

function makeIcon(color: string, label?: string | number, active?: boolean) {
  const size = active ? 28 : label ? 24 : 16;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:${label ? 11 : 0}px;
      ${active ? "outline:3px solid rgba(249,115,22,0.45);" : ""}
    ">${label ?? ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [places, map]);
  return null;
}

interface MinimalMapProps {
  places: Place[];
  route?: Place[];
  activeId?: string;
  onMarkerClick?: (place: Place) => void;
  onClose?: () => void;
  heightClassName?: string;
}

export default function MinimalMap({ places, route, activeId, onMarkerClick, heightClassName = "h-[420px]" }: MinimalMapProps) {
  const center: [number, number] = useMemo(() => {
    if (places.length > 0) return [places[0].latitude, places[0].longitude];
    return [-6.9147, 107.6098];
  }, [places]);

  const routeLine = route && route.length > 1 ? route.map((p) => [p.latitude, p.longitude] as [number, number]) : null;
  const routeIds = new Set((route ?? []).map((p) => p.id));

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 ${heightClassName}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-minimal"
          maxZoom={19}
        />
        <FitBounds places={places.length > 0 ? places : route ?? []} />

        {routeLine && (
          <Polyline positions={routeLine} pathOptions={{ color: "#f97316", weight: 3, opacity: 0.85, dashArray: "6 6" }} />
        )}

        {places.map((place) => {
          const routeIndex = route?.findIndex((p) => p.id === place.id);
          const label = routeIndex !== undefined && routeIndex >= 0 ? routeIndex + 1 : undefined;
          const color = routeIds.has(place.id) ? "#f97316" : categoryDot[place.category];
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={makeIcon(color, label, place.id === activeId)}
              eventHandlers={{
                click: () => onMarkerClick?.(place),
              }}
            >
              <Popup>
                <div className="flex w-48 flex-col gap-1">
                  <p className="font-semibold text-slate-900">{place.name}</p>
                  <p className="text-xs text-slate-500">
                    {categoryLabel[place.category]} · {place.area}
                  </p>
                  <p className="text-xs text-slate-500">{formatIDR(place.estimated_cost_per_person)} / orang</p>
                  <Link to={`/place/${place.id}`} className="mt-1 text-xs font-semibold text-orange-600 underline">
                    Lihat detail
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <p className="pointer-events-none absolute left-2 top-2 z-[1000] rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        Peta minimal · lokasi perkiraan (demo)
      </p>
    </div>
  );
}
