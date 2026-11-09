// Shared "Tambah ke Hangout" panel UI, used both inside pages (shadow DOM,
// injected by content.js) and in the toolbar popup.
import {
  CATEGORIES,
  buildAddUrl,
  clearPendingDraft,
  getBaseUrl,
  getPendingDraft,
  guessCategory,
  isMapsUrl,
  parseLatLng,
  parseMapsUrl,
  savePendingDraft,
  searchQueryFor,
} from "./lib.js";

const FIELDS = ["name", "category", "area", "lat", "lng", "hours", "tags", "description", "image", "source"];
const SOURCE_LABEL = { gmaps: "Google Maps", instagram: "Instagram", web: "halaman ini" };

/** Talk to background.js (fetches there are not limited by page CORS). */
export function bg(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload }).then((res) => {
    if (res && res.error) throw new Error(res.error);
    return res;
  });
}

export const resolveViaBackground = (url) => bg("resolve", { url });

const CSS = `
.hg, .hg * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.hg { color: #0f172a; font-size: 13px; line-height: 1.4; }
.hg.page { position: fixed; top: 76px; right: 16px; width: 340px; max-height: calc(100vh - 100px); overflow: auto;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 12px 32px rgba(15,23,42,.22); z-index: 2147483646; }
.hg.page .body { padding: 10px 12px 12px; }
.hg.popup .body { padding: 0; }
.hg header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background: #fff;
  position: sticky; top: 0; z-index: 1; border-radius: 16px 16px 0 0; }
.hg.popup header { display: none; }
.hg header strong { flex: 1; font-size: 14px; }
.hg .badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #ffedd5; color: #c2410c; }
.hg label { display: flex; flex-direction: column; gap: 3px; margin-bottom: 7px; font-weight: 600; color: #334155; font-size: 11.5px; }
.hg input, .hg select, .hg textarea { font: inherit; font-size: 12.5px; font-weight: 400; color: #0f172a; border: 1px solid #e2e8f0;
  border-radius: 9px; padding: 6px 8px; background: #fff; width: 100%; }
.hg textarea { resize: vertical; }
.hg input:focus, .hg select:focus, .hg textarea:focus { outline: 2px solid #fdba74; border-color: #f97316; }
.hg .grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px; }
.hg .row { display: flex; gap: 6px; align-items: center; }
.hg button { font: inherit; cursor: pointer; border: 0; border-radius: 9px; }
.hg .primary { width: 100%; padding: 9px; background: #f97316; color: #fff; font-weight: 700; font-size: 13px; margin-top: 4px; }
.hg .primary:hover { background: #ea580c; }
.hg .dark { padding: 6px 10px; background: #0f172a; color: #fff; font-weight: 600; white-space: nowrap; }
.hg .soft { padding: 6px 10px; background: #e2e8f0; color: #334155; font-weight: 600; white-space: nowrap; }
.hg .icon { background: transparent; color: #64748b; font-size: 16px; padding: 0 4px; line-height: 1; }
.hg .status { padding: 7px 9px; border-radius: 9px; background: #fff7ed; color: #9a3412; margin-bottom: 8px; font-size: 12px; }
.hg .status.ok { background: #ecfdf5; color: #065f46; }
.hg .status.warn { background: #fef2f2; color: #991b1b; }
.hg .box { border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 8px; margin-bottom: 8px; }
.hg .box-title { font-weight: 700; font-size: 11.5px; color: #334155; margin-bottom: 6px; }
.hg .results { list-style: none; margin: 6px 0 0; padding: 0; max-height: 170px; overflow: auto; }
.hg .results li { padding: 6px 7px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; }
.hg .results li:hover { background: #fff7ed; border-color: #fed7aa; }
.hg .results li b { display: block; font-size: 12px; }
.hg .results li span { display: block; font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hg .hint { margin: 4px 0 6px; font-size: 11px; color: #64748b; }
.hg .link { color: #ea580c; font-size: 11px; text-decoration: none; font-weight: 600; }
.hg .pending { background: #eef2ff; border: 1px solid #c7d2fe; color: #3730a3; border-radius: 12px; padding: 8px; margin-bottom: 8px; font-size: 12px; }
.hg .pending .row { margin-top: 6px; }
.hg .preview { width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; background: #e2e8f0; display: block; }
.pill { position: fixed; right: 16px; bottom: 24px; z-index: 2147483646; background: #f97316; color: #fff; border: 0; border-radius: 999px;
  padding: 10px 14px; font: 700 13px system-ui, sans-serif; box-shadow: 0 8px 20px rgba(249,115,22,.4); cursor: pointer; }
[hidden] { display: none !important; }
`;

