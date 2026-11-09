// Runs on Instagram and Google Maps. When a post / place is open, reads its
// data automatically and shows the Hangout panel (both sites are SPAs, so we
// watch the URL instead of relying on page loads).
(async () => {
  if (window.top !== window) return;
  const lib = await import(chrome.runtime.getURL("lib.js"));
  const { mountPanel, resolveViaBackground } = await import(chrome.runtime.getURL("panel.js"));

  const host = document.createElement("div");
  host.id = "hangout-extension-root";
  const shadow = host.attachShadow({ mode: "open" });
  let panel = null;
  let pill = null;
  let lastKey = "";
  let runId = 0;
  let dismissedKey = "";

  const state = { minimized: false };
  ({ hangoutMinimized: state.minimized = false } = await chrome.storage.local.get("hangoutMinimized"));

  function pageKey() {
    const { hostname, pathname } = location;
    if (/instagram\.com$/.test(hostname)) {
      const m = pathname.match(/\/(?:p|reel|reels|tv)\/([\w-]+)/);
      return m ? `ig:${m[1]}` : "";
    }
    if (/google\.[a-z.]+$/.test(hostname) && pathname.startsWith("/maps/place/")) {
      // Same place = same name segment; coordinates in the URL change while panning.
      return `gm:${pathname.split("/")[3] || ""}`;
    }
    return "";
  }

  function ensureMounted() {
    if (!host.isConnected) document.documentElement.append(host);
    if (panel) return;
    panel = mountPanel(shadow, {
      mode: "page",
      onMinimize: () => setMinimized(true),
      onClose: () => {
        dismissedKey = lastKey;
        hideAll();
      },
    });
    pill = document.createElement("button");
    pill.className = "pill";
    pill.textContent = "＋ Hangout";
    pill.title = "Tambah tempat ini ke Hangout";
    pill.addEventListener("click", () => setMinimized(false));
    shadow.append(pill);
  }

  function setMinimized(min) {
    state.minimized = min;
    chrome.storage.local.set({ hangoutMinimized: min });
    if (!panel) return;
    panel.el.hidden = min;
    pill.hidden = !min;
  }

  function hideAll() {
    if (!panel) return;
    panel.el.hidden = true;
    pill.hidden = true;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function extractWithRetry(id) {
    let raw = null;
    for (let i = 0; i < 12; i++) {
      if (id !== runId) return null;
      raw = lib.extractFromPage();
      const ready =
        raw.source === "gmaps" ? Boolean(raw.name) && Boolean(raw.address || i > 6) : Boolean(raw.caption || raw.image) && i > 0;
      if (ready) break;
      await sleep(600);
    }
    return raw;
  }

  async function onRoute() {
    const key = pageKey();
    if (key === lastKey) return;
    lastKey = key;
    const id = ++runId;

    if (!key) {
      hideAll();
      return;
    }
    if (key === dismissedKey) return;

    const auto = await lib.getAutoPanel();
    ensureMounted();
    const minimized = state.minimized || !auto;
    panel.el.hidden = minimized;
    pill.hidden = !minimized;
    panel.setStatus("Membaca data halaman…");

    const raw = await extractWithRetry(id);
    if (!raw || id !== runId) return;
    try {
      const draft = await lib.buildDraft(raw, resolveViaBackground);
      if (id !== runId) return;
      await panel.load(draft);
    } catch (err) {
      panel.setStatus(`Gagal membaca halaman: ${err.message}`, "warn");
    }
  }

  // Popup can ask to (re)open the panel on this page.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "showPanel") {
      dismissedKey = "";
      lastKey = "";
      state.minimized = false;
      chrome.storage.local.set({ hangoutMinimized: false });
      onRoute();
    }
  });

  setInterval(onRoute, 700);
  onRoute();
})();
