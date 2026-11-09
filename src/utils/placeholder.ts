import type { Category } from "../data/places";

// Gradient + emoji per category, used as a self-contained image when a place
// has no photo yet or its photo fails to load (e.g. Instagram CDN links that
// expire or block hotlinking).
const palette: Record<Category, { from: string; to: string; emoji: string }> = {
  cafe: { from: "#fde68a", to: "#d97706", emoji: "☕" },
  kuliner: { from: "#fecdd3", to: "#e11d48", emoji: "🍜" },
  wisata: { from: "#a7f3d0", to: "#059669", emoji: "🏞️" },
  nugas: { from: "#bae6fd", to: "#0284c7", emoji: "💻" },
  kampus: { from: "#c7d2fe", to: "#4f46e5", emoji: "🎓" },
  masjid: { from: "#99f6e4", to: "#0d9488", emoji: "🕌" },
};

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function placeholderImage(category: Category, name = ""): string {
  const { from, to, emoji } = palette[category] ?? palette.wisata;
  const label = escapeXml(name.length > 34 ? `${name.slice(0, 32)}…` : name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<text x="400" y="250" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
<text x="400" y="420" font-family="system-ui,sans-serif" font-size="34" font-weight="700" fill="white" text-anchor="middle">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** onError handler for <img>: swap to the category placeholder once. */
export function imageFallback(category: Category, name: string) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.src = placeholderImage(category, name);
  };
}
