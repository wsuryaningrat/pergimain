// Shared logic for the popup and the background service worker.

export const DEFAULT_BASE_URL = "https://hangout.wsningrat.com";

export const CATEGORIES = {
  cafe: "Cafe & Coffee Shop",
  kuliner: "Kuliner",
  wisata: "Wisata & Aktivitas",
  nugas: "Nugas & Hangout",
  kampus: "Kampus / Universitas",
  masjid: "Masjid & Kajian",
};

export async function getBaseUrl() {
  const { baseUrl } = await chrome.storage.sync.get("baseUrl");
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export async function setBaseUrl(url) {
  await chrome.storage.sync.set({ baseUrl: url.trim().replace(/\/+$/, "") });
}

/** Whether the in-page panel opens automatically on Instagram / Google Maps. */
export async function getAutoPanel() {
  const { autoPanel } = await chrome.storage.sync.get("autoPanel");
  return autoPanel !== false;
}

export async function setAutoPanel(on) {
  await chrome.storage.sync.set({ autoPanel: Boolean(on) });
}

// Draft kept while the user hops from an Instagram post to Google Maps to find the pin.
const PENDING_KEY = "pendingDraft";
const PENDING_TTL_MS = 6 * 60 * 60 * 1000;

export async function savePendingDraft(draft) {
  await chrome.storage.local.set({ [PENDING_KEY]: { draft, savedAt: Date.now() } });
}

export async function getPendingDraft() {
  const { [PENDING_KEY]: entry } = await chrome.storage.local.get(PENDING_KEY);
  if (!entry || Date.now() - entry.savedAt > PENDING_TTL_MS) return null;
  return entry.draft;
}

export async function clearPendingDraft() {
  await chrome.storage.local.remove(PENDING_KEY);
}

// ---------------------------------------------------------------------------
// Address / point search (OpenStreetMap Nominatim), biased to Bandung.
// Called from the background worker so it is not blocked by page CORS.
// ---------------------------------------------------------------------------

const BANDUNG_VIEWBOX = "107.45,-6.78,107.80,-7.05";

export function parseLatLng(text) {
  const m = (text || "").match(/^\s*(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

export async function geocode(query) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6",
    countrycodes: "id",
    viewbox: BANDUNG_VIEWBOX,
    "accept-language": "id",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Pencarian gagal (${res.status})`);
  const rows = await res.json();
  return rows.map((r) => {
    const a = r.address || {};
    return {
      name: r.name || r.display_name.split(",")[0],
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
      area: a.suburb || a.village || a.neighbourhood || a.quarter || a.city_district || "",
      type: r.type,
    };
  });
}

// ---------------------------------------------------------------------------
// Google Maps link helpers
// ---------------------------------------------------------------------------

export const MAPS_LINK_RE =
  /https?:\/\/(?:maps\.app\.goo\.gl\/[\w-]+|goo\.gl\/maps\/[\w-]+|(?:www\.)?google\.[a-z.]+\/maps[^\s"'<>)]*|maps\.google\.[a-z.]+\/[^\s"'<>)]*)/i;

export function isMapsUrl(url) {
  return MAPS_LINK_RE.test(url || "");
}

export function isShortMapsUrl(url) {
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url || "");
}

/** Name + coordinates from a full Google Maps URL (place pin wins over viewport). */
export function parseMapsUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const full = decodeURIComponent(url.href);
  const pin = full.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const at = full.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const q = url.searchParams.get("q") || url.searchParams.get("query") || url.searchParams.get("ll") || "";
  const qCoords = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  const coords = pin || qCoords || at;
  const placeName = url.pathname.match(/\/maps\/place\/([^/]+)/);
  const out = {};
  if (coords) {
    out.lat = Number(coords[1]);
    out.lng = Number(coords[2]);
  }
  if (placeName) out.name = decodeURIComponent(placeName[1].replace(/\+/g, " "));
  else if (q && !qCoords) out.name = q;
  return out.lat !== undefined || out.name ? out : null;
}

/**
 * Follow a short link (maps.app.goo.gl) to the full Google Maps URL and read
 * coordinates from it. Falls back to scanning the returned HTML, where Google
 * embeds the pin in a static-map preview URL.
 */
export async function resolveMapsLink(link) {
  const result = { url: link };
  try {
    const res = await fetch(link, { redirect: "follow", credentials: "omit" });
    result.url = res.url || link;
    Object.assign(result, parseMapsUrl(result.url) || {});
    if (result.lat === undefined) {
      const html = await res.text();
      const m =
        html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
        html.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/) ||
        html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) {
        result.lat = Number(m[1]);
        result.lng = Number(m[2]);
      }
      if (!result.name) {
        const title = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
        if (title) result.name = decodeHtml(title[1]).split(" · ")[0];
      }
    }
  } catch (err) {
    result.error = String(err);
  }
  return result;
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ---------------------------------------------------------------------------
// Category / area guessing
// ---------------------------------------------------------------------------

const CATEGORY_RULES = [
  ["masjid", /\b(masjid|mesjid|mosque|musholl?a|mushola|kajian|islamic cent(er|re)|pesantren)\b/i],
  ["kampus", /\b(universitas|university|institut|politeknik|polytechnic|kampus|campus|sekolah tinggi|college)\b/i],
  ["nugas", /\b(coworking|co-working|working space|perpustakaan|library)\b/i],
  ["cafe", /\b(cafe|caf[eé]|coffee|kopi|kedai kopi|roastery|espresso)\b/i],
  ["kuliner", /\b(restoran|restaurant|resto|rumah makan|warung|bakso|mie|ramen|sate|seblak|kuliner|makan|food|bakery|dessert|kitchen)\b/i],
  ["wisata", /\b(wisata|taman|park|museum|curug|gunung|kebun|zoo|galeri|gallery|tourist|attraction)\b/i],
];

export function guessCategory(text) {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text || "")) return cat;
  return "";
}

/** "Jl. Saninten No.2, Cihapit, Kec. Bandung Wetan, Kota Bandung, ..." -> "Cihapit" */
export function guessArea(address) {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const kecIdx = parts.findIndex((p) => /^kec(\.|amatan)\s/i.test(p));
  if (kecIdx > 0 && !/^(jl|jalan)\b/i.test(parts[kecIdx - 1])) return parts[kecIdx - 1];
  if (kecIdx >= 0) return parts[kecIdx].replace(/^kec(\.|amatan)\s*/i, "");
  return parts.length > 2 ? parts[1] : "";
}

// ---------------------------------------------------------------------------
// Page extraction — injected into the active tab with chrome.scripting.
// Must be fully self-contained (no references to anything outside it).
// ---------------------------------------------------------------------------

export function extractFromPage() {
  const meta = (key) =>
    document.querySelector(`meta[property="${key}"]`)?.content ||
    document.querySelector(`meta[name="${key}"]`)?.content ||
    "";
  const text = (sel) => document.querySelector(sel)?.innerText?.trim() || "";
  const host = location.hostname;
  const out = { pageUrl: location.href, source: "web" };

  // ---- Google Maps --------------------------------------------------------
  if (/google\.[a-z.]+$/.test(host) && location.pathname.startsWith("/maps")) {
    out.source = "gmaps";
    out.isPlace = location.pathname.startsWith("/maps/place/");
    out.name = text("h1.DUwDvf") || text('div[role="main"] h1') || text("h1");
    out.mapsType = text("button.DkEaL") || text('button[jsaction*="category"]');
    const addr = document.querySelector('button[data-item-id="address"]');
    out.address = (addr?.getAttribute("aria-label") || addr?.innerText || "")
      .replace(/^(alamat|address)\s*:\s*/i, "")
      .trim();
    const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]');
    out.rating = ratingEl ? ratingEl.innerText.replace(",", ".").trim() : "";
    const hero =
      document.querySelector('button[jsaction*="heroHeaderImage"] img') ||
      document.querySelector('div[role="main"] button img[src*="googleusercontent"]');
    out.image = hero?.src || "";
    const hoursRows = Array.from(document.querySelectorAll("table tr"))
      .map((tr) => tr.innerText.replace(/\s+/g, " ").trim())
      .filter((t) => /\d{1,2}[.:]\d{2}/.test(t) || /24 jam|open 24/i.test(t));
    out.hoursText = hoursRows.slice(0, 7).join("\n");
    return out;
  }

  // ---- Instagram post / reel ---------------------------------------------
  if (/(^|\.)instagram\.com$/.test(host)) {
    out.source = "instagram";
    // Instagram is a SPA: og:* tags keep describing the first page that loaded,
    // so only trust them when og:url points at the post currently shown.
    const code = (location.pathname.match(/\/(?:p|reel|reels|tv)\/([\w-]+)/) || [])[1] || "";
    out.isPost = Boolean(code);
    const metaFresh = Boolean(code) && meta("og:url").includes(code);
    const ogDesc = metaFresh ? meta("og:description") : "";
    const ogTitle = metaFresh ? meta("og:title") : "";
    // og:description: '1,234 likes, 56 comments - user on November 1, 2026: "caption"'
    const fromMeta = (ogDesc.match(/:\s*"([\s\S]*)"\s*\.?\s*$/) || ogTitle.match(/:\s*"([\s\S]*)"\s*$/) || [])[1] || "";
    const domCaption =
      text("article h1") || text('div[role="dialog"] h1') || text("main h1") || "";
    out.caption = (domCaption.length > fromMeta.length ? domCaption : fromMeta).trim();
    out.username = (ogDesc.match(/-\s*([\w.]+)\s+on\s/) || ogTitle.match(/^(.+?)\s+on Instagram/) || [])[1] || "";
    const scope = document.querySelector('div[role="dialog"] article') || document.querySelector("article") || document.querySelector("main");
    const postImg = Array.from(scope?.querySelectorAll("img") || []).find(
      (img) => (img.naturalWidth || img.width) >= 300 && !/profile/i.test(img.alt || "")
    );
    out.image = postImg?.currentSrc || postImg?.src || (metaFresh ? meta("og:image") : "");
    const loc = (scope || document).querySelector('a[href*="/explore/locations/"]');
    out.locationTag = loc?.innerText?.trim() || "";
    out.locationHref = loc?.href || "";
    const links = Array.from((scope || document).querySelectorAll("a[href]")).map((a) => a.href);
    out.mapsLinks = links.filter((h) =>
      /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps|l\.instagram\.com\/\?u=.*maps/i.test(h)
    );
    return out;
  }

  // ---- Any other page -----------------------------------------------------
  out.name = meta("og:title") || document.title;
  out.caption = meta("og:description") || meta("description");
  out.image = meta("og:image");
  out.mapsLinks = Array.from(document.querySelectorAll("a[href]"))
    .map((a) => a.href)
    .filter((h) => /maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps/i.test(h))
    .slice(0, 3);
  return out;
}

// ---------------------------------------------------------------------------
// Turn raw page data into Hangout form fields
// ---------------------------------------------------------------------------

function unwrapInstagramRedirect(href) {
  try {
    const u = new URL(href);
    if (u.hostname === "l.instagram.com") return u.searchParams.get("u") || href;
  } catch {
    /* ignore */
  }
  return href;
}

function captionHours(caption) {
  if (/24\s*jam|24\s*hours/i.test(caption)) return "24 jam";
  const m = caption.match(/(\d{1,2})[.:](\d{2})\s*(?:-|–|—|s\/d|sampai|to)\s*(\d{1,2})[.:](\d{2})/i);
  if (!m) return "";
  const pad = (n) => n.padStart(2, "0");
  return `${pad(m[1])}:${m[2]} - ${pad(m[3])}:${m[4]}`;
}

function captionName(caption) {
  // Food/hangout accounts usually mark the place with 📍 or "Lokasi:".
  const line = caption.split("\n").find((l) => /📍|^\s*(lokasi|location|tempat|alamat)\s*:/i.test(l));
  if (line) {
    const cleaned = line.replace(/📍|^\s*(lokasi|location|tempat|alamat)\s*:/gi, "").trim();
    return cleaned.split(/,|\||•| [-–—] | di /)[0].replace(/@/g, "").trim();
  }
  const mention = caption.match(/@([\w.]{3,})/);
  return mention ? mention[1].replace(/[._]/g, " ") : "";
}

function captionArea(caption) {
  const line = caption.split("\n").find((l) => /📍/.test(l)) || "";
  const parts = line.replace(/📍/g, "").split(/,|\|/).map((p) => p.trim()).filter(Boolean);
  const jl = parts.findIndex((p) => /^(jl|jalan)\b/i.test(p));
  if (jl >= 0 && parts[jl + 1] && !/bandung/i.test(parts[jl + 1])) return parts[jl + 1];
  return "";
}

function hashtagTags(caption) {
  const generic = new Set(["bandung", "kulinerbandung", "bandungkuliner", "infobandung", "explorebandung", "fyp", "reels", "viral", "instagood"]);
  const tags = (caption.match(/#[\p{L}\p{N}_]+/gu) || [])
    .map((t) => t.slice(1).toLowerCase())
    .filter((t) => !generic.has(t));
  return Array.from(new Set(tags)).slice(0, 6);
}

/** Build the editable draft shown in the popup. Resolves Maps links for coordinates. */
export async function buildDraft(raw, resolve = resolveMapsLink) {
  const draft = {
    name: "",
    category: "",
    area: "",
    lat: "",
    lng: "",
    image: raw.image || "",
    description: "",
    tags: "",
    hours: "",
    source: raw.pageUrl || "",
    sourceType: raw.source,
  };

  if (raw.source === "gmaps") {
    const parsed = parseMapsUrl(raw.pageUrl) || {};
    draft.name = raw.name || parsed.name || "";
    if (parsed.lat !== undefined) {
      draft.lat = parsed.lat;
      draft.lng = parsed.lng;
    }
    draft.area = guessArea(raw.address);
    draft.category = guessCategory(`${raw.mapsType} ${draft.name}`);
    draft.description = [raw.mapsType, raw.address].filter(Boolean).join(" · ");
    if (raw.hoursText) {
      const today = raw.hoursText.split("\n")[0] || "";
      draft.hours = captionHours(today);
    }
    draft.tags = raw.mapsType ? raw.mapsType.toLowerCase() : "";
    return draft;
  }

  const caption = raw.caption || "";
  draft.name = raw.locationTag || captionName(caption) || raw.name || "";
  draft.area = captionArea(caption);
  draft.description = caption.length > 600 ? `${caption.slice(0, 597)}…` : caption;
  draft.tags = hashtagTags(caption).join(", ");
  draft.hours = captionHours(caption);
  draft.category = guessCategory(`${draft.name} ${caption}`);

  // Prefer a Google Maps link from the caption / bio for exact coordinates.
  const inCaption = caption.match(MAPS_LINK_RE)?.[0];
  const mapsLink = inCaption || (raw.mapsLinks || []).map(unwrapInstagramRedirect)[0];
  if (mapsLink) {
    const resolved = isShortMapsUrl(mapsLink) ? await resolve(mapsLink) : { url: mapsLink, ...(parseMapsUrl(mapsLink) || {}) };
    if (resolved.lat !== undefined) {
      draft.lat = resolved.lat;
      draft.lng = resolved.lng;
    }
    if (!draft.name && resolved.name) draft.name = resolved.name;
    draft.mapsUrl = resolved.url;
  }
  return draft;
}

/** URL of the Hangout "Tambah Tempat" page, prefilled with the draft. */
export function buildAddUrl(baseUrl, draft) {
  const params = new URLSearchParams();
  const put = (k, v) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") params.set(k, String(v).trim());
  };
  put("name", draft.name);
  put("category", draft.category);
  put("area", draft.area);
  put("lat", draft.lat);
  put("lng", draft.lng);
  put("image", draft.image);
  put("desc", draft.description);
  put("tags", draft.tags);
  put("hours", draft.hours);
  put("source", draft.source);
  return `${baseUrl}/tambah?${params.toString()}`;
}

/** Text to search for when an Instagram post has no coordinates yet. */
export function searchQueryFor(draft) {
  const base = [draft.name, draft.area].filter(Boolean).join(" ");
  return base ? `${base} Bandung` : "";
}
