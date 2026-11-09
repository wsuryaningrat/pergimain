import { buildDraft, extractFromPage, getAutoPanel, getBaseUrl, setAutoPanel, setBaseUrl } from "./lib.js";
import { mountPanel, resolveViaBackground } from "./panel.js";

const $ = (sel) => document.querySelector(sel);
const panel = mountPanel($("#panel-root"), { mode: "popup" });

async function initSettings() {
  $("#base-url").value = await getBaseUrl();
  $("#auto-panel").checked = await getAutoPanel();
  $("#toggle-settings").addEventListener("click", () => ($("#settings").hidden = !$("#settings").hidden));
  document.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => ($("#base-url").value = b.dataset.preset))
  );
  $("#save-settings").addEventListener("click", async () => {
    await setBaseUrl($("#base-url").value || "https://hangout.wsningrat.com");
    await setAutoPanel($("#auto-panel").checked);
    $("#settings").hidden = true;
    panel.setStatus(`Pengaturan disimpan. Tujuan: ${await getBaseUrl()}`, "ok");
  });
}

async function readActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || "")) {
    panel.setStatus("Buka post Instagram atau tempat di Google Maps — atau cari alamat/tempel link di kolom pencarian.");
    return;
  }
  const supported = /instagram\.com\/(p|reels?|tv)\/|google\.[a-z.]+\/maps\/place\//.test(tab.url);
  if (supported) {
    const btn = $("#show-panel");
    btn.hidden = false;
    btn.addEventListener("click", async () => {
      await chrome.tabs.sendMessage(tab.id, { type: "showPanel" }).catch(() => {});
      window.close();
    });
  }
  try {
    const [{ result: raw }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractFromPage });
    const draft = await buildDraft(raw, resolveViaBackground);
    await panel.load(draft);
  } catch (err) {
    panel.setStatus(`Tidak bisa membaca halaman ini (${err.message}). Isi manual atau cari alamat.`, "warn");
  }
}

initSettings();
readActiveTab();
