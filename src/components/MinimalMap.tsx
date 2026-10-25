import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Star } from "lucide-react";
import type { Place, Category } from "../data/places";
import { categoryLabel } from "../data/places";
import { formatIDR } from "../utils/format";

const categoryDot: Record<Category, string> = {
  cafe: "#d97706",
  kuliner: "#e11d48",
  wisata: "#059669",
  nugas: "#0284c7",
};

const VIEW = 100;
const PAD = 10;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// Interpolated percentile so a couple of far-flung outliers (e.g. a day-trip
// destination outside the city) don't stretch the scale and squash everything
// else into a corner. Outliers are clamped to the map edge instead.
function percentile(sorted: number[], p: number) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function project(places: Place[]) {
  if (places.length === 0) return () => ({ x: VIEW / 2, y: VIEW / 2 });

  const lats = [...places.map((p) => p.latitude)].sort((a, b) => a - b);
  const lngs = [...places.map((p) => p.longitude)].sort((a, b) => a - b);
  let minLat = percentile(lats, 0.05);
  let maxLat = percentile(lats, 0.95);
  let minLng = percentile(lngs, 0.05);
  let maxLng = percentile(lngs, 0.95);

  // keep a minimum spread so a single/close cluster doesn't divide by ~0
  const minSpread = 0.01;
  if (maxLat - minLat < minSpread) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - minSpread / 2;
    maxLat = mid + minSpread / 2;
  }
  if (maxLng - minLng < minSpread) {
    const mid = (maxLng + minLng) / 2;
    minLng = mid - minSpread / 2;
    maxLng = mid + minSpread / 2;
  }

  return (place: Place) => {
    const xRatio = clamp((place.longitude - minLng) / (maxLng - minLng), 0, 1);
    const yRatio = clamp((maxLat - place.latitude) / (maxLat - minLat), 0, 1);
    return { x: PAD + xRatio * (VIEW - 2 * PAD), y: PAD + yRatio * (VIEW - 2 * PAD) };
  };
}

interface MinimalMapProps {
  places: Place[];
  route?: Place[];
  activeId?: string;
  onMarkerClick?: (place: Place) => void;
  onClose?: () => void;
  heightClassName?: string;
}

export default function MinimalMap({ places, route, activeId, onMarkerClick, onClose, heightClassName = "h-[420px]" }: MinimalMapProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const toXY = useMemo(() => project(places.length > 0 ? places : route ?? []), [places, route]);
  const routeIds = new Set((route ?? []).map((p) => p.id));
  const activePlace = places.find((p) => p.id === activeId) ?? route?.find((p) => p.id === activeId);

  const routePoints =
    route && route.length > 1 ? route.map((p) => toXY(p)).map((pt) => `${pt.x},${pt.y}`).join(" ") : null;

  const handleClick = (place: Place) => {
    onMarkerClick?.(place);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50/40 ${heightClassName}`}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <defs>
          <pattern id="dotgrid" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#dotgrid)" />

        {routePoints && (
          <polyline
            points={routePoints}
            fill="none"
            stroke="#f97316"
            strokeWidth="1"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}

        {places.map((place) => {
          const { x, y } = toXY(place);
          const routeIndex = route?.findIndex((p) => p.id === place.id);
          const label = routeIndex !== undefined && routeIndex >= 0 ? routeIndex + 1 : null;
          const isActive = place.id === activeId || place.id === hoverId;
          const color = routeIds.has(place.id) ? "#f97316" : categoryDot[place.category];
          const r = isActive ? 3.4 : label ? 3 : 2.3;

          return (
            <g
              key={place.id}
              transform={`translate(${x} ${y})`}
              onClick={() => handleClick(place)}
              onMouseEnter={() => setHoverId(place.id)}
              onMouseLeave={() => setHoverId((id) => (id === place.id ? null : id))}
              className="cursor-pointer"
            >
              {isActive && <circle r={r + 2.2} fill={color} opacity="0.2" />}
              <circle r={r} fill={color} stroke="white" strokeWidth="0.8" />
              {label && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="2.6"
                  fontWeight="700"
                  fill="white"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {activePlace && (
        <div className="absolute bottom-3 left-3 right-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:max-w-xs">
          <img src={activePlace.image} alt={activePlace.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{activePlace.name}</p>
            <p className="text-xs text-slate-500">
              {categoryLabel[activePlace.category]} · {activePlace.area}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <Star size={11} className="fill-amber-500 text-amber-500" />
                {activePlace.rating}
              </span>
              <span className="text-xs font-semibold text-slate-700">{formatIDR(activePlace.estimated_cost_per_person)}</span>
            </div>
            <Link to={`/place/${activePlace.id}`} className="mt-1 inline-block text-xs font-semibold text-orange-600 underline">
              Lihat detail
            </Link>
          </div>
          <button
            onClick={() => onClose?.()}
            aria-label="Tutup"
            className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        Peta skematis · bukan skala geografis asli
      </p>

      {!activePlace && (
        <div className="pointer-events-none absolute bottom-2 right-2 flex flex-wrap justify-end gap-x-2 gap-y-1 rounded-lg bg-white/80 px-2 py-1">
          {(Object.keys(categoryDot) as Category[]).map((cat) => (
            <span key={cat} className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: categoryDot[cat] }} />
              {categoryLabel[cat]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
