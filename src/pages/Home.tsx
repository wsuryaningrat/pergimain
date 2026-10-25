import { Link } from "react-router-dom";
import { Compass, MapPinned, Heart, ArrowRight } from "lucide-react";
import { categoryLabel, places, type Category } from "../data/places";
import PlaceCard from "../components/PlaceCard";

const categories: Category[] = ["cafe", "kuliner", "wisata", "nugas"];

export default function Home() {
  const highlights = places.filter((p) => p.rating >= 4.6).slice(0, 4);

  return (
    <div className="flex flex-col gap-10 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-rose-400 px-6 py-12 text-white md:px-12 md:py-16">
        <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          Data simulasi • Bandung
        </p>
        <h1 className="max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">
          Bingung mau ke mana? Susun jalan-jalanmu di PergiMain.
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/90 md:text-base">
          Temukan cafe, kuliner, wisata, dan tempat nugas di Bandung, lalu rangkai jadi itinerary harian lengkap dengan estimasi waktu dan budget.
        </p>
        <Link
          to="/discover"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-orange-600 shadow-lg transition hover:scale-105"
        >
          <Compass size={18} /> Mulai Jelajahi
        </Link>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/discover?category=${cat}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-2xl">
                {cat === "cafe" ? "☕" : cat === "kuliner" ? "🍜" : cat === "wisata" ? "🏞️" : "📚"}
              </span>
              <span className="text-sm font-semibold text-slate-700">{categoryLabel[cat]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Rekomendasi Teratas</h2>
          <Link to="/discover" className="flex items-center gap-1 text-sm font-medium text-orange-600">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {highlights.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          to="/itinerary"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <MapPinned size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Susun Itinerary</p>
            <p className="text-sm text-slate-500">Atur urutan kunjungan & estimasi budget</p>
          </div>
        </Link>
        <Link
          to="/saved"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Heart size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Tempat Favorit</p>
            <p className="text-sm text-slate-500">Lihat semua tempat yang sudah disimpan</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