const TEMPLATE = `
<header>
  <strong>🧭 Tambah ke Hangout</strong>
  <span class="badge" data-ref="badge"></span>
  <button class="icon" data-ref="min" title="Kecilkan">–</button>
  <button class="icon" data-ref="close" title="Tutup">×</button>
</header>
<div class="body">
  <div class="status" data-ref="status">Membaca halaman…</div>
  <div class="pending" data-ref="pending" hidden>
    <div data-ref="pendingText"></div>
    <div class="row">
      <button class="dark" data-ref="pendingUse">Pakai titik ini</button>
      <button class="soft" data-ref="pendingDrop">Abaikan</button>
    </div>
  </div>
  <img class="preview" data-ref="preview" alt="" hidden />
  <form data-ref="form">
    <label>Nama tempat <input name="name" required /></label>
    <div class="grid">
      <label>Kategori <select name="category"></select></label>
      <label>Area <input name="area" placeholder="mis. Dago" /></label>
    </div>

    <div class="box">
      <div class="box-title">📍 Cari alamat / titik</div>
      <div class="row">
        <input data-ref="q" placeholder="Nama tempat, alamat, link Maps, atau -6.9, 107.6" />
        <button type="button" class="dark" data-ref="search">Cari</button>
      </div>
      <ul class="results" data-ref="results"></ul>
      <div class="grid" style="margin-top:6px">
        <label>Latitude <input name="lat" inputmode="decimal" /></label>
        <label>Longitude <input name="lng" inputmode="decimal" /></label>
      </div>
      <div class="row" style="justify-content:space-between">
        <a class="link" data-ref="viewPin" target="_blank" rel="noopener" hidden>Lihat titik di Google Maps ↗</a>
        <button type="button" class="soft" data-ref="gmapsSearch">Cari di Google Maps ↗</button>
      </div>
      <p class="hint" data-ref="gmapsHint" hidden>Buka tempatnya di Google Maps, lalu klik <b>Pakai titik ini</b> di panel Hangout di sana.</p>
    </div>

    <label>Jam buka <input name="hours" placeholder="08:00 - 22:00" /></label>
    <label>Tag (pisahkan koma) <input name="tags" /></label>
    <label>Deskripsi <textarea name="description" rows="4"></textarea></label>
    <label>URL foto <input name="image" /></label>
    <label>Link sumber <input name="source" /></label>
    <button type="submit" class="primary">Buka form Hangout →</button>
    <p class="hint">Form “Tambah Tempat” terbuka sudah terisi — cek lalu klik Simpan.</p>
  </form>
</div>
`;

/**
 * Render the panel into `root` (a ShadowRoot or an element).
 * mode: "page" (floating, with minimise/close) or "popup".
 */
