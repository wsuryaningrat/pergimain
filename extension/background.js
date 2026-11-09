import {
  buildAddUrl,
  buildDraft,
  extractFromPage,
  geocode,
  getBaseUrl,
  guessCategory,
  isShortMapsUrl,
  parseMapsUrl,
  resolveMapsLink,
} from "./lib.js";

const PAGE_PATTERNS = ["https://www.instagram.com/*", "https://*.google.com/maps/*", "https://*.google.co.id/maps/*"];
const LINK_PATTERNS = [
  "https://maps.app.goo.gl/*",
  "https://goo.gl/maps/*",
  "https://*.google.com/maps/*",
  "https://maps.google.com/*",
  "https://l.instagram.com/*",
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "hangout-link",
      title: "Tambah link Google Maps ini ke Hangout",
      contexts: ["link"],
      targetUrlPatterns: LINK_PATTERNS,
    });
    chrome.contextMenus.create({
      id: "hangout-page",
      title: "Tambah tempat ini ke Hangout",
      contexts: ["page", "image"],
      documentUrlPatterns: PAGE_PATTERNS,
    });
  });
});

// ---- messages from the panel (content script or popup) --------------------
let lastGeocodeAt = 0;

async function handle(msg, sender) {
  switch (msg?.type) {
    case "resolve":
      return resolveMapsLink(msg.url);
    case "geocode": {
      // Nominatim usage policy: at most 1 request per second.
      const wait = 1100 - (Date.now() - lastGeocodeAt);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastGeocodeAt = Date.now();
      return { results: await geocode(msg.q) };
    }
    case "open": {
      const index = sender?.tab ? sender.tab.index + 1 : undefined;
      await chrome.tabs.create({ url: msg.url, index, openerTabId: sender?.tab?.id });
      return { ok: true };
    }
    default:
      return undefined;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!["resolve", "geocode", "open"].includes(msg?.type)) return false;
  handle(msg, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message || String(err) }));
  return true; // async response
});

// ---- context menu ----------------------------------------------------------
function unwrap(href) {
  try {
    const u = new URL(href);
    if (u.hostname === "l.instagram.com") return u.searchParams.get("u") || href;
  } catch {
    /* ignore */
  }
  return href;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const base = await getBaseUrl();
  let draft;

  if (info.menuItemId === "hangout-link" && info.linkUrl) {
    const link = unwrap(info.linkUrl);
    const resolved = isShortMapsUrl(link) ? await resolveMapsLink(link) : { url: link, ...(parseMapsUrl(link) || {}) };
    draft = {
      name: resolved.name || "",
      category: guessCategory(resolved.name || ""),
      lat: resolved.lat ?? "",
      lng: resolved.lng ?? "",
      source: resolved.url || link,
    };
  } else if (info.menuItemId === "hangout-page" && tab?.id) {
    const [{ result: raw }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractFromPage });
    draft = await buildDraft(raw);
    if (info.mediaType === "image" && info.srcUrl) draft.image = info.srcUrl;
  }

  if (draft) chrome.tabs.create({ url: buildAddUrl(base, draft), index: tab ? tab.index + 1 : undefined });
});
