import { Link } from "react-router-dom";
import { Heart, Star, Clock, PlusCircle, CheckCircle2 } from "lucide-react";
import { categoryColor, categoryLabel, type Place } from "../data/places";
import { useApp } from "../context/AppContext";
import { formatIDR } from "../utils/format";

export default function PlaceCard({ place }: { place: Place }) {
  const { isSaved, toggleSaved, addToItinerary, itinerary } = useApp();
  const saved = isSaved(place.id);
  const inItinerary = itinerary.some((i) => i.place.id === place.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/place/${place.id}`} className="relative block h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={place.image}
          alt={place.name}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${categoryColor[place.category]}`}>
          {categoryLabel[place.category]}
        </span>
      </Link>

      <button
        onClick={() => toggleSaved(place.id)}
        aria-label="Simpan tempat"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110"
      >
        <Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : "text-slate-500"} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/place/${place.id}`} className="font-semibold text-slate-900 hover:text-orange-600">
            {place.name}
          </Link>
          <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
            <Star size={14} className="fill-amber-500 text-amber-500" />
            {place.rating}
          </div>
        </div>
        <p className="text-sm text-slate-500">{place.area}</p>
        <div className="flex flex-wrap gap-1.5">
          {place.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock size={14} />
            {place.visit_duration_min} min
          </div>
          <span className="font-semibold text-slate-900">{formatIDR(place.estimated_cost_per_person)}</span>
        </div>
        <button
          onClick={() => addToItinerary(place)}
          disabled={inItinerary || itinerary.length >= 5}
          className={`mt-2 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${
            inItinerary
              ? "bg-emerald-100 text-emerald-700"
              : "bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          {inItinerary ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
          {inItinerary ? "Di Itinerary" : "Tambah ke Itinerary"}
        </button>
      </div>
    </div>
  );
}
