import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:9999px 9999px 9999px 0;
    background:#f97316;border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,0.4);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={[latitude, longitude]} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-minimal"
          maxZoom={19}
        />
        <ClickHandler onPick={onChange} />
        <Marker position={[latitude, longitude]} icon={pinIcon} />
      </MapContainer>
      <p className="pointer-events-none absolute left-2 top-2 z-[1000] rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        Klik di peta untuk menandai lokasi
      </p>
    </div>
  );
}
