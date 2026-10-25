import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Heart, MapPin, Star, PlusCircle, CheckCircle2 } from "lucide-react";
import { categoryColor, categoryLabel } from "../data/places";
import { getPlaceById, useApp } from "../context/AppContext";
import { formatIDR, formatMinutes } from "../utils/format";

export default function PlaceDetail() {
  const { id } = useParams();
  const place = id ? getPlaceById(id) : undefined;
  const { isSaved, toggleSaved, addToItinerary, itinerary } = useApp();

  if (!place) {
    return (
      <div className="py-16 text-center text-slate-500">
        Tempat tidak ditemukan.{" "}
        <Link to="/discover" className="text-orange-600 underline">
          Kembali ke Discover
        </Link>
      </div>
    );
  }

  const saved = isSaved(place.id);
  const inItinerary = itinerary.some((i) => i.place.id === place.id);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <Link to="/discover" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-600">
        <ArrowLeft size={16} /> Kembali
      </Link>

      <div className="relative h-56 w-full overflow-hidden rounded-3xl bg-slate-100 md:h-72">
        <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${categoryColor[place.category]}`}>
          {categoryLabel[place.category]}
        </span>
        <button
          onClick={() => toggleSaved(place.id)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <Heart size={20} className={saved ? "fill-rose-500 text-rose-500" : "text-slate-500"} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{place.name}</h1>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-600">
            <Star size={16} className="fill-amber-500 text-amber-500" />
            {place.rating}
          </div>
        </div>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={16} /> {place.area}, Bandung
        </p>
        <p className="text-slate-600">{place.description}</p>

        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoStat label="Jam Buka" value={place.opening_hours} />
        <InfoStat label="Durasi Kunjungan" value={formatMinutes(place.visit_duration_min)} icon={<Clock size={14} />} />
        <InfoStat label="Estimasi Biaya" value={formatIDR(place.estimated_cost_per_person)} />
        <InfoStat label="Level Harga" value={"Rp".repeat(place.price_level)} />
      </div>

      <div className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
        ⚠️ Data simulasi (demo) — harga, jam buka, dan estimasi biaya bersifat perkiraan untuk keperluan pengujian produk.
      </div>

      <button
        onClick={() => addToItinerary(place)}
        disabled={inItinerary || itinerary.length >= 5}
        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
          inItinerary
            ? "bg-emerald-100 text-emerald-700"
            : "bg-orange-500 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        }`}
      >
        {inItinerary ? <CheckCircle2 size={18} /> : <PlusCircle size={18} />}
        {inItinerary ? "Sudah di Itinerary" : "Tambah ke Itinerary"}
      </button>
    </div>
  );
}

function InfoStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3">
      <span className="flex items-center gap-1 text-xs text-slate-400">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
