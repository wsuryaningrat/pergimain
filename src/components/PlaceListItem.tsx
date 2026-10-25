import { Link } from "react-router-dom";
import { Heart, Star, PlusCircle, CheckCircle2 } from "lucide-react";
import { categoryColor, categoryLabel, type Place } from "../data/places";
import { useApp } from "../context/AppContext";
import { formatIDR } from "../utils/format";

export default function PlaceListItem({
  place,
  active,
  onSelect,
}: {
  place: Place;
  active?: boolean;
  onSelect?: (place: Place) => void;
}) {
  const { isSaved, toggleSaved, addToItinerary, itinerary } = useApp();
  const saved = isSaved(place.id);
  const inItinerary = itinerary.some((i) => i.place.id === place.id);

  return (
    <div
      onClick={() => onSelect?.(place)}
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
        active ? "border-orange-400 bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-orange-200"
      }`}
    >
      <img src={place.image} alt={place.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/place/${place.id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-semibold text-slate-900 hover:text-orange-600"
          >
            {place.name}
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {place.rating}
          </div>
        </div>
        <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColor[place.category]}`}>
          {categoryLabel[place.category]}
        </span>
        <p className="mt-1 truncate text-xs text-slate-500">{place.area}</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">{formatIDR(place.estimated_cost_per_person)}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSaved(place.id);
              }}
              className="rounded-full p-1.5 hover:bg-slate-100"
              aria-label="Simpan"
            >
              <Heart size={14} className={saved ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToItinerary(place);
              }}
              disabled={inItinerary || itinerary.length >= 5}
              className="rounded-full p-1.5 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Tambah ke itinerary"
            >
              {inItinerary ? <CheckCircle2 size={14} className="text-emerald-600" /> : <PlusCircle size={14} className="text-orange-500" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
