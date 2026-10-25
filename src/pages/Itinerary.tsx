import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ArrowDown, Trash2, MapPinned, Wallet, Clock, Navigation, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { categoryColor, categoryLabel } from "../data/places";
import { formatIDR, formatMinutes, haversineKm, estimateTravelMinutes } from "../utils/format";
import { fetchDrivingRoute, type DrivingRoute } from "../utils/osrm";
import MinimalMap from "../components/MinimalMap";

const TRANSPORT_COST_PER_KM = 3000;

export default function Itinerary() {
  const { itinerary, removeFromItinerary, moveItinerary, clearItinerary } = useApp();
  const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const placeIdsKey = itinerary.map((i) => i.place.id).join(",");

  useEffect(() => {
    if (itinerary.length < 2) {
      setDrivingRoute(null);
      return;
    }
    const controller = new AbortController();
    setRouteLoading(true);
    fetchDrivingRoute(
      itinerary.map((i) => i.place),
      controller.signal
    )
      .then((result) => setDrivingRoute(result))
      .finally(() => setRouteLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeIdsKey]);

  if (itinerary.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
        <MapPinned size={32} />
        <p>Itinerary masih kosong.</p>
        <Link to="/discover" className="text-sm font-semibold text-orange-600 underline">
          Pilih tempat untuk ditambahkan
        </Link>
      </div>
    );
  }

  const usingRealRoute = Boolean(drivingRoute && drivingRoute.legs.length === itinerary.length - 1);

  const legs = itinerary.slice(1).map((item, i) => {
    const prev = itinerary[i].place;
    if (usingRealRoute) {
      const leg = drivingRoute!.legs[i];
      return { km: leg.distanceKm, minutes: leg.durationMin };
    }
    const km = haversineKm(prev, item.place);
    return { km, minutes: estimateTravelMinutes(km) };
  });

  const totalVisitMinutes = itinerary.reduce((sum, i) => sum + i.place.visit_duration_min, 0);
  const totalTravelMinutes = legs.reduce((sum, l) => sum + l.minutes, 0);
  const totalKm = legs.reduce((sum, l) => sum + l.km, 0);
  const totalFoodCost = itinerary.reduce((sum, i) => sum + i.place.estimated_cost_per_person, 0);
  const totalTransportCost = Math.round(totalKm * TRANSPORT_COST_PER_KM);
  const grandTotal = totalFoodCost + totalTransportCost;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Itinerary Harian</h1>
          <p className="text-sm text-slate-500">{itinerary.length} dari maksimal 5 tempat</p>
        </div>
        <button
          onClick={clearItinerary}
          className="text-sm font-medium text-slate-400 hover:text-rose-500"
        >
          Hapus semua
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center justify-between text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            <MapPinned size={16} /> Ringkasan Rute
          </span>
          {routeLoading ? (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Mencari rute tercepat...
            </span>
          ) : usingRealRoute ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Navigation size={12} /> Rute jalan nyata
            </span>
          ) : null}
        </h2>
        <MinimalMap
          places={itinerary.map((i) => i.place)}
          route={itinerary.map((i) => i.place)}
          routeLine={usingRealRoute ? drivingRoute!.geometry : undefined}
          heightClassName="h-[340px]"
        />
      </div>

      <div className="flex flex-col gap-3">
        {itinerary.map((item, index) => (
          <div key={item.place.id} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {index + 1}
              </div>
              {index < itinerary.length - 1 && (
                <div className="flex-1 w-px bg-slate-200" />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <img
                  src={item.place.image}
                  alt={item.place.name}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColor[item.place.category]}`}>
                    {categoryLabel[item.place.category]}
                  </span>
                  <p className="font-semibold text-slate-900">{item.place.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.place.area} · {formatMinutes(item.place.visit_duration_min)} · {formatIDR(item.place.estimated_cost_per_person)}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => moveItinerary(index, -1)}
                    disabled={index === 0}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItinerary(index, 1)}
                    disabled={index === itinerary.length - 1}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => removeFromItinerary(item.place.id)}
                    className="rounded-full p-1.5 text-rose-400 hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {index < itinerary.length - 1 && (
                <div className="flex items-center gap-2 pl-1 text-xs text-slate-400">
                  <Clock size={12} />
                  {usingRealRoute
                    ? `Estimasi perjalanan ~${legs[index].minutes} menit (${legs[index].km.toFixed(1)} km, rute jalan)`
                    : `Estimasi perjalanan ~${legs[index].minutes} menit (${legs[index].km.toFixed(1)} km, simulasi)`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <Wallet size={18} /> Ringkasan Budget & Waktu
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Summary label="Durasi Kunjungan" value={formatMinutes(totalVisitMinutes)} />
          <Summary label="Estimasi Perjalanan" value={formatMinutes(totalTravelMinutes)} />
          <Summary label="Biaya Makan & Tiket" value={formatIDR(totalFoodCost)} />
          <Summary label="Estimasi Transport" value={formatIDR(totalTransportCost)} />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
          <span className="font-semibold text-orange-700">Total per orang</span>
          <span className="text-lg font-bold text-orange-700">{formatIDR(grandTotal)}</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {usingRealRoute
            ? "✅ Jarak dan waktu tempuh dihitung dari rute jalan nyata (OSRM). Estimasi biaya transportasi tetap simulasi."
            : "⚠️ Estimasi waktu tempuh dan biaya transportasi adalah simulasi berbasis jarak garis lurus, bukan data rute nyata."}
        </p>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
