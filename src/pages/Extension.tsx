import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Puzzle, Camera, MapPin, Search, MousePointerClick, Settings2, Shuffle } from "lucide-react";

const ZIP_URL = "/downloads/hangout-extension.zip";
const META_URL = "/downloads/hangout-extension.json";

interface ZipMeta {
  version: string;
  size: number;
}

const features = [
  {
    icon: Camera,
    title: "Otomatis di post Instagram",
    text: "Buka post atau reel, panel Hangout langsung muncul: caption, foto, tag lokasi, hashtag, jam buka, dan nama dari baris 📍 sudah terisi.",
  },
  {
    icon: MapPin,
    title: "Otomatis di Google Maps",
    text: "Buka sebuah tempat, nama, titik pin, area dari alamat, kategori, dan foto terbaca sendiri. Ikut berganti saat kamu pindah tempat.",
  },
  {
    icon: Search,
    title: "Cari alamat / titik",
    text: "Cari nama tempat atau alamat (OpenStreetMap), tempel link Google Maps, atau ketik koordinat “-6.9, 107.6”. Link pendek maps.app.goo.gl juga bisa.",
  },
  {
    icon: Shuffle,
    title: "Gabung Instagram + Maps",
    text: "Dari post Instagram klik “Cari di Google Maps”, buka tempatnya, lalu “Pakai titik ini” — caption & foto dari IG, titik dari Maps.",
  },
  {
    icon: MousePointerClick,
    title: "Klik kanan link",
    text: "Klik kanan link Google Maps di mana saja (termasuk caption/bio IG) → “Tambah link Google Maps ini ke Hangout”.",
  },
  {
    icon: Settings2,
    title: "Bisa diatur",
    text: "Matikan panel otomatis atau arahkan ke localhost lewat ikon ⚙︎ di popup ekstensi.",
  },
];

const steps = [
  { title: "Download & ekstrak", text: "Download file .zip di atas lalu ekstrak. Akan ada folder hangout-extension." },
  { title: "Buka halaman ekstensi", text: "Ketik chrome://extensions di address bar (Edge: edge://extensions, Brave: brave://extensions)." },
  { title: "Aktifkan Developer mode", text: "Nyalakan toggle Developer mode di pojok kanan atas." },
  { title: "Load unpacked", text: "Klik Load unpacked, pilih folder hangout-extension hasil ekstrak, lalu pin ikon Hangout di toolbar." },
];

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function Extension() {
  const [meta, setMeta] = useState<ZipMeta | null>(null);

  useEffect(() => {
    fetch(META_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setMeta(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white md:px-12 md:py-14">
        <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          <Puzzle size={14} /> Ekstensi Chrome
        </p>
        <h1 className="max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">
          Nemu tempat seru di Instagram atau Maps? Tambah ke Hangout sekali klik.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
          Ekstensi Hangout membaca data tempat secara otomatis saat kamu membuka post Instagram atau halaman Google Maps, lalu
          membuka form Tambah Tempat yang sudah terisi.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={ZIP_URL}
            download
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"
          >
            <Download size={18} /> Download ekstensi (.zip)
          </a>
          <span className="text-xs text-white/60">
            {meta ? `Versi ${meta.version} · ${formatSize(meta.size)} · ` : ""}Chrome, Edge, Brave, Arc
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Cara pasang</h2>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                {i + 1}
              </span>
              <p className="font-semibold text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-500">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          Ekstensi belum ada di Chrome Web Store, jadi dipasang manual (mode developer). Untuk update, download versi baru,
          timpa foldernya, lalu klik ikon ↻ pada kartu ekstensi di chrome://extensions.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Fitur</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Icon size={20} />
              </div>
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <p className="font-semibold">Catatan</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            Belum ada backend: tempat yang ditambahkan tersimpan di browser kamu, di domain yang dituju ekstensi (default
            hangout.wsningrat.com).
          </li>
          <li>Pencarian alamat memakai OpenStreetMap — tempat kecil kadang tidak ketemu; pakai “Cari di Google Maps”.</li>
          <li>Tampilan Instagram/Google Maps bisa berubah; kalau ada field kosong, isi manual di form.</li>
        </ul>
        <Link to="/tambah" className="mt-3 inline-block font-semibold text-orange-600 hover:underline">
          Atau tambah tempat manual →
        </Link>
      </section>
    </div>
  );
}
