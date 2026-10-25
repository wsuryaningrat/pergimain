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
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:${label ? 12 : 0}px;
      ${active ? "outline:3px solid rgba(249,115,22,0.5);" : ""}
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
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [places, map]);
  return null;
}

interface PlaceMapProps {
  places: Place[];
  route?: Place[];
  activeId?: string;
  onMarkerClick?: (place: Place) => void;
  heightClassName?: string;
}

export default function PlaceMap({ places, route, activeId, onMarkerClick, heightClassName = "h-[420px]" }: PlaceMapProps) {
  const center: [number, number] = useMemo(() => {
    if (places.length > 0) return [places[0].latitude, places[0].longitude];
    return [-6.9147, 107.6098];
  }, [places]);

  const routeLine = route && route.length > 1 ? route.map((p) => [p.latitude, p.longitude] as [number, number]) : null;
  const routeIds = new Set((route ?? []).map((p) => p.id));

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 ${heightClassName}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds places={places} />

        {routeLine && (
          <Polyline positions={routeLine} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.8, dashArray: "6 6" }} />
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
                  <p className="text-xs text-slate-500">{categoryLabel[place.category]} · {place.area}</p>
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
    </div>
  );
}
