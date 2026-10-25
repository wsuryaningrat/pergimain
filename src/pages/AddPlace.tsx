import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import { categoryLabel, type Category, type Place } from "../data/places";
import { useApp } from "../context/AppContext";
import LocationPicker from "../components/LocationPicker";

const categories: Category[] = ["cafe", "kuliner", "wisata", "nugas"];

const BANDUNG_CENTER = { lat: -6.9147, lng: 107.6098 };

const fallbackImages: Record<Category, string> = {
  cafe: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=60",
  kuliner: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=60",
  wisata: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=60",
  nugas: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=60",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AddPlace() {
  const navigate = useNavigate();
  const { addUserPlace } = useApp();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("cafe");
  const [area, setArea] = useState("");
  const [position, setPosition] = useState(BANDUNG_CENTER);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(2);
  const [openingHours, setOpeningHours] = useState("09:00 - 21:00");
  const [visitDuration, setVisitDuration] = useState(60);
  const [cost, setCost] = useState(30000);
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitted, setSubmitted] = useState<Place | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !area.trim()) {
      setError("Nama tempat dan area wajib diisi.");
      return;
    }
    setError("");

    const place: Place = {
      id: `user-${slugify(name)}-${Date.now().toString(36)}`,
      name: name.trim(),
      category,
      area: area.trim(),
      latitude: position.lat,
      longitude: position.lng,
      price_level: priceLevel,
      rating: 0,
      opening_hours: openingHours.trim() || "-",
      visit_duration_min: visitDuration,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      description: description.trim() || "Belum ada deskripsi dari pengguna.",
      estimated_cost_per_person: cost,
      image: imageUrl.trim() || fallbackImages[category],
      demo: false,
      addedByUser: true,
    };

    addUserPlace(place);
    setSubmitted(place);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 size={40} className="text-emerald-600" />
        <h1 className="text-xl font-bold text-slate-900">Tempat berhasil ditambahkan!</h1>
        <p className="text-sm text-slate-600">
          <strong>{submitted.name}</strong> sekarang muncul di Discover. Data ini tersimpan di browser kamu (demo, belum tersinkron ke pengguna lain).
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/place/${submitted.id}`)}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Lihat Tempat
          </button>
          <button
            onClick={() => {
              setSubmitted(null);
              setName("");
              setArea("");
              setTagsInput("");
              setDescription("");
              setImageUrl("");
              setPosition(BANDUNG_CENTER);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
          >
            Tambah Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <PlusCircle className="text-orange-500" /> Tambah Tempat Main
        </h1>
        <p className="text-sm text-slate-500">
          Punya rekomendasi cafe, kuliner, wisata, atau tempat nugas di Bandung? Tambahkan di sini, siapa saja bisa ikut melengkapi katalog.
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
        ⚠️ Fase ini belum ada backend: tempat yang kamu tambahkan hanya tersimpan di browser ini (localStorage), belum terlihat oleh pengguna lain.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Nama tempat *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kedai Kopi Senja"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Kategori</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel[cat]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Area / Kecamatan *</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Contoh: Dago"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Jam operasional</span>
            <input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="08:00 - 22:00"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Level harga</span>
            <select
              value={priceLevel}
              onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value={1}>$ (hemat)</option>
              <option value={2}>$$ (menengah)</option>
              <option value={3}>$$$ (nyaman)</option>
              <option value={4}>$$$$ (mewah)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Estimasi biaya per orang (Rp)</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Durasi kunjungan (menit)</span>
            <input
              type="number"
              min={15}
              step={15}
              value={visitDuration}
              onChange={(e) => setVisitDuration(Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tag aktivitas (pisahkan koma)</span>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="wifi, nugas, outdoor"
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Deskripsi singkat</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ceritakan kenapa tempat ini seru untuk dikunjungi..."
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">URL foto (opsional)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Lokasi di peta</span>
          <LocationPicker
            latitude={position.lat}
            longitude={position.lng}
            onChange={(lat, lng) => setPosition({ lat, lng })}
          />
          <p className="text-xs text-slate-400">
            Koordinat: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <PlusCircle size={18} /> Simpan Tempat
        </button>
      </form>
    </div>
  );
}
