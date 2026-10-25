import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, List, Map as MapIcon, Columns } from "lucide-react";
import { categoryLabel, places, type Category, type Place } from "../data/places";
import PlaceCard from "../components/PlaceCard";
import PlaceListItem from "../components/PlaceListItem";
import MinimalMap from "../components/MinimalMap";

const categories: Category[] = ["cafe", "kuliner", "wisata", "nugas"];
type ViewMode = "list" | "split" | "map";
const allAreas = Array.from(new Set(places.map((p) => p.area))).sort();
const allTags = Array.from(new Set(places.flatMap((p) => p.tags))).sort();

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const initialCategory = (params.get("category") as Category) || "all";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const [area, setArea] = useState("all");
  const [maxPrice, setMaxPrice] = useState<1 | 2 | 3 | 4>(4);
  const [minRating, setMinRating] = useState(0);
  const [tag, setTag] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<ViewMode>("split");
  const [activePlace, setActivePlace] = useState<Place | null>(null);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (area !== "all" && p.area !== area) return false;
      if (p.price_level > maxPrice) return false;
      if (p.rating < minRating) return false;
      if (tag !== "all" && !p.tags.includes(tag)) return false;
      if (query && !`${p.name} ${p.area} ${p.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [category, area, maxPrice, minRating, tag, query]);

  const handleCategory = (cat: Category | "all") => {
    setCategory(cat);
    if (cat === "all") params.delete("category");
    else params.set("category", cat);
    setParams(params, { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Discover Places</h1>
        <p className="text-sm text-slate-500">Cari cafe, kuliner, wisata, dan tempat nugas di Bandung.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama tempat, area, atau tag..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <SlidersHorizontal size={14} /> Filter
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", ...categories] as (Category | "all")[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? "bg-orange-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "Semua" : categoryLabel[cat]}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Area</span>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value="all">Semua Area</option>
                {allAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Budget maksimal</span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value={1}>$ (hemat)</option>
                <option value={2}>$$ (menengah)</option>
                <option value={3}>$$$ (nyaman)</option>
                <option value={4}>$$$$ (semua)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Rating minimal</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value={0}>Semua rating</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Tag aktivitas</span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value="all">Semua tag</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} tempat ditemukan</p>
        <div className="flex gap-1 rounded-full border border-slate-200 bg-white p-1">
          {(
            [
              { mode: "list" as ViewMode, icon: List, label: "List" },
              { mode: "split" as ViewMode, icon: Columns, label: "Split" },
              { mode: "map" as ViewMode, icon: MapIcon, label: "Map" },
            ]
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                view === mode ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Tidak ada tempat yang cocok dengan filter ini.
        </div>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : view === "map" ? (
        <MinimalMap
          places={filtered}
          activeId={activePlace?.id}
          onMarkerClick={setActivePlace}
          onClose={() => setActivePlace(null)}
          heightClassName="h-[560px]"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1 md:col-span-2">
            {filtered.map((place) => (
              <PlaceListItem
                key={place.id}
                place={place}
                active={activePlace?.id === place.id}
                onSelect={setActivePlace}
              />
            ))}
          </div>
          <div className="md:col-span-3">
            <MinimalMap
              places={filtered}
              activeId={activePlace?.id}
              onMarkerClick={setActivePlace}
              onClose={() => setActivePlace(null)}
              heightClassName="h-[560px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
