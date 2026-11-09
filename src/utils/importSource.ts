import { categories, type Category } from "../data/places";

/** Short human label for where a place was imported from. */
export function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("google.") || host.includes("goo.gl")) return "Google Maps";
    return host;
  } catch {
    return "link";
  }
}

export interface ParsedMapsLink {
  name?: string;
  lat?: number;
  lng?: number;
}

/**
 * Pull the place name and coordinates out of a full Google Maps URL, e.g.
 *   https://www.google.com/maps/place/Masjid+Al-Lathiif/@-6.90,107.62,17z/data=...!3d-6.9047!4d107.6246
 * The `!3d…!4d…` pair is the place pin itself, so it wins over the `@lat,lng`
 * viewport center. Short links (maps.app.goo.gl) cannot be resolved from the
 * browser because of CORS; the Chrome extension resolves them instead.
 */
export function parseGoogleMapsUrl(raw: string): ParsedMapsLink | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!/google\.[a-z.]+$/.test(url.hostname) || !url.pathname.startsWith("/maps")) return null;

  const result: ParsedMapsLink = {};
  const full = decodeURIComponent(url.href);

  const pin = full.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const at = full.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const q = url.searchParams.get("q") ?? url.searchParams.get("query") ?? url.searchParams.get("ll");
  const qCoords = q?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  const coords = pin ?? qCoords ?? at;
  if (coords) {
    result.lat = Number(coords[1]);
    result.lng = Number(coords[2]);
  }

  const placeName = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeName) result.name = decodeURIComponent(placeName[1].replace(/\+/g, " "));
  else if (q && !qCoords) result.name = q;

  return result.lat !== undefined || result.name ? result : null;
}

const categoryKeywords: [Category, RegExp][] = [
  ["masjid", /\b(masjid|mesjid|mosque|musholla|mushola|kajian|islamic center|pesantren)\b/i],
  ["kampus", /\b(universitas|university|institut|politeknik|polytechnic|kampus|campus|sekolah tinggi|college)\b/i],
  ["nugas", /\b(coworking|co-working|working space|perpustakaan|library|study)\b/i],
  ["cafe", /\b(cafe|caf[eé]|coffee|kopi|kedai kopi|roastery|espresso)\b/i],
  ["kuliner", /\b(restoran|restaurant|resto|rumah makan|warung|bakso|mie|ramen|sate|seblak|kuliner|makan|food|bakery|dessert)\b/i],
  ["wisata", /\b(wisata|taman|park|museum|curug|pantai|gunung|kebun|zoo|galeri|gallery|tourist)\b/i],
];

/** Best-effort category guess from a place name / Google Maps type / caption. */
export function guessCategory(text: string): Category | undefined {
  for (const [cat, re] of categoryKeywords) if (re.test(text)) return cat;
  return undefined;
}

export interface PrefillData {
  name?: string;
  category?: Category;
  area?: string;
  lat?: number;
  lng?: number;
  image?: string;
  description?: string;
  tags?: string;
  hours?: string;
  source?: string;
}

/** Read the query string the Chrome extension (or a shared link) sends to /tambah. */
export function readPrefill(params: URLSearchParams): PrefillData | null {
  const get = (k: string) => params.get(k)?.trim() || undefined;
  const num = (k: string) => {
    const v = get(k);
    const n = v === undefined ? NaN : Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const cat = get("category");
  const data: PrefillData = {
    name: get("name"),
    category: cat && (categories as string[]).includes(cat) ? (cat as Category) : undefined,
    area: get("area"),
    lat: num("lat"),
    lng: num("lng"),
    image: get("image"),
    description: get("desc"),
    tags: get("tags"),
    hours: get("hours"),
    source: get("source"),
  };
  // A Google Maps link alone is enough: derive name/coords from it.
  if (data.source && (data.lat === undefined || !data.name)) {
    const parsed = parseGoogleMapsUrl(data.source);
    if (parsed) {
      data.lat ??= parsed.lat;
      data.lng ??= parsed.lng;
      data.name ??= parsed.name;
    }
  }
  if (!data.category && (data.name || data.description)) {
    data.category = guessCategory(`${data.name ?? ""} ${data.description ?? ""}`);
  }
  return Object.values(data).some((v) => v !== undefined) ? data : null;
}
