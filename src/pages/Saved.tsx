import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import PlaceCard from "../components/PlaceCard";

export default function Saved() {
  const { savedIds, allPlaces } = useApp();
  const savedPlaces = allPlaces.filter((p) => savedIds.has(p.id));

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tempat Favorit</h1>
        <p className="text-sm text-slate-500">Tempat yang kamu simpan untuk rencana jalan-jalan berikutnya.</p>
      </div>

      {savedPlaces.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          <Heart size={32} />
          <p>Belum ada tempat favorit.</p>
          <Link to="/discover" className="text-sm font-semibold text-orange-600 underline">
            Mulai cari tempat
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {savedPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </div>
  );
}