export function mountPanel(root, { mode = "page", onMinimize, onClose } = {}) {
  const style = document.createElement("style");
  style.textContent = CSS;
  const el = document.createElement("div");
  el.className = `hg ${mode}`;
  el.innerHTML = TEMPLATE;
  root.append(style, el);

  const ref = (name) => el.querySelector(`[data-ref="${name}"]`);
  const form = ref("form");
  let current = { sourceType: "web" };

  form.elements.category.innerHTML =
    `<option value="">— pilih —</option>` +
    Object.entries(CATEGORIES).map(([v, label]) => `<option value="${v}">${label}</option>`).join("");

  function setStatus(message, kind = "") {
    const s = ref("status");
    s.textContent = message;
    s.className = `status ${kind}`;
  }

  function values() {
    return Object.fromEntries(FIELDS.map((k) => [k, form.elements[k].value.trim()]));
  }

  function setValues(data, { overwrite = true } = {}) {
    for (const k of FIELDS) {
      const v = data[k];
      if (v === undefined || v === null || v === "") {
        if (overwrite) form.elements[k].value = "";
        continue;
      }
      form.elements[k].value = v;
    }
    refresh();
  }

  function setPoint(lat, lng, extra = {}) {
    form.elements.lat.value = Number(lat).toFixed(7).replace(/0+$/, "");
    form.elements.lng.value = Number(lng).toFixed(7).replace(/0+$/, "");
    if (extra.area && !form.elements.area.value) form.elements.area.value = extra.area;
    if (extra.name && !form.elements.name.value) form.elements.name.value = extra.name;
    refresh();
  }

  function refresh() {
    const img = ref("preview");
    const src = form.elements.image.value.trim();
    img.hidden = !src;
    if (src && img.getAttribute("src") !== src) img.src = src;
    const lat = form.elements.lat.value.trim();
    const lng = form.elements.lng.value.trim();
    const pin = ref("viewPin");
    pin.hidden = !(lat && lng);
    if (lat && lng) pin.href = `https://www.google.com/maps?q=${lat},${lng}`;
  }

  async function runSearch(text) {
    const q = (text ?? ref("q").value).trim();
    const list = ref("results");
    list.innerHTML = "";
    if (!q) return;
    ref("q").value = q;

    const point = parseLatLng(q);
    if (point) {
      setPoint(point.lat, point.lng);
      setStatus("Titik koordinat dipasang.", "ok");
      return;
    }
    if (isMapsUrl(q)) {
      setStatus("Membaca link Google Maps…");
      try {
        const r = /goo\.gl/.test(q) ? await resolveViaBackground(q) : { url: q, ...(parseMapsUrl(q) || {}) };
        if (r.lat !== undefined) {
          setPoint(r.lat, r.lng, { name: r.name });
          if (!form.elements.category.value && r.name) form.elements.category.value = guessCategory(r.name);
          setStatus("Titik diambil dari link Google Maps.", "ok");
        } else setStatus("Koordinat tidak ditemukan di link itu.", "warn");
      } catch (err) {
        setStatus(`Gagal membaca link: ${err.message}`, "warn");
      }
      return;
    }

    list.innerHTML = `<li><span>Mencari “${escapeHtml(q)}”…</span></li>`;
    try {
      const { results } = await bg("geocode", { q });
      if (!results.length) {
        list.innerHTML = `<li><span>Tidak ketemu di OpenStreetMap. Coba alamat jalannya, atau “Cari di Google Maps”.</span></li>`;
        return;
      }
      list.innerHTML = "";
      for (const r of results) {
        const li = document.createElement("li");
        li.innerHTML = `<b>${escapeHtml(r.name)}</b><span title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</span>`;
        li.addEventListener("click", () => {
          setPoint(r.lat, r.lng, { area: r.area });
          list.innerHTML = "";
          setStatus(`Titik dipasang: ${r.name}. Cek lewat “Lihat titik”.`, "ok");
        });
        list.append(li);
      }
    } catch (err) {
      list.innerHTML = `<li><span>${escapeHtml(err.message)}</span></li>`;
    }
  }

  async function showPendingIfAny() {
    const box = ref("pending");
    box.hidden = true;
    if (current.sourceType !== "gmaps") return;
    const pending = await getPendingDraft();
    if (!pending) return;
    ref("pendingText").innerHTML = `Draft dari Instagram: <b>${escapeHtml(pending.name || "(tanpa nama)")}</b>. Pakai titik & alamat tempat ini untuk draft itu?`;
    box.hidden = false;
    ref("pendingUse").onclick = async () => {
      const here = values();
      const merged = {
        ...pending,
        lat: here.lat,
        lng: here.lng,
        area: pending.area || here.area,
        hours: pending.hours || here.hours,
        category: pending.category || here.category,
        name: pending.name || here.name,
      };
      await clearPendingDraft();
      current = { ...current, sourceType: "instagram" };
      ref("badge").textContent = "Instagram + Maps";
      setValues(merged);
      box.hidden = true;
      setStatus("Draft Instagram digabung dengan titik Google Maps. Cek lalu kirim.", "ok");
    };
    ref("pendingDrop").onclick = async () => {
      await clearPendingDraft();
      box.hidden = true;
    };
  }

  // ---- events --------------------------------------------------------------
  ref("search").addEventListener("click", () => runSearch());
  ref("q").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  });
  ref("gmapsSearch").addEventListener("click", async () => {
    const v = values();
    const q = ref("q").value.trim() || searchQueryFor(v) || "Bandung";
    if (current.sourceType !== "gmaps") {
      await savePendingDraft(v);
      ref("gmapsHint").hidden = false;
    }
    await bg("open", { url: `https://www.google.com/maps/search/${encodeURIComponent(q)}` });
  });
  form.elements.image.addEventListener("change", refresh);
  form.elements.lat.addEventListener("change", refresh);
  form.elements.lng.addEventListener("change", refresh);
  ref("preview").addEventListener("error", () => (ref("preview").hidden = true));
  ref("min").addEventListener("click", () => onMinimize?.());
  ref("close").addEventListener("click", () => onClose?.());
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = values();
    if (!v.name) {
      setStatus("Nama tempat wajib diisi.", "warn");
      form.elements.name.focus();
      return;
    }
    await bg("open", { url: buildAddUrl(await getBaseUrl(), v) });
    if (current.sourceType === "instagram") await clearPendingDraft();
  });

  return {
    el,
    setStatus,
    /** Fill the panel from a draft built by buildDraft(); optionally auto-search a point. */
    async load(draft, { autoSearch = true } = {}) {
      current = draft;
      ref("badge").textContent = SOURCE_LABEL[draft.sourceType] || "";
      ref("results").innerHTML = "";
      ref("gmapsHint").hidden = true;
      ref("q").value = "";
      setValues(draft);
      const missing = [];
      if (!draft.name) missing.push("nama");
      if (!draft.lat) missing.push("titik lokasi");
      if (!draft.category) missing.push("kategori");
      const from = SOURCE_LABEL[draft.sourceType] || "halaman";
      setStatus(
        missing.length ? `Data dari ${from} terbaca. Lengkapi: ${missing.join(", ")}.` : `Data dari ${from} terbaca. Cek lalu kirim.`,
        missing.length ? "" : "ok"
      );
      await showPendingIfAny();
      if (autoSearch && !draft.lat && draft.sourceType === "instagram") {
        const q = searchQueryFor(draft);
        if (q) runSearch(q);
      }
    },
  };
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
